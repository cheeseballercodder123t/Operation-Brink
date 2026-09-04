'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Upload,
  Radio,
  Crosshair,
  Shield,
  Plane,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  Cpu,
  Tv,
  AlertTriangle,
  Info,
  MapPin,
  RefreshCw,
  Eye,
  Award,
  Building2,
  Trees,
  Mountain,
  Droplets,
  Landmark,
  Handshake,
  DollarSign,
  Fuel,
  Users,
  Factory,
  Globe2,
  ShieldAlert,
  Radar,
  Globe,
  Coins,
  ShieldCheck
} from 'lucide-react';

import {
  TERRAIN_ZONES,
  getTerrainAt,
  TerrainType,
  TerrainZone
} from '@/lib/terrain';

import {
  FowPerspective,
  ReconSweepZone,
  getFactionVisionSources,
  isUnitDetectedByFaction,
  isUnitConcealed,
  getUnitVisionRange
} from '@/lib/fogOfWar';

import {
  DiplomaticLedger,
  createInitialDiplomacy,
  stepDiplomaticAI,
  getRelationKey,
  DiplomaticRelation
} from '@/lib/diplomacy';

import {
  EconomyState,
  createInitialEconomy,
  stepEconomy,
  UNIT_BUILD_COSTS,
  TradeRoute,
  ProductionQueueItem
} from '@/lib/economy';

/* =========================================================================
   TYPES & DATA MODELS
   ========================================================================= */

export type FactionId = 'loyalists' | 'rebels' | 'coalition' | 'volskan' | 'unified';
export type UnitType = 'armor' | 'infantry' | 'mechanized' | 'artillery' | 'sam';
export type AirRole = 'AIR_SUPERIORITY' | 'CAS' | 'INTERCEPTION' | 'INTERDICTION' | 'RECON';
export type Stance = 'OFFENSIVE_THRUST' | 'DEFENSIVE_HOLD' | 'FLANK_AMBUSH' | 'WITHDRAW_REFUEL';

export interface Unit {
  id: string;
  name: string;
  factionId: FactionId;
  type: UnitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number; // 0 to 360 degrees
  targetX: number;
  targetY: number;
  speed: number;
  maxSpeed: number;
  strength: number; // 0 to 100
  maxStrength: number;
  morale: number; // 0 to 100
  fuel: number; // 0 to 100
  entrenchment: number; // 0 to 100
  kills: number;
  inCombat: boolean;
  isRetreating: boolean;
  selected?: boolean;
  range: number;
  reloadTimer: number;
  lastFlanked?: boolean;
}

export interface Airbase {
  id: string;
  name: string;
  factionId: FactionId;
  x: number;
  y: number;
  runwayAngle: number;
  readyAircraft: number;
  totalCapacity: number;
}

export interface AirSortie {
  id: string;
  callsign: string;
  factionId: FactionId;
  role: AirRole;
  x: number;
  y: number;
  altitude: number; // 0 to 1000
  heading: number;
  speed: number;
  targetX: number;
  targetY: number;
  targetUnitId?: string;
  fuel: number;
  maxFuel: number;
  airbaseId: string;
  status: 'SCRAMBLING' | 'EN_ROUTE' | 'ON_STATION' | 'ATTACK_RUN' | 'RTB' | 'DESTROYED';
  trail: { x: number; y: number }[];
}

export interface SamMissile {
  id: string;
  factionId: FactionId;
  x: number;
  y: number;
  targetSortieId: string;
  speed: number;
  heading: number;
  life: number;
  trail: { x: number; y: number }[];
}

export interface ArtilleryShell {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  arcHeight: number;
  damage: number;
  factionId: FactionId;
}

export interface VisualEffect {
  id: string;
  type: 'EXPLOSION' | 'SMOKE' | 'NAPALM' | 'TRACER' | 'FLANK_ALERT';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  color: string;
  duration: number;
  elapsed: number;
  text?: string;
}

export interface Bridge {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDestroyed: boolean;
  health: number; // 0 to 100
}

export interface ControlNode {
  id: string;
  name: string;
  type: 'CAPITAL' | 'PORT' | 'REDOUT' | 'OIL_REFINERY' | 'DEPOT';
  x: number;
  y: number;
  radius: number;
  owner: FactionId;
  isVictoryNode: boolean;
  points: number;
}

export interface FactionInfo {
  id: FactionId;
  name: string;
  subTitle: string;
  color: string;
  lightColor: string;
  flagCode: string;
  treasury: number;
  fuelReserves: number;
  resolve: number;
  stance: Stance;
  activeDoctrine: string;
}

export interface Transmission {
  id: string;
  timestamp: string;
  factionId: FactionId;
  callsign: string;
  message: string;
  priority: 'ROUTINE' | 'HIGH' | 'FLASH';
}

/* =========================================================================
   AUDIO SYNTHESIZER (Web Audio API - Vintage 1960s Radio & Teletype)
   ========================================================================= */

class VintageSoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public playTeletype() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext locked or inactive
    }
  }

  public playArtillery() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Ignore
    }
  }

  public playJetFlyby() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(650, this.ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  }

  public playFlankAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.setValueAtTime(650, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  public playAlertSiren() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch {
      // Ignore
    }
  }
}

const audioSys = new VintageSoundSystem();

/* =========================================================================
   INITIAL DATA GENERATION
   ========================================================================= */

const FACTION_DEFINITIONS: Record<FactionId, FactionInfo> = {
  loyalists: {
    id: 'loyalists',
    name: 'San Pietro Loyalists',
    subTitle: 'Nationalist Junta (Heavy Armor & Fortress Capital)',
    color: '#3b82f6',
    lightColor: '#93c5fd',
    flagCode: 'SAN-LOYAL',
    treasury: 1450,
    fuelReserves: 780,
    resolve: 85,
    stance: 'DEFENSIVE_HOLD',
    activeDoctrine: 'CITADEL INTERIOR LINES'
  },
  rebels: {
    id: 'rebels',
    name: 'San Pietro Liberation Front',
    subTitle: 'People’s Front (Mountain Guerrillas & SAM Ambush)',
    color: '#ef4444',
    lightColor: '#fca5a5',
    flagCode: 'SAN-REBELS',
    treasury: 620,
    fuelReserves: 410,
    resolve: 92,
    stance: 'FLANK_AMBUSH',
    activeDoctrine: 'PROTRACTED GUERRILLA WARFARE'
  },
  coalition: {
    id: 'coalition',
    name: 'Atlantic Coalition',
    subTitle: 'Western Superpower (Carrier Aviation & Modern Jets)',
    color: '#06b6d4',
    lightColor: '#67e8f9',
    flagCode: 'ATL-TASKFORCE',
    treasury: 4800,
    fuelReserves: 2400,
    resolve: 76,
    stance: 'OFFENSIVE_THRUST',
    activeDoctrine: 'AIR-SEA FORWARD PROJECTION'
  },
  volskan: {
    id: 'volskan',
    name: 'Volskan Union',
    subTitle: 'Eastern Hegemon (Heavy Tube Artillery & Armored Brigades)',
    color: '#b91c1c',
    lightColor: '#f87171',
    flagCode: 'VOLSK-STAVKA',
    treasury: 3900,
    fuelReserves: 1950,
    resolve: 88,
    stance: 'OFFENSIVE_THRUST',
    activeDoctrine: 'DEEP BATTLE ARTILLERY OFFENSIVE'
  },
  unified: {
    id: 'unified',
    name: 'Republic of San Pietro Armed Forces',
    subTitle: 'Awakened Sovereign Industrial Superpower',
    color: '#eab308',
    lightColor: '#fef08a',
    flagCode: 'SAN-UNIFIED',
    treasury: 5200,
    fuelReserves: 3500,
    resolve: 100,
    stance: 'OFFENSIVE_THRUST',
    activeDoctrine: 'TOTAL NATIONAL EXPULSION MOBILIZATION'
  }
};

const INITIAL_BRIDGES: Bridge[] = [
  { id: 'bridge-1', name: 'Ironbridge North Span', x: 500, y: 190, width: 34, height: 18, isDestroyed: false, health: 100 },
  { id: 'bridge-2', name: 'Delta Highway Causeway', x: 545, y: 490, width: 38, height: 20, isDestroyed: false, health: 100 },
  { id: 'bridge-3', name: 'Sierra Gorge Viaduct', x: 495, y: 720, width: 32, height: 18, isDestroyed: false, health: 100 },
];

const INITIAL_CONTROL_NODES: ControlNode[] = [
  { id: 'node-capital', name: 'SANTA MARIA (CAPITAL)', type: 'CAPITAL', x: 780, y: 560, radius: 46, owner: 'loyalists', isVictoryNode: true, points: 50 },
  { id: 'node-port', name: 'PORT BELLA DEEPWATER DOCK', type: 'PORT', x: 920, y: 730, radius: 40, owner: 'loyalists', isVictoryNode: true, points: 35 },
  { id: 'node-mountain', name: 'MONTE ORO REDOUBT', type: 'REDOUT', x: 260, y: 170, radius: 42, owner: 'rebels', isVictoryNode: true, points: 40 },
  { id: 'node-oil', name: 'BLACK GOLD OIL REFINERY', type: 'OIL_REFINERY', x: 640, y: 340, radius: 38, owner: 'loyalists', isVictoryNode: true, points: 30 },
  { id: 'node-novaya', name: 'NOVAYA ADVANCED DEPOT', type: 'DEPOT', x: 1210, y: 240, radius: 34, owner: 'volskan', isVictoryNode: false, points: 20 },
  { id: 'node-vanguard', name: 'FORT VANGUARD BARRACKS', type: 'DEPOT', x: 840, y: 160, radius: 32, owner: 'loyalists', isVictoryNode: false, points: 20 },
];

const INITIAL_AIRBASES: Airbase[] = [
  { id: 'airbase-loyal', name: 'Santa Maria Airbase', factionId: 'loyalists', x: 860, y: 500, runwayAngle: 45, readyAircraft: 4, totalCapacity: 6 },
  { id: 'airbase-rebel', name: 'Sierra Hidden Mountain Strip', factionId: 'rebels', x: 190, y: 640, runwayAngle: 120, readyAircraft: 3, totalCapacity: 4 },
  { id: 'airbase-carrier', name: 'CV-63 USS Constitution (Carrier)', factionId: 'coalition', x: 100, y: 380, runwayAngle: 90, readyAircraft: 8, totalCapacity: 10 },
  { id: 'airbase-volskan', name: 'Krasny Forward Air Base', factionId: 'volskan', x: 1240, y: 110, runwayAngle: 210, readyAircraft: 6, totalCapacity: 8 },
];

function createInitialUnits(): Unit[] {
  return [
    // 1. San Pietro Loyalists
    {
      id: 'loy-arm-1',
      name: '1st "Centaur" Heavy Armored Bde',
      factionId: 'loyalists',
      type: 'armor',
      x: 710,
      y: 520,
      vx: 0,
      vy: 0,
      heading: 270,
      targetX: 580,
      targetY: 490,
      speed: 0.6,
      maxSpeed: 0.9,
      strength: 95,
      maxStrength: 100,
      morale: 88,
      fuel: 90,
      entrenchment: 40,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 85,
      reloadTimer: 0
    },
    {
      id: 'loy-inf-1',
      name: '4th Presidential Guard Inf',
      factionId: 'loyalists',
      type: 'infantry',
      x: 770,
      y: 580,
      vx: 0,
      vy: 0,
      heading: 260,
      targetX: 740,
      targetY: 570,
      speed: 0.4,
      maxSpeed: 0.6,
      strength: 100,
      maxStrength: 100,
      morale: 95,
      fuel: 85,
      entrenchment: 75,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 65,
      reloadTimer: 0
    },
    {
      id: 'loy-mech-1',
      name: '2nd Coastal Mechanized Reg',
      factionId: 'loyalists',
      type: 'mechanized',
      x: 880,
      y: 690,
      vx: 0,
      vy: 0,
      heading: 290,
      targetX: 800,
      targetY: 650,
      speed: 0.8,
      maxSpeed: 1.1,
      strength: 90,
      maxStrength: 100,
      morale: 80,
      fuel: 95,
      entrenchment: 20,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 75,
      reloadTimer: 0
    },
    {
      id: 'loy-art-1',
      name: '12th Fortress Heavy Battery',
      factionId: 'loyalists',
      type: 'artillery',
      x: 790,
      y: 470,
      vx: 0,
      vy: 0,
      heading: 280,
      targetX: 790,
      targetY: 470,
      speed: 0,
      maxSpeed: 0.4,
      strength: 85,
      maxStrength: 100,
      morale: 85,
      fuel: 70,
      entrenchment: 60,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 250,
      reloadTimer: 0
    },
    {
      id: 'loy-sam-1',
      name: 'Air Defense MIM-23 Hawk',
      factionId: 'loyalists',
      type: 'sam',
      x: 830,
      y: 540,
      vx: 0,
      vy: 0,
      heading: 270,
      targetX: 830,
      targetY: 540,
      speed: 0,
      maxSpeed: 0.5,
      strength: 80,
      maxStrength: 80,
      morale: 90,
      fuel: 80,
      entrenchment: 50,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 220,
      reloadTimer: 0
    },

    // 2. San Pietro Liberation Front (Rebels)
    {
      id: 'reb-inf-1',
      name: '7th Sierra Redoubt Guerrillas',
      factionId: 'rebels',
      type: 'infantry',
      x: 270,
      y: 210,
      vx: 0,
      vy: 0,
      heading: 90,
      targetX: 430,
      targetY: 210,
      speed: 0.5,
      maxSpeed: 0.7,
      strength: 90,
      maxStrength: 100,
      morale: 98,
      fuel: 75,
      entrenchment: 65,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 65,
      reloadTimer: 0
    },
    {
      id: 'reb-inf-2',
      name: 'Che Guevara Vanguard Cadre',
      factionId: 'rebels',
      type: 'infantry',
      x: 250,
      y: 530,
      vx: 0,
      vy: 0,
      heading: 80,
      targetX: 460,
      targetY: 500,
      speed: 0.5,
      maxSpeed: 0.7,
      strength: 92,
      maxStrength: 100,
      morale: 94,
      fuel: 70,
      entrenchment: 55,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 65,
      reloadTimer: 0
    },
    {
      id: 'reb-sam-1',
      name: 'Mobile SA-2 Guideline Battery',
      factionId: 'rebels',
      type: 'sam',
      x: 220,
      y: 470,
      vx: 0,
      vy: 0,
      heading: 75,
      targetX: 340,
      targetY: 460,
      speed: 0.3,
      maxSpeed: 0.5,
      strength: 75,
      maxStrength: 75,
      morale: 90,
      fuel: 65,
      entrenchment: 40,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 240,
      reloadTimer: 0
    },
    {
      id: 'reb-arm-1',
      name: 'Captured M48 "Liberator" Armor',
      factionId: 'rebels',
      type: 'armor',
      x: 310,
      y: 610,
      vx: 0,
      vy: 0,
      heading: 60,
      targetX: 470,
      targetY: 560,
      speed: 0.6,
      maxSpeed: 0.8,
      strength: 80,
      maxStrength: 100,
      morale: 85,
      fuel: 60,
      entrenchment: 20,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 80,
      reloadTimer: 0
    },

    // 3. Atlantic Coalition
    {
      id: 'coa-mech-1',
      name: 'Task Force Yankee Marine Mech',
      factionId: 'coalition',
      type: 'mechanized',
      x: 830,
      y: 770,
      vx: 0,
      vy: 0,
      heading: 320,
      targetX: 780,
      targetY: 690,
      speed: 0.8,
      maxSpeed: 1.1,
      strength: 100,
      maxStrength: 100,
      morale: 95,
      fuel: 100,
      entrenchment: 30,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 85,
      reloadTimer: 0
    },
    {
      id: 'coa-arm-1',
      name: '1st Armored Div "Old Ironsides"',
      factionId: 'coalition',
      type: 'armor',
      x: 910,
      y: 660,
      vx: 0,
      vy: 0,
      heading: 300,
      targetX: 820,
      targetY: 600,
      speed: 0.7,
      maxSpeed: 1.0,
      strength: 100,
      maxStrength: 100,
      morale: 90,
      fuel: 95,
      entrenchment: 25,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 90,
      reloadTimer: 0
    },

    // 4. Volskan Union
    {
      id: 'vol-arm-1',
      name: '4th Guards Volunteer Tank Div',
      factionId: 'volskan',
      type: 'armor',
      x: 1140,
      y: 280,
      vx: 0,
      vy: 0,
      heading: 220,
      targetX: 740,
      targetY: 340,
      speed: 0.7,
      maxSpeed: 0.95,
      strength: 100,
      maxStrength: 100,
      morale: 95,
      fuel: 90,
      entrenchment: 30,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 85,
      reloadTimer: 0
    },
    {
      id: 'vol-art-1',
      name: '68th Heavy Howitzer Reg (152mm)',
      factionId: 'volskan',
      type: 'artillery',
      x: 1190,
      y: 210,
      vx: 0,
      vy: 0,
      heading: 230,
      targetX: 1190,
      targetY: 210,
      speed: 0,
      maxSpeed: 0.4,
      strength: 95,
      maxStrength: 100,
      morale: 92,
      fuel: 85,
      entrenchment: 70,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 270,
      reloadTimer: 0
    },
    {
      id: 'vol-mech-1',
      name: '12th Motor Rifle Brigade',
      factionId: 'volskan',
      type: 'mechanized',
      x: 1060,
      y: 350,
      vx: 0,
      vy: 0,
      heading: 235,
      targetX: 680,
      targetY: 360,
      speed: 0.8,
      maxSpeed: 1.05,
      strength: 95,
      maxStrength: 100,
      morale: 88,
      fuel: 90,
      entrenchment: 20,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: 80,
      reloadTimer: 0
    }
  ];
}

