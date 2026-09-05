'use client';

import React from 'react';

interface TacticalPeriscopeScopeProps {
  children: React.ReactNode;
  activeRadarSweep?: boolean;
  azimuthDeg?: number;
  sectorName?: string;
  theme?: 'green' | 'amber' | 'blue';
}

export const TacticalPeriscopeScope: React.FC<TacticalPeriscopeScopeProps> = ({
  children,
  activeRadarSweep = true,
  azimuthDeg = 45,
  sectorName = 'SAN PIETRO CENTRAL DEMARCATION ZONE',
  theme = 'green'
}) => {
  const phosphorGlow = {
    green: 'border-[#34d399]/40 shadow-[0_0_30px_rgba(52,211,153,0.25)]',
    amber: 'border-[#fbbf24]/40 shadow-[0_0_30px_rgba(251,191,36,0.25)]',
    blue: 'border-[#38bdf8]/40 shadow-[0_0_30px_rgba(56,189,248,0.25)]'
  }[theme];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 select-none overflow-hidden">
      {/* Outer Heavy Steel Housing (Battleship Enamel #3c434d + Seafoam) */}
      <div className="relative w-full h-full max-w-[980px] max-h-[860px] aspect-square rounded-full p-4 bg-gradient-to-tr from-[#1b221d] via-[#2d3b31] to-[#3f5244] border-8 border-[#26332a] shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_4px_12px_rgba(255,255,255,0.2)] flex items-center justify-center">
        {/* Perimeter Fastener Hex Screws */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 48;
          const y = 50 + Math.sin(rad) * 48;
          return (
            <div
              key={deg}
              className="absolute hex-screw scale-90 z-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            />
          );
        })}

        {/* Azimuth Calibrated Dial Ring (000° to 360°) */}
        <div className="absolute inset-4 rounded-full border-4 border-[#4d6153] pointer-events-none flex items-center justify-center z-20">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            {/* Compass Cardinal Marks */}
            <text x="200" y="24" textAnchor="middle" fill="#d1fae5" fontSize="12" fontWeight="bold" fontFamily="monospace">000° N</text>
            <text x="380" y="204" textAnchor="middle" fill="#d1fae5" fontSize="12" fontWeight="bold" fontFamily="monospace">090° E</text>
            <text x="200" y="386" textAnchor="middle" fill="#d1fae5" fontSize="12" fontWeight="bold" fontFamily="monospace">180° S</text>
            <text x="20" y="204" textAnchor="middle" fill="#d1fae5" fontSize="12" fontWeight="bold" fontFamily="monospace">270° W</text>

            {/* Minor Tick Marks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              const rad = ((deg - 90) * Math.PI) / 180;
              const r1 = deg % 30 === 0 ? 180 : 185;
              const r2 = 192;
              const x1 = 200 + Math.cos(rad) * r1;
              const y1 = 200 + Math.sin(rad) * r1;
              const x2 = 200 + Math.cos(rad) * r2;
              const y2 = 200 + Math.sin(rad) * r2;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#799481"
                  strokeWidth={deg % 30 === 0 ? 2 : 1}
                />
              );
            })}
          </svg>
        </div>

        {/* Circular CRT Periscope Lens Inner Display */}
        <div className={`relative w-[92%] h-[92%] rounded-full overflow-hidden bg-[#061009] border-4 ${phosphorGlow} z-10 flex items-center justify-center`}>
          {/* Inner Phosphor Coordinate Grid */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Concentric Range Rings */}
              <circle cx="50" cy="50" r="18" fill="none" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1 1" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1 1" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="0.6" />
              {/* Crosshairs */}
              <line x1="50" y1="5" x2="50" y2="95" stroke="#34d399" strokeWidth="0.4" strokeDasharray="2 2" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#34d399" strokeWidth="0.4" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Actual Tactical Map Canvas Content (Embedded child) */}
          <div className="w-full h-full relative z-0 flex items-center justify-center">
            {children}
          </div>

          {/* Rotating Radar Sweep Line Beam with Phosphor Trail */}
          {activeRadarSweep && (
            <div className="absolute inset-0 pointer-events-none z-20 animate-[spin_6s_linear_infinite]">
              <div className="w-full h-full relative">
                {/* Sweep Beam Wedge */}
                <div
                  className="absolute top-1/2 left-1/2 w-[50%] h-[50%] origin-top-left pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg at 0% 0%, rgba(52, 211, 153, 0.4) 0deg, rgba(52, 211, 153, 0.08) 25deg, transparent 40deg)'
                  }}
                />
                {/* Leading Ray */}
                <div className="absolute top-1/2 left-1/2 w-[50%] h-[1.5px] bg-[#a7f3d0] shadow-[0_0_6px_#34d399] origin-left" />
              </div>
            </div>
          )}

          {/* Curved Lens Glass Reflection Highlights */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.18)_0%,transparent_50%)] pointer-events-none z-30" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_65%_75%,rgba(255,255,255,0.06)_0%,transparent_40%)] pointer-events-none z-30" />

          {/* Periscope Vignette Shadow */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.85)] pointer-events-none z-30" />
        </div>

        {/* Top Nameplate Tag */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#202923] border border-[#526657] px-3 py-0.5 rounded text-[8px] font-space font-bold tracking-widest text-[#a7f3d0] uppercase z-30 shadow-md">
          {sectorName}
        </div>
      </div>
    </div>
  );
};
