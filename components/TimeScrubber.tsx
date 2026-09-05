'use client';

import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock, History } from 'lucide-react';
import { SimHistorySnapshot } from '@/lib/warRoom';

interface TimeScrubberProps {
  snapshots: SimHistorySnapshot[];
  scrubIndex: number; // -1 if live
  onScrubChange: (index: number) => void;
  onReturnToLive: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  liveTimeStr: string;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  snapshots,
  scrubIndex,
  onScrubChange,
  onReturnToLive,
  isPlaying,
  onTogglePlay,
  liveTimeStr
}) => {
  const isScrubbing = scrubIndex >= 0 && scrubIndex < snapshots.length;
  const currentSnapshot = isScrubbing ? snapshots[scrubIndex] : null;

  return (
    <div className="h-10 bg-[#091309] border-t border-[#1a2e1a] px-3 flex items-center justify-between text-xs font-mono text-[#4af626] select-none z-20">
      {/* Play/Pause & Live status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className="p-1 hover:bg-[#122412] text-white rounded transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <div className="flex items-center gap-1.5 text-[11px]">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-neutral-300">HISTORICAL REPLAY SCRUBBER:</span>
          {isScrubbing ? (
            <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 border border-amber-600 animate-pulse">
              REPLAY RECORDING [{currentSnapshot?.timeStr || 'SCRUBBING'}]
            </span>
          ) : (
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 border border-emerald-600">
              ● LIVE SIMULATION [{liveTimeStr}]
            </span>
          )}
        </div>
      </div>

      {/* Slider Scrubber Bar */}
      <div className="flex-1 max-w-xl mx-4 flex items-center gap-2">
        <span className="text-[10px] opacity-60">T-0</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, snapshots.length - 1)}
          value={isScrubbing ? scrubIndex : snapshots.length - 1}
          onChange={e => {
            const val = parseInt(e.target.value, 10);
            if (val === snapshots.length - 1) {
              onReturnToLive();
            } else {
              onScrubChange(val);
            }
          }}
          className="flex-1 h-1.5 bg-[#142814] accent-emerald-500 rounded cursor-pointer"
        />
        <span className="text-[10px] opacity-60 font-bold">LIVE</span>
      </div>

      {/* Return to Live Button */}
      <div>
        {isScrubbing ? (
          <button
            onClick={onReturnToLive}
            className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[10px] rounded tracking-wider flex items-center gap-1 transition-all animate-pulse"
          >
            <FastForward className="w-3 h-3" />
            <span>RETURN TO LIVE CLOCK</span>
          </button>
        ) : (
          <div className="text-[10px] opacity-60">
            {snapshots.length} Historical Frames Recorded
          </div>
        )}
      </div>
    </div>
  );
};
