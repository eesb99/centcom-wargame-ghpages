#!/usr/bin/env node
/**
 * CENTCOM War Game — OSINT Backfill & Daily Calibration Script
 *
 * Queries Perplexity API for day-by-day conflict data from Operation Epic Fury
 * and generates updated simulation data.
 *
 * Usage:
 *   node backfill.js                    # Run full backfill (all days)
 *   node backfill.js --day 3            # Backfill specific day only
 *   node backfill.js --dry-run          # Query but don't patch index.html
 *   node backfill.js --patch            # Apply timeline to index.html
 *   node backfill.js --calibrate        # Daily calibration: query today's OSINT,
 *                                       #   derive param_calibration, patch
 *                                       #   DIPLOMATIC_EVENTS in index.html
 *
 * Requirements:
 *   - Perplexity API key in PERPLEXITY_API_KEY env var
 *
 * Output:
 *   - conflict_timeline.json            # Structured day-by-day data
 *   - index.html (patched, if --patch or --calibrate)
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ──
const CONFIG = {
  conflict_start: '2026-02-28',
  operation_name: 'Operation Epic Fury',
  index_path: path.join(__dirname, 'index.html'),
  timeline_path: path.join(__dirname, 'conflict_timeline.json'),

  // Perplexity API (when running standalone, not via Claude Code MCP)
  api_key: process.env.PERPLEXITY_API_KEY || null,
  api_url: 'https://api.perplexity.ai/chat/completions',
  model: 'sonar',

  // Data categories to query per day
  categories: [
    {
      id: 'military_ops',
      query_template: 'Operation Epic Fury military operations strikes targets DATE_PLACEHOLDER CENTCOM update results',
      fields: ['strikes_count', 'targets_hit', 'sorties', 'key_operations']
    },
    {
      id: 'casualties',
      query_template: 'US military casualties killed wounded Iran military casualties DATE_PLACEHOLDER Operation Epic Fury',
      fields: ['us_kia', 'us_wia', 'iran_military_killed_est', 'civilian_casualties_est']
    },
    {
      id: 'naval',
      query_template: 'Iran navy ships destroyed sunk damaged US naval operations Strait of Hormuz DATE_PLACEHOLDER',
      fields: ['iran_ships_destroyed', 'us_ships_damaged', 'hormuz_status', 'mines_detected']
    },
    {
      id: 'missiles',
      query_template: 'Iran ballistic missile launches retaliation Patriot THAAD intercept rate DATE_PLACEHOLDER',
      fields: ['iran_missiles_fired', 'intercepted', 'leakers', 'damage_from_missiles']
    },
    {
      id: 'air',
      query_template: 'Iran air force aircraft destroyed air defense IADS neutralized DATE_PLACEHOLDER Epic Fury',
      fields: ['iran_aircraft_destroyed', 'iads_sites_neutralized', 'us_aircraft_lost', 'air_superiority_pct']
    },
    {
      id: 'economic',
      query_template: 'Brent crude oil price Strait of Hormuz shipping traffic DATE_PLACEHOLDER Iran war economic impact',
      fields: ['brent_oil_usd', 'wti_oil_usd', 'hormuz_flow_pct', 'shipping_disruption']
    },
    {
      id: 'proxy',
      query_template: 'Hezbollah rockets Israel Houthi Red Sea attacks Iraqi militia DATE_PLACEHOLDER proxy war',
      fields: ['hezbollah_rockets_fired', 'houthi_attacks', 'iraqi_militia_attacks', 'proxy_casualties']
    },
    {
      id: 'cyber_diplomatic',
      query_template: 'Iran cyber attacks US infrastructure diplomatic efforts ceasefire UN DATE_PLACEHOLDER',
      fields: ['cyber_incidents', 'diplomatic_developments', 'un_action', 'ceasefire_talks']
    }
  ]
};

// ── Perplexity API Client ──
async function queryPerplexity(query) {
  if (!CONFIG.api_key) {
    console.error('ERROR: PERPLEXITY_API_KEY not set.');
    console.error('Set it via: export PERPLEXITY_API_KEY=your_key');
    console.error('Or run this script through Claude Code with Perplexity MCP.');
    process.exit(1);
  }

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(CONFIG.api_url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CONFIG.model,
          messages: [
            {
              role: 'system',
              content: `You are an OSINT analyst extracting structured data about Operation Epic Fury (US-Iran conflict, Feb 2026).
Return ONLY valid JSON with the requested fields. Use null for unknown values. Use numbers not strings for numeric fields.
Be precise — cite specific numbers from CENTCOM statements, news reports, and defense sources.`
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();
      if (data.error) {
        console.error(`Perplexity API error (attempt ${attempt}/${MAX_RETRIES}):`, data.error);
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`  Retrying in ${delay / 1000}s...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return null;
      }
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      if (e.name === 'AbortError') {
        console.error(`  Request timed out after ${TIMEOUT_MS / 1000}s (attempt ${attempt}/${MAX_RETRIES})`);
      } else {
        console.error(`  Fetch error (attempt ${attempt}/${MAX_RETRIES}):`, e.message);
      }
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error('  All retry attempts exhausted. Returning null.');
  return null;
}

// ── Date Utilities ──
function getConflictDays(upToDate) {
  const start = new Date(CONFIG.conflict_start);
  const end = upToDate ? new Date(upToDate) : new Date();
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      date: d.toISOString().split('T')[0],
      day_number: Math.floor((d - start) / 86400000) + 1,
    });
  }
  return days;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Backfill a Single Day ──
async function backfillDay(dayInfo) {
  const { date, day_number } = dayInfo;
  const dateLabel = formatDate(date);
  console.log(`\n--- Day ${day_number} (${dateLabel}) ---`);

  const dayData = {
    date: date,
    day_number: day_number,
    date_label: dateLabel,
    sources: [],
    data: {}
  };

  for (const cat of CONFIG.categories) {
    const query = cat.query_template.replace('DATE_PLACEHOLDER', `${dateLabel} ${date}`);

    const structuredQuery = `For ${dateLabel} (Day ${day_number} of Operation Epic Fury), extract these fields as JSON:
${JSON.stringify(cat.fields)}

Query context: ${query}

Return JSON object with exactly these keys. Use null for unknown/unreported values. Use numbers for numeric fields.
Include a "sources" array with URLs or source names you referenced.
Include a "confidence" field (0-1) indicating data reliability.`;

    console.log(`  Querying: ${cat.id}...`);
    const raw = await queryPerplexity(structuredQuery);

    if (raw) {
      try {
        // Extract JSON from response (may have markdown wrapping)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          dayData.data[cat.id] = parsed;
          if (parsed.sources) {
            dayData.sources.push(...parsed.sources);
            delete parsed.sources;
          }
          console.log(`    OK:`, JSON.stringify(parsed).substring(0, 120));
        }
      } catch (e) {
        console.log(`    Parse error: ${e.message}`);
        dayData.data[cat.id] = { _raw: raw.substring(0, 500), _error: e.message };
      }
    }

    // Rate limit courtesy
    await new Promise(r => setTimeout(r, 500));
  }

  return dayData;
}

// ── Build Aggregated Timeline ──
function buildTimeline(dayResults) {
  return {
    _metadata: {
      title: 'Operation Epic Fury — Day-by-Day OSINT Timeline',
      generated: new Date().toISOString(),
      conflict_start: CONFIG.conflict_start,
      days_covered: dayResults.length,
      data_source: 'Perplexity AI (OSINT aggregation)',
      note: 'Auto-generated backfill. Values marked null are unconfirmed. Verify against primary sources.',
    },
    days: dayResults
  };
}

// ── Patch index.html with Timeline Data ──
function patchIndexHtml(timeline) {
  const html = fs.readFileSync(CONFIG.index_path, 'utf8');

  const timelineJson = JSON.stringify(timeline);
  const constDecl = `const CONFLICT_TIMELINE = ${timelineJson};`;

  // Check if CONFLICT_TIMELINE already exists
  if (html.includes('const CONFLICT_TIMELINE')) {
    // Replace existing
    const patched = html.replace(
      /const CONFLICT_TIMELINE = \{.*?\};/s,
      constDecl
    );
    fs.writeFileSync(CONFIG.index_path, patched);
    console.log('\nPatched existing CONFLICT_TIMELINE in index.html');
  } else {
    // Insert after ECON_BACKFILL
    const insertPoint = html.indexOf('const ECON_BACKFILL');
    if (insertPoint === -1) {
      console.error('Could not find ECON_BACKFILL in index.html');
      return false;
    }
    // Find the end of the ECON_BACKFILL line (next semicolon + newline)
    const lineEnd = html.indexOf(';\n', insertPoint);
    if (lineEnd === -1) {
      console.error('Could not find end of ECON_BACKFILL declaration');
      return false;
    }
    const patched = html.substring(0, lineEnd + 2) + constDecl + '\n' + html.substring(lineEnd + 2);
    fs.writeFileSync(CONFIG.index_path, patched);
    console.log('\nInserted CONFLICT_TIMELINE after ECON_BACKFILL in index.html');
  }

  return true;
}

// ── Daily Calibration Mode ──
// Queries Perplexity for today's events, derives param_calibration,
// and patches DIPLOMATIC_EVENTS in index.html.

function getExistingDayNumbers() {
  if (!fs.existsSync(CONFIG.index_path)) return [];
  const html = fs.readFileSync(CONFIG.index_path, 'utf8');
  const startMarker = 'const DIPLOMATIC_EVENTS = {';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return [];
  // Find end of DIPLOMATIC_EVENTS
  let braces = 0, endIdx = -1;
  for (let i = startIdx + startMarker.length - 1; i < html.length; i++) {
    if (html[i] === '{') braces++;
    if (html[i] === '}') braces--;
    if (braces === 0) { endIdx = i + 1; break; }
  }
  if (endIdx === -1) return [];
  const block = html.substring(startIdx, endIdx);
  // Match day number keys inside the days object: "N:" or N:
  const daysMatch = block.match(/"?days"?\s*:\s*\{([\s\S]*)\}\s*$/);
  if (!daysMatch) return [];
  const dayKeys = [...daysMatch[1].matchAll(/^\s*"?(\d+)"?\s*:/gm)];
  return dayKeys.map(m => parseInt(m[1]));
}

async function runDailyCalibration(dryRun) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const start = new Date(CONFIG.conflict_start);
  const dayNumber = Math.floor((today - start) / 86400000) + 1;

  if (dayNumber < 1) {
    console.log('Conflict has not started yet. No calibration needed.');
    return;
  }

  // Gap detection: find missing days and backfill them first
  const existingDays = new Set(getExistingDayNumbers());
  const missingDays = [];
  for (let d = 1; d < dayNumber; d++) {
    if (!existingDays.has(d)) missingDays.push(d);
  }
  if (missingDays.length > 0) {
    console.log(`\n=== Gap Detection: ${missingDays.length} missing day(s): [${missingDays.join(', ')}] ===\n`);
    for (const missedDay of missingDays) {
      const missedDate = new Date(start);
      missedDate.setDate(missedDate.getDate() + missedDay - 1);
      const missedStr = missedDate.toISOString().split('T')[0];
      console.log(`  Backfilling Day ${missedDay} (${formatDate(missedStr)})...`);
      await runCalibrationForDay(missedDay, missedStr, dryRun);
    }
  }

  const dateLabel = formatDate(todayStr);
  console.log(`\n=== Daily Calibration: Day ${dayNumber} (${dateLabel}) ===\n`);
  await runCalibrationForDay(dayNumber, todayStr, dryRun);
}

async function runCalibrationForDay(dayNumber, dateStr, dryRun) {
  const dateLabel = formatDate(dateStr);

  // Step 1: Query for this day's key events
  let events = [];
  try {
    const eventsQuery = `Operation Epic Fury ${dateLabel} ${dateStr} Day ${dayNumber} summary:
List the 5-7 most important military and diplomatic events that happened on this day.
Include: US/coalition strikes, Iranian retaliation, proxy attacks (Hezbollah/Houthi/Iraqi militia),
casualties (US and Iranian), naval operations, Strait of Hormuz status, diplomatic developments,
ceasefire proposals, UN activity, oil price movements.
Be specific with numbers and sources. Return as a JSON array of strings.`;

    console.log('  Querying events...');
    const eventsRaw = await queryPerplexity(eventsQuery);
    if (eventsRaw) {
      try {
        const match = eventsRaw.match(/\[[\s\S]*\]/);
        if (match) events = JSON.parse(match[0]);
      } catch (e) {
        // Fallback: split by newlines/bullets
        events = eventsRaw.split(/[\n\r]+/)
          .map(l => l.replace(/^[-*\d.)\s]+/, '').trim())
          .filter(l => l.length > 20)
          .slice(0, 7);
      }
    }
    console.log(`  Events found: ${events.length}`);
  } catch (e) {
    console.error(`  Error querying events: ${e.message}. Continuing with empty events.`);
  }

  // Step 2: Query for parameter calibration
  let calibration = null;
  try {
    const calibQuery = `You are a military analyst calibrating a war simulation of Operation Epic Fury (US-Iran conflict).
Based on events from ${dateLabel} (Day ${dayNumber}), provide numeric parameter estimates.

Context events:
${events.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Return ONLY a JSON object with these fields (all numbers between the given ranges):
{
  "escalation_propensity": <0.1-0.95, how likely is further escalation? 0.1=war winding down, 0.95=maximum aggression>,
  "iran_force_multiplier": <0.02-1.0, Iran's remaining conventional military capability. 1.0=full, 0.02=destroyed>,
  "us_tech_advantage": <1.0-2.5, US technological/tactical edge. Higher=more dominant>,
  "iran_asymmetric_factor": <0.1-2.0, Iran's asymmetric warfare capability (drones, mines, fast boats). Below 1.0=degraded>,
  "proxy_effectiveness": <0.1-1.0, how active/effective are proxy forces (Hezbollah, Houthis, Iraqi militia)?>,
  "cyber_intensity": <0.05-1.0, cyber warfare tempo>,
  "hormuz_mining_probability": <0.01-1.0, probability of new mines being laid in Hormuz>,
  "oil_price_elasticity": <-0.20 to -0.01, market sensitivity to disruption. More negative=more reactive>,
  "patriot_intercept_rate": <0.5-0.98, US air defense intercept success rate>,
  "us_posture": <one of: "maximum_force", "sustained_operations", "partial_withdrawal", "ceasefire">,
  "iran_posture": <one of: "full_retaliation", "proxy_escalation", "fragmented_command", "fragmented_resistance", "negotiate">,
  "diplomatic_momentum": <0-1, are there any ceasefire/diplomatic signals? 0=none, 1=ceasefire imminent>,
  "mediation_active": <true/false, is third-party mediation underway?>,
  "ceasefire_signals": <0-1, strength of ceasefire signals from either side>,
  "proxy_hezbollah": <true/false>,
  "proxy_houthi": <true/false>,
  "proxy_iraqi_militia": <true/false>
}

Base your estimates on the actual military situation. Be precise.`;

    console.log('  Querying parameter calibration...');
    const calibRaw = await queryPerplexity(calibQuery);
    if (calibRaw) {
      try {
        const match = calibRaw.match(/\{[\s\S]*\}/);
        if (match) calibration = JSON.parse(match[0]);
      } catch (e) {
        console.error('  Failed to parse calibration JSON:', e.message);
      }
    }
  } catch (e) {
    console.error(`  Error querying calibration: ${e.message}`);
  }

  if (!calibration) {
    console.error('  ERROR: Could not get calibration data. Aborting.');
    return;
  }

  console.log('  Calibration received:');
  console.log('   ', JSON.stringify(calibration, null, 2).split('\n').join('\n    '));

  // Step 3: Build DIPLOMATIC_EVENTS day entry
  const dayEntry = {
    date: dateStr,
    diplomatic_momentum: clampNum(calibration.diplomatic_momentum, 0, 1, 0),
    mediation_active: !!calibration.mediation_active,
    ceasefire_signals: clampNum(calibration.ceasefire_signals, 0, 1, 0),
    escalation_override: calibration.escalation_propensity > 0.7 ? 5 :
                          calibration.escalation_propensity > 0.4 ? 4 :
                          calibration.escalation_propensity > 0.2 ? 3 : 2,
    events: events.slice(0, 7),
    proxy: {
      hezbollah_active: !!calibration.proxy_hezbollah,
      houthi_active: !!calibration.proxy_houthi,
      iraqi_militia_active: !!calibration.proxy_iraqi_militia,
    },
    us_posture: calibration.us_posture || 'sustained_operations',
    iran_posture: calibration.iran_posture || 'fragmented_resistance',
    param_calibration: {
      escalation_propensity: clampNum(calibration.escalation_propensity, 0.1, 0.95, 0.5),
      iran_force_multiplier: clampNum(calibration.iran_force_multiplier, 0.02, 1.0, 0.3),
      us_tech_advantage: clampNum(calibration.us_tech_advantage, 1.0, 2.5, 1.8),
      iran_asymmetric_factor: clampNum(calibration.iran_asymmetric_factor, 0.1, 2.0, 0.8),
      proxy_effectiveness: clampNum(calibration.proxy_effectiveness, 0.1, 1.0, 0.6),
      cyber_intensity: clampNum(calibration.cyber_intensity, 0.05, 1.0, 0.4),
      hormuz_mining_probability: clampNum(calibration.hormuz_mining_probability, 0.01, 1.0, 0.2),
      oil_price_elasticity: clampNum(calibration.oil_price_elasticity, -0.20, -0.01, -0.05),
      patriot_intercept_rate: clampNum(calibration.patriot_intercept_rate, 0.5, 0.98, 0.88),
    }
  };

  console.log(`\n  Day ${dayNumber} entry built.`);

  if (dryRun) {
    console.log('\n  [DRY RUN] Would patch DIPLOMATIC_EVENTS with:');
    console.log('  ', JSON.stringify(dayEntry, null, 2).split('\n').join('\n    '));
    return;
  }

  // Step 4: Patch DIPLOMATIC_EVENTS in index.html
  patchDiplomaticEvents(dayNumber, dayEntry);
  console.log(`\n  Patched DIPLOMATIC_EVENTS day ${dayNumber} in index.html`);
}

function clampNum(val, min, max, fallback) {
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function patchDiplomaticEvents(dayNumber, dayEntry) {
  let html = fs.readFileSync(CONFIG.index_path, 'utf8');

  // Find DIPLOMATIC_EVENTS block
  const startMarker = 'const DIPLOMATIC_EVENTS = {';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) {
    console.error('  ERROR: DIPLOMATIC_EVENTS not found in index.html');
    return false;
  }

  // Find the closing of DIPLOMATIC_EVENTS (matching brace + semicolon)
  let braces = 0;
  let endIdx = -1;
  for (let i = startIdx + startMarker.length - 1; i < html.length; i++) {
    if (html[i] === '{') braces++;
    if (html[i] === '}') braces--;
    if (braces === 0) { endIdx = i + 1; break; }
  }
  if (endIdx === -1) {
    console.error('  ERROR: Could not find end of DIPLOMATIC_EVENTS');
    return false;
  }

  // Extract the JS object text and convert to JSON-parseable format:
  // - Strip comments (// ...)
  // - Add quotes to unquoted keys
  // - Handle trailing commas
  let objText = html.substring(startIdx + 'const DIPLOMATIC_EVENTS = '.length, endIdx);
  let jsonText = objText
    .replace(/\/\/[^\n]*/g, '')                           // strip line comments
    .replace(/,(\s*[}\]])/g, '$1')                        // remove trailing commas
    .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3') // quote unquoted alpha keys
    .replace(/^(\s+)(\d+)(\s*:)/gm, '$1"$2"$3')             // quote unquoted numeric keys (line-anchored)
    .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (m, inner) => '"' + inner.replace(/"/g, '\\"') + '"'); // single->double quotes, escape inner "s

  let diplo;
  try {
    diplo = JSON.parse(jsonText);
  } catch (e) {
    console.error('  ERROR: Could not parse DIPLOMATIC_EVENTS as JSON:', e.message);
    // Fallback: rebuild from scratch preserving existing days via regex
    console.log('  Attempting regex-based day insertion...');
    return patchDiplomaticEventsFallback(html, startIdx, endIdx, dayNumber, dayEntry);
  }

  // Add or update the day
  diplo.days[dayNumber] = dayEntry;
  diplo.last_updated = new Date().toISOString().split('T')[0];

  // Serialize back as JS (JSON is valid JS)
  const newBlock = JSON.stringify(diplo, null, 2);
  // Find the semicolon after the closing brace
  const semiIdx = html.indexOf(';', endIdx - 1);
  const patched = html.substring(0, startIdx) +
    'const DIPLOMATIC_EVENTS = ' + newBlock + ';' +
    html.substring(semiIdx + 1);

  fs.writeFileSync(CONFIG.index_path, patched);
  return true;
}

