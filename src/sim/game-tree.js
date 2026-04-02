  _compute_payoffs(st, us_action, iran_action) {
    const prop = st.prop; // escalation_propensity: 0=dovish, 1=hawkish
    const diplo = st.diplomatic_momentum; // 0-1, cooperation ratchet

    // ── US Payoff ──
    let us_pay = 0;
    const war_weariness = Math.min(WAR_WEARINESS_CAP, st.day * WAR_WEARINESS_RATE);   // slow burn — 0.175 at day 35
    const target_value = st.iran_strength / 100;             // diminishing returns as Iran weakens
    const us_casualty_cost = Math.min(US_CASUALTY_COST_CAP, st.us_casualties / US_CASUALTY_COST_DIVISOR) * 0.5;
    const economic_cost = Math.min(ECONOMIC_COST_CAP, st.us_cost_billion / ECONOMIC_COST_DIVISOR) * 0.3;
    const mediation_bonus = st.mediation_active ? 0.15 : 0; // third-party pressure to negotiate

    if (us_action === 'strike') {
      us_pay = target_value * (0.8 + prop * 0.8)       // hawks value military destruction more
             + prop * 0.3                                // hawkish bias toward action
             - 0.1 * (1 - prop)                          // doves penalize strikes
             - us_casualty_cost                           // accumulated pain
             - economic_cost                              // accumulated cost
             - war_weariness * 0.4 * (1 - prop * 0.5)   // hawks tolerate war longer
             + (st.escalation < 3 ? 0.15 * prop : 0)    // early escalation pressure
             + (st.ships_damaged_us > 0 ? 0.2 * prop : 0) // retaliation motivation
             - diplo * 0.25;                              // breaking diplomatic progress costs credibility
    } else if (us_action === 'hold') {
      us_pay = 0.05 * (1 - prop)                         // doves prefer caution
             - 0.15 * prop                                // hawks dislike inaction
             - (st.ships_damaged_us > 0 ? 0.15 : 0)     // pressure if taking hits
             + (st.iran_strength < 15 ? 0.2 : 0)        // comfortable holding if Iran nearly gone
             + diplo * 0.08;                              // diplomatic progress rewards restraint
    } else if (us_action === 'partial_withdraw') {
      // Costly signal: reduces force posture, demonstrates commitment to de-escalation
      // Only attractive late-game when war weariness is high and some momentum exists
      const signal_credibility = war_weariness * 0.6 + diplo * 0.35; // needs time + existing momentum
      const vulnerability_cost = 0.35 * prop + 0.15 * target_value;  // hawks strongly resist withdrawal
      const early_penalty = st.day < 10 ? -0.25 : 0;                 // very unattractive early
      us_pay = signal_credibility
             + mediation_bonus * 1.2                      // mediators amplify withdrawal signals
             - vulnerability_cost
             - (st.ships_damaged_us > 0 ? 0.15 : 0)     // risky if still taking fire
             + (st.iran_strength < 15 ? 0.1 : 0)        // safer when Iran nearly gone
             + early_penalty;
    } else { // negotiate
      const termination_value = war_weariness * 0.5
                              + us_casualty_cost * 0.4
                              + economic_cost * 0.6
                              + (st.iran_strength < 25 ? 0.3 : 0)  // negotiate from strength
                              + (st.civilian_casualties > 300 ? 0.2 : 0);
      const reputation_cost = 0.3 * prop * (1 - war_weariness) * (1 - diplo * 0.6); // momentum reduces face-loss
      us_pay = termination_value - reputation_cost
             + diplo * 0.2                                // diplomatic progress makes negotiation easier
             + mediation_bonus;                           // third-party facilitation
    }

    // ── Iran Payoff ──
    let iran_pay = 0;
    // regime_survival: 0 when strong, approaches 1 when decimated
    const regime_survival = Math.max(0, 1.0 - st.iran_strength / 100);
    const deterrence_need = st.escalation >= 5 ? 0.5 : 0.25;
    const missile_reserve = Math.min(1.0, st.iran_missiles_remaining / 1000);
    const c2_intact = 1.0 - st.iran_c2_degradation;
    const iran_resolve = 0.3 + prop * 0.4; // escalatory environment boosts Iran's willingness to fight

    if (iran_action === 'retaliate') {
      iran_pay = deterrence_need * 1.2                  // must signal resolve
              + missile_reserve * 0.4 * c2_intact       // capability-dependent
              + iran_resolve * 0.3                       // fight harder in escalatory context
              - regime_survival * 0.6                    // less willing if nearly destroyed
              - (st.iran_strength < 10 ? 0.8 : 0)      // suicidal threshold
              + (st.iran_strength > 50 ? 0.2 : 0)      // still strong = fight
              - diplo * 0.2;                             // breaking momentum has cost
    } else if (iran_action === 'absorb') {
      iran_pay = -0.05                                   // small morale cost
              + (st.iran_strength < 25 ? 0.1 : 0)      // preserve remaining forces
              + regime_survival * 0.15                   // survival instinct
              + diplo * 0.05;                            // slightly better with momentum
    } else if (iran_action === 'escalate_asymmetric') {
      iran_pay = deterrence_need * 0.8                   // partial deterrence
              + iran_resolve * 0.25                       // boosted by conflict intensity
              - 0.1                                       // proxy/terror operational cost
              + (st.hormuz_flow < 50 ? 0.25 : 0)        // leverage from Hormuz disruption
              + missile_reserve * 0.15                    // drones/proxies need coordination
              - regime_survival * 0.2                    // less risky than direct
              - diplo * 0.15;                            // undermines diplomatic progress
    } else { // negotiate
      iran_pay = regime_survival * 0.7                   // survival paramount when weak
              + (st.iran_strength < 15 ? 0.6 : 0)       // existential threshold
              + (st.iran_casualties > 8000 ? 0.4 : 0)   // catastrophic losses
              - (1 - regime_survival) * 0.4 * (1 - diplo * 0.5) // face-loss reduced by momentum
              - iran_resolve * 0.2 * (1 - diplo * 0.4)  // hawks soften with diplomatic progress
              + diplo * 0.25                              // cooperation ratchet rewards
              + mediation_bonus                           // third-party facilitation
              + (st.us_posture_reduced ? 0.25 : 0);      // US withdrawal signal boosts Iran negotiate
    }

    // Cross-effects
    if (us_action === 'strike' && iran_action === 'retaliate') {
      us_pay -= 0.08;    // spiral risk
      iran_pay -= 0.12;  // retaliation is costlier for weaker side
    }
    if (us_action === 'negotiate' && iran_action === 'negotiate') {
      us_pay += 0.12 + diplo * 0.15;   // coordination bonus scales with momentum
      iran_pay += 0.12 + diplo * 0.15;
    }
    if (us_action === 'partial_withdraw' && iran_action === 'negotiate') {
      us_pay += 0.15;    // costly signal reciprocated — strong peace signal
      iran_pay += 0.2;   // Iran saves face by responding to de-escalation, not "surrendering"
    }
    if (us_action === 'partial_withdraw' && iran_action === 'retaliate') {
      us_pay -= 0.2;     // withdrawal exploited — painful
      iran_pay += 0.15;  // Iran gains from attacking retreating force
    }
    if (us_action === 'strike' && iran_action === 'negotiate') {
      us_pay += 0.05;    // US benefits from Iran capitulating
      iran_pay -= 0.1;   // Iran pays for surrender under fire
    }

    return { us: us_pay, iran: iran_pay };
  }

  _game_tree_decision() {
    const st = this._decision_state();
    const US_ACTIONS = ['strike', 'hold', 'partial_withdraw', 'negotiate'];
    const IRAN_ACTIONS = ['retaliate', 'absorb', 'escalate_asymmetric', 'negotiate'];

    // Backward induction: for each US action, find Iran's best response
    // Then US picks the action maximizing its payoff given Iran's response
    // Quantal response: softmax selection with temperature (bounded rationality)
    const temperature = 0.12 + rngUniform(0, 0.06); // noise in decision-making

    function softmaxSelect(actions, payoffs, temp) {
      const maxPay = Math.max(...payoffs);
      const expWeights = payoffs.map(p => Math.exp((p - maxPay) / Math.max(temp, 0.01)));
      const sumExp = expWeights.reduce((s, w) => s + w, 0);
      const probs = expWeights.map(w => w / sumExp);
      const roll = rngRandom();
      let cumulative = 0;
      for (let i = 0; i < actions.length; i++) {
        cumulative += probs[i];
        if (roll < cumulative) return { action: actions[i], payoff: payoffs[i] };
      }
      return { action: actions[actions.length - 1], payoff: payoffs[payoffs.length - 1] };
    }

    // For each US action, compute Iran's best response distribution
    let us_eval = [];
    let iran_responses = {};

    for (const us_act of US_ACTIONS) {
      const iran_payoffs = IRAN_ACTIONS.map(ia => this._compute_payoffs(st, us_act, ia).iran);
      const iran_pick = softmaxSelect(IRAN_ACTIONS, iran_payoffs, temperature);
      iran_responses[us_act] = iran_pick;

      // US evaluates its payoff given Iran's likely response
      const us_payoff = this._compute_payoffs(st, us_act, iran_pick.action).us;
      us_eval.push(us_payoff);
    }

    const us_pick = softmaxSelect(US_ACTIONS, us_eval, temperature);
    const iran_final = iran_responses[us_pick.action];

    // Track state
    const gt = this.state.game_tree;
    gt.us_action = us_pick.action;
    gt.iran_action = iran_final.action;
    gt.us_payoff = Math.round(us_pick.payoff * 100) / 100;
    gt.iran_payoff = Math.round(iran_final.payoff * 100) / 100;

    // Track US posture reduction
    if (us_pick.action === 'partial_withdraw') {
      gt.us_posture_reduced = true;
    } else if (us_pick.action === 'strike') {
      gt.us_posture_reduced = false; // striking cancels withdrawal signal
    }

    // Track war subsiding (non-aggressive = neither side attacking)
    const non_aggressive = (us_pick.action !== 'strike') &&
                           (iran_final.action !== 'retaliate' && iran_final.action !== 'escalate_asymmetric');
    if (non_aggressive) {
      gt.subsiding_days += 1;
    } else {
      gt.subsiding_days = Math.max(0, gt.subsiding_days - 3); // aggression strongly resets progress
    }
    gt.war_subsiding = gt.subsiding_days >= 5;

    // Diplomatic momentum — cooperation ratchet
    // Builds when both sides choose non-aggressive actions; decays on aggression
    const both_peaceful = non_aggressive;
    const mutual_negotiate = (us_pick.action === 'negotiate' || us_pick.action === 'partial_withdraw') &&
                             (iran_final.action === 'negotiate' || iran_final.action === 'absorb');
    if (mutual_negotiate) {
      gt.diplomatic_momentum = Math.min(1.0, gt.diplomatic_momentum + 0.05); // moderate build
    } else if (both_peaceful) {
      gt.diplomatic_momentum = Math.min(1.0, gt.diplomatic_momentum + 0.02); // slow build
    } else {
      // Aggression decays momentum, but doesn't fully reset (sunk cost of negotiations)
      gt.diplomatic_momentum = Math.max(0, gt.diplomatic_momentum - 0.15);
    }

    // Third-party mediation activation
    // Activates after 10+ days at escalation >= 3 (international pressure builds)
    // Or after 5+ days if diplomatic momentum > 0.2 (back-channels invite mediation)
    if (!gt.mediation_active) {
      const high_escalation_days = st.day >= 10 && st.escalation >= 3;
      const momentum_invites = st.day >= 5 && gt.diplomatic_momentum > 0.2;
      if (high_escalation_days || momentum_invites) {
        gt.mediation_active = true;
        gt.mediation_day = st.day;
        this.state.day_log.push(
          'Day ' + st.day + ': [Diplomacy] Third-party mediation activated (Gulf states/UN back-channel)');
      }
    }
    // Mediation deactivates if both sides choose mutual aggression for 3+ consecutive days
    if (gt.mediation_active && !non_aggressive && gt.subsiding_days <= 0) {
      if (rngRandom() < 0.25) { // 25% chance mediation collapses per aggressive day at zero momentum
        gt.mediation_active = false;
        this.state.day_log.push(
          'Day ' + st.day + ': [Diplomacy] Mediation collapsed — sustained hostilities');
      }
    }

    // Observed Markov Model ceasefire probability
    // Classify current state, apply feature-conditioned transition, read off CF probability
    gt.markov_state = this._markov_transition(gt, st);
    gt.ceasefire_probability = MARKOV_CF_PROBABILITY[gt.markov_state];

    // Map game tree outcome to escalation level change
    return this._map_actions_to_escalation(st, us_pick.action, iran_final.action);
  }

  _map_actions_to_escalation(st, us_action, iran_action) {
    const current = st.escalation;
    if (current >= EscalationLevel.NUCLEAR_THRESHOLD) return current;

    // Nuclear threshold check (preserved from original model)
    if (current >= EscalationLevel.FULL_THEATER_WAR) {
      const cumulative_prob = this.params.nuclear_threshold_probability;
      const expected_days = Math.max(10, Math.floor((this.params.max_days || 30) / 2));
      let daily_nuke_rate = 0;
      if (cumulative_prob > 0 && cumulative_prob < 1) {
        daily_nuke_rate = 1 - Math.pow(1 - cumulative_prob, 1 / expected_days);
      }
      const c2_modifier = Math.max(0.4, 1.0 - st.iran_c2_degradation * 0.5);
      if (st.iran_strength < 15 && rngRandom() < daily_nuke_rate * c2_modifier) {
        return EscalationLevel.NUCLEAR_THRESHOLD;
      }
    }

    // Escalation mapping
    if (us_action === 'strike' && iran_action === 'retaliate') {
      // Mutual aggression: strong escalation
      if (current < EscalationLevel.FULL_THEATER_WAR && rngRandom() < 0.6 * st.prop) {
        return Math.min(current + 2, EscalationLevel.FULL_THEATER_WAR);
      }
      return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
    }
    if (us_action === 'strike' && iran_action === 'escalate_asymmetric') {
      // US strikes, Iran goes asymmetric: moderate escalation
      if (rngRandom() < 0.4 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }
    if (us_action === 'strike' && (iran_action === 'absorb' || iran_action === 'negotiate')) {
      // US strikes, Iran absorbs: slight escalation or hold
      if (rngRandom() < 0.25 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }
    if (us_action === 'negotiate' && iran_action === 'negotiate') {
      // Mutual negotiation: de-escalation (stronger with diplomatic momentum)
      const deesc_chance = 0.5 + st.diplomatic_momentum * 0.25;
      if (rngRandom() < deesc_chance) {
        return Math.max(current - 1, 0);
      }
      return current;
    }
    if (us_action === 'partial_withdraw' && iran_action === 'negotiate') {
      // Strong de-escalation signal — withdrawal + negotiation
      if (rngRandom() < 0.7) {
        return Math.max(current - 1, 0);
      }
      return current;
    }
    if (us_action === 'partial_withdraw' && iran_action === 'absorb') {
      // Withdrawal met with restraint — moderate de-escalation
      if (rngRandom() < 0.4) return Math.max(current - 1, 0);
      return current;
    }
    if (us_action === 'partial_withdraw' && iran_action === 'retaliate') {
      // Withdrawal exploited — re-escalation likely
      if (rngRandom() < 0.4 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }
    if (us_action === 'partial_withdraw' && iran_action === 'escalate_asymmetric') {
      // Withdrawal met with asymmetric — slight escalation possible
      if (rngRandom() < 0.3 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }
    if (us_action === 'hold' && iran_action === 'negotiate') {
      // Iran wants out, US holds: slow de-escalation
      if (rngRandom() < 0.3) return Math.max(current - 1, 0);
      return current;
    }
    if (us_action === 'negotiate' && iran_action === 'retaliate') {
      // US extends olive branch, Iran attacks: re-escalation
      if (rngRandom() < 0.5 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }
    if (iran_action === 'escalate_asymmetric') {
      // Iran proxy escalation while US holds/negotiates
      if (rngRandom() < 0.3 * st.prop) {
        return Math.min(current + 1, EscalationLevel.FULL_THEATER_WAR);
      }
      return current;
    }

    // Default: hold current level
    return current;
  }

  // ── Observed Markov Model for ceasefire ──

  // Feature-conditioned Markov transition
  _markov_transition(gt, st) {
    const current = gt.markov_state;
    const row = MARKOV_BASE_TRANSITIONS[current].slice(); // copy base probabilities

    // Feature adjustments: shift probability mass toward de-escalation/ceasefire
    // when features indicate military collapse or diplomatic progress
    const ifm = this.params.iran_force_multiplier || 0.3;
    const dm = gt.diplomatic_momentum;
    const subsiding = gt.subsiding_days;

    // Military collapse (iran_force_multiplier < 0.15): shift toward higher states
    if (ifm < 0.15) {
      const collapse_shift = (0.15 - ifm) * 2; // 0 to 0.3
      row[0] *= (1 - collapse_shift);
      row[1] *= (1 - collapse_shift * 0.5);
      row[3] += collapse_shift * 0.15;
      row[4] += collapse_shift * 0.10;
    }

    // Diplomatic momentum: shift toward ceasefire states
    if (dm > 0.2) {
      const diplo_shift = (dm - 0.2) * 0.5; // 0 to 0.4
      row[0] *= (1 - diplo_shift);
      row[3] += diplo_shift * 0.15;
      row[4] += diplo_shift * 0.10;
    }

    // Subsiding days: sustained peace accelerates transition
    if (subsiding >= 3) {
      const peace_shift = Math.min(0.3, (subsiding - 3) * 0.03);
      row[0] *= (1 - peace_shift);
      row[1] *= (1 - peace_shift * 0.5);
      row[3] += peace_shift * 0.4;
      row[4] += peace_shift * 0.3;
    }

    // Normalize
    const total = row.reduce((s, v) => s + v, 0);
    const probs = row.map(v => v / total);

    // Stochastic transition (uses sim PRNG for reproducibility)
    const roll = rngRandom();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (roll < cumulative) return i;
    }
    return probs.length - 1;
  }

  // Entry point (called from step())
