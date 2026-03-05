  _init_forces() {
    // Seed PRNG before force building so SAM positions are deterministic
    setRngSeed(this.params.random_seed || 42);

    const fm = this.params.us_force_multiplier;
    const im = this.params.iran_force_multiplier;
    const pe = this.params.proxy_effectiveness;

    this.state.us_units = this._build_us_forces(fm);
    this.state.iran_units = this._build_iran_forces(im, pe);
    this.state.escalation_level = this.params.initial_escalation;

    // Economic baseline from backfill
    const eco = this.state.economy;
    const econ_bf = ECON_BACKFILL.oil_market_2026 || {};
    eco.oil_price_bbl = econ_bf.brent_crude_current || 81.0;
    eco.global_spare_capacity_mbd = econ_bf.opec_spare_capacity_mbd || 3.5;

    eco.spr_release_mbd = 0.0;

    // Apply war-time economic conditions when available (all presets benefit from this data)
    const epic_econ = ECON_BACKFILL.epic_fury_economic_scenario || {};
    const preset_name = this.params.scenario_preset;
    if (preset_name && Object.keys(epic_econ).length > 0) {
      eco.oil_price_bbl = 81.0;
      eco.hormuz_flow_pct = Math.max(15, 100 - (epic_econ.hormuz_flow_reduction_pct || 85));
      eco.war_risk_premium_pct = 3.0;
      eco.shipping_insurance_multiplier = epic_econ.shipping_insurance_multiplier || 5.0;
      eco.sanctions_severity = 1.0;
      eco.iran_oil_revenue_daily_million = 0.0;
      eco.us_daily_cost_million = epic_econ.us_daily_war_cost_million || 350;
    }
  }

  _build_us_forces(fm) {
    const units = [];

    // ── Carrier Strike Groups ──
    const csgs = US_ORBAT.carrier_strike_groups || [];
    for (const csg of csgs) {
      const aircraft_count = (csg.aircraft || []).reduce((s, sq) => s + (sq.quantity || 0), 0);
      const vls_total = (csg.escorts || []).reduce((s, e) => s + (e.vls_cells || 0), 0);
      const tomahawks_est = (csg.escorts || []).reduce((s, e) => s + (e.tomahawks_est || 0), 0);
      const escort_count = (csg.escorts || []).length;
      const loc = csg.location || {};

      units.push(new MilitaryUnit({
        name: csg.name || 'CSG',
        side: 'us', unit_type: 'naval', sub_type: 'carrier_strike_group',
        lat: loc.lat || 25.0, lon: loc.lon || 56.0,
        strength: 95 * fm, max_strength: 95,
        quantity: 1, quantity_max: 1,
        missiles_remaining: tomahawks_est, missiles_max: tomahawks_est,
        range_km: 1600,
        details: `${aircraft_count} aircraft, ${escort_count} escorts, ${vls_total} VLS cells`
      }));

      units.push(new MilitaryUnit({
        name: `${csg.air_wing || 'CVW'} Air Wing`,
        side: 'us', unit_type: 'air', sub_type: 'carrier_air_wing',
        lat: loc.lat || 25.0, lon: loc.lon || 56.0,
        strength: 90 * fm, max_strength: 90,
        quantity: aircraft_count, quantity_max: aircraft_count,
        range_km: 800,
        details: `Embarked on ${csg.carrier || ''}`
      }));
    }

    // ── Land-based Air ──
    for (const base_data of (US_ORBAT.land_based_air || [])) {
      const base_name = base_data.base || 'Unknown';
      let total_ac = 0;
      let strike_power = 0;
      for (const unit of (base_data.units || [])) {
        const qty = unit.quantity || 0;
        total_ac += qty;
        const ac_type = unit.aircraft_type || '';
        const power_map = {
          'F-22': 15, 'F-35': 14, 'F-15E': 12, 'F-15C': 10,
          'F-16': 9, 'A-10': 7, 'B-2': 25, 'B-52': 15, 'B-1B': 18,
          'F/A-18': 11, 'EA-18G': 8, 'MQ-9': 4, 'KC-135': 2, 'KC-46': 2,
        };
        let matched = false;
        for (const [key, power] of Object.entries(power_map)) {
          if (ac_type.indexOf(key) !== -1) {
            strike_power += qty * power;
            matched = true;
            break;
          }
        }
        if (!matched) strike_power += qty * 3;
      }

      if (total_ac > 0) {
        const loc = base_data.location || {};
        const strength = Math.min(98, (strike_power / Math.max(total_ac, 1)) * 6) * fm;
        units.push(new MilitaryUnit({
          name: `USAF ${base_name}`,
          side: 'us', unit_type: 'air', sub_type: 'land_based_air',
          lat: loc.lat || 25.0, lon: loc.lon || 51.0,
          strength: strength, max_strength: strength,
          quantity: total_ac, quantity_max: total_ac,
          range_km: 1200,
          details: `${total_ac} aircraft at ${base_name}`
        }));
      }
    }

    // ── Submarine Force ──
    for (const sub of (US_ORBAT.submarine_force || [])) {
      const tlam = sub.tomahawks || 0;
      const loc = sub.location_coords || sub.location || {};
      const lat = typeof loc === 'object' && loc !== null ? (loc.lat || 25.5) : 25.5;
      const lon = typeof loc === 'object' && loc !== null ? (loc.lon || 57.0) : 57.0;
      units.push(new MilitaryUnit({
        name: sub.name || 'SSN',
        side: 'us', unit_type: 'naval', sub_type: 'submarine',
        lat: lat, lon: lon,
        strength: 85 * fm, max_strength: 85,
        quantity: 1, quantity_max: 1,
        missiles_remaining: tlam, missiles_max: tlam,
        range_km: 1600,
        details: `${sub.class || ''} ${tlam > 20 ? 'SSGN' : 'SSN'}`
      }));
    }

    // ── Missile Defense ──
    for (const md of (US_ORBAT.missile_defense || [])) {
      const sys_name = md.system || '';
      const interceptors = md.interceptors || (md.batteries || 1) * 16;
      units.push(new MilitaryUnit({
        name: `US ${sys_name}`,
        side: 'us', unit_type: 'air_defense', sub_type: 'missile_defense',
        lat: md.lat || 25.0, lon: md.lon || 52.0,
        strength: 88 * fm, max_strength: 88,
        quantity: md.batteries || 1, quantity_max: md.batteries || 1,
        missiles_remaining: interceptors, missiles_max: interceptors,
        range_km: md.range_km || 100,
        details: sys_name
      }));
    }

    // ── ISR Assets ──
    for (const isr of (US_ORBAT.isr_assets || [])) {
      units.push(new MilitaryUnit({
        name: `US ${isr.type || 'ISR'}`,
        side: 'us', unit_type: 'isr', sub_type: 'isr',
        lat: isr.lat || 25.0, lon: isr.lon || 51.0,
        strength: 70 * fm, max_strength: 70,
        quantity: isr.quantity || 1, quantity_max: isr.quantity || 1,
        range_km: (isr.endurance_hrs || 24) * 200,
        details: isr.role || 'ISR'
      }));
    }

    // ── Cruise Missile Inventory ──
    const mil_us = (MIL_DATA.us_forces || {}).missiles || {};
    const tlam_data = mil_us.tomahawk || {};
    const jassm_data = mil_us.jassm || {};
    const tlam_inv = tlam_data.total_inventory_est_low || 3500;
    const jassm_inv = jassm_data.total_inventory_est_low || 2000;

    units.push(new MilitaryUnit({
      name: 'Tomahawk Inventory',
      side: 'us', unit_type: 'missile', sub_type: 'cruise_missile',
      lat: 25.0, lon: 55.0,
      strength: 95 * fm, max_strength: 95,
      missiles_remaining: Math.floor(tlam_inv * fm),
      missiles_max: Math.floor(tlam_inv * fm),
      range_km: 1600,
      details: `Tomahawk TLAM: ${tlam_inv} est`
    }));
    units.push(new MilitaryUnit({
      name: 'JASSM/JASSM-ER Inventory',
      side: 'us', unit_type: 'missile', sub_type: 'cruise_missile',
      lat: 25.0, lon: 55.0,
      strength: 90 * fm, max_strength: 90,
      missiles_remaining: Math.floor(jassm_inv * fm),
      missiles_max: Math.floor(jassm_inv * fm),
      range_km: 1000,
      details: `JASSM variants: ${jassm_inv} est`
    }));

    // ── Cyber Command ──
    units.push(new MilitaryUnit({
      name: 'US Cyber Command',
      side: 'us', unit_type: 'cyber', sub_type: 'cyber_offense',
      lat: 39.1, lon: -76.7,
      strength: 95 * fm, max_strength: 95,
      details: 'Full-spectrum cyber operations'
    }));

    return units;
  }

  _build_iran_forces(im, pe) {
    const units = [];
    const iran_mil = MIL_DATA.iran_forces || {};

    // ── IRGC Navy ──
    const irgc_nav = IRAN_ORBAT.irgc_navy_detailed || {};

    // Fast attack craft
    let fac_list = irgc_nav.fast_attack_craft || [];
    if (fac_list && typeof fac_list === 'object' && !Array.isArray(fac_list)) {
      fac_list = fac_list.types || fac_list.classes || [fac_list];
    }
    if (!Array.isArray(fac_list)) fac_list = [];
    const total_fac = fac_list.reduce((s, f) => s + (typeof f === 'object' ? safeInt(f.quantity || 0) : 0), 0);
    units.push(new MilitaryUnit({
      name: 'IRGC Fast Attack Flotilla',
      side: 'iran', unit_type: 'naval', sub_type: 'fast_attack',
      lat: 27.18, lon: 56.27,
      strength: 70 * im, max_strength: 70,
      quantity: Math.min(total_fac, 500), quantity_max: Math.min(total_fac, 500),
      range_km: 200,
      details: `${total_fac} craft: Peykaap, Zolfaghar, Ashura, IPS types`
    }));

    // Soleimani corvettes
    const corvettes = irgc_nav.soleimani_corvettes || irgc_nav.corvettes || [];
    if (Array.isArray(corvettes) && corvettes.length > 0) {
      units.push(new MilitaryUnit({
        name: 'IRGC Soleimani Corvettes',
        side: 'iran', unit_type: 'naval', sub_type: 'corvette',
        lat: 27.2, lon: 56.3,
        strength: 55 * im, max_strength: 55,
        quantity: corvettes.length, quantity_max: corvettes.length,
        missiles_remaining: corvettes.length * 4,
        missiles_max: corvettes.length * 4,
        range_km: 300,
        details: 'Abu Mahdi AShCM, Nasr AShM'
      }));
    }

    // Midget submarines
    const ghadir = irgc_nav.midget_submarines || irgc_nav.ghadir_midget_submarines || {};
    const ghadir_qty = typeof ghadir === 'object' && ghadir !== null ? (ghadir.quantity || 23) : 23;
    units.push(new MilitaryUnit({
      name: 'IRGC Ghadir Midget Subs',
      side: 'iran', unit_type: 'naval', sub_type: 'midget_sub',
      lat: 27.0, lon: 56.5,
      strength: 55 * im, max_strength: 55,
      quantity: ghadir_qty, quantity_max: ghadir_qty,
      range_km: 50,
      details: `${ghadir_qty} Ghadir-class, 2 torpedoes each`
    }));

    // Naval mines
    const mines = irgc_nav.naval_mines || irgc_nav.mines || {};
    let mine_inv = 5000;
    if (typeof mines === 'object' && mines !== null) {
      const inv_str = String(mines.total_inventory || mines.total_estimated || '3000-5000');
      try {
        if (inv_str.indexOf('-') !== -1) {
          mine_inv = parseInt(inv_str.split('-')[1], 10) || 5000;
        } else {
          mine_inv = parseInt(inv_str.replace(/,/g, ''), 10) || 5000;
        }
      } catch(e) { mine_inv = 5000; }
    }

    units.push(new MilitaryUnit({
      name: 'IRGC Mine Warfare',
      side: 'iran', unit_type: 'naval', sub_type: 'mine_warfare',
      lat: 26.6, lon: 56.3,
      strength: 65 * im, max_strength: 65,
      missiles_remaining: mine_inv, missiles_max: mine_inv,
      range_km: 10,
      details: `~${mine_inv} mines: EM-52 rocket, SADAF, moored contact, influence`
    }));

    // Coastal AShM batteries
    let batteries = irgc_nav.coastal_missile_batteries ||
                    ((IRAN_ORBAT.irgc_aerospace_force || {}).coastal_defense_batteries || []);
    if (Array.isArray(batteries)) {
      for (const bat of batteries) {
        const loc_name = bat.location || 'Unknown';
        units.push(new MilitaryUnit({
          name: `Coastal AShM ${loc_name}`,
          side: 'iran', unit_type: 'missile', sub_type: 'coastal_ashm',
          lat: bat.lat || 26.6, lon: bat.lon || 56.3,
          strength: 75 * im, max_strength: 75,
          missiles_remaining: (bat.launchers || 4) * 4,
          missiles_max: (bat.launchers || 4) * 4,
          range_km: bat.range_km || 200,
          details: `Systems: ${(bat.systems || ['Noor/Qader']).join(', ')}`
        }));
      }
    }

    // ── Regular Navy ──
    const reg_nav = IRAN_ORBAT.regular_navy_detailed || {};

    // Kilo submarines
    let kilos = reg_nav.submarines || reg_nav.kilo_class || [];
    let kilo_count;
    if (Array.isArray(kilos)) {
      kilo_count = kilos.filter(k => typeof k === 'object' && k !== null &&
        String(k.class || '').toLowerCase().indexOf('kilo') !== -1).length;
      if (kilo_count === 0) kilo_count = 3;
    } else {
      kilo_count = 3;
    }

    units.push(new MilitaryUnit({
      name: 'IRIN Kilo SSK Group',
      side: 'iran', unit_type: 'naval', sub_type: 'ssk',
      lat: 27.0, lon: 57.0,
      strength: 65 * im, max_strength: 65,
      quantity: kilo_count, quantity_max: kilo_count,
      missiles_remaining: kilo_count * 18, missiles_max: kilo_count * 18,
      range_km: 400,
      details: `${kilo_count} Kilo 877EKM: Taregh, Nooh, Yunes`
    }));

    // Fateh-class
    units.push(new MilitaryUnit({
      name: 'IRIN Fateh SSK',
      side: 'iran', unit_type: 'naval', sub_type: 'ssk',
      lat: 25.3, lon: 60.6,
      strength: 50 * im, max_strength: 50,
      quantity: 2, quantity_max: 2,
      range_km: 300,
      details: '2 Fateh-class SSK, semi-heavy'
    }));

    // Surface combatants
    units.push(new MilitaryUnit({
      name: 'IRIN Surface Fleet',
      side: 'iran', unit_type: 'naval', sub_type: 'frigate',
      lat: 27.18, lon: 56.27,
      strength: 40 * im, max_strength: 40,
      quantity: 6, quantity_max: 6,
      missiles_remaining: 24, missiles_max: 24,
      range_km: 120,
      details: 'Moudge-class, Alvand-class: C-802/Noor AShM'
    }));

    // ── Ballistic Missiles ──
    const bm_list = iran_mil.ballistic_missiles || [];
    const total_bm_inv = iran_mil.ballistic_missile_inventory_total || {};
    const march_est = total_bm_inv.march_2026_estimate || '~2500';
    let bm_total = 2500;
    try {
      bm_total = parseInt(String(march_est).replace(/~/g,'').replace(/,/g,'').split('-')[0].split(/\s/)[0], 10) || 2500;
    } catch(e) {}

    // Group by range class from MIL_DATA
    const srbm_types = bm_list.filter(m => typeof m === 'object' && m !== null && (m.range_km || 0) <= 500);
    const mrbm_types = bm_list.filter(m => typeof m === 'object' && m !== null && (m.range_km || 0) > 500 && (m.range_km || 0) <= 2000);
    const irbm_types = bm_list.filter(m => typeof m === 'object' && m !== null && (m.range_km || 0) > 2000);

    // Use IRAN_ORBAT missile_systems_inventory for proportional split if available
    const orbat_inv = (IRAN_ORBAT.irgc_aerospace_force || {}).missile_systems_inventory || {};
    const orbat_srbm_count = Array.isArray(orbat_inv.srbm) ? orbat_inv.srbm.length : 0;
    const orbat_mrbm_count = Array.isArray(orbat_inv.mrbm) ? orbat_inv.mrbm.length : 0;
    const orbat_cruise_count = Array.isArray(orbat_inv.cruise_missiles) ? orbat_inv.cruise_missiles.length : 0;
    const orbat_total = orbat_srbm_count + orbat_mrbm_count + orbat_cruise_count;

    let srbm_inv, mrbm_inv, irbm_inv;
    if (orbat_total > 0) {
      // Derive proportions from ORBAT type counts
      srbm_inv = Math.floor(bm_total * orbat_srbm_count / orbat_total);
      mrbm_inv = Math.floor(bm_total * orbat_mrbm_count / orbat_total);
      irbm_inv = bm_total - srbm_inv - mrbm_inv;
    } else {
      // Fallback to hardcoded split
      srbm_inv = Math.floor(bm_total * 0.5);
      mrbm_inv = Math.floor(bm_total * 0.35);
      irbm_inv = Math.floor(bm_total * 0.15);
    }

    const srbm_names = srbm_types.slice(0, 3).map(m => m.name || '').join(', ');
    const mrbm_names = mrbm_types.slice(0, 3).map(m => m.name || '').join(', ');
    const irbm_names = irbm_types.slice(0, 3).map(m => m.name || '').join(', ');

    units.push(new MilitaryUnit({
      name: 'IRGC SRBM Force',
      side: 'iran', unit_type: 'missile', sub_type: 'srbm',
      lat: 33.0, lon: 52.0,
      strength: 80 * im, max_strength: 80,
      missiles_remaining: srbm_inv, missiles_max: srbm_inv,
      range_km: 500,
      details: `${srbm_inv} SRBMs: ${srbm_names}`
    }));
    units.push(new MilitaryUnit({
      name: 'IRGC MRBM Force',
      side: 'iran', unit_type: 'missile', sub_type: 'mrbm',
      lat: 34.0, lon: 51.5,
      strength: 85 * im, max_strength: 85,
      missiles_remaining: mrbm_inv, missiles_max: mrbm_inv,
      range_km: 2000,
      details: `${mrbm_inv} MRBMs: ${mrbm_names}`
    }));
    units.push(new MilitaryUnit({
      name: 'IRGC IRBM Force',
      side: 'iran', unit_type: 'missile', sub_type: 'irbm',
      lat: 35.0, lon: 52.0,
      strength: 75 * im, max_strength: 75,
      missiles_remaining: irbm_inv, missiles_max: irbm_inv,
      range_km: 3000,
      details: `${irbm_inv} IRBMs: ${irbm_names}`
    }));

    // ── Cruise Missiles ──
    const cm_list = iran_mil.cruise_missiles || [];
    const cm_total = (Array.isArray(cm_list) ? cm_list.length : 0) * 50;
    const cm_names = Array.isArray(cm_list) ? cm_list.slice(0, 4).map(m => m.name || '').join(', ') : '';
    units.push(new MilitaryUnit({
      name: 'Iran Cruise Missile Force',
      side: 'iran', unit_type: 'missile', sub_type: 'cruise_missile',
      lat: 33.5, lon: 51.5,
      strength: 70 * im, max_strength: 70,
      missiles_remaining: cm_total, missiles_max: cm_total,
      range_km: 2500,
      details: `${cm_total} est: ${cm_names}`
    }));

    // ── Air Defense ──
    const ad_network = IRAN_ORBAT.air_defense_network || {};
    let layers = ad_network.layered_defense || ad_network.iads_layers || (iran_mil.air_defense || []);
    if (Array.isArray(layers)) {
      for (const layer of layers) {
        const sys_name = layer.system || layer.name || 'SAM';
        const layer_batteries = safeInt(layer.batteries || layer.quantity || 4, 4);
        const rng = safeInt(layer.range_km || 100, 100);
        const msl_per = safeInt(layer.missiles_per_battery || 8, 8);
        const locs = layer.locations || [];
        const loc_str = Array.isArray(locs) ? locs.slice(0, 3).join(', ') : String(locs);

        units.push(new MilitaryUnit({
          name: `Iran ${sys_name}`,
          side: 'iran', unit_type: 'air_defense', sub_type: 'sam',
          lat: 32.5 + rngUniform(-1, 1),
          lon: 52.0 + rngUniform(-1, 1),
          strength: 70 * im, max_strength: 70,
          quantity: layer_batteries,
          quantity_max: layer_batteries,
          missiles_remaining: layer_batteries * msl_per,
          missiles_max: layer_batteries * msl_per,
          range_km: rng,
          details: `${sys_name} at ${loc_str}`
        }));
      }
    }

    // ── Air Force ──
    const af = IRAN_ORBAT.air_force_detailed || {};
    const squadrons = af.fighter_squadrons || ((iran_mil.air_force || {}).types || []);
    let total_operational = 0;
    if (Array.isArray(squadrons)) {
      for (const sq of squadrons) {
        const op = safeInt(sq.operational || sq.quantity || 10, 10);
        total_operational += op;
      }
    }

    units.push(new MilitaryUnit({
      name: 'IRIAF Fighter Force',
      side: 'iran', unit_type: 'air', sub_type: 'fighter',
      lat: 32.0, lon: 52.5,
      strength: 35 * im, max_strength: 35,
      quantity: total_operational || 85,
      quantity_max: total_operational || 85,
      range_km: 600,
      details: `${total_operational || 85} operational: F-14A, MiG-29, Su-24, F-4E, F-5E, Su-35`
    }));

    // ── Drones ──
    const shahed_136_inv = 2000;
    const other_uav = 200;
    units.push(new MilitaryUnit({
      name: 'Shahed-136 Swarm Arsenal',
      side: 'iran', unit_type: 'air', sub_type: 'one_way_attack',
      lat: 33.5, lon: 51.0,
      strength: 70 * im, max_strength: 70,
      quantity: shahed_136_inv, quantity_max: shahed_136_inv,
      missiles_remaining: shahed_136_inv, missiles_max: shahed_136_inv,
      range_km: 2000,
      details: `~${shahed_136_inv} Shahed-136/238 one-way attack drones`
    }));
    units.push(new MilitaryUnit({
      name: 'IRGC ISR/UCAV Fleet',
      side: 'iran', unit_type: 'air', sub_type: 'ucav',
      lat: 33.5, lon: 51.5,
      strength: 50 * im, max_strength: 50,
      quantity: other_uav, quantity_max: other_uav,
      range_km: 1500,
      details: 'Mohajer-6, Shahed-129/191, Kaman-22, Ababil-5'
    }));

    // ── Cyber ──
    units.push(new MilitaryUnit({
      name: 'Iran Cyber Army / APT33/APT34',
      side: 'iran', unit_type: 'cyber', sub_type: 'cyber_offense',
      lat: 35.7, lon: 51.4,
      strength: 60 * im, max_strength: 60,
      details: 'Shamoon, OilRig, Elfin groups'
    }));

    // ── Proxy Forces ──
    const hez = PROXY_DATA.hezbollah || {};
    let hez_rockets = 25000;
    let hez_personnel = 20000;
    const rk = hez.rocket_arsenal || {};
    if (typeof rk === 'object' && rk !== null) {
      hez_rockets = safeInt(rk.total_estimate || rk.current_total_estimate || 25000, 25000);
    } else {
      console.warn('Proxy data: Hezbollah rocket_arsenal missing, using fallback 25000');
    }
    let pers = hez.personnel || hez.current_strength || {};
    if (typeof pers === 'object' && pers !== null) {
      hez_personnel = safeInt(pers.active_fighters || 20000, 20000);
    } else {
      console.warn('Proxy data: Hezbollah personnel missing, using fallback 20000');
    }

    units.push(new MilitaryUnit({
      name: 'Hezbollah (Lebanon)',
      side: 'iran', unit_type: 'proxy', sub_type: 'hezbollah',
      lat: 33.85, lon: 35.50,
      strength: 50 * im * pe, max_strength: 50,
      quantity: hez_personnel, quantity_max: hez_personnel,
      missiles_remaining: hez_rockets, missiles_max: hez_rockets,
      range_km: 300,
      details: `${hez_personnel} fighters, ${hez_rockets} rockets (degraded post-2024)`
    }));

    const houthi = PROXY_DATA.houthis || {};
    let houthi_pers = 80000;
    const hp = houthi.personnel || {};
    if (typeof hp === 'object' && hp !== null) {
      houthi_pers = safeInt(hp.combat_effective_core || 80000, 80000);
    } else {
      console.warn('Proxy data: Houthi personnel missing, using fallback 80000');
    }

    units.push(new MilitaryUnit({
      name: 'Houthi Forces (Ansar Allah)',
      side: 'iran', unit_type: 'proxy', sub_type: 'houthi',
      lat: 15.35, lon: 44.21,
      strength: 60 * im * pe, max_strength: 60,
      quantity: houthi_pers, quantity_max: houthi_pers,
      missiles_remaining: 500, missiles_max: 500,
      range_km: 2000,
      details: 'Anti-ship: Sayyad, Asif; BM: Toufan, Palestine-2; Drones: Samad-3'
    }));

    const pmf = PROXY_DATA.iraqi_pmf || {};
    let pmf_pers = 75000;
    const pp = pmf.personnel || {};
    if (typeof pp === 'object' && pp !== null) {
      pmf_pers = safeInt(pp.iran_aligned_core || 75000, 75000);
    } else {
      console.warn('Proxy data: Iraqi PMF personnel missing, using fallback 75000');
    }

    units.push(new MilitaryUnit({
      name: 'Iraqi PMF (Iran-aligned)',
      side: 'iran', unit_type: 'proxy', sub_type: 'pmf',
      lat: 33.30, lon: 44.37,
      strength: 50 * im * pe, max_strength: 50,
      quantity: pmf_pers, quantity_max: pmf_pers,
      missiles_remaining: 200, missiles_max: 200,
      range_km: 700,
      details: "Kata'ib Hezbollah, Asa'ib Ahl al-Haq, Badr, al-Nujaba"
    }));

    return units;
  }

  // ── Lanchester Combat Model ──
