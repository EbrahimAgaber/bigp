export type ProcessPreset = 'gravity_tank' | 'pumped_tank' | 'heated_vessel';

export type VisualLens = 'plant' | 'math_decoder' | 'simulink';

export interface PIDParams {
  enabled: boolean;
  setpoint: number;       // Target level (m) or temperature (°C)
  Kc: number;             // Proportional controller gain (% valve / unit error)
  tauI: number;           // Integral reset time (minutes)
  tauD: number;           // Derivative time (minutes)
  integralSum: number;    // Accumulated error over time
  lastPV: number;         // Last process variable for derivative calculation
  bias: number;           // Manual controller bias (% valve)
  pTerm: number;          // Live P component
  iTerm: number;          // Live I component
  dTerm: number;          // Live D component
  output: number;         // Resulting valve opening % (0 - 100)
}

export interface ProcessParams {
  preset: ProcessPreset;
  // Tank geometry / physical properties
  A: number;              // Cross-sectional area (m^2)
  Cv: number;             // Valve discharge coefficient (m^2.5 / min)
  pumpFlow: number;       // Fixed pump rate for integrating pumped tank (m^3 / min)
  
  // Thermal properties (Heated vessel)
  volume: number;         // Vessel volume (m^3)
  flowRate: number;       // Liquid throughput (m^3 / min)
  Tinlet: number;         // Inlet cold liquid temp (°C)
  Tsteady: number;        // Nominal steady state temp (°C)
  deadTime: number;       // Pipe transport delay theta (minutes)
  steamGain: number;      // °C per % steam valve
  
  // Operating point & baseline values
  valveOpening: number;   // Inflow valve opening % (0 - 100)
  inflowMax: number;      // Flow when valve is 100% open (m^3 / min)
  qiBar: number;          // Steady-state inflow (m^3 / min)
  qi: number;             // Current inflow (m^3 / min)
  hBar: number;           // Steady-state height (m) or temp (°C)
  
  // Linear transfer function parameters
  R: number;              // Outflow resistance: 2*sqrt(hBar)/Cv (min / m^2)
  K: number;              // Steady-state gain (output units / input unit)
  tau: number;            // Process time constant (minutes)
  pole: number;           // Transfer function pole: -1 / tau
}

export interface SimulationPoint {
  t: number;              // Time in minutes
  h: number;              // Actual process variable: Height (m) or Temp (°C)
  hLin: number;           // Linearized transfer function model estimate
  qi: number;             // Inflow or steam input
  qo: number;             // Outflow or heat removal
  dhdt: number;           // Rate of change (speedometer: m/min or °C/min)
  hPrime: number;         // Deviation variable: h - hBar
  hLinPrime: number;      // Linear deviation variable: hLin - hBar
  qiPrime: number;        // Input deviation variable: qi - qiBar
  valve: number;          // Valve opening %
  setpoint?: number;      // Setpoint target
  pTerm?: number;         // PID P contribution
  iTerm?: number;         // PID I contribution
  dTerm?: number;         // PID D contribution
  overflow?: boolean;     // Tank overtopped threshold
}

export interface PlantScenario {
  id: string;
  title: string;
  tagline: string;
  preset: ProcessPreset;
  goalDescription: string;
  targetMetric: string;
  targetValue: number;
  initialValve: number;
  initialH: number;
  hint: string;
  durationSeconds: number;
}
