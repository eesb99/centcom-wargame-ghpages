// tests/test-helper.js -- Load sim engine for testing
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..');

function readFile(file) {
  return fs.readFileSync(path.join(srcDir, file), 'utf8');
}

function loadSimEngine() {
  const DATA_FILES = [
    'src/data/mil-data.js', 'src/data/proxy-data.js', 'src/data/economic.js',
    'src/data/us-orbat.js', 'src/data/iran-orbat.js', 'src/data/econ-backfill.js',
    'src/data/conflict-timeline.js', 'src/data/diplomatic-events.js',
  ];
  const SIM_FILES = [
    'src/sim/constants.js', 'src/sim/rng.js', 'src/sim/simulation-state.js',
    'src/sim/sim-runner.js', 'src/sim/force-init.js', 'src/sim/combat.js',
    'src/sim/game-tree.js', 'src/sim/escalation.js', 'src/sim/cyber-model.js',
    'src/sim/proxy-model.js', 'src/sim/naval-air-model.js',
    'src/sim/economic-model.js', 'src/sim/sim-step.js', 'src/sim/scenarios.js',
  'src/sim/sensitivity.js',
  ];

  // Minimal DOM stubs
  globalThis.document = { getElementById: () => null };

  const allFiles = [...DATA_FILES, ...SIM_FILES];
  const code = allFiles.map(readFile).join('\n');

  // Wrap in a function that assigns to globalThis so class declarations are accessible
  const wrappedCode = `(function() {
${code}

// Export to globalThis
Object.assign(globalThis, {
  MIL_DATA, PROXY_DATA, ECON_DATA, US_ORBAT, IRAN_ORBAT, ECON_BACKFILL,
  CONFLICT_TIMELINE, DIPLOMATIC_EVENTS,
  mulberry32, setRngSeed, rngRandom, rngGauss, rngUniform, rngRandInt, rngChoice,
  safeInt, deepCopy,
  EscalationLevel, ESCALATION_LABELS,
  MilitaryUnit, EconomicState, CyberState, SimulationState,
  WarGameSimulation,
});
})();`;

  vm.runInThisContext(wrappedCode);
}

module.exports = { loadSimEngine };
