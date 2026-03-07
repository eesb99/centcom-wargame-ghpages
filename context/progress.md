# CENTCOM War Game - Progress

## Phase Overview

| Phase | Status | Date | Progress |
|-------|--------|------|----------|
| Phase 1: Initial Deployment | Complete | 2026-03-05 | 100% |
| Phase 2: Diplomatic Momentum + OSINT Calibration | Complete | 2026-03-05 | 100% |
| Phase 2b: Daily Calibration Pipeline | Complete | 2026-03-05 | 100% |
| Phase 3: Professional-Grade Upgrade | Complete | 2026-03-05 | 100% |
| Phase 4: Combat Model Calibration | Complete | 2026-03-06 | 100% |
| Phase 4b: Template Script Fix | Complete | 2026-03-06 | 100% |
| Phase 5: Mac Mini Migration | Complete | 2026-03-06 | 100% |
| Phase 6: Political Pressure Model | Complete | 2026-03-06 | 100% |
| Phase 7: Duplicate Day Fix + Pipeline Hardening | Complete | 2026-03-07 | 100% |



## Phase 7: Duplicate Day Fix + Pipeline Hardening (2026-03-07) - COMPLETE

**Duration:** ~30 minutes
**Status:** 100% - Live site restored, pipeline hardened
**Commits:** `af6f31f` (fix duplicate + guard), `cedb7ff` (fix regex)

### Problem
3AM calibration on 2026-03-06 ran twice for Day 7, inserting a duplicate entry via the fallback inserter. The duplicate had unquoted keys and no comma separator, causing a JS syntax error that killed the live site. Additionally, the JSON.parse path was permanently broken by `'without mercy'` inner quotes, forcing all future days through the fragile fallback.

### Fixes
1. **Removed duplicate Day 7** from index.html (34 lines), fixed Day 8 unquoted key + missing comma
2. **Duplicate guard** in `patchDiplomaticEventsFallback()` using `getExistingDayNumbers()`
3. **Value-position single-quote regex** -- only converts `'...'` to `"..."` after `:`, `,`, or `[`, preventing inner quotes like `'without mercy'` from breaking JSON.parse

### Validation
- DIPLOMATIC_EVENTS evaluates as valid JS with days 1-8
- JSON.parse succeeds on converted text (was failing before regex fix)
- `backfill.js --calibrate --dry-run` runs correctly, targets Day 9
- Pushed to GitHub Pages, site restored

---

## Phase 6: Political Pressure Model (2026-03-06) - COMPLETE

**Duration:** ~1.5 hours
**Status:** 100% - All 4 features implemented, tested, deployed
**Commits:** `8a7608a` (feat), `6644d9a` (merge)
**Branch:** feat/political-pressure-model -> main

### Problem
Game-theoretic model was too militarily determined. Linear war weariness (day * 0.005), economic pressure capped at 0.12, and no coalition politics meant simulations produced outcomes driven by force ratios, underweighting political factors that historically drive de-escalation.

### Features Implemented
1. **Nonlinear War Weariness** -- Replaced linear model with compound shocks: casualty thresholds (50/100 US, 200/500 civilian), oil price >$120. Models "CNN effect" of focusing events.
2. **Amplified Economic Pressure** -- 3-factor model: direct cost + oil price spike + Hormuz closure. Max raised from 0.12 to 0.8. Creates Hormuz->oil->economy feedback loop.
3. **Coalition Pressure Index** -- New state variable (0-1) with daily accumulation (+0.008), event spikes (casualty/civilian/oil), War Powers Resolution 60-day congressional authorization clock. Day log events at 0.3/0.6 thresholds.
4. **UI Indicator Bars** -- War weariness, economic pressure, coalition pressure bars + congressional authorization status in game tree panel.

### Files Modified
- `index.html` -- 122 insertions, 6 deletions (constants, state, payoffs, UI)
- `backfill.js` -- 1 insertion (coalition_pressure in calibration)

### Validation Results (Headless Node.js, 65-day Epic Fury Day 1)
- War weariness: Both casualty shock thresholds triggered (US cas=214 by day 10)
- Economic pressure: 0.229 at day 10 (exceeds old 0.12 cap), driven by Hormuz closure
- Coalition pressure: Reaches 1.0 by day 20 (fast ramp from casualty spikes)
- Congressional auth: Correctly lapses at day 60 (escalation=0)
- Political events: 2 day log events fire (coalition mounting day 7, congress lapsed day 60)
- Behavioral shift: 82% negotiate across 65 days, 100% negotiate/withdraw days 30-60
- Ceasefire probability crosses 50% by day 25

### Diagram
- Updated architecture diagram: `2026-03-06_wargame_algorithms_v2.d2` (D2, dark theme)
- Added "Political Pressure Engine [NEW]" section with 3 sub-components

---

## Phase 5: Mac Mini Migration (2026-03-06) - COMPLETE

**Status:** 100% - Primary instance running on Mac Mini
- Repo cloned at `~/Claude/projects/centcom-wargame-ghpages` on Mac Mini
- launchd agent `com.eesb99.centcom-calibrate` runs daily at 03:00 UTC
- GitHub Actions offset to 07:00 UTC as fallback
- Mac Mini uses fish shell; launchd plist uses `/opt/homebrew/bin/bash` explicitly

---

## Phase 4b: Template Script Fix (2026-03-06) - COMPLETE

**Commit:** `2b094d8`
- `<!-- INSERT_JS -->` was inside unclosed HTML comment -- all JS treated as comment
- Fixed: closed comment, added `<script>` wrapper, removed stray `</script>` from app-init.js

---

## Phase 4: Combat Model Calibration (2026-03-06) - COMPLETE

**Duration:** ~2 hours
**Status:** 100% - Kill ratio 14.4:1, all 26 tests passing
**Commit:** `6e19b61`

