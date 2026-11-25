#!/usr/bin/env python3
"""Read-only Cloudflare freshness check for India; safe for GitHub Actions.

On failure the scheduled workflow requests a new build, then exits with an
honest failure status so repository operators can inspect Action logs.
No private user data, Supabase secrets or paid monitoring services.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

BASE='https://hindu-tithi-darshan.pages.dev'

def indian_day(now=None):
    return (now or datetime.now(timezone.utc)).astimezone(ZoneInfo('Asia/Kolkata')).date().isoformat()

def validate(today,info,homepage):
    errors=[]
    if not isinstance(info,dict) or info.get('indian_date')!=today:
        errors.append('build-info date is not current Indian date')
    if not re.search(r'<body\b[^>]*data-page="home"[^>]*data-date="'+re.escape(today)+r'"',homepage):
        errors.append('public homepage data-date does not match India today')
    if 'id="tithi-civil-segments"' not in homepage:
        errors.append('verified civil-day Tithi timeline is missing from homepage')
    return errors

def fetch(url):
    request=Request(url+'?freshness='+str(int(datetime.now(timezone.utc).timestamp())),
        headers={'Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':'TithiDarshan-HealthCheck/1.0'})
    with urlopen(request,timeout=20) as response:
        return response.read().decode('utf-8'),dict(response.headers.items())

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default=BASE)
    args=parser.parse_args()
    base=args.url.rstrip('/')
    today=indian_day()
    print('Indian date:',today)
    info_text,info_headers=fetch(base+'/build-info.json')
    info=json.loads(info_text)
    homepage,home_headers=fetch(base+'/')
    errors=validate(today,info,homepage)
    print('Published Indian date:',info.get('indian_date'))
    print('Build generated UTC:',info.get('generated_at_utc'))
    print('Home cache:',home_headers.get('Cache-Control','not reported'))
    print('Build-info cache:',info_headers.get('Cache-Control','not reported'))
    if errors:
        for error in errors:print('FAIL:',error,file=sys.stderr)
        return 1
    print('PASS: generated data and public homepage match India today')
    return 0

if __name__=='__main__':
    sys.exit(main())
