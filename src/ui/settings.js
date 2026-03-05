const paramBindings = [
  { slider: 'param-escalation', display: 'val-escalation' },
  { slider: 'param-us-force', display: 'val-us-force' },
  { slider: 'param-iran-force', display: 'val-iran-force' },
  { slider: 'param-proxy', display: 'val-proxy' },
  { slider: 'param-cyber', display: 'val-cyber' },
  { slider: 'param-asymmetric', display: 'val-asymmetric' },
  { slider: 'param-tech', display: 'val-tech' },
  { slider: 'param-nuke', display: 'val-nuke' },
  { slider: 'param-days', display: 'val-days' },
];
paramBindings.forEach(b => {
  const s = document.getElementById(b.slider);
  s.addEventListener('input', () => {
    document.getElementById(b.display).textContent =
      b.slider === 'param-days' ? s.value : parseFloat(s.value).toFixed(2);
  });
});

// Scenario presets
document.getElementById('scenario-select').addEventListener('change', (e) => {
  const presets = {
    epic_fury_day7: { 'param-escalation': 0.15, 'param-us-force': 1.35, 'param-iran-force': 0.15, 'param-proxy': 0.35, 'param-cyber': 0.98, 'param-asymmetric': 0.6, 'param-tech': 2.2, 'param-nuke': 0.005, 'param-days': 25, _preset: 'epic_fury_day7' },
    epic_fury_day5: { 'param-escalation': 0.2, 'param-us-force': 1.3, 'param-iran-force': 0.25, 'param-proxy': 0.5, 'param-cyber': 0.95, 'param-asymmetric': 0.8, 'param-tech': 2.0, 'param-nuke': 0.01, 'param-days': 30, _preset: 'epic_fury_day5' },
    epic_fury_day1: { 'param-escalation': 0.9, 'param-us-force': 1.2, 'param-iran-force': 0.85, 'param-proxy': 0.7, 'param-cyber': 0.9, 'param-asymmetric': 1.3, 'param-tech': 1.8, 'param-nuke': 0.05, 'param-days': 35, _preset: 'epic_fury_day1' },
    pre_war: { 'param-escalation': 0.5, 'param-us-force': 1.0, 'param-iran-force': 1.0, 'param-proxy': 0.7, 'param-cyber': 0.5, 'param-asymmetric': 1.3, 'param-tech': 1.5, 'param-nuke': 0.05, 'param-days': 90, _preset: 'pre_war' },
    what_if_ground_invasion: { 'param-escalation': 0.95, 'param-us-force': 1.5, 'param-iran-force': 0.3, 'param-proxy': 0.7, 'param-cyber': 0.9, 'param-asymmetric': 1.3, 'param-tech': 2.0, 'param-nuke': 0.15, 'param-days': 120, _preset: 'what_if_ground_invasion' },
    limited: { 'param-escalation': 0.3, 'param-us-force': 1.0, 'param-iran-force': 1.0, 'param-proxy': 0.4, 'param-cyber': 0.3, 'param-asymmetric': 1.3, 'param-tech': 1.5, 'param-nuke': 0.02, 'param-days': 60 },
    escalatory: { 'param-escalation': 0.8, 'param-us-force': 1.2, 'param-iran-force': 1.0, 'param-proxy': 0.8, 'param-cyber': 0.7, 'param-asymmetric': 1.3, 'param-tech': 1.5, 'param-nuke': 0.1, 'param-days': 90 },
    proxy: { 'param-escalation': 0.4, 'param-us-force': 0.8, 'param-iran-force': 0.8, 'param-proxy': 1.0, 'param-cyber': 0.5, 'param-asymmetric': 1.5, 'param-tech': 1.3, 'param-nuke': 0.03, 'param-days': 120 },
    worst: { 'param-escalation': 0.95, 'param-us-force': 1.0, 'param-iran-force': 1.3, 'param-proxy': 1.0, 'param-cyber': 0.9, 'param-asymmetric': 1.6, 'param-tech': 1.4, 'param-nuke': 0.15, 'param-days': 90 },
  };
  const p = presets[e.target.value];
  if (!p) return;
  Object.entries(p).forEach(([k, v]) => {
    if (k === '_preset') return;
    const el = document.getElementById(k);
    if (el) { el.value = v; el.dispatchEvent(new Event('input')); }
  });
  // Sync scenario tabs
  document.querySelectorAll('.scenario-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.scenario === e.target.value);
  });
});

