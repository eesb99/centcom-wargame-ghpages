class WarGameSimulation {
  constructor(scenario_params) {
    const base = WarGameSimulation.defaultParams();
    const user_params = scenario_params || {};

    // Apply scenario preset if specified
    const preset_name = user_params.scenario_preset || base.scenario_preset;
    if (preset_name && WarGameSimulation.SCENARIO_PRESETS[preset_name]) {
      const preset = {};
      const presetData = WarGameSimulation.SCENARIO_PRESETS[preset_name];
      for (const k of Object.keys(presetData)) {
        if (k !== 'description') preset[k] = presetData[k];
      }
      this.params = Object.assign({}, base, preset, user_params);
    } else {
      this.params = Object.assign({}, base, user_params);
    }

    this._validateParams();
    this.state = new SimulationState();
    this.history = [];
    this._init_forces();
  }

  _validateParams() {
    const p = this.params;
    const clamp = (v, lo, hi, def) => {
      if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) return def;
      return Math.max(lo, Math.min(hi, v));
    };
    p.max_days = clamp(p.max_days, 1, 365, 90);
    p.us_force_multiplier = clamp(p.us_force_multiplier, 0.01, 5, 1.0);
    p.iran_force_multiplier = clamp(p.iran_force_multiplier, 0.01, 5, 1.0);
    p.escalation_propensity = clamp(p.escalation_propensity, 0, 1, 0.5);
    p.nuclear_threshold_probability = clamp(p.nuclear_threshold_probability, 0, 1, 0.05);
    p.patriot_intercept_rate = clamp(p.patriot_intercept_rate, 0, 1, 0.85);
    p.thaad_intercept_rate = clamp(p.thaad_intercept_rate, 0, 1, 0.90);
    p.iron_dome_intercept_rate = clamp(p.iron_dome_intercept_rate, 0, 1, 0.90);
    p.us_tech_advantage = clamp(p.us_tech_advantage, 0.1, 5, 1.5);
    p.iran_asymmetric_factor = clamp(p.iran_asymmetric_factor, 0.1, 5, 1.3);
    p.iran_ballistic_cep_factor = clamp(p.iran_ballistic_cep_factor, 0.1, 3, 1.0);
    p.oil_price_elasticity = clamp(p.oil_price_elasticity, -0.5, 0, -0.05);
    p.cyber_intensity = clamp(p.cyber_intensity, 0, 1, 0.5);
    p.proxy_effectiveness = clamp(p.proxy_effectiveness, 0, 1, 0.7);
    p.initial_escalation = clamp(p.initial_escalation, 0, 7, 0);
    p.us_sead_effectiveness = clamp(p.us_sead_effectiveness, 0, 1, 0.8);
    p.iran_ad_lethality = clamp(p.iran_ad_lethality, 0, 1, 0.15);
    p.iran_mine_warfare_effectiveness = clamp(p.iran_mine_warfare_effectiveness, 0, 1, 0.6);
    p.us_mcm_effectiveness = clamp(p.us_mcm_effectiveness, 0, 1, 0.4);
    p.hormuz_mining_probability = clamp(p.hormuz_mining_probability, 0, 1, 0.7);
  }

  static defaultParams() {
    return {
      initial_escalation: 0,
      us_force_multiplier: 1.0,
      iran_force_multiplier: 1.0,
      proxy_effectiveness: 0.7,
      cyber_intensity: 0.5,
      escalation_propensity: 0.5,
      iran_asymmetric_factor: 1.3,
      us_tech_advantage: 1.5,
      hormuz_mining_probability: 0.7,
      nuclear_threshold_probability: 0.05,
      oil_price_elasticity: -0.05,
      max_days: 90,
      random_seed: null,
      us_sead_effectiveness: 0.8,
      iran_ad_lethality: 0.15,
      iran_mine_warfare_effectiveness: 0.6,
      us_mcm_effectiveness: 0.4,
      patriot_intercept_rate: 0.85,
      thaad_intercept_rate: 0.90,
      iron_dome_intercept_rate: 0.90,
      iran_ballistic_cep_factor: 1.0,
      scenario_preset: null,
    };
  }
