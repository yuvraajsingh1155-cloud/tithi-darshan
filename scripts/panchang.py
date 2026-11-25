"""Sunrise-based Drik Panchang calculations for Indian cities.

Uses Swiss Ephemeris (pyswisseph), Lahiri/Chitrapaksha ayanamsa, and Moshier
planetary computations. Source code is distributed under AGPL-3.0 due to
its dependency license. Calculations are traditional convention-dependent;
this is not an authoritative event election or festival ruling.
"""
from __future__ import annotations
from datetime import date, datetime, time, timezone, timedelta
from zoneinfo import ZoneInfo
import math
import swisseph as swe

IST = ZoneInfo('Asia/Kolkata')
UTC = timezone.utc
J2000 = datetime(2000, 1, 1, 12, tzinfo=UTC)
swe.set_sid_mode(swe.SIDM_LAHIRI)
FLAGS = swe.FLG_MOSEPH | swe.FLG_SIDEREAL
TITHI_NAMES = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा']
NAKSHATRAS = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती']
YOGAS = ['विष्कुम्भ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगण्ड','सुकर्मा','धृति','शूल','गण्ड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतीपात','वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','ऐन्द्र','वैधृति']
VARAS = ['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार','रविवार']
RASHIS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन']
KARANA_CYCLE = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि (भद्रा)']
TITHI_CONTEXT = {
    'प्रतिपदा':'चंद्र पक्ष की पहली तिथि। यह शुक्ल या कृष्ण पक्ष के नए क्रम की शुरुआत बताती है।',
    'द्वितीया':'चंद्र पक्ष की दूसरी तिथि; इसकी धार्मिक परंपराएँ क्षेत्र और पर्व के अनुसार भिन्न हो सकती हैं।',
    'तृतीया':'चंद्र पक्ष की तीसरी तिथि; कुछ प्रसिद्ध व्रत/त्योहार विशिष्ट महीनों की तृतीया से जुड़े हैं।',
    'चतुर्थी':'चंद्र पक्ष की चौथी तिथि; कुछ परंपराओं में भगवान गणेश की पूजा से इसका संबंध माना जाता है।',
    'पंचमी':'चंद्र पक्ष की पाँचवीं तिथि; कुछ व्रत और पर्व खास महीनों की पंचमी पर मनाए जाते हैं।',
    'षष्ठी':'चंद्र पक्ष की छठी तिथि; छठ जैसे पर्व के लिए माह, पक्ष और क्षेत्रीय नियम देखना जरूरी है।',
    'सप्तमी':'चंद्र पक्ष की सातवीं तिथि; कुछ मासों की सप्तमी सूर्य उपासना की परंपरा से जुड़ी है।',
    'अष्टमी':'चंद्र पक्ष की आठवीं तिथि; कई व्रत-पर्व विशेष अष्टमी पर आते हैं, हर अष्टमी एक जैसी नहीं।',
    'नवमी':'चंद्र पक्ष की नौवीं तिथि; कुछ परंपराओं में शक्ति और राम उपासना के पर्व विशेष नवमी को आते हैं।',
    'दशमी':'चंद्र पक्ष की दसवीं तिथि; विजयादशमी जैसे पर्व विशिष्ट मास व पक्ष की दशमी पर होते हैं।',
    'एकादशी':'चंद्र पक्ष की ग्यारहवीं तिथि; अनेक वैष्णव परंपराओं में एकादशी व्रत का महत्व है, पर व्रत-निर्णय अलग हो सकता है।',
    'द्वादशी':'चंद्र पक्ष की बारहवीं तिथि; कुछ व्रतों का पारण या विशेष पूजा इस दिन संबंधित नियमों से होती है।',
    'त्रयोदशी':'चंद्र पक्ष की तेरहवीं तिथि; प्रदोष-व्रत का निर्णय स्थानीय प्रदोषकाल सहित अन्य नियमों से होता है।',
    'चतुर्दशी':'चंद्र पक्ष की चौदहवीं तिथि; कुछ विशेष मासों की चतुर्दशी शिव या विष्णु उपासना से जुड़ी है।',
    'पूर्णिमा':'शुक्ल पक्ष की अंतिम तिथि। विभिन्न महीनों की पूर्णिमा से स्नान, दान, दीपदान और उत्सव परंपराएँ जुड़ी हैं।',
    'अमावस्या':'कृष्ण पक्ष की अंतिम तिथि। कुछ परंपराओं में पितृ-स्मरण तथा अन्य विशेष अनुष्ठान प्रचलित हैं।'
}

