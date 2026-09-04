// PROJECT BRINK - DETAILED ECONOMIC SIMULATION
// Resource Extraction, Industrial Output, Trade Convoys, and Autonomous Reinforcement Training

import { FactionId, ControlNode, Unit, UnitType } from '@/app/page';
import { DiplomaticLedger, getRelationKey } from './diplomacy';

export interface FactionResources {
  oil: number;                  // barrels / fuel reserve
  oilCapacity: number;
  oilRate: number;              // net delta per minute
  industrialProduction: number; // factory output points (IP)
  ipCapacity: number;
  ipRate: number;
  manpower: number;             // recruitable population
  manpowerCapacity: number;
  manpowerRate: number;
  treasury: number;             // financial capital ($ / Rubles / Pesos)
  treasuryRate: number;
}

export interface TradeRoute {
  id: string;
  fromFaction: FactionId;
  toFaction: FactionId;
  cargo: string;
  volume: string;
  active: boolean;
  status: 'ACTIVE_CONVOY' | 'EMBARGO_BLOCKED' | 'WAR_INTERDICTED';
  benefitDescription: string;
}

export interface ProductionQueueItem {
  id: string;
  factionId: FactionId;
  unitType: UnitType;
  unitName: string;
  progress: number; // 0 to 100%
  totalCost: {
    oil: number;
    ip: number;
    manpower: number;
    treasury: number;
  };
}

export interface EconomyState {
  factionResources: Record<FactionId, FactionResources>;
  tradeRoutes: TradeRoute[];
  productionQueues: ProductionQueueItem[];
  totalUnitsProduced: number;
}

export const UNIT_BUILD_COSTS: Record<
  UnitType,
  { oil: number; ip: number; manpower: number; treasury: number; name: string }
> = {
  armor: {
    oil: 110,
    ip: 75,
    manpower: 45,
    treasury: 90,
    name: 'Heavy Armored Battalion'
  },
  mechanized: {
    oil: 70,
    ip: 55,
    manpower: 55,
    treasury: 65,
    name: 'Mechanized Infantry Bde'
  },
  infantry: {
    oil: 15,
    ip: 25,
    manpower: 90,
    treasury: 35,
    name: 'Rifle Contingent'
  },
  artillery: {
    oil: 35,
    ip: 70,
    manpower: 40,
    treasury: 80,
    name: 'Heavy Howitzer Battery'
  },
  sam: {
    oil: 30,
    ip: 65,
    manpower: 35,
    treasury: 75,
    name: 'Air Defense Radar Battery'
  }
};

