from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/'dist'

def test_main_page_and_navigation_exist():
    assert (DIST/'index.html').exists()
    html=BeautifulSoup((DIST/'index.html').read_text(encoding='utf-8'),'html.parser')
    assert html.h1 is not None
    assert len(html.select('#citySelect option'))==12
    for a in html.select('a[href]'):
        parsed=urlsplit(a['href'])
        if parsed.scheme or parsed.netloc:continue
        path=parsed.path
        if not path.startswith('/') or path=='/':continue
        if '.' in path.rsplit('/',1)[-1]:
            assert (DIST/path.lstrip('/')).exists(), path
        else:
            assert (DIST/path.lstrip('/')/'index.html').exists(), path

def test_all_main_assets_present():
    for filename in ['style.css','site.js','favicon.svg']:
        assert (DIST/'assets'/filename).exists()
