  step() {
    this.state.day += 1;
    this.state.day_log = [];

    if (this.params.random_seed !== null && this.params.random_seed !== undefined) {
      setRngSeed(this.params.random_seed + this.state.day);
    }

    // Escalation (game tree decision model + OSINT injection)
    const new_level = this._escalation_decision();
    const gt = this.state.game_tree;
    const osint_active = typeof DIPLOMATIC_EVENTS !== 'undefined' && DIPLOMATIC_EVENTS.days[this.state.day];
    const tag = osint_active ? '[OSINT Override]' : '[Game Tree]';
    this.state.day_log.push(
      `Day ${this.state.day}: ${tag} US: ${gt.us_action.toUpperCase()} (${gt.us_payoff > 0 ? '+' : ''}${gt.us_payoff}) → Iran: ${gt.iran_action.toUpperCase()} (${gt.iran_payoff > 0 ? '+' : ''}${gt.iran_payoff})`);
    if (gt.war_subsiding) {
      this.state.day_log.push(
        `Day ${this.state.day}: War subsiding — ${gt.subsiding_days} consecutive peaceful days, ceasefire probability: ${(gt.ceasefire_probability * 100).toFixed(0)}%`);
    }
    if (gt.diplomatic_momentum > 0.3) {
      this.state.day_log.push(
        `Day ${this.state.day}: [Diplomacy] Diplomatic momentum: ${(gt.diplomatic_momentum * 100).toFixed(0)}%${gt.mediation_active ? ' (mediation active)' : ''}${gt.us_posture_reduced ? ' (US posture reduced)' : ''}`);
    }
    if (new_level !== this.state.escalation_level) {
      const old_label = ESCALATION_LABELS[this.state.escalation_level];
      const new_label = ESCALATION_LABELS[new_level];
      const direction = new_level > this.state.escalation_level ? 'ESCALATION' : 'DE-ESCALATION';
      this.state.day_log.push(
        `Day ${this.state.day}: ${direction} — ${old_label} → ${new_label}`);
      this.state.escalation_level = new_level;
      this.state.escalation_history.push({
        day: this.state.day, level: new_level, label: new_label
      });
    }

    // Execute phases
    this._process_cyber();
    this._process_proxy_warfare();
    this._process_mine_warfare();
    this._process_naval_warfare();
    this._process_air_campaign();
    this._process_economics();

    const snapshot = this._snapshot();
    this.history.push(snapshot);
    return snapshot;
  }

  run(days) {
    days = days || this.params.max_days;
    for (let i = 0; i < days; i++) {
      this.step();
      if (this.state.escalation_level >= EscalationLevel.NUCLEAR_THRESHOLD) {
        this.state.day_log.push(
          `Day ${this.state.day}: NUCLEAR THRESHOLD REACHED — Simulation ends`);
        break;
      }
    }
    return this.history;
  }

  _snapshot() {
    const us_str = this._calc_side_strength('us');
    const iran_str = this._calc_side_strength('iran');

    const us_missiles = {
      tomahawk: this.state.us_units
        .filter(u => u.name.indexOf('Tomahawk') !== -1)
        .reduce((s, u) => s + u.missiles_remaining, 0),
      jassm: this.state.us_units
        .filter(u => u.name.indexOf('JASSM') !== -1)
        .reduce((s, u) => s + u.missiles_remaining, 0),
      interceptors: this.state.us_units
        .filter(u => u.sub_type === 'missile_defense')
        .reduce((s, u) => s + u.missiles_remaining, 0),
    };
    const iran_missiles = {
      ballistic: this.state.iran_units
        .filter(u => ['srbm', 'mrbm', 'irbm'].indexOf(u.sub_type) !== -1)
        .reduce((s, u) => s + u.missiles_remaining, 0),
      cruise: this.state.iran_units
        .filter(u => u.sub_type === 'cruise_missile')
        .reduce((s, u) => s + u.missiles_remaining, 0),
      ashm: this.state.iran_units
        .filter(u => u.sub_type === 'coastal_ashm')
        .reduce((s, u) => s + u.missiles_remaining, 0),
      drones: this.state.iran_units
        .filter(u => u.sub_type === 'one_way_attack')
        .reduce((s, u) => s + u.missiles_remaining, 0),
      mines: this.state.iran_units
        .filter(u => u.sub_type === 'mine_warfare')
        .reduce((s, u) => s + u.missiles_remaining, 0),
    };

    return {
      day: this.state.day,
      escalation_level: this.state.escalation_level,
      escalation_label: ESCALATION_LABELS[this.state.escalation_level],
      us_force_pct: Math.round(us_str * 10) / 10,
      iran_force_pct: Math.round(iran_str * 10) / 10,
      casualties: Object.assign({}, this.state.casualties),
      missiles_fired: Object.assign({}, this.state.missiles_fired),
      aircraft_lost: Object.assign({}, this.state.aircraft_lost),
      ships_damaged: Object.assign({}, this.state.ships_damaged),
      mines: { laid: this.state.mines_laid, cleared: this.state.mines_cleared },
      oil_price: Math.round(this.state.economy.oil_price_bbl * 100) / 100,
      hormuz_flow_pct: Math.round(this.state.economy.hormuz_flow_pct * 10) / 10,
      bab_al_mandeb_flow_pct: Math.round(this.state.economy.bab_al_mandeb_flow_pct * 10) / 10,
      global_gdp_impact: Math.round(this.state.economy.global_gdp_impact_pct * 100) / 100,
      iran_gdp_impact: Math.round(this.state.economy.iran_gdp_impact_pct * 100) / 100,
      us_cost_billion: Math.round(this.state.economy.us_total_cost_billion * 100) / 100,
      us_daily_cost_million: Math.round(this.state.economy.us_daily_cost_million * 10) / 10,
      spr_release_mbd: Math.round(this.state.economy.spr_release_mbd * 100) / 100,
      war_risk_premium_pct: Math.round(this.state.economy.war_risk_premium_pct * 100) / 100,
      cyber_iran_c2_degradation: Math.round(this.state.cyber.iran_c2_degradation * 1000) / 1000,
      cyber_iran_iads_degradation: Math.round(this.state.cyber.iran_iads_degradation * 1000) / 1000,
      cyber_us_infra_disruption: Math.round(this.state.cyber.us_infra_disruption * 1000) / 1000,
      us_missile_inventory: us_missiles,
      iran_missile_inventory: iran_missiles,
      game_tree: {
        us_action: this.state.game_tree.us_action,
        iran_action: this.state.game_tree.iran_action,
        us_payoff: this.state.game_tree.us_payoff,
        iran_payoff: this.state.game_tree.iran_payoff,
        war_subsiding: this.state.game_tree.war_subsiding,
        subsiding_days: this.state.game_tree.subsiding_days,
        ceasefire_probability: Math.round(this.state.game_tree.ceasefire_probability * 1000) / 1000,
        markov_state: this.state.game_tree.markov_state,
        markov_label: MARKOV_STATES[this.state.game_tree.markov_state] || 'UNKNOWN',
        diplomatic_momentum: Math.round(this.state.game_tree.diplomatic_momentum * 1000) / 1000,
        mediation_active: this.state.game_tree.mediation_active,
        us_posture_reduced: this.state.game_tree.us_posture_reduced,
        osint_driven: !!(typeof DIPLOMATIC_EVENTS !== 'undefined' && DIPLOMATIC_EVENTS.days[this.state.day]),
      },
      events: this.state.day_log.slice(),
      units: {
        us: this.state.us_units.map(u => ({
          name: u.name, type: u.unit_type, sub_type: u.sub_type,
          lat: u.lat, lon: u.lon,
          strength: Math.round(u.strength * 10) / 10, status: u.status,
          morale: Math.round(u.morale * 100) / 100,
          quantity: u.quantity, quantity_max: u.quantity_max,
          missiles_remaining: u.missiles_remaining,
          details: u.details,
        })),
        iran: this.state.iran_units.map(u => ({
          name: u.name, type: u.unit_type, sub_type: u.sub_type,
          lat: u.lat, lon: u.lon,
          strength: Math.round(u.strength * 10) / 10, status: u.status,
          morale: Math.round(u.morale * 100) / 100,
          quantity: u.quantity, quantity_max: u.quantity_max,
          missiles_remaining: u.missiles_remaining,
          details: u.details,
        })),
      },
    };
  }

  monteCarlo(runs, days) {
    runs = runs || 100;
    days = days || 90;

    const results = {
      escalation_peaks: [], final_oil_prices: [],
      us_casualties: [], iran_casualties: [],
      civilian_casualties: [], us_cost_billions: [],
      nuclear_events: 0, avg_duration_days: [],
      iran_bm_remaining: [], us_ships_damaged: [],
      mines_laid: [],
    };

    for (let i = 0; i < runs; i++) {
      const params = deepCopy(this.params);
      params.random_seed = i * 1000;
      params.escalation_propensity = Math.max(0, Math.min(1,
        this.params.escalation_propensity + rngGauss(0, 0.1)));
      params.iran_asymmetric_factor = Math.max(1.0,
        this.params.iran_asymmetric_factor + rngGauss(0, 0.12));

      const sim = new WarGameSimulation(params);
      const history = sim.run(days);
      if (history.length > 0) {
        const final = history[history.length - 1];
        results.escalation_peaks.push(Math.max(...history.map(h => h.escalation_level)));
        results.final_oil_prices.push(final.oil_price);
        results.us_casualties.push(final.casualties.us);
        results.iran_casualties.push(final.casualties.iran);
        results.civilian_casualties.push(final.casualties.civilian);
        results.us_cost_billions.push(final.us_cost_billion);
        results.avg_duration_days.push(final.day);
        results.iran_bm_remaining.push(final.iran_missile_inventory.ballistic);
        results.us_ships_damaged.push(final.ships_damaged.us);
        results.mines_laid.push(final.mines.laid);
        if (final.escalation_level >= EscalationLevel.NUCLEAR_THRESHOLD) {
          results.nuclear_events += 1;
        }
      }
    }

    function stats(arr) {
      if (!arr || arr.length === 0) return { mean: 0, median: 0, p5: 0, p95: 0, min: 0, max: 0 };
      const sorted = arr.slice().sort((a, b) => a - b);
      const n = sorted.length;
      return {
        mean: Math.round(arr.reduce((s, v) => s + v, 0) / n * 100) / 100,
        median: Math.round(sorted[Math.floor(n / 2)] * 100) / 100,
        p5: Math.round(sorted[Math.max(0, Math.floor(n * 0.05))] * 100) / 100,
        p95: Math.round(sorted[Math.min(n - 1, Math.floor(n * 0.95))] * 100) / 100,
        min: Math.round(Math.min(...arr) * 100) / 100,
        max: Math.round(Math.max(...arr) * 100) / 100,
      };
    }

    const escalation_distribution = {};
    for (let i = 0; i < 8; i++) {
      escalation_distribution[ESCALATION_LABELS[i]] =
        results.escalation_peaks.filter(v => v === i).length;
    }

    return {
      runs: runs,
      escalation_peaks: stats(results.escalation_peaks),
      oil_price_outcomes: stats(results.final_oil_prices),
      us_casualties: stats(results.us_casualties),
      iran_casualties: stats(results.iran_casualties),
      civilian_casualties: stats(results.civilian_casualties),
      us_cost_billions: stats(results.us_cost_billions),
      nuclear_probability: Math.round(results.nuclear_events / Math.max(runs, 1) * 10000) / 10000,
      avg_duration: stats(results.avg_duration_days),
      iran_bm_remaining: stats(results.iran_bm_remaining),
      us_ships_damaged: stats(results.us_ships_damaged),
      mines_laid: stats(results.mines_laid),
      escalation_distribution: escalation_distribution,
    };
  }
}

// Attach SCENARIO_PRESETS as static property
