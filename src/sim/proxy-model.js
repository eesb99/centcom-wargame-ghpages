  _process_proxy_warfare() {
    if (this.state.escalation_level < EscalationLevel.PROXY_ACTIVATION) return;

    const proxies = this.state.iran_units.filter(u => u.unit_type === 'proxy' && u.status === 'active');
    for (const proxy of proxies) {
      if (proxy.sub_type === 'houthi') {
        if (rngRandom() < 0.45) {
          const missiles = proxy.fire_missiles(rngRandInt(2, 8));
          this.state.missiles_fired.iran_ashm += missiles;
          if (missiles > 0) {
            const hit_prob = 0.12;
            let hits = 0;
            for (let i = 0; i < missiles; i++) { if (rngRandom() < hit_prob) hits++; }
            if (hits > 0) {
              this.state.ships_damaged.commercial += 1;
              this.state.economy.bab_al_mandeb_flow_pct = Math.max(50,
                this.state.economy.bab_al_mandeb_flow_pct - rngUniform(2, 5));
            }
            this.state.day_log.push(
              `Day ${this.state.day}: Houthi fires ${missiles} anti-ship missiles in Red Sea` +
              ` — ${hits > 0 ? 'hit on commercial vessel' : 'intercepted/missed'}`);
          }
        }

        if (rngRandom() < 0.2) {
          const drones = rngRandInt(5, 20);
          proxy.fire_missiles(drones);
          this.state.missiles_fired.iran_drone += drones;
          this.state.day_log.push(
            `Day ${this.state.day}: Houthi launches ${drones} Samad/Shahed drones toward Saudi/UAE`);
        }

      } else if (proxy.sub_type === 'hezbollah') {
        if (this.state.escalation_level >= EscalationLevel.AIR_STRIKES && rngRandom() < 0.3) {
          const rockets = rngRandInt(50, 200);
          proxy.fire_missiles(rockets);
          this.state.missiles_fired.proxy_rockets += rockets;
          const intercepted = Math.floor(rockets * this.params.iron_dome_intercept_rate);
          const leakers = rockets - intercepted;
          const civ_cas = rngRandInt(0, Math.max(1, Math.floor(leakers / 10)));
          this.state.casualties.civilian += civ_cas;
          this.state.day_log.push(
            `Day ${this.state.day}: Hezbollah fires ${rockets} rockets at Israel — ` +
            `${intercepted} intercepted, ${civ_cas} civilian casualties`);
        }

      } else if (proxy.sub_type === 'pmf') {
        if (rngRandom() < 0.5) {
          const rockets = rngRandInt(3, 20);
          proxy.fire_missiles(rockets);
          this.state.missiles_fired.proxy_rockets += rockets;
          const us_cas = rngRandInt(0, Math.max(1, Math.floor(rockets / 8)));
          this.state.casualties.us += us_cas;
          this.state.day_log.push(
            `Day ${this.state.day}: Iraqi PMF fires ${rockets} rockets/drones at US base — ` +
            `${us_cas} US casualties`);
        }
      }
    }
  }

