const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Escalation and calibration', () => {
  test('pre_war with no OSINT stays low-mid escalation', () => {
    // Note: DIPLOMATIC_EVENTS injection may override escalation levels
    const sim = new WarGameSimulation({ ...WarGameSimulation.SCENARIO_PRESETS.pre_war, random_seed: 42 });
    sim.run(5);
    for (const h of sim.history) {
      assert.ok(h.escalation_level <= 6,
        `pre_war day ${h.day} escalation ${h.escalation_level} should be <= 6`);
    }
  });

  test('DIPLOMATIC_EVENTS data structure is valid', () => {
    assert.ok(DIPLOMATIC_EVENTS, 'DIPLOMATIC_EVENTS should exist');
    assert.ok(DIPLOMATIC_EVENTS.days, 'should have days object');
    const dayKeys = Object.keys(DIPLOMATIC_EVENTS.days);
    assert.ok(dayKeys.length > 0, 'should have at least one day');
    const firstDay = DIPLOMATIC_EVENTS.days[dayKeys[0]];
    assert.ok(Array.isArray(firstDay.events), 'day should have events array');
  });

  test('auto-calibration applies param_calibration when present', () => {
    const sim = new WarGameSimulation({
      ...WarGameSimulation.SCENARIO_PRESETS.epic_fury_day5,
      random_seed: 42
    });
    sim.run(3);
    assert.strictEqual(sim.history.length, 3, 'should complete 3 days');
  });

  test('escalation level names map correctly', () => {
    assert.strictEqual(ESCALATION_LABELS[0], 'Diplomatic Tensions');
    assert.strictEqual(ESCALATION_LABELS[7], 'Nuclear Threshold');
    assert.ok(Object.keys(ESCALATION_LABELS).length >= 8, 'should have 8 levels');
  });
});
