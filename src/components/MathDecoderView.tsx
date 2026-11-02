import React, { useState } from 'react';
import { ProcessParams } from '../types/process';
import { MathView, SymbolTooltip } from './SymbolTooltip';
import {
  Sparkles,
  RotateCw,
  ZoomIn,
  Lightbulb,
  CheckCircle2,
  Scissors,
} from 'lucide-react';
import { audioSynth } from '../lib/audio';

interface MathDecoderViewProps {
  params: ProcessParams;
  h: number;
  dhdt: number;
  outflow: number;
  deviationMode: boolean;
  onToggleDeviationMode: (val: boolean) => void;
  onApplyStepTest: (deltaQi: number) => void;
}

export function MathDecoderView({
  params,
  h,
  dhdt,
  outflow,
  deviationMode,
  onToggleDeviationMode,
  onApplyStepTest,
}: MathDecoderViewProps) {
  // Flashcard flipped states for the 3 balance terms
  const [accumFlipped, setAccumFlipped] = useState(false);
  const [inflowFlipped, setInflowFlipped] = useState(false);
  const [outflowFlipped, setOutflowFlipped] = useState(false);

  // Linearization curve zoom level (1x to 4x)
  const [zoomLevel, setZoomLevel] = useState(1.5);

  const allFlipped = accumFlipped && inflowFlipped && outflowFlipped;

  const handleFlip = (type: 'accum' | 'inflow' | 'outflow') => {
    audioSynth.playClick();
    if (type === 'accum') setAccumFlipped(!accumFlipped);
    if (type === 'inflow') setInflowFlipped(!inflowFlipped);
    if (type === 'outflow') setOutflowFlipped(!outflowFlipped);
  };

  // Numerical values inside boxes
  const areaVal = params.A.toFixed(1);
  const speedVal = dhdt >= 0 ? `+${dhdt.toFixed(2)}` : dhdt.toFixed(2);
  const inVal = params.qi.toFixed(2);
  const outVal = outflow.toFixed(2);

  // SVG mini-curve for Linearization
  const curveW = 380;
  const curveH = 170;
  const cPadding = { top: 20, right: 25, bottom: 30, left: 45 };
  const plotW = curveW - cPadding.left - cPadding.right;
  const plotH = curveH - cPadding.top - cPadding.bottom;

  // Operating point
  const hBar = params.hBar;
  const qiBar = params.qiBar;
  const hMin = Math.max(0, hBar - 3.5 / zoomLevel);
  const hMax = hBar + 4.5 / zoomLevel;
  const qoMin = 0;
  const qoMax = params.Cv * Math.sqrt(Math.max(1, hMax)) + 1;

  const scaleH = (v: number) => cPadding.left + ((v - hMin) / (hMax - hMin)) * plotW;
  const scaleQo = (v: number) => cPadding.top + plotH - ((v - qoMin) / (qoMax - qoMin)) * plotH;

  // True Torricelli sqrt curve
  const curvePts: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const curH = hMin + (i / 30) * (hMax - hMin);
    const curQo = params.Cv * Math.sqrt(Math.max(0, curH));
    curvePts.push(`${i === 0 ? 'M' : 'L'} ${scaleH(curH).toFixed(1)},${scaleQo(curQo).toFixed(1)}`);
  }
  const curvePath = curvePts.join(' ');

  // Straight tangent line at steady state
  const slope = params.preset === 'gravity_tank'
    ? params.Cv / (2 * Math.sqrt(Math.max(0.1, hBar)))
    : 1 / Math.max(0.1, params.K);
  const tanH1 = hMin;
  const tanQo1 = qiBar + slope * (tanH1 - hBar);
  const tanH2 = hMax;
  const tanQo2 = qiBar + slope * (tanH2 - hBar);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Visual Math Decoder: Word-to-Symbol Bridge</span>
              <span className="text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Flashcard Translator
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any plain-English box below to flip it like a flashcard into its engineering symbol!
            </p>
          </div>
        </div>

        {allFlipped && (
          <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Full Differential Equation Assembled
          </span>
        )}
      </div>

      {/* STEP A: The Plain-English Conservation Balance Card */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-3">
          <span>Physical Conservation Law: Volume Accumulation = Inflow - Outflow</span>
          <span className="text-cyan-400 font-mono">Live Operating Point</span>
        </div>

        {/* 3 Click-to-Flip Flashcard Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-3 py-2">
          {/* Tile 1: Accumulation Rate */}
          <button
            onClick={() => handleFlip('accum')}
            className={`group px-4 py-3.5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg cursor-pointer min-w-44 ${
              accumFlipped
                ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-white hover:border-cyan-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {accumFlipped ? 'Differential Symbol' : 'Click to Decode'}
              </span>
              <RotateCw className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
            </div>

            {accumFlipped ? (
              <div className="text-base font-mono font-bold flex items-center gap-1.5">
                <SymbolTooltip symbolKey="A">
                  <MathView math="A" />
                </SymbolTooltip>
                <SymbolTooltip symbolKey="dhdt">
                  <MathView math="\frac{dh}{dt}" />
                </SymbolTooltip>
                <span className="text-xs font-normal text-cyan-400 ml-1">
                  ({(params.A * dhdt).toFixed(2)} m³/m)
                </span>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-100">[ Tank Width × Rising Speed ]</div>
                <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  {areaVal} m² × ({speedVal} m/m)
                </div>
              </div>
            )}
          </button>

          <span className="text-2xl font-bold text-slate-500">=</span>

          {/* Tile 2: Inflow */}
          <button
            onClick={() => handleFlip('inflow')}
            className={`group px-4 py-3.5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg cursor-pointer min-w-36 ${
              inflowFlipped
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-white hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {inflowFlipped ? 'Manipulated Input' : 'Click to Decode'}
              </span>
              <RotateCw className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            </div>

            {inflowFlipped ? (
              <div className="text-base font-mono font-bold">
                <SymbolTooltip symbolKey="qi">
                  <MathView math="q_i(t)" />
                </SymbolTooltip>
                <span className="text-xs font-normal text-emerald-400 ml-1.5">
                  ({inVal} m³/m)
                </span>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-100">[ Flow In ]</div>
                <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  {inVal} m³/min
                </div>
              </div>
            )}
          </button>

          <span className="text-2xl font-bold text-slate-500">-</span>

          {/* Tile 3: Outflow */}
          <button
            onClick={() => handleFlip('outflow')}
            className={`group px-4 py-3.5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg cursor-pointer min-w-44 ${
              outflowFlipped
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-white hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {outflowFlipped ? 'Torricelli Hydraulic' : 'Click to Decode'}
              </span>
              <RotateCw className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
            </div>

            {outflowFlipped ? (
              <div className="text-base font-mono font-bold flex items-center gap-1.5">
                <SymbolTooltip symbolKey="Cv">
                  <MathView math="C_v" />
                </SymbolTooltip>
                <SymbolTooltip symbolKey="h">
                  <MathView math="\sqrt{h(t)}" />
                </SymbolTooltip>
                <span className="text-xs font-normal text-amber-400 ml-1">
                  ({outVal} m³/m)
                </span>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-100">[ Flow Out ]</div>
                <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                  {outVal} m³/min
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Pronunciation & Reading Guide */}
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 text-left">
            {!allFlipped
              ? '💡 Click all 3 flashcards above to see how physical intuition translates directly into differential calculus.'
              : '✨ Complete Physical Model Assembled:'}
          </span>
          {allFlipped && (
            <div className="font-mono text-xs sm:text-sm font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800/60">
              <MathView math="A \frac{dh}{dt} = q_i(t) - C_v \sqrt{h(t)}" />
            </div>
          )}
        </div>
      </div>

      {/* STEP B: Detailed Symbol Breakdown & Linearization Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: "How to Read The Speedometer dh/dt" */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">
              How to Read: <MathView math="\frac{dh}{dt}" /> (The Speedometer)
            </h4>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs text-cyan-300 font-mono font-semibold">
              Say it out loud: <span className="text-white">"d-h over d-t"</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>• <strong className="text-cyan-400 font-mono">d</strong> = "a tiny change in..."</div>
              <div>• <strong className="text-cyan-400 font-mono">h</strong> = "Height of liquid"</div>
              <div>• <strong className="text-cyan-400 font-mono">t</strong> = "Time (minutes)"</div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
              Put together, <MathView math="\frac{dh}{dt}" /> is literally just the needle on the speedometer attached to the tank wall. When level is steady, change is zero, so <MathView math="\frac{dh}{dt} = 0" />!
            </p>
          </div>

          {/* Zero-Baseline Trick Button (Deviation Variables) */}
          <div className="pt-2">
            <button
              onClick={() => onToggleDeviationMode(!deviationMode)}
              className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                deviationMode
                  ? 'bg-purple-950/70 border-purple-500/60 text-purple-200'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-purple-400 shrink-0 mt-1" />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Zero-Baseline Trick (Deviation Variables)</span>
                  <span className="text-[10px] font-mono text-purple-400">h'(t) = h(t) - h̄</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Click to shift the DCS chart baseline so normal operating height ({params.hBar.toFixed(1)}m) reads <strong className="text-white">0.0</strong>. Engineers write a prime mark (<MathView math="h'" />) to mean: <em>"How far above or below normal are we right now?"</em>
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Card: Linearization Zoom Explorer */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Scissors className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">
                Linearization: Why replace curves with straight lines?
              </h4>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-16 accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono text-amber-400 font-bold">{zoomLevel}x</span>
            </div>
          </div>

          {/* Mini Interactive Plot */}
          <div className="relative w-full h-36 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <svg
              viewBox={`0 0 ${curveW} ${curveH}`}
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Tangent line (Dashed Amber) */}
              <line
                x1={scaleH(tanH1)}
                y1={scaleQo(tanQo1)}
                x2={scaleH(tanH2)}
                y2={scaleQo(tanQo2)}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* Nonlinear sqrt curve (Solid Cyan) */}
              <path d={curvePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Steady State Operating Point */}
              <circle
                cx={scaleH(hBar)}
                cy={scaleQo(qiBar)}
                r="4.5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Axis Labels */}
              <text x={curveW / 2} y={curveH - 4} fill="#64748b" fontSize="8" textAnchor="middle">
                Liquid Level h (meters)
              </text>
              <text x={-curveH / 2} y="12" transform="rotate(-90)" fill="#64748b" fontSize="8" textAnchor="middle">
                Outflow Rate
              </text>
            </svg>

            {zoomLevel >= 2.5 && (
              <div className="absolute top-2 right-2 bg-amber-950/90 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-medium animate-in fade-in">
                ✨ High Zoom: Curve looks completely straight!
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Torricelli outflow curves downwards (<MathView math="\sqrt{h}" />). But just like Earth feels flat in your living room, <em>any curve looks like a straight line when zoomed in around normal steady state</em>!
          </p>
        </div>
      </div>
    </div>
  );
}
