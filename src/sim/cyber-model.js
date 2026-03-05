  _process_cyber() {
    if (this.state.escalation_level < EscalationLevel.CYBER_OPERATIONS) return;

    const intensity = this.params.cyber_intensity;
    const us_cyber = this.state.us_units.find(u => u.unit_type === 'cyber');
    const iran_cyber = this.state.iran_units.find(u => u.unit_type === 'cyber');

    if (us_cyber && us_cyber.status === 'active') {
      const c2_impact = rngUniform(0.01, 0.04) * intensity * (us_cyber.effective_strength() / 100);
      this.state.cyber.iran_c2_degradation = Math.min(0.8, this.state.cyber.iran_c2_degradation + c2_impact);
      const iads_impact = rngUniform(0.005, 0.03) * intensity;
      this.state.cyber.iran_iads_degradation = Math.min(0.5, this.state.cyber.iran_iads_degradation + iads_impact);
      this.state.cyber.us_cyber_ops += 1;

      if (rngRandom() < 0.08 * intensity) {
        const nuke_impact = rngUniform(0.02, 0.06) * intensity;
        this.state.cyber.nuclear_facility_disruption = Math.min(0.9,
          this.state.cyber.nuclear_facility_disruption + nuke_impact);
        this.state.day_log.push(
          `Day ${this.state.day}: US cyber operation disrupts Iranian nuclear facility SCADA systems`);
      }
    }

    if (iran_cyber && iran_cyber.status === 'active') {
      const infra_impact = rngUniform(0.005, 0.02) * intensity * (iran_cyber.effective_strength() / 100);
      this.state.cyber.us_infra_disruption = Math.min(0.4,
        this.state.cyber.us_infra_disruption + infra_impact);
      this.state.cyber.iran_cyber_ops += 1;

      if (rngRandom() < 0.04 * intensity) {
        this.state.day_log.push(
          `Day ${this.state.day}: Iranian APT33 targets US CENTCOM logistics networks`);
      }
    }

    // C2 degradation reduces all Iranian readiness
    for (const unit of this.state.iran_units) {
      if (unit.unit_type !== 'cyber' && unit.unit_type !== 'proxy') {
        unit.readiness = Math.max(0.3, 1.0 - this.state.cyber.iran_c2_degradation * 0.4);
      }
    }
  }

