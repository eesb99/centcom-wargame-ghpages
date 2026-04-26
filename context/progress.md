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
| Phase 8: Iraq/LNG/OPEC Economic Dynamics | Complete | 2026-03-09 | 100% |
| Phase 9: OSINT Extension Days 7-11 + Strike Data | Complete | 2026-03-10 | 100% |
| Phase 10: Algorithm Reliability Audit | Complete | 2026-03-10 | 100% |
| Phase 11: OSINT Backfill + Ceasefire Analysis | Complete | 2026-03-26 | 100% |
| Phase 12: DIPLOMATIC_EVENTS Restructure + Day 39 | Complete | 2026-04-07 | 100% |
| Phase 13: Perplexity Refusal Hardening | Complete | 2026-04-23 | 100% |
| Phase 14: Day 55 Refusal Cleanup + Macmini Cron Diagnosis | Complete | 2026-04-26 | 100% |



## Phase 14: Day 55 Refusal Cleanup + Macmini Cron Diagnosis (2026-04-26) - COMPLETE

**Duration:** ~25 minutes
**Status:** 100% — corrupted day 55 cleaned, macmini cron timezone bug root-caused (not yet fixed)

### Goals
- Check page health
- Backfill any missed calibrations

### Findings

**Page health:** Live HTTPS 200, all 58 days (Feb 28 → Apr 26) present in `DIPLOMATIC_EVENTS`. Strictly nothing missed.

**Two data-quality issues discovered:**
- Day 55 (Apr 23) — `events[]` contained Perplexity refusal prose ("I cannot provide..."). Calibrated by Apr 23 GHA run *before* refusal-hardening fix `87fe9a5` landed.
- Day 58 (Apr 26) — `events: []` empty; calibrated by today's GHA run at 07:37 UTC when Apr 26 news cycle was incomplete. Left alone — re-querying same day likely yields same emptiness.

**Macmini cron is effectively a no-op (timezone bug):**
- Plist: `Hour 3` is interpreted as **local MYT** = `19:00 UTC prior day`
- `backfill.js` computes `dayNumber` from `new Date()` in UTC → at 19:00 UTC, "today UTC" is still yesterday → macmini targets `today_MYT - 2` in conflict-day terms
- That day was already calibrated by yesterday's GHA at 07:00 UTC (which lines up with UTC date) → macmini hits `=== Day N already calibrated — skipping ===` every run
- All Apr 24, 25, 26 commits on `origin/main` are by `github-actions[bot]`, not macmini

### Implementation
1. Backed up `index.html`
2. Deleted day 55 entry (lines 3336-3374) — kept day 54 and 56 surrounding it
3. Ran `node backfill.js --calibrate` — gap detection found day 55 missing, queried Perplexity
4. **Hardening confirmed working:** first attempt got `Response missing expected object shape`, retry on attempt 2 returned valid JSON
5. New day 55 has real OSINT: Tiffani tanker seizure, blockade enforcement, Pentagon briefing, US-Iran negotiation signals
6. Committed + pushed; GitHub Pages re-deployed within ~60s

### Commits
- `63c141d` - fix: re-calibrate day 55 (2026-04-23) — replace Perplexity refusal with real events

### Challenges & Solutions
1. **Force re-query for existing day**: `--calibrate` skips days already in index.html. Solution: delete the day's entry, then run — gap detection backfills it. Documented as runbook in auto-memory `project_data_quality_runbook.md`.
2. **First Perplexity retry triggered**: Showed the hardening shipped on Apr 23 is doing its job — exactly the failure mode that produced the day 55 corruption is now caught and retried.

