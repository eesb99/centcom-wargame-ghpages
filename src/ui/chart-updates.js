function updateCharts(history) {
  const labels = history.map(h => `D${h.day}`);

  forceChart.data.labels = labels;
  forceChart.data.datasets[0].data = history.map(h => h.us_force_pct);
  forceChart.data.datasets[1].data = history.map(h => h.iran_force_pct);
  forceChart.update('none');

  econChart.data.labels = labels;
  econChart.data.datasets[0].data = history.map(h => h.oil_price);
  econChart.data.datasets[1].data = history.map(h => h.hormuz_flow_pct);
  econChart.data.datasets[2].data = history.map(h => h.bab_al_mandeb_flow_pct !== undefined ? h.bab_al_mandeb_flow_pct : 100);
  econChart.update('none');

  casualtyChart.data.labels = labels;
  casualtyChart.data.datasets[0].data = history.map(h => h.casualties.us);
  casualtyChart.data.datasets[1].data = history.map(h => h.casualties.iran);
  casualtyChart.data.datasets[2].data = history.map(h => h.casualties.civilian);
  casualtyChart.data.datasets[3].data = history.map(h => h.casualties.proxy || 0);
  casualtyChart.update('none');

  missileChart.data.labels = labels;
  missileChart.data.datasets[0].data = history.map(h => h.us_missile_inventory ? h.us_missile_inventory.tomahawk : 3500);
  missileChart.data.datasets[1].data = history.map(h => h.us_missile_inventory ? h.us_missile_inventory.jassm : 2000);
  missileChart.data.datasets[2].data = history.map(h => h.iran_missile_inventory ? h.iran_missile_inventory.ballistic : 2500);
  missileChart.data.datasets[3].data = history.map(h => h.iran_missile_inventory ? h.iran_missile_inventory.drones : 2000);
  missileChart.data.datasets[4].data = history.map(h => h.iran_missile_inventory ? h.iran_missile_inventory.mines : 5000);
  missileChart.update('none');

  // Game Tree charts
  payoffChart.data.labels = labels;
  payoffChart.data.datasets[0].data = history.map(h => h.game_tree ? h.game_tree.us_payoff : 0);
  payoffChart.data.datasets[1].data = history.map(h => h.game_tree ? h.game_tree.iran_payoff : 0);
  payoffChart.update('none');

  ceasefireChart.data.labels = labels;
  ceasefireChart.data.datasets[0].data = history.map(h => h.game_tree ? h.game_tree.ceasefire_probability * 100 : 0);
  ceasefireChart.data.datasets[1].data = history.map(h => h.escalation_level);
  ceasefireChart.data.datasets[2].data = history.map(h => h.game_tree ? (h.game_tree.diplomatic_momentum || 0) * 100 : 0);
  ceasefireChart.update('none');
}

