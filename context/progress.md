# CENTCOM War Game - Progress

## Phase Overview

| Phase | Status | Date | Progress |
|-------|--------|------|----------|
| Phase 1: Initial Deployment | Complete | 2026-03-05 | 100% |
| Phase 2: Diplomatic Momentum + OSINT Calibration | Complete | 2026-03-05 | 100% |
| Phase 2b: Daily Calibration Pipeline | Complete | 2026-03-05 | 100% |
| Phase 3: Professional-Grade Upgrade | Complete | 2026-03-05 | 100% |
| Phase 4: Validation Plan Fixes | Pending | - | 0% |

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
