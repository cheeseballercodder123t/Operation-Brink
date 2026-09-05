'use client';

import React, { useState } from 'react';
import {
  Globe,
  Globe2,
  Radio,
  Ship,
  Train,
  Crosshair,
  Newspaper,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Award,
  Maximize2,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { WarRoomState, FlashpointBattle, CommanderProfile } from '@/lib/warRoom';
import { DiplomaticLedger } from '@/lib/diplomacy';
import { EconomyState } from '@/lib/economy';
import { FactionId } from '@/app/page';
import { NixieTube } from './NixieTube';
import { VUMeter } from './VUMeter';
import { AnnunciatorButton } from './AnnunciatorButton';
import { RotarySpeedDial } from './RotarySpeedDial';
import { JewelIndicator } from './JewelIndicator';
import { TeletypeRibbon } from './TeletypeRibbon';

interface StrategicMapRoomProps {
  warRoom: WarRoomState;
  diplomaticLedger: DiplomaticLedger;
  economyState: EconomyState;
  defcon: number;
  simTimeStr: string;
  simTick: number;
  unifiedState: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTuneInToTactical: (flashpoint?: FlashpointBattle) => void;
  onOpenNewspaper: (battle?: FlashpointBattle) => void;
  onTriggerUnification: () => void;
  simSpeed?: number;
  onChangeSpeed?: (s: number) => void;
  transmissions?: any[];
}

export const StrategicMapRoom: React.FC<StrategicMapRoomProps> = ({
  warRoom,
  diplomaticLedger,
  economyState,
  defcon,
  simTimeStr,
  simTick,
  unifiedState,
  isPlaying,
  onTogglePlay,
  onTuneInToTactical,
  onOpenNewspaper,
  onTriggerUnification,
  simSpeed = 1,
  onChangeSpeed = () => {},
  transmissions = []
}) => {
  const [selectedCommander, setSelectedCommander] = useState<FactionId>('loyalists');
  const [activeTab, setActiveTab] = useState<'MAP' | 'DOSSIERS' | 'TELETYPE'>('MAP');

  const activeFlashpoint = warRoom.flashpoints.find(f => f.status === 'ACTIVE_CLASH');
  const latestResolved = warRoom.flashpoints.find(f => f.status === 'RESOLVED');

  // Calculate overall tension for VU meter (0 to 100)
  const volskanTension = Math.max(0, 100 - warRoom.homefrontMorale.volskan);
  const coalitionTension = Math.max(0, 100 - warRoom.homefrontMorale.coalition);
  const avgGlobalTension = Math.round((volskanTension + coalitionTension) / 2);
  const strikeReadiness = Math.round(100 - (defcon - 1) * 22);

  return (
    <div className="relative w-full h-full bg-[#1b221d] text-[#e3dcce] font-industrial flex flex-col select-none overflow-hidden">
      {/* 1. TOP PHYSICAL CONSOLE CHASSIS HEADER (Powder-Coated Seafoam Green #2f4438) */}
      <div className="chassis-seafoam border-b-4 border-[#1c2920] px-4 py-2 flex items-center justify-between z-10 shadow-lg">
        {/* Left: Console Nameplate & Jewel Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <JewelIndicator color="emerald" active={true} label="PWR" size="sm" />
            <JewelIndicator
              color="amber"
              active={defcon <= 3}
              label="WARN"
              size="sm"
            />
            <JewelIndicator
              color="red"
              active={defcon <= 2}
              label="ALERT"
              size="sm"
            />
          </div>

          <div className="border-l border-[#4d6354] pl-3">
            <div className="text-xs font-space font-bold tracking-wider text-[#d1fae5] flex items-center gap-2">
              <span>PROJECT BRINK // WAR ROOM MACRO THEATRE</span>
              <span className="text-[9px] px-2 py-0.5 bg-[#1b261f] border border-[#526b5a] text-[#86efac] rounded-sm uppercase tracking-widest">
                DR. STRANGELOVE BIG BOARD
              </span>
            </div>
            <div className="text-[9px] text-[#a7f3d0]/75 tracking-wider font-space">
              1963 Demarcation Strategic Command Console • Model SAC-63
            </div>
          </div>
        </div>

        {/* Center: Nixie Tube Clock Readout & Rotary Speed Switch */}
        <div className="flex items-center gap-5">
          {/* Nixie Tube Clock */}
          <NixieTube
            value={simTimeStr.slice(0, 5)}
            label="THEATRE TIME (HRS)"
            size="sm"
          />

          {/* NASA Annunciator Controls */}
          <div className="flex items-center gap-2">
            <AnnunciatorButton
              label={isPlaying ? 'ADVANCE' : 'STANDBY'}
              sublabel={isPlaying ? 'CLOCK ACTIVE' : 'SYSTEM HELD'}
              active={isPlaying}
              color="green"
              onClick={onTogglePlay}
            />

            <AnnunciatorButton
              label="MORNING DISPATCH"
              sublabel="PRESS CABLES"
              active={Boolean(latestResolved || activeFlashpoint)}
              color="orange"
              onClick={() => onOpenNewspaper(latestResolved || activeFlashpoint)}
              badge={
                latestResolved ? (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                ) : undefined
              }
            />

            {/* Primary Action Button: TUNE IN TO TACTICAL PERISCOPE */}
            <AnnunciatorButton
              label="TUNE IN PERISCOPE"
              sublabel="CATHODE RAY SCOPE"
              active={Boolean(activeFlashpoint)}
              color={activeFlashpoint ? 'red' : 'blue'}
              onClick={() => onTuneInToTactical(activeFlashpoint)}
              className="scale-105"
            />
          </div>
        </div>

        {/* Right: Analog Meter Gauge & DEFCON Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-space font-bold tracking-widest text-[#a7f3d0]">
              DEFCON ALERT STATUS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[5, 4, 3, 2, 1].map((level) => (
                <div
                  key={level}
                  className={`w-4 h-5 rounded-sm flex items-center justify-center text-[10px] font-space font-bold border transition-all ${
                    defcon === level
                      ? level <= 2
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_8px_#ef4444] animate-pulse'
                        : level === 3
                        ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_8px_#f59e0b]'
                        : 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-[#18221b] border-[#36473b] text-neutral-500'
                  }`}
                >
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN DR. STRANGELOVE "BIG BOARD" THEATRE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Backlit Acrylic Cartography Screen */}
        <div className="flex-1 relative bg-[#121915] border-r-4 border-[#1e2a21] overflow-hidden flex items-center justify-center p-3">
          {/* Bevelled Aluminum Frame Border & Hex Screws around map */}
          <div className="absolute top-2 left-2 hex-screw z-30" />
          <div className="absolute top-2 right-2 hex-screw z-30" />
          <div className="absolute bottom-2 left-2 hex-screw z-30" />
          <div className="absolute bottom-2 right-2 hex-screw z-30" />

          {/* Frosted Acrylic Glass Edge-Lit Backlit Map */}
          <div className="w-full h-full relative rounded border-2 border-[#37493d] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden bg-[#0d1612]">
            {/* Top-Down Geopolitical SVG Cartography */}
            <svg className="w-full h-full" viewBox="0 0 1280 800">
              <defs>
                {/* Backlit Acrylic Grid */}
                <pattern id="bigboard-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1d2e23" strokeWidth="0.8" />
                </pattern>

                {/* Glass Edge Glow Filters */}
                <filter id="grease-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="1280" height="800" fill="url(#bigboard-grid)" />

              {/* Deep Slate Ocean (Atlantic Coalition Sea Sector) */}
              <path
                d="M 0 0 L 300 0 L 230 320 L 170 510 L 250 800 L 0 800 Z"
                fill="#12202a"
                stroke="#1f3b4d"
                strokeWidth="2.5"
              />
              <text x="60" y="240" fill="#38bdf8" opacity="0.6" fontSize="14" fontWeight="bold" letterSpacing="5" fontFamily="'Orbitron', sans-serif">
                ATLANTIC COALITION SECTOR
              </text>
              <text x="60" y="262" fill="#7dd3fc" opacity="0.45" fontSize="10" letterSpacing="3" fontFamily="'Courier Prime', monospace">
                TASK FORCE 72 CARRIER BATTLE GROUP PATROL
              </text>

              {/* Eastern Volskan Heavy Railhead & Steppes */}
              <path
                d="M 1280 0 L 1000 0 L 1070 330 L 1030 530 L 1110 800 L 1280 800 Z"
                fill="#261715"
                stroke="#4a2520"
                strokeWidth="2.5"
              />
              <text x="1060" y="240" fill="#f87171" opacity="0.6" fontSize="14" fontWeight="bold" letterSpacing="5" fontFamily="'Orbitron', sans-serif">
                VOLSKAN UNION SECTOR
              </text>
              <text x="1060" y="262" fill="#fca5a5" opacity="0.45" fontSize="10" letterSpacing="3" fontFamily="'Courier Prime', monospace">
                TRANS-STEPPE STRATEGIC HEAVY RAILHEADS
              </text>

              {/* SAN PIETRO THEATRE (Center Landmass) */}
              {/* Northern Sector: San Pietro Junta Territory */}
              <path
                d="M 300 0 L 1000 0 L 1070 330 L 640 430 L 230 320 Z"
                fill="#1b2e22"
                stroke="#2f543c"
                strokeWidth="3"
              />
              <text x="500" y="180" fill="#86efac" opacity="0.75" fontSize="20" fontWeight="bold" letterSpacing="8" fontFamily="'Orbitron', sans-serif">
                NORTH SAN PIETRO
              </text>
              <text x="500" y="205" fill="#a7f3d0" opacity="0.5" fontSize="11" letterSpacing="3" fontFamily="'Courier Prime', monospace">
                PRESIDENTIAL JUNTA FORTIFIED ARMORED CORRIDOR
              </text>

              {/* Southern Sector: Sierra Rebel Highlands */}
              <path
                d="M 230 320 L 640 430 L 1070 330 L 1030 530 L 1110 800 L 250 800 L 170 510 Z"
                fill="#2a1b18"
                stroke="#543029"
                strokeWidth="3"
              />
              <text x="520" y="600" fill="#fca5a5" opacity="0.75" fontSize="20" fontWeight="bold" letterSpacing="8" fontFamily="'Orbitron', sans-serif">
                SIERRA HIGHLANDS
              </text>
              <text x="510" y="625" fill="#fecaca" opacity="0.5" fontSize="11" letterSpacing="3" fontFamily="'Courier Prime', monospace">
                LIBERATION FRONT AUTONOMOUS CADRES
              </text>

              {/* Disputed Demarcation Ceasefire Line (Grease-Pencil Orange Line) */}
              <path
                d="M 230 320 Q 430 380 640 430 Q 870 380 1070 330"
                fill="none"
                stroke="#ffaa00"
                strokeWidth="5"
                strokeDasharray="12 8"
                filter="url(#grease-glow)"
              />
              <text x="500" y="405" fill="#ffdd55" fontSize="11" fontWeight="bold" letterSpacing="3" fontFamily="'Special Elite', monospace">
                {`// UN DEMARCATION CEASEFIRE LINE [SECTOR 4] //`}
              </text>

              {/* Grease-Pencil Annotations (Dr. Strangelove Glass Hand-drawn Markings) */}
              <g opacity="0.85">
                {/* Grease Mark 1: Delta Bridge */}
                <path d="M 600 450 Q 640 480 690 460" fill="none" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
                <text x="590" y="500" fill="#fef08a" fontSize="11" fontFamily="'Special Elite', monospace" fontWeight="bold" transform="rotate(-4, 590, 500)">
                  &quot;DELTA BRIDGE - CHOKEPOINT ALPHA&quot;
                </text>

                {/* Grease Mark 2: Maritime Shipping Corridor */}
                <path d="M 120 480 L 160 560" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                <text x="50" y="575" fill="#7dd3fc" fontSize="10" fontFamily="'Special Elite', monospace">
                  [NAV-LANE CHARLIE: 4 CONVOYS INBOUND]
                </text>

                {/* Grease Mark 3: Heavy Artillery Staging */}
                <circle cx="1080" cy="510" r="32" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" />
                <text x="1000" y="565" fill="#fca5a5" fontSize="10" fontFamily="'Special Elite', monospace">
                  [BATTERY 152MM EMPLACEMENT]
                </text>
              </g>

              {/* Monsoon Storm Front Shadow */}
              <circle
                cx={warRoom.monsoon.x}
                cy={warRoom.monsoon.y}
                r={warRoom.monsoon.radius}
                fill="rgba(30, 41, 59, 0.45)"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeDasharray="8 6"
              />
              <text
                x={warRoom.monsoon.x - 90}
                y={warRoom.monsoon.y - warRoom.monsoon.radius + 24}
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="bold"
                fontFamily="'Orbitron', sans-serif"
              >
                ☁ MONSOON SQUALL FRONT (CAS GROUNDED)
              </text>

              {/* Animated Maritime Convoys & Rail Logistics Lines */}
              {warRoom.logisticsLines.map(line => {
                const curX = line.startX + (line.endX - line.startX) * (line.progress / 100);
                const curY = line.startY + (line.endY - line.startY) * (line.progress / 100);
                const isSea = line.type === 'MARITIME_CONVOY';

                return (
                  <g key={line.id}>
                    <line
                      x1={line.startX}
                      y1={line.startY}
                      x2={line.endX}
                      y2={line.endY}
                      stroke={isSea ? '#0284c7' : '#ea580c'}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      opacity="0.6"
                    />
                    <circle cx={curX} cy={curY} r="6" fill={isSea ? '#38bdf8' : '#f97316'} stroke="#ffffff" strokeWidth="1.5" />
                    {isSea ? (
                      <text x={curX + 10} y={curY + 4} fill="#bae6fd" fontSize="10" fontWeight="bold" fontFamily="'Courier Prime', monospace">
                        🚢 {line.cargo}
                      </text>
                    ) : (
                      <text x={curX + 10} y={curY + 4} fill="#fed7aa" fontSize="10" fontWeight="bold" fontFamily="'Courier Prime', monospace">
                        🚂 {line.cargo}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Strategic Key Fortress Nodes */}
              {[
                { name: 'Santa Maria Citadel', x: 380, y: 260, faction: 'loyalists' },
                { name: 'Delta Causeway Bridge', x: 640, y: 430, faction: 'disputed' },
                { name: 'Black Gold Refineries', x: 1080, y: 520, faction: 'disputed' },
                { name: 'Port Bella Docks', x: 240, y: 680, faction: 'coalition' },
                { name: 'Monte Oro Logistics Depot', x: 980, y: 680, faction: 'volskan' }
              ].map((node, i) => (
                <g key={i}>
                  <circle cx={node.x} cy={node.y} r="10" fill="#14261b" stroke="#34d399" strokeWidth="2.5" />
                  <circle cx={node.x} cy={node.y} r="4" fill="#34d399" />
                  <text x={node.x + 14} y={node.y + 5} fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="'Orbitron', sans-serif">
                    {node.name}
                  </text>
                </g>
              ))}

              {/* Active Flashpoint Pulsing Radar Beacon */}
              {activeFlashpoint && (
                <g
                  className="cursor-pointer"
                  onClick={() => onTuneInToTactical(activeFlashpoint)}
                >
                  <circle
                    cx={activeFlashpoint.x}
                    cy={activeFlashpoint.y}
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    className="animate-ping"
                  />
                  <circle
                    cx={activeFlashpoint.x}
                    cy={activeFlashpoint.y}
                    r="22"
                    fill="rgba(239, 68, 68, 0.45)"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  <text
                    x={activeFlashpoint.x}
                    y={activeFlashpoint.y - 50}
                    textAnchor="middle"
                    fill="#fca5a5"
                    fontSize="13"
                    fontWeight="bold"
                    letterSpacing="2"
                    fontFamily="'Orbitron', sans-serif"
                  >
                    ⚡ ACTIVE CLASH: {activeFlashpoint.sectorName.toUpperCase()}
                  </text>
                  <text
                    x={activeFlashpoint.x}
                    y={activeFlashpoint.y - 34}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="'Courier Prime', monospace"
                    fontWeight="bold"
                  >
                    {activeFlashpoint.attackerStrength} STR vs {activeFlashpoint.defenderStrength} STR • [CLICK TO TUNE IN SCOPE]
                  </text>
                </g>
              )}
            </svg>

            {/* Bottom Floating Tactical Intercept Drawer */}
            {activeFlashpoint && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#1f2923]/95 border-2 border-red-500 p-3 shadow-2xl backdrop-blur flex items-center justify-between z-20 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-red-950 border border-red-500 flex items-center justify-center text-red-400 animate-pulse">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-space font-bold text-red-300 flex items-center gap-2">
                      <span>FLASHPOINT ENGAGEMENT IN PROGRESS: {activeFlashpoint.sectorName.toUpperCase()}</span>
                      <span className="text-[9px] px-2 py-0.5 bg-red-950 text-red-200 border border-red-700">
                        EST. DURATION: 4 HRS
                      </span>
                    </div>
                    <div className="text-[11px] font-teletype text-neutral-300 mt-0.5">
                      Casualties: {activeFlashpoint.casualtiesAttacker + activeFlashpoint.casualtiesDefender} | Armor Lost: {activeFlashpoint.armorLostAttacker + activeFlashpoint.armorLostDefender} | Air Sorties Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AnnunciatorButton
                    label="WAR DISPATCH"
                    sublabel="MORNING WIRE"
                    active={true}
                    color="orange"
                    onClick={() => onOpenNewspaper(activeFlashpoint)}
                  />

                  <AnnunciatorButton
                    label="TUNE IN SCOPE"
                    sublabel="RADAR PERISCOPE"
                    active={true}
                    color="red"
                    onClick={() => onTuneInToTactical(activeFlashpoint)}
                    className="scale-105"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Physical Control Deck & Dossiers (Bakelite Ivory & Seafoam Chassis) */}
        <div className="w-[420px] chassis-grey flex flex-col overflow-hidden border-l-4 border-[#242b32]">
          {/* Top VU Meter Cluster: Global Tension & Strike Readiness */}
          <div className="p-3 bg-[#242a30] border-b-2 border-[#1c2229] flex items-center justify-around gap-2 shadow-inner">
            <VUMeter
              value={avgGlobalTension}
              label="GLOBAL TENSION"
              unit="%"
              dangerThreshold={75}
              warningThreshold={50}
              width={140}
              height={85}
            />
            <VUMeter
              value={strikeReadiness}
              label="STRIKE READINESS"
              unit="%"
              dangerThreshold={80}
              warningThreshold={55}
              width={140}
              height={85}
            />
          </div>

          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-2 bg-[#2d343c] border-b border-[#1c2229]">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`py-2 text-xs font-space font-bold transition-all ${
                activeTab === 'MAP'
                  ? 'bg-[#3c4550] text-[#86efac] border-b-2 border-emerald-400 shadow-inner'
                  : 'text-neutral-400 hover:bg-[#343d46]'
              }`}
            >
              COMMAND DOSSIERS
            </button>
            <button
              onClick={() => setActiveTab('TELETYPE')}
              className={`py-2 text-xs font-space font-bold transition-all ${
                activeTab === 'TELETYPE'
                  ? 'bg-[#3c4550] text-[#86efac] border-b-2 border-emerald-400 shadow-inner'
                  : 'text-neutral-400 hover:bg-[#343d46]'
              }`}
            >
              TELETYPE TAPE
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'MAP' ? (
              <div className="space-y-3">
                <div className="text-[10px] font-space uppercase font-bold text-[#b4c4b2] tracking-wider">
                  Select Commander Profile:
                </div>

                {/* 4 Commander Selector Tiles */}
                <div className="grid grid-cols-2 gap-2">
                  {(['loyalists', 'rebels', 'coalition', 'volskan'] as FactionId[]).map(fId => {
                    const cmd = warRoom.commanders[fId];
                    const isSel = selectedCommander === fId;
                    return (
                      <button
                        key={fId}
                        onClick={() => setSelectedCommander(fId)}
                        className={`p-2 text-left border-2 rounded transition-all ${
                          isSel
                            ? 'bg-[#29382f] border-emerald-500 text-white shadow-md'
                            : 'bg-[#1e2621] border-[#36443a] text-neutral-400 hover:bg-[#253028]'
                        }`}
                      >
                        <div className="text-[9px] font-space uppercase text-[#a7f3d0]">{fId}</div>
                        <div className="font-space font-bold text-[11px] truncate text-[#f1f5f9]">{cmd.name}</div>
                        <div className="text-[9px] font-industrial text-amber-400 truncate">{cmd.title}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Commander Detailed Dossier Card */}
                {(() => {
                  const cmd = warRoom.commanders[selectedCommander];
                  return (
                    <div className="p-3.5 bg-[#253028] border-2 border-[#3d4d41] rounded shadow-md space-y-2.5">
                      <div className="flex justify-between items-start border-b border-[#3c4c40] pb-2">
                        <div>
                          <div className="text-[10px] text-[#93a695] uppercase font-space">{cmd.rank}</div>
                          <div className="text-sm font-space font-bold text-[#86efac]">{cmd.name}</div>
                          <div className="text-[10px] text-amber-300 font-bold font-industrial">{cmd.title}</div>
                        </div>
                        <Award className="w-5 h-5 text-amber-400" />
                      </div>

                      <div className="text-[11px] italic font-broadsheet text-[#f0ebe1] bg-[#1a231d] p-2.5 rounded border-l-4 border-amber-600">
                        &ldquo;{cmd.quote}&rdquo;
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="font-space font-bold text-[#94a896] uppercase text-[9px]">Psychological Assessment:</div>
                        <p className="text-[#d8cfbe] font-industrial leading-relaxed">{cmd.psychologicalProfile}</p>
                      </div>

                      {/* Tactical Doctrine Ratings */}
                      <div className="pt-2 border-t border-[#3c4c40] grid grid-cols-2 gap-2 text-xs font-space">
                        <div>
                          <span className="text-[#88998a] text-[9px]">Aggression: </span>
                          <span className="font-bold text-emerald-400">{Math.round(cmd.doctrine.attackBonus * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-[#88998a] text-[9px]">Defense: </span>
                          <span className="font-bold text-sky-400">{Math.round(cmd.doctrine.defenseBonus * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-[#88998a] text-[9px]">Retreat: </span>
                          <span className="font-bold text-amber-400">{Math.round(cmd.doctrine.retreatThreshold * 100)}% HP</span>
                        </div>
                        <div>
                          <span className="text-[#88998a] text-[9px]">Treaty: </span>
                          <span className="font-bold text-purple-400">{Math.round(cmd.doctrine.treatyWillingness * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Superpower Homefront Morale Meters */}
                <div className="p-3 bg-[#253028] border-2 border-[#3d4d41] rounded shadow-md space-y-2">
                  <div className="text-[10px] font-space font-bold text-[#d1fae5] flex justify-between items-center">
                    <span>SUPERPOWER HOMEFRONT STABILITY</span>
                    <Users className="w-4 h-4 text-[#a7f3d0]" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-space mb-0.5">
                      <span className="text-sky-300">Coalition Domestic Support:</span>
                      <span className="font-bold text-white">{Math.round(warRoom.homefrontMorale.coalition)}%</span>
                    </div>
                    <div className="w-full bg-[#161f19] h-2 rounded-sm border border-[#37493d] overflow-hidden">
                      <div
                        className={`h-full ${warRoom.homefrontMorale.coalition < 50 ? 'bg-red-500' : 'bg-sky-500'}`}
                        style={{ width: `${warRoom.homefrontMorale.coalition}%` }}
                      />
                    </div>
                    {warRoom.antiWarProtestsActive.coalition && (
                      <div className="text-[9px] font-space text-red-400 font-bold mt-1">
                        ⚠ STUDENT ANTI-WAR PROTESTS IN DC • REINFORCEMENTS RESTRICTED
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-space mb-0.5">
                      <span className="text-red-400">Volskan Domestic Stability:</span>
                      <span className="font-bold text-white">{Math.round(warRoom.homefrontMorale.volskan)}%</span>
                    </div>
                    <div className="w-full bg-[#161f19] h-2 rounded-sm border border-[#37493d] overflow-hidden">
                      <div
                        className={`h-full ${warRoom.homefrontMorale.volskan < 50 ? 'bg-red-500' : 'bg-red-600'}`}
                        style={{ width: `${warRoom.homefrontMorale.volskan}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Third-Bloc Unification Action */}
                {!unifiedState ? (
                  <button
                    onClick={onTriggerUnification}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-600 hover:from-emerald-700 hover:to-emerald-500 border-2 border-emerald-400 text-white font-space text-xs font-bold flex items-center justify-center gap-2 rounded shadow-md transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-white" />
                    <span>DECLARE NON-ALIGNED UNIFICATION ACCORD</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-950 border-2 border-emerald-500 text-xs font-space text-emerald-300 rounded shadow">
                    ★ THIRD BLOC SOVEREIGN STATE DECLARED: 48H FOREIGN WITHDRAWAL ENFORCED.
                  </div>
                )}
              </div>
            ) : (
              /* Perforated Teletype Ribbon */
              <TeletypeRibbon
                transmissions={transmissions}
                recentEvents={diplomaticLedger.recentEvents}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
