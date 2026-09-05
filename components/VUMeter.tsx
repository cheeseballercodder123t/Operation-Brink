'use client';

import React, { useEffect, useState } from 'react';

interface VUMeterProps {
  value: number; // 0 to 100
  label: string;
  unit?: string;
  dangerThreshold?: number; // default 75
  warningThreshold?: number; // default 50
  width?: number;
  height?: number;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  value,
  label,
  unit = '%',
  dangerThreshold = 75,
  warningThreshold = 50,
  width = 160,
  height = 95
}) => {
  const [jitter, setJitter] = useState(0);

  // Micro-tremor needle realism
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter((Math.random() - 0.5) * 1.5);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const clampedVal = Math.min(100, Math.max(0, value + jitter));
  // Needle angle from -48 deg to +48 deg
  const needleAngle = -48 + (clampedVal / 100) * 96;

  return (
    <div className="flex flex-col items-center select-none">
      {/* Outer Bakelite/Steel Meter Casing */}
      <div
        className="relative bg-[#1c221e] p-2 rounded-lg border-2 border-[#414d44] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Corner Brass Mounting Screws */}
        <div className="absolute top-1 left-1 hex-screw scale-75" />
        <div className="absolute top-1 right-1 hex-screw scale-75" />
        <div className="absolute bottom-1 left-1 hex-screw scale-75" />
        <div className="absolute bottom-1 right-1 hex-screw scale-75" />

        {/* Meter Dial Face (Incandescent Tungsten Backlit Ivory Faceplate) */}
        <div className="relative w-full h-full bg-[#faedd2] rounded border border-[#b8a88a] overflow-hidden shadow-inner flex flex-col items-center justify-between p-1">
          {/* Subtle Tungsten Backlight Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#fff3db] via-[#f7e6c1] to-[#ebd2a0] pointer-events-none" />

          {/* Calibrated Arc Gauge SVG */}
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 160 90">
            {/* Safe Zone Arc (Black/Dark Olive) */}
            <path
              d="M 25 72 A 65 65 0 0 1 95 20"
              fill="none"
              stroke="#2c332b"
              strokeWidth="3.5"
            />
            {/* Warning Zone Arc (Amber) */}
            <path
              d="M 95 20 A 65 65 0 0 1 125 35"
              fill="none"
              stroke="#d97706"
              strokeWidth="4"
            />
            {/* Danger Zone Arc (Red) */}
            <path
              d="M 125 35 A 65 65 0 0 1 145 68"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4.5"
            />

            {/* Scale Tick Marks */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => {
              const angleDeg = -48 + (t / 100) * 96;
              const angleRad = ((angleDeg - 90) * Math.PI) / 180;
              const rInner = t % 20 === 0 ? 54 : 58;
              const rOuter = 65;
              const x1 = 80 + Math.cos(angleRad) * rInner;
              const y1 = 80 + Math.sin(angleRad) * rInner;
              const x2 = 80 + Math.cos(angleRad) * rOuter;
              const y2 = 80 + Math.sin(angleRad) * rOuter;

              return (
                <line
                  key={t}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={t >= dangerThreshold ? '#b91c1c' : t >= warningThreshold ? '#b45309' : '#1e241f'}
                  strokeWidth={t % 20 === 0 ? 1.5 : 0.8}
                />
              );
            })}

            {/* Meter Legend Text */}
            <text x="80" y="52" textAnchor="middle" fill="#443c33" fontSize="8" fontFamily="'Chakra Petch', sans-serif" fontWeight="bold" letterSpacing="0.08em">
              {label.toUpperCase()}
            </text>
            <text x="80" y="62" textAnchor="middle" fill="#6b5f4f" fontSize="7" fontFamily="'Courier Prime', monospace">
              {Math.round(value)}{unit}
            </text>

            {/* Needle Pivot Center at (80, 82) */}
            <g transform={`rotate(${needleAngle}, 80, 82)`}>
              {/* Mechanical Needle */}
              <line
                x1="80"
                y1="82"
                x2="80"
                y2="18"
                stroke="#1c1917"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <line
                x1="80"
                y1="28"
                x2="80"
                y2="18"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Needle Counterweight tail */}
              <line
                x1="80"
                y1="82"
                x2="80"
                y2="88"
                stroke="#292524"
                strokeWidth="2.5"
              />
            </g>

            {/* Center Chrome Pivot Cap */}
            <circle cx="80" cy="82" r="6" fill="url(#pivot-gradient)" stroke="#3e4740" strokeWidth="1" />
            <circle cx="80" cy="82" r="2.5" fill="#1c221e" />

            <defs>
              <radialGradient id="pivot-gradient" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="70%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#1f2937" />
              </radialGradient>
            </defs>
          </svg>

          {/* Curved Glass Reflection Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-white/5 pointer-events-none rounded" />
        </div>
      </div>
    </div>
  );
};
