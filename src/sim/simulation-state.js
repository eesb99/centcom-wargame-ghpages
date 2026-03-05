const EscalationLevel = {
  DIPLOMATIC_TENSIONS: 0,
  SANCTIONS_TIGHTENING: 1,
  CYBER_OPERATIONS: 2,
  PROXY_ACTIVATION: 3,
  LIMITED_NAVAL: 4,
  AIR_STRIKES: 5,
  FULL_THEATER_WAR: 6,
  NUCLEAR_THRESHOLD: 7,
};

const ESCALATION_LABELS = {
  0: "Diplomatic Tensions",
  1: "Sanctions Tightening",
  2: "Cyber Operations",
  3: "Proxy Activation",
  4: "Limited Naval Engagement",
  5: "Air Strikes on Military Targets",
  6: "Full Theater War",
  7: "Nuclear Threshold",
};

// ── Data Classes (as plain objects/classes) ──
class MilitaryUnit {
  constructor(opts) {
    this.name = opts.name || '';
    this.side = opts.side || '';
    this.unit_type = opts.unit_type || '';
    this.sub_type = opts.sub_type || '';
    this.lat = opts.lat || 0;
    this.lon = opts.lon || 0;
    this.strength = opts.strength || 100;
    this.max_strength = opts.max_strength || 100;
    this.morale = opts.morale !== undefined ? opts.morale : 1.0;
    this.readiness = opts.readiness !== undefined ? opts.readiness : 1.0;
    this.quantity = opts.quantity !== undefined ? opts.quantity : 1;
    this.quantity_max = opts.quantity_max !== undefined ? opts.quantity_max : 1;
    this.missiles_remaining = opts.missiles_remaining || 0;
    this.missiles_max = opts.missiles_max || 0;
    this.range_km = opts.range_km || 0;
    this.kills = opts.kills || 0;
    this.status = opts.status || 'active';
    this.details = opts.details || '';
  }

  effective_strength() {
    return this.strength * this.morale * this.readiness * (this.quantity / Math.max(this.quantity_max, 1));
  }

  take_damage(damage) {
    this.strength = Math.max(0, this.strength - damage);
    this.morale = Math.max(0.1, this.morale - damage * MORALE_DAMAGE_RATE);
    // Platform losses
    if (damage > PLATFORM_LOSS_THRESHOLD) {
      const lost = Math.min(this.quantity, Math.max(1, Math.floor(damage / PLATFORM_LOSS_DIVISOR)));
      this.quantity = Math.max(0, this.quantity - lost);
    }
    if (this.strength <= 0 || this.quantity <= 0) {
      this.status = 'destroyed';
    } else if (this.strength < this.max_strength * 0.3) {
      this.status = 'combat_ineffective';
    } else if (this.strength < this.max_strength * 0.6) {
      this.status = 'degraded';
    }
  }

  fire_missiles(count) {
    const fired = Math.min(count, this.missiles_remaining);
    this.missiles_remaining -= fired;
    if (this.missiles_remaining <= 0 && this.unit_type === 'missile') {
      this.status = 'expended';
    }
    return fired;
  }
}

class EconomicState {
  constructor() {
    this.oil_price_bbl = 81.0;
    this.hormuz_flow_pct = 100.0;
    this.global_gdp_impact_pct = 0.0;
    this.iran_gdp_impact_pct = 0.0;
    this.us_daily_cost_million = 25.0;
    this.us_total_cost_billion = 0.0;
    this.iran_oil_revenue_daily_million = 86.0;
    this.spr_release_mbd = 0.0;
    this.sanctions_severity = 0.6;
    this.war_risk_premium_pct = 1.0;
    this.shipping_insurance_multiplier = 1.0;
    this.bab_al_mandeb_flow_pct = 100.0;
    this.global_spare_capacity_mbd = 3.5;
    this.bypass_pipeline_capacity_mbd = 3.5;
  }
}

class CyberState {
  constructor() {
    this.us_cyber_ops = 0;
    this.iran_cyber_ops = 0;
    this.iran_c2_degradation = 0.0;
    this.us_infra_disruption = 0.0;
    this.nuclear_facility_disruption = 0.0;
    this.iran_iads_degradation = 0.0;
  }
}

class SimulationState {
  constructor() {
    this.day = 0;
    this.escalation_level = 0;
    this.escalation_history = [];
    this.us_units = [];
    this.iran_units = [];
    this.economy = new EconomicState();
    this.cyber = new CyberState();
    this.events = [];
    this.casualties = { us: 0, iran: 0, civilian: 0, proxy: 0 };
    this.missiles_fired = {
      us_tomahawk: 0, us_jassm: 0, us_other: 0,
      iran_ballistic: 0, iran_cruise: 0, iran_ashm: 0, iran_drone: 0,
      proxy_rockets: 0,
    };
    this.aircraft_lost = { us: 0, iran: 0 };
    this.ships_damaged = { us: 0, iran: 0, commercial: 0 };
    this.mines_laid = 0;
    this.mines_cleared = 0;
    this.day_log = [];
    // Game tree decision tracking
    this.game_tree = {
      us_action: 'hold',
      iran_action: 'absorb',
      us_payoff: 0,
      iran_payoff: 0,
      war_subsiding: false,
      subsiding_days: 0,        // consecutive days both prefer non-aggression
      ceasefire_probability: 0, // grows as subsiding_days accumulates
      diplomatic_momentum: 0,   // 0-1, built by sustained mutual non-aggression
      mediation_active: false,  // third-party mediation kicks in after sustained conflict
      mediation_day: 0,         // day mediation began
      us_posture_reduced: false, // US has signaled partial withdrawal
    };
  }
}

