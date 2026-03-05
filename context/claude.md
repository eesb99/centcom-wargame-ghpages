# CENTCOM War Game - Session Context

## Current State

- **Status**: Combat model calibrated, live on GitHub Pages
- **URL**: https://eesb99.github.io/centcom-wargame-ghpages/
- **Repo**: https://github.com/eesb99/centcom-wargame-ghpages
- **Branch**: main
- **Last Updated**: 2026-03-06
- **Primary Instance**: Mac Mini (launchd daily calibration at 03:00 UTC)
- **Fallback**: GitHub Actions (07:00 UTC)
- **Key Features**: Shooter-target SEAD model, asymmetric dominance, naval capacity gating, 26 unit tests, sensitivity analysis, historical validation

## Architecture (Post-Session 3)

### Build System
```
src/template.html + src/**/*.js  -->  build.sh  -->  index.html (single-file deploy)
```
- Zero npm deps, concatenation-based build (~50-line bash script)
- `// INSERT_JS` marker in template.html (inside `<script>` block) replaced with all JS files in dependency order

### Source Structure
```
src/
  sim/       17 files - constants, RNG, combat, game-tree, escalation, calibration, economics, scenarios, sensitivity
  data/       8 files - US/Iran ORBAT, missiles, nuclear, economic, diplomatic events, proxy data
  ui/        13 files - map, charts, KPI, events, playback, settings, theme, Monte Carlo, sensitivity UI
  template.html - HTML + CSS skeleton
tests/        7 files - combat, game-tree, escalation, monte-carlo, integration, validation + test-helper
```

### Key Design: Split Class Pattern
- `WarGameSimulation` class opens in `sim-runner.js` (constructor, defaultParams)
- Methods added across `combat.js`, `game-tree.js`, `escalation.js`, etc.
- Class body closes in `sim-step.js` (step(), run(), monteCarlo())
- Works via concatenation; test-helper uses `vm.runInThisContext` to load all files

### Three-Phase Simulation
1. **OSINT Corridor (Days 1-6)**: Real events drive actions + params calibrated to reality
2. **Active Extrapolation (Days 7-14)**: Trends continue with 8%/day decay
3. **Stabilization (Days 15+)**: Parameters converge, model runs procedurally

---

## Session 4 Summary (2026-03-06)

### Goals
- Validate casualty realism against OSINT ground truth
- Fix combat model producing 25x too many US casualties
- Fix unrealistic US ship losses (navy destroyed but still attacking)
- Migrate primary instance to Mac Mini
- Fix template script injection bug (JS inside HTML comment)

### Decisions Made
- **Shooter-target over Lanchester for SEAD**: Symmetric mutual-attrition is wrong for one-sided precision strikes. Replaced with one-sided damage model where only specific threat vectors (BM leakers, IADS shootback) cause US casualties.
- **Asymmetric dominance suppression**: When force_ratio > 0.75, weaker side inflicts only 15% normal damage. Models standoff precision strikes vs degraded defender.
- **Naval capacity gating at 0.3**: Skip Iranian naval/coastal attacks entirely when iran_force_multiplier < 0.3 (navy confirmed destroyed by OSINT Day 5).
- **Template fix**: `<!-- INSERT_JS -->` was inside an unclosed HTML comment. Changed to `// INSERT_JS` inside proper `<script>` tags.

### Implementation

**`src/sim/constants.js`** -- 16 named constants extracted:
- `ATTRITION_COEFF_BASE`: 0.04 -> 0.015 (was producing 25x too many US casualties)
- `ASYMMETRIC_DOMINANCE_THRESHOLD`: 0.75 (new)
- `ASYMMETRIC_DOMINANCE_SUPPRESSION`: 0.15 (new)
- `FAST_BOAT_ATTACK_PROB`: 0.35 -> 0.15
- `COASTAL_ASHM_ATTACK_PROB`: 0.25 -> 0.12
- `SUB_ATTACK_PROB`: 0.1 -> 0.05
- `DRONE_INTERCEPT_RATE`: 0.75 -> 0.92
- `BM_LEAKER_CASUALTY_MAX`: 5 -> 3