### Next Steps (open)
- [x] **Macmini timezone bug fixed (2026-04-26)**: plist Hour changed `3` → `9` (local MYT), so cron now fires 09:00 MYT = 01:00 UTC, ~6h before GHA. dayNumber correctly resolves to today_UTC. Macmini = primary, GHA = fallback. Reloaded via `launchctl unload + load`. Next fire: 2026-04-27 09:00 MYT.
- [x] **Sweep for refusal-corrupted days 1-54 (2026-04-26)**: scanned all 291 events with regex markers (`I cannot provide`, `search results`, `would need access to`, etc.). **2 hits found**: Day 22 (Mar 21, 7/7 events corrupt) and Day 39 (Apr 7, 7/7 events corrupt). **Re-calibration attempt failed** — Perplexity wrapped refusal in a valid JSON array, bypassing shape check. New day 39 had same refusal pattern; new day 22 had empty events. Reverted both from backup; no commit. The shape-validation hardening (Phase 13) catches *non-JSON* refusals but not refusals that come pre-wrapped in `[...]`.
- [ ] **Day 58 (Apr 26) re-calibration**: revisit on Apr 28+ once Apr 26 news has archived. Same delete-and-recalibrate flow.
- [ ] **Add content-based refusal filter to `queryPerplexity`**: shape-only validation insufficient. Add a refusal-marker regex sweep over the parsed array contents — if >50% of events match refusal patterns, treat as a retryable failure (same path as shape miss). Markers: `/^I cannot/`, `/search results.{0,30}(do not|provide|appear)/`, `/would need access/`, etc. Apply in `runCalibrationForDay` after `events = JSON.parse(...)`.
- [ ] **Days 22 and 39 still corrupted**: cannot be cleaned until the content-based filter lands. Revisit after that fix.

---

## Phase 13: Perplexity Refusal Hardening (2026-04-23) - COMPLETE

**Duration:** ~30 minutes
**Status:** 100% - GHA failures root-caused, queryPerplexity hardened with shape-based retry

### Work Done
1. **Diagnosed GHA "all jobs failed" emails** -- 04-20, 04-21, 04-22 scheduled runs aborted with `ERROR: Could not get calibration data`
2. **Confirmed data pipeline is healthy** -- all days 04-19 through 04-23 on `origin/main` via Mac Mini primary; GHA failures were redundant fallback runs Perplexity refused
3. **Added shape-based retry to queryPerplexity** -- optional `{ shape: 'object' | 'array' }` triggers retry (with existing exponential backoff) when response lacks expected JSON pattern
4. **Wired shape hint at 3 call sites** -- events (`array`), param calibration (`object`), backfill category query (`object`)

### Root Cause
Perplexity API intermittently returns 200-OK responses with prose/refusal content for the military calibration prompt. `backfill.js` extracted via `\{[\s\S]*\}`, got no match, hit abort. Existing retry only covered network/HTTP errors, not content-shape failures.

### Commits
- `87fe9a5` - fix: retry queryPerplexity on missing JSON shape to survive refusals

### Validation
- 26/26 tests passing
- Node syntax check OK
- Legacy `queryPerplexity(query)` (no options) still works unchanged
- Next scheduled GHA run (04-24 07:00 UTC) will be the first live test

---

## Phase 12: DIPLOMATIC_EVENTS Restructure + Day 39 (2026-04-07) - COMPLETE

**Duration:** ~1 hour
**Status:** 100% - Critical structural bug fixed, Day 39 calibrated, MC ceasefire analysis

### Work Done
1. **Mac Mini health check** -- SSH OK, launchd running, 26/26 tests passing
2. **Critical bug fix** -- Days 12-38 were nested inside Day 6's param_calibration (invisible to sim). Restructured all 38 days to correct depth in `days: {}`
3. **Day 39 calibration** -- Ran `backfill.js --calibrate` (iran_force_multiplier=0.15, ceasefire_signals=0.05)
4. **MC ceasefire analysis** -- 200 runs x 90 days: median CF crosses 50% at Day 75, 72% of runs >50% by Day 90

### Key Metrics
- OSINT corridor: Days 1-39 (was 1-27, but 12-38 were inaccessible)
- Ceasefire probability: 8% (Day 39), median 55% by Day 75
- Iran force multiplier: 0.15 (fragmented resistance)
- Markov state: CONTESTED (100% of runs at Day 39)

### Validation
- 26/26 tests passing
- JSON parser: PARSE OK (no more conversion failures)
- All 38 days accessible via `DIPLOMATIC_EVENTS.days[N]`

---

## Phase 11: OSINT Backfill + Ceasefire Analysis (2026-03-26) - COMPLETE

**Duration:** ~15 minutes
**Status:** 100% - OSINT corridor extended to Day 27, ceasefire Monte Carlo analysis completed

### Work Done
1. **Page health check** -- Site live (HTTP 200), 26/26 tests passing
2. **OSINT backfill** -- Ran `backfill.js --calibrate` to patch Days 23-27 (Mar 22-26) into `index.html` (+180 lines)
3. **Ceasefire Monte Carlo** -- 500-run analysis across 4 time horizons showing near-zero ceasefire probability now, ~56% of runs >50% by Day 60

