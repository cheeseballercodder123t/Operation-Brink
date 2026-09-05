'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Newspaper, Globe, Radio, ShieldAlert, Sparkles, AlertCircle, Stamp } from 'lucide-react';
import { FlashpointBattle } from '@/lib/warRoom';
import { BattleLithographSketch } from './BattleLithographSketch';

export type MastheadType = 'CHRONICLE' | 'VOICE_SIERRA' | 'REUTERS';

interface NewspaperArticle {
  mastheadName: string;
  mastheadMotto: string;
  headline: string;
  subheadline: string;
  byline: string;
  dateline: string;
  paragraphs: string[];
  keyBulletins: string[];
  propagandaAngle: string;
  editorialSketchDesc: string;
  oilPriceShift: string;
  unSecurityCouncilReaction: string;
  model?: string;
}

interface NewspaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  battle: FlashpointBattle | null;
  simTimeStr: string;
}

function generateInstantArticle(
  battle: FlashpointBattle | null,
  masthead: MastheadType,
  simTime: string
): NewspaperArticle {
  const sector = battle?.sectorName || 'Delta Causeway Bridge';
  const victor = battle?.victorFactionId || (battle?.attackerStrength && battle.attackerStrength > (battle.defenderStrength || 50) ? battle.attackerFactionId : 'loyalists');
  const victorLosses = battle?.casualtiesDefender ? Math.round(battle.casualtiesDefender * 0.45) : 160;
  const defeatedLosses = battle?.casualtiesAttacker ? Math.round(battle.casualtiesAttacker * 1.15) : 440;
  const armorLost = (battle?.armorLostAttacker || 2) + (battle?.armorLostDefender || 2);
  const airLost = battle?.aircraftLost || 1;

  if (masthead === 'CHRONICLE') {
    return {
      mastheadName: 'THE SAN PIETRO CHRONICLE',
      mastheadMotto: 'The Voice of National Order & Sovereign Integrity — Daily Circulation 45,000',
      headline: victor === 'loyalists'
        ? `PRESIDENTIAL FORCES CRUSH GUERRILLA THRUST AT ${sector.toUpperCase()}`
        : `HEROIC STAND AT ${sector.toUpperCase()}: STRATEGIC CONSOLIDATION ORDERED`,
      subheadline: `General Staff reports heavy enemy destruction as 1st Armored Division holds critical lines against foreign-backed cadres.`,
      byline: 'By Captain Alberto Morales, War Correspondent with General Staff',
      dateline: `OCTOBER 14, 1963 — SANTA MARIA (STATE CABLE)`,
      paragraphs: [
        `Under direct orders from the Military Council, loyal government formations met the hostile assault along the ${sector} in force early this morning. Waves of motorized armor and entrenched infantry repelled enemy vanguard detachments with overwhelming 152mm artillery counter-battery fire.`,
        `Battlefield reconnaissance confirms the enemy sustained catastrophic attrition, with over ${defeatedLosses} hostile combatants neutralized and ${armorLost} armored fighting vehicles destroyed. Friendly units carried out tactical echelon maneuvers to secure the causeway flanks and maintain unbroken petroleum pipelines.`,
        `The Ministry of Information assures the public that all vital infrastructure remains under firm sovereign control. Foreign diplomatic protests have been dismissed by the Premier as baseless provocations.`
      ],
      keyBulletins: [
        `Hostile combatants neutralized: ~${defeatedLosses} cadres`,
        `Armor destroyed in engagement: ${armorLost} mechanized units`,
        `Air defense batteries active: ${airLost} hostile sorties repelled`,
        `Petroleum transport corridors secured under military guard`
      ],
      propagandaAngle: 'Strict Loyalist Junta censorship. Setbacks framed as heroic retrograde consolidation; regime armor glorified.',
      editorialSketchDesc: 'Client-side vector lithograph displaying grease-pencil assault vectors and pulverized enemy NATO counters.',
      oilPriceShift: '+$1.40 / bbl (State rationing quotas steady)',
      unSecurityCouncilReaction: 'Loyalist delegation rejects Geneva observation mission as unlawful foreign interference.',
      model: 'TELEMETRY VINTAGE LITHOGRAPH'
    };
  }

  if (masthead === 'VOICE_SIERRA') {
    return {
      mastheadName: 'VOICE OF THE SIERRA — COMMUNIQUE',
      mastheadMotto: 'Clandestine Revolutionary Leaflet — Printed in Secret by Sierra Maestra Press Cadre',
      headline: victor === 'rebels'
        ? `LIBERATION CADRES SMASH JUNTA FLANK AT ${sector.toUpperCase()}`
        : `GUERRILLA BRIGADES STRIKE CORRUPT REGIME AT ${sector.toUpperCase()}`,
      subheadline: `Peasant vanguard ambushes imperialist tank column; heavy howitzers captured as revolutionary lines advance.`,
      byline: 'From Comandancia General, Liberated Mountain Sector',
      dateline: `OCTOBER 14, 1963 — SIERRA MADRE FREE ZONE`,
      paragraphs: [
        `In the dense mist of dawn, the 3rd Revolutionary Vanguard Brigade sprung a devastating flanking pincer against regime forces advancing through ${sector}. Armed with mountain anti-tank rifles and captured rocket munitions, our fighters severed the enemy's rear logistics line.`,
        `Panicked regime conscripts fled their positions as 152mm howitzer salvos hammered the fortified causeway. More than ${defeatedLosses} soldiers of the dictator's guard were routed or captured, alongside ${armorLost} smoldering M48 tanks left burning on the riverbank.`,
        `The Comandancia declares the entire river corridor liberated. We call upon workers, refinery technicians, and students to join the general strike and complete the expulsion of foreign imperialist puppets.`
      ],
      keyBulletins: [
        `Junta forces routed / captured: ~${defeatedLosses} troops`,
        `Imperialist tanks destroyed: ${armorLost} armored hulls`,
        `Downed reconnaissance flights: ${airLost} aircraft`,
        `Peasant self-defense militias expanding defensive perimeter`
      ],
      propagandaAngle: 'Clandestine revolutionary prose. Celebrates guerrilla victory, anti-imperialist solidarity, and captured arms.',
      editorialSketchDesc: 'Underground tele-facsimile sketch tracing guerrilla envelopment arcs and destroyed enemy armor.',
      oilPriceShift: '+$2.75 / bbl (Black Gold refinery pipelines halted by workers)',
      unSecurityCouncilReaction: 'Revolutionary Comandancia warns foreign superpowers against landing expeditionary troops.',
      model: 'TELEMETRY VINTAGE LITHOGRAPH'
    };
  }

  return {
    mastheadName: 'INTERNATIONAL HERALD & REUTERS WIRE',
    mastheadMotto: 'Geneva & London Wire Service — Unbiased Global Geopolitical Intelligence',
    headline: `BLOODY ENGAGEMENT AT ${sector.toUpperCase()}: HUNDREDS CASUALTIES AS ARMOR CLASHES`,
    subheadline: `Superpower alert levels raised after heavy battle erupts in strategic San Pietro corridor; crude futures surge.`,
    byline: 'By Arthur H. Sterling, Chief Geopolitical Correspondent',
    dateline: `OCTOBER 14, 1963 — GENEVA WIRE DESK (SPECIAL DISPATCH)`,
    paragraphs: [
      `Fierce fighting involving heavy armored regiments and tactical air sorties erupted across the ${sector} early Tuesday, according to confirmed military telegrams and satellite intercept cables. Both sides committed multiple division-scale formations in a bid to control key bridges and fuel depots.`,
      `Verified casualty tallies indicate approximately ${victorLosses} victor troops and ${defeatedLosses} opposing combatants killed or wounded during the four-hour artillery duel. At least ${armorLost} armored fighting vehicles were reduced to wreckage amid concentrated 152mm howitzer fire.`,
      `In Washington and Moscow, defense ministries placed regional naval task forces on high alert. The United Nations Security Council has scheduled an emergency midnight session, as international commodity markets registered immediate shocks to global crude supplies.`
    ],
    keyBulletins: [
      `Total battle casualties: ~${victorLosses + defeatedLosses} military personnel`,
      `Armored combat vehicles confirmed destroyed: ${armorLost}`,
      `Combat aircraft downed by surface-to-air missiles: ${airLost}`,
      `DEFCON strategic readiness index elevated across European commands`
    ],
    propagandaAngle: 'Objective Associated Press / Reuters cable. Focuses on exact troop loss numbers, crude oil pricing, and UN escalation risks.',
    editorialSketchDesc: 'Official Department of Defense tele-facsimile wirephoto sketch showing tactical vectors, crater clusters, and struck-out NATO counters.',
    oilPriceShift: '+$1.85 / barrel (Gulf Brent index spiked +4.2%)',
    unSecurityCouncilReaction: 'Emergency UNSC resolution proposed calling for immediate 48-hour ceasefire and observer deployment.',
    model: 'TELEMETRY VINTAGE LITHOGRAPH'
  };
}