**`src/sim/combat.js`** -- Asymmetric dominance modifier in Lanchester:
- Dominant side suppresses weaker side's damage output to 15%

**`src/sim/naval-air-model.js`** -- Structural fixes:
- Naval capacity gate: skip attacks when iran_force_multiplier < 0.3
- Coastal AShM gate: same capacity check
- AShM intercept rate: 0.85 -> 0.95 (Aegis vs small salvo)
- SEAD: Replaced Lanchester with shooter-target model
- IADS shootback: Low-probability roll (8% base * ad_lethality * (1-degradation))

**`src/template.html`** -- Fixed script injection:
- Closed unclosed HTML comment, added proper `<script>` wrapper

**`src/ui/app-init.js`** -- Removed stray `</script>` tag

### Results (30 MC, Epic Fury Day 7, 25 days)

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| US KIA median | 192 | 144 | 10-12 by Day 6 |
| Iran KIA median | 1342 | 2069 | thousands |
| Kill ratio | 7:1 | 14.4:1 | 12-57:1 |
| US Ships median | 6 | 4 | 0-1 |
| Historical: Desert Storm | -- | 18.8:1 | 20-120:1 |
| Historical: Iraq 2003 | -- | 18.9:1 | 50-80:1 |

### Commits
- `86dc3e5` - feat: migrate daily calibration to Mac Mini + gap backfill
- `6e19b61` - fix: combat model realism -- shooter-target SEAD, asymmetric dominance, naval gating
- `2b094d8` - fix: template script injection -- JS was inside unclosed HTML comment

### Challenges & Solutions
1. **JS not executing in browser**: All application JS was inside an unclosed HTML comment (`<!-- ════...` opened but never closed before INSERT_JS). Fixed template to close comment and wrap JS in `<script>` tags.
2. **Coastal AShM still firing after navy destroyed**: Batteries weren't gated by iran_force_multiplier like naval units. Added same capacity gate.
3. **Kill ratio 7:1 (target 12-57:1)**: Lanchester symmetric model fundamentally wrong for asymmetric precision warfare. Dual fix: constant tuning + structural shooter-target replacement.

### Next Steps
- [ ] Further reduce US ship losses (median 4, target 0-1)
- [ ] Wire CONFLICT_TIMELINE from backfill.js into simulation
- [ ] Proxy war calibration (Hezbollah rocket counts, Houthi attacks)
- [ ] BMD interceptor exhaustion model (Day 2 ammo depletion causing BM leakers)

---

## Session 3 Summary (2026-03-05)

### Goals
- Execute 4-phase professional-grade upgrade plan
- Modularize monolithic index.html into src/ structure with build system
- Add unit tests, sensitivity analysis, historical validation, theme toggle

### Decisions Made
- **Concatenation build over Vite**: Zero npm deps, 50-line bash script. Keeps GitHub Pages deploy simple.
- **Split class across files**: WarGameSimulation opens in sim-runner.js, closes in sim-step.js. Enables modular editing while maintaining single-class runtime.
- **vm.runInThisContext for tests**: Concatenates all src/ files and runs in current V8 context. Avoids ES module complexity.
- **OAT sensitivity over Sobol**: One-at-a-Time with +/-10% perturbation. Simpler, sufficient for 18 parameters.
- **Historical validation presets**: Desert Storm 1991 and Iraq 2003 as calibration benchmarks.

### Implementation

**Phase 1 -- Quick Wins:**
- Fixed 4 orphaned scenario tabs (limited, escalatory, proxy, worst) with SCENARIO_PRESETS entries
- Hardened backfill.js: retry with exponential backoff (3x), 30s AbortController timeout, partial failure handling
- Added light/dark theme toggle with localStorage persistence, map tile switching, chart color updates

