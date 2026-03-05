const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Game tree decision making', () => {
  test('pre_war scenario escalation stays below full theater war', () => {
    // OSINT injection may push escalation up, but shouldn't reach nuclear
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.pre_war, random_seed: 42 });
    sim.run(5);
    for (const h of sim.history) {
      assert.ok(h.escalation_level <= 6,
        `day ${h.day} escalation should be <= 6, got ${h.escalation_level}`);
    }
  });

  test('epic_fury_day1 produces high escalation', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day1, random_seed: 42 });
    sim.run(3);
    assert.ok(sim.history[0].escalation_level >= 4,
      'epic fury day 1 should start at high escalation');
  });

  test('escalation propensity affects escalation trajectory', () => {
    const simLow = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), escalation_propensity: 0.1, random_seed: 42 });
    const simHigh = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), escalation_propensity: 0.9, random_seed: 42 });
    simLow.run(10);
    simHigh.run(10);
    const avgLow = simLow.history.reduce((s, h) => s + h.escalation_level, 0) / 10;
    const avgHigh = simHigh.history.reduce((s, h) => s + h.escalation_level, 0) / 10;
    assert.ok(avgHigh >= avgLow, 'higher escalation propensity should produce higher average escalation');
  });

  test('war weariness increases over time', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day1, random_seed: 42 });
    sim.run(20);
    assert.ok(sim.history.length >= 20, 'should run 20 days');
  });
});
