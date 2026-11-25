"""Traditional daytime Choghadiya by 8 equal sunrise-to-sunset segments.

The weekday order is independently listed by Drik Panchang:
https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html

Uses the website's already-calculated Swiss Ephemeris city sunrise/sunset.
No nighttime, Muhurta election, Vaar Vela, Kaal Vela or Kaal Ratri claims.
"""
from __future__ import annotations
from datetime import date, datetime
from zoneinfo import ZoneInfo
import re

CYCLE=('उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग')
# Python date.weekday(): Monday=0 ... Sunday=6
START_BY_WEEKDAY=(3,6,2,5,1,4,0)
BENEFICIAL=frozenset(('अमृत','शुभ','लाभ','चर'))

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
        start=rise+round(index*duration/8)
        end=rise+round((index+1)*duration/8)
        rows.append({'name':name,'category':'अनुकूल' if name in BENEFICIAL else 'सावधानी',
            'favorable':name in BENEFICIAL,'start':_clock(start),'end':_clock(end)})
    return rows
