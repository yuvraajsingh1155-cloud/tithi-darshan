"""Regression: Swiss Ephemeris moon events for Lucknow Nov 26, 2026.

Reference: public local Panchang Moonrise 18:51, Moonset 08:24 (IST).
Reference example: https://astroconnect.app/panchang/lucknow-in-1264733/2026-11-26
Times can vary slightly by elevation/refraction and calculation conventions.
"""
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from panchang import panchang_for

ROOT=Path(__file__).resolve().parents[1]
CITIES=json.loads((ROOT/'data/cities.json').read_text(encoding='utf-8'))

def test_lucknow_moonrise_moonset_independent_reference():
    lucknow=next(c for c in CITIES if c['slug']=='lucknow')
    p=panchang_for(date(2026,11,26),lucknow)
    moonrise=datetime.fromisoformat(p['moonriseIso']).astimezone(ZoneInfo('Asia/Kolkata'))
    moonset=datetime.fromisoformat(p['moonsetIso']).astimezone(ZoneInfo('Asia/Kolkata'))
    assert moonrise.date()==date(2026,11,26)
    assert moonset.date()==date(2026,11,26)
    assert abs((moonrise.hour*60+moonrise.minute)-(18*60+51))<=4
    assert abs((moonset.hour*60+moonset.minute)-(8*60+24))<=4
    assert p['moonrise'] and p['moonset']
