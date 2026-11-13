/**
 * LUNARIS educational analysis engine.
 * The analytical model below is a FIRST-ORDER APPROXIMATION; it is NOT a
 * validated JPL ephemeris. Precision planning requires Horizons data.
 * Cached JPL samples, when present, take precedence for matching sites/times.
 * References: JPL Horizons manual, NASA lunar geometry learning resources.
 */
export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const mod = (a, n) => ((a % n) + n) % n;
export const wrap180 = (a) => mod(a + 180, 360) - 180;
export const wrap360 = (a) => mod(a, 360);
const sin = (x) => Math.sin(x * RAD);
const cos = (x) => Math.cos(x * RAD);

export const SITES = [
  { id: 'south-pole', name: 'South Pole Reference', region: 'South polar region', lat: -89.50, lon: 0.0, type: 'Reference coordinate', description: 'Near-pole reference point, not a certified landing site.' },
  { id: 'polar-ridge', name: 'Polar Ridge A', region: 'South polar region', lat: -88.80, lon: 35.0, type: 'Hypothetical site', description: 'Illustrative alternate site for date and longitude sensitivity.' },
  { id: 'polar-basin', name: 'Polar Basin B', region: 'South polar region', lat: -88.40, lon: 95.0, type: 'Hypothetical site', description: 'Illustrative candidate; not mapped to an actual measured crater.' },
  { id: 'polar-plateau', name: 'Polar Plateau C', region: 'South polar region', lat: -87.80, lon: 140.0, type: 'Hypothetical site', description: 'Illustrative south-polar comparison coordinate.' },
  { id: 'apollo-11', name: 'Apollo 11', region: 'Mare Tranquillitatis', lat: 0.6741, lon: 23.4729, type: 'Historic reference', description: 'Approximate historical Apollo 11 landing coordinates.' },
  { id: 'apollo-17', name: 'Apollo 17', region: 'Taurus–Littrow', lat: 20.1908, lon: 30.7717, type: 'Historic reference', description: 'Approximate historical Apollo 17 landing coordinates.' },
];

export function julianCenturiesInput(date) {
  return (new Date(date).getTime() - Date.UTC(2000,0,1,12)) / 86400000;
}

/** Simplified low-precision lunar/solar ecliptic longitude terms. */
export function analyticalSubpoints(date) {
  const d = julianCenturiesInput(date);
  const L = wrap360(218.3164477 + 13.17639648 * d);
  const Ms = wrap360(357.5291092 + 0.98560028 * d);
  const Mm = wrap360(134.9633964 + 13.06499295 * d);
  const D  = wrap360(297.8501921 + 12.19074912 * d);
  const F  = wrap360(93.2720950 + 13.22935024 * d);
  const sunMean = wrap360(280.46646 + 0.98564736 * d);
  const sunLon = wrap360(sunMean + 1.914602 * sin(Ms) + 0.019993 * sin(2 * Ms));
  const moonLon = wrap360(L + 6.289 * sin(Mm) + 1.274 * sin(2 * D - Mm) + 0.658 * sin(2 * D) + 0.214 * sin(2 * Mm) - 0.186 * sin(Ms));
  const phase = wrap180(moonLon - sunLon);
  // Geometric demo: lunar near side looks toward Earth (longitude around 0).
  // The varying pole orientations are simplified; do not use for flight planning.
  const subSolarLon = wrap180(-phase);
  const subSolarLat = 1.54 * sin(sunLon - 35.0);
  const subEarthLon = 6.29 * sin(Mm) - 1.27 * sin(2 * D - Mm);
  const subEarthLat = 6.68 * sin(F);
  return { sun: { lat: subSolarLat, lon: subSolarLon }, earth: { lat: subEarthLat, lon: subEarthLon }, phase: mod(phase,360), d };
}

/** Position of a remote body specified by sub-body coordinates in lunar sky. */
export function topocentric(site, subpoint) {
  const lat = site.lat, lon = site.lon;
  const delta = wrap180(subpoint.lon - lon);
  const elev = Math.asin(clamp(sin(lat) * sin(subpoint.lat) + cos(lat) * cos(subpoint.lat) * cos(delta), -1, 1)) * DEG;
  const y = sin(delta) * cos(subpoint.lat);
  const x = cos(lat) * sin(subpoint.lat) - sin(lat) * cos(subpoint.lat) * cos(delta);
  const az = wrap360(Math.atan2(y, x) * DEG);
  return { az, elev };
}

/** Illustrative unvalidated obstruction profile for showing how terrain matters. */
export function syntheticHorizon(site, azimuth, enabled) {
  if (!enabled) return 0;
  const a = azimuth * RAD;
  const seed = site.lon * RAD;
  return clamp(0.6 + 1.65 * Math.pow(Math.sin(3 * a + seed * 0.8), 2) + 0.85 * Math.pow(Math.sin(7 * a - seed), 6), 0, 3.1);
}

