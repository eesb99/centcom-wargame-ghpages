# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CENTCOM War Game is a self-contained, single-file browser application (~395KB `index.html`) that simulates a US/Iran military conflict using real OSINT data. Created with Perplexity Computer. No build system, no dependencies to install, no backend.

## Running

```bash
open index.html  # macOS — opens in default browser
```

No build step, no server required. All logic runs client-side.

## Architecture

Everything lives in `index.html` (3713 lines), structured in this order:

### 1. CSS (~lines 29-730)
Dark theme with CSS custom properties in `:root`. Layout uses `position: fixed` overlays on a full-viewport Leaflet map: top nav, right sidebar (events/timeline/charts tabs), floating KPI cards, bottom timeline slider.

### 2. HTML (~lines 731-1085)
Semantic structure: `#map` div, `.topnav` with scenario tabs, `.right-sidebar` with three tab panels (events, timeline, charts), settings drawer, Monte Carlo modal, bottom timeline with play/pause and day slider.

### 3. Embedded OSINT Data (~lines 1087-1098)
Six large JSON objects inlined as `const` declarations:
- `MIL_DATA` — Military forces dataset (CSIS, IISS sources)
- `US_ORBAT` — US CENTCOM Order of Battle (unit-level)
- `IRAN_ORBAT` — Iranian military ORBAT
- `IRAN_MISSILES` — Iranian missile inventory with range/warhead data
- `IRAN_NUCLEAR` — Nuclear facilities (IAEA data)
- `ECON_BACKFILL` — Economic baselines (EIA oil, IMF GDP)

### 4. Simulation Engine (~lines 1100-2735)
Core classes and logic:
- **`MilitaryUnit`** (line 1181) — Individual unit with strength, attrition, missile fire
- **`EconomicState`** (line 1234) — Oil price, GDP impact, Hormuz flow tracking
- **`CyberState`** (line 1253) — Cyber warfare state
- **`SimulationState`** (line 1264) — Aggregates all state per simulation tick
- **`WarGameSimulation`** (line 1289) — Main simulation class:
  - `defaultParams()` — baseline parameters (force multipliers, escalation propensity, tech advantage, intercept rates)
  - `initForces()` — builds `MilitaryUnit` arrays from ORBAT data
  - Day-step simulation with Lanchester combat model, game-theoretic escalation (7 levels: Diplomatic Tensions through Nuclear), economic shock propagation, proxy/cyber warfare
  - Seeded PRNG (`mulberry32`) for reproducible runs

### 5. Scenario Presets (~lines 2737-2830)
`WarGameSimulation.SCENARIO_PRESETS` — five presets as static property:
- `pre_war` — Full Iranian military, diplomatic tensions
- `epic_fury_day1` — Opening strikes, high escalation propensity
- `epic_fury_day5` — Iran navy/AF destroyed, low escalation
- `epic_fury_day7` — Full air superiority, mop-up
- `ground_invasion` — Hypothetical US ground escalation

### 6. UI Layer (~lines 2830-3713)
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
- **Oil price model**: Hard-bounded to $80-125 range with Hormuz closure as primary driver. User-tunable via `oil_price_elasticity` parameter.

## Modification Tips

- To adjust simulation parameters: modify `defaultParams()` (line 1312) or scenario presets (line 2737)
- To add a new scenario: add entry to `WarGameSimulation.SCENARIO_PRESETS` and add a tab in `buildScenarioTabs()`
- To update OSINT data: replace the relevant `const` JSON object (lines 1089-1098)
- To modify map markers/animations: look for Leaflet `L.marker` and `L.circle` calls in the UI layer
- CSS design tokens are all in `:root` (line 33) for theming