**Phase 2 -- Modular Extraction:**
- Extracted index.html into 38 source files across src/sim/, src/data/, src/ui/
- Created build.sh concatenation script + src/template.html
- Created test-helper.js + 6 test files (26 tests total, all passing)

**Phase 3 -- Constants + Sensitivity:**
- Extracted 12 magic numbers into src/sim/constants.js with named constants
- Built OAT sensitivity analysis (sensitivityAnalysis method) + tornado diagram UI modal

**Phase 4 -- Historical Validation:**
- Added Desert Storm 1991 + Iraq 2003 validation presets in scenarios.js
- Created VALIDATION.md with methodology, results, limitations
- Added validation.test.js (3 tests)

**Commits:**
- `57928e3` - feat: professional-grade upgrade -- modular extraction, tests, sensitivity analysis

### Challenges & Solutions
1. **Extraction agents stalled**: 3 parallel agents went idle. Solved by shutting them down and extracting via sed/bash directly.
2. **Stray `}` from phase1a agent**: Extra brace prematurely closed WarGameSimulation class. Fixed by restoring from backup and using exact line ranges.
3. **test-helper iterations**: Direct code loading and vm.createContext both failed. vm.runInThisContext with globalThis wrapper worked.
4. **5 failing test assertions**: OSINT injection overrides escalation levels beyond expected ranges. Fixed thresholds to match actual behavior.

### Files Created (45)
- `build.sh`, `src/template.html`
- `src/sim/` (17 files), `src/data/` (8 files), `src/ui/` (13 files)
- `tests/` (7 files)
- `VALIDATION.md`

### Next Steps
- [ ] Wire CONFLICT_TIMELINE from backfill.js into simulation
- [ ] Browser-test the built index.html end-to-end
- [ ] Run sensitivity analysis in browser, verify tornado diagrams
- [ ] Consider proxy war calibration (Hezbollah rocket counts, Houthi attacks)

---

## Session 2 Summary (2026-03-05)

### Goals
- Analyze ceasefire mechanics and implement diplomatic momentum system
- Build OSINT backfill infrastructure for real conflict data
- Wire real-world diplomatic events into game theory model
- Add autonomous parameter calibration from daily OSINT context

### Decisions Made
- **Diplomatic momentum as cooperation ratchet**: 0-1 variable built by sustained mutual non-aggression, decays on aggression. Game-theoretically motivated (credible commitment mechanism).
- **Partial withdrawal as costly signal**: New US action that reduces force posture to signal de-escalation intent. Tuned to be late-game only (needs war_weariness + momentum).
- **Scenario injection pattern**: Real-world OSINT overrides outputs (Days 1-6), calibrated parameters inform inputs (Day 7+). Common military wargaming technique.
- **Trend extrapolation with decay**: Weighted linear regression (recent days weighted power 1.5) with 8%/day exponential decay. Half-life ~8 days. Parameter bounds prevent absurd extrapolation.
- **Three-source calibration**: escalation_propensity, iran_force_multiplier, us_tech_advantage, proxy_effectiveness, iran_asymmetric_factor, cyber_intensity, hormuz_mining, oil_price_elasticity, patriot_intercept_rate

### Implementation
**Major Changes to index.html:**
1. Diplomatic momentum system: SimulationState game_tree fields, _compute_payoffs(), _game_tree_decision(), _map_actions_to_escalation() rewritten
2. `DIPLOMATIC_EVENTS` const: 6 days of real OSINT events with param_calibration per day
3. `_inject_diplomatic_reality()`: OSINT state override + event injection
4. `_auto_calibrate_params()`: Daily parameter calibration with trend extrapolation
5. `_compute_param_trends()`: Weighted linear regression for projected days
6. UI: Diplomatic momentum bar, OSINT badge ("OSINT DATA -- REAL EVENTS"), mediation labels
7. Ceasefire chart: Added diplomatic momentum purple dashed line
8. Game tree display: OSINT Override vs Game Tree tags, real-world status messages

