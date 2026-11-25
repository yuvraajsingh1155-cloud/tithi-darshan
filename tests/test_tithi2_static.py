"""Tithi 2.0: public search, fresh-date headers and privacy regression checks."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

def page(route):
    filename=DIST/route.lstrip('/')/'index.html'
    assert filename.is_file(),route
    return BeautifulSoup(filename.read_text(encoding='utf-8'),'html.parser')

def test_global_search_only_contains_real_public_routes():
    data=json.loads((DIST/'search-index.json').read_text(encoding='utf-8'))
    items=data['items']
    assert len(items)>=35
    assert page('/khoj/').select_one('#global-search-input')
    for item in items:
        u=urlsplit(item['url'])
        assert item['url'].startswith('/') and not item['url'].startswith('//')
        assert u.path not in ('/mera-account/','/settings/','/admin/')
        assert '/auth/' not in u.path
        assert (DIST/u.path.lstrip('/')/'index.html').is_file(),item['url']
        assert len(item['description'])<=280
    assert len({(x['title'],x['url']) for x in items})==len(items)
    sitemap=(DIST/'sitemap.xml').read_text(encoding='utf-8')
    assert '/khoj/' not in sitemap

def test_home_and_dated_pages_have_accurate_tithi_segments():
    for route in ('/','/panchang/delhi/2026-11-26/','/shehar/lucknow/'):
        soup=page(route)
        script=soup.select_one('#tithi-civil-segments')
        assert script is not None,route
        intervals=json.loads(script.text)
        assert intervals and all(x['endIso']>x['startIso'] for x in intervals)
        assert soup.select_one('#freshness-banner')
        assert soup.select_one('#current-tithi-card')
        assert soup.select_one('[data-page]') is not None or soup.body.get('data-date')
    homepage=page('/')
    assert homepage.body.get('data-date')
    assert homepage.select_one('time[datetime]')

def test_cache_rules_protect_today_and_live_metadata():
    content=(DIST/'_headers').read_text(encoding='utf-8')
    assert '/build-info.json\n  Cache-Control: no-store' in content
    assert '/\n  Cache-Control: no-store' in content
    assert '/panchang/*\n  Cache-Control: no-store' in content
    assert '/shehar/*\n  Cache-Control: no-store' in content
    assert '/sw.js\n  Cache-Control: no-cache' in content
    index=json.loads((DIST/'build-info.json').read_text(encoding='utf-8'))
    assert len(index['generated_at_utc'])>=19
    assert index['indian_date']==homepage.body['data-date']
