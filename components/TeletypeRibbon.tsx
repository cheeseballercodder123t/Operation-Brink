'use client';

import React from 'react';
import { Transmission } from '@/app/page';

interface TeletypeRibbonProps {
  transmissions: Transmission[];
  recentEvents?: string[];
  maxItems?: number;
}

export const TeletypeRibbon: React.FC<TeletypeRibbonProps> = ({
  transmissions,
  recentEvents = [],
  maxItems = 8
}) => {
  const displayedTransmissions = transmissions.slice(0, maxItems);

  return (
    <div className="flex flex-col bg-[#242c26] border-2 border-[#3c4a3f] rounded-lg p-3 shadow-lg select-none">
      {/* Aluminum Feeder Slot */}
      <div className="flex items-center justify-between bg-gradient-to-b from-[#485361] to-[#2a3038] px-3 py-1.5 rounded border border-[#1b2027] shadow-inner mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[9px] font-space font-bold tracking-widest text-[#d6e0d4] uppercase">
            TELETYPE TAPE FEEDER // MODEL 33 ASR
          </span>
        </div>
        <div className="text-[8px] font-teletype text-amber-300">
          ONLINE • 110 BAUD
        </div>
      </div>

      {/* Steel Paper Dispenser Mouth */}
      <div className="w-full h-1.5 bg-[#0e1210] border-b border-[#5e6d61] shadow-inner" />

      {/* Continuous Yellowed Perforated Paper Tape Strip */}
      <div className="relative bg-[#f7efdc] text-[#241e17] font-teletype p-4 rounded-b border border-[#d6c8b0] shadow-inner max-h-72 overflow-y-auto space-y-3">
        {/* Left Sprocket Edge Holes */}
        <div className="absolute left-1 top-0 bottom-0 w-2 flex flex-col justify-between py-2 pointer-events-none opacity-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3c342a] my-1" />
          ))}
        </div>

        {/* Right Sprocket Edge Holes */}
        <div className="absolute right-1 top-0 bottom-0 w-2 flex flex-col justify-between py-2 pointer-events-none opacity-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3c342a] my-1" />
          ))}
        </div>

        {/* Paper Header Stamp */}
        <div className="border-b border-[#a89880] pb-2 text-[9px] flex justify-between items-center text-[#594d3d] uppercase font-bold pl-3 pr-3">
          <span>US-DOD / GRU CRYPTOGRAPHIC INTERCEPT TAPE</span>
          <span>AUTOPRINT 1963</span>
        </div>

        {/* Telegrams & Radio Messages */}
        <div className="space-y-2.5 pl-3 pr-3">
          {displayedTransmissions.length === 0 ? (
            <div className="text-[11px] text-[#786b58] italic py-3 text-center">
              -- STANDBY: SCANNING ENCRYPTED MILITARY FREQUENCIES --
            </div>
          ) : (
            displayedTransmissions.map((t) => (
              <div key={t.id} className="text-xs border-b border-dashed border-[#c4b59b] pb-2">
                <div className="flex items-center justify-between text-[9px] font-bold text-[#8c3b2b]">
                  <span>{`MSG #${t.id.slice(-4).toUpperCase()} // ${(t.callsign || t.factionId).toUpperCase()}`}</span>
                  <span>{t.timestamp}</span>
                </div>
                <div className="text-[11px] font-bold text-[#1a1713] mt-0.5 leading-snug">
                  {t.message}
                </div>
              </div>
            ))
          )}

          {/* Recent Global Events Feed */}
          {recentEvents.length > 0 && (
            <div className="pt-2 border-t border-[#a89880]">
              <div className="text-[8px] font-bold uppercase tracking-wider text-[#735e46] mb-1">
                STRATEGIC DISPATCH TICKER:
              </div>
              <ul className="space-y-1 text-[10px] text-[#332b22]">
                {recentEvents.slice(0, 3).map((ev, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-[#8c3b2b] font-bold">&gt;&gt;</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
