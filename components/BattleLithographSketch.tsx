'use client';

import React from 'react';
import { FlashpointBattle } from '@/lib/warRoom';
import { FactionId } from '@/app/page';

interface BattleLithographSketchProps {
  battle: FlashpointBattle | null;
  victorFactionId?: FactionId;
  defeatedFactionId?: FactionId;
  sectorName?: string;
  victorLosses?: number;
  defeatedLosses?: number;
  armorLost?: number;
  airLosses?: number;
  simTimeStr?: string;
}

export const BattleLithographSketch: React.FC<BattleLithographSketchProps> = ({
  battle,
  victorFactionId = 'loyalists',
  defeatedFactionId = 'rebels',
  sectorName = 'Delta Causeway Bridge',
  victorLosses = 180,
  defeatedLosses = 460,
  armorLost = 6,
  airLosses = 2,
  simTimeStr = 'OCTOBER 1963'
}) => {
  const isLoyalistVictor = victorFactionId === 'loyalists';
  const isRebelVictor = victorFactionId === 'rebels';
  const isCoalitionVictor = victorFactionId === 'coalition';
  const isVolskanVictor = victorFactionId === 'volskan';

  // Determine attacker/defender names for NATO counters
  const victorUnitLabel = isLoyalistVictor
    ? '1ST "CENTAUR" ARMORED [XX]'
    : isRebelVictor
    ? '3RD SIERRA VANGUARD [XX]'
    : isCoalitionVictor
    ? '7TH EXPEDITIONARY TF [XX]'
    : '8TH VOLSKAN SHOCK [XXX]';

  const defeatedUnitLabel = isLoyalistVictor
    ? 'SIERRA 2ND CADRE [PULVERIZED]'
    : isRebelVictor
    ? '4TH PRESIDENTIAL GUARD [ROUTED]'
    : isCoalitionVictor
    ? 'DEFENDING GARRISON [OVERRUN]'
    : 'REGIONAL DEFENSE CORPS [DECIMATED]';

  const isRiverSector = sectorName.toLowerCase().includes('delta') || sectorName.toLowerCase().includes('bridge');
  const isRefinerySector = sectorName.toLowerCase().includes('refinery') || sectorName.toLowerCase().includes('oil');
  const isMountainSector = sectorName.toLowerCase().includes('sierra') || sectorName.toLowerCase().includes('monte');

  return (
    <div className="w-full border-2 border-[#1c1815] bg-[#f5efe3] p-3 rounded-none shadow-[inset_0_0_15px_rgba(0,0,0,0.08)] relative overflow-hidden select-none font-broadsheet text-[#1c1815]">
      {/* Top Tele-Facsimile Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-[#1c1815] pb-1.5 mb-2 font-space text-[9px] uppercase tracking-wider font-bold">
        <div className="flex items-center gap-2">
          <span className="bg-[#1c1815] text-[#f5efe3] px-1.5 py-0.5">TELE-FACSIMILE RECORD</span>
          <span>GRID: {sectorName.toUpperCase()} {'//'} SECTOR 04</span>
        </div>
        <div className="text-neutral-700">
          DEPT OF DEFENSE {'//'} WIREPHOTO TRANSMISSION • {simTimeStr}
        </div>
      </div>

      {/* High-Contrast Halftone Canvas Container */}
      <div className="relative w-full h-64 md:h-72 bg-[#fcf9f2] border-2 border-[#1c1815] overflow-hidden">
        {/* Halftone Dot Matrix Pattern Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(#1c1815 1.2px, transparent 1.2px)',
            backgroundSize: '5px 5px'
          }}
        />

        {/* Paper Fold Crease Line Overlay */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#1c1815]/20 pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.1)]" />
        <div className="absolute inset-y-0 left-1/3 w-[1px] bg-[#1c1815]/20 pointer-events-none" />

        {/* SVG Lithograph Diagram */}
        <svg className="w-full h-full relative z-10" viewBox="0 0 600 280">
          <defs>
            {/* Ink hatch pattern */}
            <pattern id="ink-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1c1815" strokeWidth="1.2" opacity="0.6" />
            </pattern>
            {/* Terrain forest pattern */}
            <pattern id="forest-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 12 12 L 0 12 Z" fill="none" stroke="#1c1815" strokeWidth="0.8" opacity="0.4" />
            </pattern>
            {/* Marker arrow definition */}
            <marker id="ink-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1c1815" />
            </marker>
            <marker id="red-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8c2518" />
            </marker>
          </defs>

          {/* Cartographic Coordinate Ticks & Reference Grid */}
          <g stroke="#1c1815" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.35">
            <line x1="150" y1="0" x2="150" y2="280" />
            <line x1="300" y1="0" x2="300" y2="280" />
            <line x1="450" y1="0" x2="450" y2="280" />
            <line x1="0" y1="70" x2="600" y2="70" />
            <line x1="0" y1="140" x2="600" y2="140" />
            <line x1="0" y1="210" x2="600" y2="210" />
          </g>

          {/* Topographic Contour Lines */}
          <g fill="none" stroke="#1c1815" strokeWidth="0.8" opacity="0.45">
            <path d="M 0 40 Q 120 70 240 30 T 480 50 T 600 20" />
            <path d="M 0 65 Q 140 95 260 55 T 500 75 T 600 45" />
            <path d="M 0 240 Q 180 200 360 250 T 600 230" />
            <path d="M 0 260 Q 160 220 340 270 T 600 255" />
            {isMountainSector && (
              <path d="M 380 20 Q 430 80 490 30 Q 540 90 590 40" fill="url(#forest-hatch)" />
            )}
          </g>

          {/* Rio Santo River & Water Channels */}
          <path
            d="M 300 0 Q 280 80 320 140 Q 360 200 290 280"
            fill="none"
            stroke="#1c1815"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.25"
          />
          <path
            d="M 300 0 Q 280 80 320 140 Q 360 200 290 280"
            fill="none"
            stroke="#1c1815"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <text
            x="315"
            y="100"
            fill="#1c1815"
            fontSize="9"
            fontFamily="'Special Elite', monospace"
            fontWeight="bold"
            letterSpacing="2"
            transform="rotate(65, 315, 100)"
            opacity="0.8"
          >
            RIO SANTO CANAL // WATERWAY
          </text>

          {/* Bridge Crossing Structure */}
          {isRiverSector && (
            <g>
              <rect x="290" y="130" width="40" height="14" fill="#fcf9f2" stroke="#1c1815" strokeWidth="2" />
              <line x1="290" y1="137" x2="330" y2="137" stroke="#1c1815" strokeWidth="1" strokeDasharray="2 2" />
              <text x="310" y="124" textAnchor="middle" fill="#1c1815" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold">
                [HIGHWAY CAUSEWAY SPAN]
              </text>
            </g>
          )}

          {/* Oil Tank Farm / Refinery Buildings */}
          {isRefinerySector && (
            <g opacity="0.8">
              <circle cx="440" cy="110" r="14" fill="none" stroke="#1c1815" strokeWidth="1.5" />
              <circle cx="475" cy="110" r="14" fill="none" stroke="#1c1815" strokeWidth="1.5" />
              <circle cx="440" cy="145" r="14" fill="none" stroke="#1c1815" strokeWidth="1.5" />
              <circle cx="475" cy="145" r="14" fill="none" stroke="#1c1815" strokeWidth="1.5" />
              <text x="458" y="172" textAnchor="middle" fill="#1c1815" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold">
                TANK FARM BRAVO
              </text>
            </g>
          )}

          {/* ARTILLERY SPLASH & BOMB CRATER CLUSTERS */}
          {/* Ground Zero Concentric Dashed Impact Rings */}
          <g>
            <circle cx="320" cy="140" r="32" fill="none" stroke="#8c2518" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.9" />
            <circle cx="320" cy="140" r="22" fill="none" stroke="#8c2518" strokeWidth="2.2" strokeDasharray="6 3" />
            <circle cx="320" cy="140" r="10" fill="none" stroke="#8c2518" strokeWidth="2.5" />
            
            {/* Crater Shrapnel Burst Spokes */}
            <line x1="320" y1="110" x2="320" y2="98" stroke="#8c2518" strokeWidth="1.5" />
            <line x1="320" y1="170" x2="320" y2="182" stroke="#8c2518" strokeWidth="1.5" />
            <line x1="290" y1="140" x2="278" y2="140" stroke="#8c2518" strokeWidth="1.5" />
            <line x1="350" y1="140" x2="362" y2="140" stroke="#8c2518" strokeWidth="1.5" />

            {/* Ground Zero Stamped Label */}
            <rect x="235" y="178" width="170" height="15" fill="#f5efe3" stroke="#8c2518" strokeWidth="1.2" />
            <text x="320" y="189" textAnchor="middle" fill="#8c2518" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold" letterSpacing="1">
              GROUND ZERO: 152MM HOWITZER SALVO
            </text>
          </g>

          {/* Air Sortie Crater Cluster (Secondary Impact) */}
          <g opacity="0.85">
            <circle cx="390" cy="90" r="14" fill="none" stroke="#1c1815" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="410" cy="80" r="10" fill="none" stroke="#1c1815" strokeWidth="1.2" strokeDasharray="3 3" />
            <text x="400" y="106" textAnchor="middle" fill="#1c1815" fontSize="7" fontFamily="'Special Elite', monospace">
              AIR STRIKE CRATER CLUSTER
            </text>
          </g>

          {/* THE GREASE-PENCIL MAIN BREAKTHROUGH ARROW (SVG Vector) */}
          <g>
            {/* Main Center Spearhead Thrust */}
            <path
              d="M 120 140 Q 210 120 290 138"
              fill="none"
              stroke="#1c1815"
              strokeWidth="7"
              strokeLinecap="square"
            />
            <path
              d="M 120 140 Q 210 120 290 138"
              fill="none"
              stroke="#fcf9f2"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            {/* Spearhead Arrow Head */}
            <polygon points="290,138 270,126 276,138 270,150" fill="#1c1815" />

            {/* Northern Sweeping Flanking Pincer */}
            <path
              d="M 140 120 Q 220 50 330 75"
              fill="none"
              stroke="#1c1815"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
            <polygon points="330,75 314,66 318,76 312,84" fill="#1c1815" />
            <text x="210" y="62" fill="#1c1815" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold">
              [NORTH PINCER ASSAULT]
            </text>

            {/* Southern Ambush Flank Arc */}
            <path
              d="M 140 160 Q 220 230 330 205"
              fill="none"
              stroke="#1c1815"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
            <polygon points="330,205 312,196 318,204 314,214" fill="#1c1815" />
            <text x="200" y="235" fill="#1c1815" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold">
              [SOUTHERN ENVELOPMENT FLANK]
            </text>
          </g>

          {/* VICTOR NATO UNIT COUNTER (Intact Spearhead) */}
          <g transform="translate(60, 115)">
            {/* NATO Standard Armored Rectangle */}
            <rect x="0" y="0" width="75" height="42" fill="#f5efe3" stroke="#1c1815" strokeWidth="2" />
            {/* NATO Armored Track Oval */}
            <ellipse cx="37.5" cy="21" rx="24" ry="11" fill="none" stroke="#1c1815" strokeWidth="1.8" />
            {/* Division Level 'XX' Marker */}
            <text x="37.5" y="-4" textAnchor="middle" fill="#1c1815" fontSize="10" fontFamily="'Orbitron', sans-serif" fontWeight="black">
              XX
            </text>
            <text x="37.5" y="52" textAnchor="middle" fill="#1c1815" fontSize="8" fontFamily="'Special Elite', monospace" fontWeight="bold">
              {victorUnitLabel}
            </text>
            <text x="37.5" y="24" textAnchor="middle" fill="#1c1815" fontSize="8" fontFamily="'Courier Prime', monospace" fontWeight="bold">
              MAIN FORCE
            </text>
          </g>

          {/* DEFEATED UNIT COUNTER (STAMPED WITH BOLD 'X' STRUCK THROUGH) */}
          <g transform="translate(420, 115)">
            {/* Defeated NATO Box */}
            <rect x="0" y="0" width="80" height="42" fill="#ede4d0" stroke="#8c2518" strokeWidth="2" />
            {/* NATO Mechanized Diagonal Cross */}
            <line x1="0" y1="0" x2="80" y2="42" stroke="#8c2518" strokeWidth="1.5" />
            <line x1="0" y1="42" x2="80" y2="0" stroke="#8c2518" strokeWidth="1.5" />
            
            {/* BIG HEAVY CRUSHED / DESTROYED STAMP 'X' */}
            <line x1="-6" y1="-6" x2="86" y2="48" stroke="#8c2518" strokeWidth="4" />
            <line x1="-6" y1="48" x2="86" y2="-6" stroke="#8c2518" strokeWidth="4" />

            {/* Division Level 'XX' Marker */}
            <text x="40" y="-4" textAnchor="middle" fill="#8c2518" fontSize="10" fontFamily="'Orbitron', sans-serif" fontWeight="black">
              XX
            </text>
            {/* Stamped Defeat Label */}
            <rect x="-15" y="48" width="110" height="16" fill="#8c2518" />
            <text x="40" y="59" textAnchor="middle" fill="#fcf9f2" fontSize="7.5" fontFamily="'Special Elite', monospace" fontWeight="bold">
              {defeatedUnitLabel}
            </text>
          </g>

          {/* Secondary Artillery Battery Support Marker */}
          <g transform="translate(50, 205)">
            <rect x="0" y="0" width="55" height="30" fill="#f5efe3" stroke="#1c1815" strokeWidth="1.5" />
            <circle cx="27.5" cy="15" r="5" fill="#1c1815" />
            <text x="27.5" y="-3" textAnchor="middle" fill="#1c1815" fontSize="8" fontFamily="'Orbitron', sans-serif" fontWeight="bold">
              ||
            </text>
            <text x="27.5" y="38" textAnchor="middle" fill="#1c1815" fontSize="7" fontFamily="'Special Elite', monospace">
              152MM BTRY [SUPPORT]
            </text>
          </g>

          {/* Compass Rose & Grid Reference */}
          <g transform="translate(550, 35)">
            <circle cx="0" cy="0" r="16" fill="none" stroke="#1c1815" strokeWidth="1" />
            <line x1="0" y1="-20" x2="0" y2="20" stroke="#1c1815" strokeWidth="1.5" />
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#1c1815" strokeWidth="1" />
            <polygon points="0,-20 -4,-8 4,-8" fill="#1c1815" />
            <text x="0" y="-22" textAnchor="middle" fill="#1c1815" fontSize="8" fontWeight="bold">N</text>
          </g>

          {/* Scale Legend Bar */}
          <g transform="translate(480, 255)">
            <rect x="0" y="0" width="100" height="4" fill="#1c1815" />
            <rect x="25" y="0" width="25" height="4" fill="#fcf9f2" stroke="#1c1815" strokeWidth="0.5" />
            <rect x="75" y="0" width="25" height="4" fill="#fcf9f2" stroke="#1c1815" strokeWidth="0.5" />
            <text x="0" y="-3" fill="#1c1815" fontSize="7" fontFamily="'Courier Prime', monospace">0 KM</text>
            <text x="50" y="-3" fill="#1c1815" fontSize="7" fontFamily="'Courier Prime', monospace">5 KM</text>
            <text x="100" y="-3" fill="#1c1815" fontSize="7" fontFamily="'Courier Prime', monospace">10 KM</text>
          </g>
        </svg>

        {/* OFFICIAL RED RUBBER INK STAMPS */}
        <div className="absolute top-2 left-3 transform -rotate-6 pointer-events-none z-20">
          <div className="border-2 border-[#8c2518] px-2 py-0.5 text-[#8c2518] font-space font-extrabold text-[10px] tracking-widest uppercase bg-[#f5efe3]/85 shadow-sm">
            TELE-FACSIMILE RECORD // DEPT OF DEFENSE
          </div>
        </div>

        <div className="absolute bottom-2 right-3 transform rotate-3 pointer-events-none z-20">
          <div className="border border-[#8c2518] px-1.5 py-0.5 text-[#8c2518] font-space font-bold text-[8px] tracking-wider uppercase bg-[#f5efe3]/90">
            FIELD INTELLIGENCE WIREPHOTO • AUTHENTIC RECORD
          </div>
        </div>
      </div>

      {/* Telemetry Loss Readout Line */}
      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-teletype border-t border-[#1c1815] pt-1.5">
        <div className="bg-[#ede4d0] p-1 border border-[#1c1815]/40">
          <span className="block text-[8px] font-space uppercase text-neutral-600">VICTOR CASUALTIES</span>
          <span className="font-bold text-[#1c1815]">~{victorLosses} MEN</span>
        </div>
        <div className="bg-[#ede4d0] p-1 border border-[#1c1815]/40">
          <span className="block text-[8px] font-space uppercase text-[#8c2518]">ENEMY ROUT LOSSES</span>
          <span className="font-bold text-[#8c2518]">~{defeatedLosses} MEN</span>
        </div>
        <div className="bg-[#ede4d0] p-1 border border-[#1c1815]/40">
          <span className="block text-[8px] font-space uppercase text-neutral-600">ARMOR PULVERIZED</span>
          <span className="font-bold text-[#1c1815]">{armorLost} TANKS</span>
        </div>
        <div className="bg-[#ede4d0] p-1 border border-[#1c1815]/40">
          <span className="block text-[8px] font-space uppercase text-neutral-600">AIRCRAFT DOWNED</span>
          <span className="font-bold text-[#1c1815]">{airLosses} SORTIES</span>
        </div>
      </div>

      {/* Caption */}
      <p className="text-[11px] font-broadsheet italic text-neutral-700 mt-1.5 leading-snug">
        Figure 1.A — Tactical Vector Lithograph: Grease-pencil breakthrough vectors, echelon flanking arcs, and crater distribution at {sectorName}.
      </p>
    </div>
  );
};
