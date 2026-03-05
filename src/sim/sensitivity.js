// src/sim/sensitivity.js -- One-at-a-Time (OAT) sensitivity analysis

WarGameSimulation.sensitivityAnalysis = function(baseParams, metric, days, runsPerPoint) {
  days = days || 30;
  runsPerPoint = runsPerPoint || 5;
  const perturbation = 0.10; // +/- 10%

  // Tunable parameters with their ranges
  const TUNABLE = [
    'escalation_propensity', 'us_force_multiplier', 'iran_force_multiplier',
    'proxy_effectiveness', 'cyber_intensity', 'iran_asymmetric_factor',
    'us_tech_advantage', 'nuclear_threshold_probability', 'patriot_intercept_rate',
    'thaad_intercept_rate', 'iron_dome_intercept_rate', 'oil_price_elasticity',
    'us_sead_effectiveness', 'iran_ad_lethality', 'iran_mine_warfare_effectiveness',
    'us_mcm_effectiveness', 'hormuz_mining_probability', 'iran_ballistic_cep_factor',
  ];

  // Metric extractors
  const METRICS = {
    iran_casualties: h => h[h.length - 1].casualties.iran,
    us_casualties: h => h[h.length - 1].casualties.us,
    oil_price: h => h[h.length - 1].oil_price,
    nuclear_probability: h => {
      let nuclear_days = 0;
      for (const d of h) if (d.escalation_level >= 7) nuclear_days++;
      return nuclear_days / h.length;
    },
    escalation_peak: h => Math.max(...h.map(d => d.escalation_level)),
  };

  const extractMetric = METRICS[metric] || METRICS.iran_casualties;

  // Run base case
  function avgMetric(params) {
    let total = 0;
    for (let i = 0; i < runsPerPoint; i++) {
      const p = { ...params, random_seed: 1000 + i };
      const sim = new WarGameSimulation(p);
      const history = sim.run(days);
      total += extractMetric(history);
    }
    return total / runsPerPoint;
  }

  const baseValue = avgMetric(baseParams);
  const results = [];

  for (const param of TUNABLE) {
    const base = baseParams[param];
    if (typeof base !== 'number' || base === 0) continue;

    const lo = base * (1 - perturbation);
    const hi = base * (1 + perturbation);

    const loParams = { ...baseParams, [param]: lo };
    const hiParams = { ...baseParams, [param]: hi };

    const loValue = avgMetric(loParams);
    const hiValue = avgMetric(hiParams);

    results.push({
      param,
      base_value: base,
      lo_value: loValue,
      hi_value: hiValue,
      base_metric: baseValue,
      swing: Math.abs(hiValue - loValue),
      lo_delta: loValue - baseValue,
      hi_delta: hiValue - baseValue,
    });
  }

  // Sort by swing (largest first)
  results.sort((a, b) => b.swing - a.swing);

  return {
    metric,
    base_metric: baseValue,
    days,
    runs_per_point: runsPerPoint,
    perturbation,
    parameters: results,
  };
};
