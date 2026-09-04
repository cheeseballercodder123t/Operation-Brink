// PROJECT BRINK - DIPLOMATIC AI MODULE
// Autonomous Diplomatic Treaties, Alliances, Sanctions, Espionage, and Cold War Brinkmanship

import { FactionId, Transmission, Unit, ControlNode } from '@/app/page';

export type DiplomaticStatus =
  | 'TOTAL_WAR'
  | 'COLD_WAR_TENSION'
  | 'CEASEFIRE'
  | 'NON_AGGRESSION'
  | 'PROXY_ALLIANCE'
  | 'FULL_ALLIANCE';

export interface DiplomaticRelation {
  factionA: FactionId;
  factionB: FactionId;
  status: DiplomaticStatus;
  tension: number; // -100 (hostile) to +100 (brotherly alliance)
  activeTreaties: string[];
  activeSanctions: string[];
  espionageAlert?: {
    operationName: string;
    agentFaction: FactionId;
    description: string;
    expiresTick: number;
  };
  lastInteraction: string;
}

export interface DiplomaticLedger {
  relations: Record<string, DiplomaticRelation>;
  recentEvents: string[];
  activeProposals: {
    id: string;
    from: FactionId;
    to: FactionId;
    type: 'PEACE_TREATY' | 'ALLIANCE_PACT' | 'TRADE_CONCESSION' | 'DEMILITARIZED_ZONE';
    terms: string;
    expiresTick: number;
  }[];
}

export function getRelationKey(a: FactionId, b: FactionId): string {
  return [a, b].sort().join('::');
}

export function createInitialDiplomacy(): DiplomaticLedger {
  const relations: Record<string, DiplomaticRelation> = {};

  const initRel = (
    a: FactionId,
    b: FactionId,
    status: DiplomaticStatus,
    tension: number,
    treaties: string[],
    sanctions: string[]
  ) => {
    const key = getRelationKey(a, b);
    relations[key] = {
      factionA: a,
      factionB: b,
      status,
      tension,
      activeTreaties: treaties,
      activeSanctions: sanctions,
      lastInteraction: 'Initial Status Established'
    };
  };

  // Loyalists <-> Rebels: Civil War
  initRel('loyalists', 'rebels', 'TOTAL_WAR', -95, [], ['Internal Arms Embargo']);

  // Loyalists <-> Coalition: Western Sponsorship
  initRel('loyalists', 'coalition', 'PROXY_ALLIANCE', 85, ['Atlantic Bilateral Assistance Protocol'], []);

  // Loyalists <-> Volskan: Cold War Hostility
  initRel('loyalists', 'volskan', 'COLD_WAR_TENSION', -65, [], ['Maritime Transit Restrictions']);

  // Rebels <-> Volskan: Eastern Sponsorship
  initRel('rebels', 'volskan', 'PROXY_ALLIANCE', 80, ['Treaty of Solidarity & People’s Aid'], []);

  // Rebels <-> Coalition: Ideological Enemies
  initRel('rebels', 'coalition', 'COLD_WAR_TENSION', -80, [], ['Naval Contraband Blockade']);

  // Coalition <-> Volskan: Cold War Superpower Brinkmanship
  initRel('coalition', 'volskan', 'COLD_WAR_TENSION', -50, ['1958 Geneva Maritime Passage Accord'], ['Strategic Metals Sanction']);

  return {
    relations,
    recentEvents: [
      '1963 Cold War balance of power codified.',
      'Atlantic Taskforce Seventh enforces coastal sea corridor.',
      'Volskan Stavka ships military hardware to Liberation Cadres.'
    ],
    activeProposals: []
  };
}

