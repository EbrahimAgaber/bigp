import React, { useState } from 'react';
import { ProcessParams, PIDParams } from '../types/process';
import { MathView, SymbolTooltip } from './SymbolTooltip';
import {
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { audioSynth } from '../lib/audio';

interface SimulinkViewProps {
  params: ProcessParams;
  pid: PIDParams;
  onUpdatePID: (pid: PIDParams) => void;
  h: number;
  dhdt: number;
  onGainChange: (newK: number) => void;
  onTauChange: (newTau: number) => void;
  onSetpointChange: (newSP: number) => void;
}

export type BlockId = 'input' | 'sum' | 'pid' | 'process' | 'scope';

export function SimulinkView({
  params,
  pid,
  onUpdatePID,
  h,
  dhdt,
  onGainChange,
  onTauChange,
  onSetpointChange,
}: SimulinkViewProps) {
  const [selectedBlock, setSelectedBlock] = useState<BlockId>('process');

  const error = pid.setpoint - h;
  const isHeated = params.preset === 'heated_vessel';

  // s-Plane dimensions for Process Inspector
  const spW = 380;
  const spH = 150;
  const centerX = spW * 0.75;
  const centerY = spH / 2;
  const scaleUnit = 180; // pixels per unit
  const poleVal = params.pole; // e.g. -0.25
  const poleX = centerX + poleVal * scaleUnit;
  const poleY = centerY;

  const handleSelectBlock = (id: BlockId) => {
    audioSynth.playClick();
    setSelectedBlock(id);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Simulink Block Diagram Canvas</span>
              <span className="text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                Signal Flow Architecture
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive node-based signal network. Click any block to open its Live Inspector!
            </p>
          </div>
        </div>

        {/* Selected Block Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Inspecting:</span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold uppercase tracking-wider">
            {selectedBlock === 'process'
              ? 'Process Transfer Function'
              : selectedBlock === 'pid'
              ? 'PID Feedback Controller'
              : selectedBlock === 'sum'
              ? 'Summing Junction (+ / -)'
              : selectedBlock === 'input'
              ? 'Setpoint Reference Block'
              : 'Live DCS Scope Block'}
          </span>
        </div>
      </div>

      {/* Interactive Simulink Node-Based Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 p-4 min-h-56 flex flex-col justify-center">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Node Blocks Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 py-4 px-2">
          {/* 1. Step Input / Setpoint Block */}
          <button
            onClick={() => handleSelectBlock('input')}
            className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-w-28 shadow-lg cursor-pointer ${
              selectedBlock === 'input'
                ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-0.5">
              Step Input r(t)
            </span>
            <div className="text-xs font-bold text-white">Setpoint</div>
            <div className="text-xs font-mono text-emerald-400 mt-0.5">
              {pid.setpoint.toFixed(1)} {isHeated ? '°C' : 'm'}
            </div>
          </button>

          {/* Wire 1: Input to Sum */}
          <div className="hidden sm:flex flex-1 items-center justify-center relative min-w-8">
            <div className="w-full h-0.5 bg-cyan-500/40 relative">
              <span className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <span className="absolute -top-4 text-[9px] font-mono text-cyan-300 bg-slate-900 px-1 rounded border border-slate-800">
              {pid.setpoint.toFixed(1)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 -ml-1" />
          </div>

          {/* 2. Sum Junction (+ / -) */}
          <button
            onClick={() => handleSelectBlock('sum')}
            className={`w-11 h-11 rounded-full border transition-all flex flex-col items-center justify-center shadow-lg cursor-pointer shrink-0 ${
              selectedBlock === 'sum'
                ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 text-cyan-300'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
            }`}
            title="Summing Junction: Error = Setpoint - Process Variable"
          >
            <span className="text-xs font-bold leading-none">+</span>
            <span className="text-xs font-bold leading-none">-</span>
          </button>

          {/* Wire 2: Sum to PID */}
          <div className="hidden sm:flex flex-1 items-center justify-center relative min-w-8">
            <div className="w-full h-0.5 bg-amber-500/40 relative">
              <span className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>
            <span className="absolute -top-4 text-[9px] font-mono text-amber-300 bg-slate-900 px-1 rounded border border-slate-800">
              e: {error >= 0 ? `+${error.toFixed(2)}` : error.toFixed(2)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 -ml-1" />
          </div>

          {/* 3. PID Controller Block */}
          <button
            onClick={() => handleSelectBlock('pid')}
            className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-w-32 shadow-lg cursor-pointer ${
              selectedBlock === 'pid'
                ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                Controller G_c(s)
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pid.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="text-xs font-bold text-white">
              PID Controller
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              {pid.enabled ? 'AUTO FEEDBACK' : 'MANUAL'}
            </div>
          </button>

          {/* Wire 3: PID to Process */}
          <div className="hidden sm:flex flex-1 items-center justify-center relative min-w-8">
            <div className="w-full h-0.5 bg-emerald-500/40 relative">
              <span className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="absolute -top-4 text-[9px] font-mono text-emerald-300 bg-slate-900 px-1 rounded border border-slate-800">
              u: {params.valveOpening.toFixed(0)}%
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 -ml-1" />
          </div>

          {/* 4. Process Transfer Function Block K / (tau*s + 1) */}
          <button
            onClick={() => handleSelectBlock('process')}
            className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-w-36 shadow-lg cursor-pointer ${
              selectedBlock === 'process'
                ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-0.5">
              Plant G_p(s)
            </span>
            <div className="text-sm font-bold text-cyan-300 font-mono">
              <MathView math="\frac{K}{\tau s + 1}" />
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              K={params.K.toFixed(2)}, τ={params.tau.toFixed(1)}m
            </div>
          </button>

          {/* Wire 4: Process to Scope */}
          <div className="hidden sm:flex flex-1 items-center justify-center relative min-w-8">
            <div className="w-full h-0.5 bg-cyan-500/40 relative">
              <span className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <span className="absolute -top-4 text-[9px] font-mono text-cyan-300 bg-slate-900 px-1 rounded border border-slate-800">
              y: {h.toFixed(2)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 -ml-1" />
          </div>

          {/* 5. Live Scope Block */}
          <button
            onClick={() => handleSelectBlock('scope')}
            className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-w-28 shadow-lg cursor-pointer ${
              selectedBlock === 'scope'
                ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider mb-0.5">
              Live Output
            </span>
            <div className="text-xs font-bold text-white">DCS Scope</div>
            <div className="text-xs font-mono text-cyan-400 mt-0.5">
              {h.toFixed(2)} {isHeated ? '°C' : 'm'}
            </div>
          </button>
        </div>

        {/* Feedback Loop Wire (Bottom return loop to Sum Junction) */}
        <div className="hidden sm:block relative mt-2 pt-2 border-t border-dashed border-slate-800 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <span>⮑ Negative Feedback Loop: Sensor Measurement fed back into Sum Junction (-) terminal</span>
          </div>
        </div>
      </div>

      {/* LIVE INSPECTOR DRAWER (Changes dynamically based on selectedBlock) */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 animate-in fade-in duration-200">
        {/* INSPECTOR 1: Process Block K / (tau*s + 1) */}
        {selectedBlock === 'process' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400 font-mono text-sm">
                    <MathView math="G(s) = \frac{K}{\tau s + 1}" />
                  </span>
                  <span>First-Order Dynamic Lag Block</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Translates input signal changes into smooth exponential output responses.
                </p>
              </div>

              <div className="text-xs font-mono text-purple-300 bg-purple-950/70 border border-purple-800/50 px-2.5 py-1 rounded-lg">
                Pole: <MathView math={`s = -\\frac{1}{\\tau} = ${params.pole.toFixed(3)}`} />
              </div>
            </div>

            {/* WHAT IS "s"? (The Laplace Translator) */}
            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>What is "s"? (The Laplace Translator for Technicians)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Solving physical rate equations in time requires calculus derivatives (<MathView math="\frac{dh}{dt}" />). Pierre-Simon Laplace invented a mathematical translator: turning time derivatives into <strong>simple multiplication by <MathView math="s" /></strong>! Because <MathView math="\frac{d}{dt} \to s" />, engineers can multiply transfer function blocks together just like Lego bricks.
              </p>
            </div>

            {/* Sliders for Gain K and Time Constant Tau + Complex s-Plane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Sliders */}
              <div className="space-y-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">
                      Process Gain (K) = "How much level moves per 1% valve"
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">K = {params.K.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.2"
                    value={params.K}
                    onChange={(e) => onGainChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">
                      Time Constant (τ) = "Sluggishness (Time to reach 63.2%)"
                    </span>
                    <span className="font-mono text-purple-400 font-bold">τ = {params.tau.toFixed(1)} min</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={params.tau}
                    onChange={(e) => onTauChange(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>⚡ Fast Tank (τ small)</span>
                    <span>🐢 Sluggish Tank (τ large)</span>
                  </div>
                </div>
              </div>

              {/* Complex s-Plane Pole Map */}
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 relative">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Complex s-Plane Pole Location</span>
                  <span className="text-emerald-400">Stable Left Half-Plane</span>
                </div>

                <svg viewBox={`0 0 ${spW} ${spH}`} className="w-full h-auto select-none">
                  {/* Stable LHP shading */}
                  <rect x="5" y="5" width={centerX - 5} height={spH - 10} fill="#10b981" fillOpacity="0.05" />

                  {/* Real Axis */}
                  <line x1="5" y1={centerY} x2={spW - 10} y2={centerY} stroke="#475569" strokeWidth="1.5" />
                  <text x={spW - 18} y={centerY + 14} fill="#94a3b8" fontSize="9">Re (σ)</text>

                  {/* Imaginary Axis */}
                  <line x1={centerX} y1="5" x2={centerX} y2={spH - 5} stroke="#475569" strokeWidth="1.5" />
                  <text x={centerX + 4} y="14" fill="#94a3b8" fontSize="9">Im (jω)</text>

                  {/* Pole 'X' Marker */}
                  <g transform={`translate(${poleX}, ${poleY})`}>
                    <line x1="-5" y1="-5" x2="5" y2="5" stroke="#f43f5e" strokeWidth="2.5" />
                    <line x1="5" y1="-5" x2="-5" y2="5" stroke="#f43f5e" strokeWidth="2.5" />
                    <text x="0" y="-10" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      s = {poleVal.toFixed(3)}
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* INSPECTOR 2: PID Controller Block */}
        {selectedBlock === 'pid' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Industrial PID Feedback Controller</span>
                  <button
                    onClick={() => onUpdatePID({ ...pid, enabled: !pid.enabled })}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                      pid.enabled
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pid.enabled ? 'AUTOMATIC (ON)' : 'MANUAL (OFF)'}
                  </button>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Calculates corrective valve action based on Error = Setpoint - Process Variable.
                </p>
              </div>

              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                Valve Output: {pid.output.toFixed(1)}%
              </div>
            </div>

            {/* P, I, D Live Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* P: Present Error */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-300">P (Present Error)</span>
                  <span className="font-mono text-xs text-cyan-400">{pid.pTerm >= 0 ? `+${pid.pTerm.toFixed(1)}%` : `${pid.pTerm.toFixed(1)}%`}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-cyan-400 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.abs(pid.pTerm) * 2)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Responds to <em>where the level is right now</em>: Kc × error.
                </p>
              </div>

              {/* I: Past Memory */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-300">I (Past Memory)</span>
                  <span className="font-mono text-xs text-amber-400">{pid.iTerm >= 0 ? `+${pid.iTerm.toFixed(1)}%` : `${pid.iTerm.toFixed(1)}%`}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-amber-400 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.abs(pid.iTerm) * 2)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Remembers accumulated offset to completely eliminate steady-state error.
                </p>
              </div>

              {/* D: Future Rate Braking */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-rose-300">D (Future Braking)</span>
                  <span className="font-mono text-xs text-rose-400">{pid.dTerm >= 0 ? `+${pid.dTerm.toFixed(1)}%` : `${pid.dTerm.toFixed(1)}%`}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-rose-400 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.abs(pid.dTerm) * 2)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Predicts future overshoot and applies gentle brakes on rapid speed changes.
                </p>
              </div>
            </div>

            {/* Tuning Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Gain (Kc): {pid.Kc}</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={pid.Kc}
                  onChange={(e) => onUpdatePID({ ...pid, Kc: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Integral Time (τI): {pid.tauI}m</label>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={pid.tauI}
                  onChange={(e) => onUpdatePID({ ...pid, tauI: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Derivative Time (τD): {pid.tauD}m</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pid.tauD}
                  onChange={(e) => onUpdatePID({ ...pid, tauD: parseFloat(e.target.value) })}
                  className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* INSPECTOR 3: Step Input / Setpoint Block */}
        {selectedBlock === 'input' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Target Reference Setpoint r(t)</h4>
            <p className="text-[11px] text-slate-400">
              The desired operating point that the plant operator instructs the automatic system to maintain.
            </p>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">Adjust Target Setpoint:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {pid.setpoint.toFixed(1)} {isHeated ? '°C' : 'm'}
                </span>
              </div>
              <input
                type="range"
                min={isHeated ? 25 : 1}
                max={isHeated ? 75 : 7}
                step={0.5}
                value={pid.setpoint}
                onChange={(e) => onSetpointChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* INSPECTOR 4: Sum Junction */}
        {selectedBlock === 'sum' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Summing Junction (+ / -)</h4>
            <p className="text-[11px] text-slate-400">
              Subtracts measured liquid height from target setpoint to compute the control error:
            </p>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between">
              <span>Error e(t) = Setpoint ({pid.setpoint.toFixed(1)}) - Level ({h.toFixed(2)})</span>
              <span className={`font-bold ${error >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                = {error >= 0 ? `+${error.toFixed(2)}` : error.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* INSPECTOR 5: DCS Scope */}
        {selectedBlock === 'scope' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Live DCS Scope (Output Sensor)</h4>
            <p className="text-[11px] text-slate-400">
              High-frequency telemetry sensor measuring the true liquid state and sending real-time feedback downstream.
            </p>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between">
              <span>Current Process Variable (PV):</span>
              <span className="font-bold text-cyan-300">
                {h.toFixed(2)} {isHeated ? '°C' : 'm'} ({dhdt >= 0 ? `+${dhdt.toFixed(3)}` : dhdt.toFixed(3)} rate)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
