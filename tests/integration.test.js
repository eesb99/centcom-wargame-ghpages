const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Integration tests', () => {
  test('30-day pre_war run produces history length 30', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.pre_war, random_seed: 42 });
    const history = sim.run(30);
    assert.strictEqual(history.length, 30, 'should produce 30 days of history');
  });

  test('oil price stays in reasonable range', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day1, random_seed: 42 });
    const history = sim.run(30);
    for (const h of history) {
      assert.ok(h.oil_price >= 70 && h.oil_price <= 150,
        `oil price ${h.oil_price.toFixed(2)} on day ${h.day} should be in [70, 150]`);
    }
  });

  test('Iran casualties > US casualties (asymmetric warfare)', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day5, random_seed: 42 });
    const history = sim.run(20);
    const last = history[history.length - 1];
    if (last.casualties.us > 0) {
      const ratio = last.casualties.iran / last.casualties.us;
      assert.ok(ratio >= 3,
        `casualty ratio ${ratio.toFixed(1)}:1 should be >= 3:1`);
    }
  });

  test('all 9 scenario presets run without error', () => {
    const presets = Object.keys(WarGameSimulation.SCENARIO_PRESETS);
    assert.ok(presets.length >= 9, `should have >= 9 presets, got ${presets.length}`);
    for (const name of presets) {
      const sim = new WarGameSimulation({
        ...WarGameSimulation.SCENARIO_PRESETS[name],
        random_seed: 42
      });
      const history = sim.run(5);
      assert.strictEqual(history.length, 5, `${name} should produce 5 days`);
    }
  });

  test('new scenario presets (limited, escalatory, proxy, worst) have descriptions', () => {
    for (const name of ['limited', 'escalatory', 'proxy', 'worst']) {
      const preset = WarGameSimulation.SCENARIO_PRESETS[name];
      assert.ok(preset, `${name} preset should exist`);
      assert.ok(preset.description, `${name} should have description`);
      assert.ok(typeof preset.initial_escalation === 'number', `${name} should have initial_escalation`);
    }
  });

  test('escalation never exceeds 7 (nuclear)', () => {
    const sim = new WarGameSimulation({
      ...WarGameSimulation.SCENARIO_PRESETS.worst,
      random_seed: 42
    });
    const history = sim.run(30);
    for (const h of history) {
      assert.ok(h.escalation_level <= 7,
        `escalation ${h.escalation_level} on day ${h.day} should not exceed 7`);
    }
  });

  test('force strength decreases over time in combat', () => {
    const sim = new WarGameSimulation({
      ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day1,
      random_seed: 42
    });
    const history = sim.run(10);
    const iranForceDay1 = history[0].iran_units?.filter(u => u.status === 'active').length || 0;
    const iranForceLast = history[9].iran_units?.filter(u => u.status === 'active').length || 0;
    assert.ok(iranForceLast <= iranForceDay1,
      'Iran active units should decrease or stay same over combat');
  });
});
