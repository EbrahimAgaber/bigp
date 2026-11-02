import React, { useState, useEffect } from 'react';
import { ProcessParams, PIDParams, PlantScenario } from '../types/process';
import {
  Trophy,
  CheckCircle2,
  Play,
  Target,
  Sparkles,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioSynth } from '../lib/audio';

export const PLANT_SCENARIOS: PlantScenario[] = [
  {
    id: 'balance',
    title: '1. Balance the Tank Manually',
    tagline: 'Learn Steady State & Self-Regulation',
    preset: 'gravity_tank',
    goalDescription: 'Adjust the inflow valve so the liquid level settles at 5.0m, and hold the speedometer at 0 cm/min for 5 continuous seconds.',
    targetMetric: 'Target Height: 5.0m (Speed = 0)',
    targetValue: 5.0,
    initialValve: 30.0,
    initialH: 2.25,
    hint: 'Because Outflow = Cv * sqrt(h), at h = 5.0m you need Inflow = 2 * sqrt(5) ≈ 4.47 m³/min. That corresponds to ~56% valve opening!',
    durationSeconds: 5,
  },
  {
    id: 'linear_lie',
    title: '2. Why Did My Linear Model Lie?',
    tagline: 'Nonlinear Curve vs. Straight Line Drift',
    preset: 'gravity_tank',
    goalDescription: 'Apply a massive step change (+40% valve opening) and observe how the true nonlinear liquid departs from the linear transfer function model prediction.',
    targetMetric: 'Trigger Large Step (+40%) & Observe Error > 0.4m',
    targetValue: 0.4,
    initialValve: 50.0,
    initialH: 4.0,
    hint: 'Linear models use a straight tangent line from Taylor series. When you make small changes, it is 99% accurate; but big disturbances push the process onto the curved slope where the linear model exaggerates the change!',
    durationSeconds: 8,
  },
  {
    id: 'beat_pid',
    title: '3. Beat the Automatic PID Controller',
    tagline: 'Operator Reflexes vs. Closed-Loop Feedback',
    preset: 'gravity_tank',
    goalDescription: 'A sudden leak drops the level! Compete against the automatic PID controller to restore the target setpoint (5.0m) within ±0.2m.',
    targetMetric: 'Reach 5.0m faster than 15 seconds without overshooting 6.0m',
    targetValue: 5.0,
    initialValve: 40.0,
    initialH: 3.5,
    hint: 'Technicians often push the valve to 80% to accelerate filling, then cut back to 56% right as level hits 4.8m to brake. If you brake too late, you overshoot!',
    durationSeconds: 15,
  },
];

interface RightSidebarProps {
  params: ProcessParams;
  pid: PIDParams;
  h: number;
  hLin: number;
  dhdt: number;
  onApplyScenario: (scen: PlantScenario) => void;
  onOpenSymbolDrawer: () => void;
}

export function RightSidebar({
  params,
  pid,
  h,
  hLin,
  dhdt,
  onApplyScenario,
  onOpenSymbolDrawer,
}: RightSidebarProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('balance');
  const [scenarioRunning, setScenarioRunning] = useState<boolean>(false);
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);

  const activeScenario = PLANT_SCENARIOS.find((s) => s.id === activeScenarioId) || PLANT_SCENARIOS[0];

  // Evaluate challenge condition every 200ms
  useEffect(() => {
    if (!scenarioRunning) return;

    const interval = setInterval(() => {
      if (activeScenarioId === 'balance') {
        const isNearTarget = Math.abs(h - 5.0) < 0.2 && Math.abs(dhdt) < 0.05;
        if (isNearTarget) {
          setHoldTimer((prev) => {
            const next = prev + 0.2;
            if (next >= 5.0 && !completedScenarios.includes('balance')) {
              audioSynth.playCelebrationChime();
              confetti({ particleCount: 60, spread: 60, origin: { x: 0.8, y: 0.6 } });
              setCompletedScenarios((c) => [...c, 'balance']);
              setScenarioRunning(false);
            }
            return next;
          });
        } else {
          setHoldTimer(0);
        }
      } else if (activeScenarioId === 'linear_lie') {
        const error = Math.abs(h - hLin);
        if (error >= 0.35 && !completedScenarios.includes('linear_lie')) {
          audioSynth.playCelebrationChime();
          confetti({ particleCount: 60, spread: 60, origin: { x: 0.8, y: 0.6 } });
          setCompletedScenarios((c) => [...c, 'linear_lie']);
          setScenarioRunning(false);
        }
      } else if (activeScenarioId === 'beat_pid') {
        const isSettled = Math.abs(h - 5.0) < 0.15;
        if (isSettled && !completedScenarios.includes('beat_pid')) {
          audioSynth.playCelebrationChime();
          confetti({ particleCount: 60, spread: 60, origin: { x: 0.8, y: 0.6 } });
          setCompletedScenarios((c) => [...c, 'beat_pid']);
          setScenarioRunning(false);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [scenarioRunning, activeScenarioId, h, hLin, dhdt, completedScenarios]);

  const handleStartScenario = (scen: PlantScenario) => {
    audioSynth.playClick();
    setActiveScenarioId(scen.id);
    setHoldTimer(0);
    setScenarioRunning(true);
    setShowHint(false);
    onApplyScenario(scen);
  };

  return (
    <aside className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl backdrop-blur flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Plant Scenarios & Challenges
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-world technician operator missions
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/50">
          {completedScenarios.length} / 3 Solved
        </span>
      </div>

      {/* Scenarios List */}
      <div className="space-y-2">
        {PLANT_SCENARIOS.map((scen) => {
          const isSelected = activeScenarioId === scen.id;
          const isCompleted = completedScenarios.includes(scen.id);

          return (
            <button
              key={scen.id}
              onClick={() => handleStartScenario(scen)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40'
                  : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{scen.title}</span>
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                  {scen.tagline}
                </div>
              </div>

              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-amber-400' : 'text-slate-500'}`} />
            </button>
          );
        })}
      </div>

      {/* Active Scenario Card */}
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 uppercase">
            <Target className="w-3 h-3 text-amber-400" />
            Current Mission Objective
          </span>
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>{showHint ? 'Hide' : 'Hint'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
          {activeScenario.goalDescription}
        </p>

        {showHint && (
          <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-500/30 text-[10px] text-amber-200 leading-relaxed animate-in fade-in">
            <span className="font-semibold text-amber-300">💡 Operator Insight: </span>
            {activeScenario.hint}
          </div>
        )}

        {/* Real-time Progress Bar */}
        {activeScenarioId === 'balance' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Steady Balance Hold:</span>
              <span className="text-emerald-400 font-bold">{holdTimer.toFixed(1)}s / 5.0s</span>
            </div>
            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all"
                style={{ width: `${Math.min(100, (holdTimer / 5.0) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {activeScenarioId === 'linear_lie' && (
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900 p-1.5 rounded border border-slate-800">
            <span className="text-slate-400">Linear Drift Error:</span>
            <span className="text-rose-400 font-bold">
              {Math.abs(h - hLin).toFixed(2)}m (Target: &gt; 0.35m)
            </span>
          </div>
        )}

        {/* Start / Reset Mission Controls */}
        <div className="pt-0.5">
          <button
            onClick={() => handleStartScenario(activeScenario)}
            className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-slate-950" />
            <span>{completedScenarios.includes(activeScenario.id) ? 'Replay Scenario' : 'Start Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Quick Symbol & Concept Decoder Button */}
      <div className="pt-0.5">
        <button
          onClick={onOpenSymbolDrawer}
          className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Symbol Decoder</span>
        </button>
      </div>
    </aside>
  );
}
