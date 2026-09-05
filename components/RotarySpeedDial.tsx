'use client';

import React from 'react';

interface RotarySpeedDialProps {
  speed: number; // 0, 1, 2, 5, 10
  onChangeSpeed: (newSpeed: number) => void;
  isPlaying?: boolean;
  label?: string;
}

const SPEED_POSITIONS: { label: string; speed: number; angle: number }[] = [
  { label: 'HOLD', speed: 0, angle: -60 },
  { label: '1X', speed: 1, angle: -30 },
  { label: '2X', speed: 2, angle: 0 },
  { label: '5X', speed: 5, angle: 30 },
  { label: '10X', speed: 10, angle: 60 }
];

export const RotarySpeedDial: React.FC<RotarySpeedDialProps> = ({
  speed,
  onChangeSpeed,
  isPlaying = true,
  label = 'WAR ROOM CLOCK GEAR'
}) => {
  const currentEffectiveSpeed = !isPlaying ? 0 : speed;
  const currentPos = SPEED_POSITIONS.find(p => p.speed === currentEffectiveSpeed) || SPEED_POSITIONS[1];

  const handleStepNext = () => {
    const currentIndex = SPEED_POSITIONS.findIndex(p => p.speed === currentEffectiveSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_POSITIONS.length;
    onChangeSpeed(SPEED_POSITIONS[nextIndex].speed);
  };

  return (
    <div className="flex flex-col items-center select-none bg-[#1e2420] p-2 rounded-lg border border-[#404c42] shadow-md">
      {/* Nameplate Header */}
      <span className="text-[8px] font-space tracking-widest text-[#a1b39e] uppercase mb-1">
        {label}
      </span>

      {/* Rotary Dial Assembly */}
      <div className="relative w-28 h-24 flex items-center justify-center">
        {/* Perimeter Etched Position Tick Marks & Labels */}
        {SPEED_POSITIONS.map((pos) => {
          const isSelected = pos.speed === currentEffectiveSpeed;
          const rad = ((pos.angle - 90) * Math.PI) / 180;
          const x = 56 + Math.cos(rad) * 44;
          const y = 48 + Math.sin(rad) * 44;

          return (
            <button
              key={pos.label}
              type="button"
              onClick={() => onChangeSpeed(pos.speed)}
              className={`absolute text-[8px] font-space font-bold transition-colors cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                isSelected ? 'text-[#ff9933] drop-shadow-[0_0_4px_#ff7700]' : 'text-[#7d907e] hover:text-[#c4d6c4]'
              }`}
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              {pos.label}
            </button>
          );
        })}

        {/* Center Knurled Aluminum Knob Body */}
        <button
          type="button"
          onClick={handleStepNext}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#2a3038] via-[#56606d] to-[#7a8694] border-2 border-[#1c2229] shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          title="Click knob to cycle simulation gear ratio"
        >
          {/* Knurled Grip Ridges (Radial dashed pattern) */}
          <div className="absolute inset-1 rounded-full border border-dashed border-[#232a33] opacity-60" />

          {/* Rotating Aluminum Faceplate with Indicator Notch */}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#485361] to-[#2e3640] shadow-inner relative transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${currentPos.angle}deg)` }}
          >
            {/* Machined Indicator Notch / Orange Pip */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-[#ff9933] rounded-sm shadow-[0_0_4px_#ff7700]" />
            {/* Center Screw */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#1e242b] border border-[#5a6572]" />
          </div>
        </button>
      </div>

      {/* Readout */}
      <span className="text-[7px] font-industrial text-[#8ca08d] tracking-wider mt-0.5">
        CLICK KNOB TO ADVANCE
      </span>
    </div>
  );
};
