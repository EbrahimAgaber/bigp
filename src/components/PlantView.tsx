import React from 'react';
import { ProcessParams } from '../types/process';
import {
  Droplet,
  Flame,
  ArrowRightLeft,
  Gauge,
  RotateCw,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface PlantViewProps {
  params: ProcessParams;
  h: number;
  dhdt: number;
  outflow: number;
  onValveChange: (val: number) => void;
  isPaused: boolean;
}

export function PlantView({
  params,
  h,
  dhdt,
  outflow,
  onValveChange,
  isPaused,
}: PlantViewProps) {
  const isHeated = params.preset === 'heated_vessel';
  const isPumped = params.preset === 'pumped_tank';

  // Level scaling: 0m to 8m (or 20°C to 80°C)
  const maxPV = isHeated ? 80.0 : 8.0;
  const minPV = isHeated ? 20.0 : 0.0;
  const clampedPV = Math.max(minPV, Math.min(maxPV, h));
  const fillPercent = ((clampedPV - minPV) / (maxPV - minPV)) * 100;

  // Rate of change in cm/min or °C/min
  const rateDisplay = isHeated
    ? `${dhdt >= 0 ? '+' : ''}${dhdt.toFixed(2)} °C/min`
    : `${dhdt >= 0 ? '+' : ''}${(dhdt * 100).toFixed(1)} cm/min`;

  // Speedometer needle angle (-60 deg to +60 deg around 0)
  const maxRate = isHeated ? 4.0 : 0.8;
  const normalizedRate = Math.max(-1, Math.min(1, dhdt / maxRate));
  const needleAngle = normalizedRate * 55; // degrees

  const isBalanced = Math.abs(dhdt) < 0.02;
  const isOverflowing = !isHeated && h >= 7.8;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl backdrop-blur relative overflow-hidden flex flex-col">
      {/* Top Banner: Equipment Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {isHeated ? (
              <Flame className="w-4 h-4 text-rose-400" />
            ) : isPumped ? (
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            ) : (
              <Droplet className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>
                {isHeated
                  ? 'Steam-Heated Mixing Vessel (With Transport Lag)'
                  : isPumped
                  ? 'Pumped Liquid Vessel (Constant Outflow Rate)'
                  : 'Gravity Liquid Surge Tank (Self-Regulating)'}
              </span>
              <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Technician HMI / P&ID
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isHeated
                ? 'Thermal blending unit with live steam coil and pipe delay'
                : isPumped
                ? 'Integrating process: constant pump speed means unmetered inflow will cause overflow!'
                : 'Self-regulating Torricelli drain: higher liquid pushes water out faster by hydrostatic head'}
            </p>
          </div>
        </div>

        {/* Operating Status */}
        <div className="flex items-center gap-2">
          {isOverflowing && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              OVERFLOW HAZARD!
            </span>
          )}

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 ${
              isBalanced
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : dhdt > 0
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBalanced ? 'bg-emerald-400' : dhdt > 0 ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />
            {isBalanced
              ? 'Balanced / Steady State (Zero Speed)'
              : dhdt > 0
              ? isHeated
                ? 'Heating Up'
                : 'Level Rising (Accumulating)'
              : isHeated
              ? 'Cooling Down'
              : 'Level Draining (Deficit)'}
          </span>
        </div>
      </div>

      {/* Main Interactive Equipment P&ID Graphic */}
      <div className="relative w-full h-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px] opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 580 300"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tankFluid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isHeated ? '#f97316' : '#38bdf8'} stopOpacity="0.85" />
              <stop offset="50%" stopColor={isHeated ? '#ea580c' : '#0284c7'} stopOpacity="0.9" />
              <stop offset="100%" stopColor={isHeated ? '#c2410c' : '#0369a1'} stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isHeated ? '#fb923c' : '#7dd3fc'} />
              <stop offset="100%" stopColor={isHeated ? '#ea580c' : '#0284c7'} />
            </linearGradient>

            <clipPath id="vesselInterior">
              <rect x="180" y="45" width="220" height="210" rx="8" />
            </clipPath>
          </defs>

          {/* Top Inflow Pipe */}
          <path
            d="M 270,10 L 270,45 L 310,45 L 310,10"
            fill="none"
            stroke="#475569"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Valve Body & Stem */}
          <polygon points="255,18 325,18 290,32" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <polygon points="255,44 325,44 290,32" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <circle cx="290" cy="32" r="3.5" fill="#38bdf8" />
          <line
            x1="290"
            y1="32"
            x2="290"
            y2={32 - (params.valveOpening / 100) * 12}
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={282}
            y1={32 - (params.valveOpening / 100) * 12}
            x2={298}
            y2={32 - (params.valveOpening / 100) * 12}
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Inflow Liquid Stream */}
          {params.valveOpening > 2 && !isPaused && (
            <rect
              x={282 - (params.valveOpening / 100) * 3}
              y="45"
              width={16 + (params.valveOpening / 100) * 6}
              height={Math.max(10, 255 - (fillPercent / 100) * 210 - 45)}
              fill="url(#streamGrad)"
              opacity="0.85"
            />
          )}

          {/* Vessel Outer Wall */}
          <rect
            x="174"
            y="42"
            width="232"
            height="216"
            rx="10"
            fill="none"
            stroke="#334155"
            strokeWidth="4"
          />

          {/* Vessel Glass Backing */}
          <rect
            x="180"
            y="45"
            width="220"
            height="210"
            fill="#0f172a"
            fillOpacity="0.75"
            rx="8"
          />

          {/* Liquid Body */}
          <g clipPath="url(#vesselInterior)">
            <rect
              x="180"
              y={255 - (fillPercent / 100) * 210}
              width="220"
              height={(fillPercent / 100) * 210}
              fill="url(#tankFluid)"
              className="transition-[y,height] duration-150 ease-out"
            />

            {/* Surface Meniscus */}
            {fillPercent > 1 && (
              <ellipse
                cx="290"
                cy={255 - (fillPercent / 100) * 210}
                rx="110"
                ry="5"
                fill={isHeated ? '#ffedd5' : '#7dd3fc'}
                fillOpacity="0.7"
              />
            )}

            {/* Heating coils for heated vessel */}
            {isHeated && (
              <g stroke="#f97316" strokeWidth="2.5" fill="none" opacity="0.85">
                <path d="M 195,110 C 220,100 240,120 265,110 C 290,100 310,120 335,110 C 360,100 380,120 385,115" />
                <path d="M 195,160 C 220,150 240,170 265,160 C 290,150 310,170 335,160 C 360,150 380,170 385,165" />
                <path d="M 195,210 C 220,200 240,220 265,210 C 290,200 310,220 335,210 C 360,200 380,220 385,215" />
              </g>
            )}

            {/* Agitator for heated vessel */}
            {isHeated && (
              <g transform="translate(290, 55)">
                <rect x="-12" y="-14" width="24" height="14" rx="2" fill="#475569" stroke="#334155" />
                <line x1="0" y1="0" x2="0" y2="165" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="-30" y1="155" x2="30" y2="155" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              </g>
            )}

            {/* Overflow warning */}
            {isOverflowing && (
              <rect x="180" y="45" width="220" height="20" fill="#f43f5e" fillOpacity="0.4" />
            )}
          </g>

          {/* Normal Target Steady Baseline Line */}
          <g transform={`translate(174, ${255 - ((params.hBar - minPV) / (maxPV - minPV)) * 210})`}>
            <line
              x1="0"
              y1="0"
              x2="232"
              y2="0"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeOpacity="0.8"
            />
            <text
              x="-6"
              y="3.5"
              fill="#10b981"
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
              fontFamily="monospace"
            >
              Normal Target ({params.hBar.toFixed(1)}{isHeated ? '°C' : 'm'})
            </text>
          </g>

          {/* Depth Ruler on Left */}
          <g transform="translate(164, 45)">
            <line x1="0" y1="0" x2="0" y2="210" stroke="#475569" strokeWidth="2" />
            {[0, 2, 4, 6, 8].map((val) => {
              const displayVal = isHeated ? 20 + (val / 8) * 60 : val;
              const yPos = 210 - (val / 8) * 210;
              return (
                <g key={val} transform={`translate(0, ${yPos})`}>
                  <line x1="-5" y1="0" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" />
                  <text
                    x="-8"
                    y="3"
                    fill="#94a3b8"
                    fontSize="8"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {displayVal.toFixed(0)}{isHeated ? '°' : 'm'}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Discharge Pipe / Pump */}
          <path d="M 400,240 L 440,240 L 440,258 L 400,258" fill="#334155" stroke="#475569" strokeWidth="2" />

          {/* Centrifugal Pump on Pumped Tank */}
          {isPumped && (
            <g transform="translate(435, 249)">
              <circle cx="12" cy="0" r="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
              <polygon points="10,-8 20,0 10,8" fill="#f59e0b" />
              <text x="12" y="20" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle">
                Pump P-101
              </text>
            </g>
          )}

          {/* Discharge Liquid Jet shooting right */}
          {outflow > 0.1 && (
            <path
              d={`M ${isPumped ? 465 : 440},244 Q ${isPumped ? 520 : 495},246 ${
                isPumped ? 560 : 540
              },258 L ${isPumped ? 465 : 440},254 Z`}
              fill="url(#streamGrad)"
              opacity="0.8"
            />
          )}

          {/* GAUGE 1: Inflow Gauge (Top) */}
          <g transform="translate(330, 16)">
            <rect x="0" y="-10" width="105" height="22" rx="4" fill="#0f172a" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="1" />
            <text x="6" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Flow In: {params.qi.toFixed(1)} {isHeated ? '%' : 'm³/m'}
            </text>
          </g>

          {/* GAUGE 2: Outflow Gauge (Bottom Right) */}
          <g transform="translate(435, 210)">
            <rect x="0" y="-10" width="105" height="22" rx="4" fill="#0f172a" fillOpacity="0.95" stroke="#0ea5e9" strokeWidth="1" />
            <text x="6" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Flow Out: {outflow.toFixed(1)} {isHeated ? 'loss' : 'm³/m'}
            </text>
          </g>

          {/* GAUGE 3: SPEEDOMETER GAUGE */}
          <g transform="translate(68, 120)">
            <circle cx="42" cy="42" r="42" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
            <circle cx="42" cy="42" r="38" fill="#020617" />

            {/* Dials */}
            <path d="M 12,42 A 30 30 0 0 1 42,12" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" />
            <path d="M 42,12 A 30 30 0 0 1 72,42" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 2" />
            <line x1="42" y1="10" x2="42" y2="16" stroke="#10b981" strokeWidth="2" />

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 42, 42)`}>
              <line x1="42" y1="42" x2="42" y2="14" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              <polygon points="42,11 39,16 45,16" fill="#f43f5e" />
            </g>
            <circle cx="42" cy="42" r="3.5" fill="#ffffff" />

            <text x="42" y="30" fill="#94a3b8" fontSize="7" textAnchor="middle" fontWeight="bold">
              0 BALANCED
            </text>
            <rect x="4" y="50" width="76" height="20" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="42" y="63" fill={isBalanced ? '#10b981' : dhdt > 0 ? '#38bdf8' : '#f59e0b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {rateDisplay}
            </text>
            <text x="42" y="85" fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">
              {isHeated ? 'Heating Speed' : 'Level Change Speed'}
            </text>
          </g>

          {/* Current Level readout tag */}
          <g transform={`translate(412, ${255 - (fillPercent / 100) * 210})`}>
            <polygon points="0,0 7,-4 7,4" fill="#38bdf8" />
            <rect x="9" y="-10" width="95" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="14" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Level: {clampedPV.toFixed(2)}{isHeated ? '°C' : 'm'}
            </text>
          </g>
        </svg>
      </div>

      {/* Primary Interactive Valve Slider */}
      <div className="mt-3 bg-slate-950/80 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inflow Control Valve (Manipulated Variable)</span>
          </label>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded border border-emerald-800/50">
            {params.valveOpening.toFixed(1)}% Open
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={params.valveOpening}
          onChange={(e) => onValveChange(parseFloat(e.target.value))}
          className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <span>Quick Valve Positions:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onValveChange(20)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Low (20%)
            </button>
            <button
              onClick={() => onValveChange(50)}
              className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 transition font-semibold cursor-pointer"
            >
              Balanced (50%)
            </button>
            <button
              onClick={() => onValveChange(80)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              High (80%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
