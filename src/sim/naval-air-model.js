  _process_mine_warfare() {
    if (this.state.escalation_level < EscalationLevel.LIMITED_NAVAL) return;

    const mine_unit = this.state.iran_units.find(u =>
      u.sub_type === 'mine_warfare' && u.status === 'active');
    if (!mine_unit) return;

    const eff = this.params.iran_mine_warfare_effectiveness;
    if (mine_unit.missiles_remaining > 0 && rngRandom() < 0.3) {
      const laid = mine_unit.fire_missiles(rngRandInt(20, 80));
      this.state.mines_laid += laid;
      const flow_impact = laid * 0.15 * eff;
      this.state.economy.hormuz_flow_pct = Math.max(5,
        this.state.economy.hormuz_flow_pct - flow_impact);
      this.state.day_log.push(
        `Day ${this.state.day}: IRGC lays ${laid} mines in Strait of Hormuz — ` +
        `flow at ${this.state.economy.hormuz_flow_pct.toFixed(0)}%`);
    }

    // US MCM operations
    if (this.state.mines_laid > this.state.mines_cleared) {
      const cleared = Math.floor(rngRandInt(5, 15) * (this.params.us_mcm_effectiveness / 0.4));
      this.state.mines_cleared += cleared;
    }

    // Mine damage to shipping
    if (this.state.mines_laid - this.state.mines_cleared > 50) {
      if (rngRandom() < 0.15) {
        this.state.ships_damaged.commercial += 1;
        this.state.day_log.push(
          `Day ${this.state.day}: Commercial tanker strikes mine in Strait of Hormuz`);
      }
    }
  }

  _process_naval_warfare() {
    if (this.state.escalation_level < EscalationLevel.LIMITED_NAVAL) return;

    const fac = this.state.iran_units.find(u =>
      u.sub_type === 'fast_attack' && u.status === 'active');
    const us_naval = this.state.us_units.filter(u =>
      u.unit_type === 'naval' && u.status === 'active');

    if (fac && us_naval.length > 0 && rngRandom() < 0.35) {
      const target = rngChoice(us_naval);
      const swarm_size = rngRandInt(10, 40);
      const result = this._lanchester_engagement(fac, target,
        this.params.iran_asymmetric_factor);
      fac.take_damage(result.attacker_damage);
      target.take_damage(result.defender_damage);

      const fac_lost = Math.max(0, Math.floor(result.attacker_damage / 3));
      fac.quantity = Math.max(0, fac.quantity - fac_lost);
      this.state.ships_damaged.iran += fac_lost;

      const fac_crew_cas = fac_lost * rngRandInt(3, 8);
      this.state.casualties.iran += fac_crew_cas;

      if (result.defender_damage > 5) {
        const us_ship_cas = rngRandInt(5, 30);
        this.state.ships_damaged.us += 1;
        this.state.casualties.us += us_ship_cas;
        this.state.day_log.push(
          `Day ${this.state.day}: IRGC fast boat swarm (${swarm_size} craft) attacks ${target.name}` +
          ` — US ship damaged (${us_ship_cas} cas), ${fac_lost} IRGC boats sunk (${fac_crew_cas} KIA)`);
      } else {
        this.state.day_log.push(
          `Day ${this.state.day}: IRGC swarm repelled, ${fac_lost} boats sunk (${fac_crew_cas} KIA)`);
      }
    }

    // Submarine attacks
    const subs = this.state.iran_units.filter(u =>
      (u.sub_type === 'ssk' || u.sub_type === 'midget_sub') && u.status === 'active');
    for (const sub of subs) {
      if (rngRandom() < 0.1) {
        const target = us_naval.length > 0 ? rngChoice(us_naval) : null;
        if (target) {
          const result = this._lanchester_engagement(sub, target);
          sub.take_damage(result.attacker_damage);
          target.take_damage(result.defender_damage * 0.5);
          if (result.defender_damage > 3) {
            this.state.casualties.us += rngRandInt(3, 15);
            this.state.day_log.push(
              `Day ${this.state.day}: ${sub.name} torpedo attack on ${target.name}`);
          }
          if (result.attacker_damage > 5) {
            const sub_crew = rngRandInt(15, 35);
            this.state.casualties.iran += sub_crew;
            this.state.day_log.push(
              `Day ${this.state.day}: ${sub.name} destroyed by ASW — ${sub_crew} KIA`);
          }
        }
      }
    }

    // Coastal AShM salvos
    const coastal_batteries = this.state.iran_units.filter(u =>
      u.sub_type === 'coastal_ashm' && u.status === 'active');
    for (const battery of coastal_batteries) {
      if (us_naval.length > 0 && rngRandom() < 0.25) {
        const salvo = battery.fire_missiles(rngRandInt(2, 6));
        this.state.missiles_fired.iran_ashm += salvo;
        const target = rngChoice(us_naval);
        const intercept_rate = 0.85;
        const leakers = Math.max(0, salvo - Math.floor(salvo * intercept_rate));
        const counter_cas = rngRandInt(5, 20);
        this.state.casualties.iran += counter_cas;
        battery.take_damage(rngUniform(10, 30));

        if (leakers > 0) {
          target.take_damage(leakers * 5);
          this.state.ships_damaged.us += 1;
          this.state.casualties.us += rngRandInt(2, 15);
          this.state.day_log.push(
            `Day ${this.state.day}: Coastal AShM salvo (${salvo} missiles) at ${target.name}` +
            ` — ${leakers} penetrate CIWS/SM-2, counter-fire kills ${counter_cas}`);
        } else {
          this.state.day_log.push(
            `Day ${this.state.day}: Coastal AShM salvo (${salvo}) at ${target.name}` +
            ` — all intercepted, counter-fire kills ${counter_cas}`);
        }
      }
    }
  }

  _process_air_campaign() {
    if (this.state.escalation_level < EscalationLevel.AIR_STRIKES) return;

    const us_air = this.state.us_units.filter(u =>
      u.unit_type === 'air' && u.status === 'active');
    const iran_ad = this.state.iran_units.filter(u =>
      u.unit_type === 'air_defense' && u.status === 'active');
    const iran_missiles = this.state.iran_units.filter(u =>
      u.unit_type === 'missile' && u.status === 'active');
    const iran_air = this.state.iran_units.filter(u =>
      u.unit_type === 'air' && u.sub_type === 'fighter' && u.status === 'active');

    const iads_degrade = this.state.cyber.iran_iads_degradation;
    const esc = this.state.escalation_level;

    let num_packages;
    if (esc >= EscalationLevel.FULL_THEATER_WAR) {
      num_packages = rngRandInt(6, 10);
    } else if (esc >= EscalationLevel.AIR_STRIKES) {
      num_packages = rngRandInt(2, 4);
    } else {
      num_packages = 1;
    }

    let us_ac_lost_today = 0;
    let iran_cas_today = 0;

    for (let pkg = 0; pkg < num_packages; pkg++) {
      // SEAD/DEAD component
      if (iran_ad.length > 0) {
        const ad = rngChoice(iran_ad);
        const attacker = us_air.length > 0 ? rngChoice(us_air) : null;
        if (attacker) {
          const sead_eff = this.params.us_sead_effectiveness * (1 + iads_degrade * 0.5);
          const result = this._lanchester_engagement(attacker, ad, sead_eff);
          attacker.take_damage(result.attacker_damage * this.params.iran_ad_lethality * 0.3);
          ad.take_damage(result.defender_damage);

          const tlam_fired = rngRandInt(4, 12);
          this.state.missiles_fired.us_tomahawk += tlam_fired;

          const ad_cas = rngRandInt(10, 50);
          this.state.casualties.iran += ad_cas;
          iran_cas_today += ad_cas;

          if (result.attacker_damage > 8) {
            this.state.aircraft_lost.us += 1;
            us_ac_lost_today += 1;
          }
        }
      }

      // Strike component
      const strike_roll = rngRandom();

      if (strike_roll < 0.4 && iran_missiles.length > 0) {
        const tgt = rngChoice(iran_missiles);
        if (tgt.missiles_remaining > 0) {
          const jassm = rngRandInt(8, 24);
          this.state.missiles_fired.us_jassm += jassm;
          const destroyed = Math.floor(tgt.missiles_remaining * rngUniform(0.03, 0.10));
          tgt.missiles_remaining = Math.max(0, tgt.missiles_remaining - destroyed);
          tgt.take_damage(jassm * 0.4);
          const cas = rngRandInt(10, 40) + destroyed * rngRandInt(1, 3);
          this.state.casualties.iran += cas;
          iran_cas_today += cas;
          if (destroyed > 3) {
            this.state.day_log.push(
              `Day ${this.state.day}: US strike package destroys ${destroyed} ${tgt.name} missiles — ${cas} KIA`);
          }
        }

      } else if (strike_roll < 0.6) {
        const tlam = rngRandInt(6, 20);
        this.state.missiles_fired.us_tomahawk += tlam;
        const infra_cas = rngRandInt(20, 80);
        this.state.casualties.iran += infra_cas;
        iran_cas_today += infra_cas;
        const all_iran = this.state.iran_units.filter(u =>
          u.status === 'active' && u.unit_type !== 'proxy');
        if (all_iran.length > 0) {
          const tgt = rngChoice(all_iran);
          tgt.take_damage(rngUniform(5, 15));
        }
        this.state.day_log.push(
          `Day ${this.state.day}: US TLAM strike on military infrastructure — ${infra_cas} KIA`);

      } else if (strike_roll < 0.75 && iran_air.length > 0) {
        const tgt = rngChoice(iran_air);
        const jassm = rngRandInt(4, 12);
        this.state.missiles_fired.us_jassm += jassm;
        const ac_destroyed = rngRandInt(1, 4);
        tgt.quantity = Math.max(0, tgt.quantity - ac_destroyed);
        tgt.take_damage(ac_destroyed * 5);
        this.state.aircraft_lost.iran += ac_destroyed;
        const cas = ac_destroyed * rngRandInt(2, 5) + rngRandInt(5, 20);
        this.state.casualties.iran += cas;
        iran_cas_today += cas;
        this.state.day_log.push(
          `Day ${this.state.day}: US OCA strike destroys ${ac_destroyed} aircraft on ground — ${cas} KIA`);

      } else {
        const iran_naval = this.state.iran_units.filter(u =>
          u.unit_type === 'naval' && u.status === 'active');
        if (iran_naval.length > 0) {
          const tgt = rngChoice(iran_naval);
          const tlam = rngRandInt(4, 10);
          this.state.missiles_fired.us_tomahawk += tlam;
          tgt.take_damage(rngUniform(10, 30));
          const sunk = rngRandom() < 0.3 ? 1 : 0;
          this.state.ships_damaged.iran += sunk;
          const cas = rngRandInt(15, 60);
          this.state.casualties.iran += cas;
          iran_cas_today += cas;
          this.state.day_log.push(
            `Day ${this.state.day}: US strike on ${tgt.name} — ${sunk ? 'vessel sunk, ' : ''}${cas} KIA`);
        }
      }
    }

    if (us_ac_lost_today > 0) {
      this.state.day_log.push(
        `Day ${this.state.day}: US loses ${us_ac_lost_today} aircraft to Iranian IADS`);
    }

    // IRIAF response
    for (const iran_ftr of iran_air) {
      if (rngRandom() < 0.12 && us_air.length > 0) {
        const target = rngChoice(us_air);
        const result = this._lanchester_engagement(iran_ftr, target);
        iran_ftr.take_damage(result.attacker_damage);
        target.take_damage(result.defender_damage * 0.2);
        const lost = Math.max(0, Math.floor(result.attacker_damage / 8));
        this.state.aircraft_lost.iran += lost;
        iran_ftr.quantity = Math.max(0, iran_ftr.quantity - lost);
        if (lost > 0) {
          const aircrew_cas = lost * rngRandInt(1, 2);
          this.state.casualties.iran += aircrew_cas;
          this.state.day_log.push(
            `Day ${this.state.day}: ${lost} IRIAF fighters shot down — ${aircrew_cas} KIA`);
        }
      }
    }

    // Iranian ballistic missile retaliation
    for (const msl_unit of iran_missiles) {
      if (msl_unit.missiles_remaining > 0 && msl_unit.status === 'active') {
        const fire_prob = msl_unit.sub_type === 'srbm' ? 0.35 : 0.25;
        if (rngRandom() < fire_prob) {
          const salvo = rngRandInt(5, 20);
          const fired = msl_unit.fire_missiles(salvo);
          if (['srbm', 'mrbm'].indexOf(msl_unit.sub_type) !== -1) {
            this.state.missiles_fired.iran_ballistic += fired;
          } else {
            this.state.missiles_fired.iran_cruise += fired;
          }

          // BMD intercept — THAAD for longer-range missiles, Patriot for SRBMs
          const us_bmd = this.state.us_units.filter(u =>
            u.sub_type === 'missile_defense' && u.status === 'active');
          let intercept_rate = ['mrbm', 'irbm'].indexOf(msl_unit.sub_type) !== -1
            ? this.params.thaad_intercept_rate
            : this.params.patriot_intercept_rate;
          let intercepted;
          if (us_bmd.length > 0) {
            const interceptors_available = us_bmd.reduce((s, u) => s + u.missiles_remaining, 0);
            intercepted = Math.min(fired, Math.floor(fired * intercept_rate),
              Math.floor(interceptors_available / 2));
            let remaining_to_intercept = intercepted;
            for (const bmd of us_bmd) {
              const used = Math.min(bmd.missiles_remaining, remaining_to_intercept);
              bmd.missiles_remaining -= used;
              remaining_to_intercept -= used;
              if (remaining_to_intercept <= 0) break;
            }
          } else {
            intercepted = Math.floor(fired * 0.3);
          }

          const leakers = Math.max(0, fired - intercepted);
          if (leakers > 0) {
            const cas = Math.round(leakers * rngRandInt(1, 5) * this.params.iran_ballistic_cep_factor);
            this.state.casualties.us += cas;
            this.state.day_log.push(
              `Day ${this.state.day}: Iran fires ${fired} ${msl_unit.sub_type.toUpperCase()}s at US bases` +
              ` — ${intercepted} intercepted, ${leakers} hit, ${cas} casualties`);
          }
        }
      }
    }

    // Shahed drone swarms
    const drones = this.state.iran_units.filter(u =>
      u.sub_type === 'one_way_attack' && u.status === 'active');
    for (const drone_unit of drones) {
      if (rngRandom() < 0.3 && drone_unit.missiles_remaining > 0) {
        const swarm = rngRandInt(15, 60);
        const launched = drone_unit.fire_missiles(swarm);
        this.state.missiles_fired.iran_drone += launched;
        const drone_intercept_rate = 0.75;
        const leakers = Math.max(0, launched - Math.floor(launched * drone_intercept_rate));
        if (leakers > 0) {
          const cas = rngRandInt(0, leakers * 2);
          this.state.casualties.us += cas;
          this.state.day_log.push(
            `Day ${this.state.day}: Shahed drone swarm (${launched} drones) targets US positions` +
            ` — ${leakers} penetrate, ${cas} casualties`);
        }
      }
    }
  }

