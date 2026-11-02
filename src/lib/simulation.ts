import { ProcessPreset, ProcessParams, PIDParams, SimulationPoint } from '../types/process';

export function createPresetParams(preset: ProcessPreset): ProcessParams {
  switch (preset) {
    case 'gravity_tank': {
      const A = 2.0;
      const Cv = 2.0;
      const valveOpening = 50.0;
      const inflowMax = 8.0;
      const qi = (valveOpening / 100) * inflowMax; // 4.0 m^3/min
      const qiBar = 4.0;
      const hBar = Math.pow(qiBar / Cv, 2); // 4.0 m
      const R = (2 * Math.sqrt(hBar)) / Cv; // 2.0 min/m^2
      const K = R; // 2.0 m / (m^3/min)
      const tau = A * R; // 4.0 min
      const pole = -1 / tau; // -0.25

      return {
        preset: 'gravity_tank',
        A,
        Cv,
        pumpFlow: 4.0,
        volume: 4.0,
        flowRate: 1.0,
        Tinlet: 20.0,
        Tsteady: 50.0,
        deadTime: 0.0,
        steamGain: 0.6,
        valveOpening,
        inflowMax,
        qiBar,
        qi,
        hBar,
        R,
        K,
        tau,
        pole,
      };
    }

    case 'pumped_tank': {
      const A = 2.5;
      const pumpFlow = 4.0; // Fixed centrifugal pump drainage
      const valveOpening = 50.0;
      const inflowMax = 8.0;
      const qi = (valveOpening / 100) * inflowMax; // 4.0 m^3/min
      const qiBar = 4.0;
      const hBar = 4.0; // Arbitrary steady level when inflow equals outflow
      const K = 1 / A; // 0.4 m / m^3
      const tau = 999.0; // Integrating process (tau -> infinity)
      const pole = 0.0; // On the imaginary axis: pure integrator 1/(As)

      return {
        preset: 'pumped_tank',
        A,
        Cv: 2.0,
        pumpFlow,
        volume: 4.0,
        flowRate: 1.0,
        Tinlet: 20.0,
        Tsteady: 50.0,
        deadTime: 0.0,
        steamGain: 0.6,
        valveOpening,
        inflowMax,
        qiBar,
        qi,
        hBar,
        R: 2.0,
        K,
        tau,
        pole,
      };
    }

    case 'heated_vessel': {
      const volume = 4.0; // m^3
      const flowRate = 1.0; // m^3/min
      const Tinlet = 20.0; // °C
      const valveOpening = 50.0; // % steam valve
      const steamGain = 0.6; // °C rise per % steam valve
      const Tsteady = Tinlet + valveOpening * steamGain; // 50.0 °C
      const tau = volume / flowRate; // 4.0 minutes
      const deadTime = 0.8; // 0.8 min pipe transport delay
      const pole = -1 / tau; // -0.25

      return {
        preset: 'heated_vessel',
        A: 2.0,
        Cv: 2.0,
        pumpFlow: 4.0,
        volume,
        flowRate,
        Tinlet,
        Tsteady,
        deadTime,
        steamGain,
        valveOpening,
        inflowMax: 100.0,
        qiBar: 50.0, // 50% steam
        qi: 50.0,
        hBar: Tsteady,
        R: 2.0,
        K: steamGain, // 0.6 °C / % valve
        tau,
        pole,
      };
    }
  }
}

export function createDefaultPID(preset: ProcessPreset): PIDParams {
  const setpoint = preset === 'heated_vessel' ? 50.0 : 4.0;
  return {
    enabled: false,
    setpoint,
    Kc: 20.0,        // % valve change per unit error
    tauI: 3.0,       // 3 minutes integral reset
    tauD: 0.5,       // 0.5 minutes derivative
    integralSum: 0.0,
    lastPV: setpoint,
    bias: 50.0,      // Nominal 50% valve opening
    pTerm: 0.0,
    iTerm: 0.0,
    dTerm: 0.0,
    output: 50.0,
  };
}

// True nonlinear derivative
export function calcNonlinearDerivative(
  pv: number,
  params: ProcessParams,
  inflowOverride?: number
): { rate: number; outflow: number } {
  const qi = inflowOverride !== undefined ? inflowOverride : params.qi;

  if (params.preset === 'gravity_tank') {
    const safeH = Math.max(0, pv);
    const outflow = params.Cv * Math.sqrt(safeH);
    const rate = (qi - outflow) / Math.max(0.1, params.A);
    return { rate, outflow };
  }

  if (params.preset === 'pumped_tank') {
    // Fixed pump drainage
    const outflow = pv > 0.01 ? params.pumpFlow : 0;
    const rate = (qi - outflow) / Math.max(0.1, params.A);
    return { rate, outflow };
  }

  // Heated vessel: dT/dt = (Tinlet - T)/tau + (K/tau)*(steam - steam_bar)
  const T = pv;
  const deltaSteam = qi - params.qiBar;
  const rate = (params.Tinlet + params.K * params.qiBar - T) / params.tau + (params.K * deltaSteam) / params.tau;
  const heatRemoval = (T - params.Tinlet) / params.tau;
  return { rate, outflow: heatRemoval };
}

