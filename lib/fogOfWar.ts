// PROJECT BRINK - ADVANCED FOG OF WAR & LINE-OF-SIGHT SYSTEM
// Continuous 2D Vector Elevation Occlusion, Concealment, and Air Reconnaissance

import { FactionId, Unit, AirSortie, ControlNode, Airbase } from '@/app/page';
import { getTerrainAt } from './terrain';

export type FowPerspective = 'all' | 'loyalists' | 'rebels' | 'coalition' | 'volskan' | 'unified';

export interface VisionSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  isAirRecon?: boolean;
}

export interface ReconSweepZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  remainingDuration: number;
  factionId: FactionId;
}

// Compute vision radius for a ground unit based on its type and terrain elevation
export function getUnitVisionRange(unit: Unit): number {
  const terrain = getTerrainAt(unit.x, unit.y);

  let baseRange = 140;
  if (unit.type === 'armor') baseRange = 160;
  else if (unit.type === 'mechanized') baseRange = 170;
  else if (unit.type === 'infantry') baseRange = 135;
  else if (unit.type === 'artillery') baseRange = 130;
  else if (unit.type === 'sam') baseRange = 150;

  // Elevation bonus: +50% vision range when on hills
  if (terrain.type === 'HILLS') {
    return baseRange * 1.5;
  }
  // Dense forest reduces line of sight
  if (terrain.type === 'FOREST') {
    return baseRange * 0.7;
  }

  return baseRange;
}

// Check if a unit is currently concealed (dug in or stealth in forest / urban rubble)
export function isUnitConcealed(unit: Unit): boolean {
  if (unit.inCombat || unit.speed > 0.6) {
    return false; // firing or moving rapidly breaks stealth
  }
  const terrain = getTerrainAt(unit.x, unit.y);
  // Units in forest or urban cover or with high entrenchment are concealed
  return (
    terrain.type === 'FOREST' ||
    terrain.type === 'URBAN' ||
    (terrain.type === 'HILLS' && unit.entrenchment > 50)
  );
}

// Distance helper
function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Collect all vision circles for a given faction (including alliance/coalition coordination)
export function getFactionVisionSources(
  viewerFaction: FowPerspective,
  units: Unit[],
  airSorties: AirSortie[],
  nodes: ControlNode[],
  airbases: Airbase[],
  reconZones: ReconSweepZone[]
): VisionSource[] {
  const sources: VisionSource[] = [];

  // Determine which factions share intelligence with viewer
  const alliedFactions: FactionId[] =
    viewerFaction === 'all'
      ? ['loyalists', 'rebels', 'coalition', 'volskan', 'unified']
      : [viewerFaction];

  if (viewerFaction === 'loyalists') alliedFactions.push('coalition');
  if (viewerFaction === 'coalition') alliedFactions.push('loyalists');
  if (viewerFaction === 'rebels') alliedFactions.push('volskan');
  if (viewerFaction === 'volskan') alliedFactions.push('rebels');
  if (viewerFaction === 'unified') {
    alliedFactions.push('loyalists', 'rebels');
  }

  // 1. Friendly ground units
  for (const u of units) {
    if (alliedFactions.includes(u.factionId) && u.strength > 0) {
      sources.push({
        id: u.id,
        x: u.x,
        y: u.y,
        radius: getUnitVisionRange(u)
      });
    }
  }

  // 2. Air sorties (Jets have high aerial vantage; RECON missions have massive swath)
  for (const s of airSorties) {
    if (alliedFactions.includes(s.factionId) && s.status !== 'DESTROYED') {
      const isRecon = s.role === 'RECON';
      sources.push({
        id: s.id,
        x: s.x,
        y: s.y,
        radius: isRecon ? 380 : 250,
        isAirRecon: isRecon
      });
    }
  }

  // 3. Controlled bases and nodes
  for (const n of nodes) {
    if (alliedFactions.includes(n.owner)) {
      sources.push({
        id: n.id,
        x: n.x,
        y: n.y,
        radius: n.radius + 140
      });
    }
  }

  for (const ab of airbases) {
    if (alliedFactions.includes(ab.factionId)) {
      sources.push({
        id: ab.id,
        x: ab.x,
        y: ab.y,
        radius: 200
      });
    }
  }

  // 4. Temporary aerial reconnaissance sweep trails
  for (const r of reconZones) {
    if (alliedFactions.includes(r.factionId)) {
      sources.push({
        id: r.id,
        x: r.x,
        y: r.y,
        radius: r.radius,
        isAirRecon: true
      });
    }
  }

  return sources;
}

// Check if a target unit is detected by the viewer faction's vision sources
export function isUnitDetectedByFaction(
  targetUnit: Unit,
  viewerFaction: FowPerspective,
  sources: VisionSource[]
): boolean {
  // Spectator sees all units
  if (viewerFaction === 'all') return true;

  // Friendly units are always visible
  if (targetUnit.factionId === viewerFaction) return true;
  if (viewerFaction === 'loyalists' && targetUnit.factionId === 'coalition') return true;
  if (viewerFaction === 'coalition' && targetUnit.factionId === 'loyalists') return true;
  if (viewerFaction === 'rebels' && targetUnit.factionId === 'volskan') return true;
  if (viewerFaction === 'volskan' && targetUnit.factionId === 'rebels') return true;

  const concealed = isUnitConcealed(targetUnit);

  for (const src of sources) {
    const d = dist(src.x, src.y, targetUnit.x, targetUnit.y);

    if (src.isAirRecon) {
      // Air reconnaissance penetrates forest & urban camouflage
      if (d <= src.radius) {
        return true;
      }
    } else if (concealed) {
      // Concealed units require close proximity detection (e.g. 75px for infantry/patrols)
      const ambushDetectionRadius = 75;
      if (d <= ambushDetectionRadius) {
        return true;
      }
    } else {
      // Normal line of sight check
      if (d <= src.radius) {
        return true;
      }
    }
  }

  return false;
}