WEEKDAY_PRACTICE = {
 'सोमवार': {'title':'शिव उपासना', 'text':'सोमवार को अनेक परिवार भगवान शिव की पूजा, जल अर्पण और शांत मन से जप करने की परंपरा मानते हैं।'},
 'मंगलवार': {'title':'हनुमान उपासना', 'text':'मंगलवार को हनुमान चालीसा पाठ, सेवा और संयम को महत्व दिया जाता है।'},
 'बुधवार': {'title':'गणेश वंदना', 'text':'बुधवार को श्रीगणेश की आराधना और नए कार्य से पहले मंगलकामना की परंपरा है।'},
 'गुरुवार': {'title':'गुरु एवं विष्णु पूजा', 'text':'गुरुवार को गुरु वंदना, विष्णु स्मरण और अध्ययन/दान की परंपरा मिलती है।'},
 'शुक्रवार': {'title':'देवी उपासना', 'text':'शुक्रवार को लक्ष्मी एवं देवी की पूजा और घर की स्वच्छता पर ध्यान देने की परंपरा है।'},
 'शनिवार': {'title':'सेवा और शनि आराधना', 'text':'शनिवार को सेवा, दान और शनि या हनुमान आराधना की परंपरा अनेक क्षेत्रों में प्रचलित है।'},
 'रविवार': {'title':'सूर्य उपासना', 'text':'रविवार को सूर्य को जल अर्पित करना और कृतज्ञता व्यक्त करना एक लोकप्रिय परंपरा है।'},
}

def jd_from_dt(dt: datetime) -> float:
    dt = dt.astimezone(UTC)
    return 2451545.0 + (dt - J2000).total_seconds() / 86400.0

def dt_from_jd(jd: float) -> datetime:
    return J2000 + timedelta(days=(jd - 2451545.0))

def sidereal_longitudes(jd: float) -> tuple[float,float]:
    sun = swe.calc_ut(jd, swe.SUN, FLAGS)[0][0]
    moon = swe.calc_ut(jd, swe.MOON, FLAGS)[0][0]
    return sun, moon

def angular_values(jd: float) -> tuple[float,float,float,float]:
    sun, moon = sidereal_longitudes(jd)
    return ((moon - sun)%360, moon % 360, (moon+sun)%360, sun%360)

def next_boundary(start_jd: float, field: int, divisions: int) -> tuple[datetime,int]:
    """Time and index (0 based) at sunrise of current angular sector."""
    width = 360.0/divisions
    value0 = angular_values(start_jd)[field]
    index = min(int(value0/width), divisions-1)
    needed = (index+1)*width-value0
    # Range is < 2 days for all standard panchang sectors.
    lo, hi = start_jd, start_jd+0.08
    for _ in range(25):
        advanced=(angular_values(hi)[field]-value0)%360
        if advanced>=needed:break
        hi+=0.08
    else: raise ValueError('Could not find transition')
    for _ in range(34):
        mid=(lo+hi)/2
        advanced=(angular_values(mid)[field]-value0)%360
        if advanced>=needed:hi=mid
        else:lo=mid
    return dt_from_jd(hi).astimezone(IST), index

def event_jd(dt:date, city:dict, rise:bool) -> float:
    # Start before local sunrise on the requested civil day.
    start=datetime.combine(dt,time(0,0),tzinfo=IST).astimezone(UTC)
    code, result=swe.rise_trans(jd_from_dt(start),swe.SUN,swe.CALC_RISE if rise else swe.CALC_SET,
        (city['lon'],city['lat'],city.get('alt',0)),0,15,swe.FLG_MOSEPH)
    if code != 0:raise ValueError('Solar event unavailable for this location/date')
    return result[0]

def moon_event(d:date, city:dict, rise:bool) -> datetime|None:
    """Swiss Ephemeris Moon rise/set after local midnight, only if on same local date.

    Uses the same observer geolocation, pressure and temperature settings as
    the existing solar event calculator. Moonrise/moonset may be absent on a
    particular civil date; return None rather than a next-day misleading time.
    """
    start=datetime.combine(d,time(0,0),tzinfo=IST).astimezone(UTC)
    code,result=swe.rise_trans(jd_from_dt(start),swe.MOON,
        swe.CALC_RISE if rise else swe.CALC_SET,
        (city['lon'],city['lat'],city.get('alt',0)),0,15,swe.FLG_MOSEPH)
    if code!=0:return None
    loc=dt_from_jd(result[0]).astimezone(IST)
    return loc if loc.date()==d else None

def karana_for_sector(i:int)->str:
    if i==0:return 'किंस्तुघ्न'
    if i==57:return 'शकुनि'
    if i==58:return 'चतुष्पाद'
    if i==59:return 'नाग'
    return KARANA_CYCLE[(i-1)%7]

