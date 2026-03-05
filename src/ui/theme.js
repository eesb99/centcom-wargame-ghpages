const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.dataset.theme !== 'light';
  html.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', html.dataset.theme);
  updateThemeIcons();
  updateMapTiles();
  updateChartColors();
}

function updateThemeIcons() {
  const isLight = document.documentElement.dataset.theme === 'light';
  document.getElementById('theme-sun').style.display = isLight ? 'block' : 'none';
  document.getElementById('theme-moon').style.display = isLight ? 'none' : 'block';
}

function updateMapTiles() {
  if (!darkTiles || !map) return;
  const isLight = document.documentElement.dataset.theme === 'light';
  darkTiles.setUrl(isLight ? LIGHT_TILES : DARK_TILES_URL);
}

function updateChartColors() {
  const style = getComputedStyle(document.documentElement);
  const textMuted = style.getPropertyValue('--text-muted').trim();
  const borderColor = style.getPropertyValue('--border').trim();

  const charts = [forceChart, econChart, casualtyChart, missileChart];
  for (const chart of charts) {
    if (!chart) continue;
    if (chart.options.scales) {
      for (const axis of Object.values(chart.options.scales)) {
        if (axis.ticks) axis.ticks.color = textMuted;
        if (axis.grid) axis.grid.color = borderColor;
        if (axis.title) axis.title.color = textMuted;
      }
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = textMuted;
    }
    chart.update('none');
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;
  updateThemeIcons();
}

