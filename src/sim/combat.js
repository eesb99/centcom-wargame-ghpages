  _lanchester_engagement(attacker, defender, terrain_modifier) {
    if (terrain_modifier === undefined) terrain_modifier = 1.0;
    let a_eff = attacker.effective_strength();
    let d_eff = defender.effective_strength();

    if (attacker.side === 'iran' && defender.side === 'us') {
      if (['fast_attack', 'midget_sub', 'coastal_ashm'].indexOf(attacker.sub_type) !== -1) {
        a_eff *= this.params.iran_asymmetric_factor;
      }
    } else if (attacker.side === 'us') {
      a_eff *= this.params.us_tech_advantage;
    }

    a_eff *= terrain_modifier;

    if (a_eff <= 0 || d_eff <= 0) {
      return { attacker_damage: 0, defender_damage: 0, force_ratio: 0 };
    }

    const force_ratio = a_eff / (a_eff + d_eff);
    const noise = rngGauss(0, 0.08);
    const attrition_coeff = ATTRITION_COEFF_BASE + rngUniform(0, ATTRITION_COEFF_NOISE);

    const defender_damage = a_eff * attrition_coeff * (force_ratio + noise);
    const attacker_damage = d_eff * attrition_coeff * ((1 - force_ratio) + noise);

    return {
      attacker_damage: Math.max(0, Math.round(attacker_damage * 100) / 100),
      defender_damage: Math.max(0, Math.round(defender_damage * 100) / 100),
      force_ratio: Math.round(force_ratio * 1000) / 1000,
    };
  }

  // ── Game Tree Decision Model ──
  // Sequential 2-player game: US moves first, Iran responds.
  // Solved via backward induction with quantal response (bounded rationality).

  _decision_state() {
    const us_str = this._calc_side_strength('us');
    const iran_str = this._calc_side_strength('iran');
    const eco = this.state.economy;
    return {
      us_strength: us_str,
      iran_strength: iran_str,
      force_ratio: us_str / Math.max(us_str + iran_str, 1),
      us_casualties: this.state.casualties.us,
      iran_casualties: this.state.casualties.iran,
      civilian_casualties: this.state.casualties.civilian,
      oil_price: eco.oil_price_bbl,
      hormuz_flow: eco.hormuz_flow_pct,
      us_cost_billion: eco.us_total_cost_billion,
      day: this.state.day,
      escalation: this.state.escalation_level,
      prop: this.params.escalation_propensity,
      iran_missiles_remaining: this.state.iran_units
        .filter(u => ['srbm','mrbm','irbm'].indexOf(u.sub_type) !== -1)
        .reduce((s, u) => s + u.missiles_remaining, 0),
      iran_c2_degradation: this.state.cyber.iran_c2_degradation,
      ships_damaged_us: this.state.ships_damaged.us,
      diplomatic_momentum: this.state.game_tree.diplomatic_momentum,
      mediation_active: this.state.game_tree.mediation_active,
      us_posture_reduced: this.state.game_tree.us_posture_reduced,
    };
  }

