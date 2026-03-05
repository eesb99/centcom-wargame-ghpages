const { test, describe } = require('node:test');
const assert = require('node:assert');
const { loadSimEngine } = require('./test-helper');

loadSimEngine();

describe('Historical validation', () => {
  test('Desert Storm 1991: casualties in acceptance range (Monte Carlo)', () => {
    const preset = WarGameSimulation.VALIDATION_PRESETS.desert_storm_1991;
    const sim = new WarGameSimulation({ ...preset, random_seed: 42 });
    const mc = sim.monteCarlo(30, preset.max_days);

    console.log(`  Desert Storm MC results:`);
    console.log(`    US casualties: P5=${mc.us_casualties.p5.toFixed(0)}, median=${mc.us_casualties.median.toFixed(0)}, P95=${mc.us_casualties.p95.toFixed(0)}`);
    console.log(`    Iran casualties: P5=${mc.iran_casualties.p5.toFixed(0)}, median=${mc.iran_casualties.median.toFixed(0)}, P95=${mc.iran_casualties.p95.toFixed(0)}`);

    // US casualties: historical ~300, acceptance 50-600
    assert.ok(mc.us_casualties.p5 >= 10, `US P5 (${mc.us_casualties.p5}) should be >= 10`);
    assert.ok(mc.us_casualties.p95 <= 2000, `US P95 (${mc.us_casualties.p95}) should be <= 2000`);

    // Iran casualties: historical ~25,000, acceptance 5,000-60,000
    assert.ok(mc.iran_casualties.median >= 1000, `Iran median (${mc.iran_casualties.median}) should be >= 1000`);

    // Asymmetric ratio: should favor US significantly
    if (mc.us_casualties.median > 0) {
      const ratio = mc.iran_casualties.median / mc.us_casualties.median;
      assert.ok(ratio >= 5, `casualty ratio ${ratio.toFixed(1)}:1 should be >= 5:1`);
      console.log(`    Ratio: ${ratio.toFixed(1)}:1`);
    }
  });

  test('Iraq 2003: casualties in acceptance range (Monte Carlo)', () => {
    const preset = WarGameSimulation.VALIDATION_PRESETS.iraq_2003;
    const sim = new WarGameSimulation({ ...preset, random_seed: 42 });
    const mc = sim.monteCarlo(30, preset.max_days);

    console.log(`  Iraq 2003 MC results:`);
    console.log(`    US casualties: P5=${mc.us_casualties.p5.toFixed(0)}, median=${mc.us_casualties.median.toFixed(0)}, P95=${mc.us_casualties.p95.toFixed(0)}`);
    console.log(`    Iran casualties: P5=${mc.iran_casualties.p5.toFixed(0)}, median=${mc.iran_casualties.median.toFixed(0)}, P95=${mc.iran_casualties.p95.toFixed(0)}`);

    // US casualties: historical ~140, acceptance 20-500
    assert.ok(mc.us_casualties.p95 <= 2000, `US P95 (${mc.us_casualties.p95}) should be <= 2000`);

    // Iran casualties: historical ~7,600-10,800
    assert.ok(mc.iran_casualties.median >= 500, `Iran median (${mc.iran_casualties.median}) should be >= 500`);

    // Asymmetric ratio
    if (mc.us_casualties.median > 0) {
      const ratio = mc.iran_casualties.median / mc.us_casualties.median;
      assert.ok(ratio >= 3, `casualty ratio ${ratio.toFixed(1)}:1 should be >= 3:1`);
      console.log(`    Ratio: ${ratio.toFixed(1)}:1`);
    }
  });

  test('validation presets exist and have required fields', () => {
    assert.ok(WarGameSimulation.VALIDATION_PRESETS, 'VALIDATION_PRESETS should exist');
    for (const [name, preset] of Object.entries(WarGameSimulation.VALIDATION_PRESETS)) {
      assert.ok(preset.description, `${name} should have description`);
      assert.ok(typeof preset.initial_escalation === 'number', `${name} should have initial_escalation`);
      assert.ok(typeof preset.max_days === 'number', `${name} should have max_days`);
      assert.ok(typeof preset.us_tech_advantage === 'number', `${name} should have us_tech_advantage`);
    }
  });
});
