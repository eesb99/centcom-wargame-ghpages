# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CENTCOM War Game simulates a US/Iran military conflict using real OSINT data (IISS, CSIS, EIA, IMF). Modular vanilla JS source files are concatenated by `build.sh` into a single `index.html` (~5500 lines) for zero-config GitHub Pages hosting. No npm, no bundler -- just bash concatenation. External deps (Leaflet.js, Chart.js) loaded via CDN.

## Commands

```bash
# Build
bash build.sh              # Concatenates src/ -> index.html, prints line/byte count

# Run
open index.html            # macOS — opens in default browser (no server needed)

# Test
node --test tests/*.test.js       # Run all tests (26 tests, Node.js test runner)
node --test tests/combat.test.js  # Run a single test file

# Calibration
node backfill.js --calibrate      # Daily OSINT: query Perplexity, patch DIPLOMATIC_EVENTS in index.html
node backfill.js --dry-run        # Query without patching
node backfill.js --patch          # Apply conflict_timeline.json to index.html
```

## Architecture

### Source Structure (`src/`)

Three layers, concatenated in dependency order by `build.sh`:

| Layer | Files | Purpose |
|-------|-------|---------|
| `src/data/` (8 files) | `mil-data.js`, `us-orbat.js`, `iran-orbat.js`, `proxy-data.js`, `economic.js`, `econ-backfill.js`, `conflict-timeline.js`, `diplomatic-events.js` | OSINT datasets as `const` JS objects |
| `src/sim/` (17 files) | `constants.js`, `rng.js`, `simulation-state.js`, `sim-runner.js`, `force-init.js`, `combat.js`, `game-tree.js`, `escalation.js`, `cyber-model.js`, `proxy-model.js`, `naval-air-model.js`, `economic-model.js`, `sim-step.js`, `scenarios.js`, `sensitivity.js` | Simulation engine |
| `src/ui/` (13 files) | `init.js`, `map.js`, `charts.js`, `settings.js`, `playback.js`, `kpi.js`, `chart-updates.js`, `game-tree-ui.js`, `events.js`, `monte-carlo-ui.js`, `sensitivity-ui.js`, `theme.js`, `app-init.js` | Leaflet map, Chart.js, playback controls |

### Build System

`build.sh` reads `src/template.html`, finds the `INSERT_JS` marker inside the `<script>` block, and replaces it with all JS files concatenated in the order listed in `JS_FILES` array. The output is `index.html`.

### Split-Class Pattern

`WarGameSimulation` is split across two files due to the concatenation build:
- `src/sim/sim-runner.js` — Opens the class: constructor, `defaultParams()`, `_validateParams()`, `run()`
- `src/sim/sim-step.js` — Adds `step()` and all sub-methods as prototype assignments to the open class

Other sim files (`combat.js`, `escalation.js`, `game-tree.js`, etc.) add methods the same way. The class is only complete after all sim files are concatenated.

### Test Infrastructure

Tests use Node.js built-in test runner (`node:test`) with zero external deps. `tests/test-helper.js` loads the sim engine by:
1. Reading all data + sim source files
2. Wrapping them in an IIFE
3. Running via `vm.runInThisContext` to populate `globalThis`

This avoids ES modules -- the source uses `var`/`const` at file scope (not `export`), so `vm.runInThisContext` with the globalThis wrapper is the only way to make classes available to tests.

## Key Design Decisions

- **Seeded PRNG**: `mulberry32` in `src/sim/rng.js` ensures reproducible Monte Carlo runs
- **Escalation model**: 7 discrete levels (0-7). Nuclear threshold uses daily rate, not cumulative, to prevent unrealistic escalation
- **Casualty ratios**: Calibrated to 12-57:1 Iran:US (historical asymmetric conflict data)
- **Oil price model**: Bounded $85-200, baseline $108.75 (Brent, Mar 2026), Hormuz closure as primary driver
- **OSINT injection**: `DIPLOMATIC_EVENTS` overrides game tree decisions for known conflict days; trend extrapolation for projected days

## Modification Guide

- **Simulation parameters**: `src/sim/sim-runner.js` (`defaultParams()`) or `src/sim/scenarios.js` (presets)
- **Add a scenario**: Add to `SCENARIO_PRESETS` in `src/sim/scenarios.js`, add tab in `src/ui/init.js` (`buildScenarioTabs()`)
- **Update OSINT data**: Edit the relevant file in `src/data/`, then run `bash build.sh`
- **CSS theming**: Custom properties in `:root` inside `src/template.html`
- **Combat constants**: `src/sim/constants.js` (16 named constants including `ATTRITION_COEFF_BASE`)

## Daily Calibration Pipeline

`DIPLOMATIC_EVENTS` is auto-updated daily:

- **Primary**: Mac Mini launchd (`com.eesb99.centcom-calibrate`) at 03:00 UTC
- **Fallback**: GitHub Actions (`.github/workflows/backfill.yml`) at 07:00 UTC
- **Script**: `node backfill.js --calibrate` queries Perplexity API, derives `param_calibration` overrides, patches `DIPLOMATIC_EVENTS` directly in `index.html`

**Critical**: `--calibrate` patches `index.html` in-place. Never run `build.sh` after `--calibrate` -- it regenerates `index.html` from `src/` and overwrites the patches. Correct CI order: `git pull -> calibrate -> git add -> commit -> push`.

`DIPLOMATIC_EVENTS` uses JS syntax (single-quoted strings, unquoted numeric keys); `backfill.js` converts to JSON before parsing.
