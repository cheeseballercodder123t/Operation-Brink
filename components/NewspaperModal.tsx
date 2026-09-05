'use client';

import React, { useState, useEffect } from 'react';
import { X, Newspaper, RefreshCw, Globe, Radio, ShieldAlert, Sparkles, AlertCircle, Stamp } from 'lucide-react';
import { FlashpointBattle } from '@/lib/warRoom';
import { AnnunciatorButton } from './AnnunciatorButton';

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

export const NewspaperModal: React.FC<NewspaperModalProps> = ({
  isOpen,
  onClose,
  battle,
  simTimeStr
}) => {
  const [activeMasthead, setActiveMasthead] = useState<MastheadType>('REUTERS');
  const [loading, setLoading] = useState<boolean>(false);
  const [article, setArticle] = useState<NewspaperArticle | null>(null);

  const battleId = battle?.id;
  const sectorName = battle?.sectorName;
  const victorFactionId = battle?.victorFactionId;
  const casualtiesDefender = battle?.casualtiesDefender;
  const casualtiesAttacker = battle?.casualtiesAttacker;
  const aircraftLost = battle?.aircraftLost;
  const armorLostAttacker = battle?.armorLostAttacker;
  const armorLostDefender = battle?.armorLostDefender;

  useEffect(() => {
    let isCancelled = false;
    if (!isOpen) return;

    const runFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/newspaper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleSector: sectorName || 'Delta Causeway Bridge',
            victorFactionId: victorFactionId || 'loyalists',
            defeatedFactionId: victorFactionId === 'loyalists' ? 'rebels' : 'loyalists',
            victorName: victorFactionId === 'rebels' ? 'San Pietro Liberation Front' : 'San Pietro Armed Forces',
            defeatedName: victorFactionId === 'rebels' ? 'Presidential Guard Junta' : 'Guerilla Insurgent Cadres',
            victorLosses: casualtiesDefender ? Math.round(casualtiesDefender * 0.4) : 180,
            defeatedLosses: casualtiesAttacker ? Math.round(casualtiesAttacker * 1.1) : 420,
            airLosses: aircraftLost || 1,
            armorLost: (armorLostAttacker || 2) + (armorLostDefender || 2),
            commanderName: victorFactionId === 'rebels' ? 'Comandante Lucía Reyes' : 'General Hector Cruz',
            masthead: activeMasthead,
            simTime: simTimeStr
          })
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (e) {
        console.warn('Failed to load dynamic newspaper dispatch:', e);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    activeMasthead,
    battleId,
    sectorName,
    victorFactionId,
    casualtiesDefender,
    casualtiesAttacker,
    aircraftLost,
    armorLostAttacker,
    armorLostDefender,
    simTimeStr
  ]);

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
                {article?.model && (
                  <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px] border border-amber-400/30 flex items-center gap-1 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    {article.model}
                  </span>
                )}
              </div>
              <div className="text-[9px] font-industrial text-[#a7f3d0]/70">
                Wire Transmissions, Clandestine Radio Leaflets & Embargo Bulletins
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

          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center gap-3 text-neutral-600">
              <RefreshCw className="w-9 h-9 animate-spin text-amber-900" />
              <div className="font-teletype text-xs uppercase tracking-widest text-[#4a3b2c]">
                INTERCEPTING WIRE CABLE // INK CYLINDERS ROLLING...
              </div>
            </div>
          ) : article ? (
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
                {/* Columns 1 & 2: Story Text */}
                <div className="md:col-span-2 space-y-4 text-[14px] leading-relaxed text-justify text-[#221e1a] border-r-0 md:border-r border-[#c2b49e] md:pr-6 font-broadsheet">
                  {article.paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      className={
                        idx === 0
                          ? 'first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1815]'
                          : ''
                      }
                    >
                      {p}
                    </p>
                  ))}

                  {/* Grainy Tactical Wirephoto Sketch Box */}
                  <div className="border-2 border-[#2b241c] bg-[#e6ddc8] p-3 rounded-none my-4 shadow-sm">
                    <div className="font-space text-[9px] font-bold uppercase text-neutral-800 mb-1.5 flex items-center justify-between border-b border-[#a89980] pb-1">
                      <span>WIREPHOTO TELE-FACSIMILE RECORD</span>
                      <span>THEATRE GRID: {battle?.sectorName || 'DELTA CAUSEWAY'}</span>
                    </div>

                    {/* Halftone High-Contrast Wirephoto Illustration */}
                    <div className="w-full h-36 bg-[#1a1612] border-2 border-[#110e0c] relative overflow-hidden flex items-center justify-center halftone-photo">
                      <svg className="w-full h-full" viewBox="0 0 400 130">
                        {/* Halftone Grid Lines */}
                        <line x1="0" y1="45" x2="400" y2="45" stroke="#4a3e30" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="90" x2="400" y2="90" stroke="#4a3e30" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="130" y1="0" x2="130" y2="130" stroke="#4a3e30" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="270" y1="0" x2="270" y2="130" stroke="#4a3e30" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Causeway River */}
                        <path d="M 200 0 Q 170 65 210 130" stroke="#475569" strokeWidth="12" fill="none" opacity="0.7" />
                        <text x="202" y="70" fill="#94a3b8" fontSize="8" fontFamily="monospace" transform="rotate(75, 202, 70)">
                          RIO SANTO CORRIDOR
                        </text>

                        {/* Tactical Assault Arrows */}
                        <path d="M 60 75 Q 130 65 185 65" stroke="#dc2626" strokeWidth="5" fill="none" />
                        <polygon points="185,65 170,58 170,72" fill="#dc2626" />

                        <path d="M 340 55 Q 270 60 215 63" stroke="#0284c7" strokeWidth="5" fill="none" />
                        <polygon points="215,63 230,56 230,70" fill="#0284c7" />

                        {/* Artillery Burst Radius */}
                        <circle cx="200" cy="64" r="16" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
                        <text x="200" y="68" textAnchor="middle" fill="#fef08a" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          GROUND ZERO
                        </text>

                        {/* Top Banner Tag */}
                        <rect x="10" y="10" width="130" height="18" fill="#14110e" stroke="#6b5c49" />
                        <text x="18" y="23" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          {battle?.sectorName || 'DELTA BRIDGE SECTOR'}
                        </text>
                      </svg>
                    </div>

                    <p className="text-[11px] font-broadsheet italic text-neutral-700 mt-2 leading-tight">
                      Fig. 1.2 — {article.editorialSketchDesc}
                    </p>
                  </div>
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
          ) : (
            <div className="py-24 text-center text-neutral-600 font-teletype text-sm">
              NO BATTLE DISPATCHES CURRENTLY ON FILE. ENGAGE FORCES TO GENERATE FIELD INTELLIGENCE.
            </div>
          )}
        </div>

        {/* Console Bottom Action Bar */}
        <div className="px-4 py-3 bg-[#293a30] text-[#f7f2e4] flex justify-between items-center text-xs font-space border-t-2 border-[#1c1815]">
          <span className="text-[10px] text-[#a7f3d0]/80">
            SECURITY LEVEL: TOP SECRET • DIPLOMATIC EMBARGO FILE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-space font-bold text-xs uppercase tracking-wider transition-colors shadow-md rounded-sm border border-amber-500"
          >
            FILE IN WAR ROOM DOSSIER
          </button>
        </div>
      </div>
    </div>
  );
};
