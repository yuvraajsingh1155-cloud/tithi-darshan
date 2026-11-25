from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
import sys, json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from panchang import panchang_for,civil_tithi_segments

CITIES=json.loads((Path(__file__).resolve().parents[1]/'data/cities.json').read_text(encoding='utf-8'))
IST=ZoneInfo('Asia/Kolkata')

def validate(day,city):
    intervals=civil_tithi_segments(day)
    assert 1<=len(intervals)<=4
    midnight=datetime(day.year,day.month,day.day,tzinfo=IST)
    assert datetime.fromisoformat(intervals[0]['startIso'])==midnight
    assert datetime.fromisoformat(intervals[-1]['endIso'])==midnight+timedelta(days=1)
    for i,seg in enumerate(intervals):
        start=datetime.fromisoformat(seg['startIso'])
        end=datetime.fromisoformat(seg['endIso'])
        assert end>start
        assert seg['tithi'] and seg['paksha']
        if i:assert start==datetime.fromisoformat(intervals[i-1]['endIso'])
    p=panchang_for(day,city)
    sunrise=datetime.fromisoformat(p['sunriseIso'])
    current=[x for x in intervals if datetime.fromisoformat(x['startIso'])<=sunrise<datetime.fromisoformat(x['endIso'])]
    assert len(current)==1
    assert current[0]['tithi']==p['tithi']
    assert current[0]['paksha']==p['paksha']

def test_tithi_timeline_known_delhi_transition():
    d=date(2026,11,26)
    validate(d,CITIES[0])
    p=panchang_for(d,CITIES[0])
    transitions=civil_tithi_segments(d)
    assert transitions[0]['tithi']=='द्वितीया' or any(seg['tithi']=='द्वितीया' for seg in transitions)
    assert any(seg['tithi']=='तृतीया' for seg in transitions)
    assert p['tithi']=='द्वितीया'

def test_leap_year_year_boundaries_and_city_consistency():
    for d in [date(2024,2,29),date(2026,12,31),date(2027,1,1),date(2027,6,1)]:
        validate(d,CITIES[0])
    for city in [CITIES[1],CITIES[8],CITIES[3]]:
        validate(date(2026,11,26),city)

def test_tithi_label_can_skip_or_repeat_at_sunrise_without_assuming_one_daily_transition():
    for d in [date(2026,11,17),date(2026,11,18),date(2026,11,19),date(2026,11,20)]:
        validate(d,CITIES[0])