// Linearized transfer function model derivative
export function calcLinearDerivative(
  pvLin: number,
  params: ProcessParams,
  inflowOverride?: number
): number {
  const qi = inflowOverride !== undefined ? inflowOverride : params.qi;
  const inputDelta = qi - params.qiBar;
  const pvDelta = pvLin - params.hBar;

  if (params.preset === 'pumped_tank') {
    // Pure integrator: dhLin/dt = (1/A) * inputDelta
    return params.K * inputDelta;
  }

  // First-order lag: tau * dx'/dt + x' = K * u' => dx'/dt = (K * u' - x') / tau
  return (params.K * inputDelta - pvDelta) / Math.max(0.01, params.tau);
}

// 4th-Order Runge-Kutta numerical step
export function rk4SimulationStep(
  pv: number,
  pvLin: number,
  params: ProcessParams,
  dt: number,
  inflowOverride?: number
): { pvNext: number; pvLinNext: number; rate: number; outflow: number } {
  // Nonlinear RK4
  const k1 = calcNonlinearDerivative(pv, params, inflowOverride);
  const k2 = calcNonlinearDerivative(pv + 0.5 * dt * k1.rate, params, inflowOverride);
  const k3 = calcNonlinearDerivative(pv + 0.5 * dt * k2.rate, params, inflowOverride);
  const k4 = calcNonlinearDerivative(pv + dt * k3.rate, params, inflowOverride);

  const rawNext = pv + (dt / 6) * (k1.rate + 2 * k2.rate + 2 * k3.rate + k4.rate);
  const maxLimit = params.preset === 'heated_vessel' ? 100.0 : 8.0;
  const minLimit = params.preset === 'heated_vessel' ? 15.0 : 0.0;
  const pvNext = Math.max(minLimit, Math.min(maxLimit, rawNext));

  // Linear RK4
  const l1 = calcLinearDerivative(pvLin, params, inflowOverride);
  const l2 = calcLinearDerivative(pvLin + 0.5 * dt * l1, params, inflowOverride);
  const l3 = calcLinearDerivative(pvLin + 0.5 * dt * l2, params, inflowOverride);
  const l4 = calcLinearDerivative(pvLin + dt * l3, params, inflowOverride);

  const rawLinNext = pvLin + (dt / 6) * (l1 + 2 * l2 + 2 * l3 + l4);
  const pvLinNext = Math.max(minLimit - 2, Math.min(maxLimit + 4, rawLinNext));

  return {
    pvNext,
    pvLinNext,
    rate: k1.rate,
    outflow: k1.outflow,
  };
}

// PID Controller calculation loop with anti-windup clamping
export function updatePID(
  pid: PIDParams,
  pv: number,
  dt: number
): { nextPID: PIDParams; valveOutput: number } {
  if (!pid.enabled) {
    return {
      nextPID: {
        ...pid,
        pTerm: 0,
        iTerm: 0,
        dTerm: 0,
        lastPV: pv,
      },
      valveOutput: pid.bias,
    };
  }

  const error = pid.setpoint - pv;

  // Proportional term
  const pTerm = pid.Kc * error;

  // Integral term with anti-windup clamping
  const rawIntegral = pid.integralSum + error * dt;
  const maxI = 50.0;
  const clampedIntegral = Math.max(-maxI, Math.min(maxI, rawIntegral));
  const iTerm = pid.tauI > 0.01 ? (pid.Kc / pid.tauI) * clampedIntegral : 0;

  // Derivative term (on measurement to avoid derivative kick)
  const dPVdt = dt > 0.0001 ? (pv - pid.lastPV) / dt : 0;
  const dTerm = -pid.Kc * pid.tauD * dPVdt;

  // Combined valve output clamped to [0, 100]%
  const rawOutput = pid.bias + pTerm + iTerm + dTerm;
  const output = Math.max(0, Math.min(100, rawOutput));

  const nextPID: PIDParams = {
    ...pid,
    integralSum: clampedIntegral,
    lastPV: pv,
    pTerm,
    iTerm,
    dTerm,
    output,
  };

  return { nextPID, valveOutput: output };
}