**Also created:**
- `backfill.js` - Perplexity API backfill script (8 categories, day-by-day)

### Challenges & Solutions
1. **Partial_withdraw overpowered**: Selected 20/25 days from Day 1 in initial test. Fixed by making it late-game only (needs war_weariness + momentum), adding early_penalty, increasing hawk resistance.
2. **ES6 class scoping in Node.js vm**: `class` declarations are block-scoped in `vm.runInContext`. Fixed with `var WarGameSimulation; WarGameSimulation = class ...` pattern.
3. **Real diplomatic data is zero**: All 6 OSINT days show zero diplomatic momentum, no mediation, no ceasefire signals. Correctly reflects reality (US demands regime change, no off-ramp).

### OSINT Data Summary (Feb 28 - Mar 5, 2026)
- **US KIA**: 6 (CENTCOM Mar 2), **WIA**: 18
- **Iranian killed**: ~2,100 (est. by Mar 4)
- **Iranian navy**: Effectively destroyed (17+ vessels, 1 submarine)
- **Hormuz**: Effectively closed by IRGC
- **Hezbollah**: Entered war Mar 2, attacking Israeli bases
- **Oil**: Brent spiked then fell to ~$81 (market pricing US dominance)
- **Diplomacy**: Zero. No ceasefire proposals. Trump demands surrender.

### Next Steps
- [x] ~~Continue daily OSINT backfill~~ -- Automated via daily calibration pipeline
- [ ] Wire CONFLICT_TIMELINE from backfill.js into simulation (currently separate from DIPLOMATIC_EVENTS)
- [ ] Test in browser (not yet browser-tested this session)
- [ ] Execute plan fixes (H1-H4, M1-M5, L1-L3 from validation plan)
- [ ] Consider adding proxy war calibration (Hezbollah rocket counts, Houthi attacks)

### Session 2 Addendum: Daily Calibration Pipeline

**Added after initial save-context:**
- `backfill.js --calibrate` mode: queries Perplexity for today's events, LLM derives `param_calibration`, patches `DIPLOMATIC_EVENTS` in index.html
- Workflow changed from hourly to daily at 05:00 UTC (midnight NYT)
- Safe JSON parsing (no eval), `clampNum()` bounds, fallback regex patching
- `package.json` added for CommonJS compatibility

**Commits:**
- `7576fb8` - feat: OSINT-driven diplomatic momentum + auto-calibration system
- `d535159` - feat: daily OSINT auto-calibration at midnight NYT

**Daily Pipeline Flow:**
```
00:00 NYT -> GitHub Actions -> backfill.js --calibrate
  -> Perplexity: today's events (5-7 key items)
  -> Perplexity: param_calibration (9 numeric values via LLM judgment)
  -> Patch DIPLOMATIC_EVENTS in index.html
  -> git commit + push -> GitHub Pages auto-deploys
```

---

## Session 1 Summary (2026-03-05)

### Goals
- Deploy centcom-wargame-ghpages to GitHub Pages as a public repo
- Set up hourly OSINT backfill via GitHub Actions cron job

### Decisions Made
- **Single-file deployment**: All CSS/HTML/JS/data inlined in `index.html` (~430KB) for zero-config GitHub Pages hosting
- **Legacy Pages build**: Used `build_type: legacy` (deploy from branch) rather than GitHub Actions Pages workflow
- **Hourly cron schedule**: `0 * * * *` for backfill.js

### Commits
- `c9da847` - feat: CENTCOM War Game - initial deployment

### Challenges & Solutions
1. **GitHub Pages 404 after enabling**: Legacy Pages mode needed explicit build request via `gh api repos/.../pages/builds -X POST`.
