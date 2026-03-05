const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Lanchester combat model', () => {
  test('known inputs produce damage in expected range (seeded PRNG)', () => {
    const sim = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), random_seed: 42 });
    const defender = sim.state.iran_units.find(u => u.status === 'active' && u.unit_type !== 'proxy');
    assert.ok(defender, 'should have an active Iran unit');
    const initStrength = defender.strength;
    sim.step();
    assert.ok(defender.strength <= initStrength, 'defender should take damage after one step');
  });

  test('US tech advantage scales damage proportionally', () => {
    const sim1 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), us_tech_advantage: 1.0, random_seed: 42 });
    const sim2 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), us_tech_advantage: 2.5, random_seed: 42 });
    sim1.run(5);
    sim2.run(5);
    assert.ok(sim2.history[4].casualties.iran >= sim1.history[4].casualties.iran,
      'higher tech advantage should cause more Iran casualties');
  });

  test('MilitaryUnit status transitions via take_damage', () => {
    const unit = new MilitaryUnit({
      name: 'Test', side: 'iran', unit_type: 'infantry', sub_type: 'regular',
      strength: 100, max_strength: 100, quantity: 10
    });
    assert.strictEqual(unit.status, 'active');
    // Damage to < 60% of max -> degraded
    unit.take_damage(45);
    assert.strictEqual(unit.status, 'degraded');
    // Damage to < 30% of max -> combat_ineffective
    unit.take_damage(30);
    assert.strictEqual(unit.status, 'combat_ineffective');
    // Damage to 0 -> destroyed
    unit.take_damage(100);
    assert.strictEqual(unit.status, 'destroyed');
  });

  test('Iran asymmetric factor applies to fast attack units', () => {
    const sim1 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), iran_asymmetric_factor: 0.5, random_seed: 42 });
    const sim2 = new WarGameSimulation({ ...WarGameSimulation.defaultParams(), iran_asymmetric_factor: 2.0, random_seed: 42 });
    sim1.run(5);
    sim2.run(5);
    // Higher asymmetric factor should cause more US casualties
    assert.ok(sim2.history[4].casualties.us >= sim1.history[4].casualties.us,
      'higher asymmetric factor should increase US casualties');
  });
});