/* =========================================================================
   SIMULATION ENGINE HELPERS
   ========================================================================= */

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

// Check point in polygon for mountain ranges
function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const SIERRA_RANGE_POLY: [number, number][] = [
  [120, 480],
  [330, 430],
  [410, 560],
  [370, 710],
  [210, 730],
  [110, 640]
];

const MONTE_ORO_POLY: [number, number][] = [
  [180, 80],
  [360, 60],
  [400, 190],
  [250, 240],
  [150, 170]
];

export default function ProjectBrinkApp() {
  // Simulator state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simTick, setSimTick] = useState<number>(0);
  const [simHour, setSimHour] = useState<number>(6);
  const [simMinute, setSimMinute] = useState<number>(30);
  const [defcon, setDefcon] = useState<number>(3);
  const [activeProvider, setActiveProvider] = useState<string>('GEMINI-3.8-FLASH [ACTIVE]');
  const [isAiQuerying, setIsAiQuerying] = useState<boolean>(false);
  const [crtTheme, setCrtTheme] = useState<'amber' | 'green'>('green');
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showOverlays, setShowOverlays] = useState({
    flankingArcs: true,
    ranges: true,
    airFlightPaths: true,
    samEnvelopes: true,
    contourLines: true,
    terrainZones: true,
    fogOfWar: true
  });

  // Fog of War & Reconnaissance States
  const [fowPerspective, setFowPerspective] = useState<FowPerspective>('all');
  const [reconSweepZones, setReconSweepZones] = useState<ReconSweepZone[]>([]);

  // Diplomatic & Economic Simulation Modules
  const [diplomaticLedger, setDiplomaticLedger] = useState<DiplomaticLedger>(createInitialDiplomacy);
  const [economyState, setEconomyState] = useState<EconomyState>(createInitialEconomy);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'diplomacy' | 'economy' | 'terrain'>('telemetry');

  // Entities
  const [units, setUnits] = useState<Unit[]>(createInitialUnits);
  const [airSorties, setAirSorties] = useState<AirSortie[]>([]);
  const [samMissiles, setSamMissiles] = useState<SamMissile[]>([]);
  const [artilleryShells, setArtilleryShells] = useState<ArtilleryShell[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [bridges, setBridges] = useState<Bridge[]>(INITIAL_BRIDGES);
  const [controlNodes, setControlNodes] = useState<ControlNode[]>(INITIAL_CONTROL_NODES);
  const [airbases, setAirbases] = useState<Airbase[]>(INITIAL_AIRBASES);
  const [factions, setFactions] = useState<Record<FactionId, FactionInfo>>(FACTION_DEFINITIONS);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAirbaseId, setSelectedAirbaseId] = useState<string | null>(null);

  // Unification Event
  const [unifiedState, setUnifiedState] = useState<boolean>(false);
  const [unificationBanner, setUnificationBanner] = useState<string | null>(null);

  // Radio Intercepts & Intelligence
  const [transmissions, setTransmissions] = useState<Transmission[]>([
    {
      id: 'tx-01',
      timestamp: '06:14:02Z',
      factionId: 'loyalists',
      callsign: 'CITADEL LOGISTICS',
      message: 'ALL STATIONS: BLACK GOLD REFINERY PUMPING AT 100% CAPACITY. 1ST ARMOR REFUELED FOR PATROL.',
      priority: 'ROUTINE'
    },
    {
      id: 'tx-02',
      timestamp: '06:18:45Z',
      factionId: 'rebels',
      callsign: 'SIERRA HIGH REDOUBT',
      message: 'SA-2 BATTERY RADAR ACTIVE. CONCEAL VEHICLES UNDER FOREST CANOPY. PREPARE FLANKING TRAP.',
      priority: 'HIGH'
    },
    {
      id: 'tx-03',
      timestamp: '06:22:11Z',
      factionId: 'coalition',
      callsign: 'USS CONSTITUTION RADAR',
      message: 'AIR GROUP SEVEN: F-4 COMBAT AIR PATROL SCRAMBLED OVER DELTA BASIN. INTERCEPT HOSTILE BOGEYS.',
      priority: 'ROUTINE'
    },
    {
      id: 'tx-04',
      timestamp: '06:27:30Z',
      factionId: 'volskan',
      callsign: 'VOLSKAN 5TH ADVISORY',
      message: 'COMRADE VORONOV ORDERS 152MM BATTERIES TO ZERO SIGHTS ON WEST RIVER BANK. STAND BY FOR DIRECTIVE.',
      priority: 'FLASH'
    }
  ]);

  const [lastDoctrineTitle, setLastDoctrineTitle] = useState<string>('OPERATION IRON SHIELD');
  const [geopoliticalAssessment, setGeopoliticalAssessment] = useState<string>(
    'Cold War standoff remains critical along the central river barrier. Clashes reported near Delta Bridge.'
  );

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const queryTimerRef = useRef<number>(0);

  // Audio mute sync
  useEffect(() => {
    audioSys.enabled = soundEnabled;
  }, [soundEnabled]);

  /* =========================================================================
     AIR SORTIE SCRAMBLE HELPER
     ========================================================================= */
  const scrambleAirSortie = useCallback((factionId: FactionId, role: AirRole) => {
    const base = airbases.find(b => b.factionId === factionId && b.readyAircraft > 0);
    if (!base) return;

    // Pick target based on role
    let targetX = 640;
    let targetY = 360;

    if (role === 'INTERDICTION') {
      const targetBridge = bridges.find(b => !b.isDestroyed) || bridges[1];
      targetX = targetBridge.x;
      targetY = targetBridge.y;
    } else if (role === 'CAS') {
      const enemyUnits = units.filter(u => u.factionId !== factionId);
      if (enemyUnits.length > 0) {
        const randTarget = enemyUnits[Math.floor(Math.random() * enemyUnits.length)];
        targetX = randTarget.x;
        targetY = randTarget.y;
      }
    } else if (role === 'AIR_SUPERIORITY') {
      targetX = 540 + (Math.random() * 200 - 100);
      targetY = 400 + (Math.random() * 200 - 100);
    } else if (role === 'RECON') {
      targetX = factionId === 'loyalists' ? 260 : 780;
      targetY = factionId === 'loyalists' ? 200 : 560;
    } else if (role === 'INTERCEPTION') {
      const hostiles = airSorties.filter(s => s.factionId !== factionId);
      if (hostiles.length > 0) {
        targetX = hostiles[0].x;
        targetY = hostiles[0].y;
      }
    }

    const newSortie: AirSortie = {
      id: `sortie-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      callsign: `${base.factionId.toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 90)}`,
      factionId,
      role,
      x: base.x,
      y: base.y,
      altitude: 100,
      heading: base.runwayAngle,
      speed: 2.2,
      targetX,
      targetY,
      fuel: 100,
      maxFuel: 100,
      airbaseId: base.id,
      status: 'SCRAMBLING',
      trail: [{ x: base.x, y: base.y }]
    };

    setAirSorties(prev => [...prev, newSortie]);
    setAirbases(prev =>
      prev.map(b => (b.id === base.id ? { ...b, readyAircraft: Math.max(0, b.readyAircraft - 1) } : b))
    );

    audioSys.playJetFlyby();
  }, [airbases, airSorties, bridges, units]);

  /* =========================================================================
     ECONOMIC WAR PRODUCTION REINFORCEMENT SPAWN
     ========================================================================= */
  const spawnReinforcement = useCallback((factionId: FactionId, type: UnitType, name: string) => {
    // Determine spawn coordinate near capital / base
    let spawnX = 640;
    let spawnY = 420;

    const base = airbases.find(b => b.factionId === factionId);
    if (base) {
      spawnX = base.x + (Math.random() * 40 - 20);
      spawnY = base.y + (Math.random() * 40 - 20);
    } else {
      const ownedNode = controlNodes.find(n => n.owner === factionId);
      if (ownedNode) {
        spawnX = ownedNode.x + (Math.random() * 40 - 20);
        spawnY = ownedNode.y + (Math.random() * 40 - 20);
      } else {
        spawnX = factionId === 'loyalists' ? 240 : factionId === 'rebels' ? 1040 : factionId === 'coalition' ? 150 : 1150;
        spawnY = factionId === 'loyalists' ? 220 : factionId === 'rebels' ? 620 : factionId === 'coalition' ? 700 : 120;
      }
    }

    const newUnit: Unit = {
      id: `reinf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${Math.floor(Math.random() * 10000)}`,
      name,
      factionId,
      type,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      heading: factionId === 'loyalists' || factionId === 'coalition' ? 110 : 290,
      targetX: 640 + (Math.random() * 140 - 70),
      targetY: 420 + (Math.random() * 140 - 70),
      speed: 0.6,
      maxSpeed: type === 'armor' ? 0.9 : type === 'mechanized' ? 1.05 : 0.65,
      strength: 100,
      maxStrength: 100,
      morale: 95,
      fuel: 100,
      entrenchment: 35,
      kills: 0,
      inCombat: false,
      isRetreating: false,
      range: type === 'artillery' ? 260 : type === 'sam' ? 220 : 85,
      reloadTimer: 0
    };

    setUnits(prev => [...prev, newUnit]);

    setTransmissions(prev => [
      {
        id: `tx-spawn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${Math.floor(Math.random() * 10000)}`,
        timestamp: `${String(simHour).padStart(2, '0')}:${String(Math.floor(simMinute)).padStart(2, '0')}:15Z`,
        factionId,
        callsign: 'WAR PRODUCTION BOARD',
        message: `REINFORCEMENT COMMISSIONED: ${name} deployed to front lines from sector [${Math.round(spawnX)}, ${Math.round(spawnY)}].`,
        priority: 'ROUTINE'
      },
      ...prev
    ]);
  }, [airbases, controlNodes, simHour, simMinute]);

  /* =========================================================================
     CIVIL WAR UNIFICATION TRIGGER HANDLER
     ========================================================================= */
  const triggerUnification = useCallback((victor: string) => {
    setUnifiedState(true);
    setDefcon(1);

    const alertMsg = `SAN PIETRO UNIFICATION TRIGGERED: ${victor} has consolidated sovereign victory nodes. The San Pietro Armed Forces have united as an Awakened Industrial Superpower. Foreign expeditionary forces are ordered to evacuate immediately!`;
    setUnificationBanner(alertMsg);
    audioSys.playAlertSiren();

    setUnits(prev =>
      prev.map(u => {
        if (u.factionId === 'loyalists' || u.factionId === 'rebels') {
          return {
            ...u,
            factionId: 'unified',
            strength: Math.min(100, u.strength + 20),
            morale: 100,
            fuel: 100
          };
        }
        return u;
      })
    );

    setControlNodes(prev =>
      prev.map(n => {
        if (n.owner === 'loyalists' || n.owner === 'rebels') {
          return { ...n, owner: 'unified' };
        }
        return n;
      })
    );

    setTransmissions(prev => [
      {
        id: `tx-unify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: `${String(simHour).padStart(2, '0')}:${String(simMinute).padStart(2, '0')}:00Z`,
        factionId: 'unified',
        callsign: 'REPUBLIC OF SAN PIETRO BROADCAST',
        message:
          'ATTENTION ATLANTIC & VOLSKAN FORCES: ALL TERRITORIAL AIRSPACE AND PORTS ARE NOW UNDER SOVEREIGN SAN PIETRO CONTROL. STAND DOWN OR BE TARGETED.',
        priority: 'FLASH'
      },
      ...prev
    ]);
  }, [simHour, simMinute]);

  const unifiedStateRef = useRef(unifiedState);
  useEffect(() => {
    unifiedStateRef.current = unifiedState;
  }, [unifiedState]);

  const triggerUnificationRef = useRef(triggerUnification);
  useEffect(() => {
    triggerUnificationRef.current = triggerUnification;
  }, [triggerUnification]);

  /* =========================================================================
     MULTI-PROVIDER AI ORCHESTRATION & FALLBACK QUERY
     ========================================================================= */
  const queryAiCommander = useCallback(async () => {
    if (isAiQuerying) return;
    setIsAiQuerying(true);

    try {
      const summary = {
        simTick,
        simTime: `${String(simHour).padStart(2, '0')}:${String(simMinute).padStart(2, '0')} HRS, OCT 1963`,
        defcon,
        factions: Object.values(factions).map(f => ({
          id: f.id,
          name: f.name,
          unitsCount: units.filter(u => u.factionId === f.id).length,
          totalStrength: units.filter(u => u.factionId === f.id).reduce((acc, u) => acc + u.strength, 0),
          fuelReserves: f.fuelReserves,
          controlledNodes: controlNodes.filter(n => n.owner === f.id).map(n => n.name)
        })),
        activeAirSorties: airSorties.map(s => ({
          factionId: s.factionId,
          role: s.role,
          targetDesc: `Sector [${Math.round(s.targetX)}, ${Math.round(s.targetY)}]`
        })),
        recentIncidents: [
          `DEFCON level: ${defcon}`,
          bridges.find(b => b.isDestroyed) ? 'Warning: Delta River bridge destroyed!' : 'All river bridges operational',
          unifiedState ? 'San Pietro is fully unified against foreign interventionists' : 'San Pietro civil war ongoing'
        ],
        unifiedState
      };

      const res = await fetch('/api/commander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battlefield: summary })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.provider) {
          setActiveProvider(data.provider);
        }
        if (data.doctrineTitle) {
          setLastDoctrineTitle(data.doctrineTitle);
        }
        if (data.geopoliticalAssessment) {
          setGeopoliticalAssessment(data.geopoliticalAssessment);
        }

        // Add incoming radio intercepts
        if (Array.isArray(data.transmissions) && data.transmissions.length > 0) {
          const newTx: Transmission[] = data.transmissions.map((t: { factionId: FactionId; callsign: string; message: string; priority?: 'ROUTINE' | 'HIGH' | 'FLASH' }, idx: number) => ({
            id: `ai-tx-${Date.now()}-${idx}`,
            timestamp: `${String(simHour).padStart(2, '0')}:${String(simMinute).padStart(2, '0')}:${Math.floor(Math.random() * 60)}Z`,
            factionId: t.factionId || 'loyalists',
            callsign: t.callsign || 'HQ DISPATCH',
            message: t.message || 'STATUS NORMAL.',
            priority: t.priority || 'ROUTINE'
          }));

          setTransmissions(prev => [...newTx, ...prev].slice(0, 30));
          audioSys.playTeletype();
        }

        // Apply ground stances
        if (Array.isArray(data.groundDirectives)) {
          setFactions(prev => {
            const next = { ...prev };
            data.groundDirectives.forEach((gd: { factionId: FactionId; stance: Stance }) => {
              if (next[gd.factionId]) {
                next[gd.factionId].stance = gd.stance;
              }
            });
            return next;
          });
        }

        // Scramble air sorties based on AI directives
        if (Array.isArray(data.airDirectives)) {
          data.airDirectives.slice(0, 2).forEach((ad: { factionId: FactionId; role: AirRole; targetSector: string }) => {
            scrambleAirSortie(ad.factionId, ad.role);
          });
        }
      }
    } catch (err) {
      console.warn('AI Commander query failed, falling back to heuristic engine:', err);
      setActiveProvider('ALGORITHMIC COMMAND ENGINE (OFFLINE FALLBACK)');
    } finally {
      setIsAiQuerying(false);
    }
  }, [airSorties, bridges, controlNodes, defcon, factions, isAiQuerying, scrambleAirSortie, simHour, simMinute, simTick, unifiedState, units]);

  /* =========================================================================
     MAIN SIMULATION TICK & UPDATE LOOP
     ========================================================================= */
  useEffect(() => {
    let lastTime = performance.now();

    const updateSimulation = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1) * simSpeed;
      lastTime = currentTime;

      if (isPlaying && dt > 0) {
        // Increment simulation clock
        setSimTick(t => t + 1);
        queryTimerRef.current += dt;

        // Auto query AI every 18 simulation seconds
        if (queryTimerRef.current >= 18) {
          queryTimerRef.current = 0;
          queryAiCommander();
        }

        // Update clock hours/minutes
        setSimMinute(m => {
          const next = m + dt * 0.4;
          if (next >= 60) {
            setSimHour(h => (h + 1) % 24);
            return 0;
          }
          return next;
        });

        // 1. UPDATE GROUND UNITS
        setUnits(prevUnits => {
          const updated = prevUnits.map(unit => {
            const u = { ...unit };

            // Find nearest enemy
            let closestEnemy: Unit | null = null;
            let minDist = Infinity;

            for (const other of prevUnits) {
              if (other.id !== u.id && other.factionId !== u.factionId && other.strength > 0) {
                // If unified, only foreign powers are enemies
                if (u.factionId === 'unified' && (other.factionId === 'loyalists' || other.factionId === 'rebels')) {
                  continue;
                }
                const d = distance(u.x, u.y, other.x, other.y);
                if (d < minDist) {
                  minDist = d;
                  closestEnemy = other;
                }
              }
            }

            // Dynamic Terrain calculation
            const terrainInfo = getTerrainAt(u.x, u.y, bridges);
            let speedMultiplier = 1.0;
            let fuelDrainMultiplier = 1.0;

            if (terrainInfo.isRiver) {
              speedMultiplier = 0.15; // severe fording penalty
              fuelDrainMultiplier = 2.0;
            } else if (terrainInfo.zone) {
              // Apply terrain zone movement penalty
              const penalty = terrainInfo.zone.movementPenalty[u.type] ?? 1.0;
              speedMultiplier = penalty;
              if (terrainInfo.type === 'MUD') {
                fuelDrainMultiplier = 1.25; // 25% higher fuel drain in deep mud
              }
            }

            // Fuel depletion
            if (u.fuel > 0 && (u.vx !== 0 || u.vy !== 0)) {
              u.fuel = Math.max(0, u.fuel - dt * 0.15 * fuelDrainMultiplier);
            }
            if (u.fuel <= 0) {
              speedMultiplier = 0; // Immobilized out of fuel!
            }

            // Flanking & Combat
            u.inCombat = false;
            u.lastFlanked = false;

            if (closestEnemy && minDist <= u.range && u.fuel > 0 && u.strength > 0) {
              u.inCombat = true;
              u.reloadTimer = (u.reloadTimer || 0) + dt;

              // Rotate toward enemy
              const targetAngle = (Math.atan2(closestEnemy.y - u.y, closestEnemy.x - u.x) * 180) / Math.PI;
              const diff = normalizeAngle(targetAngle - u.heading);
              if (diff > 180) {
                u.heading = normalizeAngle(u.heading - 45 * dt);
              } else {
                u.heading = normalizeAngle(u.heading + 45 * dt);
              }

              // Fire salvo every 1.5s
              if (u.reloadTimer >= 1.5) {
                u.reloadTimer = 0;

                // Check flanking angle on closestEnemy
                // Enemy heading vs vector of incoming attack (from u to closestEnemy)
                const incomingVectorAngle = (Math.atan2(u.y - closestEnemy.y, u.x - closestEnemy.x) * 180) / Math.PI;
                const angleDiff = Math.abs(normalizeAngle(incomingVectorAngle - closestEnemy.heading));
                const relativeAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;

                let damageMultiplier = 1.0;
                let isFlankStrike = false;

                if (relativeAngle <= 45) {
                  damageMultiplier = 0.7; // Frontal armor defense
                } else if (relativeAngle > 45 && relativeAngle <= 90) {
                  damageMultiplier = 1.1; // Oblique
                } else if (relativeAngle > 90 && relativeAngle <= 135) {
                  damageMultiplier = 1.8; // FLANK
                  isFlankStrike = true;
                } else {
                  damageMultiplier = 2.4; // REAR AMBUSH
                  isFlankStrike = true;
                }

                // Dynamic Terrain Combat Modifiers:
                // Attacker modifier (e.g. +1 / +25% combat bonus to infantry in forests)
                const attackerTerrain = getTerrainAt(u.x, u.y, bridges);
                const terrainAtkMod = attackerTerrain.zone?.attackModifier[u.type] ?? 1.0;

                // Defender modifier (e.g. +2 / -40% damage defensive bonus in hills and urban cover)
                const defenderTerrain = getTerrainAt(closestEnemy.x, closestEnemy.y, bridges);
                const terrainDefMod = defenderTerrain.zone?.defenseModifier[closestEnemy.type] ?? 1.0;

                const baseDamage = u.type === 'armor' ? 14 : u.type === 'mechanized' ? 10 : 7;
                const totalDamage = baseDamage * damageMultiplier * terrainAtkMod * terrainDefMod * (u.strength / 100);

                closestEnemy.strength = Math.max(0, closestEnemy.strength - totalDamage);
                closestEnemy.morale = Math.max(0, closestEnemy.morale - (isFlankStrike ? 12 : 4));

                if (isFlankStrike) {
                  closestEnemy.lastFlanked = true;
                  audioSys.playFlankAlarm();
                }

                if (closestEnemy.strength <= 0) {
                  u.kills += 1;
                }
              }
            } else if (!u.inCombat && u.fuel > 0 && u.strength > 0) {
              // Movement toward target vector
              const distToTarget = distance(u.x, u.y, u.targetX, u.targetY);
              if (distToTarget > 12) {
                const moveAngle = (Math.atan2(u.targetY - u.y, u.targetX - u.x) * 180) / Math.PI;
                u.heading = moveAngle;
                const curSpeed = u.maxSpeed * speedMultiplier * 20;
                u.vx = Math.cos((moveAngle * Math.PI) / 180) * curSpeed;
                u.vy = Math.sin((moveAngle * Math.PI) / 180) * curSpeed;
                u.x += u.vx * dt;
                u.y += u.vy * dt;
                u.entrenchment = Math.max(0, u.entrenchment - dt * 5);
              } else {
                u.vx = 0;
                u.vy = 0;
                // Faster entrenchment in urban or forest cover
                const entrenchRate = terrainInfo.type === 'URBAN' || terrainInfo.type === 'FOREST' ? 4.5 : 3.0;
                u.entrenchment = Math.min(100, u.entrenchment + dt * entrenchRate);
              }
            }

            // Artillery behavior
            if (u.type === 'artillery' && u.strength > 0) {
              u.reloadTimer = (u.reloadTimer || 0) + dt;
              if (u.reloadTimer >= 4.0 && closestEnemy && minDist <= u.range && minDist >= 60) {
                u.reloadTimer = 0;
                // Launch shell
                setArtilleryShells(prevShells => [
                  ...prevShells,
                  {
                    id: `shell-${Date.now()}-${Math.random()}`,
                    startX: u.x,
                    startY: u.y,
                    x: u.x,
                    y: u.y,
                    targetX: closestEnemy ? closestEnemy.x + (Math.random() * 20 - 10) : u.x,
                    targetY: closestEnemy ? closestEnemy.y + (Math.random() * 20 - 10) : u.y,
                    progress: 0,
                    arcHeight: 50,
                    damage: 22,
                    factionId: u.factionId
                  }
                ]);
                audioSys.playArtillery();
              }
            }

            return u;
          });

          return updated.filter(u => u.strength > 0);
        });

        // 2. UPDATE ARTILLERY SHELLS
        setArtilleryShells(prev => {
          const next: ArtilleryShell[] = [];
          for (const s of prev) {
            s.progress += dt * 1.2;
            s.x = s.startX + (s.targetX - s.startX) * s.progress;
            s.y = s.startY + (s.targetY - s.startY) * s.progress;

            if (s.progress >= 1.0) {
              // Impact explosion
              setVisualEffects(v => [
                ...v,
                {
                  id: `v-shell-${Date.now()}-${Math.random()}`,
                  type: 'EXPLOSION',
                  x: s.targetX,
                  y: s.targetY,
                  radius: 28,
                  color: '#fbbf24',
                  duration: 0.6,
                  elapsed: 0
                }
              ]);

              // Damage units in splash radius
              setUnits(currUnits =>
                currUnits.map(targetUnit => {
                  const d = distance(targetUnit.x, targetUnit.y, s.targetX, s.targetY);
                  if (d < 35 && targetUnit.factionId !== s.factionId) {
                    return {
                      ...targetUnit,
                      strength: Math.max(0, targetUnit.strength - s.damage),
                      morale: Math.max(0, targetUnit.morale - 15)
                    };
                  }
                  return targetUnit;
                })
              );
            } else {
              next.push(s);
            }
          }
          return next;
        });

        // 3. UPDATE AIR SORTIES
        setAirSorties(prevSorties => {
          const nextSorties: AirSortie[] = [];

          for (const sortie of prevSorties) {
            const s = { ...sortie };
            s.fuel = Math.max(0, s.fuel - dt * 2.5);

            // Vector movement
            const dist = distance(s.x, s.y, s.targetX, s.targetY);
            const targetAngle = (Math.atan2(s.targetY - s.y, s.targetX - s.x) * 180) / Math.PI;
            s.heading = targetAngle;

            const speedPixels = s.speed * 45;
            s.x += Math.cos((s.heading * Math.PI) / 180) * speedPixels * dt;
            s.y += Math.sin((s.heading * Math.PI) / 180) * speedPixels * dt;

            // Maintain contrail
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 18) s.trail.shift();

            // Active Reconnaissance mission clears fog of war dynamically
            if (s.role === 'RECON') {
              setReconSweepZones(prevSweeps => {
                const filtered = prevSweeps.filter(sw => sw.id !== `sweep-${s.id}`);
                return [
                  ...filtered,
                  {
                    id: `sweep-${s.id}`,
                    x: s.x,
                    y: s.y,
                    radius: 380, // wide aerial reconnaissance scan
                    remainingDuration: 18, // reveals map for 18 seconds
                    factionId: s.factionId
                  }
                ];
              });
            }

            // Check mission actions
            if (dist < 30 && s.status !== 'RTB') {
              if (s.role === 'CAS') {
                // Drop napalm
                setVisualEffects(v => [
                  ...v,
                  {
                    id: `cas-napalm-${Date.now()}-${Math.random()}`,
                    type: 'NAPALM',
                    x: s.x,
                    y: s.y,
                    radius: 36,
                    color: '#f97316',
                    duration: 2.5,
                    elapsed: 0
                  }
                ]);
                audioSys.playArtillery();

                // Damage enemy ground units nearby
                setUnits(currUnits =>
                  currUnits.map(u => {
                    if (u.factionId !== s.factionId && distance(u.x, u.y, s.x, s.y) < 45) {
                      return {
                        ...u,
                        strength: Math.max(0, u.strength - 22),
                        morale: Math.max(0, u.morale - 25)
                      };
                    }
                    return u;
                  })
                );

                s.status = 'RTB';
                const base = airbases.find(b => b.id === s.airbaseId);
                if (base) {
                  s.targetX = base.x;
                  s.targetY = base.y;
                }
              } else if (s.role === 'INTERDICTION') {
                // Bomb bridge or refinery
                setBridges(currBridges =>
                  currBridges.map(b => {
                    if (distance(b.x, b.y, s.x, s.y) < 40) {
                      const newHealth = Math.max(0, b.health - 55);
                      return {
                        ...b,
                        health: newHealth,
                        isDestroyed: newHealth <= 0
                      };
                    }
                    return b;
                  })
                );

                setVisualEffects(v => [
                  ...v,
                  {
                    id: `bomb-${Date.now()}-${Math.random()}`,
                    type: 'EXPLOSION',
                    x: s.x,
                    y: s.y,
                    radius: 40,
                    color: '#ef4444',
                    duration: 1.2,
                    elapsed: 0
                  }
                ]);

                s.status = 'RTB';
                const base = airbases.find(b => b.id === s.airbaseId);
                if (base) {
                  s.targetX = base.x;
                  s.targetY = base.y;
                }
              } else {
                // Recon or patrol reached destination sector, turn back to refuel
                s.status = 'RTB';
                const base = airbases.find(b => b.id === s.airbaseId);
                if (base) {
                  s.targetX = base.x;
                  s.targetY = base.y;
                }
              }
            }

            // RTB Arrival
            const distToBase = airbases.find(b => b.id === s.airbaseId)
              ? distance(s.x, s.y, airbases.find(b => b.id === s.airbaseId)!.x, airbases.find(b => b.id === s.airbaseId)!.y)
              : Infinity;

            if (s.status === 'RTB' && distToBase < 20) {
              setAirbases(abList =>
                abList.map(ab => (ab.id === s.airbaseId ? { ...ab, readyAircraft: Math.min(ab.totalCapacity, ab.readyAircraft + 1) } : ab))
              );
              continue; // sortie completed
            }

            // SAM Air Defense Interception Trigger
            if (s.status !== 'DESTROYED') {
              for (const u of units) {
                if (u.type === 'sam' && u.factionId !== s.factionId && u.strength > 0) {
                  const samDist = distance(u.x, u.y, s.x, s.y);
                  if (samDist <= u.range && Math.random() < 0.02 * dt) {
                    setSamMissiles(mList => [
                      ...mList,
                      {
                        id: `sam-${Date.now()}-${Math.random()}`,
                        factionId: u.factionId,
                        x: u.x,
                        y: u.y,
                        targetSortieId: s.id,
                        speed: 3.5,
                        heading: (Math.atan2(s.y - u.y, s.x - u.x) * 180) / Math.PI,
                        life: 3.0,
                        trail: [{ x: u.x, y: u.y }]
                      }
                    ]);
                  }
                }
              }
            }

            if (s.fuel > 0) {
              nextSorties.push(s);
            }
          }

          return nextSorties;
        });

        // 4. UPDATE SAM MISSILES
        setSamMissiles(prevMissiles => {
          const nextMissiles: SamMissile[] = [];

          for (const m of prevMissiles) {
            m.life -= dt;
            const targetSortie = airSorties.find(s => s.id === m.targetSortieId);

            if (targetSortie && m.life > 0) {
              const angle = (Math.atan2(targetSortie.y - m.y, targetSortie.x - m.x) * 180) / Math.PI;
              m.heading = angle;
              const spd = m.speed * 70;
              m.x += Math.cos((angle * Math.PI) / 180) * spd * dt;
              m.y += Math.sin((angle * Math.PI) / 180) * spd * dt;
              m.trail.push({ x: m.x, y: m.y });
              if (m.trail.length > 8) m.trail.shift();

              if (distance(m.x, m.y, targetSortie.x, targetSortie.y) < 20) {
                // SAM Hit!
                setVisualEffects(v => [
                  ...v,
                  {
                    id: `sam-burst-${Date.now()}-${Math.random()}`,
                    type: 'EXPLOSION',
                    x: m.x,
                    y: m.y,
                    radius: 35,
                    color: '#f43f5e',
                    duration: 0.8,
                    elapsed: 0
                  }
                ]);

                // Destroy aircraft
                setAirSorties(sorties => sorties.filter(s => s.id !== targetSortie.id));
                audioSys.playFlankAlarm();
                continue;
              }
              nextMissiles.push(m);
            }
          }
          return nextMissiles;
        });

        // 5. UPDATE CONTROL NODES & CAPTURE
        setControlNodes(currNodes => {
          let nodeChanged = false;
          const nextNodes = currNodes.map(node => {
            const nearbyUnits = units.filter(u => distance(u.x, u.y, node.x, node.y) <= node.radius + 15);
            if (nearbyUnits.length > 0) {
              const dominantFaction = nearbyUnits[0].factionId;
              const sameFaction = nearbyUnits.every(u => u.factionId === dominantFaction);
              if (sameFaction && dominantFaction !== node.owner) {
                nodeChanged = true;
                return { ...node, owner: dominantFaction };
              }
            }
            return node;
          });

          if (nodeChanged && !unifiedStateRef.current) {
            const loyalistVictoryCount = nextNodes.filter(n => n.isVictoryNode && n.owner === 'loyalists').length;
            const rebelVictoryCount = nextNodes.filter(n => n.isVictoryNode && n.owner === 'rebels').length;
            if (loyalistVictoryCount >= 3 || rebelVictoryCount >= 3) {
              const victor = loyalistVictoryCount >= 3 ? 'Nationalist Command' : 'Liberation Front';
              triggerUnificationRef.current(victor);
            }
          }

          return nextNodes;
        });

        // 6. UPDATE VISUAL EFFECTS
        setVisualEffects(prev =>
          prev
            .map(ef => ({ ...ef, elapsed: ef.elapsed + dt }))
            .filter(ef => ef.elapsed < ef.duration)
        );

        // 7. UPDATE RECONNAISSANCE SWEEP ZONES
        setReconSweepZones(prev =>
          prev
            .map(sw => ({ ...sw, remainingDuration: sw.remainingDuration - dt }))
            .filter(sw => sw.remainingDuration > 0)
        );

        // 8. STEP WAR ECONOMY & INDUSTRIAL OUTPUT
        setEconomyState(prevEco =>
          stepEconomy(
            prevEco,
            controlNodes,
            units,
            diplomaticLedger,
            dt,
            simTick,
            spawnReinforcement
          )
        );

        // 9. STEP AUTONOMOUS DIPLOMATIC AI (approx every 15 simulation seconds)
        if (simTick % 15 === 0) {
          const simTimeStr = `${String(simHour).padStart(2, '0')}:${String(Math.floor(simMinute)).padStart(2, '0')}:${String((simTick % 60)).padStart(2, '0')}Z`;
          const { updatedLedger, newTransmissions } = stepDiplomaticAI(
            diplomaticLedger,
            factions,
            units,
            controlNodes,
            defcon,
            simTick,
            simTimeStr
          );
          setDiplomaticLedger(updatedLedger);
          if (newTransmissions.length > 0) {
            setTransmissions(prev => [...newTransmissions, ...prev].slice(0, 35));
            audioSys.playTeletype();
          }
        }
      }

      animFrameId.current = requestAnimationFrame(updateSimulation);
    };

    lastTimeRef.current = performance.now();
    animFrameId.current = requestAnimationFrame(updateSimulation);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [airbases, airSorties, bridges, controlNodes, defcon, diplomaticLedger, factions, isPlaying, queryAiCommander, simHour, simMinute, simSpeed, simTick, spawnReinforcement, units]);

  /* =========================================================================
     CANVAS 2D VECTOR RENDERING
     ========================================================================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Primary Colors based on CRT Theme
    const isAmber = crtTheme === 'amber';
    const bgColor = isAmber ? '#120b02' : '#030603';
    const gridColor = isAmber ? 'rgba(245, 158, 11, 0.08)' : 'rgba(74, 246, 38, 0.08)';
    const primaryGlow = isAmber ? '#f59e0b' : '#4af626';
    const waterFill = isAmber ? '#1e1406' : '#081a0b';
    const waterBorder = isAmber ? '#b45309' : '#1a4520';

    // Clear Canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 1. CRT Radar Grid Lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Radar Concentric Calibration Rings
    ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(640, 420, 220, 0, Math.PI * 2);
    ctx.arc(640, 420, 440, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. MEANDERING RIVER SPLINE (Continuous Vector)
    ctx.save();
    ctx.fillStyle = waterFill;
    ctx.strokeStyle = waterBorder;
    ctx.lineWidth = 32;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(510, 0);
    ctx.bezierCurveTo(460, 180, 560, 360, 520, 520);
    ctx.bezierCurveTo(480, 680, 550, 780, 490, 850);
    ctx.stroke();

    // Inner River Flow Vector
    ctx.strokeStyle = isAmber ? '#d97706' : '#10b981';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // 3. DYNAMIC TERRAIN ZONES & TOPOGRAPHIC VECTORS
    if (showOverlays.terrainZones) {
      TERRAIN_ZONES.forEach(zone => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(zone.polygon[0][0], zone.polygon[0][1]);
        for (let i = 1; i < zone.polygon.length; i++) {
          ctx.lineTo(zone.polygon[i][0], zone.polygon[i][1]);
        }
        ctx.closePath();

        if (zone.type === 'MUD') {
          ctx.fillStyle = isAmber ? 'rgba(120, 80, 20, 0.28)' : 'rgba(85, 65, 25, 0.3)';
          ctx.fill();
          ctx.strokeStyle = isAmber ? 'rgba(217, 119, 6, 0.6)' : 'rgba(180, 120, 30, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = isAmber ? '#fbbf24' : '#eab308';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`░░░ ${zone.name.toUpperCase()} [MUD: -20% VEHICLE SPEED / +25% FUEL DRAIN]`, zone.labelPos[0], zone.labelPos[1]);
        } else if (zone.type === 'FOREST') {
          ctx.fillStyle = isAmber ? 'rgba(60, 80, 20, 0.28)' : 'rgba(16, 78, 40, 0.32)' ;
          ctx.fill();
          ctx.strokeStyle = isAmber ? 'rgba(163, 230, 53, 0.5)' : 'rgba(34, 197, 94, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = isAmber ? '#a3e635' : '#4ade80';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`▲▲ ${zone.name.toUpperCase()} [FOREST: +1 INF ATK / AMBUSH CONCEALED]`, zone.labelPos[0], zone.labelPos[1]);
        } else if (zone.type === 'HILLS') {
          ctx.fillStyle = isAmber ? 'rgba(180, 83, 9, 0.22)' : 'rgba(6, 78, 59, 0.26)';
          ctx.fill();
          ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.55)' : 'rgba(52, 211, 153, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (showOverlays.contourLines) {
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)';
            ctx.beginPath();
            const cx = zone.polygon.reduce((acc, pt) => acc + pt[0], 0) / zone.polygon.length;
            const cy = zone.polygon.reduce((acc, pt) => acc + pt[1], 0) / zone.polygon.length;
            for (let i = 0; i < zone.polygon.length; i++) {
              const p = zone.polygon[i];
              const innerX = p[0] * 0.72 + cx * 0.28;
              const innerY = p[1] * 0.72 + cy * 0.28;
              if (i === 0) ctx.moveTo(innerX, innerY);
              else ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.fillStyle = isAmber ? '#fbbf24' : '#6ee7b7';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`▲ ${zone.name.toUpperCase()} [HILLS: +2 DEFENSE / +50% ELEVATION LOS]`, zone.labelPos[0], zone.labelPos[1]);
        } else if (zone.type === 'URBAN') {
          ctx.fillStyle = isAmber ? 'rgba(70, 50, 25, 0.35)' : 'rgba(30, 58, 75, 0.38)';
          ctx.fill();
          ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.65)' : 'rgba(147, 197, 253, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Hatching
          ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.18)' : 'rgba(147, 197, 253, 0.18)';
          ctx.lineWidth = 1;
          for (let gx = zone.labelPos[0] - 30; gx < zone.labelPos[0] + 90; gx += 18) {
            ctx.beginPath();
            ctx.moveTo(gx, zone.labelPos[1] - 24);
            ctx.lineTo(gx, zone.labelPos[1] + 24);
            ctx.stroke();
          }

          ctx.fillStyle = isAmber ? '#fde047' : '#93c5fd';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`▦▦ ${zone.name.toUpperCase()} [METROPOLITAN: +2 DEFENSE COVER / ENHANCED ENTRENCH]`, zone.labelPos[0], zone.labelPos[1]);
        }
        ctx.restore();
      });
    }

    // 4. BRIDGES ACROSS RIVER
    bridges.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.isDestroyed) {
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.beginPath();
        ctx.moveTo(-b.width / 2, -b.height / 2);
        ctx.lineTo(b.width / 2, b.height / 2);
        ctx.moveTo(-b.width / 2, b.height / 2);
        ctx.lineTo(b.width / 2, -b.height / 2);
        ctx.stroke();
        ctx.fillStyle = '#f87171';
        ctx.font = '9px monospace';
        ctx.fillText('COLLAPSED', -24, -b.height / 2 - 4);
      } else {
        ctx.fillStyle = isAmber ? '#b45309' : '#047857';
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeStyle = isAmber ? '#f59e0b' : '#34d399';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Deck lines
        ctx.beginPath();
        ctx.moveTo(0, -b.height / 2);
        ctx.lineTo(0, b.height / 2);
        ctx.stroke();

        ctx.fillStyle = primaryGlow;
        ctx.font = '9px monospace';
        ctx.fillText(`${b.name} (${b.health}%)`, -b.width / 2 - 20, -b.height / 2 - 4);
      }
      ctx.restore();
    });

    // 5. CONTROL NODES (Strategic Objectives)
    controlNodes.forEach(node => {
      ctx.save();
      const faction = factions[node.owner];
      const nodeColor = faction?.color || '#94a3b8';

      // Outer pulse radius
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed capture envelope
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Icon / Hub
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Victory Node Gold Star
      if (node.isVictoryNode) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('★ VICTORY NODE', node.x - 40, node.y - node.radius - 8);
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(node.name, node.x - 45, node.y + node.radius + 14);
      ctx.fillStyle = nodeColor;
      ctx.font = '9px monospace';
      ctx.fillText(`CONTROL: ${faction?.name || node.owner}`, node.x - 45, node.y + node.radius + 24);
      ctx.restore();
    });

    // 6. AIRBASES & RUNWAYS
    airbases.forEach(ab => {
      ctx.save();
      ctx.translate(ab.x, ab.y);
      const abColor = factions[ab.factionId]?.color || '#94a3b8';

      // Runway rectangle
      ctx.rotate((ab.runwayAngle * Math.PI) / 180);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(-35, -8, 70, 16);
      ctx.strokeStyle = abColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-35, -8, 70, 16);

      // Centerline
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.rotate((-ab.runwayAngle * Math.PI) / 180);
      ctx.fillStyle = abColor;
      ctx.font = '9px monospace';
      ctx.fillText(`✈ ${ab.name} [${ab.readyAircraft}/${ab.totalCapacity}]`, -45, -16);
      ctx.restore();
    });

    // 6.5. PERSPECTIVE RADAR VISION FOR FOG OF WAR
    const visionSources = getFactionVisionSources(
      fowPerspective,
      units,
      airSorties,
      controlNodes,
      airbases,
      reconSweepZones
    );

    // 7. NATO MILITARY COUNTERS (Units)
    units.forEach(u => {
      // Fog of War Detection Check
      const isDetected = fowPerspective === 'all' || isUnitDetectedByFaction(u, fowPerspective, visionSources);
      if (!isDetected) {
        return; // Hidden units remain invisible until detected by radar, reconnaissance, or friendly patrols
      }

      ctx.save();
      ctx.translate(u.x, u.y);

      const fColor = factions[u.factionId]?.color || '#94a3b8';
      const isSelected = selectedUnitId === u.id;

      // Range Circle Overlay
      if (showOverlays.ranges && (isSelected || u.type === 'artillery' || u.type === 'sam')) {
        ctx.strokeStyle = `${fColor}33`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, u.range, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Flanking Arc Indicator (shows the >90° severe flanking penalty zone relative to facing)
      if (showOverlays.flankingArcs && (isSelected || u.inCombat)) {
        ctx.save();
        ctx.rotate((u.heading * Math.PI) / 180);
        ctx.beginPath();
        ctx.arc(0, 0, 32, (90 * Math.PI) / 180, (270 * Math.PI) / 180);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // Selection Ring
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Facing / Heading Arrow
      ctx.save();
      ctx.rotate((u.heading * Math.PI) / 180);
      ctx.strokeStyle = primaryGlow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(24, 0);
      ctx.lineTo(20, -3);
      ctx.moveTo(24, 0);
      ctx.lineTo(20, 3);
      ctx.stroke();
      ctx.restore();

      // NATO Counter Box (28 x 20 px)
      const w = 28;
      const h = 20;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = fColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // NATO Symbology inside Counter
      ctx.strokeStyle = fColor;
      ctx.lineWidth = 1.5;
      if (u.type === 'infantry') {
        // Saltire "X"
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 3, -h / 2 + 3);
        ctx.lineTo(w / 2 - 3, h / 2 - 3);
        ctx.moveTo(w / 2 - 3, -h / 2 + 3);
        ctx.lineTo(-w / 2 + 3, h / 2 - 3);
        ctx.stroke();
      } else if (u.type === 'armor') {
        // Center Oval
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (u.type === 'mechanized') {
        // Oval + Diagonal slash
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, h / 2 - 4);
        ctx.lineTo(w / 2 - 4, -h / 2 + 4);
        ctx.stroke();
      } else if (u.type === 'artillery') {
        // Solid Center Dot
        ctx.fillStyle = fColor;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (u.type === 'sam') {
        // Upward Radar Chevron
        ctx.beginPath();
        ctx.arc(0, 3, 6, Math.PI, 0);
        ctx.moveTo(0, 3);
        ctx.lineTo(0, -6);
        ctx.stroke();
      }

      // Status Bars: Strength (Green), Fuel (Amber), Morale (Cyan)
      const barW = 26;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-barW / 2, h / 2 + 3, barW, 4);
      ctx.fillStyle = u.strength > 40 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2, h / 2 + 3, (barW * u.strength) / 100, 4);

      // Fuel bar
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-barW / 2, h / 2 + 8, barW, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-barW / 2, h / 2 + 8, (barW * u.fuel) / 100, 2);

      // Flank alert badge
      if (u.lastFlanked) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('! FLANK !', -20, -h / 2 - 4);
      }

      // Dynamic Terrain Badge
      const unitTerrain = getTerrainAt(u.x, u.y, bridges);
      if (unitTerrain.zone) {
        ctx.save();
        ctx.font = 'bold 8px monospace';
        if (unitTerrain.type === 'MUD') {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText('MUD -20%', -w / 2, -h / 2 - 12);
        } else if (unitTerrain.type === 'FOREST') {
          ctx.fillStyle = '#4ade80';
          ctx.fillText('WOODS +1', -w / 2, -h / 2 - 12);
        } else if (unitTerrain.type === 'HILLS') {
          ctx.fillStyle = '#a3e635';
          ctx.fillText('RIDGE +2', -w / 2, -h / 2 - 12);
        } else if (unitTerrain.type === 'URBAN') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('URBAN +2', -w / 2, -h / 2 - 12);
        }
        ctx.restore();
      }

      // Concealment indicator if in heavy cover
      if (isUnitConcealed(u) && (fowPerspective === 'all' || u.factionId === fowPerspective)) {
        ctx.save();
        ctx.font = 'bold 7px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('CONCEALED', -w / 2 - 4, h / 2 + 18);
        ctx.restore();
      }

      ctx.restore();
    });

    // 8. ARTILLERY ARCS & SHELLS
    artilleryShells.forEach(shell => {
      ctx.save();
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Shell elevated by parabolic arc
      const altitude = Math.sin(shell.progress * Math.PI) * shell.arcHeight;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(shell.x, shell.y - altitude, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shell.startX, shell.startY);
      ctx.quadraticCurveTo(
        (shell.startX + shell.targetX) / 2,
        (shell.startY + shell.targetY) / 2 - shell.arcHeight * 1.5,
        shell.targetX,
        shell.targetY
      );
      ctx.stroke();
      ctx.restore();
    });

    // 9. AIR SORTIES (1960s Visual Aircraft)
    airSorties.forEach(sortie => {
      ctx.save();
      const fColor = factions[sortie.factionId]?.color || '#38bdf8';

      // Flight Path Vector Line
      if (showOverlays.airFlightPaths) {
        ctx.strokeStyle = `${fColor}55`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(sortie.x, sortie.y);
        ctx.lineTo(sortie.targetX, sortie.targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Contrail
      if (sortie.trail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sortie.trail[0].x, sortie.trail[0].y);
        for (let i = 1; i < sortie.trail.length; i++) {
          ctx.lineTo(sortie.trail[i].x, sortie.trail[i].y);
        }
        ctx.stroke();
      }

      ctx.translate(sortie.x, sortie.y);
      ctx.rotate((sortie.heading * Math.PI) / 180);

      // Jet Silhouette (Swept-wing 1960s interceptor / fighter bomber)
      ctx.fillStyle = fColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(12, 0); // nose
      ctx.lineTo(-4, -10); // wingtip left
      ctx.lineTo(-2, -3); // wing root
      ctx.lineTo(-10, -5); // tail left
      ctx.lineTo(-8, 0); // engine exhaust
      ctx.lineTo(-10, 5); // tail right
      ctx.lineTo(-2, 3); // wing root
      ctx.lineTo(-4, 10); // wingtip right
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Afterburner Glow
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-9, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Sortie Role Badge
      ctx.rotate((-sortie.heading * Math.PI) / 180);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText(`${sortie.callsign} [${sortie.role}]`, -24, -14);
      ctx.restore();
    });

    // 10. SAM MISSILES & SMOKE TRAILS
    samMissiles.forEach(m => {
      ctx.save();
      // Smoke Trail
      if (m.trail.length > 1) {
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.trail[0].x, m.trail[0].y);
        for (let i = 1; i < m.trail.length; i++) {
          ctx.lineTo(m.trail[i].x, m.trail[i].y);
        }
        ctx.stroke();
      }

      ctx.translate(m.x, m.y);
      ctx.rotate((m.heading * Math.PI) / 180);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -1.5, 12, 3);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(2, -2);
      ctx.lineTo(2, 2);
      ctx.fill();
      ctx.restore();
    });

    // 11. VISUAL EFFECTS (Explosions, Napalm Carpets, Smoke)
    visualEffects.forEach(ef => {
      ctx.save();
      const progress = ef.elapsed / ef.duration;
      const alpha = Math.max(0, 1 - progress);

      if (ef.type === 'EXPLOSION') {
        const curRadius = ef.radius * (0.3 + progress * 0.7);
        const grad = ctx.createRadialGradient(ef.x, ef.y, 0, ef.x, ef.y, curRadius);
        grad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
        grad.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(239, 68, 68, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, curRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (ef.type === 'NAPALM') {
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(254, 215, 170, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });

    // 12. FOG OF WAR SHROUD LAYER & RECONNAISSANCE SWEEPS
    if (fowPerspective !== 'all' && showOverlays.fogOfWar) {
      const fowCanvas = document.createElement('canvas');
      fowCanvas.width = width;
      fowCanvas.height = height;
      const fowCtx = fowCanvas.getContext('2d');

      if (fowCtx) {
        // Darkness mask over unobserved theatre
        fowCtx.fillStyle = isAmber ? 'rgba(10, 6, 2, 0.88)' : 'rgba(3, 7, 3, 0.90)';
        fowCtx.fillRect(0, 0, width, height);

        // Punch line-of-sight vision apertures with destination-out blending
        fowCtx.globalCompositeOperation = 'destination-out';

        visionSources.forEach(vs => {
          const grad = fowCtx.createRadialGradient(vs.x, vs.y, vs.radius * 0.45, vs.x, vs.y, vs.radius);
          grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
          grad.addColorStop(0.78, 'rgba(0, 0, 0, 0.85)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          fowCtx.fillStyle = grad;
          fowCtx.beginPath();
          fowCtx.arc(vs.x, vs.y, vs.radius, 0, Math.PI * 2);
          fowCtx.fill();
        });

        // Blit Fog of War shroud onto main display
        ctx.drawImage(fowCanvas, 0, 0);

        // Draw friendly vision range rings and active reconnaissance scans
        visionSources.forEach(vs => {
          if (vs.isAirRecon) {
            ctx.save();
            ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.55)' : 'rgba(56, 189, 248, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(vs.x, vs.y, vs.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
        });

        // Active Recon Sweep Sector Indicators
        reconSweepZones.forEach(sw => {
          if (sw.factionId === fowPerspective) {
            const alphaPulse = Math.min(1, sw.remainingDuration / 18);
            ctx.save();
            ctx.strokeStyle = isAmber ? `rgba(245, 158, 11, ${alphaPulse * 0.7})` : `rgba(56, 189, 248, ${alphaPulse * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = isAmber ? `rgba(245, 158, 11, ${alphaPulse * 0.85})` : `rgba(56, 189, 248, ${alphaPulse * 0.85})`;
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`◎ RECON SCAN SWEEP [${Math.ceil(sw.remainingDuration)}s ACTIVE]`, sw.x - 70, sw.y - sw.radius + 14);
            ctx.restore();
          }
        });
      }
    }
  }, [airSorties, airbases, artilleryShells, bridges, controlNodes, crtTheme, factions, fowPerspective, reconSweepZones, samMissiles, selectedUnitId, showOverlays, units, visualEffects]);

  /* =========================================================================
     INTERACTION: CLICK INSPECTOR ON CANVAS
     ========================================================================= */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked unit
    let foundUnit: Unit | null = null;
    for (const u of units) {
      if (distance(u.x, u.y, clickX, clickY) < 22) {
        foundUnit = u;
        break;
      }
    }

    if (foundUnit) {
      setSelectedUnitId(foundUnit.id);
      setSelectedAirbaseId(null);
      return;
    }

    // Check airbase
    let foundBase: Airbase | null = null;
    for (const b of airbases) {
      if (distance(b.x, b.y, clickX, clickY) < 25) {
        foundBase = b;
        break;
      }
    }

    if (foundBase) {
      setSelectedAirbaseId(foundBase.id);
      setSelectedUnitId(null);
      return;
    }

    // If unit selected, clicking empty space moves unit (spectator override)
    if (selectedUnitId) {
      setUnits(prev =>
        prev.map(u => (u.id === selectedUnitId ? { ...u, targetX: clickX, targetY: clickY } : u))
      );
    }
  };

  /* =========================================================================
     JSON IMPORT / EXPORT (WAR ARCHIVE SNAPSHOT)
     ========================================================================= */
  const exportWarArchive = () => {
    const snapshot = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      simTick,
      simHour,
      simMinute,
      defcon,
      activeProvider,
      unifiedState,
      factions,
      units,
      airSorties,
      bridges,
      controlNodes,
      airbases,
      transmissions
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-brink-war-archive-tick-${simTick}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWarArchive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const snapshot = JSON.parse(content);

        if (snapshot.units && snapshot.controlNodes) {
          setSimTick(snapshot.simTick || 0);
          setSimHour(snapshot.simHour || 6);
          setSimMinute(snapshot.simMinute || 30);
          setDefcon(snapshot.defcon || 3);
          setUnifiedState(Boolean(snapshot.unifiedState));
          if (snapshot.factions) setFactions(snapshot.factions);
          if (snapshot.units) setUnits(snapshot.units);
          if (snapshot.airSorties) setAirSorties(snapshot.airSorties);
          if (snapshot.bridges) setBridges(snapshot.bridges);
          if (snapshot.controlNodes) setControlNodes(snapshot.controlNodes);
          if (snapshot.airbases) setAirbases(snapshot.airbases);
          if (snapshot.transmissions) setTransmissions(snapshot.transmissions);
        }
      } catch (err) {
        alert('Failed to parse war archive JSON file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  // Faction telemetry calculations for Active Factions aside
  const loyalistUnits = units.filter(u => u.factionId === 'loyalists');
  const loyalistTotalStrength = loyalistUnits.reduce((a, b) => a + b.strength, 0);
  const loyalistMaxStrength = Math.max(1, loyalistUnits.length * 100);
  const loyalistArmorCount = loyalistUnits.filter(u => u.type === 'armor' || u.type === 'mechanized').length;

  const rebelUnits = units.filter(u => u.factionId === 'rebels');
  const rebelTotalStrength = rebelUnits.reduce((a, b) => a + b.strength, 0);
  const rebelMaxStrength = Math.max(1, rebelUnits.length * 100);
  const rebelInfCount = rebelUnits.length;
  const rebelAvgMorale = rebelInfCount > 0 ? rebelUnits.reduce((a, b) => a + b.morale, 0) / rebelInfCount : 85;

  const coalitionUnits = units.filter(u => u.factionId === 'coalition');
  const coalitionTotalStrength = coalitionUnits.reduce((a, b) => a + b.strength, 0);
  const coalitionMaxStrength = Math.max(1, coalitionUnits.length * 100);

  const volskanUnits = units.filter(u => u.factionId === 'volskan');
  const volskanTotalStrength = volskanUnits.reduce((a, b) => a + b.strength, 0);
  const volskanMaxStrength = Math.max(1, volskanUnits.length * 100);

  return (
    <div
      className={`min-h-screen font-mono flex flex-col select-none border-2 sm:border-4 relative overflow-hidden ${
        crtTheme === 'amber'
          ? 'bg-[#0a0702] text-[#f59e0b] border-[#b45309]'
          : 'bg-[#050805] text-[#4af626] border-[#1a2e1a]'
      }`}
    >
      {/* IMMERSIVE CRT SCANLINE TEXTURE OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-40"
        style={{
          background: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)'
        }}
      />
      {scanlines && (
        <div
          className="pointer-events-none fixed inset-0 z-50 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.75) 50%)',
            backgroundSize: '100% 4px'
          }}
        />
      )}

      {/* TOP HEADER */}
      <header
        className={`h-12 border-b-2 flex items-center justify-between px-4 sm:px-6 shadow-[0_0_15px_rgba(74,246,38,0.1)] z-10 shrink-0 ${
          crtTheme === 'amber' ? 'border-[#b45309] bg-[#1a1204]' : 'border-[#1a2e1a] bg-[#0a120a]'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-base sm:text-lg font-bold tracking-tighter">
            PROJECT BRINK <span className="animate-pulse">_</span>
          </span>
          <div className={`h-4 w-px hidden sm:block ${crtTheme === 'amber' ? 'bg-[#b45309]' : 'bg-[#1a2e1a]'}`} />
          <span className="text-xs opacity-70 hidden sm:inline">V1.0.4-COLD_WAR_SIM</span>
        </div>

        {/* METRICS */}
        <div className="flex items-center gap-4 sm:gap-8 text-[10px] uppercase tracking-widest">
          <div className="flex flex-col">
            <span className="opacity-50 text-[9px]">Sim-Time</span>
            <span className="font-bold text-xs">
              {String(simHour).padStart(2, '0')}:{String(Math.floor(simMinute)).padStart(2, '0')}:
              {String((simTick % 60) * 1).padStart(2, '0')}
            </span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="opacity-50 text-[9px]">Location</span>
            <span className="text-xs">SAN PIETRO // SECTOR-44</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 text-[9px] text-amber-500">Defcon</span>
            <span className="text-amber-500 font-bold text-xs">
              LVL {defcon} - {defcon === 1 ? 'CRITICAL' : defcon === 2 ? 'IMMINENT' : defcon === 3 ? 'ELEVATED' : 'STABLE'}
            </span>
          </div>
        </div>
      </header>

      {/* UNIFICATION EMERGENCY NOTIFICATION BANNER */}
      {unificationBanner && (
        <div className="bg-yellow-500 text-black px-4 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-widest animate-pulse border-b border-black z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{unificationBanner}</span>
          </div>
          <button
            onClick={() => setUnificationBanner(null)}
            className="border border-black px-2 py-0.5 hover:bg-black hover:text-yellow-400 text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT WORKSPACE */}
      <main className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        {/* LEFT ASIDE: ACTIVE FACTIONS & AI CORE ENGINE */}
        <aside
          className={`w-full xl:w-64 border-b-2 xl:border-b-0 xl:border-r-2 flex flex-col p-3 gap-3 overflow-y-auto shrink-0 max-h-[35vh] xl:max-h-none ${
            crtTheme === 'amber' ? 'border-[#b45309] bg-[#100b03]' : 'border-[#1a2e1a] bg-[#070c07]'
          }`}
        >
          <div
            className={`text-[10px] uppercase opacity-50 border-b pb-1 font-bold flex justify-between items-center ${
              crtTheme === 'amber' ? 'border-[#b45309]' : 'border-[#1a2e1a]'
            }`}
          >
            <span>Active Factions</span>
            <span>4 THEATERS</span>
          </div>

          <div className="space-y-2.5">
            {/* SP LOYALISTS */}
            <div
              className={`p-2 border ${
                crtTheme === 'amber' ? 'border-[#b45309]/60 bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-blue-400">SP LOYALISTS</span>
                <span className="text-[9px] px-1 bg-blue-900 text-blue-200 font-bold">JUNTA</span>
              </div>
              <div className="h-1 w-full bg-[#132213] mb-1.5">
                <div
                  className="h-full bg-[#4af626]"
                  style={{ width: `${Math.min(100, Math.round((loyalistTotalStrength / loyalistMaxStrength) * 100))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 text-[9px] opacity-70 italic">
                <span>Armor: {loyalistArmorCount} Div</span>
                <span className="text-right">
                  {factions.loyalists.fuelReserves < 35
                    ? 'Fuel: Critical'
                    : `Fuel: ${Math.round(factions.loyalists.fuelReserves)}%`}
                </span>
              </div>
            </div>

            {/* SP LIBERATION */}
            <div
              className={`p-2 border ${
                crtTheme === 'amber' ? 'border-[#b45309]/60 bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-red-400">SP LIBERATION</span>
                <span className="text-[9px] px-1 bg-red-900 text-red-200 font-bold">REBEL</span>
              </div>
              <div className="h-1 w-full bg-[#132213] mb-1.5">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${Math.min(100, Math.round((rebelTotalStrength / rebelMaxStrength) * 100))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 text-[9px] opacity-70 italic">
                <span>Inf: {rebelInfCount} Cells</span>
                <span className="text-right">Morale: {Math.round(rebelAvgMorale)}%</span>
              </div>
            </div>

            {/* ATLANTIC COALITION */}
            <div
              className={`p-2 border ${
                crtTheme === 'amber' ? 'border-[#b45309]/60 bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-cyan-400">ATLANTIC COAL.</span>
                <span className="text-[9px] px-1 bg-cyan-900 text-cyan-200 font-bold">PROXY</span>
              </div>
              <div className="h-1 w-full bg-[#132213] mb-1.5">
                <div
                  className="h-full bg-cyan-400"
                  style={{
                    width: `${Math.min(100, Math.round((coalitionTotalStrength / coalitionMaxStrength) * 100))}%`
                  }}
                />
              </div>
              <div className="text-[9px] opacity-70 italic">Status: Carrier Group On Station</div>
            </div>

            {/* VOLSKAN UNION */}
            <div
              className={`p-2 border ${
                crtTheme === 'amber' ? 'border-[#b45309]/60 bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-amber-400">VOLSKAN UNION</span>
                <span className="text-[9px] px-1 bg-amber-900 text-amber-200 font-bold">PROXY</span>
              </div>
              <div className="h-1 w-full bg-[#132213] mb-1.5">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, Math.round((volskanTotalStrength / volskanMaxStrength) * 100))}%` }}
                />
              </div>
              <div className="text-[9px] opacity-70 italic">Status: Rail Convoy inbound</div>
            </div>

            {/* UNIFIED AWAKENED SUPERPOWER STATE */}
            {unifiedState && (
              <div className="p-2 border border-emerald-500 bg-emerald-950/50 animate-pulse">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-emerald-300">SAN PIETRO UNIFIED</span>
                  <span className="text-[9px] px-1 bg-emerald-700 text-white font-bold">SOVEREIGN</span>
                </div>
                <div className="h-1 w-full bg-[#132213] mb-1.5">
                  <div className="h-full bg-emerald-400 w-full" />
                </div>
                <div className="text-[9px] text-emerald-200 italic">Civil War Unified: Expelling Foreign Bases</div>
              </div>
            )}
          </div>

          {/* AI CORE ENGINE TELEMETRY */}
          <div
            className={`mt-auto p-2 border-t-2 ${
              crtTheme === 'amber' ? 'border-[#b45309] bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
            }`}
          >
            <div className="text-[9px] uppercase opacity-50 mb-1 font-bold flex justify-between items-center">
              <span>AI Core Engine</span>
              {isAiQuerying && <span className="text-cyan-400 animate-spin">↻</span>}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-bold truncate">{activeProvider}</span>
            </div>
            <div className="text-[9px] opacity-50 mt-1">
              Lat: {Math.round(simSpeed * 16 + 26)}ms // Tkn/s: 142
            </div>
            <button
              onClick={queryAiCommander}
              disabled={isAiQuerying}
              className={`w-full mt-2 py-1 px-2 border text-[9px] uppercase flex items-center justify-center gap-1 ${
                crtTheme === 'amber'
                  ? 'border-[#b45309] hover:bg-[#b45309]/30 text-amber-300'
                  : 'border-[#1a2e1a] hover:bg-[#1a2e1a] text-cyan-300'
              }`}
              id="request-directive-btn"
            >
              <RefreshCw className={`w-3 h-3 ${isAiQuerying ? 'animate-spin' : ''}`} />
              <span>QUERY AI DOCTRINE</span>
            </button>
          </div>
        </aside>

        {/* CENTER SECTION: CONTINUOUS 2D VECTOR RADAR BATTLEFIELD */}
        <section
          className={`flex-1 relative flex flex-col overflow-hidden ${
            crtTheme === 'amber' ? 'bg-[#0c0802]' : 'bg-[#030603]'
          }`}
        >
          {/* Top Left [NATO-VEC-MAP] Badge */}
          <div
            className={`absolute top-3 left-3 z-10 p-2 border pointer-events-none ${
              crtTheme === 'amber' ? 'bg-[#140e03]/90 border-[#b45309]' : 'bg-[#0a120a]/90 border-[#1a2e1a]'
            }`}
          >
            <div className="text-[10px] text-blue-400 mb-0.5 font-bold">[NATO-VEC-MAP]</div>
            <div className="text-[9px] space-y-0.5 opacity-80">
              <div>COORD: 44.22N 12.09E</div>
              <div>ALT: 1,420m (Mountain Ridge)</div>
              <div className="hidden sm:block">MODE: CONTINUOUS CARTESIAN VECTOR</div>
            </div>
          </div>

          {/* Continuous Vector Canvas */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={1400}
              height={850}
              onClick={handleCanvasClick}
              className={`max-w-full max-h-[calc(100vh-165px)] object-contain border shadow-[0_0_30px_rgba(0,0,0,0.9)] cursor-crosshair ${
                crtTheme === 'amber' ? 'border-[#b45309]/80 bg-[#120b02]' : 'border-[#1a2e1a] bg-[#030603]'
              }`}
              id="battlefield-canvas"
            />

            {/* Map Legend Overlay */}
            <div
              className={`absolute bottom-3 left-3 pointer-events-none border p-2 text-[10px] hidden md:flex gap-3 ${
                crtTheme === 'amber' ? 'bg-[#140e03]/90 border-[#b45309]' : 'bg-[#0a120a]/90 border-[#1a2e1a]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-blue-500 bg-blue-950 inline-block" />
                <span>LOYALISTS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-red-500 bg-red-950 inline-block" />
                <span>REBELS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-cyan-400 bg-cyan-950 inline-block" />
                <span>ATLANTIC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-yellow-500 bg-yellow-950 inline-block" />
                <span>VOLSKAN</span>
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS DOCK */}
          <div
            className={`h-14 sm:h-16 border-t-2 flex items-center px-3 sm:px-4 gap-3 sm:gap-6 flex-wrap z-10 shrink-0 ${
              crtTheme === 'amber' ? 'border-[#b45309] bg-[#140e03]/95' : 'border-[#1a2e1a] bg-[#0a120a]/95'
            }`}
          >
            {/* Play / Step Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-8 h-8 flex items-center justify-center border font-bold text-xs ${
                  crtTheme === 'amber'
                    ? 'border-[#f59e0b] hover:bg-[#f59e0b] hover:text-black'
                    : 'border-[#4af626] hover:bg-[#4af626] hover:text-black'
                }`}
                title={isPlaying ? 'Pause' : 'Run'}
                id="play-pause-btn"
              >
                {isPlaying ? '‖' : '▶'}
              </button>

              <button
                onClick={() => setSimTick(t => t + 1)}
                className={`w-8 h-8 flex items-center justify-center border text-[11px] font-bold opacity-75 hover:opacity-100 ${
                  crtTheme === 'amber'
                    ? 'border-[#f59e0b]/40 hover:border-[#f59e0b]'
                    : 'border-[#4af626]/40 hover:border-[#4af626]'
                }`}
                title="Step +1 Tick"
                id="step-tick-btn"
              >
                +1
              </button>
            </div>

            {/* Speed Indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-50">SPEED:</span>
              <span className="text-[10px] text-amber-500 underline decoration-double font-bold mr-1">
                {simSpeed}.0x REAL-TIME
              </span>
              <div
                className={`flex items-center border rounded overflow-hidden ${
                  crtTheme === 'amber' ? 'border-[#b45309]' : 'border-[#1a2e1a]'
                }`}
              >
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                      simSpeed === s
                        ? crtTheme === 'amber'
                          ? 'bg-[#f59e0b] text-black'
                          : 'bg-[#4af626] text-black'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Live Teletype Ticker */}
            <div
              className={`hidden 2xl:flex flex-1 max-w-xs xl:max-w-md truncate text-[10px] opacity-90 border-x px-3 py-1 ${
                crtTheme === 'amber' ? 'border-[#b45309] bg-[#0c0802]' : 'border-[#1a2e1a] bg-[#050805]'
              }`}
            >
              <span className="font-bold mr-1.5 text-yellow-400">TELETYPE:</span>
              <span className="truncate">{transmissions[0]?.message || 'SIGNAL MONITORING STATIONS SILENT.'}</span>
            </div>

            {/* Toggles & War Archive */}
            <div className="ml-auto flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowOverlays(prev => ({ ...prev, terrainZones: !prev.terrainZones }))}
                className={`px-2 py-1 border text-[9px] uppercase ${
                  showOverlays.terrainZones
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                    : crtTheme === 'amber'
                    ? 'border-[#b45309] hover:bg-[#b45309]/30'
                    : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
                title="Toggle Mud, Forest, Hills, Urban vector polygons"
              >
                Terrain [{showOverlays.terrainZones ? 'ON' : 'OFF'}]
              </button>

              <button
                onClick={() => setShowOverlays(prev => ({ ...prev, fogOfWar: !prev.fogOfWar }))}
                className={`px-2 py-1 border text-[9px] uppercase ${
                  showOverlays.fogOfWar
                    ? 'bg-blue-950/80 text-blue-300 border-blue-500'
                    : crtTheme === 'amber'
                    ? 'border-[#b45309] hover:bg-[#b45309]/30'
                    : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
                title="Toggle Fog of War Line of Sight Shroud"
              >
                FoW [{showOverlays.fogOfWar ? 'ON' : 'OFF'}]
              </button>

              <button
                onClick={() => setShowOverlays(prev => ({ ...prev, flankingArcs: !prev.flankingArcs }))}
                className={`px-2 py-1 border text-[9px] uppercase ${
                  showOverlays.flankingArcs
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : crtTheme === 'amber'
                    ? 'border-[#b45309] hover:bg-[#b45309]/30'
                    : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
              >
                Flanks [{showOverlays.flankingArcs ? 'ON' : 'OFF'}]
              </button>

              <button
                onClick={() => setScanlines(!scanlines)}
                className={`px-2 py-1 border text-[9px] uppercase ${
                  scanlines
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    : crtTheme === 'amber'
                    ? 'border-[#b45309] hover:bg-[#b45309]/30'
                    : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
              >
                CRT [{scanlines ? 'ON' : 'OFF'}]
              </button>

              <button
                onClick={() => setCrtTheme(t => (t === 'amber' ? 'green' : 'amber'))}
                className={`px-2 py-1 border text-[9px] uppercase ${
                  crtTheme === 'amber' ? 'border-[#b45309] hover:bg-[#b45309]/30' : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
              >
                {crtTheme === 'amber' ? 'PHOSPHOR GREEN' : 'AMBER CRT'}
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 border text-xs ${
                  crtTheme === 'amber' ? 'border-[#b45309] hover:bg-[#b45309]/30' : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
                title="Audio Synthesizer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={exportWarArchive}
                className={`px-2.5 py-1 border text-[9px] uppercase ${
                  crtTheme === 'amber' ? 'border-[#b45309] hover:bg-[#b45309]/30' : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
                id="export-archive-btn"
              >
                Export State .JSON
              </button>

              <label
                className={`px-2.5 py-1 border text-[9px] uppercase cursor-pointer ${
                  crtTheme === 'amber' ? 'border-[#b45309] hover:bg-[#b45309]/30' : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                }`}
              >
                Import State
                <input type="file" accept=".json" onChange={importWarArchive} className="hidden" />
              </label>
            </div>
          </div>
        </section>

        {/* RIGHT ASIDE: MULTI-TAB INTELLIGENCE, DIPLOMACY, ECONOMY & TERRAIN */}
        <aside
          className={`w-full xl:w-96 border-t-2 xl:border-t-0 xl:border-l-2 flex flex-col overflow-hidden shrink-0 max-h-[60vh] xl:max-h-none ${
            crtTheme === 'amber' ? 'border-[#b45309] bg-[#100b03]' : 'border-[#1a2e1a] bg-[#070c07]'
          }`}
        >
          {/* Aside Header */}
          <div
            className={`p-2.5 border-b-2 flex items-center justify-between ${
              crtTheme === 'amber' ? 'border-[#b45309] bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a120a]'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>WAR ROOM COMMAND MATRIX</span>
            </div>
            <div className="text-[9px] opacity-60 text-white font-mono">TOP SECRET // NATO</div>
          </div>

          {/* Tab Selection Bar */}
          <div
            className={`grid grid-cols-4 text-[9px] font-bold border-b text-center uppercase tracking-tighter ${
              crtTheme === 'amber' ? 'border-[#b45309] bg-[#0e0a02]' : 'border-[#1a2e1a] bg-[#060b06]'
            }`}
          >
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`py-2 px-1 border-r ${
                crtTheme === 'amber' ? 'border-[#b45309]' : 'border-[#1a2e1a]'
              } ${
                activeTab === 'telemetry'
                  ? crtTheme === 'amber'
                    ? 'bg-[#b45309]/30 text-amber-300 font-black'
                    : 'bg-[#1a2e1a] text-[#4af626] font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Radar className="w-3 h-3" />
                <span>INTEL</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('diplomacy')}
              className={`py-2 px-1 border-r ${
                crtTheme === 'amber' ? 'border-[#b45309]' : 'border-[#1a2e1a]'
              } ${
                activeTab === 'diplomacy'
                  ? crtTheme === 'amber'
                    ? 'bg-[#b45309]/30 text-amber-300 font-black'
                    : 'bg-[#1a2e1a] text-[#4af626] font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Globe className="w-3 h-3" />
                <span>DIPLOMACY</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('economy')}
              className={`py-2 px-1 border-r ${
                crtTheme === 'amber' ? 'border-[#b45309]' : 'border-[#1a2e1a]'
              } ${
                activeTab === 'economy'
                  ? crtTheme === 'amber'
                    ? 'bg-[#b45309]/30 text-amber-300 font-black'
                    : 'bg-[#1a2e1a] text-[#4af626] font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" />
                <span>ECONOMY</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('terrain')}
              className={`py-2 px-1 ${
                activeTab === 'terrain'
                  ? crtTheme === 'amber'
                    ? 'bg-[#b45309]/30 text-amber-300 font-black'
                    : 'bg-[#1a2e1a] text-[#4af626] font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Mountain className="w-3 h-3" />
                <span>TERRAIN</span>
              </div>
            </button>
          </div>

          {/* TAB 1: TELEMETRY & TACTICAL INTERCEPTS */}
          {activeTab === 'telemetry' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Unit Inspector OR 1960s Air Wings Scramble */}
              <div className={`p-2.5 border-b ${crtTheme === 'amber' ? 'border-[#b45309]/50' : 'border-[#1a2e1a]'}`}>
                {selectedUnit ? (
                  /* Unit Telemetry Inspection */
                  <div
                    className={`space-y-2 text-xs p-2.5 border ${
                      crtTheme === 'amber' ? 'border-[#b45309] bg-[#160f04]' : 'border-[#1a2e1a] bg-[#0a150a]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-white">{selectedUnit.name}</div>
                        <div className="text-[10px] opacity-75 capitalize">
                          {selectedUnit.type} Counter • Heading: {Math.round(selectedUnit.heading)}°
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-5 border flex items-center justify-center font-bold text-[10px]"
                          style={{ borderColor: factions[selectedUnit.factionId]?.color }}
                        >
                          {selectedUnit.type === 'armor'
                            ? '⬭'
                            : selectedUnit.type === 'infantry'
                            ? 'X'
                            : selectedUnit.type === 'mechanized'
                            ? '⬭/'
                            : selectedUnit.type === 'artillery'
                            ? '●'
                            : '▲'}
                        </div>
                        <button
                          onClick={() => setSelectedUnitId(null)}
                          className="text-[9px] px-1.5 py-0.5 border border-[#1a2e1a] hover:bg-[#1a2e1a] text-neutral-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Strength Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span>COMBAT STRENGTH</span>
                        <span className="font-bold">{Math.round(selectedUnit.strength)}%</span>
                      </div>
                      <div className="w-full bg-[#132213] h-1.5 border border-[#1a2e1a] overflow-hidden">
                        <div className="bg-[#4af626] h-full" style={{ width: `${selectedUnit.strength}%` }} />
                      </div>
                    </div>

                    {/* Fuel & Morale */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span>FUEL</span>
                          <span className="font-bold text-amber-400">{Math.round(selectedUnit.fuel)}%</span>
                        </div>
                        <div className="w-full bg-[#132213] h-1.5 border border-[#1a2e1a] overflow-hidden">
                          <div className="bg-amber-400 h-full" style={{ width: `${selectedUnit.fuel}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span>MORALE</span>
                          <span className="font-bold text-cyan-400">{Math.round(selectedUnit.morale)}%</span>
                        </div>
                        <div className="w-full bg-[#132213] h-1.5 border border-[#1a2e1a] overflow-hidden">
                          <div className="bg-cyan-400 h-full" style={{ width: `${selectedUnit.morale}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Current Terrain Info */}
                    {(() => {
                      const tInfo = getTerrainAt(selectedUnit.x, selectedUnit.y, bridges);
                      return (
                        <div className="text-[9px] p-1.5 bg-black/40 border border-[#1a2e1a] flex justify-between items-center">
                          <span>SECTOR TERRAIN:</span>
                          <span className="font-bold text-yellow-300">
                            {tInfo.type === 'MUD'
                              ? 'ALLUVIAL MUD (-20% SPEED)'
                              : tInfo.type === 'FOREST'
                              ? 'PINE FOREST (+1 INF COMBAT)'
                              : tInfo.type === 'HILLS'
                              ? 'ELEVATION RIDGE (+2 DEF)'
                              : tInfo.type === 'URBAN'
                              ? 'METROPOLITAN (+2 DEF)'
                              : 'OPEN PLAINS'}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex justify-between text-[10px] border-t border-[#1a2e1a] pt-1">
                      <span>ENTRENCHMENT: +{Math.round(selectedUnit.entrenchment)}%</span>
                      <span className="text-yellow-400">KILLS: {selectedUnit.kills}</span>
                    </div>

                    {/* Flank Alert */}
                    <div className="bg-red-950/40 border border-red-800/60 p-1.5 text-[9px] text-red-300">
                      <span className="font-bold text-red-400">FLANKING: </span>
                      &gt;90° arrivals take 1.8x damage; rear ambushes inflict 2.4x criticals.
                    </div>
                  </div>
                ) : (
                  /* 1960s Air Wings Scramble */
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-[10px] uppercase font-bold text-cyan-300">
                      <span className="flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5" />
                        <span>1960s Air Wings & Sorties</span>
                      </span>
                      <span className="text-[9px] opacity-75">AIRBORNE: {airSorties.length}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <button
                        onClick={() => scrambleAirSortie('coalition', 'AIR_SUPERIORITY')}
                        className={`border p-1.5 text-left text-[10px] ${
                          crtTheme === 'amber'
                            ? 'border-amber-600/50 hover:bg-amber-950/40'
                            : 'border-cyan-500/50 hover:bg-cyan-950/40'
                        }`}
                      >
                        <div className="font-bold text-cyan-300">F-4 PHANTOM</div>
                        <div className="text-[8px] opacity-70">Air Superiority</div>
                      </button>

                      <button
                        onClick={() => scrambleAirSortie('loyalists', 'CAS')}
                        className={`border p-1.5 text-left text-[10px] ${
                          crtTheme === 'amber'
                            ? 'border-amber-600/50 hover:bg-amber-950/40'
                            : 'border-blue-500/50 hover:bg-blue-950/40'
                        }`}
                      >
                        <div className="font-bold text-blue-300">A-1 SKYRAIDER</div>
                        <div className="text-[8px] opacity-70">CAS (Napalm)</div>
                      </button>

                      <button
                        onClick={() => scrambleAirSortie('rebels', 'INTERCEPTION')}
                        className={`border p-1.5 text-left text-[10px] ${
                          crtTheme === 'amber'
                            ? 'border-amber-600/50 hover:bg-amber-950/40'
                            : 'border-red-500/50 hover:bg-red-950/40'
                        }`}
                      >
                        <div className="font-bold text-red-300">MiG-21 FISHBED</div>
                        <div className="text-[8px] opacity-70">CAP Intercept</div>
                      </button>

                      <button
                        onClick={() => scrambleAirSortie('volskan', 'RECON')}
                        className={`border p-1.5 text-left text-[10px] ${
                          crtTheme === 'amber'
                            ? 'border-amber-600/50 hover:bg-amber-950/40'
                            : 'border-yellow-500/50 hover:bg-yellow-950/40'
                        }`}
                      >
                        <div className="font-bold text-yellow-300">U-2 / RF-4 RECON</div>
                        <div className="text-[8px] opacity-70">Aerial LoS Sweep</div>
                      </button>
                    </div>

                    {airSorties.length > 0 ? (
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {airSorties.map((s, idx) => (
                          <div
                            key={`${s.id}-${idx}`}
                            className="p-1 border border-[#1a2e1a] text-[9px] bg-[#0a150a] flex justify-between items-center"
                          >
                            <span className="font-bold">
                              {s.callsign} [{s.role}]
                            </span>
                            <span className="text-amber-400">{Math.round(s.fuel)}% FUEL</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] opacity-50 italic text-center py-0.5">
                        Select unit to inspect telemetry or scramble wings above.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Radio Intercepts Log */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-[10px] leading-tight">
                {transmissions.map((tx, idx) => {
                  const isFlash = tx.priority === 'FLASH';
                  const isRebel = tx.callsign.includes('REBEL') || tx.callsign.includes('LIBERATION');
                  const isUS =
                    tx.callsign.includes('US') || tx.callsign.includes('COALITION') || tx.callsign.includes('SHADOW');
                  const isVolskan =
                    tx.callsign.includes('VOLSKAN') || tx.callsign.includes('SOVIET') || tx.callsign.includes('ALERT');

                  return (
                    <div
                      key={`${tx.id}-${idx}`}
                      className={
                        isFlash
                          ? 'text-amber-400 border-l-2 border-amber-500 pl-2 py-1 bg-amber-500/5'
                          : isRebel
                          ? 'text-red-400'
                          : isUS
                          ? 'text-cyan-400'
                          : isVolskan
                          ? 'text-amber-300'
                          : 'text-[#4af626] opacity-90'
                      }
                    >
                      <span className="opacity-50 text-[#4af626]">[{tx.timestamp}]</span>{' '}
                      <span className="font-bold text-white">[{tx.callsign}]</span>: {tx.message}
                    </div>
                  );
                })}
              </div>

              {/* Current Command Directive */}
              <div
                className={`min-h-20 border-t-2 p-2.5 ${
                  crtTheme === 'amber' ? 'border-[#b45309] bg-[#0c0802]' : 'border-[#1a2e1a] bg-[#050805]'
                }`}
              >
                <div className="text-[9px] uppercase opacity-50 mb-1 font-bold">Autonomous Command Directive</div>
                <div className="text-[10px] italic text-[#4af626]/80 leading-relaxed">
                  &quot;{geopoliticalAssessment ||
                    'Sever enemy resupply routes at designated river choke bridges. Leverage wooded terrain for infantry ambushes.'}&quot;
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIPLOMATIC MATRIX & GEOPOLITICAL AI */}
          {activeTab === 'diplomacy' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b pb-1.5 border-[#1a2e1a]">
                <span className="font-bold text-[10px] text-amber-400 uppercase">Geopolitical Treaty Matrix</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-700 font-bold">
                  UN GENEVA PROTOCOL
                </span>
              </div>

              {/* Bilateral Relations Cards */}
              <div className="space-y-2">
                {Object.values(diplomaticLedger.relations).map(rel => {
                  const fA = factions[rel.factionA]?.name || rel.factionA;
                  const fB = factions[rel.factionB]?.name || rel.factionB;
                  const statusColor =
                    rel.status === 'TOTAL_WAR'
                      ? 'text-red-400 bg-red-950/80 border-red-700'
                      : rel.status === 'FULL_ALLIANCE' || rel.status === 'PROXY_ALLIANCE'
                      ? 'text-green-400 bg-green-950/80 border-green-700'
                      : rel.status === 'NON_AGGRESSION' || rel.status === 'CEASEFIRE'
                      ? 'text-cyan-400 bg-cyan-950/80 border-cyan-700'
                      : 'text-yellow-400 bg-yellow-950/80 border-yellow-700';

                  return (
                    <div
                      key={`${rel.factionA}-${rel.factionB}`}
                      className="p-2 border border-[#1a2e1a] bg-black/40 flex flex-col gap-1 text-[10px]"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>{fA} ↔ {fB}</span>
                        <span className={`px-1.5 py-0.5 border text-[8px] font-black ${statusColor}`}>
                          {rel.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] opacity-75">
                        <span>Tension Index: {rel.tension > 0 ? `+${rel.tension}` : rel.tension}</span>
                        <span>Sanctions: {rel.activeSanctions.length > 0 ? rel.activeSanctions[0] : 'NONE'}</span>
                      </div>
                      <div className="w-full bg-[#132213] h-1 border border-[#1a2e1a]">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${Math.min(100, Math.max(10, Math.abs(rel.tension)))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Diplomatic Treaties & Ceasefire Cables */}
              <div className="border-t pt-2 border-[#1a2e1a]">
                <div className="text-[10px] font-bold text-cyan-400 uppercase mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Recent Diplomatic Accords & Cables</span>
                </div>
                <div className="space-y-1.5 text-[9px]">
                  {diplomaticLedger.recentEvents.slice(-4).map((evt, idx) => (
                    <div key={idx} className="p-1.5 border border-[#1a2e1a] bg-[#081208]">
                      <div className="text-amber-300 font-bold">CABLE #{idx + 1}</div>
                      <div className="opacity-80 mt-0.5">{evt}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Covert Espionage & Proxies */}
              <div className="p-2 border border-amber-800/40 bg-amber-950/20 text-[9px] space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  <span>COVERT PROXY INTERVENTION DOCTRINE</span>
                </div>
                <p className="opacity-80">
                  Atlantic Coalition and Volskan Union are executing covert weapons airlift and signals espionage without formal declaration of global war to prevent Defcon 1 escalation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: WAR ECONOMY & INDUSTRIAL PRODUCTION */}
          {activeTab === 'economy' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b pb-1.5 border-[#1a2e1a]">
                <span className="font-bold text-[10px] text-amber-400 uppercase">War Production Board</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-green-950 text-green-400 border border-green-700 font-bold">
                  FACTORIES OPERATIONAL
                </span>
              </div>

              {/* Faction Economic Ledger Cards */}
              <div className="space-y-2.5">
                {(['loyalists', 'rebels', 'coalition', 'volskan'] as FactionId[]).map(fId => {
                  const fac = factions[fId];
                  const eco = economyState.factionResources[fId];
                  if (!fac || !eco) return null;

                  const factionQueue = economyState.productionQueues.filter(q => q.factionId === fId);

                  return (
                    <div key={fId} className="p-2.5 border border-[#1a2e1a] bg-black/40 text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs" style={{ color: fac.color }}>
                          {fac.name.toUpperCase()}
                        </span>
                        <span className="text-[9px] opacity-75 font-mono">
                          IND. OUTPUT: +{eco.ipRate}/min
                        </span>
                      </div>

                      {/* Resources grid */}
                      <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                        <div className="p-1 bg-[#101b10] border border-[#1a2e1a]">
                          <div className="opacity-60 text-[8px]">OIL</div>
                          <div className="font-bold text-amber-400">{Math.round(eco.oil)}</div>
                        </div>
                        <div className="p-1 bg-[#101b10] border border-[#1a2e1a]">
                          <div className="opacity-60 text-[8px]">IP</div>
                          <div className="font-bold text-emerald-400">{Math.round(eco.industrialProduction)}</div>
                        </div>
                        <div className="p-1 bg-[#101b10] border border-[#1a2e1a]">
                          <div className="opacity-60 text-[8px]">MANPWR</div>
                          <div className="font-bold text-cyan-400">{Math.round(eco.manpower)}</div>
                        </div>
                        <div className="p-1 bg-[#101b10] border border-[#1a2e1a]">
                          <div className="opacity-60 text-[8px]">FUNDS</div>
                          <div className="font-bold text-yellow-300">${Math.round(eco.treasury)}</div>
                        </div>
                      </div>

                      {/* Active Production Lines */}
                      <div className="mt-1 space-y-1">
                        <div className="text-[8px] opacity-60 font-bold uppercase">Active Assembly Line:</div>
                        {factionQueue.length > 0 ? (
                          factionQueue.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="p-1 bg-neutral-950/80 border border-[#1a2e1a]">
                              <div className="flex justify-between text-[9px]">
                                <span className="font-bold text-white">{item.unitName}</span>
                                <span className="text-emerald-400 font-bold">{Math.round(item.progress)}%</span>
                              </div>
                              <div className="w-full bg-[#132213] h-1.5 border border-[#1a2e1a] mt-0.5 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[8px] opacity-50 italic">Factories idle / accumulating industrial stock</div>
                        )}
                      </div>

                      {/* Manual Requisition Button */}
                      <button
                        onClick={() => {
                          const unitType: UnitType = fId === 'loyalists' ? 'armor' : fId === 'rebels' ? 'infantry' : 'mechanized';
                          const name = `${fac.name} Emergency Division`;
                          spawnReinforcement(fId, unitType, name);
                        }}
                        className="w-full py-1 text-[9px] font-bold uppercase border border-[#1a2e1a] hover:bg-[#1a2e1a] text-yellow-400 hover:text-white mt-1"
                      >
                        + Commission Emergency {fac.name} Unit
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC TERRAIN & FOG OF WAR INTEL */}
          {activeTab === 'terrain' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {/* Fog of War Perspective Selector */}
              <div className="border border-[#1a2e1a] p-2.5 bg-black/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-cyan-400 uppercase flex items-center gap-1">
                    <Radar className="w-3.5 h-3.5" />
                    <span>Radar Fog of War Perspective</span>
                  </span>
                  <span className="text-[8px] font-mono opacity-60">LINE-OF-SIGHT</span>
                </div>
                <p className="text-[9px] opacity-75 leading-relaxed">
                  Switch viewpoint to observe exactly what individual faction radar and patrols detect. Units outside line of sight or concealed in cover remain invisible.
                </p>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setFowPerspective('all')}
                    className={`p-1.5 border text-left text-[9px] font-bold ${
                      fowPerspective === 'all'
                        ? 'bg-white/20 border-white text-white'
                        : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                    }`}
                  >
                    ◎ SPECTATOR (ALL)
                  </button>
                  <button
                    onClick={() => setFowPerspective('loyalists')}
                    className={`p-1.5 border text-left text-[9px] font-bold ${
                      fowPerspective === 'loyalists'
                        ? 'bg-blue-950 border-blue-500 text-blue-300'
                        : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                    }`}
                  >
                    ● LOYALISTS RADAR
                  </button>
                  <button
                    onClick={() => setFowPerspective('rebels')}
                    className={`p-1.5 border text-left text-[9px] font-bold ${
                      fowPerspective === 'rebels'
                        ? 'bg-red-950 border-red-500 text-red-300'
                        : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                    }`}
                  >
                    ● REBELS SCOUTS
                  </button>
                  <button
                    onClick={() => setFowPerspective('coalition')}
                    className={`p-1.5 border text-left text-[9px] font-bold ${
                      fowPerspective === 'coalition'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'border-[#1a2e1a] hover:bg-[#1a2e1a]'
                    }`}
                  >
                    ● ATLANTIC AWACS
                  </button>
                </div>

                {/* Scramble Aerial Reconnaissance */}
                <button
                  onClick={() => {
                    const activeFaction = fowPerspective === 'all' ? 'coalition' : fowPerspective;
                    scrambleAirSortie(activeFaction, 'RECON');
                  }}
                  className="w-full py-1.5 text-[9px] font-bold uppercase border border-cyan-500/80 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 flex items-center justify-center gap-1.5 mt-1"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Launch High-Altitude Recon Sweep (380m Radar)</span>
                </button>
              </div>

              {/* Dynamic Terrain Archetypes & Modifiers */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase">
                  Continuous Vector Terrain Rules
                </div>

                {/* Mud */}
                <div className="p-2 border border-amber-700/60 bg-amber-950/20 text-[9px] space-y-0.5">
                  <div className="font-bold text-amber-400">░░ ALLUVIAL DELTA MUD</div>
                  <div className="opacity-80">
                    • Vehicle Movement: <span className="font-bold text-red-400">-20% Speed</span>
                  </div>
                  <div className="opacity-80">
                    • Heavy Vehicle Strain: <span className="font-bold text-amber-400">+25% Fuel Consumption</span>
                  </div>
                </div>

                {/* Forest */}
                <div className="p-2 border border-green-700/60 bg-green-950/20 text-[9px] space-y-0.5">
                  <div className="font-bold text-green-400">▲▲ PINE TIMBER FORESTS</div>
                  <div className="opacity-80">
                    • Infantry Combat Bonus: <span className="font-bold text-emerald-300">+1 Attack Modifier (+25%)</span>
                  </div>
                  <div className="opacity-80">
                    • Concealment: <span className="font-bold text-emerald-300">Conceals units from aerial visual detection</span>
                  </div>
                </div>

                {/* Hills */}
                <div className="p-2 border border-yellow-700/60 bg-yellow-950/20 text-[9px] space-y-0.5">
                  <div className="font-bold text-yellow-400">▲ SIERRA ROJA HIGHLAND RIDGES</div>
                  <div className="opacity-80">
                    • Defensive Crest: <span className="font-bold text-yellow-300">+2 Defensive Bonus (-40% damage)</span>
                  </div>
                  <div className="opacity-80">
                    • Elevation Advantage: <span className="font-bold text-yellow-300">+50% Line-of-Sight & Radar Range</span>
                  </div>
                </div>

                {/* Urban */}
                <div className="p-2 border border-blue-700/60 bg-blue-950/20 text-[9px] space-y-0.5">
                  <div className="font-bold text-blue-400">▦▦ SANTA MARIA METROPOLITAN</div>
                  <div className="opacity-80">
                    • Urban Cover: <span className="font-bold text-cyan-300">+2 Defensive Cover (-40% damage)</span>
                  </div>
                  <div className="opacity-80">
                    • Reinforced Positions: <span className="font-bold text-cyan-300">Rapid Entrenchment Accumulation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* FOOTER */}
      <footer
        className={`h-6 border-t-2 flex items-center px-4 text-[9px] justify-between shrink-0 z-10 ${
          crtTheme === 'amber' ? 'border-[#b45309] bg-[#140e03]' : 'border-[#1a2e1a] bg-[#0a120a]'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#4af626] rounded-full animate-pulse" />
            SYSTEM_STABLE
          </span>
          <span className="opacity-40 tracking-[2px] hidden md:inline">
            |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
          </span>
        </div>
        <div className="opacity-50 tracking-wider">AUTONOMOUS ENGINE: ON // SPECTATOR MODE: FULL</div>
      </footer>
    </div>
  );
}