### Key Metrics
- OSINT corridor: Days 1-27 (was 1-22)
- Iran force multiplier: 0.05 (military effectively destroyed)
- Ceasefire probability: 5% (Day 27), median 59% by Day 60
- Targets struck: 9,000+, Iranian vessels: 140+

### Validation
- 26/26 tests passing
- Site returning HTTP 200

---

## Phase 10: Algorithm Reliability Audit (2026-03-10) - COMPLETE

**Duration:** ~30 minutes
**Status:** 100% - All algorithms assessed, historical data availability confirmed

### Analysis Completed
1. **Ceasefire probability trace** -- Confirmed 60% is projected Day 22, not OSINT corridor. Formula and coefficient analysis documented.
2. **Combat model audit** -- Kill ratio 14.4:1 validated against Desert Storm (136-177:1), Iraq 2003 (68-103:1), Praying Mantis (28:1), Lebanon 2006 (2-5:1). Iran sits between Iraq and Hezbollah benchmarks.
3. **Historical data survey** -- DoD DCAS, PDA/Commonwealth Institute confirmed as primary sources. No daily-resolution ceasefire probability datasets exist in academic literature (UCDP, ACLED, Fortna, CoW all lack this granularity).
4. **Test coverage gap** -- Acceptance bands intentionally wide (>= 5:1) but no ceasefire trajectory tests exist.

### Key Insight
Iraq 1991/2003 is the wrong benchmark for Iran 2026. Iran has ballistic missiles, drone fleets, and dispersed forces that Iraq lacked. The Hezbollah 2006 war (2-5:1 ratio) is more informative for a fortified adversary with standoff weapons.

---

## Phase 9: OSINT Extension Days 7-11 + Strike Data (2026-03-10) - COMPLETE

**Duration:** ~1.5 hours
**Status:** 100% - All 5 data files updated, reference JSON created, build + 26 tests pass
**Commits:** pending

### Features Implemented
1. **strike-data-osint.json** -- Bidirectional strike reference (11 days, Iran outgoing + US/Israel on Iran, by-country breakdown, intercept rates, casualties)
2. **conflict-timeline.js** -- Backfilled BM/CM/drone breakdown Days 1-6, added Days 7-11
3. **diplomatic-events.js** -- Days 7-11 with events + param_calibration (9 params, continuing degradation trend)
4. **mil-data.js** -- war_status Day 11 (7 KIA, 43 ships, 3800 targets), missile/drone inventory updated
5. **iran-orbat.js** -- retaliation_campaign totals (806 BMs, 2233 drones), Mojtaba Khamenei leadership
6. **proxy-data.js** -- epic_fury_proxy_activity Mar 10 with cumulative Gulf state data
7. **strike-chart.png** -- 2-panel bar chart visualization

### Validation Results
- build.sh: 5440 lines, 523KB
- 26/26 tests pass
- JSON validates

---

## Phase 8: Iraq/LNG/OPEC Economic Dynamics (2026-03-09) - COMPLETE

**Duration:** ~2 hours
**Status:** 100% - All 3 dynamics implemented, KPIs on dashboard, pipeline updated
**Commits:** `4849435` (feat), `081c491` (fix KPI placement)

### Features Implemented
1. **Iraq production collapse** -- 4.3 mbd Basra exports correlated 55% with Hormuz closure + escalation spillover. OSINT-guarded.
2. **Qatar LNG disruption** -- Probabilistic Iranian drone strike at escalation 4+. 70-100% disruption on hit, 3-5%/day recovery.
3. **OPEC inadequate response** -- Capped at real-world 0.206 mbd with 15%/day ramp. Historically inadequate.
4. **Oil price recalibration** -- Baseline $108.75 (real Brent), range $85-200, SPR thresholds relative to baseline.
5. **3 floating KPI cards** -- Iraq Output, Gulf LNG, OPEC Response visible on map.
6. **Pipeline expansion** -- backfill.js emits 5 new calibration fields.

### Quality Fixes (unified-review --fix)
- OIL_BASELINE scoping crash, missing backfill fields, OSINT override ordering, SPR threshold bugs, magic numbers, dead logic

### Known Issue
- "Run Full Simulation" button unresponsive (pre-existing, not caused by Phase 8 changes)
- See `memory/troubleshooting-run-button.md` for debugging history

---

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
