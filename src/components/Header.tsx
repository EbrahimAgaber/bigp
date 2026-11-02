import React from 'react';
import { VisualLens } from '../types/process';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentLens: VisualLens;
  onSelectLens: (lens: VisualLens) => void;
  isMuted: boolean;
  onToggleAudio: () => void;
  onResetSystem: () => void;
  onOpenQuickGuide: () => void;
}

export function Header({
  currentLens,
  onSelectLens,
  isMuted,
  onToggleAudio,
  onResetSystem,
  onOpenQuickGuide,
}: HeaderProps) {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Sliders className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            Process Control Studio
          </span>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => onSelectLens('plant')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentLens === 'plant' ? 'text-emerald-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Physical Plant View
          </button>
          <button
            onClick={() => onSelectLens('math_decoder')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentLens === 'math_decoder' ? 'text-amber-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Visual Math Decoder
          </button>
          <button
            onClick={() => onSelectLens('simulink')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentLens === 'simulink' ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Simulink Block Diagram
          </button>
          <button
            onClick={onOpenQuickGuide}
            className="transition-colors whitespace-nowrap shrink-0 text-slate-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Symbol Dictionary</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg border transition text-xs flex items-center gap-1.5 ${
              !isMuted
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            aria-label={isMuted ? 'Unmute audio effects' : 'Mute audio effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onResetSystem}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg hover:text-white transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Reset simulation parameters to nominal steady state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset System</span>
          </button>
        </div>
      </div>
    </header>
  );
}
