# CENTCOM War Game - Progress

## Phase Overview

| Phase | Status | Date | Progress |
|-------|--------|------|----------|
| Phase 1: Initial Deployment | Complete | 2026-03-05 | 100% |
| Phase 2: Diplomatic Momentum + OSINT Calibration | Complete | 2026-03-05 | 100% |
| Phase 2b: Daily Calibration Pipeline | Complete | 2026-03-05 | 100% |
| Phase 3: Validation Plan Fixes | Pending | - | 0% |

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
