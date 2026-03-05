// ── Real-World Diplomatic & Escalation Events (OSINT, Feb 28 - Mar 5 2026) ──
// Used by scenario injection to calibrate the diplomatic momentum system against ground truth.
// Sources: CENTCOM, ICT SITREPs, FDD, CSIS, Reuters, Military Times, Wikipedia 2026 Iran war
const DIPLOMATIC_EVENTS = {
  conflict_start: '2026-02-28',
  last_updated: '2026-03-05',
  // param_calibration rationale:
  // Each day's parameters are derived from real OSINT to tune the game-theoretic model.
  // escalation_propensity: how likely each side is to escalate (0=dovish, 1=hawkish)
  // iran_force_multiplier: Iran's effective combat power relative to baseline (degrades as assets destroyed)
  // proxy_effectiveness: how much proxy forces contribute (rises as proxies activate)
  // us_tech_advantage: US technological edge (rises as IADS/navy eliminated)
  // iran_asymmetric_factor: Iran's asymmetric warfare multiplier (drones, fast boats, mines)
  // cyber_intensity: cyber warfare tempo (0-1)
  // hormuz_mining_probability: probability of new mines per day
  // oil_price_elasticity: market sensitivity to disruption (more negative = more reactive)
  days: {
    1: { // Feb 28 — Opening strikes
      date: '2026-02-28',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'US/Israel launch Operation Epic Fury at 1:15am ET — 1500+ strikes in first 24h',
        'Trump calls for regime overthrow — no diplomatic off-ramp offered',
        'Iran retaliates with ballistic missiles hitting UAE, Qatar, Bahrain, Kuwait',
        'Israel declares state of emergency; Jordan downs 2 Iranian missiles',
        'Pre-war Geneva negotiations (Feb 17) had already collapsed over enrichment red lines'
      ],
      proxy: { hezbollah_active: false, houthi_active: false, iraqi_militia_active: false },
      us_posture: 'maximum_force',
      iran_posture: 'full_retaliation',
      // Day 1 calibration: maximum escalation, full Iranian capability, no proxy yet
      param_calibration: {
        escalation_propensity: 0.95,    // Both sides at maximum aggression
        iran_force_multiplier: 0.95,    // Near-full strength, some C2 disrupted
        us_tech_advantage: 1.6,         // Stealth/precision advantage clear from opening salvo
        iran_asymmetric_factor: 1.3,    // Full asymmetric capability (missiles, mines, boats)
        proxy_effectiveness: 0.2,       // Proxies not yet activated
        cyber_intensity: 0.7,           // Iran cyber retaliation expected
        hormuz_mining_probability: 0.9, // IRGC mining Hormuz immediately
        oil_price_elasticity: -0.12,    // Markets in panic mode, high sensitivity
        patriot_intercept_rate: 0.82,   // Some leakers got through (Kuwait attack)
      }
    },
    2: { // Mar 1 — Continued strikes, first tanker attacked
      date: '2026-03-01',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'US strikes continue — cumulative approaching 1700 targets in 72h window',
        'First commercial tanker attacked near Strait of Hormuz',
        '3 US service members killed, 5 seriously wounded (projectile penetrated air defense in Kuwait)',
        'Iran expands retaliation to US facilities in Saudi Arabia, Jordan, Oman, Cyprus',
        'Strait of Hormuz effectively closed by IRGC — commercial shipping halted'
      ],
      proxy: { hezbollah_active: false, houthi_active: false, iraqi_militia_active: true },
      us_posture: 'maximum_force',
      iran_posture: 'full_retaliation',
      // Day 2: Iran still retaliating hard, Hormuz closed, first US casualties
      param_calibration: {
        escalation_propensity: 0.90,    // Still maximum but Iran spreading thin
        iran_force_multiplier: 0.80,    // Significant degradation after 1500+ strikes
        us_tech_advantage: 1.65,        // SEAD working, IADS degrading
        iran_asymmetric_factor: 1.4,    // Asymmetric peaked — tanker attack, Hormuz closed
        proxy_effectiveness: 0.3,       // Iraqi militia activated
        cyber_intensity: 0.6,           // Cyber attacks ongoing
        hormuz_mining_probability: 0.85,// Active mining continues
        oil_price_elasticity: -0.10,    // Markets still reactive but finding floor
        patriot_intercept_rate: 0.83,   // Defenses adapting
      }
    },
    3: { // Mar 2 — CENTCOM confirms 6 KIA, Hezbollah enters
      date: '2026-03-02',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'CENTCOM confirms 6 US KIA, 18 WIA total — 4 Army Reserve killed by drone in Kuwait',
        '17 Iranian naval vessels + 1 submarine destroyed (CENTCOM statement)',
        'Hezbollah launches first rockets at northern Israel — targets missile defense site near Haifa',
        'Iranian Red Crescent: 555 Iranians killed in initial assault',
        'Trump issues ultimatum to IRGC: "surrender or face certain death"',
        'FDD assessment: "no viable diplomatic off-ramp with current regime"',
        'Desperate Iranian "leadership council" forming but lacks legitimacy after Khamenei killed'
      ],
      proxy: { hezbollah_active: true, houthi_active: false, iraqi_militia_active: true },
      us_posture: 'maximum_force',
      iran_posture: 'fragmented_command',
      // Day 3: Navy destroyed, leadership decapitated, but proxies entering
      param_calibration: {
        escalation_propensity: 0.85,    // Iran command fragmented, but proxies escalating
        iran_force_multiplier: 0.55,    // Navy gone (17 ships), heavy losses (555 dead)
        us_tech_advantage: 1.75,        // Total naval dominance achieved
        iran_asymmetric_factor: 1.2,    // Reduced — navy gone, but mines/drones still active
        proxy_effectiveness: 0.6,       // Hezbollah entered — major escalation
        cyber_intensity: 0.5,           // Maintaining but degraded by C2 disruption
        hormuz_mining_probability: 0.6, // Mining capability degraded with navy
        oil_price_elasticity: -0.08,    // Markets stabilizing as US dominance clear
        patriot_intercept_rate: 0.85,   // Defenses improved
      }
    },
    4: { // Mar 3 — Hezbollah escalates, proxy war widens
      date: '2026-03-03',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'Hezbollah fires missiles and drones at 3 Israeli bases: Ramat David, Meron, Camp Yitzhak',
        'ICT SITREP Mar 3: conflict expanding to full regional proxy war',
        'Iran proxies intensify attacks across multiple regional states',
        'UN Security Council monitoring escalation but no resolution introduced',
        'No diplomatic channels active — Foreign Minister Araghchi contact maintained as "prudent optionality"'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'maximum_force',
      iran_posture: 'proxy_escalation',
      // Day 4: Full proxy war — all three axes active, but Iran conventional forces degraded
      param_calibration: {
        escalation_propensity: 0.80,    // Proxies aggressive, but Iran conventional capacity falling
        iran_force_multiplier: 0.45,    // Heavy attrition continues
        us_tech_advantage: 1.80,        // Near-total air superiority
        iran_asymmetric_factor: 1.1,    // Declining — losing launch platforms
        proxy_effectiveness: 0.8,       // All three proxy fronts active — peak proxy war
        cyber_intensity: 0.6,           // Proxy cyber coordination increasing
        hormuz_mining_probability: 0.5, // Mining slowing as naval assets gone
        oil_price_elasticity: -0.07,    // Markets adapting
        patriot_intercept_rate: 0.87,   // System optimization ongoing
      }
    },
    5: { // Mar 4 — First Israeli casualties, oil prices volatile
      date: '2026-03-04',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'Hezbollah drones/missiles target Israeli bases and oil/gas infrastructure',
        'First Israeli casualties: 2 soldiers wounded by anti-tank fire in southern Lebanon',
        'Brent crude falls toward $81/bbl after initial spike — market pricing in US dominance',
        'Est. 2100 Iranian military killed (cumulative)',
        '20+ Iranian naval vessels destroyed total',
        'No ceasefire proposals from any party'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'proxy_escalation',
      // Day 5: Iran conventional nearly broken, oil falling = market sees US winning
      param_calibration: {
        escalation_propensity: 0.70,    // Declining — Iran losing capability to escalate
        iran_force_multiplier: 0.35,    // 2100+ dead, navy destroyed, IADS degraded
        us_tech_advantage: 1.85,        // Near-total dominance
        iran_asymmetric_factor: 0.9,    // Below baseline — asymmetric assets depleted
        proxy_effectiveness: 0.75,      // Proxies still active but coordination degrading
        cyber_intensity: 0.5,           // Steady state
        hormuz_mining_probability: 0.4, // Fewer assets to lay mines
        oil_price_elasticity: -0.05,    // Markets calming — Brent falling to $81
        patriot_intercept_rate: 0.88,   // High confidence interception
      }
    },
    6: { // Mar 5 — Current day
      date: '2026-03-05',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'Hezbollah continues attacks on Israeli facilities',
        'Iranian navy effectively destroyed — no surface combatants operational',
        'Iran leadership council lacks control over provinces',
        'No diplomatic off-ramp — US war aims remain regime change',
        'Conflict entering sustained operations phase'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'fragmented_resistance',
      // Day 6: Iran conventional forces broken, entering insurgency/proxy phase
      param_calibration: {
        escalation_propensity: 0.60,    // Iran can't escalate conventionally anymore
        iran_force_multiplier: 0.25,    // Effectively broken — no navy, fragmented command
        us_tech_advantage: 1.90,        // Total air/naval superiority
        iran_asymmetric_factor: 0.7,    // Deeply degraded — shifting to guerrilla
        proxy_effectiveness: 0.7,       // Proxies slightly degrading without IRGC coordination
        cyber_intensity: 0.4,           // Declining with infrastructure damage
        hormuz_mining_probability: 0.3, // Minimal new mining capability
        oil_price_elasticity: -0.05,    // Markets normalized
        patriot_intercept_rate: 0.90,   // Optimized
      }
    }
  }
};
