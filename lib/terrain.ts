// PROJECT BRINK - DYNAMIC TERRAIN SYSTEM
// Continuous 2D Vector Terrain Definitions, Zones, and Tactical Modifiers

import { FactionId, UnitType } from '@/app/page';

export type TerrainType = 'MUD' | 'FOREST' | 'HILLS' | 'URBAN' | 'WATER' | 'CLEAR';

export interface TerrainZone {
  id: string;
  name: string;
  type: TerrainType;
  polygon: [number, number][];
  labelPos: [number, number];
  description: string;
  movementPenalty: Record<UnitType, number>; // multiplier, e.g. 0.8 = -20% speed
  attackModifier: Record<UnitType, number>;   // attack damage multiplier
  defenseModifier: Record<UnitType, number>;  // damage received multiplier, e.g. 0.6 = +40% defense
  entrenchmentRate: number;                  // bonus rate multiplier
  concealment: boolean;                      // hides units from long-range vision
}

// Point in polygon test (Ray-casting algorithm)
export function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// TERRAIN ZONES ON THE 1400x850 CARTESIAN VECTOR MAP
export const TERRAIN_ZONES: TerrainZone[] = [
  // 1. MUD / WETLANDS
  {
    id: 'mud-delta',
    name: 'Delta Swamps & Mudflats',
    type: 'MUD',
    polygon: [
      [470, 430],
      [560, 420],
      [620, 480],
      [600, 560],
      [530, 570],
      [460, 510]
    ],
    labelPos: [480, 500],
    description: 'Deep alluvial silt. Reduces vehicle speed by 20%, increases fuel drain.',
    movementPenalty: {
      armor: 0.80,       // -20% vehicle speed
      mechanized: 0.80,  // -20% vehicle speed
      infantry: 0.90,    // -10% infantry
      artillery: 0.70,   // -30% heavy guns
      sam: 0.75
    },
    attackModifier: {
      armor: 0.90,
      mechanized: 0.95,
      infantry: 1.0,
      artillery: 0.90,
      sam: 0.90
    },
    defenseModifier: {
      armor: 1.10,       // slightly vulnerable bogged down
      mechanized: 1.05,
      infantry: 0.95,
      artillery: 1.15,
      sam: 1.10
    },
    entrenchmentRate: 0.6,
    concealment: false
  },
  {
    id: 'mud-south',
    name: 'Rio Negro Silt Marshes',
    type: 'MUD',
    polygon: [
      [440, 710],
      [580, 700],
      [610, 800],
      [490, 840],
      [430, 790]
    ],
    labelPos: [450, 770],
    description: 'Waterlogged marsh basin. Heavy vehicles risk stranding.',
    movementPenalty: {
      armor: 0.80,
      mechanized: 0.80,
      infantry: 0.90,
      artillery: 0.70,
      sam: 0.75
    },
    attackModifier: {
      armor: 0.90,
      mechanized: 0.95,
      infantry: 1.0,
      artillery: 0.90,
      sam: 0.90
    },
    defenseModifier: {
      armor: 1.10,
      mechanized: 1.05,
      infantry: 0.95,
      artillery: 1.15,
      sam: 1.10
    },
    entrenchmentRate: 0.6,
    concealment: false
  },

  // 2. FORESTS / WOODLANDS
  {
    id: 'forest-sierra',
    name: 'Sierra Pine Canopy',
    type: 'FOREST',
    polygon: [
      [140, 310],
      [270, 280],
      [310, 420],
      [240, 470],
      [130, 430]
    ],
    labelPos: [150, 370],
    description: 'Dense coniferous timber. +1 combat modifier (+25% damage) for infantry; conceals units.',
    movementPenalty: {
      armor: 0.70,       // -30% vehicles in dense trees
      mechanized: 0.75,
      infantry: 1.0,     // infantry agile in brush
      artillery: 0.65,
      sam: 0.70
    },
    attackModifier: {
      armor: 0.85,
      mechanized: 0.90,
      infantry: 1.25,    // +1 combat modifier (+25% ambush power)
      artillery: 0.90,
      sam: 1.0
    },
    defenseModifier: {
      armor: 0.85,
      mechanized: 0.80,
      infantry: 0.75,    // +25% defense for foot soldiers
      artillery: 0.80,
      sam: 0.80
    },
    entrenchmentRate: 1.3,
    concealment: true
  },
  {
    id: 'forest-north',
    name: 'San Pietro Northern Taiga',
    type: 'FOREST',
    polygon: [
      [680, 70],
      [830, 60],
      [870, 180],
      [760, 220],
      [660, 160]
    ],
    labelPos: [690, 140],
    description: 'Old-growth woodland. Excellent ambush terrain for partisan cadres.',
    movementPenalty: {
      armor: 0.70,
      mechanized: 0.75,
      infantry: 1.0,
      artillery: 0.65,
      sam: 0.70
    },
    attackModifier: {
      armor: 0.85,
      mechanized: 0.90,
      infantry: 1.25,
      artillery: 0.90,
      sam: 1.0
    },
    defenseModifier: {
      armor: 0.85,
      mechanized: 0.80,
      infantry: 0.75,
      artillery: 0.80,
      sam: 0.80
    },
    entrenchmentRate: 1.3,
    concealment: true
  },
  {
    id: 'forest-east',
    name: 'Eastern Valley Woods',
    type: 'FOREST',
    polygon: [
      [970, 390],
      [1120, 380],
      [1140, 520],
      [1040, 550],
      [960, 480]
    ],
    labelPos: [990, 460],
    description: 'Thick wooded valley screen. Natural barrier against flanking armor.',
    movementPenalty: {
      armor: 0.70,
      mechanized: 0.75,
      infantry: 1.0,
      artillery: 0.65,
      sam: 0.70
    },
    attackModifier: {
      armor: 0.85,
      mechanized: 0.90,
      infantry: 1.25,
      artillery: 0.90,
      sam: 1.0
    },
    defenseModifier: {
      armor: 0.85,
      mechanized: 0.80,
      infantry: 0.75,
      artillery: 0.80,
      sam: 0.80
    },
    entrenchmentRate: 1.3,
    concealment: true
  },

  // 3. HILLS / MOUNTAINS
  {
    id: 'hills-sierra',
    name: 'Sierra Roja Ridge',
    type: 'HILLS',
    polygon: [
      [110, 480],
      [330, 430],
      [410, 560],
      [370, 710],
      [210, 730],
      [100, 640]
    ],
    labelPos: [130, 520],
    description: 'Rugged crags. +2 defensive bonus (40% damage resistance), +50% vision range.',
    movementPenalty: {
      armor: 0.50,       // -50% armor climbing
      mechanized: 0.60,
      infantry: 0.85,
      artillery: 0.45,
      sam: 0.50
    },
    attackModifier: {
      armor: 0.80,
      mechanized: 0.85,
      infantry: 1.10,
      artillery: 1.20,   // elevation advantage
      sam: 1.10
    },
    defenseModifier: {
      armor: 0.60,       // +2 DEFENSIVE BONUS (-40% damage taken)
      mechanized: 0.60,
      infantry: 0.55,    // +45% defense
      artillery: 0.60,
      sam: 0.65
    },
    entrenchmentRate: 1.5,
    concealment: true
  },
  {
    id: 'hills-monte-oro',
    name: 'Monte Oro Heights',
    type: 'HILLS',
    polygon: [
      [170, 70],
      [360, 50],
      [410, 190],
      [260, 240],
      [140, 170]
    ],
    labelPos: [180, 120],
    description: 'Steep granite mass. Strategic mountain redoubt with fortified caves.',
    movementPenalty: {
      armor: 0.50,
      mechanized: 0.60,
      infantry: 0.85,
      artillery: 0.45,
      sam: 0.50
    },
    attackModifier: {
      armor: 0.80,
      mechanized: 0.85,
      infantry: 1.10,
      artillery: 1.25,
      sam: 1.10
    },
    defenseModifier: {
      armor: 0.60,
      mechanized: 0.60,
      infantry: 0.55,
      artillery: 0.60,
      sam: 0.65
    },
    entrenchmentRate: 1.5,
    concealment: true
  },
  {
    id: 'hills-east',
    name: 'Volskan Border Escarpment',
    type: 'HILLS',
    polygon: [
      [1040, 140],
      [1220, 130],
      [1260, 310],
      [1130, 330],
      [1030, 240]
    ],
    labelPos: [1060, 200],
    description: 'Elevated plateau. Ideal gun emplacements for heavy howitzer batteries.',
    movementPenalty: {
      armor: 0.50,
      mechanized: 0.60,
      infantry: 0.85,
      artillery: 0.45,
      sam: 0.50
    },
    attackModifier: {
      armor: 0.80,
      mechanized: 0.85,
      infantry: 1.10,
      artillery: 1.25,
      sam: 1.10
    },
    defenseModifier: {
      armor: 0.60,
      mechanized: 0.60,
      infantry: 0.55,
      artillery: 0.60,
      sam: 0.65
    },
    entrenchmentRate: 1.5,
    concealment: true
  },

  // 4. URBAN / CITY CENTERS
  {
    id: 'urban-capital',
    name: 'Santa Maria Metropolis',
    type: 'URBAN',
    polygon: [
      [720, 490],
      [840, 480],
      [860, 620],
      [750, 630],
      [710, 560]
    ],
    labelPos: [730, 520],
    description: 'Dense masonry and administrative avenues. +2 defensive bonus, entrenchment rate +50%.',
    movementPenalty: {
      armor: 0.75,       // tight streets
      mechanized: 0.80,
      infantry: 0.95,
      artillery: 0.70,
      sam: 0.75
    },
    attackModifier: {
      armor: 0.85,
      mechanized: 0.90,
      infantry: 1.15,
      artillery: 0.80,
      sam: 0.85
    },
    defenseModifier: {
      armor: 0.60,       // +2 DEFENSIVE BONUS (-40% damage taken in buildings)
      mechanized: 0.65,
      infantry: 0.50,    // +50% defense in urban rubble
      artillery: 0.60,
      sam: 0.60
    },
    entrenchmentRate: 1.5,
    concealment: true
  },
  {
    id: 'urban-port',
    name: 'Port Bella Docks & Warehouses',
    type: 'URBAN',
    polygon: [
      [860, 670],
      [980, 660],
      [990, 780],
      [890, 790],
      [850, 730]
    ],
    labelPos: [870, 710],
    description: 'Industrial berths, rail yards, and cargo cranes. Heavy fortified cover.',
    movementPenalty: {
      armor: 0.75,
      mechanized: 0.80,
      infantry: 0.95,
      artillery: 0.70,
      sam: 0.75
    },
    attackModifier: {
      armor: 0.85,
      mechanized: 0.90,
      infantry: 1.15,
      artillery: 0.80,
      sam: 0.85
    },
    defenseModifier: {
      armor: 0.60,
      mechanized: 0.65,
      infantry: 0.50,
      artillery: 0.60,
      sam: 0.60
    },
    entrenchmentRate: 1.5,
    concealment: true
  }
];