// Autonomous Diplomatic AI Step
export function stepDiplomaticAI(
  ledger: DiplomaticLedger,
  factions: Record<string, { treasury: number; fuelReserves: number; resolve: number }>,
  units: Unit[],
  nodes: ControlNode[],
  defcon: number,
  simTick: number,
  simTimeStr: string
): { updatedLedger: DiplomaticLedger; newTransmissions: Transmission[] } {
  const nextRelations = { ...ledger.relations };
  const recentEvents = [...ledger.recentEvents];
  const newTransmissions: Transmission[] = [];

  // Calculate faction strength
  const strengthByFaction: Record<string, number> = {
    loyalists: 0,
    rebels: 0,
    coalition: 0,
    volskan: 0
  };

  for (const u of units) {
    if (u.strength > 0 && strengthByFaction[u.factionId] !== undefined) {
      strengthByFaction[u.factionId] += u.strength;
    }
  }

  // 1. Check Superpower Escalation based on DEFCON
  const cvKey = getRelationKey('coalition', 'volskan');
  if (nextRelations[cvKey]) {
    const cvRel = { ...nextRelations[cvKey] };
    if (defcon <= 2 && !cvRel.activeSanctions.includes('Total Hydrocarbon Embargo')) {
      cvRel.activeSanctions.push('Total Hydrocarbon Embargo');
      cvRel.tension = Math.max(-100, cvRel.tension - 25);
      cvRel.status = 'TOTAL_WAR';
      cvRel.lastInteraction = 'DEFCON 2: Full Superpower Embargo & Naval Interdiction Declared';
      recentEvents.unshift('ALERT: Atlantic Coalition and Volskan Union declare mutual trade embargoes!');

      newTransmissions.push({
        id: `tx-dip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-1`,
        timestamp: simTimeStr,
        factionId: 'coalition',
        callsign: 'ATLANTIC STATE DEPT',
        message: 'COMMUNIQUE: TOTAL HYDROCARBON EMBARGO DECREED AGAINST VOLSKAN MARITIME TRANSPORTS. NAVAL BOARDING AUTHORIZED.',
        priority: 'FLASH'
      });
    }
    nextRelations[cvKey] = cvRel;
  }

  // 2. Civil War Dynamics (Loyalists vs Rebels)
  const lrKey = getRelationKey('loyalists', 'rebels');
  if (nextRelations[lrKey]) {
    const lrRel = { ...nextRelations[lrKey] };
    const loyStrength = strengthByFaction['loyalists'];
    const rebStrength = strengthByFaction['rebels'];

    // If one side is severely battered, they petition for peace or ceasefires
    if (loyStrength < 80 && rebStrength > 150 && lrRel.status === 'TOTAL_WAR') {
      lrRel.status = 'CEASEFIRE';
      lrRel.activeTreaties.push('Armistice of Santa Maria (Temporary Ceasefire)');
      lrRel.tension = -40;
      lrRel.lastInteraction = 'Loyalists offer armistice to regroup shattered garrison';
      recentEvents.unshift('DIPLOMACY: San Pietro Loyalists sign provisional armistice with Liberation Front!');

      newTransmissions.push({
        id: `tx-dip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-2`,
        timestamp: simTimeStr,
        factionId: 'loyalists',
        callsign: 'PRESIDENTIAL PALACE',
        message: 'DISPATCH TO GUERRILLA HIGH ENVOYS: CEASEFIRE OFFER DELIVERED. WE PROPOSE 48-HOUR TRUCE TO EVACUATE CASUALTIES.',
        priority: 'HIGH'
      });
    } else if (rebStrength < 70 && loyStrength > 140 && lrRel.status === 'TOTAL_WAR') {
      lrRel.status = 'CEASEFIRE';
      lrRel.activeTreaties.push('Guerilla Mountain Demilitarized Accord');
      lrRel.tension = -45;
      lrRel.lastInteraction = 'Rebels offer mountain truce to prevent total encirclement';
      recentEvents.unshift('DIPLOMACY: Liberation Front cadres agree to provisional cessation of hostilities.');

      newTransmissions.push({
        id: `tx-dip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-3`,
        timestamp: simTimeStr,
        factionId: 'rebels',
        callsign: 'COMANDANCIA SIERRA',
        message: 'RADIO BULLETIN: PROVISIONAL TRUCE DECLARED ALONG SECTOR 4 RIVER LINE. REGROUP CADRES TO SANCTUARY.',
        priority: 'HIGH'
      });
    }

    nextRelations[lrKey] = lrRel;
  }

  // 3. Autonomous Espionage & Covert Infiltration
  if (simTick % 45 === 0) {
    const covertRoll = Math.random();
    if (covertRoll < 0.35) {
      // Volskan KGB / GRU Sabotage
      const targetBridge = 'Delta Causeway';
      recentEvents.unshift(`COVERT INTEL: Volskan intelligence operatives planted demolition charges near ${targetBridge}!`);
      newTransmissions.push({
        id: `tx-esp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-1`,
        timestamp: simTimeStr,
        factionId: 'volskan',
        callsign: 'STAVKA RECONNAISSANCE DIREKTORAT',
        message: 'KAPITAN D-7 CONFIRMS CHARGES PRIMED AT BRIDGE VIADUCT. AWAITING SIGNAL TO CUT LOYALIST REINFORCEMENT LINE.',
        priority: 'FLASH'
      });
    } else if (covertRoll > 0.70) {
      // CIA / Atlantic Intelligence Intercept
      recentEvents.unshift('COVERT INTEL: Atlantic crypto-analysts broke Volskan cipher, intercepting artillery firing coordinates!');
      newTransmissions.push({
        id: `tx-esp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-2`,
        timestamp: simTimeStr,
        factionId: 'coalition',
        callsign: 'PROJECT VENONA INTERCEPT',
        message: 'TOP SECRET COLD WAR MEMORANDUM: ENEMY 152MM HOWITZER TARGET LIST DECRYPTED. ADVANCE SQUADRONS WARNED.',
        priority: 'HIGH'
      });
    }
  }

  return {
    updatedLedger: {
      relations: nextRelations,
      recentEvents: recentEvents.slice(0, 25),
      activeProposals: ledger.activeProposals.filter(p => p.expiresTick > simTick)
    },
    newTransmissions
  };
}
