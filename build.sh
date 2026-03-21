#!/bin/bash
# build.sh -- Concatenate src/ modules into index.html
set -e
cd "$(dirname "$0")"

# Collect all JS source files in dependency order
JS_FILES=(
  # Data layer
  src/data/mil-data.js
  src/data/proxy-data.js
  src/data/economic.js
  src/data/us-orbat.js
  src/data/iran-orbat.js
  src/data/econ-backfill.js
  src/data/conflict-timeline.js
  src/data/diplomatic-events.js
  # Sim engine
  src/sim/constants.js
  src/sim/rng.js
  src/sim/simulation-state.js
  src/sim/sim-runner.js
  src/sim/force-init.js
  src/sim/combat.js
  src/sim/game-tree.js
  src/sim/escalation.js
  src/sim/cyber-model.js
  src/sim/proxy-model.js
  src/sim/naval-air-model.js
  src/sim/economic-model.js
  src/sim/sim-step.js
  src/sim/scenarios.js
  src/sim/sensitivity.js
  # UI layer
  src/ui/init.js
  src/ui/map.js
  src/ui/charts.js
  src/ui/settings.js
  src/ui/playback.js
  src/ui/kpi.js
  src/ui/chart-updates.js
  src/ui/game-tree-ui.js
  src/ui/events.js
  src/ui/monte-carlo-ui.js
  src/ui/sensitivity-ui.js
  src/ui/theme.js
  src/ui/app-init.js
)

# Build: insert concatenated JS into template at INSERT_JS marker
TMPFILE=$(mktemp)
while IFS= read -r line; do
  if [[ "$line" == *"INSERT_JS"* ]]; then
    for js in "${JS_FILES[@]}"; do
      cat "$js"
      echo ""
    done
  else
    echo "$line"
  fi
done < src/template.html > "$TMPFILE"

mv "$TMPFILE" index.html
echo "Built index.html: $(wc -l < index.html) lines ($(wc -c < index.html | tr -d ' ') bytes)"
