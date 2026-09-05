'use client';

import React from 'react';

export type JewelColor = 'blue' | 'red' | 'amber' | 'emerald';

interface JewelIndicatorProps {
  color: JewelColor;
  active?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const JewelIndicator: React.FC<JewelIndicatorProps> = ({
  color,
  active = true,
  label,
  size = 'md'
}) => {
  const sizeMap = {
    sm: { bulb: 'w-4 h-4', bezel: 'w-6 h-6', font: 'text-[8px]' },
    md: { bulb: 'w-6 h-6', bezel: 'w-8 h-8', font: 'text-[9px]' },
    lg: { bulb: 'w-8 h-8', bezel: 'w-11 h-11', font: 'text-[10px]' }
  }[size];

  const colorStyles = {
    blue: {
      lit: 'bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#bae6fd] shadow-[0_0_12px_#38bdf8,inset_0_0_4px_#ffffff]',
      unlit: 'bg-[#0c2436] border-[#164e63]'
    },
    red: {
      lit: 'bg-gradient-to-tr from-[#991b1b] via-[#ef4444] to-[#fecaca] shadow-[0_0_12px_#ef4444,inset_0_0_4px_#ffffff]',
      unlit: 'bg-[#3b1212] border-[#7f1d1d]'
    },
    amber: {
      lit: 'bg-gradient-to-tr from-[#b45309] via-[#f59e0b] to-[#fef3c7] shadow-[0_0_12px_#f59e0b,inset_0_0_4px_#ffffff]',
      unlit: 'bg-[#331e0c] border-[#78350f]'
    },
    emerald: {
      lit: 'bg-gradient-to-tr from-[#047857] via-[#10b981] to-[#d1fae5] shadow-[0_0_12px_#10b981,inset_0_0_4px_#ffffff]',
      unlit: 'bg-[#0f2e1a] border-[#065f46]'
    }
  }[color];

  return (
    <div className="flex flex-col items-center select-none gap-0.5">
      {/* Chrome Bezel Mount */}
      <div
        className={`${sizeMap.bezel} rounded-full bg-gradient-to-tr from-[#2d343d] via-[#6b7685] to-[#9aa5b5] border border-[#1b2026] shadow-[0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center p-0.5`}
      >
        {/* Faceted Jewel Glass Lamp */}
        <div
          className={`${sizeMap.bulb} rounded-full border border-black/40 relative overflow-hidden transition-all duration-300 ${
            active ? colorStyles.lit : colorStyles.unlit
          }`}
        >
          {/* Diamond Glass Facet Highlights */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,0.7)_0%,transparent_60%)]" />
          {/* Internal filament line */}
          {active && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full blur-[0.5px]" />
          )}
        </div>
      </div>

      {/* Indicator Label */}
      {label && (
        <span className={`${sizeMap.font} font-industrial font-bold uppercase tracking-wider text-[#93a695]`}>
          {label}
        </span>
      )}
    </div>
  );
};
