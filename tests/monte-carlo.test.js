const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Monte Carlo simulation', () => {
  test('monteCarlo returns correct stats structure', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.pre_war, random_seed: 42 });
    const result = sim.monteCarlo(10, 10);
    assert.ok(result, 'should return result');
    assert.ok(result.iran_casualties, 'should have iran_casualties stats');
    assert.ok(result.us_casualties, 'should have us_casualties stats');
    assert.ok(result.oil_price_outcomes, 'should have oil_price_outcomes stats');
    assert.ok(typeof result.iran_casualties.median === 'number', 'median should be number');
    assert.ok(typeof result.iran_casualties.p5 === 'number', 'p5 should be number');
    assert.ok(typeof result.iran_casualties.p95 === 'number', 'p95 should be number');
  });

  test('seeded runs are reproducible', () => {
    const sim1 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), random_seed: 123 });
    const sim2 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), random_seed: 123 });
    sim1.run(10);
    sim2.run(10);
    assert.strictEqual(sim1.history[9].casualties.iran, sim2.history[9].casualties.iran,
      'same seed should produce identical Iran casualties');
    assert.strictEqual(sim1.history[9].casualties.us, sim2.history[9].casualties.us,
      'same seed should produce identical US casualties');
  });

  test('different seeds produce different results', () => {
    const sim1 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), random_seed: 1 });
    const sim2 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), random_seed: 999 });
    sim1.run(20);
    sim2.run(20);
    const cas1 = sim1.history[19].casualties.iran;
    const cas2 = sim2.history[19].casualties.iran;
    assert.ok(cas1 !== cas2 || sim1.history[19].oil_price !== sim2.history[19].oil_price,
      'different seeds should produce different results');
  });

  test('Monte Carlo P5 <= median <= P95', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day1, random_seed: 42 });
    const result = sim.monteCarlo(20, 15);
    assert.ok(result.iran_casualties.p5 <= result.iran_casualties.median, 'P5 <= median');
    assert.ok(result.iran_casualties.median <= result.iran_casualties.p95, 'median <= P95');
    assert.ok(result.us_casualties.p5 <= result.us_casualties.median, 'US P5 <= median');
  });
});
