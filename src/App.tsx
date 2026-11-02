import React, { useState, useEffect, useRef } from 'react';
import {
  ProcessPreset,
  VisualLens,
  ProcessParams,
  PIDParams,
  SimulationPoint,
  PlantScenario,
} from './types/process';
import {
  createPresetParams,
  createDefaultPID,
  rk4SimulationStep,
  updatePID,
} from './lib/simulation';
import { audioSynth } from './lib/audio';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { PlantView } from './components/PlantView';
import { MathDecoderView } from './components/MathDecoderView';
import { SimulinkView } from './components/SimulinkView';
import { StripChart } from './components/StripChart';
import { RightSidebar } from './components/RightSidebar';
import { SymbolDecoderDrawer } from './components/SymbolDecoderDrawer';

export default function App() {
  // Navigation & Lens selection
  const [currentPreset, setCurrentPreset] = useState<ProcessPreset>('gravity_tank');
  const [currentLens, setCurrentLens] = useState<VisualLens>('plant');
  const [isMuted, setIsMuted] = useState(true);
  const [isSymbolDrawerOpen, setIsSymbolDrawerOpen] = useState(false);

  // Simulation Parameters & PID
  const [params, setParams] = useState<ProcessParams>(() => createPresetParams('gravity_tank'));
  const [pid, setPid] = useState<PIDParams>(() => createDefaultPID('gravity_tank'));

  // Live state
  const [h, setH] = useState<number>(4.0);
  const [hLin, setHLin] = useState<number>(4.0);
  const [dhdt, setDhdt] = useState<number>(0.0);
  const [outflow, setOutflow] = useState<number>(4.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [deviationMode, setDeviationMode] = useState<boolean>(false);

  // Rolling DCS history buffer
  const [history, setHistory] = useState<SimulationPoint[]>(() => {
    const pts: SimulationPoint[] = [];
    for (let t = 0; t <= 10; t += 0.5) {
      pts.push({
        t,
        h: 4.0,
        hLin: 4.0,
        qi: 4.0,
        qo: 4.0,
        dhdt: 0.0,
        hPrime: 0.0,
        hLinPrime: 0.0,
        qiPrime: 0.0,
        valve: 50.0,
      });
    }
    return pts;
  });

  // State refs for 60fps loop
  const stateRef = useRef({
    h: 4.0,
    hLin: 4.0,
    simTime: 10.0,
    params,
    pid,
    isPaused: false,
    simSpeed: 1,
  });

  useEffect(() => {
    stateRef.current.params = params;
    stateRef.current.pid = pid;
    stateRef.current.isPaused = isPaused;
    stateRef.current.simSpeed = simSpeed;
  }, [params, pid, isPaused, simSpeed]);

  // Main 60 FPS deterministic simulation loop (RK4) with throttled React setState
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastStateUpdate = performance.now();

    const loop = (timestamp: number) => {
      const deltaMs = timestamp - lastTime;
      lastTime = timestamp;

      if (!stateRef.current.isPaused && deltaMs > 0) {
        // dt in process minutes: ~1 sec real-time = ~0.5 min simulation time * speed multiplier
        const baseDt = Math.min(0.08, (deltaMs / 1000) * 0.5);
        const dt = baseDt * stateRef.current.simSpeed;

        let activeInflow = stateRef.current.params.qi;
        let nextPIDState = stateRef.current.pid;

        // If Automatic PID feedback is enabled, calculate valve command
        if (stateRef.current.pid.enabled) {
          const { nextPID, valveOutput } = updatePID(
            stateRef.current.pid,
            stateRef.current.h,
            dt
          );
          nextPIDState = nextPID;
          activeInflow = (valveOutput / 100) * stateRef.current.params.inflowMax;

          // Sync PID and valveOpening back to state
          if (timestamp - lastStateUpdate > 40) {
            setPid(nextPID);
            setParams((prev) => ({
              ...prev,
              valveOpening: valveOutput,
              qi: activeInflow,
            }));
          }
        }

        // RK4 step
        const step = rk4SimulationStep(
          stateRef.current.h,
          stateRef.current.hLin,
          stateRef.current.params,
          dt,
          activeInflow
        );

        const newTime = stateRef.current.simTime + dt;
        stateRef.current.h = step.pvNext;
        stateRef.current.hLin = step.pvLinNext;
        stateRef.current.simTime = newTime;

        // Throttle React renders to ~25 Hz for silky smooth UI without thrashing
        if (timestamp - lastStateUpdate > 40) {
          setH(step.pvNext);
          setHLin(step.pvLinNext);
          setDhdt(step.rate);
          setOutflow(step.outflow);
          lastStateUpdate = timestamp;
        }

        // Append to history buffer every ~0.2 process minutes
        setHistory((prev) => {
          const lastPt = prev[prev.length - 1];
          if (!lastPt || newTime - lastPt.t >= 0.2) {
            const currentParams = stateRef.current.params;
            const newPt: SimulationPoint = {
              t: newTime,
              h: step.pvNext,
              hLin: step.pvLinNext,
              qi: activeInflow,
              qo: step.outflow,
              dhdt: step.rate,
              hPrime: step.pvNext - currentParams.hBar,
              hLinPrime: step.pvLinNext - currentParams.hBar,
              qiPrime: activeInflow - currentParams.qiBar,
              valve: currentParams.valveOpening,
              setpoint: nextPIDState.setpoint,
              pTerm: nextPIDState.pTerm,
              iTerm: nextPIDState.iTerm,
              dTerm: nextPIDState.dTerm,
              overflow: currentParams.preset !== 'heated_vessel' && step.pvNext >= 7.8,
            };
            const updated = [...prev, newPt];
            return updated.length > 200 ? updated.slice(updated.length - 200) : updated;
          }
          return prev;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Preset switch handler
  const handleSelectPreset = (newPreset: ProcessPreset) => {
    audioSynth.playClick();
    setCurrentPreset(newPreset);
    const newParams = createPresetParams(newPreset);
    const newPid = createDefaultPID(newPreset);

    setParams(newParams);
    setPid(newPid);
    setH(newParams.hBar);
    setHLin(newParams.hBar);
    setDhdt(0.0);
    setOutflow(newParams.qiBar);

    stateRef.current.h = newParams.hBar;
    stateRef.current.hLin = newParams.hBar;
    stateRef.current.params = newParams;
    stateRef.current.pid = newPid;
    stateRef.current.simTime = 10.0;

    // Reset history
    const initialPts: SimulationPoint[] = [];
    for (let t = 0; t <= 10; t += 0.5) {
      initialPts.push({
        t,
        h: newParams.hBar,
        hLin: newParams.hBar,
        qi: newParams.qiBar,
        qo: newParams.qiBar,
        dhdt: 0.0,
        hPrime: 0.0,
        hLinPrime: 0.0,
        qiPrime: 0.0,
        valve: newParams.valveOpening,
      });
    }
    setHistory(initialPts);
  };

  // Valve Opening Change
  const handleValveChange = (newOpening: number) => {
    audioSynth.playClick();
    const clampedOpening = Math.max(0, Math.min(100, newOpening));
    const newQi = (clampedOpening / 100) * params.inflowMax;

    setParams((prev) => ({
      ...prev,
      valveOpening: clampedOpening,
      qi: newQi,
    }));
  };

  // Step change test (+15% valve step)
  const handleStepChange = () => {
    audioSynth.playClick();
    const targetOpening = Math.min(100, params.valveOpening + 15.0);
    handleValveChange(targetOpening);
  };

  // Inject Disturbance (+20% impulse)
  const handleInjectDisturbance = () => {
    audioSynth.playClick();
    const targetOpening = Math.min(100, params.valveOpening + 20.0);
    handleValveChange(targetOpening);
  };

  // Reset to steady state
  const handleResetSystem = () => {
    audioSynth.playClick();
    handleSelectPreset(currentPreset);
  };

  // Apply Plant Scenario
  const handleApplyScenario = (scen: PlantScenario) => {
    if (scen.preset !== currentPreset) {
      handleSelectPreset(scen.preset);
    }
    setH(scen.initialH);
    setHLin(scen.initialH);
    stateRef.current.h = scen.initialH;
    stateRef.current.hLin = scen.initialH;
    handleValveChange(scen.initialValve);
    setPid((prev) => ({
      ...prev,
      enabled: false,
      setpoint: scen.targetValue,
    }));
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioSynth.setMuted(nextMuted);
    if (!nextMuted) audioSynth.playClick();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Top Bar Header */}
      <Header
        currentLens={currentLens}
        onSelectLens={(lens) => {
          audioSynth.playClick();
          setCurrentLens(lens);
        }}
        isMuted={isMuted}
        onToggleAudio={handleToggleAudio}
        onResetSystem={handleResetSystem}
        onOpenQuickGuide={() => setIsSymbolDrawerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Top Control Bar: Presets + 3-Lens Mode Switcher + Sim Controls */}
        <ControlBar
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          currentLens={currentLens}
          onSelectLens={(lens) => {
            audioSynth.playClick();
            setCurrentLens(lens);
          }}
          isPaused={isPaused}
          onTogglePause={() => {
            audioSynth.playClick();
            setIsPaused(!isPaused);
          }}
          onInjectDisturbance={handleInjectDisturbance}
          onStepChange={handleStepChange}
          simSpeed={simSpeed}
          onChangeSpeed={(spd) => {
            audioSynth.playClick();
            setSimSpeed(spd);
          }}
        />

        {/* Dynamic Canvas + Right Sidebar 2-Zone Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Main Interactive Stage (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            {/* LENS 1: Technician / Plant View */}
            {currentLens === 'plant' && (
              <div className="animate-in fade-in duration-200">
                <PlantView
                  params={params}
                  h={h}
                  dhdt={dhdt}
                  outflow={outflow}
                  onValveChange={handleValveChange}
                  isPaused={isPaused}
                />
              </div>
            )}

            {/* LENS 2: Visual Math Decoder View */}
            {currentLens === 'math_decoder' && (
              <div className="animate-in fade-in duration-200">
                <MathDecoderView
                  params={params}
                  h={h}
                  dhdt={dhdt}
                  outflow={outflow}
                  deviationMode={deviationMode}
                  onToggleDeviationMode={(val) => setDeviationMode(val)}
                  onApplyStepTest={(delta) => handleValveChange(params.valveOpening + delta * 10)}
                />
              </div>
            )}

            {/* LENS 3: Simulink Block Diagram View */}
            {currentLens === 'simulink' && (
              <div className="animate-in fade-in duration-200">
                <SimulinkView
                  params={params}
                  pid={pid}
                  onUpdatePID={(next) => setPid(next)}
                  h={h}
                  dhdt={dhdt}
                  onGainChange={(newK) => setParams((p) => ({ ...p, K: newK }))}
                  onTauChange={(newTau) =>
                    setParams((p) => ({
                      ...p,
                      tau: newTau,
                      pole: -1 / newTau,
                    }))
                  }
                  onSetpointChange={(newSP) => setPid((p) => ({ ...p, setpoint: newSP }))}
                />
              </div>
            )}

            {/* DCS Strip Chart / Trend Recorder (Visible across all lenses) */}
            <StripChart
              history={history}
              params={params}
              deviationMode={deviationMode}
              onToggleDeviationMode={(val) => setDeviationMode(val)}
              showLinearComparison={currentLens === 'simulink' || currentLens === 'math_decoder'}
            />
          </section>

          {/* Right Sidebar: Plant Scenarios & Challenges (4 Cols) */}
          <section className="lg:col-span-4 sticky top-20">
            <RightSidebar
              params={params}
              pid={pid}
              h={h}
              hLin={hLin}
              dhdt={dhdt}
              onApplyScenario={handleApplyScenario}
              onOpenSymbolDrawer={() => setIsSymbolDrawerOpen(true)}
            />
          </section>
        </div>
      </main>

      {/* Interactive Symbol Decoder Drawer */}
      <SymbolDecoderDrawer
        isOpen={isSymbolDrawerOpen}
        onClose={() => setIsSymbolDrawerOpen(false)}
      />
    </div>
  );
}
