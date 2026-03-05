// src/sim/constants.js -- Named simulation constants
// Extracted from hardcoded values throughout the simulation engine.
// Changing these values changes model behavior -- see VALIDATION.md for calibration rationale.

// ── Combat Model ──
const ATTRITION_COEFF_BASE = 0.04;
const ATTRITION_COEFF_NOISE = 0.025;
const MORALE_DAMAGE_RATE = 0.003;
const PLATFORM_LOSS_DIVISOR = 15;
const PLATFORM_LOSS_THRESHOLD = 8;

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