// ── UI Helpers ──
function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const btn = document.getElementById('btn-settings');
  const isOpen = panel.classList.contains('active');
  panel.classList.toggle('active');
  overlay.classList.toggle('active');
  btn.classList.toggle('active');
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));
  // Resize charts when switching to charts tab
  if (tabId === 'charts') {
    setTimeout(() => {
      forceChart.resize();
      econChart.resize();
      casualtyChart.resize();
      missileChart.resize();
    }, 50);
  }
  if (tabId === 'gametree') {
    setTimeout(() => {
      payoffChart.resize();
      ceasefireChart.resize();
    }, 50);
  }
}

function togglePanel(id) {
  const el = document.getElementById(id);
  el.classList.toggle('collapsed');
}

// ── Timeline Slider ──
document.getElementById('timeline-slider').addEventListener('input', (e) => {
  const day = parseInt(e.target.value);
  if (simHistory.length > 0 && day >= 0 && day < simHistory.length) {
    timelineViewDay = day;
    const state = simHistory[day];
    updateKPIs(state);
    updateEscalation(state);
    updateForceStatus(state);
    updateMissileInventory(state);
    updateGameTree(state, day);
    updateTimelineUI(state);
    // Show events up to this day
    updateEventLogForDay(day);
  }
});

function updateTimelineUI(state) {
  if (!state) return;
  document.getElementById('timeline-day').textContent = `DAY ${state.day}`;
  document.getElementById('timeline-esc').textContent = state.escalation_label;
}

function updateEventLogForDay(dayIdx) {
  const history = simHistory.slice(0, dayIdx + 1);
  updateEventLog(history);
}

// ── Playback ──
function togglePlayback() {
  if (simHistory.length === 0) return;
  isPlaying = !isPlaying;
  document.getElementById('play-icon').style.display = isPlaying ? 'none' : '';
  document.getElementById('pause-icon').style.display = isPlaying ? '' : 'none';
  
  if (isPlaying) {
    const slider = document.getElementById('timeline-slider');
    let current = parseInt(slider.value);
    if (current >= simHistory.length - 1) current = 0;
    
    playbackInterval = setInterval(() => {
      current++;
      if (current >= simHistory.length) {
        current = simHistory.length - 1;
        togglePlayback();
        return;
      }
      slider.value = current;
      slider.dispatchEvent(new Event('input'));
    }, 400);
  } else {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
}

// ── Simulation API ──
function getParams() {
  const scenarioSelect = document.getElementById('scenario-select');
  const presetValue = scenarioSelect ? scenarioSelect.value : 'custom';
  const params = {
    escalation_propensity: parseFloat(document.getElementById('param-escalation').value),
    us_force_multiplier: parseFloat(document.getElementById('param-us-force').value),
    iran_force_multiplier: parseFloat(document.getElementById('param-iran-force').value),
    proxy_effectiveness: parseFloat(document.getElementById('param-proxy').value),
    cyber_intensity: parseFloat(document.getElementById('param-cyber').value),
    iran_asymmetric_factor: parseFloat(document.getElementById('param-asymmetric').value),
    us_tech_advantage: parseFloat(document.getElementById('param-tech').value),
    nuclear_threshold_probability: parseFloat(document.getElementById('param-nuke').value),
    max_days: parseInt(document.getElementById('param-days').value),
  };
  if (presetValue && presetValue !== 'custom') {
    params.scenario_preset = presetValue;
  }
  return params;
}

// apiPost removed — using local simulation engine

