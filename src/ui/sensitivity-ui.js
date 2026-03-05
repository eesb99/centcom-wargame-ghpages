// src/ui/sensitivity-ui.js -- Tornado diagram modal for sensitivity analysis

function openSensitivityModal() {
  let modal = document.getElementById('sensitivity-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sensitivity-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:var(--surface-solid);border-radius:var(--radius);padding:24px;width:90vw;max-width:900px;max-height:90vh;overflow-y:auto;border:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="font-family:var(--font-mono);font-size:16px;color:var(--accent);">Sensitivity Analysis (OAT +/-10%)</h2>
          <button onclick="closeSensitivityModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;">&times;</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;" id="sens-metric-buttons"></div>
        <div id="sens-status" style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px;margin-bottom:8px;"></div>
        <canvas id="sens-tornado" height="400"></canvas>
      </div>`;
    document.body.appendChild(modal);

    const metrics = ['iran_casualties', 'us_casualties', 'oil_price', 'nuclear_probability', 'escalation_peak'];
    const btnContainer = modal.querySelector('#sens-metric-buttons');
    for (const m of metrics) {
      const btn = document.createElement('button');
      btn.textContent = m.replace(/_/g, ' ');
      btn.className = 'nav-btn';
      btn.style.cssText = 'font-size:11px;padding:4px 10px;';
      btn.onclick = () => runSensitivity(m);
      btnContainer.appendChild(btn);
    }
  }
  modal.style.display = 'flex';
  // Auto-run with default metric
  runSensitivity('iran_casualties');
}

function closeSensitivityModal() {
  const modal = document.getElementById('sensitivity-modal');
  if (modal) modal.style.display = 'none';
}

let sensChart = null;

function runSensitivity(metric) {
  const status = document.getElementById('sens-status');
  status.textContent = `Running sensitivity analysis for ${metric}... (this may take a moment)`;

  // Use setTimeout to allow UI to update
  setTimeout(() => {
    const params = getParams();
    const result = WarGameSimulation.sensitivityAnalysis(params, metric, 15, 3);

    // Take top 12 most influential parameters
    const top = result.parameters.slice(0, 12);
    const labels = top.map(p => p.param.replace(/_/g, ' '));
    const loDeltas = top.map(p => p.lo_delta);
    const hiDeltas = top.map(p => p.hi_delta);

    const canvas = document.getElementById('sens-tornado');
    if (sensChart) sensChart.destroy();

    const style = getComputedStyle(document.documentElement);
    sensChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '-10%', data: loDeltas, backgroundColor: style.getPropertyValue('--blue').trim() },
          { label: '+10%', data: hiDeltas, backgroundColor: style.getPropertyValue('--red').trim() },
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: { display: true, text: `Tornado: ${metric.replace(/_/g, ' ')} (base: ${result.base_metric.toFixed(1)})`, color: style.getPropertyValue('--text').trim() },
          legend: { labels: { color: style.getPropertyValue('--text-muted').trim() } },
        },
        scales: {
          x: {
            ticks: { color: style.getPropertyValue('--text-muted').trim() },
            grid: { color: style.getPropertyValue('--border').trim() },
            title: { display: true, text: 'Delta from baseline', color: style.getPropertyValue('--text-muted').trim() },
          },
          y: {
            ticks: { color: style.getPropertyValue('--text-muted').trim(), font: { size: 10 } },
            grid: { display: false },
          },
        },
      },
    });

    status.textContent = `${metric}: baseline=${result.base_metric.toFixed(1)}, top driver=${top[0]?.param || 'none'} (swing=${top[0]?.swing.toFixed(1) || 0})`;
  }, 50);
}