def clock(dt:datetime, date_ref:date|None=None)->str:
    loc=dt.astimezone(IST)
    hours=loc.strftime('%I:%M')
    meridian='सुबह' if loc.hour<12 else ('दोपहर' if loc.hour<16 else ('शाम' if loc.hour<20 else 'रात'))
    if date_ref and loc.date()!=date_ref:
        return f"{loc.day} {HINDI_MONTHS[loc.month-1]} {hours} ({meridian})"
    return f"{hours} ({meridian})"

HINDI_MONTHS=['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']

def date_hindi(d:date)->str:
    return f'{d.day} {HINDI_MONTHS[d.month-1]} {d.year}'

def window(start:datetime, end:datetime, ref:date) -> dict:
    return {'start':clock(start,ref),'end':clock(end,ref), 'startIso':start.isoformat(), 'endIso':end.isoformat()}

def panchang_for(d:date, city:dict)->dict:
    rise_jd=event_jd(d,city,True)
    set_jd=event_jd(d,city,False)
    rise=dt_from_jd(rise_jd).astimezone(IST)
    sunset=dt_from_jd(set_jd).astimezone(IST)
    if sunset<rise:raise AssertionError('Sunset before sunrise')
    moonrise=moon_event(d,city,True)
    moonset=moon_event(d,city,False)
    ti_end, ti=next_boundary(rise_jd,0,30)
    na_end, na=next_boundary(rise_jd,1,27)
    yo_end, yo=next_boundary(rise_jd,2,27)
    ka_end, ka=next_boundary(rise_jd,0,60)
    sun,moon=sidereal_longitudes(rise_jd)
    paksha='शुक्ल पक्ष' if ti<15 else 'कृष्ण पक्ष'
    tithi_name= TITHI_NAMES[ti] if ti<15 else ('अमावस्या' if ti==29 else TITHI_NAMES[ti-15])
    # Python weekday Monday=0; segment order indexed Sunday first
    sunday_index=(d.weekday()+1)%7
    rahu_segments=[8,2,7,5,6,4,3]
    yama_segments=[5,4,3,2,1,7,6]
    gulika_segments=[7,6,5,4,3,2,1]
    daylight=(sunset-rise).total_seconds()
    def eighth(segment):
        st=rise+timedelta(seconds=daylight*(segment-1)/8)
        en=rise+timedelta(seconds=daylight*segment/8)
        return window(st,en,d)
    # Abhijit: middle one of 15 equal daytime muhurta windows.
    noon=rise+timedelta(seconds=daylight/2)
    abhijit=window(noon-timedelta(seconds=daylight/30),noon+timedelta(seconds=daylight/30),d)
    brahma=window(rise-timedelta(minutes=96),rise-timedelta(minutes=48),d)
    vara=VARAS[d.weekday()]
    return {
        'date':d.isoformat(), 'dateHindi':date_hindi(d), 'weekday':vara,
        'city':city['name'], 'citySlug':city['slug'], 'cityEnglish':city['english'],
        'lat':city['lat'],'lon':city['lon'],
        'tithi':tithi_name,'tithiNumber':ti+1,'paksha':paksha,'tithiContext':TITHI_CONTEXT[tithi_name],'tithiEnd':clock(ti_end,d),'tithiEndIso':ti_end.isoformat(),
        'nakshatra':NAKSHATRAS[na],'nakshatraEnd':clock(na_end,d),
        'yoga':YOGAS[yo],'yogaEnd':clock(yo_end,d),
        'karana':karana_for_sector(ka),'karanaEnd':clock(ka_end,d),
        'sunrise':clock(rise,d),'sunset':clock(sunset,d),
        'sunriseIso':rise.isoformat(),'sunsetIso':sunset.isoformat(),
        'moonrise':clock(moonrise,d) if moonrise else 'इस दिन नहीं',
        'moonset':clock(moonset,d) if moonset else 'इस दिन नहीं',
        'moonriseIso':moonrise.isoformat() if moonrise else None,
        'moonsetIso':moonset.isoformat() if moonset else None,
        'moonRashi':RASHIS[int(moon//30)], 'sunRashi':RASHIS[int(sun//30)],
        'rahu':eighth(rahu_segments[sunday_index]),
        'yamaganda':eighth(yama_segments[sunday_index]),
        'gulika':eighth(gulika_segments[sunday_index]),
        'abhijit':abhijit,'brahma':brahma,
        'weekdayPractice':WEEKDAY_PRACTICE[vara],
        'calculation':'Swiss Ephemeris / Moshier; Lahiri ayanamsa; sunrise-based (IST)',
    }
