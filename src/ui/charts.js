const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, labels: { color: '#8b949e', font: { size: 8, family: "'Inter'" }, boxWidth: 8, padding: 4 } } },
  scales: {
    x: { ticks: { color: '#545d68', font: { size: 8 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.03)' } },
    y: { ticks: { color: '#545d68', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.03)' } }
  },
  animation: { duration: 300, easing: 'easeOutQuart' },
  elements: { point: { radius: 0, hoverRadius: 2 }, line: { tension: 0.3, borderWidth: 1.5 } },
};

const forceChart = new Chart(document.getElementById('chart-force'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'US Force %', data: [], borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', fill: true },
      { label: 'Iran Force %', data: [], borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.1)', fill: true },
    ]
  },
  options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 100 } } }
});

const econChart = new Chart(document.getElementById('chart-econ'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Brent $/bbl', data: [], borderColor: '#d29922', backgroundColor: 'rgba(210,153,34,0.1)', fill: true, yAxisID: 'y' },
      { label: 'Hormuz %', data: [], borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.05)', fill: false, yAxisID: 'y1' },
      { label: 'Bab al-Mandeb %', data: [], borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.05)', fill: false, yAxisID: 'y1', borderDash: [4,3] },
    ]
  },
  options: {
    ...chartDefaults,
    scales: {
      x: chartDefaults.scales.x,
      y: { ...chartDefaults.scales.y, position: 'left', title: { display: true, text: '$/bbl', color: '#545d68', font: { size: 8 } } },
      y1: { ...chartDefaults.scales.y, position: 'right', min: 0, max: 100,
        title: { display: true, text: 'Flow %', color: '#545d68', font: { size: 8 } },
        grid: { drawOnChartArea: false } }
    }
  }
});

const casualtyChart = new Chart(document.getElementById('chart-casualties'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'US', data: [], borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', fill: true },
      { label: 'Iran', data: [], borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.1)', fill: true },
      { label: 'Civilian', data: [], borderColor: '#f0883e', backgroundColor: 'rgba(240,136,62,0.1)', fill: true },
      { label: 'Proxy', data: [], borderColor: '#d29922', backgroundColor: 'rgba(210,153,34,0.05)', fill: false, borderDash: [4,3] },
    ]
  },
  options: chartDefaults
});

const missileChart = new Chart(document.getElementById('chart-missiles'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'US TLAM', data: [], borderColor: '#58a6ff', fill: false },
      { label: 'US JASSM', data: [], borderColor: '#22d3ee', fill: false, borderDash: [4,3] },
      { label: 'Iran BM', data: [], borderColor: '#f85149', fill: false },
      { label: 'Iran Drones', data: [], borderColor: '#f0883e', fill: false, borderDash: [4,3] },
      { label: 'Iran Mines', data: [], borderColor: '#bc8cff', fill: false, borderDash: [2,2] },
    ]
  },
  options: {
    ...chartDefaults,
    scales: {
      x: chartDefaults.scales.x,
      y: { ...chartDefaults.scales.y, min: 0, title: { display: true, text: 'Remaining', color: '#545d68', font: { size: 8 } } }
    }
  }
});

// ── Game Tree Charts ──
const payoffChart = new Chart(document.getElementById('chart-payoffs'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'US Payoff', data: [], borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', fill: true },
      { label: 'Iran Payoff', data: [], borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.1)', fill: true },
    ]
  },
  options: {
    ...chartDefaults,
    scales: {
      x: chartDefaults.scales.x,
      y: { ...chartDefaults.scales.y, title: { display: true, text: 'Payoff', color: '#545d68', font: { size: 8 } } }
    }
  }
});

const ceasefireChart = new Chart(document.getElementById('chart-ceasefire'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Ceasefire %', data: [], borderColor: '#3fb950', backgroundColor: 'rgba(63,185,80,0.15)', fill: true },
      { label: 'Escalation', data: [], borderColor: '#f0883e', backgroundColor: 'rgba(240,136,62,0.05)', fill: false, borderDash: [4,3], yAxisID: 'y1' },
      { label: 'Diplo Momentum %', data: [], borderColor: '#a371f7', backgroundColor: 'rgba(163,113,247,0.10)', fill: true, borderDash: [2,2] },
      { label: 'Markov State', data: [], borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0)', fill: false, borderWidth: 1, pointRadius: 3, pointStyle: 'rectRot', pointBackgroundColor: [], yAxisID: 'y1', segment: { borderDash: [2,2] } },
    ]
  },
  options: {
    ...chartDefaults,
    scales: {
      x: chartDefaults.scales.x,
      y: { ...chartDefaults.scales.y, min: 0, max: 100, position: 'left', title: { display: true, text: 'Probability %', color: '#545d68', font: { size: 8 } } },
      y1: { ...chartDefaults.scales.y, min: 0, max: 7, position: 'right', title: { display: true, text: 'Level', color: '#545d68', font: { size: 8 } }, grid: { drawOnChartArea: false } }
    }
  }
});

// ── Parameter Binding ──
