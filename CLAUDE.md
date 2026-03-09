# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CENTCOM War Game is a self-contained, single-file browser application (~493KB `index.html`) that simulates a US/Iran military conflict using real OSINT data. Created with Perplexity Computer. No build system, no dependencies to install, no backend.

## Running

```bash
open index.html  # macOS — opens in default browser
```

No build step, no server required. All logic runs client-side.

## Architecture

Everything lives in `index.html` (~5500 lines), structured in this order:

### 1. CSS (~lines 29-730)
Dark theme with CSS custom properties in `:root`. Layout uses `position: fixed` overlays on a full-viewport Leaflet map: top nav, right sidebar (events/timeline/charts tabs), floating KPI cards, bottom timeline slider.

### 2. HTML (~lines 731-1085)
Semantic structure: `#map` div, `.topnav` with scenario tabs, `.right-sidebar` with three tab panels (events, timeline, charts), settings drawer, Monte Carlo modal, bottom timeline with play/pause and day slider.

### 3. Embedded OSINT Data (~lines 1215-1660)
Seven large JSON objects plus one growing object inlined as `const` declarations:
- `MIL_DATA` (line 1215) — Military forces dataset (CSIS, IISS sources)
- `PROXY_DATA` (line 1217) — Iranian proxy forces and alliance networks
- `US_ORBAT` (line 1221) — US CENTCOM Order of Battle (unit-level)
- `IRAN_ORBAT` (line 1223) — Iranian military ORBAT
- `ECON_BACKFILL` (line 1225) — Economic baselines (EIA oil, IMF GDP)
- `CONFLICT_TIMELINE` (line 1227) — Operation Epic Fury day-by-day timeline
- `DIPLOMATIC_EVENTS` (line 1232) — Real-world diplomatic/escalation events (auto-updated daily by calibration pipeline)

Note: `IRAN_MISSILES` and `IRAN_NUCLEAR` were removed; missile data is now embedded in `IRAN_ORBAT` and nuclear data in `MIL_DATA`.

### 4. Simulation Engine (~lines 1540-3855)
Constants, helpers, and core classes:
- **`MilitaryUnit`** (line 1661) — Individual unit with strength, attrition, missile fire
- **`EconomicState`** (line 1714) — Oil price, GDP impact, Hormuz flow tracking
- **`CyberState`** (line 1733) — Cyber warfare state
- **`SimulationState`** (line 1744) — Aggregates all state per simulation tick
- **`WarGameSimulation`** (line 1785) — Main simulation class:
  - `defaultParams()` (line 1837) — baseline parameters (force multipliers, escalation propensity, tech advantage, intercept rates)
  - `initForces()` — builds `MilitaryUnit` arrays from ORBAT data
  - Day-step simulation with Lanchester combat model, game-theoretic escalation (7 levels: Diplomatic Tensions through Nuclear), economic shock propagation, proxy/cyber warfare
  - Seeded PRNG (`mulberry32`) for reproducible runs

### 5. Scenario Presets (~line 3857)
`WarGameSimulation.SCENARIO_PRESETS` — five presets as static property:
- `pre_war` — Full Iranian military, diplomatic tensions
- `epic_fury_day1` — Opening strikes, high escalation propensity
- `epic_fury_day5` — Iran navy/AF destroyed, low escalation
- `epic_fury_day7` — Full air superiority, mop-up
- `ground_invasion` — Hypothetical US ground escalation

### 6. UI Layer (~lines 4242-5497)
- **Map** — Leaflet.js with military unit markers, strike animations, range circles
- **Charts** — Chart.js (oil price, casualties, force strength, escalation over time)
- **Monte Carlo** — `runMonteCarlo()` runs 100 simulations, renders statistical summary (median, P5/P95 for casualties, oil, costs, nuclear probability)
- **Playback** — Day-by-day timeline with play/pause, slider scrubbing
- Auto-selects "Epic Fury Day 7" preset on page load

## Key Design Decisions

- **Single-file deployment**: All CSS, HTML, JS, and data inlined for zero-config GitHub Pages hosting. External dependencies (Leaflet, Chart.js, Google Fonts) loaded via CDN.
- **Seeded PRNG**: `mulberry32` ensures Monte Carlo runs are reproducible given the same seed.
- **Escalation model**: 7 discrete levels (0-7) with cumulative probability thresholds. Nuclear threshold uses daily rate, not cumulative, to prevent unrealistic escalation.
- **Casualty ratios**: Calibrated to 12-57:1 Iran:US based on historical asymmetric conflict data.
- **Oil price model**: Hard-bounded to $85-200 range (realistic per ECON_BACKFILL scenario projections) with Hormuz closure as primary driver. Baseline: $108.75 (Brent, Mar 9 2026). User-tunable via `oil_price_elasticity` parameter.

## Modification Tips

- To adjust simulation parameters: search for `static defaultParams()` or `SCENARIO_PRESETS`
- To add a new scenario: add entry to `WarGameSimulation.SCENARIO_PRESETS` and add a tab in `buildScenarioTabs()`
- To update OSINT data: replace the relevant `const` JSON object (search for the constant name, e.g. `const MIL_DATA`)
- To modify map markers/animations: look for Leaflet `L.marker` and `L.circle` calls in the UI layer
- CSS design tokens are all in `:root` for theming

## Daily Calibration Pipeline

The `DIPLOMATIC_EVENTS` object is auto-updated by a daily pipeline:

- **Script**: `backfill.js --calibrate`
- **Schedule**: Launchd job `com.eesb99.centcom-calibrate` runs at 3AM daily
- **What it does**: Queries Perplexity for latest OSINT, derives `param_calibration` overrides, patches `DIPLOMATIC_EVENTS` in `index.html`, commits and pushes to GitHub Pages
- **Key detail**: `DIPLOMATIC_EVENTS` uses JS syntax (single-quoted strings, unquoted numeric keys); `backfill.js` converts JS-to-JSON before parsing. See project memory for known parsing edge cases.
