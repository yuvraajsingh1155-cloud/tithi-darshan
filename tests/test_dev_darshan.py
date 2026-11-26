"""Dev Darshan: no generic links or unlicensed image swaps."""
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
DETAILS=json.loads((ROOT/'data/deity_details.json').read_text(encoding='utf-8'))

def test_dedicated_deity_pages_and_original_artwork():
    assert set(DETAILS)=={'ganesh','shiva','vishnu','lakshmi','saraswati'}
    catalog=BeautifulSoup((DIST/'devi-devta'/'index.html').read_text(encoding='utf-8'),'html.parser')
    home=BeautifulSoup((DIST/'index.html').read_text(encoding='utf-8'),'html.parser')
    for slug in DETAILS:
        route=f'/dev-darshan/{slug}/'
        f=DIST/route.lstrip('/')/'index.html'
        assert f.is_file(),route
        soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
        image=soup.select_one('.deity-detail-art img')
        assert image and image['src'].startswith('/assets/devotional/')
        assert (DIST/image['src'].lstrip('/')).is_file()
        assert soup.select_one('.deity-symbol-grid')
        assert len(soup.select('.deity-symbol-grid article'))==3
        assert any(a.get('href')==route for a in catalog.select('a[href]'))
        assert any(a.get('href')==route for a in home.select('a[href]'))
        assert len(soup.get_text(' ',strip=True))>500

def test_search_index_points_to_dedicated_profiles():
    idx=json.loads((DIST/'search-index.json').read_text(encoding='utf-8'))['items']
    for slug in DETAILS:
        assert any(item['url']==f'/dev-darshan/{slug}/' for item in idx)
