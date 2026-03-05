// ── Random helpers (replacing Python's random module) ──
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let _rng = Math.random;

function setRngSeed(seed) {
  if (seed !== null && seed !== undefined) {
    _rng = mulberry32(seed);
  } else {
    _rng = Math.random;
  }
}

function rngRandom() { return _rng(); }

function rngGauss(mean, stddev) {
  // Box-Muller transform
  let u1, u2;
  do { u1 = rngRandom(); } while (u1 === 0);
  u2 = rngRandom();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stddev;
}

function rngUniform(a, b) { return a + rngRandom() * (b - a); }
function rngRandInt(a, b) { return Math.floor(a + rngRandom() * (b - a + 1)); }
function rngChoice(arr) { return arr[Math.floor(rngRandom() * arr.length)]; }

// ── Utility ──
function safeInt(val, defaultVal) {
  if (defaultVal === undefined) defaultVal = 0;
  if (typeof val === 'number') return Math.floor(val);
  if (!val) return defaultVal;
  let s = String(val).replace(/,/g, '').replace(/~/g, '').replace(/\+/g, '').trim();
  if (s.indexOf('-') !== -1) {
    const parts = s.split('-');
    try { return parseInt(parts[parts.length - 1], 10) || defaultVal; }
    catch(e) { return defaultVal; }
  }
  try { return Math.floor(parseFloat(s)) || defaultVal; }
  catch(e) { return defaultVal; }
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

