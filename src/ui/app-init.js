// ── Initialize ──
initTheme();
buildScenarioTabs();

// Fix map size after layout settles (map is now position:fixed)
setTimeout(() => map.invalidateSize(), 100);

// Auto-select Epic Fury Day 5 preset on page load
(function() {
  const sel = document.getElementById('scenario-select');
  if (sel && sel.value === 'epic_fury_day7') {
    sel.dispatchEvent(new Event('change'));
  }
})();
