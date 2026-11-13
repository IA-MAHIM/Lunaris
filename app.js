import { SITES, RAD, clamp, wrap180, conditions, buildTimeline, findNextEvent, optimize, signedDeg, formatUTC } from './physics.js';
import { makeMoon } from './moon3d.js?v=site-center-20261113';

const $ = id => document.getElementById(id);
const app = {
  sites:[...SITES], selected:SITES[0], secondary:SITES[1], comparisons:[],
  start:'2026-11-13', compareStart:'2026-11-20', duration:5,
  terrain:false, catalog:null, plan:null, comparison:null,
  power:{solar:3500,load:65,battery:6000}, index:0, timer:null,
  moon:null,
};
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
const escapeHTML = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const pad = n=>String(n).padStart(2,'0');
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4100);}
function dateTimeFromDay(day){return new Date(`${day}T00:00:00.000Z`);}
const full = (v)=>Number(v).toFixed(1);
function clock(){const d=new Date();$('clock').textContent=`UTC ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;}
function renderSites(){
 const options=app.sites.map(s=>`<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} · ${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</option>`).join('');
 $('siteSelect').innerHTML=options;
 $('siteSelect').value=app.selected.id;
 for(let i=2;i<=4;i++){const node=$('compareSite'+i);if(node){node.innerHTML=options;node.value=(app.sites[[2,4,9][i-2]]||app.sites[0]).id;}}
 app.moon?.setSites(app.sites);app.moon?.select(app.selected);
}
function setSite(id){
 const site=app.sites.find(s=>s.id===id);if(!site)return;
 app.selected=site;$('siteSelect').value=id;$('latInput').value=site.lat;$('lonInput').value=site.lon;
 $('siteDescription').textContent=`${site.type} · ${site.description}`;
 app.moon?.select(site);analyze(false);
}
function customSite(){
 const lat=Number($('latInput').value), lon=Number($('lonInput').value);
 if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lon)||lon<-180||lon>360){toast('Use latitude −90° to +90° and longitude −180° to +360°.');return;}
 const lng=wrap180(lon);
 const site={id:'custom',name:'Custom Coordinate',region:'Custom Moon coordinate',lat,lon:lng,type:'User-defined coordinate',description:'Custom site uses the analytical model unless matching Horizons ephemerides are imported.'};
 app.sites=app.sites.filter(s=>s.id!=='custom').concat(site);renderSites();setSite('custom');toast('Custom lunar coordinate selected.');
}
function ephemerisStatus(plan){
 const coverage=plan.coverage;
 const valid=coverage>0.999, partial=coverage>0;
 const title=valid?'JPL HORIZONS DATA':partial?'MIXED SOURCE DATA':'ANALYTIC ESTIMATE';
 $('engineBadge').textContent=valid?'✓ JPL HORIZONS CACHE':partial?'◈ MIXED / PARTIAL JPL':'◇ ANALYTIC ESTIMATE';
 $('engineBadge').classList.toggle('real',valid);
 $('dataModeHero').textContent=valid?'CACHED JPL HORIZONS EPHEMERIDES LOADED':partial?'MIXED NASA JPL DATA + ESTIMATES':'ANALYTIC DEMONSTRATION • NASA DATA IMPORT READY';
 $('sourceModeBig').textContent=valid?'JPL Horizons ephemeris':partial?'Mixed JPL / analytical data':'Analytical estimate';
 $('sourceDescription').textContent=valid
  ?`Cached official Horizons Sun/Earth azimuth and elevation are interpolated for this site and date range (coverage ${(coverage*100).toFixed(0)}%). Terrain effects, power calculations and opportunity scores remain simplified models.`
  :partial?`Some timestamps come from a JPL Horizons cache (${(coverage*100).toFixed(0)}% coverage). Others use an explicitly labeled analytical approximation. NEVER interpret mixed output as uniform NASA-verified data.`
  :'First-order simplified Sun–Moon geometry and approximate Earth libration. These results are illustrative, not NASA-validated and unsuitable for real mission decisions. Run the supplied Horizons fetch script to create actual ephemeris samples.';
 return title;
}
function analyze(showToast=false){
 stop();
 const duration=Number($('durationSelect').value);app.duration=duration;
 app.start=$('dateInput').value || '2026-11-13';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(app.start)){toast('Select a valid UTC mission date.');return;}
 app.terrain=$('terrainToggle').checked;
 app.plan=buildTimeline(app.selected,dateTimeFromDay(app.start),duration,app.catalog,app.terrain,3,app.power);
 if(!app.plan?.samples?.length)return;
 app.index=0;
 renderSummary();renderTimeline();renderChart();renderPlayback();renderCompare();
 if(showToast){toast(`Mission analyzed: ${app.selected.name} • ${duration} days.`);navigate('analysis');}
}
function renderSummary(){
 const p=app.plan, s=app.selected;
 $('metricLat').textContent=`${Math.abs(s.lat).toFixed(2)}° ${s.lat<0?'S':'N'}`;
 $('metricSun').textContent=p.sunPct+'%';$('metricEarth').textContent=p.earthPct+'%';$('metricScore').textContent=p.score+'/100';
 ephemerisStatus(p);
 if($('analysisScenario'))$('analysisScenario').textContent=`${s.name} · ${app.start} · ${p.durationDays} days`;
 if($('analysisMode'))$('analysisMode').textContent=p.coverage===1?'JPL Horizons cache':p.coverage>0?'Mixed JPL data / estimate':'Analytical estimate (not JPL-validated)';
 if($('reportSummary'))$('reportSummary').textContent=`${s.name} • ${Math.abs(s.lat).toFixed(3)}° ${s.lat<0?'S':'N'}, ${Math.abs(s.lon).toFixed(3)}° ${s.lon<0?'W':'E'} • ${app.start} • ${p.durationDays} Earth days`;
 for(const [id,v] of [['reportSun',p.sunPct+'%'],['reportEarth',p.earthPct+'%'],['reportOverlap',p.overlapPct+'%'],['reportScore',p.score+'/100']])if($(id))$(id).textContent=v;
 if($('reportSource'))$('reportSource').textContent=p.coverage===1?'JPL Horizons cached ephemerides · power/terrain estimates remain simplified':p.coverage>0?'Mixed Horizons/estimated geometry; check timestamp coverage':'Analytical estimate; NOT verified NASA calculations';
}
function renderSky(state){
 const cx=180,cy=149,r=108;
 const point=(body,cl)=>{const elev=body.elev,az=body.az*RAD;
 const effective=clamp(elev,0,90);const radius=r*(90-effective)/90;
 const x=cx+radius*Math.sin(az), y=cy-radius*Math.cos(az);
 return `<g><circle cx="${x}" cy="${y}" r="${body.visible?15:13}" stroke="${cl}" stroke-opacity=".3" stroke-width="1.5" fill="${cl}" fill-opacity="${body.visible?.14:.045}"/>
 <circle cx="${x}" cy="${y}" r="5.6" fill="${body.visible?cl:'#122635'}" stroke="${cl}" stroke-width="2"/>
 <text x="${cl==='#eec481'?x+13:x-14}" y="${y-14}" fill="${cl}" font-size="11" font-weight="bold" text-anchor="${cl==='#eec481'?'start':'end'}">${cl==='#eec481'?'SUN':'EARTH'}</text></g>`;};
 $('skySvg').innerHTML=`<defs><radialGradient id="radarFill"><stop offset="0" stop-color="#163549"/><stop offset="1" stop-color="#091724"/></radialGradient></defs>
 <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#radarFill)" stroke="#2e5166" stroke-width="2"/>
 <circle cx="${cx}" cy="${cy}" r="72" fill="none" stroke="#315066" stroke-dasharray="4 5"/><circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="#315066" stroke-dasharray="3 6"/>
 <path d="M${cx-r},${cy}H${cx+r}M${cx},${cy-r}V${cy+r}" stroke="#34586c" stroke-dasharray="4 5"/>
 <g fill="#829faf" font-size="11" font-family="system-ui" font-weight="700"><text x="180" y="20" text-anchor="middle">N</text><text x="310" y="152" text-anchor="middle">E</text><text x="180" y="283" text-anchor="middle">S</text><text x="50" y="152" text-anchor="middle">W</text></g>
 <text x="190" y="112" fill="#688da1" font-size="9">60°</text><text x="190" y="77" fill="#688da1" font-size="9">30°</text>
 ${point(state.sun,'#eec481')}${point(state.earth,'#6dbfe9')}
 <text x="180" y="303" fill="#637f90" text-anchor="middle" font-size="9">ZENITH-CENTERED SKY PROJECTION</text>`;
 $('sunElevation').textContent=signedDeg(state.sun.elev);$('earthElevation').textContent=signedDeg(state.earth.elev);
 $('sunStatus').textContent=state.sun.visible?'● Above modeled horizon':'○ Below / obscured';
 $('earthStatus').textContent=state.earth.visible?'● Direct Earth line of sight':'○ No direct Earth line of sight';
 $('sunStatus').style.color=state.sun.visible?'#e7bd79':'#a7a5a1';
 $('earthStatus').style.color=state.earth.visible?'#80d4ee':'#8ca2ae';
}
function renderTimeline(){
 const a=app.plan.samples.slice(0,-1),n=a.length;
 for(const [id,key,cls] of [['sunTimeline','sun','sun'],['earthTimeline','earth','earth'],['overlapTimeline','overlap','overlap']]){
  const on=(s)=>key==='overlap'?s.overlap:s[key].visible;
  $(id).className=`timeline-row ${cls}`;$(id).innerHTML=a.map(s=>`<span class="${on(s)?'on':''}" title="${escapeHTML(formatUTC(s.date))} · ${on(s)?'Visible':'Not visible'}"></span>`).join('');
 }
 const dayCount=app.plan.durationDays;
 $('timelineTicks').innerHTML=Array.from({length:Math.min(dayCount+1,8)},(_,i)=>`<span>DAY ${Math.round(i*dayCount/Math.min(dayCount,7))}</span>`).join('');
 $('timeSlider').max=app.plan.samples.length-1;
 $('darkPeriod').textContent=app.plan.maxDark.toFixed(0)+' hrs';$('commPeriod').textContent=app.plan.maxComm.toFixed(0)+' hrs';
}
function eventText(event){return event ? `${event.kind==='set'?'↓':'↑'} ${event.kind==='set'?'Set':'Rise'} in ~${event.hours.toFixed(0)}h` : 'No change within window';}
function renderPlayback(){
 const samples=app.plan.samples;
 app.index=clamp(app.index,0,samples.length-1);
 const s=samples[app.index];$('timeSlider').value=app.index;
 $('timeStamp').textContent=formatUTC(s.date,{year:undefined}).replace(' UTC','');
 renderSky(s);$('nextSun').textContent=eventText(findNextEvent(samples,app.index,'sun'));$('nextEarth').textContent=eventText(findNextEvent(samples,app.index,'earth'));
 $('batteryValue').textContent=s.battery.toFixed(0);$('batteryFill').style.width=s.battery+'%';
 const danger=s.battery<15;
 $('batteryFill').style.background=danger?'linear-gradient(90deg,#e07766,#e9b778)':'linear-gradient(90deg,#38b7ac,#78efcf)';
 $('batteryWarning').textContent=danger?'⚠ Illustrative battery falls below 15%. Reconsider capacity, panel, or load.': 'Flat, horizontal array • idealized storage • energy balance only.';
}
function stop(){if(app.timer){clearInterval(app.timer);app.timer=null;}$('playBtn').textContent='▶';}
function playback(){if(!app.plan)return;if(app.timer){stop();return;}if(app.index>=app.plan.samples.length-1)app.index=0;
 $('playBtn').textContent='❚❚';app.timer=setInterval(()=>{const speed=Number($('speedSelect').value);app.index=Math.min(app.plan.samples.length-1,app.index+speed);renderPlayback();if(app.index>=app.plan.samples.length-1)stop();},640);}
function pathForPoints(series,{left=52,right=1099,top=19,bottom=222,min=-20,max=20}){
 return series.map((v,i)=>`${i?'L':'M'}${(left+(i/(series.length-1))* (right-left)).toFixed(2)},${(bottom-(v-min)/(max-min)*(bottom-top)).toFixed(2)}`).join(' ');
}
function renderChart(){
 const arr=app.plan.samples;
 const all=arr.flatMap(s=>[s.sun.elev,s.earth.elev]);
 const high=Math.max(12,Math.ceil(Math.max(...all)/10)*10+2);
 const low=Math.min(-12,Math.floor(Math.min(...all)/10)*10-2);
 const L=52,R=1097,T=20,B=224;
 let svg=`<rect x="${L}" y="${T}" width="${R-L}" height="${B-T}" fill="#0b1e2d" rx="5"/>`;
 for(let i=0;i<=4;i++){
  const val=low+(high-low)*i/4, y=B-i*(B-T)/4;
  svg+=`<path d="M${L} ${y}H${R}" stroke="#284458" stroke-dasharray="3 7"/><text x="${L-10}" y="${y+4}" text-anchor="end" fill="#7792a7" font-size="11">${val.toFixed(0)}°</text>`;
 }
 for(let i=0;i<=app.plan.durationDays;i++){
   const x=L+i*(R-L)/app.plan.durationDays;
   svg+=`<path d="M${x} ${T}V${B}" stroke="#243e50" opacity=".5"/><text x="${x}" y="${B+22}" fill="#708fa4" font-size="11" text-anchor="middle">D${i}</text>`;
 }
 const y0=B-(0-low)/(high-low)*(B-T);
 if(y0>=T&&y0<=B) svg+=`<path d="M${L} ${y0}H${R}" stroke="#b1b3b4" stroke-width="1.1" stroke-dasharray="6 6"/>`;
 svg+=`<path d="${pathForPoints(arr.map(s=>s.sun.elev),{left:L,right:R,top:T,bottom:B,min:low,max:high})}" stroke="#eec481" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
 svg+=`<path d="${pathForPoints(arr.map(s=>s.earth.elev),{left:L,right:R,top:T,bottom:B,min:low,max:high})}" stroke="#6dbfe9" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
 svg+=`<text x="${L}" y="12" fill="#7c99ab" font-size="11">DEGREES ABOVE LOCAL SPHERICAL HORIZON</text>`;
 $('elevationChart').innerHTML=svg;
}
function scenarioCard(p,label,winning){
 return `<div class="scenario-card ${winning?'best':''}"><div class="scenario-caption"><span>${label}</span><strong>${winning?'◎ HIGHER HEURISTIC SCORE':'MISSION SCENARIO'}</strong></div><h3>${escapeHTML(p.site.name)}</h3><p>${escapeHTML(formatUTC(p.start,{hour:undefined,minute:undefined}).replace(' UTC',''))} · ${p.durationDays} Earth days · ${p.site.lat.toFixed(2)}°, ${p.site.lon.toFixed(2)}°</p><div class="scenario-metrics"><div><span>SUNLIT</span><b>${p.sunPct}%</b></div><div><span>EARTH LINK</span><b>${p.earthPct}%</b></div><div><span>OVERLAP</span><b>${p.overlapPct}%</b></div></div><div class="scenario-bottom"><span>LONGEST EARTH BLACKOUT<br/><b>${p.maxComm} h</b></span><span>WINDOW INDEX <b>${p.score}/100</b></span></div></div>`;
}
function renderCompare(){
 if(!app.plan)return;
 const scenarios=[app.plan];
 for(let i=2;i<=4;i++){
   const sel=$('compareSite'+i), date=$('compareDate'+i);
   const site=app.sites.find(s=>s.id===sel.value)||app.sites[i];
   const start=date.value||app.start;
   const plan=buildTimeline(site,dateTimeFromDay(start),app.duration,app.catalog,app.terrain,3,app.power);
   scenarios.push(plan);
 }
 app.comparisons=scenarios;
 const top=Math.max(...scenarios.map(p=>p.score));
 $('compareCards').innerHTML=scenarios.map((p,i)=>scenarioCard(p,`SCENARIO ${'ABCD'[i]} · ${i?'ALTERNATIVE':'YOUR PLAN'}`,p.score===top)).join('');
}

function runOptimize(){
 const start=dateTimeFromDay(app.start),span=Number($('searchDays').value);
 $('optimizerResults').innerHTML='<div class="empty-state">Analyzing candidate starts…</div>';
 // Render first so a browser can show immediate feedback before CPU work.
 requestAnimationFrame(()=>setTimeout(()=>{
 const best=optimize(app.selected,start,span,app.duration,app.catalog,app.terrain,app.power);
 $('optimizerResults').innerHTML=best.map((p,i)=>`<div class="result-row"><span class="rank">#${i+1}</span><div class="result-date"><b>${escapeHTML(p.date.toISOString().slice(0,10))}</b><small>${p.durationDays}-day window · UTC</small></div><div class="result-kpi"><span>SUNLIT</span><b>${p.sunPct}%</b></div><div class="result-kpi"><span>EARTH</span><b>${p.earthPct}%</b></div><div class="result-kpi"><span>INDEX</span><b>${p.score}/100</b></div><button class="btn btn-outline" data-date="${p.date.toISOString().slice(0,10)}">Use this date →</button></div>`).join('')+`<p style="font-size:10px;color:#7891a4;line-height:1.5;padding-top:8px">Scanned in 2-day increments. Rankings apply only to the chosen exploratory models and available dataset coverage. The index is not a NASA mission feasibility rating.</p>`;
 $('optimizerResults').querySelectorAll('button[data-date]').forEach(b=>b.addEventListener('click',()=>{$('dateInput').value=b.dataset.date;analyze(true);navigate('analysis');}));
 toast('Mission opportunity search completed.');
 },10));
}
function reportMarkdown(){
 const p=app.plan, s=app.selected;
 const source=p.coverage===1?'Cached JPL Horizons':p.coverage>0?'Mixed cached JPL and analytical estimate':'First-order analytical approximation';
 return `# LUNARIS — Lunar Mission Window Report\n\nGenerated: ${new Date().toISOString()}\nTeam: CodexGalaxy / IUBAT / NASA Space Apps Challenge 2026\n\n## Scenario\n- Site: ${s.name} (${s.type})\n- Latitude: ${s.lat.toFixed(5)}°\n- East longitude: ${s.lon.toFixed(5)}°\n- Start: ${p.start.toISOString()}\n- Duration: ${p.durationDays} Earth days\n- Synthetic terrain horizon enabled: ${app.terrain?'YES (not LOLA)':'NO'}\n\n## Indicators\n- Time with Sun above modeled horizon: ${p.sunPct}%\n- Time with Earth center above modeled horizon: ${p.earthPct}%\n- Time with both: ${p.overlapPct}%\n- Longest darkness within sampled window: ${p.maxDark} hours\n- Longest direct-Earth blackout within sampled window: ${p.maxComm} hours\n- Exploratory score (not flight validation): ${p.score}/100\n- Minimum modeled battery level: ${p.minBattery}%\n- Battery capacity: ${p.power.battery} Wh; panel ${p.power.solar} W; load ${p.power.load} W\n\n## Scientific provenance and limitations\n- Geometry source: ${source} (${(p.coverage*100).toFixed(1)}% JPL timestamp coverage)\n- Without imported ephemerides, values are approximate, not JPL-validated.\n- The terrain model is flat/zero horizon unless the educational synthetic obstruction toggle is enabled. No measured LOLA/DEM elevation is used.\n- The battery model assumes a fixed horizontal panel and simplified energy balance, ignoring temperature, shadows beyond the chosen horizon model, efficiency, electrical limits, thermal conditions, and antenna constraints.\n- Visibility uses Earth-center elevation; real links require a complete radio budget and terrain analysis.\n- This work is an educational demonstration, not for actual spacecraft planning.\n\n## References\n- NASA Space Apps Challenge: https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/\n- JPL Horizons: https://ssd.jpl.nasa.gov/horizons/\n- LRO LOLA: https://pds-geosciences.wustl.edu/missions/lro/lola.htm\n- LROC Quickmap: https://quickmap.lroc.asu.edu/\n- NASA Moon Trek: https://trek.nasa.gov/moon/\n- Canadian Space Agency Moon Exploration: https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/\n- Apollo reference coordinates: https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html\n\n## Four scenario comparison\n${(app.comparisons.length?app.comparisons:[p]).map((c,i)=>`- ${'ABCD'[i]}: ${c.site.name}, ${c.start.toISOString().slice(0,10)}, Sun ${c.sunPct}%, Earth ${c.earthPct}%, both ${c.overlapPct}%, blackout ${c.maxComm}h, index ${c.score}/100`).join('\n')}\n`;
}
function downloadReport(){const blob=new Blob([reportMarkdown()],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`LUNARIS_report_${app.selected.id}_${app.start}.md`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Mission report downloaded.');}
function downloadCSV(){
 if(!app.plan?.samples?.length){toast('Analyze a mission first.');return;}
 const rows=[['timestamp_utc','hours_from_start','sun_azimuth_deg','sun_elevation_deg','sun_visible','earth_azimuth_deg','earth_elevation_deg','earth_visible','overlap','battery_percent','geometry_source']];
 for(const s of app.plan.samples){rows.push([s.date.toISOString(),s.hour,s.sun.az.toFixed(5),s.sun.elev.toFixed(5),s.sun.visible,s.earth.az.toFixed(5),s.earth.elev.toFixed(5),s.earth.visible,s.overlap,s.battery.toFixed(1),s.source]);}
 const blob=new Blob([rows.map(a=>a.join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=`LUNARIS_timeline_${app.selected.id}_${app.start}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Mission timeline CSV downloaded.');
}
const PAGES=['overview','planner','analysis','comparison','methods','report'];
function navigate(where){
 const id=PAGES.includes(where)?where:'overview';
 if(id==='analysis'&&!app.plan){toast('Please configure your mission first.');return navigate('planner');}
 if(id==='comparison'&&app.plan)renderCompare();
 if(id==='report'&&app.plan)renderSummary();
 for(const x of PAGES){const el=$(x);if(el){el.classList.toggle('is-active',x===id);el.hidden=x!==id;}}
 document.querySelectorAll('.nav-link').forEach(a=>{const selected=a.getAttribute('href')==='#'+id;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.body.setAttribute('data-view',id);
 if(location.hash!=='#'+id)history.pushState(null,'','#'+id);
 window.scrollTo({top:0,behavior:'instant'});
 if(id==='planner')requestAnimationFrame(()=>setTimeout(()=>app.moon?.resize(),75));
}
function handleRoute(){navigate(location.hash.slice(1)||'overview');}
function validateCatalog(obj){
 if(!obj||obj.schema!=='lunaris-horizons-v1'||!obj.series||typeof obj.series!=='object')throw Error('Expected LUNARIS Horizons v1 JSON.');
 for(const [id,arr] of Object.entries(obj.series)){
  if(!Array.isArray(arr)||arr.length<2)throw Error(`Series ${id} must have at least two timestamped samples.`);
  for(const a of arr){if(!Array.isArray(a)||a.length<5||!Number.isFinite(Date.parse(a[0]))||a.slice(1,5).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error(`Invalid sample in ${id}.`);}
  for(let i=1;i<arr.length;i++)if(Date.parse(arr[i][0])<=Date.parse(arr[i-1][0]))throw Error(`Non-monotonic timestamps in ${id}.`);
 }
 return obj;
}
async function loadCatalog(){
 try{const res=await fetch('data/horizons-catalog.json',{cache:'no-store'});if(!res.ok)throw Error(`HTTP ${res.status}`);app.catalog=validateCatalog(await res.json());analyze(false);}
 catch(err){console.warn('No precomputed JPL Horizons catalog; using educational model:',err.message)}
}
async function importCatalog(event){
 const f=event.target.files[0];if(!f)return;
 try{const obj=validateCatalog(JSON.parse(await f.text()));app.catalog=obj;analyze(false);const size=Object.values(obj.series).reduce((acc,v)=>acc+v.length,0);
 $('importMessage').textContent=`Imported ${size} cached JPL samples across ${Object.keys(obj.series).length} site(s). Source switches automatically when the selected site and date range match.`;
 toast('Horizons data imported into this browser session.');}
 catch(err){toast('Could not import: '+err.message)}finally{event.target.value='';}
}
function bind(){
 $('siteSelect').addEventListener('change',e=>setSite(e.target.value));
 $('applyCoords').addEventListener('click',customSite);
 $('analyzeBtn').addEventListener('click',()=>analyze(true));
 $('resetView').addEventListener('click',()=>app.moon.focus());
 $('dateInput').addEventListener('change',()=>analyze());
 $('durationSelect').addEventListener('change',()=>analyze());
 $('terrainToggle').addEventListener('change',()=>{analyze();toast(app.terrain?'Illustrative synthetic terrain is active. This is not LOLA data.':'Using a zero-degree spherical horizon.');});
 $('timeSlider').addEventListener('input',e=>{app.index=Number(e.target.value);renderPlayback()});
 $('playBtn').addEventListener('click',playback);
 $('compareBtn').addEventListener('click',()=>{renderCompare();toast('Four-scenario comparison updated.')});
 $('compareFromAnalysis').addEventListener('click',()=>navigate('comparison'));
 $('optimizeBtn').addEventListener('click',runOptimize);
 $('exportBtn').addEventListener('click',downloadReport);
 $('exportCSV').addEventListener('click',downloadCSV);
 $('printBtn').addEventListener('click',()=>window.print());
 $('jplImport').addEventListener('change',importCatalog);
 const bindPower=(id,k,label)=>$(id).addEventListener('input',e=>{app.power[k]=Number(e.target.value);$(label).textContent=app.power[k]+' '+(k==='battery'?'Wh':'W');analyze(false)});
 bindPower('solarInput','solar','solarLabel');bindPower('loadInput','load','loadLabel');bindPower('capacityInput','battery','capacityLabel');
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const dest=a.getAttribute('href').slice(1);if(PAGES.includes(dest)){e.preventDefault();navigate(dest);}}));
 window.addEventListener('hashchange',handleRoute);
 window.addEventListener('popstate',handleRoute);
}
function main(){
 clock();setInterval(clock,1000);
 app.moon=makeMoon($('moonCanvas'),$('moonOverlay'),'assets/moon-texture.jpg',(id)=>{setSite(id);toast(`Selected ${app.selected.name} from the interactive Moon.`)});
 renderSites();bind();setSite('south-pole');app.moon.focus();handleRoute();loadCatalog();
 // Explicitly note which parts are illustrative in our output and open-data citations.
 console.info('LUNARIS 2026: offline analytic estimation enabled. Use scripts/fetch_horizons.py for cached NASA/JPL results.');
}
main();