function interpolateAngle(a, b, t) { return wrap360(a + wrap180(b - a) * t); }
function fromCatalog(site, date, catalog) {
  const arr = catalog?.series?.[site.id];
  if (!arr || arr.length < 2) return null;
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return null;
  if (t < Date.parse(arr[0][0]) || t > Date.parse(arr[arr.length - 1][0])) return null;
  let lo = 0, hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = (hi + lo) >> 1;
    if (Date.parse(arr[mid][0]) <= t) lo = mid; else hi = mid;
  }
  const A = arr[lo], B = arr[hi];
  const ta = Date.parse(A[0]), tb = Date.parse(B[0]);
  if (tb <= ta || tb - ta > 12 * 3600000) return null;
  const f = clamp((t - ta) / (tb - ta), 0, 1);
  if ([...A.slice(1),...B.slice(1)].some(x => !Number.isFinite(x))) return null;
  return {
    sun: { az: interpolateAngle(A[1],B[1],f), elev: A[2] + (B[2]-A[2])*f },
    earth: { az: interpolateAngle(A[3],B[3],f), elev: A[4] + (B[4]-A[4])*f },
    source: 'horizons',
  };
}
export function conditions(site, date, catalog, terrain = false) {
  const cached = fromCatalog(site, date, catalog);
  const approx = analyticalSubpoints(date);
  const calc = cached || { sun: topocentric(site, approx.sun), earth: topocentric(site, approx.earth), source:'analytical' };
  const sunHorizon = syntheticHorizon(site, calc.sun.az, terrain);
  const earthHorizon = syntheticHorizon(site, calc.earth.az, terrain);
  const sunVisible = calc.sun.elev > sunHorizon;
  const earthVisible = calc.earth.elev > earthHorizon;
  return {
    date:new Date(date), source:calc.source, phase:approx.phase,
    sun: { ...calc.sun, horizon: sunHorizon, visible: sunVisible, clearance:calc.sun.elev-sunHorizon },
    earth: { ...calc.earth, horizon: earthHorizon, visible: earthVisible, clearance:calc.earth.elev-earthHorizon },
    overlap: sunVisible && earthVisible,
  };
}
function longestRun(samples, predicate, stepH) {
  let max = 0, now = 0;
  for (const s of samples) { if (predicate(s)) {now+=stepH; max=Math.max(max,now)} else now=0; }
  return max;
}
export function buildTimeline(site, startDate, durationDays, catalog, terrain = false, stepHours = 3, power = { solar:3500, load:65, battery:6000 }) {
  const start = new Date(startDate).getTime();
  const count = Math.round(durationDays*24/stepHours);
  const samples = [];
  let batteryWh = power.battery * 0.8;
  let lowBattery = false;
  let solarEnergy=0, usedEnergy=0;
  for(let i=0;i<=count;i++) {
    const state = conditions(site, new Date(start + i*stepHours*3600000), catalog, terrain);
    // Flat horizontal panel: normal is local zenith. No tracking assumed.
    const generation = Math.max(0,Math.sin(state.sun.clearance*RAD)) * power.solar;
    if(i>0) {
      batteryWh = clamp(batteryWh + (generation-power.load)*stepHours, 0, power.battery);
      solarEnergy += generation*stepHours;
      usedEnergy += power.load*stepHours;
      if(batteryWh<=0) lowBattery=true;
    }
    samples.push({ ...state, hour:i*stepHours, generation, battery: batteryWh/power.battery*100 });
  }
  const base = samples.slice(0,-1);
  const n = base.length || 1;
  const sunPct = Math.round(100*base.filter(s=>s.sun.visible).length/n);
  const earthPct = Math.round(100*base.filter(s=>s.earth.visible).length/n);
  const overlapPct = Math.round(100*base.filter(s=>s.overlap).length/n);
  const maxDark = longestRun(base,s=>!s.sun.visible,stepHours);
  const maxComm = longestRun(base,s=>!s.earth.visible,stepHours);
  // A weighted EXPLORATORY indicator, not a certified engineering score.
  const score = Math.round(clamp(0.42*sunPct + 0.42*earthPct + 0.16*overlapPct - Math.min(12,maxComm/10),0,100));
  const coverage = base.filter(s=>s.source==='horizons').length/n;
  return {site, start:new Date(start), durationDays, samples, sunPct, earthPct, overlapPct, maxDark, maxComm, score, coverage,
          minBattery:Math.round(Math.min(...samples.map(s=>s.battery))), lowBattery,
          solarEnergy:Math.round(solarEnergy), usedEnergy:Math.round(usedEnergy), power};
}
export function findNextEvent(samples, index, kind) {
  const visible = s => s[kind].visible;
  const current = visible(samples[Math.min(index,samples.length-1)]);
  for(let i=index+1;i<samples.length;i++) if(visible(samples[i])!==current) return {at:samples[i].date,kind:current?'set':'rise',hours:samples[i].hour-samples[index].hour};
  return null;
}
export function optimize(site, start, daysToSearch, durationDays, catalog, terrain, power) {
  const out=[];
  for (let offset=0; offset<=daysToSearch;offset+=2) {
    const date=new Date(new Date(start).getTime()+offset*86400000);
    const plan=buildTimeline(site,date,durationDays,catalog,terrain,6,power);
    out.push({date, ...plan});
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,5);
}
export function formatUTC(date,opts={}) {
  return new Date(date).toLocaleString('en-US', {timeZone:'UTC',month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,...opts})+' UTC';
}
export const percent = v => `${Math.round(v)}%`;
export const signedDeg = v => `${v>=0?'+':''}${v.toFixed(2)}°`;
