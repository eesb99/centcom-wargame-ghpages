function runSim() {
  const btn = document.getElementById('btn-run');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Running...';

  const params = getParams();
  
  // Use setTimeout to keep UI responsive
  setTimeout(() => {
    try {
      const data = apiQuickRun(params, params.max_days);
      if (data.history) {
        simHistory = data.history;
        updateAll(simHistory);
        setupTimeline();
      }
    } catch(e) {
      console.error('Simulation error:', e);
    }

    btn.disabled = false;
    btn.textContent = 'Run Full Simulation';
    
    // Close settings after run
    if (document.getElementById('settings-panel').classList.contains('active')) {
      toggleSettings();
    }
  }, 0);
}

function stepSim() {
  const params = getParams();
  if (simHistory.length === 0) {
    apiSimInit(params);
  }
  const data = apiSimStep();
  if (data.state) {
    simHistory.push(data.state);
    updateAll(simHistory);
    setupTimeline();
  }
}

function stepSimN(n) {
  const params = getParams();
  if (simHistory.length === 0) {
    apiSimInit(params);
  }
  for (let i = 0; i < n; i++) {
    const data = apiSimStep();
    if (data.state) simHistory.push(data.state);
  }
  updateAll(simHistory);
  setupTimeline();
}

function resetSim() {
  simHistory = [];
  currentDay = 0;
  timelineViewDay = -1;
  isPlaying = false;
  if (playbackInterval) clearInterval(playbackInterval);
  
  updateKPIs(null);
  updateCharts([]);
  updateEventLog([]);
  updateForceStatus(null);
  updateMissileInventory(null);
  document.getElementById('hdr-day').textContent = 'DAY 0';
  document.getElementById('hdr-escalation').textContent = 'DIPLOMATIC TENSIONS';
  document.getElementById('esc-label').textContent = '0 / 7';
  document.getElementById('esc-bar').style.width = '0%';
  document.getElementById('esc-name').textContent = 'Diplomatic Tensions';
  document.getElementById('timeline-slider').max = 0;
  document.getElementById('timeline-slider').value = 0;
  document.getElementById('timeline-day').textContent = 'DAY 0';
  document.getElementById('timeline-max').textContent = '/ 0';
  document.getElementById('timeline-esc').textContent = 'Diplomatic Tensions';
  document.getElementById('sidebar-updated').textContent = 'Ready';
  document.getElementById('events-empty').style.display = '';
  document.getElementById('play-icon').style.display = '';
  document.getElementById('pause-icon').style.display = 'none';
}

function runMonteCarlo() {
  document.getElementById('mc-modal').classList.add('active');
  document.getElementById('mc-content').innerHTML = '<div class="loading"><div class="spinner"></div> Running 100 simulations...</div>';

  const params = getParams();
  
  // Use setTimeout to keep UI responsive during heavy computation
  setTimeout(() => {
    try {
      const data = apiMonteCarlo(params, 100, params.max_days);
      renderMonteCarlo(data);
    } catch(e) {
      console.error('Monte Carlo error:', e);
      document.getElementById('mc-content').innerHTML = '<div style="color:var(--red)">Error: ' + e.message + '</div>';
    }
  }, 50);
}

function setupTimeline() {
  if (simHistory.length === 0) return;
  const slider = document.getElementById('timeline-slider');
  slider.max = simHistory.length - 1;
  slider.value = simHistory.length - 1;
  document.getElementById('timeline-max').textContent = `/ ${simHistory[simHistory.length - 1].day}`;
}

// ── Update Functions ──
function updateAll(history) {
  if (!history || history.length === 0) return;
  const latest = history[history.length - 1];
  currentDay = latest.day;

  updateKPIs(latest);
  updateCharts(history);
  updateEscalation(latest);
  updateEventLog(history);
  updateForceStatus(latest);
  updateMissileInventory(latest);
  updateGameTree(latest, history.length - 1);
  updateTimelineUI(latest);

  document.getElementById('hdr-day').textContent = `DAY ${latest.day}`;
  document.getElementById('hdr-escalation').textContent = latest.escalation_label.toUpperCase();
  document.getElementById('sidebar-updated').textContent = `Day ${latest.day} · ${new Date().toLocaleTimeString()}`;
}

