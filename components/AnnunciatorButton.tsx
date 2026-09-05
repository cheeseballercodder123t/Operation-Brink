'use client';

import React from 'react';

export type AnnunciatorColor = 'orange' | 'amber' | 'green' | 'red' | 'blue' | 'white' | 'yellow';

interface AnnunciatorButtonProps {
  label: string;
  sublabel?: string;
  active?: boolean;
  color?: AnnunciatorColor;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export const AnnunciatorButton: React.FC<AnnunciatorButtonProps> = ({
  label,
  sublabel,
  active = false,
  color = 'orange',
  onClick,
  disabled = false,
  className = '',
  badge
}) => {
  const colorClass = active
    ? color === 'green'
      ? 'lit-green'
      : color === 'red'
      ? 'lit-red'
      : color === 'blue'
      ? 'lit-blue'
      : color === 'white'
      ? 'lit-white'
      : 'lit-orange'
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`annunciator-tile ${colorClass} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[11px] font-bold tracking-wider">{label}</span>
        {badge}
      </div>
      {sublabel && (
        <span
          className={`text-[8px] font-industrial tracking-widest mt-0.5 leading-none ${
            active ? 'opacity-90' : 'text-neutral-500'
          }`}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
};
