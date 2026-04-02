  _escalation_decision() {
    const level = this._game_tree_decision();
    // Override with real-world diplomatic data if available
    return this._inject_diplomatic_reality(level);
  }

  // Scenario injection: override procedural diplomatic state with OSINT ground truth
  // For days covered by DIPLOMATIC_EVENTS, the simulation reflects real-world diplomatic
  // conditions. Beyond the last real data point, the model runs procedurally but starts
  // from calibrated parameters (last OSINT day's calibration carries forward).
  _inject_diplomatic_reality(procedural_level) {
    if (typeof DIPLOMATIC_EVENTS === 'undefined') return procedural_level;
    const day_data = DIPLOMATIC_EVENTS.days[this.state.day];

    // Auto-calibrate parameters from OSINT (applies to current day or carries forward)
    this._auto_calibrate_params();

    if (!day_data) return procedural_level; // No real data for this day — use model

    const gt = this.state.game_tree;

    // Override diplomatic momentum with ground truth
    gt.diplomatic_momentum = day_data.diplomatic_momentum;
    gt.mediation_active = day_data.mediation_active;

    // Override Markov state from OSINT ceasefire signals
    if (day_data.ceasefire_signals !== undefined) {
      const cf = day_data.ceasefire_signals;
      // Map OSINT signal to Markov state
      if (cf > 0.5) gt.markov_state = 4;      // CEASEFIRE
      else if (cf > 0.3) gt.markov_state = 3;  // CEASEFIRE_EMERGING
      else if (cf > 0.1) gt.markov_state = 2;  // DE_ESCALATING
      else if (cf > 0.02) gt.markov_state = 1; // CONTESTED
      else gt.markov_state = 0;                 // ACTIVE_WAR
      gt.ceasefire_probability = MARKOV_CF_PROBABILITY[gt.markov_state];
      gt.subsiding_days = 0; // Active combat, no subsiding
      gt.war_subsiding = false;
    }

    // Map real posture to game tree actions for display
    const posture_map = {
      'maximum_force': 'strike', 'sustained_operations': 'hold',
      'partial_withdrawal': 'partial_withdraw', 'ceasefire': 'negotiate'
    };
    const iran_posture_map = {
      'full_retaliation': 'retaliate', 'proxy_escalation': 'escalate_asymmetric',
      'fragmented_command': 'absorb', 'fragmented_resistance': 'absorb',
      'negotiate': 'negotiate'
    };
    gt.us_action = posture_map[day_data.us_posture] || gt.us_action;
    gt.iran_action = iran_posture_map[day_data.iran_posture] || gt.iran_action;
    gt.us_posture_reduced = (day_data.us_posture === 'partial_withdrawal');

    // Inject real events into day log
    if (day_data.events) {
      for (const evt of day_data.events) {
        this.state.day_log.push('Day ' + this.state.day + ': [OSINT] ' + evt);
      }
    }

    // Use escalation override if provided (real-world escalation level)
    if (day_data.escalation_override !== undefined) {
      return day_data.escalation_override;
    }
    return procedural_level;
  }

  // Auto-calibrate simulation parameters from OSINT daily context.
  // OSINT days: apply calibration directly.
  // Projected days: extrapolate trends from OSINT corridor with exponential decay.
  _auto_calibrate_params() {
    if (typeof DIPLOMATIC_EVENTS === 'undefined') return;

    const days = DIPLOMATIC_EVENTS.days;
    const p = this.params;

    // ── OSINT day: apply calibration directly ──
    if (days[this.state.day] && days[this.state.day].param_calibration) {
      const cal = days[this.state.day].param_calibration;
      this._apply_calibration(cal, 'OSINT');
      if (!this._cal_history) this._cal_history = [];
      this._cal_history.push({ day: this.state.day, cal: Object.assign({}, cal) });
      return;
    }

    // ── Projected day: extrapolate trends ──
    if (!this._cal_history || this._cal_history.length < 2) return;

    // Compute trends on first projected day
    if (!this._cal_trends) {
      this._cal_trends = this._compute_param_trends();
      this._projection_start_day = this.state.day;
    }

    const days_projected = this.state.day - this._projection_start_day;
    // Decay: trends lose 8% strength per projected day (half-life ~8 days)
    const decay = Math.pow(TREND_DECAY_RATE, days_projected);

    // Bounds — prevent extrapolation absurdity
    const bounds = {
      escalation_propensity:     { min: 0.10, max: 0.95 },
      iran_force_multiplier:     { min: 0.02, max: 1.0 },
      us_tech_advantage:         { min: 1.0,  max: 2.5 },
      iran_asymmetric_factor:    { min: 0.1,  max: 2.0 },
      proxy_effectiveness:       { min: 0.1,  max: 1.0 },
      cyber_intensity:           { min: 0.05, max: 1.0 },
      hormuz_mining_probability: { min: 0.01, max: 1.0 },
      oil_price_elasticity:      { min: -0.20, max: -0.01 },
      patriot_intercept_rate:    { min: 0.5,  max: 0.98 },
    };

    const last_cal = this._cal_history[this._cal_history.length - 1].cal;
    const changes = [];

    for (const [key, trend] of Object.entries(this._cal_trends)) {
      const base = last_cal[key];
      if (base === undefined || trend === 0) continue;

      const b = bounds[key] || { min: -Infinity, max: Infinity };
      const projected = base + trend * (days_projected + 1) * decay;
      const clamped = Math.max(b.min, Math.min(b.max, projected));
      const rounded = Math.round(clamped * 1000) / 1000;

      if (p[key] !== undefined) {
        const old = p[key];
        p[key] = rounded;
        if (Math.abs(old - rounded) > 0.005) {
          changes.push(key.replace(/_/g, ' ') + ': ' + old.toFixed(3) + ' -> ' + rounded.toFixed(3));
        }
      }
    }

    if (changes.length > 0 && (days_projected < 5 || days_projected % 5 === 0)) {
      this.state.day_log.push(
        'Day ' + this.state.day + ': [Trend Extrapolation] Decay: ' +
        (decay * 100).toFixed(0) + '% | ' + changes.join(' | '));
    }
  }

  // Weighted linear regression over OSINT corridor to get daily trend per parameter.
  // Recent days weighted more (power 1.5) to capture acceleration/deceleration.
  _compute_param_trends() {
    const hist = this._cal_history;
    if (hist.length < 2) return {};

    const trends = {};
    const keys = Object.keys(hist[0].cal);

    for (const key of keys) {
      const points = hist.filter(h => h.cal[key] !== undefined)
                         .map(h => ({ x: h.day, y: h.cal[key] }));
      if (points.length < 2) continue;

      let sum_w = 0, sum_wx = 0, sum_wy = 0, sum_wxx = 0, sum_wxy = 0;
      for (let i = 0; i < points.length; i++) {
        const w = Math.pow(i + 1, 1.5);
        sum_w += w;
        sum_wx += w * points[i].x;
        sum_wy += w * points[i].y;
        sum_wxx += w * points[i].x * points[i].x;
        sum_wxy += w * points[i].x * points[i].y;
      }
      const denom = sum_w * sum_wxx - sum_wx * sum_wx;
      if (Math.abs(denom) < 1e-10) continue;

      const slope = (sum_w * sum_wxy - sum_wx * sum_wy) / denom;
      trends[key] = Math.round(slope * 10000) / 10000;
    }

    return trends;
  }

  // Apply a calibration object to simulation parameters with change logging
  _apply_calibration(cal, source) {
    const p = this.params;
    const changes = [];
    for (const [key, value] of Object.entries(cal)) {
      if (p[key] !== undefined && p[key] !== value) {
        const old = p[key];
        p[key] = value;
        if (Math.abs(old - value) / Math.max(Math.abs(old), 0.01) > 0.05) {
          changes.push(key.replace(/_/g, ' ') + ': ' + old.toFixed(2) + ' -> ' + value.toFixed(2));
        }
      }
    }
    if (changes.length > 0) {
      this.state.day_log.push(
        'Day ' + this.state.day + ': [Auto-Calibration:' + source + '] ' + changes.join(' | '));
    }
  }

  _calc_side_strength(side) {
    const units = side === 'us' ? this.state.us_units : this.state.iran_units;
    const combat_units = units.filter(u => u.unit_type !== 'cyber' && u.unit_type !== 'isr');
    if (combat_units.length === 0) return 0;
    const sum_eff = combat_units.reduce((s, u) => s + u.effective_strength(), 0);
    const sum_max = combat_units.reduce((s, u) => s + u.max_strength, 0);
    return sum_eff / Math.max(sum_max, 1) * 100;
  }

  // ── Phase Processors ──
