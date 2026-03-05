function updateKPIs(s) {
  const OIL_BASELINE = 81.0;
  if (!s) {
    document.getElementById('kpi-oil').textContent = '$81.00';
    document.getElementById('kpi-oil-delta').textContent = 'Baseline';
    document.getElementById('kpi-oil-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-hormuz').textContent = '100%';
    document.getElementById('kpi-hormuz-delta').textContent = 'Normal';
    document.getElementById('kpi-hormuz-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-bam').textContent = '100%';
    document.getElementById('kpi-bam-delta').textContent = 'Normal';
    document.getElementById('kpi-bam-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-us-cas').textContent = '0';
    document.getElementById('kpi-us-cas-delta').textContent = '—';
    document.getElementById('kpi-us-cas-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-iran-cas').textContent = '0';
    document.getElementById('kpi-iran-cas-delta').textContent = '—';
    document.getElementById('kpi-iran-cas-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-cost').textContent = '$0.00';
    document.getElementById('kpi-cost-delta').textContent = '—';
    document.getElementById('kpi-cost-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-mines').textContent = '0';
    document.getElementById('kpi-mines-delta').textContent = '—';
    document.getElementById('kpi-mines-delta').className = 'kpi-delta neutral';
    document.getElementById('kpi-wrp').textContent = '1.0%';
    document.getElementById('kpi-wrp-delta').textContent = '—';
    document.getElementById('kpi-wrp-delta').className = 'kpi-delta neutral';
    return;
  }

  // Oil
  document.getElementById('kpi-oil').textContent = `$${s.oil_price.toFixed(2)}`;
  const oilDelta = ((s.oil_price - OIL_BASELINE) / OIL_BASELINE * 100).toFixed(1);
  setDelta('kpi-oil-delta', oilDelta, '%', true);

  // Hormuz
  document.getElementById('kpi-hormuz').textContent = `${s.hormuz_flow_pct.toFixed(0)}%`;
  const hDelta = (s.hormuz_flow_pct - 100).toFixed(0);
  const hEl = document.getElementById('kpi-hormuz-delta');
  hEl.textContent = hDelta != 0 ? `${hDelta}%` : 'Normal';
  hEl.className = 'kpi-delta ' + (hDelta < 0 ? 'down' : 'neutral');

  // Bab al-Mandeb
  const bamPct = s.bab_al_mandeb_flow_pct !== undefined ? s.bab_al_mandeb_flow_pct : 100;
  document.getElementById('kpi-bam').textContent = `${bamPct.toFixed(0)}%`;
  const bamDelta = (bamPct - 100).toFixed(0);
  const bamEl = document.getElementById('kpi-bam-delta');
  bamEl.textContent = bamDelta != 0 ? `${bamDelta}%` : 'Normal';
  bamEl.className = 'kpi-delta ' + (bamDelta < 0 ? 'down' : 'neutral');

  // Casualties
  document.getElementById('kpi-us-cas').textContent = s.casualties.us.toLocaleString();
  document.getElementById('kpi-us-cas-delta').textContent = s.ships_damaged ? `${s.ships_damaged.us} ships hit` : '—';
  document.getElementById('kpi-us-cas-delta').className = 'kpi-delta ' + (s.ships_damaged && s.ships_damaged.us > 0 ? 'down' : 'neutral');

  document.getElementById('kpi-iran-cas').textContent = s.casualties.iran.toLocaleString();
  const acLost = s.aircraft_lost ? s.aircraft_lost.iran : 0;
  document.getElementById('kpi-iran-cas-delta').textContent = acLost > 0 ? `${acLost} a/c lost` : '—';
  document.getElementById('kpi-iran-cas-delta').className = 'kpi-delta ' + (acLost > 0 ? 'down' : 'neutral');

  // Cost
  document.getElementById('kpi-cost').textContent = `$${s.us_cost_billion.toFixed(2)}`;
  const costEl = document.getElementById('kpi-cost-delta');
  costEl.textContent = `$${s.us_daily_cost_million.toFixed(0)}M/day`;
  costEl.className = 'kpi-delta ' + (s.us_daily_cost_million > 50 ? 'down' : 'neutral');

  // Mines
  const minesLaid = s.mines ? s.mines.laid : 0;
  const minesCleared = s.mines ? s.mines.cleared : 0;
  const minesActive = minesLaid - minesCleared;
  document.getElementById('kpi-mines').textContent = minesActive.toLocaleString();
  const minesEl = document.getElementById('kpi-mines-delta');
  minesEl.textContent = minesLaid > 0 ? `${minesCleared} cleared` : '—';
  minesEl.className = 'kpi-delta ' + (minesActive > 0 ? 'down' : 'neutral');

  // War Risk Premium
  const wrp = s.war_risk_premium_pct !== undefined ? s.war_risk_premium_pct : 1;
  document.getElementById('kpi-wrp').textContent = `${wrp.toFixed(1)}%`;
  const wrpEl = document.getElementById('kpi-wrp-delta');
  wrpEl.textContent = wrp > 1.5 ? 'Elevated' : 'Normal';
  wrpEl.className = 'kpi-delta ' + (wrp > 3 ? 'down' : wrp > 1.5 ? 'neutral' : 'neutral');
}

function setDelta(elId, val, suffix='', invert=false) {
  const el = document.getElementById(elId);
  const v = parseFloat(val);
  el.textContent = (v > 0 ? '+' : '') + val + suffix;
  el.className = 'kpi-delta ' + (v > 0 ? (invert ? 'down' : 'up') : v < 0 ? (invert ? 'up' : 'down') : 'neutral');
}

