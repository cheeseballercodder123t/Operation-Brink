'use client';

import React from 'react';

interface NixieTubeProps {
  value: string | number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NixieTube: React.FC<NixieTubeProps> = ({
  value,
  label,
  size = 'md'
}) => {
  const strVal = String(value);

  const sizeClasses = {
    sm: {
      tube: 'h-9 px-1.5 min-w-[20px]',
      text: 'text-sm font-bold',
      label: 'text-[7px]'
    },
    md: {
      tube: 'h-12 px-2.5 min-w-[28px]',
      text: 'text-lg md:text-xl font-bold',
      label: 'text-[8px]'
    },
    lg: {
      tube: 'h-16 px-3.5 min-w-[36px]',
      text: 'text-2xl md:text-3xl font-extrabold',
      label: 'text-[9px]'
    }
  }[size];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Label above or below */}
      {label && (
        <span className={`${sizeClasses.label} font-space tracking-widest text-[#a8b8a5] uppercase mb-1`}>
          {label}
        </span>
      )}

      {/* Tube Glass Housing Array */}
      <div className="flex items-center gap-1 bg-[#14100c] p-1 rounded-md border-2 border-[#3d332a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_2px_4px_rgba(0,0,0,0.5)]">
        {strVal.split('').map((char, idx) => {
          const isColon = char === ':' || char === '.';
          return (
            <div
              key={idx}
              className={`nixie-tube-housing relative flex items-center justify-center ${sizeClasses.tube} ${
                isColon ? 'min-w-[12px] px-0.5' : ''
              }`}
            >
              {/* Internal Filament Glow */}
              <span className={`nixie-digit ${sizeClasses.text} z-10 leading-none`}>
                {char}
              </span>

              {/* Inactive background wire numerals faint silhouette */}
              {!isColon && (
                <span className={`absolute ${sizeClasses.text} text-[#4a2e18]/30 font-space leading-none select-none pointer-events-none`}>
                  8
                </span>
              )}

              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 left-1 right-1 h-[35%] bg-gradient-to-b from-white/20 to-transparent rounded-t-sm pointer-events-none" />
              <div className="absolute bottom-1 left-1.5 right-1.5 h-1 bg-amber-500/20 rounded-full blur-[1px] pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