export function createInitialEconomy(): EconomyState {
  return {
    factionResources: {
      loyalists: {
        oil: 580,
        oilCapacity: 1200,
        oilRate: 24,
        industrialProduction: 320,
        ipCapacity: 800,
        ipRate: 28,
        manpower: 850,
        manpowerCapacity: 2000,
        manpowerRate: 30,
        treasury: 1450,
        treasuryRate: 35
      },
      rebels: {
        oil: 310,
        oilCapacity: 800,
        oilRate: 12,
        industrialProduction: 210,
        ipCapacity: 600,
        ipRate: 16,
        manpower: 1100,
        manpowerCapacity: 2500,
        manpowerRate: 40,
        treasury: 620,
        treasuryRate: 18
      },
      coalition: {
        oil: 2400,
        oilCapacity: 4000,
        oilRate: 45,
        industrialProduction: 1800,
        ipCapacity: 3500,
        ipRate: 50,
        manpower: 3200,
        manpowerCapacity: 5000,
        manpowerRate: 25,
        treasury: 4800,
        treasuryRate: 60
      },
      volskan: {
        oil: 1950,
        oilCapacity: 3500,
        oilRate: 40,
        industrialProduction: 1600,
        ipCapacity: 3200,
        ipRate: 55,
        manpower: 3800,
        manpowerCapacity: 6000,
        manpowerRate: 35,
        treasury: 3900,
        treasuryRate: 50
      },
      unified: {
        oil: 2800,
        oilCapacity: 5000,
        oilRate: 65,
        industrialProduction: 2400,
        ipCapacity: 5000,
        ipRate: 70,
        manpower: 4500,
        manpowerCapacity: 8000,
        manpowerRate: 80,
        treasury: 5200,
        treasuryRate: 90
      }
    },
    tradeRoutes: [
      {
        id: 'trade-atlantic-loyalists',
        fromFaction: 'coalition',
        toFaction: 'loyalists',
        cargo: 'Aviation Fuel & Tank Spares',
        volume: '+18 Oil / +14 IP / min',
        active: true,
        status: 'ACTIVE_CONVOY',
        benefitDescription: 'Maritime sea corridor from Atlantic fleet to Port Bella'
      },
      {
        id: 'trade-volskan-rebels',
        fromFaction: 'volskan',
        toFaction: 'rebels',
        cargo: '152mm Munitions & Machine Parts',
        volume: '+12 Oil / +16 IP / min',
        active: true,
        status: 'ACTIVE_CONVOY',
        benefitDescription: 'Clandestine rail cargo across Eastern pass into Sierra'
      },
      {
        id: 'trade-loyalist-oil-export',
        fromFaction: 'loyalists',
        toFaction: 'coalition',
        cargo: 'Crude Petroleum Royalties',
        volume: '+$28 Treasury / min',
        active: true,
        status: 'ACTIVE_CONVOY',
        benefitDescription: 'Export royalties from Black Gold Refinery'
      }
    ],
    productionQueues: [],
    totalUnitsProduced: 0
  };
}