// Helper to determine terrain at any (x, y) coordinate
export function getTerrainAt(
  x: number,
  y: number,
  bridges?: { isDestroyed: boolean; x: number; y: number }[]
): { type: TerrainType; zone?: TerrainZone; isRiver: boolean } {
  // 1. River check (continuous spline around x = 520)
  const isNearRiverSpline =
    (y < 180 && Math.abs(x - (510 - (y / 180) * 50)) < 24) ||
    (y >= 180 && y < 520 && Math.abs(x - (460 + ((y - 180) / 340) * 60)) < 26) ||
    (y >= 520 && y < 850 && Math.abs(x - (520 - ((y - 520) / 330) * 30)) < 26);

  if (isNearRiverSpline) {
    const onBridge = bridges?.some(
      b => !b.isDestroyed && Math.abs(x - b.x) < 28 && Math.abs(y - b.y) < 20
    );
    if (!onBridge) {
      return { type: 'WATER', isRiver: true };
    }
  }

  // 2. Check defined zones (Urban first, then Hills, Forest, Mud)
  for (const zone of TERRAIN_ZONES) {
    if (pointInPolygon(x, y, zone.polygon)) {
      return { type: zone.type, zone, isRiver: false };
    }
  }

  // 3. Default clear terrain
  return { type: 'CLEAR', isRiver: false };
}
