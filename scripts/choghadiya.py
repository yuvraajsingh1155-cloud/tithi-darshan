"""Traditional day/night Choghadiya in 8 equal solar segments.

The weekday order is independently listed by Drik Panchang:
https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html

Uses the website's already-calculated Swiss Ephemeris city sunrise/sunset.
Not a full Muhurta election, Vaar Vela, Kaal Vela or Kaal Ratri decision.
"""
from __future__ import annotations
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
import re

CYCLE=('उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग')
# Python date.weekday(): Monday=0 ... Sunday=6
START_BY_WEEKDAY=(3,6,2,5,1,4,0)
BENEFICIAL=frozenset(('अमृत','शुभ','लाभ','चर'))
NIGHT_CYCLE=('शुभ','अमृत','चर','रोग','काल','लाभ','उद्वेग')
# Monday through Sunday. Night begins with the fifth weekday's lord.
NIGHT_START_BY_WEEKDAY=(2,4,6,1,3,5,0)

def _minutes(clock: str) -> float:
    # Astronomy source gives timezone-aware ISO timestamps, not a rendered Hindi
    # twelve-hour clock. Preserve sub-minute precision until display rounding.
    if 'T' in clock:
        dt=datetime.fromisoformat(clock)
        if dt.tzinfo is None:raise ValueError('Sunrise/sunset ISO clock requires timezone')
        local=dt.astimezone(ZoneInfo('Asia/Kolkata'))
        return local.hour*60+local.minute+local.second/60+local.microsecond/60000000
    m=re.fullmatch(r'(\d{1,2}):(\d{2})',clock.strip())
    if not m:raise ValueError('Sunrise and sunset must be HH:MM or timezone-aware ISO')
    h,minute=map(int,m.groups())
    if not 0<=h<=23 or not 0<=minute<=59:raise ValueError('Invalid clock')
    return h*60+minute

def _clock(minutes: int) -> str:
    m=minutes%1440
    return f'{m//60:02}:{m%60:02}'

def daytime_choghadiya(day:date,sunrise:str,sunset:str) -> list[dict]:
    rise=_minutes(sunrise)
    set_=_minutes(sunset)
    duration=set_-rise
    if not 300<=duration<=1100:
        raise ValueError('Invalid daytime duration for Indian cities')
    first=START_BY_WEEKDAY[day.weekday()]
    rows=[]
    for index in range(8):
        name=CYCLE[(first+index)%7]
        start=int(rise+index*duration/8)
        end=int(rise+(index+1)*duration/8)
        values={'name':name,'category':'अनुकूल' if name in BENEFICIAL else 'सावधानी',
            'favorable':name in BENEFICIAL,'start':_clock(start),'end':_clock(end)}
        if 'T' in sunrise and 'T' in sunset:
            begin=datetime.fromisoformat(sunrise)
            finish=datetime.fromisoformat(sunset)
            duration_sec=(finish-begin).total_seconds()
            values['startIso']=(begin+timedelta(seconds=duration_sec*index/8)).isoformat()
            values['endIso']=(begin+timedelta(seconds=duration_sec*(index+1)/8)).isoformat()
        rows.append(values)
    return rows

def nighttime_choghadiya(day:date,sunset_iso:str,next_sunrise_iso:str) -> list[dict]:
    """Eight traditional sunset-to-NEXT-sunrise slots, including after midnight.

    The starting name follows the fifth weekday's planetary lord.
    This list is labelled for the sunset's date, not the following civil day.
    """
    sunset=datetime.fromisoformat(sunset_iso)
    sunrise=datetime.fromisoformat(next_sunrise_iso)
    if sunset.tzinfo is None or sunrise.tzinfo is None:
        raise ValueError('Timezone-aware sunrise and sunset required')
    sunset=sunset.astimezone(ZoneInfo('Asia/Kolkata'))
    sunrise=sunrise.astimezone(ZoneInfo('Asia/Kolkata'))
    duration=(sunrise-sunset).total_seconds()
    if sunset.date()!=day or sunrise.date()!=day+timedelta(days=1) or not 5*3600<duration<19*3600:
        raise ValueError('Night must extend from local sunset to next sunrise')
    first=NIGHT_START_BY_WEEKDAY[day.weekday()]
    rows=[]
    for i in range(8):
        name=NIGHT_CYCLE[(first+i)%7]
        start=sunset+timedelta(seconds=duration*i/8)
        end=sunset+timedelta(seconds=duration*(i+1)/8)
        rows.append({
            'name':name,
            'category':'अनुकूल' if name in BENEFICIAL else 'सावधानी',
            'favorable':name in BENEFICIAL,
            'start':start.strftime('%H:%M'),
            'end':end.strftime('%H:%M'),
            'startIso':start.isoformat(),
            'endIso':end.isoformat(),
            'nextDay':start.date()!=day
        })
    return rows
