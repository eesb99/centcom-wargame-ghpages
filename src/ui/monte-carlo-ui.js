function renderMonteCarlo(data) {
  const el = document.getElementById('mc-content');
  if (!data || data.error) {
    el.innerHTML = `<div style="color:var(--red)">Error: ${data?.error || 'Unknown'}</div>`;
    return;
  }

  const escDist = data.escalation_distribution || {};
  const maxCount = Math.max(...Object.values(escDist), 1);
  const colors = ['#3fb950', '#3fb950', '#d29922', '#d29922', '#f0883e', '#f85149', '#f85149', '#bc8cff'];

  let distHTML = '';
  Object.entries(escDist).forEach(([label, count], i) => {
    const pct = (count / data.runs * 100).toFixed(0);
    distHTML += `<div class="mc-bar-row">
      <div class="mc-bar-label">${label}</div>
      <div class="mc-bar"><div class="mc-bar-fill" style="width:${count/maxCount*100}%;background:${colors[i % colors.length]}"></div></div>
      <div class="mc-bar-count">${pct}%</div>
    </div>`;
  });

  const safeStat = (obj, field) => obj && obj[field] !== undefined ? obj[field] : 'N/A';

  el.innerHTML = `
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">${data.runs} simulations completed</div>
    <div class="mc-grid">
      <div class="mc-stat">
        <div class="mc-stat-label">Oil Price (Median)</div>
        <div class="mc-stat-value" style="color:var(--yellow)">$${safeStat(data.oil_price_outcomes, 'median')}</div>
        <div class="mc-stat-range">P5: $${safeStat(data.oil_price_outcomes, 'p5')} — P95: $${safeStat(data.oil_price_outcomes, 'p95')}</div>
      </div>
      <div class="mc-stat">
        <div class="mc-stat-label">US Casualties (Median)</div>
        <div class="mc-stat-value" style="color:var(--blue)">${safeStat(data.us_casualties, 'median')}</div>
        <div class="mc-stat-range">P5: ${safeStat(data.us_casualties, 'p5')} — P95: ${safeStat(data.us_casualties, 'p95')}</div>
      </div>
      <div class="mc-stat">
        <div class="mc-stat-label">Iran Casualties (Median)</div>
        <div class="mc-stat-value" style="color:var(--red)">${safeStat(data.iran_casualties, 'median')}</div>
        <div class="mc-stat-range">P5: ${safeStat(data.iran_casualties, 'p5')} — P95: ${safeStat(data.iran_casualties, 'p95')}</div>
      </div>
      <div class="mc-stat">
        <div class="mc-stat-label">US Cost $B (Median)</div>
        <div class="mc-stat-value" style="color:var(--orange)">$${safeStat(data.us_cost_billions, 'median')}</div>
        <div class="mc-stat-range">P5: $${safeStat(data.us_cost_billions, 'p5')} — P95: $${safeStat(data.us_cost_billions, 'p95')}</div>
      </div>
      <div class="mc-stat">
        <div class="mc-stat-label">Nuclear Event Prob</div>
        <div class="mc-stat-value" style="color:var(--purple)">${data.nuclear_probability !== undefined ? (data.nuclear_probability * 100).toFixed(1) : 'N/A'}%</div>
        <div class="mc-stat-range">${data.nuclear_probability !== undefined ? Math.round(data.nuclear_probability * data.runs) : '?'} of ${data.runs} runs</div>
      </div>
      <div class="mc-stat">
        <div class="mc-stat-label">Civilian Casualties</div>
        <div class="mc-stat-value" style="color:var(--orange)">${safeStat(data.civilian_casualties, 'median')}</div>
        <div class="mc-stat-range">P5: ${safeStat(data.civilian_casualties, 'p5')} — P95: ${safeStat(data.civilian_casualties, 'p95')}</div>
      </div>
    </div>
    <div class="mc-dist">
      <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">Peak Escalation Distribution</div>
      ${distHTML}
    </div>
  `;
}

// ── Theme Toggle ──
