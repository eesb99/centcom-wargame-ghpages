// src/sim/constants.js -- Named simulation constants
// Extracted from hardcoded values throughout the simulation engine.
// Changing these values changes model behavior -- see VALIDATION.md for calibration rationale.

// ── Combat Model ──
const ATTRITION_COEFF_BASE = 0.015;  // reduced from 0.04; was producing ~25x too many US casualties
const ATTRITION_COEFF_NOISE = 0.01;  // reduced from 0.025 to match lower base
const MORALE_DAMAGE_RATE = 0.003;
const PLATFORM_LOSS_DIVISOR = 15;
const PLATFORM_LOSS_THRESHOLD = 8;
// Asymmetric dominance: when force_ratio > this threshold, the weaker side
// can barely inflict damage (standoff precision strikes vs. degraded defender)
const ASYMMETRIC_DOMINANCE_THRESHOLD = 0.75;
const ASYMMETRIC_DOMINANCE_SUPPRESSION = 0.15; // weaker side does only 15% of normal damage

// ── Naval / Air Constants ──
const DRONE_INTERCEPT_RATE = 0.92;          // real-world >90% (Israel April 2024: 99%)
const NAVAL_CAPACITY_GATE = 0.3;            // skip naval attacks if iran_force_multiplier below this
const FAST_BOAT_ATTACK_PROB = 0.15;         // reduced from 0.35; Iran fast boats rarely reach US ships
const COASTAL_ASHM_ATTACK_PROB = 0.12;      // reduced from 0.25; batteries suppressed by SEAD
const SUB_ATTACK_PROB = 0.05;               // reduced from 0.1; ASW dominance
const STRIKE_CASUALTY_BASE = 30;            // base Iran KIA per strike package (shooter-target)
const STRIKE_CASUALTY_NOISE = 50;           // max additional randomness
const IADS_SHOOTBACK_PROB = 0.08;           // prob of US aircraft loss per SEAD package
const BM_LEAKER_CASUALTY_MAX = 3;           // reduced from 5; most leakers hit empty terrain

// ── Game Tree / War Weariness ──
const WAR_WEARINESS_RATE = 0.005;
const WAR_WEARINESS_CAP = 0.7;
const US_CASUALTY_COST_DIVISOR = 800;
const US_CASUALTY_COST_CAP = 0.8;
const ECONOMIC_COST_DIVISOR = 80;
const ECONOMIC_COST_CAP = 0.4;

// ── Escalation / Calibration ──
const TREND_DECAY_RATE = 0.92;

// ── Economic Model ──
const OIL_PRICE_MIN = 80;
const OIL_PRICE_MAX = 125;