// Fallback: insert a new day entry before the closing of the days object
function patchDiplomaticEventsFallback(html, startIdx, endIdx, dayNumber, dayEntry) {
  // Find the last "}" before endIdx that closes the "days" object
  // Strategy: insert new day entry as text before the closing "}  }"
  const entryJson = JSON.stringify(dayEntry, null, 6).replace(/\n/g, '\n    ');
  const insertion = `    ${dayNumber}: ${entryJson},\n`;

  // Find "days: {" inside DIPLOMATIC_EVENTS
  const daysMarker = html.indexOf('"days":', startIdx) !== -1 ?
    html.indexOf('"days":', startIdx) : html.indexOf('days:', startIdx);
  if (daysMarker === -1 || daysMarker > endIdx) {
    console.error('  FALLBACK ERROR: Could not find days object');
    return false;
  }

  // Find the closing brace of the days object (second-to-last } before endIdx)
  // We look for the pattern "}\n}" which closes days then DIPLOMATIC_EVENTS
  const closingPattern = html.lastIndexOf('  }', endIdx - 2);
  if (closingPattern === -1) {
    console.error('  FALLBACK ERROR: Could not find days closing brace');
    return false;
  }

  const patched = html.substring(0, closingPattern) + insertion + html.substring(closingPattern);
  // Update last_updated
  const finalPatched = patched.replace(
    /last_updated:\s*['"][^'"]*['"]/,
    `last_updated: '${new Date().toISOString().split('T')[0]}'`
  );

  fs.writeFileSync(CONFIG.index_path, finalPatched);
  return true;
}

