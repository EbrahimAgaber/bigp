import React, { useState } from 'react';
import katex from 'katex';

export interface SymbolDefinition {
  symbol: string;
  latex: string;
  name: string;
  pronunciation: string;
  plainEnglish: string;
  units?: string;
  engineeringRole: string;
}

export const SYMBOL_GLOSSARY: Record<string, SymbolDefinition> = {
  h: {
    symbol: 'h(t)',
    latex: 'h(t)',
    name: 'Liquid Level / Height',
    pronunciation: '"h of t"',
    plainEnglish: 'How deep the liquid is in the vessel right now.',
    units: 'meters (m)',
    engineeringRole: 'The primary Process Variable (PV) being measured and controlled.'
  },
  hBar: {
    symbol: 'h̄',
    latex: '\\bar{h}',
    name: 'Normal Steady-State Level',
    pronunciation: '"h-bar"',
    plainEnglish: 'The normal, balanced liquid depth when flow in exactly equals flow out.',
    units: 'meters (m)',
    engineeringRole: 'The nominal design baseline where the plant rests when disturbances are zero.'
  },
  hPrime: {
    symbol: "h'(t)",
    latex: "h'(t)",
    name: 'Deviation Variable for Level',
    pronunciation: '"h-prime of t"',
    plainEnglish: 'How far above or below normal the level is right now (h - h̄). Starts at 0.0.',
    units: 'meters (m)',
    engineeringRole: 'Shifts the coordinate baseline to zero so steady constants drop out of the equations.'
  },
  qi: {
    symbol: 'qi(t)',
    latex: 'q_i(t)',
    name: 'Inlet Flow Rate',
    pronunciation: '"q-in of t"',
    plainEnglish: 'How much liquid is entering through the inlet control valve per minute.',
    units: 'm³/min',
    engineeringRole: 'The Manipulated Variable (MV) driven by the valve actuator.'
  },
  qiBar: {
    symbol: 'q̄i',
    latex: '\\bar{q}_i',
    name: 'Steady-State Inflow',
    pronunciation: '"q-in-bar"',
    plainEnglish: 'The baseline inflow needed to keep the vessel balanced at its target level.',
    units: 'm³/min',
    engineeringRole: 'The baseline valve feed setting.'
  },
  qiPrime: {
    symbol: "qi'(t)",
    latex: "q_i'(t)",
    name: 'Inflow Perturbation',
    pronunciation: '"q-in-prime"',
    plainEnglish: 'How much extra (or less) liquid is flowing compared to the normal baseline (qi - q̄i).',
    units: 'm³/min',
    engineeringRole: 'The input signal disturbance or step change.'
  },
  qo: {
    symbol: 'qo(t)',
    latex: 'q_o(t)',
    name: 'Outlet Discharge Flow',
    pronunciation: '"q-out of t"',
    plainEnglish: 'How much liquid is draining through the bottom nozzle or pump each minute.',
    units: 'm³/min',
    engineeringRole: 'Self-regulating gravity drainage or pumped constant outflow.'
  },
  dhdt: {
    symbol: 'dh/dt',
    latex: '\\frac{dh}{dt}',
    name: 'Speedometer: Rate of Change',
    pronunciation: '"d-h over d-t"',
    plainEnglish: 'The physical speedometer on the vessel wall: d means "tiny change in", h is Height, t is Time. Tells you if liquid is rising (+), steady (0), or falling (-).',
    units: 'm/min (or cm/min)',
    engineeringRole: 'Accumulation rate: equals zero when inflow and outflow are balanced.'
  },
  A: {
    symbol: 'A',
    latex: 'A',
    name: 'Vessel Cross-Sectional Area',
    pronunciation: '"Area A"',
    plainEnglish: 'The footprint width of the vessel: wider tanks hold more liquid per vertical centimeter.',
    units: 'm²',
    engineeringRole: 'Process capacity/inertia: larger area means slower, more sluggish level changes.'
  },
  Cv: {
    symbol: 'Cv',
    latex: 'C_v',
    name: 'Valve Discharge Coefficient',
    pronunciation: '"C-sub-v"',
    plainEnglish: 'How freely liquid flows through the restriction or drain pipe.',
    units: 'm^2.5 / min',
    engineeringRole: 'Hydraulic flow conductance: higher Cv drains the tank more easily.'
  },
  R: {
    symbol: 'R',
    latex: 'R',
    name: 'Hydraulic Resistance',
    pronunciation: '"Resistance R"',
    plainEnglish: 'How hard it is for liquid to escape. The reciprocal of the slope of the outflow curve.',
    units: 'min / m²',
    engineeringRole: 'Relates head pressure to outflow rate around the operating point.'
  },
  K: {
    symbol: 'K',
    latex: 'K',
    name: 'Process Gain',
    pronunciation: '"Gain K"',
    plainEnglish: 'How much the final level changes per 1 unit change in valve opening (ΔLevel / ΔValve).',
    units: 'm / (m³/min) or °C / %',
    engineeringRole: 'Determines the final steady-state magnification of any input command.'
  },
  tau: {
    symbol: 'τ',
    latex: '\\tau',
    name: 'Process Time Constant',
    pronunciation: '"Tau"',
    plainEnglish: 'How sluggish the process is: the exact time needed for the system to reach 63.2% of its final change.',
    units: 'minutes',
    engineeringRole: 'Dictates the dynamic response speed. Equal to Area × Resistance (τ = A·R).'
  },
  s: {
    symbol: 's',
    latex: 's',
    name: 'Laplace Operator',
    pronunciation: '"Laplace s"',
    plainEnglish: 'The frequency dial: turns calculus derivatives (d/dt) into simple multiplication by s, allowing process blocks to connect like Lego bricks.',
    units: '1/min (frequency)',
    engineeringRole: 'Converts time-domain differential equations into algebraic signal transfer functions.'
  },
  Gs: {
    symbol: 'G(s)',
    latex: 'G(s)',
    name: 'Transfer Function',
    pronunciation: '"G of s"',
    plainEnglish: 'The input-output multiplier block: Output(s) / Input(s) = K / (τs + 1).',
    units: 'dimensionless / transfer units',
    engineeringRole: 'Defines the dynamic relationship between any input signal and its resulting output.'
  },
  pole: {
    symbol: '-1/τ',
    latex: '-\\frac{1}{\\tau}',
    name: 'System Pole',
    pronunciation: '"Minus 1 over tau"',
    plainEnglish: 'Root of the denominator. The further left into negative numbers it sits on the map, the faster the vessel reacts!',
    units: '1/min',
    engineeringRole: 'Position in the complex s-plane determines system stability and speed.'
  }
};

