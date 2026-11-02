import React from 'react';
import { ProcessPreset, VisualLens } from '../types/process';
import {
  Play,
  Pause,
  Zap,
  Activity,
  Layers,
  Flame,
  ArrowRightLeft,
  Gauge,
  Cpu,
  Eye,
} from 'lucide-react';

interface ControlBarProps {
  currentPreset: ProcessPreset;
  onSelectPreset: (preset: ProcessPreset) => void;
  currentLens: VisualLens;
  onSelectLens: (lens: VisualLens) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onInjectDisturbance: () => void;
  onStepChange: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export function ControlBar({
  currentPreset,
  onSelectPreset,
  currentLens,
  onSelectLens,
  isPaused,
  onTogglePause,
  onInjectDisturbance,
  onStepChange,
  simSpeed,
  onChangeSpeed,
}: ControlBarProps) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl backdrop-blur flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
      {/* 1. Preset Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Industrial System:</span>
        </span>
        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => onSelectPreset('gravity_tank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentPreset === 'gravity_tank'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>1. Gravity Surge Tank</span>
          </button>

          <button
            onClick={() => onSelectPreset('pumped_tank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentPreset === 'pumped_tank'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>2. Pumped Tank (Integrating)</span>
          </button>

          <button
            onClick={() => onSelectPreset('heated_vessel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentPreset === 'heated_vessel'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>3. Heated Mixing Vessel (Delay)</span>
          </button>
        </div>
      </div>

      {/* 2. The 3-Lens Mode Switcher (Prominent Segmented Toggle) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Lens:</span>
        </span>
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner w-full sm:w-auto">
          <button
            onClick={() => onSelectLens('plant')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentLens === 'plant'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>1. Technician / Plant View</span>
          </button>

          <button
            onClick={() => onSelectLens('math_decoder')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentLens === 'math_decoder'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 ring-1 ring-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>2. Math Decoder View</span>
          </button>

          <button
            onClick={() => onSelectLens('simulink')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentLens === 'simulink'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. Simulink Block View</span>
          </button>
        </div>
      </div>

      {/* 3. Simulation Controls: Play/Pause, Disturbance, Step Change, Speed */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onTogglePause}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            isPaused
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
          }`}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          onClick={onInjectDisturbance}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Inject +20% sudden load disturbance"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Disturbance</span>
        </button>

        <button
          onClick={onStepChange}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Apply +15% step change"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Step Change</span>
        </button>

        {/* Speed Selector (1x, 5x, 10x) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[1, 5, 10].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                simSpeed === spd
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