// ── Generate Claude Code MCP Version ──
// This generates prompts that can be run via Claude Code's Perplexity MCP
function generateMcpPrompts() {
  const days = getConflictDays();
  console.log('\n=== Claude Code MCP Prompts ===');
  console.log('Run these via mcp__perplexity-code__perplexity_execute:\n');

  for (const day of days) {
    const dateLabel = formatDate(day.date);
    console.log(`# Day ${day.day_number} (${dateLabel})`);
    console.log(`perplexity.research("""
Operation Epic Fury Day ${day.day_number} (${dateLabel}):
Extract structured OSINT data as JSON with these sections:
- military_ops: {strikes_count, targets_hit, sorties, key_operations}
- casualties: {us_kia, us_wia, iran_military_killed_est, civilian_casualties_est}
- naval: {iran_ships_destroyed, us_ships_damaged, hormuz_status, mines_detected}
- missiles: {iran_missiles_fired, intercepted, leakers, damage_from_missiles}
- air: {iran_aircraft_destroyed, iads_sites_neutralized, us_aircraft_lost, air_superiority_pct}
- economic: {brent_oil_usd, wti_oil_usd, hormuz_flow_pct, shipping_disruption}
- proxy: {hezbollah_rockets_fired, houthi_attacks, iraqi_militia_attacks}
- escalation: {level_description, diplomatic_developments}
Use CENTCOM statements, Reuters, AP, defense news. Return null for unknown values.
""")\n`);
  }
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const patch = args.includes('--patch');
  const mcpMode = args.includes('--mcp-prompts');
  const calibrate = args.includes('--calibrate');
  const specificDay = args.indexOf('--day') !== -1 ? parseInt(args[args.indexOf('--day') + 1]) : null;

  console.log('CENTCOM War Game — OSINT Backfill');
  console.log('=================================');
  console.log(`Conflict start: ${CONFIG.conflict_start}`);
  console.log(`Operation: ${CONFIG.operation_name}`);
  console.log(`Mode: ${calibrate ? 'daily-calibration' : dryRun ? 'dry-run' : patch ? 'patch' : 'generate JSON'}`);

  if (calibrate) {
    await runDailyCalibration(dryRun);
    return;
  }

  if (mcpMode) {
    generateMcpPrompts();
    return;
  }

  const allDays = getConflictDays();
  const days = specificDay ? allDays.filter(d => d.day_number === specificDay) : allDays;

  console.log(`Days to backfill: ${days.length} (Day ${days[0]?.day_number} to Day ${days[days.length-1]?.day_number})`);

  // Load existing timeline if any
  let existingTimeline = null;
  if (fs.existsSync(CONFIG.timeline_path)) {
    existingTimeline = JSON.parse(fs.readFileSync(CONFIG.timeline_path, 'utf8'));
    console.log(`Existing timeline found: ${existingTimeline.days?.length || 0} days`);
  }

  // Backfill each day
  const results = [];
  for (const day of days) {
    // Skip if already in existing timeline (unless specific day requested)
    if (!specificDay && existingTimeline) {
      const existing = existingTimeline.days?.find(d => d.date === day.date);
      if (existing && Object.keys(existing.data).length >= 6) {
        console.log(`\n--- Day ${day.day_number} (${day.date}) --- CACHED, skipping`);
        results.push(existing);
        continue;
      }
    }

    try {
      const dayData = await backfillDay(day);
      results.push(dayData);

      // Save partial results after each successful day
      const partialTimeline = buildTimeline(results);
      fs.writeFileSync(CONFIG.timeline_path, JSON.stringify(partialTimeline, null, 2));
      console.log(`    Saved partial progress (${results.length} days)`);
    } catch (e) {
      console.error(`\n  ERROR processing Day ${day.day_number} (${day.date}): ${e.message}`);
      console.error('  Continuing to next day...');
    }
  }

  // Merge with existing data
  if (existingTimeline && !specificDay) {
    for (const existing of existingTimeline.days || []) {
      if (!results.find(r => r.date === existing.date)) {
        results.push(existing);
      }
    }
  }

  // Sort by date
  results.sort((a, b) => a.date.localeCompare(b.date));

  // Build timeline
  const timeline = buildTimeline(results);

  // Save JSON
  fs.writeFileSync(CONFIG.timeline_path, JSON.stringify(timeline, null, 2));
  console.log(`\nSaved: ${CONFIG.timeline_path}`);
  console.log(`  Days: ${timeline.days.length}`);
  console.log(`  Size: ${Math.round(fs.statSync(CONFIG.timeline_path).size / 1024)}KB`);

  // Patch index.html if requested
  if (patch && !dryRun) {
    patchIndexHtml(timeline);
  }

  // Summary
  console.log('\n=== Backfill Summary ===');
  for (const day of timeline.days) {
    const cats = Object.keys(day.data || {});
    const filled = cats.filter(c => {
      const d = day.data[c];
      return d && !d._error && Object.values(d).some(v => v !== null);
    });
    console.log(`  Day ${day.day_number} (${day.date}): ${filled.length}/${cats.length} categories filled`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
