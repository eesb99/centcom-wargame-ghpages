function updateGameTree(s, dayIdx) {
  if (!s || !s.game_tree) return;
  const gt = s.game_tree;

  // Action colors (all from fixed simulation enum values, not user input)
  const actionColors = {
    strike: 'var(--red)', hold: 'var(--yellow)', negotiate: 'var(--green)',
    partial_withdraw: '#a371f7',
    retaliate: 'var(--red)', absorb: 'var(--yellow)', escalate_asymmetric: 'var(--orange)',
  };
  const usColor = actionColors[gt.us_action] || 'var(--text)';
  const iranColor = actionColors[gt.iran_action] || 'var(--text)';
  const payoffSign = (v) => v >= 0 ? '+' + v.toFixed(2) : v.toFixed(2);

  // Decision matrix — built from simulation-internal enum values only (safe)
  const matrixEl = document.getElementById('gt-decision-matrix');
  matrixEl.textContent = '';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:auto 1fr 1fr;gap:6px 12px;align-items:center';

  const addCell = (text, style) => {
    const d = document.createElement('div');
    d.textContent = text;
    d.style.cssText = style;
    grid.appendChild(d);
  };
  addCell('Side', 'font-size:8px;color:var(--text-faint);text-transform:uppercase');
  addCell('Action', 'font-size:8px;color:var(--text-faint);text-transform:uppercase');
  addCell('Payoff', 'font-size:8px;color:var(--text-faint);text-transform:uppercase');
  addCell('US', 'font-size:11px;color:#58a6ff;font-weight:700');
  addCell(gt.us_action.toUpperCase(), 'font-size:12px;color:' + usColor + ';font-weight:700;text-transform:uppercase');
  addCell(payoffSign(gt.us_payoff), 'font-size:12px;color:' + usColor + ';font-weight:600');
  addCell('IRAN', 'font-size:11px;color:#f85149;font-weight:700');
  addCell(gt.iran_action.toUpperCase(), 'font-size:12px;color:' + iranColor + ';font-weight:700;text-transform:uppercase');
  addCell(payoffSign(gt.iran_payoff), 'font-size:12px;color:' + iranColor + ';font-weight:600');
  matrixEl.appendChild(grid);

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'margin-top:8px;padding-top:6px;border-top:1px solid var(--border)';

  // OSINT badge — shows when real-world data is driving this day
  if (gt.osint_driven) {
    const badge = document.createElement('div');
    badge.style.cssText = 'display:inline-block;background:#da3633;color:#fff;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;margin-bottom:6px;letter-spacing:0.5px';
    badge.textContent = 'OSINT DATA -- REAL EVENTS';
    statusDiv.appendChild(badge);
    statusDiv.appendChild(document.createElement('br'));
  }

  const statusSpan = document.createElement('span');
  const diploMom = gt.diplomatic_momentum || 0;
  let statusColor = 'var(--orange)';
  let statusText = 'ACTIVE CONFLICT -- Strategic equilibrium favors continued fighting';

  if (gt.osint_driven) {
    // Real-world status override
    statusColor = '#da3633';
    statusText = 'REAL-WORLD: Full theater war -- No diplomatic off-ramp, zero ceasefire momentum';
    if (diploMom > 0) {
      statusColor = '#a371f7';
      statusText = 'REAL-WORLD: Diplomatic signals detected -- momentum ' + Math.round(diploMom * 100) + '%';
    }
  } else if (gt.war_subsiding && diploMom > 0.5) {
    statusColor = 'var(--green)';
    statusText = 'CEASEFIRE EMERGING -- Diplomatic momentum + mutual de-escalation';
  } else if (gt.war_subsiding) {
    statusColor = 'var(--green)';
    statusText = 'WAR SUBSIDING -- Both sides trending toward non-aggression';
  } else if (diploMom > 0.3) {
    statusColor = '#a371f7';
    statusText = 'DIPLOMATIC CHANNEL ACTIVE -- Back-channel negotiations building';
  } else if (gt.mediation_active) {
    statusColor = '#a371f7';
    statusText = 'MEDIATION IN PROGRESS -- Third-party engagement initiated';
  }
  statusSpan.style.cssText = 'font-size:9px;font-weight:600;color:' + statusColor;
  statusSpan.textContent = statusText;
  statusDiv.appendChild(statusSpan);
  matrixEl.appendChild(statusDiv);

  // Ceasefire bar
  const cfPct = Math.round(gt.ceasefire_probability * 100);
  const cfBar = document.getElementById('gt-ceasefire-bar');
  cfBar.style.width = cfPct + '%';
  cfBar.style.background = cfPct > 70 ? 'var(--green)' : cfPct > 30 ? 'var(--yellow)' : 'var(--red)';
  document.getElementById('gt-ceasefire-text').textContent = cfPct + '%';
  document.getElementById('gt-ceasefire-label').textContent = cfPct + '%';
  document.getElementById('gt-subsiding-label').textContent = gt.subsiding_days + ' peaceful day' + (gt.subsiding_days !== 1 ? 's' : '');

  // Diplomatic momentum bar
  const diploPct = Math.round((gt.diplomatic_momentum || 0) * 100);
  const diploBar = document.getElementById('gt-diplo-bar');
  diploBar.style.width = diploPct + '%';
  diploBar.style.background = diploPct > 60 ? '#3fb950' : diploPct > 25 ? '#a371f7' : 'var(--text-faint)';
  document.getElementById('gt-diplo-text').textContent = diploPct + '%';
  document.getElementById('gt-diplo-label').textContent = diploPct + '%';
  const mediationEl = document.getElementById('gt-mediation-label');
  mediationEl.textContent = gt.mediation_active ? 'Mediation active' : 'No mediation';
  mediationEl.style.color = gt.mediation_active ? '#a371f7' : 'var(--text-faint)';
  const postureEl = document.getElementById('gt-posture-label');
  postureEl.textContent = gt.us_posture_reduced ? 'US posture reduced' : 'Normal posture';
  postureEl.style.color = gt.us_posture_reduced ? '#a371f7' : 'var(--text-faint)';

  // Action history (from simulation history up to current day)
  const histContainer = document.getElementById('gt-action-history');
  histContainer.textContent = '';
  if (typeof dayIdx === 'number' && simHistory.length > 0) {
    const histSlice = simHistory.slice(Math.max(0, dayIdx - 14), dayIdx + 1).reverse();
    for (const h of histSlice) {
      if (!h.game_tree) continue;
      const g = h.game_tree;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;padding:2px 0;border-bottom:1px solid var(--border)';

      const daySpan = document.createElement('span');
      daySpan.style.cssText = 'color:var(--text-faint);width:28px';
      daySpan.textContent = 'D' + h.day;
      row.appendChild(daySpan);

      const usSpan = document.createElement('span');
      usSpan.style.cssText = 'color:' + (actionColors[g.us_action] || 'var(--text)') + ';width:60px';
      usSpan.textContent = g.us_action;
      row.appendChild(usSpan);

      const vsSpan = document.createElement('span');
      vsSpan.style.cssText = 'color:var(--text-faint)';
      vsSpan.textContent = 'vs';
      row.appendChild(vsSpan);

      const iranSpan = document.createElement('span');
      iranSpan.style.cssText = 'color:' + (actionColors[g.iran_action] || 'var(--text)') + ';flex:1';
      iranSpan.textContent = g.iran_action;
      row.appendChild(iranSpan);

      if (g.war_subsiding) {
        const peaceSpan = document.createElement('span');
        peaceSpan.style.cssText = 'color:var(--green);width:12px';
        peaceSpan.textContent = 'P';
        row.appendChild(peaceSpan);
      }
      histContainer.appendChild(row);
    }
  }
}

function updateEscalation(s) {
  const pct = (s.escalation_level / 7 * 100).toFixed(0);
  document.getElementById('esc-label').textContent = `${s.escalation_level} / 7`;
  const bar = document.getElementById('esc-bar');
  bar.style.width = pct + '%';

  const colors = ['#3fb950', '#3fb950', '#d29922', '#d29922', '#f0883e', '#f85149', '#f85149', '#bc8cff'];
  bar.style.background = colors[s.escalation_level] || '#f85149';
  document.getElementById('esc-name').textContent = s.escalation_label;
}

