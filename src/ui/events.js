function updateEventLog(history) {
  const log = document.getElementById('event-log');
  const allEvents = [];
  history.forEach(h => {
    (h.events || []).forEach(e => allEvents.push({ text: e, day: h.day }));
  });

  const recent = allEvents.slice(-200).reverse();
  document.getElementById('event-count').textContent = `${allEvents.length} events`;
  document.getElementById('events-empty').style.display = allEvents.length > 0 ? 'none' : '';

  log.innerHTML = recent.map(e => {
    const el = e.text.toLowerCase();
    let type = 'default';
    let icon = '●';
    let cat = '';
    
    if (el.includes('escalation') || el.includes('de-escalation')) {
      type = 'escalation'; icon = '⬆'; cat = 'Escalation';
    } else if (el.includes('strike') || el.includes('fired') || el.includes('salvo') || el.includes('missile') || el.includes('tomahawk') || el.includes('jassm')) {
      type = 'airstrike'; icon = '💥'; cat = 'Airstrike';
    } else if (el.includes('naval') || el.includes('ship') || el.includes('hormuz') || el.includes('mine')) {
      type = 'naval'; icon = '⚓'; cat = 'Naval';
    } else if (el.includes('cyber')) {
      type = 'cyber'; icon = '🖥'; cat = 'Cyber';
    } else if (el.includes('oil') || el.includes('economic') || el.includes('sanction')) {
      type = 'economic'; icon = '📊'; cat = 'Economic';
    }

    const catColors = {
      'Escalation': 'background:var(--red-dim);color:var(--red)',
      'Airstrike': 'background:var(--orange-dim);color:var(--orange)',
      'Naval': 'background:var(--blue-dim);color:var(--blue)',
      'Cyber': 'background:var(--purple-dim);color:var(--purple)',
      'Economic': 'background:var(--yellow-dim);color:var(--yellow)',
    };

    return `<div class="event-card">
      <div class="event-card-header">
        <div class="event-icon ${type}">${icon}</div>
        <span class="event-timestamp">Day ${e.day}</span>
        ${cat ? `<span class="event-category" style="${catColors[cat] || ''}">${cat}</span>` : ''}
      </div>
      <div class="event-text">${e.text}</div>
    </div>`;
  }).join('');
}

function updateMissileInventory(s) {
  const el = document.getElementById('missile-inventory');
  if (!s || (!s.us_missile_inventory && !s.iran_missile_inventory)) {
    el.innerHTML = '<div style="color:var(--text-faint);font-size:10px">Run simulation to view</div>';
    return;
  }

  const usm = s.us_missile_inventory || {};
  const irm = s.iran_missile_inventory || {};

  const invBar = (label, current, max, color) => {
    const pct = max > 0 ? (current / max * 100).toFixed(0) : 0;
    const statusColor = pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--yellow)' : 'var(--red)';
    return `<div class="inv-row">
      <div class="inv-label"><span>${label}</span><span style="color:${statusColor}">${current.toLocaleString()}</span></div>
      <div class="inv-bar"><div class="inv-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  };

  let html = '<div style="font-size:8px;color:var(--blue);font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">US Munitions</div>';
  html += invBar('Tomahawk', usm.tomahawk || 0, 3500, 'var(--blue)');
  html += invBar('JASSM/LRASM', usm.jassm || 0, 2000, 'var(--accent)');
  html += invBar('Interceptors', usm.interceptors || 0, 48, 'var(--green)');

  html += '<div style="font-size:8px;color:var(--red);font-weight:600;margin:6px 0 4px;text-transform:uppercase;letter-spacing:0.06em">Iran Munitions</div>';
  html += invBar('Ballistic Missiles', irm.ballistic || 0, 2500, 'var(--red)');
  html += invBar('Cruise Missiles', irm.cruise || 0, 300, 'var(--orange)');
  html += invBar('AShM', irm.ashm || 0, 176, 'var(--yellow)');
  html += invBar('Shahed Drones', irm.drones || 0, 2000, 'var(--orange)');
  html += invBar('Mine Stockpile', irm.mines || 0, 5000, 'var(--purple)');

  if (s.missiles_fired) {
    const mf = s.missiles_fired;
    const totalUS = (mf.us_tomahawk || 0) + (mf.us_jassm || 0) + (mf.us_other || 0);
    const totalIR = (mf.iran_ballistic || 0) + (mf.iran_cruise || 0) + (mf.iran_ashm || 0) + (mf.iran_drone || 0) + (mf.proxy_rockets || 0);
    html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);font-size:8px;color:var(--text-faint)">
      <div style="display:flex;justify-content:space-between"><span>US fired total</span><span style="font-family:var(--font-mono);color:var(--blue)">${totalUS.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between"><span>Iran/proxy fired total</span><span style="font-family:var(--font-mono);color:var(--red)">${totalIR.toLocaleString()}</span></div>
    </div>`;
  }

  el.innerHTML = html;
}

function updateForceStatus(s) {
  const el = document.getElementById('force-status');
  if (!s) {
    el.innerHTML = '<div style="color:var(--text-faint);font-size:10px">Initialize simulation to view</div>';
    document.getElementById('force-count').textContent = '';
    return;
  }

  const unitRow = (u, color) => {
    const statusColor = u.status === 'active' ? 'var(--green)' :
                        u.status === 'combat_ineffective' ? 'var(--yellow)' : 'var(--red)';
    const qty = u.quantity !== undefined && u.quantity > 0 ? ` (${u.quantity})` : '';
    const subType = u.sub_type ? `<span style="color:var(--text-faint);font-size:7px"> ${u.sub_type.replace(/_/g,' ')}</span>` : '';
    const nameStr = u.name.length > 22 ? u.name.substring(0, 22) + '...' : u.name;
    return `<div style="margin-bottom:4px">
      <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:1px">
        <span style="color:${color}">${nameStr}${qty}${subType}</span>
        <span style="color:${statusColor};font-family:var(--font-mono);font-size:8px">${u.strength.toFixed(0)}%</span>
      </div>
      <div style="height:2px;background:rgba(255,255,255,0.06);border-radius:1px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, u.strength)}%;background:${color};border-radius:1px;transition:width 400ms var(--ease)"></div>
      </div>
    </div>`;
  };

  const usUnits = s.units.us || [];
  const irUnits = s.units.iran || [];
  document.getElementById('force-count').textContent = `${usUnits.length + irUnits.length} units`;

  let html = `<div style="font-size:8px;color:var(--blue);font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">US Forces (${usUnits.length})</div>`;
  usUnits.forEach(u => html += unitRow(u, 'var(--blue)'));

  html += `<div style="font-size:8px;color:var(--red);font-weight:600;margin:6px 0 4px;text-transform:uppercase;letter-spacing:0.06em">Iran Forces (${irUnits.length})</div>`;
  irUnits.forEach(u => {
    const color = u.type === 'proxy' ? 'var(--orange)' : 'var(--red)';
    html += unitRow(u, color);
  });
  el.innerHTML = html;
}

