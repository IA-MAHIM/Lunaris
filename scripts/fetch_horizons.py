#!/usr/bin/env python3
"""Generate a reusable, static JPL Horizons ephemeris catalog for LUNARIS.

Official endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
Usage (run on your own internet-connected machine):
    python scripts/fetch_horizons.py --contact you@example.com --start 2026-11-13 --days 75

No API key needed. Request Sun and Earth one at a time, cache locally.
Warning: Parses the Horizons CSV_FORMAT observer table with QUANTITIES='4'.
Review result carefully and validate known test cases against the Horizons UI.
"""
import argparse
import csv
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent.parent
DEST = HERE / 'data' / 'horizons-catalog.json'
API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
SITES = {
    'south-pole': (0.0,-89.50), 'polar-ridge': (35.0,-88.80),
    'polar-basin': (95.0,-88.40), 'polar-plateau': (140.0,-87.80),
    'chandrayaan3': (32.319,-69.373), 'im1': (1.44,-80.13),
    'apollo-11': (23.47314,0.67416), 'apollo-12': (-23.4219,-3.0128),
    'apollo-14': (-17.47194,-3.64589), 'apollo-15': (3.6333,26.13239),
    'apollo-16': (15.5011,-8.9734), 'apollo-17': (30.7723,20.1911),
    'change3': (-19.5116,44.1214), 'change4': (177.599,-45.444),
    'change5': (-51.9161,43.0576), 'change6': (-153.9852,-41.6385),
}
FLOAT = re.compile(r'^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$')

def iso_date(raw):
    raw = re.sub(r'^(A\.D\.|AD)\s*','',raw.strip())
    for fmt in ('%Y-%b-%d %H:%M','%Y-%b-%d %H:%M:%S','%Y-%m-%d %H:%M'):
        try:
            return datetime.strptime(raw,fmt).replace(tzinfo=timezone.utc).isoformat(timespec='minutes').replace('+00:00','Z')
        except ValueError:
            pass
    raise ValueError(f'Unrecognized Horizons date format: {raw!r}')

def parse_csv_table(result):
    if '$$SOE' not in result or '$$EOE' not in result:
        raise ValueError('Horizons response did not contain a complete $$SOE / $$EOE table. '
                         'Review server message: '+result[:550].replace('\n',' '))
    table=result.split('$$SOE',1)[1].split('$$EOE',1)[0]
    rows=[]
    for line in table.splitlines():
        if not line.strip(): continue
        parts=next(csv.reader([line],skipinitialspace=True))
        if len(parts)<3: continue
        stamp=iso_date(parts[0])
        nums=[float(x.strip()) for x in parts[1:] if FLOAT.fullmatch(x.strip())]
        if len(nums)<2:
            raise ValueError('Missing azimuth / elevation in table row: '+line[:180])
        az,el=nums[-2:]
        if not (0<=az<=360 and -90<=el<=90):
            raise ValueError(f'Out-of-range angles ({az}, {el}): '+line[:180])
        rows.append((stamp,round(az,7),round(el,7)))
    if len(rows)<2: raise ValueError('Too few ephemeris rows returned.')
    return rows

def fetch_body(site, body, start, stop, step_hours, contact):
    lon,lat=SITES[site]
    params={
        'format':'json','COMMAND':f"'{body}'",'OBJ_DATA':"'NO'",
        'MAKE_EPHEM':"'YES'",'EPHEM_TYPE':"'OBSERVER'",
        'CENTER':"'coord@301'",'COORD_TYPE':"'GEODETIC'",
        'SITE_COORD':f"'{lon:.6f},{lat:.6f},0'",
        'START_TIME':f"'{start:%Y-%m-%d}'", 'STOP_TIME':f"'{stop:%Y-%m-%d}'",
        'STEP_SIZE':f"'{step_hours} h'", 'QUANTITIES':"'4'",
        'CSV_FORMAT':"'YES'",'TIME_DIGITS':"'MINUTES'",
        'EXTRA_PREC':"'YES'", 'APPARENT':"'AIRLESS'",
    }
    url=API+'?'+urllib.parse.urlencode(params)
    agent=f'LUNARIS-CodexGalaxy/1.0 (research demo; contact: {contact})'
    req=urllib.request.Request(url,headers={'User-Agent':agent,'Accept':'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=110) as r:
                data=json.load(r)
            if 'result' not in data: raise ValueError('Unexpected Horizons API response: '+repr(data)[:300])
            return parse_csv_table(data['result'])
        except (urllib.error.URLError,TimeoutError) as exc:
            if attempt==2: raise
            print(f'  Transient API issue: {exc}; retrying with backoff',file=sys.stderr)
            time.sleep(3*(2**attempt))

def generate(args):
    if '@' not in args.contact or args.contact.endswith('@example.com'):
        raise SystemExit('Supply your own valid contact email using --contact. NASA asks API clients to identify themselves.')
    start=datetime.strptime(args.start,'%Y-%m-%d').replace(tzinfo=timezone.utc)
    stop=start+timedelta(days=args.days)
    output={'schema':'lunaris-horizons-v1','generated':datetime.now(timezone.utc).isoformat(),
     'source':'NASA/JPL Horizons, observer ephemeris QUANTITIES 4, airless lunar surface topocentric azimuth/elevation',
     'origin':'https://ssd.jpl.nasa.gov/api/horizons.api',
     'period':[start.isoformat(),stop.isoformat()], 'step_hours':args.step_hours,
     'reference':'Approximate spherical Moon site coordinates, 0 km reference elevation; terrain NOT included',
     'series':{}}
    for site in args.sites:
        if site not in SITES: raise SystemExit(f'Unknown site: {site}')
        print(f'Fetching {site} Sun (10)…',flush=True)
        sun=fetch_body(site,'10',start,stop,args.step_hours,args.contact)
        time.sleep(args.delay)
        print(f'Fetching {site} Earth (399)…',flush=True)
        earth=fetch_body(site,'399',start,stop,args.step_hours,args.contact)
        time.sleep(args.delay)
        sun_map={t:(a,e) for t,a,e in sun}
        earth_map={t:(a,e) for t,a,e in earth}
        timestamps=sorted(sun_map.keys() & earth_map.keys())
        if len(timestamps)<2:raise ValueError(f'Cannot align Sun and Earth timestamps for {site}')
        output['series'][site]=[[t,*sun_map[t],*earth_map[t]] for t in timestamps]
        print(f'  Saved {len(timestamps)} aligned rows',flush=True)
        # Save incrementally so partial work survives an interruption.
        DEST.write_text(json.dumps(output,separators=(',',':')),encoding='utf-8')
    print(f'\nSUCCESS: wrote {DEST} ({DEST.stat().st_size / 1024:.1f} KB)')
    print('Run a local server or commit this JSON file to GitHub. The web app will read it automatically.')
    print('Verify a few sampled outputs against https://ssd.jpl.nasa.gov/horizons/app.html .')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--contact',required=True,help='Your real contact email (for NASA/JPL fair-use User-Agent)')
    parser.add_argument('--start',default='2026-11-13',help='UTC start date YYYY-MM-DD')
    parser.add_argument('--days',type=int,default=75)
    parser.add_argument('--step-hours',type=int,default=3,choices=(1,2,3,4,6,8,12))
    parser.add_argument('--delay',type=float,default=1.5,help='Delay in seconds between sequential API requests')
    parser.add_argument('--sites',nargs='+',choices=list(SITES),default=['south-pole','chandrayaan3','apollo-11','change6'])
    args=parser.parse_args()
    if not 1<=args.days<=365:raise SystemExit('--days must be between 1 and 365')
    generate(args)
