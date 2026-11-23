import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent.parent/'scripts'))
import json
from datetime import date
from panchang import panchang_for,clock,karana_for_sector

CITIES=json.loads((Path(__file__).parent.parent/'data/cities.json').read_text(encoding='utf-8'))

def test_nov_23_2026_matches_independent_delhi_panchang():
    d=panchang_for(date(2026,11,23),CITIES[0])
    assert d['tithi']=='चतुर्दशी'
    assert d['paksha']=='शुक्ल पक्ष'
    assert d['tithiEnd'].startswith('11:42')  # Drik Panchang independently lists 23:42
    assert d['nakshatra']=='भरणी'
    assert d['nakshatraEnd'].startswith('24 नवंबर 02:02')
    assert d['rahu']['start'].startswith('08:09')
    assert d['rahu']['end'].startswith('09:28')

def test_localized_muhurats_are_different():
    delhi=panchang_for(date(2026,11,23),CITIES[0])
    mumbai=panchang_for(date(2026,11,23),CITIES[3])
    assert delhi['sunriseIso']!=mumbai['sunriseIso']
    assert delhi['rahu']['startIso']!=mumbai['rahu']['startIso']

def test_all_fields_for_2027():
    for city in CITIES:
        p=panchang_for(date(2027,6,1),city)
        assert p['tithi'] and p['nakshatra'] and p['yoga'] and p['karana']
        assert p['sunriseIso'] < p['sunsetIso']

def test_karana_mapping():
    assert karana_for_sector(0)=='किंस्तुघ्न'
    assert karana_for_sector(1)=='बव'
    assert karana_for_sector(57)=='शकुनि'
    assert karana_for_sector(58)=='चतुष्पाद'
    assert karana_for_sector(59)=='नाग'