// Autonomous Economy Step Loop
export function stepEconomy(
  economy: EconomyState,
  nodes: ControlNode[],
  units: Unit[],
  diplomacy: DiplomaticLedger,
  dt: number,
  simTick: number,
  spawnReinforcementCallback: (factionId: FactionId, type: UnitType, name: string) => void
): EconomyState {
  const nextRes = { ...economy.factionResources };
  const nextTrade = economy.tradeRoutes.map(tr => ({ ...tr }));
  let nextQueues = [...economy.productionQueues];
  let producedCount = economy.totalUnitsProduced;

  // 1. RESOURCE EXTRACTION FROM CONTROLLED NODES
  for (const fId of ['loyalists', 'rebels', 'coalition', 'volskan', 'unified'] as FactionId[]) {
    if (!nextRes[fId]) continue;
    const r = { ...nextRes[fId] };

    // Baseline generation
    let dOil = (10 / 60) * dt;
    let dIp = (12 / 60) * dt;
    let dMan = (15 / 60) * dt;
    let dCash = (15 / 60) * dt;

    // Additional yields from nodes
    for (const node of nodes) {
      if (node.owner === fId) {
        if (node.type === 'OIL_REFINERY') {
          dOil += (45 / 60) * dt; // massive refinery yield
          dCash += (20 / 60) * dt;
        } else if (node.type === 'CAPITAL') {
          dMan += (35 / 60) * dt;
          dIp += (25 / 60) * dt;
          dCash += (35 / 60) * dt;
        } else if (node.type === 'PORT') {
          dIp += (20 / 60) * dt;
          dCash += (30 / 60) * dt;
          dOil += (10 / 60) * dt;
        } else if (node.type === 'DEPOT') {
          dIp += (15 / 60) * dt;
          dOil += (12 / 60) * dt;
        } else if (node.type === 'REDOUT') {
          dMan += (20 / 60) * dt;
        }
      }
    }

    // 2. CHECK TRADE ROUTE FLOWS & SANCTIONS
    for (const tr of nextTrade) {
      const relKey = getRelationKey(tr.fromFaction, tr.toFaction);
      const rel = diplomacy.relations[relKey];

      if (rel && (rel.status === 'TOTAL_WAR' || rel.activeSanctions.length > 0)) {
        tr.active = false;
        tr.status = rel.activeSanctions.length > 0 ? 'EMBARGO_BLOCKED' : 'WAR_INTERDICTED';
      } else {
        tr.active = true;
        tr.status = 'ACTIVE_CONVOY';

        if (tr.toFaction === fId) {
          if (tr.id === 'trade-atlantic-loyalists') {
            dOil += (18 / 60) * dt;
            dIp += (14 / 60) * dt;
          } else if (tr.id === 'trade-volskan-rebels') {
            dOil += (12 / 60) * dt;
            dIp += (16 / 60) * dt;
          }
        }
        if (tr.fromFaction === fId && tr.id === 'trade-loyalist-oil-export') {
          dCash += (28 / 60) * dt;
        }
      }
    }

    r.oil = Math.min(r.oilCapacity, Math.max(0, r.oil + dOil));
    r.industrialProduction = Math.min(r.ipCapacity, Math.max(0, r.industrialProduction + dIp));
    r.manpower = Math.min(r.manpowerCapacity, Math.max(0, r.manpower + dMan));
    r.treasury = Math.max(0, r.treasury + dCash);

    // Compute rates per minute
    r.oilRate = Math.round(dOil * (60 / dt));
    r.ipRate = Math.round(dIp * (60 / dt));
    r.manpowerRate = Math.round(dMan * (60 / dt));
    r.treasuryRate = Math.round(dCash * (60 / dt));

    nextRes[fId] = r;
  }

  // 3. AUTONOMOUS PRODUCTION QUEUE / REINFORCEMENTS
  // Advance current items in queue
  nextQueues = nextQueues
    .map(item => {
      const updated = { ...item, progress: item.progress + dt * 15 }; // takes ~7 seconds per unit
      if (updated.progress >= 100) {
        spawnReinforcementCallback(updated.factionId, updated.unitType, updated.unitName);
        producedCount += 1;
      }
      return updated;
    })
    .filter(item => item.progress < 100);

  // If a faction has fewer than 4 units and has surplus resources, queue new reinforcement!
  if (simTick % 30 === 0 && nextQueues.length < 3) {
    for (const fId of ['loyalists', 'rebels', 'coalition', 'volskan'] as FactionId[]) {
      const activeUnitCount = units.filter(u => u.factionId === fId && u.strength > 0).length;
      const r = nextRes[fId];

      if (activeUnitCount < 4 && r) {
        // Choose unit type to produce
        const choice: UnitType =
          fId === 'loyalists'
            ? activeUnitCount % 2 === 0 ? 'armor' : 'mechanized'
            : fId === 'rebels'
            ? activeUnitCount % 2 === 0 ? 'infantry' : 'sam'
            : fId === 'volskan'
            ? 'artillery'
            : 'mechanized';

        const cost = UNIT_BUILD_COSTS[choice];

        if (
          r.oil >= cost.oil &&
          r.industrialProduction >= cost.ip &&
          r.manpower >= cost.manpower &&
          r.treasury >= cost.treasury &&
          !nextQueues.some(q => q.factionId === fId)
        ) {
          // Deduct resources
          r.oil -= cost.oil;
          r.industrialProduction -= cost.ip;
          r.manpower -= cost.manpower;
          r.treasury -= cost.treasury;

          const numSuffix = producedCount + 1;
          const unitName = `${fId.toUpperCase()} Reinforcement Div #${numSuffix} (${cost.name})`;

          nextQueues.push({
            id: `prod-${Date.now()}-${fId}-${Math.random().toString(36).slice(2, 8)}`,
            factionId: fId,
            unitType: choice,
            unitName,
            progress: 0,
            totalCost: cost
          });
        }
      }
    }
  }

  return {
    factionResources: nextRes,
    tradeRoutes: nextTrade,
    productionQueues: nextQueues,
    totalUnitsProduced: producedCount
  };
}
