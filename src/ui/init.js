// ═══════════════════════════════════════════════════════════════════
// LOCAL API REPLACEMENT (replaces all fetch() calls to backend)
// ═══════════════════════════════════════════════════════════════════
let activeSim = null;

function apiQuickRun(params, days) {
  const sim = new WarGameSimulation(params);
  const history = sim.run(days);
  return { history: history, final: history.length > 0 ? history[history.length - 1] : null };
}

function apiSimInit(params) {
  activeSim = new WarGameSimulation(params);
  const snapshot = activeSim._snapshot();
  return { status: 'initialized', state: snapshot, params: activeSim.params };
}

function apiSimStep() {
  if (!activeSim) return { error: 'No active simulation' };
  const snapshot = activeSim.step();
  return { status: 'stepped', state: snapshot };
}

function apiMonteCarlo(params, runs, days) {
  const sim = new WarGameSimulation(params);
  return sim.monteCarlo(runs, days);
}


// API constant removed — running locally

// ── State ──
let simHistory = [];
let currentDay = 0;
let mapMarkers = [];
let isPlaying = false;
let playbackInterval = null;
let timelineViewDay = -1; // -1 means "latest"
let isDarkTiles = true;

// ── Scenario tabs in top nav ──
const scenarios = [
  { id: 'epic_fury_day7', label: 'Epic Fury D7' },
  { id: 'epic_fury_day5', label: 'Epic Fury D5' },
  { id: 'epic_fury_day1', label: 'Epic Fury D1' },
  { id: 'pre_war', label: 'Pre-War' },
  { id: 'what_if_ground_invasion', label: 'Ground Invasion' },
  { id: 'limited', label: 'Limited Naval' },
  { id: 'escalatory', label: 'Escalatory' },
  { id: 'proxy', label: 'Proxy War' },
  { id: 'worst', label: 'Worst Case' },
];

function buildScenarioTabs() {
  const container = document.getElementById('scenario-tabs');
  const select = document.getElementById('scenario-select');
  
  scenarios.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'scenario-tab' + (s.id === select.value ? ' active' : '');
    btn.textContent = s.label;
    btn.dataset.scenario = s.id;
    btn.onclick = () => {
      document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      select.value = s.id;
      select.dispatchEvent(new Event('change'));
    };
    container.appendChild(btn);
  });
}

// ── Map Setup ──