interface MathViewProps {
  math: string;
  display?: boolean;
  className?: string;
}

export function MathView({ math, display = false, className = '' }: MathViewProps) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, display]);

  return (
    <span
      className={`inline-math select-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface SymbolTooltipProps {
  symbolKey: keyof typeof SYMBOL_GLOSSARY;
  children?: React.ReactNode;
}

export function SymbolTooltip({ symbolKey, children }: SymbolTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const def = SYMBOL_GLOSSARY[symbolKey];

  if (!def) {
    return <>{children}</>;
  }

  return (
    <span
      className="relative inline-block group cursor-help"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="border-b border-dotted border-cyan-400/70 text-cyan-200 px-0.5 rounded hover:bg-cyan-950/60 transition-colors">
        {children || <MathView math={def.latex} />}
      </span>

      {isOpen && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3.5 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md text-left text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/60">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <MathView math={def.latex} />
              <span>{def.name}</span>
            </span>
            {def.units && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {def.units}
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-cyan-400 mb-1">
            Pronounce: <span className="font-semibold text-white">{def.pronunciation}</span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-1.5">
            <span className="text-emerald-400 font-medium">Intuition: </span>
            {def.plainEnglish}
          </p>
          <p className="text-[10px] text-slate-400">
            <span className="text-indigo-300 font-medium">Plant Role: </span>
            {def.engineeringRole}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
