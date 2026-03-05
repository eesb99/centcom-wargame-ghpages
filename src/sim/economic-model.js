  _process_economics() {
    const eco = this.state.economy;

    const hormuz_disruption_mbd = (100 - eco.hormuz_flow_pct) / 100 * 20;
    const bab_disruption_mbd = (100 - eco.bab_al_mandeb_flow_pct) / 100 * 4.8;
    let total_disruption_mbd = hormuz_disruption_mbd + bab_disruption_mbd;

    const bypass_offset = Math.min(eco.bypass_pipeline_capacity_mbd, hormuz_disruption_mbd * 0.5);
    const opec_response_mbd = Math.min(eco.global_spare_capacity_mbd,
      eco.global_spare_capacity_mbd * Math.min(1.0, this.state.day * 0.15));
    let net_disruption = Math.max(0, total_disruption_mbd - bypass_offset
      - eco.spr_release_mbd - opec_response_mbd);
    let net_disruption_pct = net_disruption / 103;

    // Market confidence dampening
    let iran_force = 0.5;
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      iran_force = (last.iran_force_pct || 50) / 100;
    }

    let market_confidence;
    if (iran_force < 0.1) {
      market_confidence = 0.15;
    } else if (iran_force < 0.3) {
      market_confidence = 0.30;
    } else if (iran_force < 0.5) {
      market_confidence = 0.55;
    } else if (iran_force < 0.7) {
      market_confidence = 0.75;
    } else {
      market_confidence = 1.0;
    }

    // Demand destruction
    const demand_destruction_mbd = eco.oil_price_bbl > 100 ?
      Math.max(0, (eco.oil_price_bbl - 100) / 20 * 0.5) : 0;
    net_disruption = Math.max(0, net_disruption - demand_destruction_mbd);
    net_disruption_pct = net_disruption / 103;

    // Price model — wire user's oil_price_elasticity param (default -0.05 maps to 0.15)
    const effective_elasticity = Math.max(0.01, Math.abs(this.params.oil_price_elasticity) * 3);
    let price_multiplier;
    if (net_disruption_pct > 0) {
      const raw_multiplier = 1 + net_disruption_pct / effective_elasticity;
      const dampened_multiplier = 1 + (raw_multiplier - 1) * market_confidence;
      price_multiplier = Math.min(dampened_multiplier, 2.5);
    } else {
      price_multiplier = 1.0;
    }

    let target_price = 81 * price_multiplier;

    const risk_premium_map = {0: 0, 1: 1, 2: 3, 3: 5, 4: 8, 5: 12, 6: 18, 7: 30};
    target_price += risk_premium_map[this.state.escalation_level] || 0;

    target_price = Math.min(target_price, 125);

    eco.oil_price_bbl += (target_price - eco.oil_price_bbl) * 0.25;
    eco.oil_price_bbl = Math.max(OIL_PRICE_MIN, Math.min(OIL_PRICE_MAX, eco.oil_price_bbl));

    // Insurance/shipping
    eco.war_risk_premium_pct = Math.min(5.0, 1.0 + this.state.escalation_level * 0.5 +
      this.state.ships_damaged.commercial * 0.3);
    eco.shipping_insurance_multiplier = 1 + (eco.war_risk_premium_pct - 1) * 2;

    // SPR release
    if (this.state.day >= 1 && eco.hormuz_flow_pct < 50) {
      eco.spr_release_mbd = Math.min(4.4, eco.spr_release_mbd + 1.0);
    } else if (eco.oil_price_bbl > 90 && eco.spr_release_mbd < 4.4) {
      eco.spr_release_mbd = Math.min(4.4, eco.spr_release_mbd + 0.5);
    } else if (eco.oil_price_bbl > 100 && eco.spr_release_mbd < 4.4) {
      eco.spr_release_mbd = Math.min(4.4, eco.spr_release_mbd + 0.8);
    }

    // Iran revenue
    eco.sanctions_severity = Math.min(1.0, eco.sanctions_severity +
      (this.state.escalation_level >= 1 ? 0.01 : 0));
    eco.iran_oil_revenue_daily_million = 86 * (1 - eco.sanctions_severity * 0.7) *
      (eco.hormuz_flow_pct / 100);

    // GDP impact
    eco.global_gdp_impact_pct = -(net_disruption_pct * 15);
    eco.iran_gdp_impact_pct = -(eco.sanctions_severity * 25 +
      (100 - eco.hormuz_flow_pct) * 0.3);

    // US costs
    const cost_map = {0: 5, 1: 10, 2: 18, 3: 30, 4: 50, 5: 150, 6: 350, 7: 500};
    eco.us_daily_cost_million = cost_map[this.state.escalation_level] || 30;
    eco.us_total_cost_billion += eco.us_daily_cost_million / 1000;
  }

  // ── Main Loop ──
