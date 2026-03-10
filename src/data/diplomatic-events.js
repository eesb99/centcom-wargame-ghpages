// ── Real-World Diplomatic & Escalation Events (OSINT, Feb 28 - Mar 10 2026) ──
// Used by scenario injection to calibrate the diplomatic momentum system against ground truth.
// Sources: CENTCOM, ICT SITREPs, FDD, CSIS, Reuters, Military Times, Wikipedia 2026 Iran war
const DIPLOMATIC_EVENTS = {
  conflict_start: '2026-02-28',
  last_updated: '2026-03-10',
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
    6: { // Mar 5 — Cooper: 90% BM decline, 83% drone decline
      date: '2026-03-05',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 5,
      events: [
        'Cooper: BM attacks down 90%, drone attacks down 83% from Day 1',
        'CENTCOM: 3000+ targets struck in Iran',
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
    },
    7: { // Mar 6 — Drone carrier struck, TEL hunting intensified
      date: '2026-03-06',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 4,
      events: [
        'Iran drone carrier (WWII-size) struck and on fire',
        '30+ Iranian ships destroyed (up from 24)',
        'IDF estimates 100-200 launchers remaining',
        'Iran still launching ~6 BM barrages/day at Israel — most intercepted',
        'TEL hunting campaign intensified — Esfahan Missile Complex struck',
        'Iran daily output: ~15 BMs + ~80 drones (down from 350 BMs Day 1)'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'fragmented_resistance',
      // Day 7: Iran functionally destroyed conventionally. Proxies sustaining but degrading.
      param_calibration: {
        escalation_propensity: 0.50,    // Iran lacks capability to escalate further
        iran_force_multiplier: 0.20,    // 30+ ships gone, ~280 TELs destroyed, C2 broken
        us_tech_advantage: 1.92,        // Near-total information + strike superiority
        iran_asymmetric_factor: 0.6,    // Drones still launching but from degraded infrastructure
        proxy_effectiveness: 0.65,      // Proxies losing IRGC coordination
        cyber_intensity: 0.35,          // Declining with infrastructure destruction
        hormuz_mining_probability: 0.25,// No naval assets to lay mines
        oil_price_elasticity: -0.05,    // Markets stable — US dominance priced in
        patriot_intercept_rate: 0.91,   // Continued optimization
      }
    },
    8: { // Mar 7 — Oil refineries struck, 7th US KIA, IRGC ignores president
      date: '2026-03-07',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 4,
      events: [
        'CENTCOM: 3000+ targets struck total, 43 ships damaged/destroyed',
        'IDF strikes oil refineries for first time (Tondgouyan, Shahran)',
        'Israel estimates ~120 launchers remaining',
        'NDTV: Iran may have ~1000 BMs left in stockpile',
        'Pezeshkian orders stop strikes on neighbors unless attacked from there — IRGC ignores',
        'Dubai airport hit by drone despite intercept',
        'Saudi: 8 drones + 1 BM intercepted; Shaybah/Berri oil fields targeted',
        '7th US service member dies (wounded Mar 1)',
        'Azerbaijan accuses Iran of drone attack on Nakhchivan (4 civilians injured)',
        'UAE daily: 16 BMs + 121 drones (15 BMs + 119 drones intercepted)'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'fragmented_resistance',
      // Day 8: Oil refinery strikes mark new phase. IRGC-president split emerging.
      param_calibration: {
        escalation_propensity: 0.45,    // IRGC ignoring president = fragmented decision-making
        iran_force_multiplier: 0.15,    // 43 ships, ~300 TELs destroyed, ~120 launchers left
        us_tech_advantage: 1.95,        // Refinery strikes = new target set unlocked
        iran_asymmetric_factor: 0.5,    // Drone production still active but launch sites degraded
        proxy_effectiveness: 0.60,      // Proxies losing coordination
        cyber_intensity: 0.30,          // Infrastructure heavily damaged
        hormuz_mining_probability: 0.20,// Minimal capability
        oil_price_elasticity: -0.06,    // Oil ticking up as refineries struck
        patriot_intercept_rate: 0.92,   // High confidence
      }
    },
    9: { // Mar 8 — Mojtaba Khamenei named, NATO intercepts BM, Gulf civilians hit
      date: '2026-03-08',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 4,
      events: [
        'Mojtaba Khamenei named new Supreme Leader',
        'Kuwait airport fuel tanks hit by drones',
        'Bahrain desalination plant hit by drone',
        'Al-Kharj (Saudi) residential area hit: 2 killed, 12 injured',
        'NATO intercepted BM over Turkish airspace (first time)',
        'Qatar intercepts 6 BMs + 2 CMs',
        'UAE cumulative: 246 BMs, 1422 drones, 8 CMs (FDD)',
        'Kuwait cumulative: 219 BMs, 406 drones',
        'Qatar cumulative: 129 BMs, 63 drones, 2 aircraft',
        'Bahrain cumulative: 95 missiles, 164 drones'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'leadership_transition',
      // Day 9: Leadership succession + civilian infrastructure hits = new escalation risk
      param_calibration: {
        escalation_propensity: 0.40,    // Mojtaba succession — consolidation not escalation
        iran_force_multiplier: 0.12,    // ~310 TELs destroyed, stockpile depleting
        us_tech_advantage: 1.95,        // Unchanged — total superiority
        iran_asymmetric_factor: 0.45,   // Still launching drones but rate declining
        proxy_effectiveness: 0.55,      // IRGC coordination further degraded by leadership change
        cyber_intensity: 0.25,          // Low
        hormuz_mining_probability: 0.15,// Near-zero capability
        oil_price_elasticity: -0.06,    // Refinery strikes keeping oil elevated
        patriot_intercept_rate: 0.93,   // Optimized
      }
    },
    10: { // Mar 9 — Wide-scale strikes on Tehran, cluster munitions confirmed
      date: '2026-03-09',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 4,
      events: [
        'Iran FM: "no room for ceasefire talks while attacks continue"',
        'NATO intercepted 2nd BM over Turkish airspace (Gaziantep area)',
        'Turkey deploys 6 F-16s + air defense to Northern Cyprus',
        'Trump: "the war is very complete, pretty much" then backtracks — "just the beginning"',
        'Iran denies drone attacks on Azerbaijan, Turkey, Cyprus',
        'Israel launched "wide-scale" strikes on Tehran, Isfahan, southern Iran',
        '11+ killed in Israel total from Iranian missiles since war start',
        'BMs with cluster munition warheads hit 7 locations in Israel',
        '9 BM waves at Israel in 24h (Mar 8 3pm - Mar 9 3pm)',
        'Bahrain: Sitra drone strike, 32 injured',
        'CENTCOM: "no shortage of American military will"'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'defiant_resistance',
      // Day 10: Cluster munitions = desperation. Wide-scale Tehran strikes = approaching endgame.
      param_calibration: {
        escalation_propensity: 0.35,    // Declining — cluster munitions are last-resort weapons
        iran_force_multiplier: 0.10,    // ~330 TELs destroyed, ~80-120 launchers remain
        us_tech_advantage: 1.97,        // Striking Tehran at will
        iran_asymmetric_factor: 0.40,   // Drone launches declining, launcher exhaustion approaching
        proxy_effectiveness: 0.50,      // Proxies increasingly autonomous, less coordinated
        cyber_intensity: 0.25,          // Minimal
        hormuz_mining_probability: 0.15,// Residual only
        oil_price_elasticity: -0.07,    // Oil rising again — Tehran strikes + refinery damage
        patriot_intercept_rate: 0.93,   // Stable
      }
    },
    11: { // Mar 10 — Oil surges $120, France deploys, rocket production targeted
      date: '2026-03-10',
      diplomatic_momentum: 0,
      mediation_active: false,
      ceasefire_signals: 0,
      escalation_override: 3,
      events: [
        'Oil surges toward $120/bbl',
        'France deploying 8 frigates + 2 amphibious carriers',
        'IDF struck rocket engine production + long-range BM launch sites',
        'Heavy explosions across Tehran',
        'Iran FM Araghchi: threatens to destroy HIMARS wherever they are',
        'Oman sultan congratulates Mojtaba Khamenei',
        'IAEA: enriched uranium stockpile intact despite strikes',
        'Bahrain: Iranian drone struck residential area, 32 civilians injured',
        'Iran daily output: ~8 BMs + ~60 drones (near exhaustion of launchers)'
      ],
      proxy: { hezbollah_active: true, houthi_active: true, iraqi_militia_active: true },
      us_posture: 'sustained_operations',
      iran_posture: 'defiant_resistance',
      // Day 11: Near-total conventional destruction. Oil surge = economic war escalating.
      // France deployment signals NATO widening. Iran clinging to nuclear card.
      param_calibration: {
        escalation_propensity: 0.30,    // Iran exhausting conventional options
        iran_force_multiplier: 0.08,    // ~340 TELs destroyed, ~80-110 remain, production struck
        us_tech_advantage: 1.98,        // Striking production = eliminating rebuild capacity
        iran_asymmetric_factor: 0.35,   // Near-exhaustion of mobile launch capability
        proxy_effectiveness: 0.45,      // Proxies degrading without IRGC coordination or resupply
        cyber_intensity: 0.20,          // Minimal — infrastructure devastated
        hormuz_mining_probability: 0.10,// Almost no capability left
        oil_price_elasticity: -0.08,    // Oil surging to $120 — refinery/production strikes
        patriot_intercept_rate: 0.94,   // Peak optimization
      }
    }
  }
};
