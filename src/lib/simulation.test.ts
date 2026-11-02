import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPresetParams,
  createDefaultPID,
  calcNonlinearDerivative,
  calcLinearDerivative,
  rk4SimulationStep,
  updatePID,
} from './simulation';

test('Gravity Tank initial steady state derivative is zero', () => {
  const params = createPresetParams('gravity_tank');
  assert.equal(params.hBar, 4.0);
  assert.equal(params.qiBar, 4.0);

  const { rate, outflow } = calcNonlinearDerivative(4.0, params);
  assert.equal(outflow, 4.0);
  assert.ok(Math.abs(rate) < 1e-6, `Expected rate ~0, got ${rate}`);
});

test('Gravity Tank drains when inflow is shut off', () => {
  const params = createPresetParams('gravity_tank');
  const { rate, outflow } = calcNonlinearDerivative(4.0, params, 0.0);
  assert.equal(outflow, 4.0);
  // rate = (0 - 4) / 2 = -2.0 m/min
  assert.equal(rate, -2.0);
});

test('Pumped Tank has constant outflow rate regardless of height', () => {
  const params = createPresetParams('pumped_tank');
  assert.equal(params.pumpFlow, 4.0);

  const res1 = calcNonlinearDerivative(2.0, params);
  const res2 = calcNonlinearDerivative(6.0, params);
  assert.equal(res1.outflow, 4.0);
  assert.equal(res2.outflow, 4.0);
  assert.equal(params.pole, 0.0);
});

test('RK4 simulation step stably converges toward new steady state', () => {
  const params = createPresetParams('gravity_tank');
  let pv = 4.0;
  let pvLin = 4.0;
  const targetInflow = 6.0;
  const dt = 0.05;

  for (let i = 0; i < 200; i++) {
    const step = rk4SimulationStep(pv, pvLin, params, dt, targetInflow);
    pv = step.pvNext;
    pvLin = step.pvLinNext;
  }

  assert.ok(pv > 4.0, 'Liquid level should rise');
});

test('PID controller responds to error with proportional action', () => {
  const pid = createDefaultPID('gravity_tank');
  pid.enabled = true;
  pid.setpoint = 5.0; // Currently at 4.0, error is +1.0

  const { nextPID, valveOutput } = updatePID(pid, 4.0, 0.1);
  assert.equal(nextPID.pTerm, 20.0);
  assert.ok(valveOutput > 50.0);
});

test('PID controller respects anti-windup clamping', () => {
  const pid = createDefaultPID('gravity_tank');
  pid.enabled = true;
  pid.setpoint = 10.0;
  let currentPID = pid;

  for (let i = 0; i < 100; i++) {
    const res = updatePID(currentPID, 0.0, 1.0);
    currentPID = res.nextPID;
  }

  assert.ok(currentPID.integralSum <= 50.0, 'Anti-windup clamping breached');
  assert.ok(currentPID.output <= 100.0, 'Valve max clamp breached');
});
