# CENTCOM War Game — US/Iran Conflict Simulation

Interactive full-spectrum conflict simulation with real OSINT data from IISS, CSIS, EIA, IAEA, IMF.

## Features

- **Lanchester combat model** with game-theoretic escalation dynamics
- **Full-spectrum conflict**: military, economic, cyber, proxy warfare
- **LiveUAMap-style** interactive map with Leaflet.js
- **5 scenario presets**: Pre-War, Epic Fury Day 1/5/7, Ground Invasion
- **Monte Carlo analysis** (100 simulation runs)
- **Research-grade data**: OSINT-backfilled military ORBAT, economic baselines
- **Fixed models**: Calibrated oil price ($80-125 range), nuclear threshold (cumulative→daily rate), casualty ratios (12-57:1 Iran:US)

## Scenario Presets

| Preset | Description |
|--------|-------------|
| Pre-War | Full Iranian military intact, diplomatic tensions |
| Epic Fury D1 | Feb 28, 2026: Opening strikes, Khamenei killed |
| Epic Fury D5 | Mar 4, 2026: Iran navy/AF destroyed, IADS neutralized |
| Epic Fury D7 | Mar 5, 2026: Full air superiority, mop-up phase |
| Ground Invasion | What-if: US escalates to ground invasion |

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push this folder to the `main` branch
3. Go to Settings → Pages → Deploy from branch → `main` → `/ (root)`
4. Your simulation will be live at `https://<username>.github.io/<repo>/`

## Tech Stack

- Single HTML file (~395KB, self-contained)
- Leaflet.js (map), Chart.js (charts), Inter + JetBrains Mono (fonts)
- All simulation logic runs client-side in JavaScript (no backend needed)
- 6 OSINT data files embedded as inline JavaScript objects

## Credits

Created with [Perplexity Computer](https://www.perplexity.ai/computer)
