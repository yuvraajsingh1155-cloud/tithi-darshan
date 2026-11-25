"""Regression checks for generated premium routes, source-backed calendars and privacy."""
import json
from pathlib import Path
from urllib.parse import urlsplit
import pytest
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
CITIES=json.loads((ROOT/'data/cities.json').read_text(encoding='utf-8'))

def page(route):
    path=DIST/route.strip('/')/'index.html'
    assert path.is_file(),f'Website route missing: {route}'
    return BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser')

def test_settings_and_pwa_assets():
    settings=page('/settings/')
    assert settings.select_one('#website-settings')
    assert len(settings.select('select[name],input[name]'))>=7
    assert page('/offline/').find('main')
    assert (DIST/'sw.js').is_file()
    assert (DIST/'manifest.webmanifest').is_file()
    manifest=json.loads((DIST/'manifest.webmanifest').read_text(encoding='utf-8'))
    assert manifest['start_url']=='/'
    assert manifest['scope']=='/'
    sw=(DIST/'sw.js').read_text(encoding='utf-8')
    for path in ['/mera-account/','/settings/','/kundli-milan/']:
        assert path in sw
    assert 'url.origin!==self.location.origin' in sw

def test_monthly_calendar_keeps_existing_daily_routes_valid():
    month_page=page('/calendar/')
    assert month_page.select_one('.month-calendar')
    for city in CITIES:
        choices=list((DIST/'calendar'/city['slug']).glob('*/index.html'))
        assert len(choices)>=2,f'Missing two month views for {city["slug"]}'
        for html in choices[:2]:
            soup=BeautifulSoup(html.read_text(encoding='utf-8'),'html.parser')
            assert soup.select_one('.month-calendar')
            for link in soup.select('.calendar-day[href]'):
                href=link.get('href','')
                assert href.startswith('/panchang/'+city['slug']+'/')
                assert (DIST/href.lstrip('/')/'index.html').exists(),href

def test_private_routes_not_in_sitemap():
    sitemap=(DIST/'sitemap.xml').read_text(encoding='utf-8')
    for part in ['/mera-account/','/settings/','/offline/','/calendar/</loc>']:
        assert part not in sitemap,part

def test_home_shortcuts_are_real():
    home=page('/')
    assert len(home.select('.premium-zodiac-grid a'))==12
    assert len(home.select('.home-shortcuts-grid a'))>=6
    for link in home.select('.home-shortcuts-grid a'):
        href=link.get('href','')
        if href.startswith('/'):
            route=urlsplit(href).path
            assert (DIST/route.lstrip('/')/'index.html').is_file(),href
