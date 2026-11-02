import React, { useState } from 'react';
import { SimulationPoint, ProcessParams } from '../types/process';
import { TrendingUp, Crosshair } from 'lucide-react';

interface StripChartProps {
  history: SimulationPoint[];
  params: ProcessParams;
  deviationMode: boolean;
  onToggleDeviationMode: (val: boolean) => void;
  showLinearComparison?: boolean;
}

export function StripChart({
  history,
  params,
  deviationMode,
  onToggleDeviationMode,
  showLinearComparison = false,
}: StripChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showValvePen, setShowValvePen] = useState(true);
  const [showInflowPen, setShowInflowPen] = useState(true);
  const [showOutflowPen, setShowOutflowPen] = useState(true);
  const [showPVPen, setShowPVPen] = useState(true);

  // SVG dimensions
  const width = 760;
  const height = 180;
  const padding = { top: 18, right: 30, bottom: 26, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const latestT = history.length > 0 ? history[history.length - 1].t : 10;
  const timeSpan = 25; // minutes window
  const minT = Math.max(0, latestT - timeSpan);
  const maxT = Math.max(minT + timeSpan, latestT);

  // Y-range
  const isHeated = params.preset === 'heated_vessel';
  const yMin = deviationMode ? -15.0 : isHeated ? 10.0 : 0.0;
  const yMax = deviationMode ? 25.0 : isHeated ? 90.0 : 9.0;

  const scaleX = (t: number) => padding.left + ((t - minT) / Math.max(0.01, maxT - minT)) * plotW;
  const scaleY = (val: number) => padding.top + plotH - ((val - yMin) / Math.max(0.01, yMax - yMin)) * plotH;

  // Process Variable (Level or Temp) path
  const pvPath = React.useMemo(() => {
    if (history.length < 2) return '';
    return history
      .map((pt, idx) => {
        const val = deviationMode ? pt.hPrime : pt.h;
        const x = scaleX(pt.t);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, deviationMode, minT, maxT, yMin, yMax]);

  // Linear estimate path
  const linearPath = React.useMemo(() => {
    if (!showLinearComparison || history.length < 2) return '';
    return history
      .map((pt, idx) => {
        const val = deviationMode ? pt.hLinPrime : pt.hLin;
        const x = scaleX(pt.t);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, showLinearComparison, deviationMode, minT, maxT, yMin, yMax]);

  // Valve % path (scaled to y-range for visual trend)
  const valvePath = React.useMemo(() => {
    if (history.length < 2) return '';
    return history
      .map((pt, idx) => {
        const val = yMin + (pt.valve / 100) * (yMax - yMin);
        const x = scaleX(pt.t);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, minT, maxT, yMin, yMax]);

  // Inflow path
  const inflowPath = React.useMemo(() => {
    if (history.length < 2) return '';
    return history
      .map((pt, idx) => {
        const norm = pt.qi;
        const x = scaleX(pt.t);
        const y = scaleY(norm);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, minT, maxT, yMin, yMax]);

  // Outflow path
  const outflowPath = React.useMemo(() => {
    if (history.length < 2) return '';
    return history
      .map((pt, idx) => {
        const val = pt.qo;
        const x = scaleX(pt.t);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, minT, maxT, yMin, yMax]);

  const baselineVal = deviationMode ? 0.0 : params.hBar;
  const baselineY = scaleY(baselineVal);

  const hoveredPt = hoverIdx !== null && history[hoverIdx] ? history[hoverIdx] : (history[history.length - 1] || null);

  // Y Ticks
  const yTicks = React.useMemo(() => {
    const ticks: number[] = [];
    const step = (yMax - yMin) / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(yMin + i * step);
    }
    return ticks;
  }, [yMin, yMax]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl backdrop-blur">
      {/* Top Header & Pen Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>DCS Strip Chart & Trend Recorder</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800/40">
                Live Trend
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              {deviationMode ? "Deviation Baseline (0.0 normal subtracted)" : "Physical Units Engineering Trend"}
            </p>
          </div>
        </div>

        {/* Pen Toggles & Deviation Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          {/* Pens */}
          <label className="flex items-center gap-1 cursor-pointer text-cyan-300">
            <input
              type="checkbox"
              checked={showPVPen}
              onChange={(e) => setShowPVPen(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span className="w-2 h-0.5 bg-cyan-400" />
            <span>PV: {isHeated ? 'Temp' : 'Level'}</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-emerald-300">
            <input
              type="checkbox"
              checked={showValvePen}
              onChange={(e) => setShowValvePen(e.target.checked)}
              className="accent-emerald-400 rounded"
            />
            <span className="w-2 h-0.5 bg-emerald-400" />
            <span>Valve %</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-indigo-300">
            <input
              type="checkbox"
              checked={showInflowPen}
              onChange={(e) => setShowInflowPen(e.target.checked)}
              className="accent-indigo-400 rounded"
            />
            <span className="w-2 h-0.5 bg-indigo-400" />
            <span>Inflow</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-amber-300">
            <input
              type="checkbox"
              checked={showOutflowPen}
              onChange={(e) => setShowOutflowPen(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span className="w-2 h-0.5 bg-amber-400" />
            <span>Outflow</span>
          </label>

          {/* Deviation toggle */}
          <button
            onClick={() => onToggleDeviationMode(!deviationMode)}
            className={`px-2 py-0.5 rounded border font-mono text-[10px] transition cursor-pointer ${
              deviationMode
                ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {deviationMode ? "Deviation (h')" : 'Shift Baseline to 0.0'}
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 p-1.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const tMouse = minT + ((relX - padding.left) / plotW) * (maxT - minT);
            let closest = 0;
            let minDiff = 9999;
            history.forEach((pt, idx) => {
              const diff = Math.abs(pt.t - tMouse);
              if (diff < minDiff) {
                minDiff = diff;
                closest = idx;
              }
            });
            setHoverIdx(closest);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Background Grid */}
          {yTicks.map((val) => {
            const y = scaleY(val);
            return (
              <g key={val}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Time ticks */}
          {[0, 5, 10, 15, 20, 25].map((off) => {
            const t = minT + off;
            if (t > maxT) return null;
            const x = scaleX(t);
            return (
              <g key={off}>
                <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 4} stroke="#475569" strokeWidth="1" />
                <text x={x} y={height - padding.bottom + 12} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  {t.toFixed(0)}m
                </text>
              </g>
            );
          })}

          {/* Baseline line */}
          <line
            x1={padding.left}
            y1={baselineY}
            x2={width - padding.right}
            y2={baselineY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeOpacity="0.7"
          />

          {/* Valve Pen */}
          {showValvePen && valvePath && (
            <path d={valvePath} fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.8" />
          )}

          {/* Outflow Pen */}
          {showOutflowPen && outflowPath && (
            <path d={outflowPath} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.85" />
          )}

          {/* Inflow Pen */}
          {showInflowPen && inflowPath && (
            <path d={inflowPath} fill="none" stroke="#6366f1" strokeWidth="1.2" strokeOpacity="0.85" />
          )}

          {/* Linear Model Comparison */}
          {showLinearComparison && linearPath && (
            <path d={linearPath} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.9" />
          )}

          {/* Primary Process Variable Pen */}
          {showPVPen && pvPath && (
            <path d={pvPath} fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {/* Hover Crosshair */}
          {hoveredPt && (
            <g>
              <line
                x1={scaleX(hoveredPt.t)}
                y1={padding.top}
                x2={scaleX(hoveredPt.t)}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={scaleX(hoveredPt.t)}
                cy={scaleY(deviationMode ? hoveredPt.hPrime : hoveredPt.h)}
                r="3.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )}

          <text x={width / 2} y={height - 3} fill="#64748b" fontSize="8" textAnchor="middle">
            Time Elapsed (minutes)
          </text>
          <text x={-height / 2 + 5} y="10" transform="rotate(-90)" fill="#64748b" fontSize="8" textAnchor="middle">
            {deviationMode ? "Deviation h'" : isHeated ? "Temp (°C)" : "Level (m)"}
          </text>
        </svg>

        {/* Live Hover / Current Status Ribbon */}
        {hoveredPt && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 px-2 text-[10px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800">
            <span className="flex items-center gap-1 text-slate-400">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>Time: <strong className="text-white">{hoveredPt.t.toFixed(1)}m</strong></span>
            </span>

            <span>
              PV: <strong className="text-cyan-300">{hoveredPt.h.toFixed(2)} {isHeated ? '°C' : 'm'}</strong>
            </span>

            {deviationMode && (
              <span>
                h': <strong className="text-purple-300">{hoveredPt.hPrime >= 0 ? `+${hoveredPt.hPrime.toFixed(2)}` : hoveredPt.hPrime.toFixed(2)}</strong>
              </span>
            )}

            <span>
              Speed: <strong className={hoveredPt.dhdt >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {hoveredPt.dhdt >= 0 ? `+${hoveredPt.dhdt.toFixed(3)}` : hoveredPt.dhdt.toFixed(3)}
              </strong>
            </span>

            <span>
              Valve: <strong className="text-emerald-400">{hoveredPt.valve.toFixed(1)}%</strong>
            </span>

            <span>
              Inflow: <strong className="text-indigo-300">{hoveredPt.qi.toFixed(2)}</strong>
            </span>

            <span>
              Outflow: <strong className="text-amber-300">{hoveredPt.qo.toFixed(2)}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