export const NewspaperModal: React.FC<NewspaperModalProps> = ({
  isOpen,
  onClose,
  battle,
  simTimeStr
}) => {
  const [activeMasthead, setActiveMasthead] = useState<MastheadType>('REUTERS');
  const [enrichedArticle, setEnrichedArticle] = useState<NewspaperArticle | null>(null);

  const sectorName = battle?.sectorName || 'Delta Causeway Bridge';
  const victorFactionId = battle?.victorFactionId || (battle?.attackerStrength && battle.attackerStrength > (battle.defenderStrength || 50) ? battle.attackerFactionId : 'loyalists');
  const defeatedFactionId = victorFactionId === 'loyalists' ? 'rebels' : 'loyalists';
  const casualtiesDefender = battle?.casualtiesDefender || 180;
  const casualtiesAttacker = battle?.casualtiesAttacker || 460;
  const aircraftLost = battle?.aircraftLost || 1;
  const armorLostAttacker = battle?.armorLostAttacker || 3;
  const armorLostDefender = battle?.armorLostDefender || 2;
  const totalArmorLost = armorLostAttacker + armorLostDefender;

  const instantArticle = useMemo(
    () => generateInstantArticle(battle, activeMasthead, simTimeStr),
    [battle, activeMasthead, simTimeStr]
  );

  // Optional background fetch to enrich with Gemini if available, without blocking UI
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchEnriched = async () => {
      try {
        const res = await fetch('/api/newspaper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleSector: sectorName,
            victorFactionId,
            defeatedFactionId,
            victorName: victorFactionId === 'rebels' ? 'San Pietro Liberation Front' : 'San Pietro Armed Forces',
            defeatedName: victorFactionId === 'rebels' ? 'Presidential Guard Junta' : 'Guerilla Insurgent Cadres',
            victorLosses: casualtiesDefender,
            defeatedLosses: casualtiesAttacker,
            airLosses: aircraftLost,
            armorLost: totalArmorLost,
            commanderName: victorFactionId === 'rebels' ? 'Comandante Lucía Reyes' : 'General Hector Cruz',
            masthead: activeMasthead,
            simTime: simTimeStr
          })
        });
        if (res.ok && isMounted) {
          const remoteData = await res.json();
          if (remoteData && remoteData.headline) {
            setEnrichedArticle(remoteData);
          }
        }
      } catch {
        // Fallback already displayed
      }
    };

    fetchEnriched();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeMasthead, battle?.id, sectorName, victorFactionId, defeatedFactionId, casualtiesDefender, casualtiesAttacker, aircraftLost, totalArmorLost, simTimeStr]);

  const article = enrichedArticle || instantArticle;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      {/* Outer Folded Broadsheet Artifact Container */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-[#fbf7ed] text-[#1c1815] border-4 border-[#41392e] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden font-broadsheet rounded-sm">
        {/* Newspaper Top Steel Masthead & Masthead Switcher */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#293a30] text-[#f7f2e4] border-b-2 border-[#1c1815] shadow-md">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-space font-bold tracking-wider uppercase text-[#d1fae5] flex items-center gap-2">
                <span>PROJECT BRINK // 1960s PRESS TELE-PRINTER DESK</span>
                <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px] border border-amber-400/30 flex items-center gap-1 font-mono">
                  <Sparkles className="w-2.5 h-2.5" />
                  CLIENT LITHOGRAPH • 0-TOKEN INSTANT TELEMETRY
                </span>
              </div>
              <div className="text-[9px] font-industrial text-[#a7f3d0]/70">
                Wire Transmissions, Halftone Facsimiles & Embargo Bulletins
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#3d5043] text-neutral-300 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Masthead Selector Annunciator Bar */}
        <div className="grid grid-cols-3 bg-[#e8e0cc] border-b-2 border-[#41392e] p-2 gap-2">
          <button
            onClick={() => setActiveMasthead('CHRONICLE')}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-2 transition-all rounded ${
              activeMasthead === 'CHRONICLE'
                ? 'bg-[#fbf7ed] border-[#047857] shadow-inner text-[#064e3b]'
                : 'bg-[#ded4bc] border-[#b8ab91] text-neutral-700 hover:bg-[#e4dcce]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-800 shrink-0" />
            <div className="text-left">
              <div className="font-space font-bold text-[11px] leading-tight">The San Pietro Chronicle</div>
              <div className="text-[8px] font-industrial uppercase text-neutral-600">State Media • Loyalist Junta</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMasthead('VOICE_SIERRA')}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-2 transition-all rounded ${
              activeMasthead === 'VOICE_SIERRA'
                ? 'bg-[#fbf7ed] border-[#b91c1c] shadow-inner text-[#7f1d1d]'
                : 'bg-[#ded4bc] border-[#b8ab91] text-neutral-700 hover:bg-[#e4dcce]'
            }`}
          >
            <Radio className="w-4 h-4 text-red-700 shrink-0" />
            <div className="text-left">
              <div className="font-space font-bold text-[11px] leading-tight">Voice of the Sierra</div>
              <div className="text-[8px] font-industrial uppercase text-neutral-600">Clandestine Leaflet • Rebel Front</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMasthead('REUTERS')}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-2 transition-all rounded ${
              activeMasthead === 'REUTERS'
                ? 'bg-[#fbf7ed] border-[#0369a1] shadow-inner text-[#0c4a6e]'
                : 'bg-[#ded4bc] border-[#b8ab91] text-neutral-700 hover:bg-[#e4dcce]'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-800 shrink-0" />
            <div className="text-left">
              <div className="font-space font-bold text-[11px] leading-tight">International Herald / Reuters</div>
              <div className="text-[8px] font-industrial uppercase text-neutral-600">Independent Wire • Global Press</div>
            </div>
          </button>
        </div>

        {/* Newspaper Page Scrollable Content with Vintage Fold Crease */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fbf7ed] relative">
          {/* Subtle Horizontal Paper Fold Crease Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-b from-black/5 via-black/10 to-transparent pointer-events-none" />

          <div className="relative">
            {/* Red Ink Declassified Rubber Stamp */}
            <div className="absolute top-0 right-4 z-20 pointer-events-none">
              <div className="rubber-stamp">
                DECLASSIFIED BY DEPT OF STATE • 14 OCT 1963
              </div>
            </div>

            {/* Masthead Banner */}
            <div className="text-center border-b-4 border-double border-[#1c1815] pb-3 pt-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#1c1815] font-broadsheet leading-none">
                {article.mastheadName}
              </h1>
              <p className="text-xs font-broadsheet tracking-wider text-neutral-700 mt-1.5 italic">
                &ldquo;{article.mastheadMotto}&rdquo;
              </p>
              <div className="flex justify-between items-center text-[10px] font-teletype border-t-2 border-b border-[#3c342a] mt-2.5 py-1 px-4 uppercase text-neutral-700">
                <span>VOL. LXVII NO. 14,892</span>
                <span>SAN PIETRO CRISIS THEATRE • {article.dateline}</span>
                <span>PRICE: 10 CENTAVOS // 5 CENTS US</span>
              </div>
            </div>

            {/* Propaganda Bias Callout */}
            <div className="my-3 p-2.5 bg-[#ede4d0] border-l-4 border-amber-900 text-xs text-neutral-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-900 shrink-0 mt-0.5" />
              <div>
                <span className="font-space font-bold uppercase tracking-wider text-[10px] text-amber-950">
                  CENSORSHIP & EDITORIAL BIAS:
                </span>{' '}
                <span className="italic">{article.propagandaAngle}</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center my-4">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight text-[#1c1815] font-broadsheet">
                {article.headline}
              </h2>
              <h3 className="text-base md:text-lg font-broadsheet font-semibold text-neutral-700 mt-2 italic max-w-2xl mx-auto">
                {article.subheadline}
              </h3>
              <div className="text-xs font-teletype font-bold text-neutral-800 mt-2">
                {article.byline}
              </div>
            </div>

            {/* Multi-Column Article Layout with Classic Vertical Hairline Rules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t-2 border-[#1c1815]">
              {/* Columns 1 & 2: Story Text + Instant Client-Side Vector Lithograph */}
              <div className="md:col-span-2 space-y-4 text-[14px] leading-relaxed text-justify text-[#221e1a] border-r-0 md:border-r border-[#c2b49e] md:pr-6 font-broadsheet">
                {article.paragraphs.slice(0, 1).map((p, idx) => (
                  <p
                    key={idx}
                    className="first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1815]"
                  >
                    {p}
                  </p>
                ))}

                {/* THE CLIENT-SIDE VINTAGE MILITARY VECTOR LITHOGRAPH */}
                <div className="my-4">
                  <BattleLithographSketch
                    battle={battle}
                    victorFactionId={victorFactionId}
                    defeatedFactionId={defeatedFactionId}
                    sectorName={sectorName}
                    victorLosses={casualtiesDefender}
                    defeatedLosses={casualtiesAttacker}
                    armorLost={totalArmorLost}
                    airLosses={aircraftLost}
                    simTimeStr={simTimeStr}
                  />
                </div>

                {article.paragraphs.slice(1).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Column 3: Sidebar Intelligence, Casualties, Commodities */}
              <div className="space-y-4 font-broadsheet">
                {/* Official Casualty Tally Box */}
                <div className="bg-[#ede4d0] border-2 border-[#3c342a] p-3 text-xs shadow-sm">
                  <h4 className="font-black font-broadsheet uppercase tracking-wider text-[#1c1815] border-b-2 border-[#3c342a] pb-1 mb-2 text-sm">
                    Official Loss Tally
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {article.keyBulletins.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-amber-900 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Crude Oil Commodities Market Index */}
                <div className="border-2 border-[#3c342a] p-3 bg-[#f5ede0] shadow-sm">
                  <h4 className="font-black font-broadsheet uppercase tracking-wider text-[#1c1815] border-b border-[#3c342a] pb-1 mb-1.5 text-xs">
                    Commodity Markets
                  </h4>
                  <div className="text-xs text-neutral-900">
                    <span className="font-semibold">Black Gold Crude Index: </span>
                    <span className="font-teletype font-bold text-amber-900 bg-amber-200/60 px-1 py-0.5 rounded">
                      {article.oilPriceShift}
                    </span>
                  </div>
                </div>

                {/* UN Security Council Wire */}
                <div className="border-2 border-[#3c342a] p-3 bg-[#f5ede0] shadow-sm">
                  <h4 className="font-black font-broadsheet uppercase tracking-wider text-[#1c1815] border-b border-[#3c342a] pb-1 mb-1.5 text-xs">
                    United Nations Wire
                  </h4>
                  <p className="text-xs text-neutral-800 leading-relaxed italic">
                    &ldquo;{article.unSecurityCouncilReaction}&rdquo;
                  </p>
                </div>

                {/* Red Rubber Stamp 2 */}
                <div className="pt-2 text-center">
                  <div className="rubber-stamp scale-90">
                    TOP SECRET // EYES ONLY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console Bottom Action Bar */}
        <div className="px-4 py-3 bg-[#293a30] text-[#f7f2e4] flex justify-between items-center text-xs font-space border-t-2 border-[#1c1815]">
          <span className="text-[10px] text-[#a7f3d0]/80">
            SECURITY LEVEL: TOP SECRET • DIPLOMATIC EMBARGO FILE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-space font-bold text-xs uppercase tracking-wider transition-colors shadow-md rounded-sm border border-amber-500 cursor-pointer"
          >
            RETURN TO CONSOLE DESK
          </button>
        </div>
      </div>
    </div>
  );
};