### Changes
1. Reduced ATTRITION_COEFF_BASE 0.04->0.015 (25x US casualty inflation fix)
2. Added asymmetric dominance: force_ratio>0.75 suppresses weaker side to 15%
3. Replaced Lanchester SEAD with shooter-target model
4. Naval/coastal capacity gating at iran_force_multiplier<0.3
5. Raised drone intercept 0.75->0.92, AShM intercept 0.85->0.95
6. Extracted 16 named constants from hardcoded values

### Validation
- Kill ratio: 7:1 -> 14.4:1 (target 12-57:1)
- Desert Storm: 18.8:1, Iraq 2003: 18.9:1
- 26/26 tests passing

---

## Phase 2: Diplomatic Momentum + OSINT Calibration (2026-03-05) - COMPLETE

**Duration:** ~2 hours
**Status:** 100% - Implemented and tested (Node.js vm, not yet browser-tested)
**Commits:** Pending (uncommitted changes in index.html)

### Features Implemented
1. **Diplomatic momentum system** - Cooperation ratchet (0-1), mediation activation, partial_withdraw action
2. **DIPLOMATIC_EVENTS data** - 6 days of real OSINT events (Feb 28 - Mar 5) with param_calibration
3. **OSINT scenario injection** - _inject_diplomatic_reality() overrides game tree state with ground truth
4. **Auto-calibration** - _auto_calibrate_params() tunes 9 parameters daily from OSINT
5. **Trend extrapolation** - Weighted linear regression with 8%/day decay for projected days
6. **UI enhancements** - OSINT badge, diplomatic momentum bar, mediation labels, ceasefire chart line
7. **backfill.js** - Perplexity API backfill script (8 categories)

### Validation Results
- Node.js vm test: 25-day simulation runs cleanly
- OSINT days (1-6): All parameters correctly calibrated from real data
- Trend extrapolation: Parameters converge by Day 15+ (iran_fm -> 0.02, esc_prop -> 0.23)
- Brace balance: OK (0)
- Diplomatic momentum: Zero for all OSINT days (matches reality)

### Metrics
- Lines added to index.html: ~350 (DIPLOMATIC_EVENTS + injection + calibration + UI)
- Parameters calibrated: 9 per day
- OSINT events ingested: 33 events across 6 days
- Trend decay half-life: ~8 days

---

## Phase 3: Professional-Grade Upgrade (2026-03-05) - COMPLETE

**Duration:** ~3 hours
**Status:** 100% - All 4 sub-phases implemented, 26/26 tests passing
**Commits:** 1 commit (57928e3)

### Features Implemented
1. **Phase 1A**: Fixed 4 orphaned scenario tabs (limited, escalatory, proxy, worst)
2. **Phase 1B**: Hardened backfill.js with retry/timeout/partial-failure handling
3. **Phase 1C**: Light/dark theme toggle with localStorage persistence
4. **Phase 2**: Extracted index.html into 38 modular src/ files + build.sh
5. **Phase 3A**: Named constants (12 magic numbers -> src/sim/constants.js)
6. **Phase 3B**: OAT sensitivity analysis + tornado diagram UI
7. **Phase 4A**: Desert Storm 1991 + Iraq 2003 validation presets
8. **Phase 4B**: VALIDATION.md documentation

### Files Created (45)
- `build.sh` - concatenation build script
- `src/template.html` - HTML+CSS skeleton
- `src/sim/` - 17 simulation engine files
- `src/data/` - 8 OSINT data files
- `src/ui/` - 13 UI component files
- `tests/` - 7 test files (26 tests)
- `VALIDATION.md` - historical validation document

### Validation Results
- 26/26 tests passing (`node --test tests/*.test.js`)
- build.sh produces working index.html
- All 9 scenario tabs functional
- Seeded runs reproducible

### Metrics
- Source files: 38 (from 1 monolithic index.html)
- Test coverage: combat, game-tree, escalation, monte-carlo, integration, validation
- Named constants: 12
- Sensitivity parameters: 18
- Validation scenarios: 2 (Desert Storm, Iraq 2003)

---

## Phase 2b: Daily Calibration Pipeline (2026-03-05) - COMPLETE

**Duration:** ~30 minutes
**Status:** 100% - Pipeline deployed, tested locally
**Commits:** 1 commit (d535159)

### Features Implemented
- `backfill.js --calibrate` mode with 2-step Perplexity query (events + param calibration)
- LLM-as-analyst: Perplexity interprets daily OSINT and returns 9 numeric parameters
- Safe DIPLOMATIC_EVENTS patching (JSON.parse, no eval, clamped bounds, fallback regex)
- GitHub Actions workflow: daily at 05:00 UTC (midnight NYT), manual dispatch with mode selector
- `package.json` for CommonJS compatibility

### Validation Results
- Local dry-run: code path executes correctly (API auth expected to fail with test key)
- Syntax check: backfill.js passes `node -c`
- Workflow security: uses env vars for inputs per GitHub Actions best practices

---

## Phase 1: Initial Deployment (2026-03-05) - COMPLETE

**Duration:** ~15 minutes
**Status:** 100% - Deployed and live
**Commits:** 1 commit (c9da847)

### Features Implemented
- Public GitHub repo created (eesb99/centcom-wargame-ghpages)
- GitHub Pages deployment from main branch
- Hourly OSINT backfill workflow via GitHub Actions
- Perplexity API key stored as repo secret

### Validation Results
- Site live at https://eesb99.github.io/centcom-wargame-ghpages/
- Manual workflow dispatch triggered
- Pages build completed successfully after explicit build request

### Metrics
- Files: 5 committed
- Total app size: ~430KB (single-file)
- External deps: Leaflet.js, Chart.js (CDN)
