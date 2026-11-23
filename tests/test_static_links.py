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

def test_editorial_articles_and_navigation():
    from bs4 import BeautifulSoup
    from urllib.parse import urlsplit
    import json
    catalog=json.loads((ROOT/'data/articles.json').read_text(encoding='utf-8'))
    hub=BeautifulSoup((DIST/'lekh/index.html').read_text(encoding='utf-8'),'html.parser')
    published=[a for a in catalog['articles'] if a['status']=='published']
    assert len(hub.select('.article-card'))==len(published)
    for a in published:
        page=DIST/'lekh'/a['slug']/'index.html'
        assert page.exists(),a['slug']
        soup=BeautifulSoup(page.read_text(encoding='utf-8'),'html.parser')
        assert soup.h1 and a['title'] in soup.h1.get_text()
        assert soup.find('link',rel='canonical')
    assert (DIST/'kundli-milan/index.html').exists()
    assert (DIST/'devi-devta/index.html').exists()
    for asset in ['deity-ganesha.svg','deity-shiva.svg','deity-vishnu.svg','deity-lakshmi.svg','deity-saraswati.svg']:
        assert (DIST/'assets'/asset).exists()
    home=BeautifulSoup((DIST/'index.html').read_text(encoding='utf-8'),'html.parser')
    assert len(home.select('.deity-section .deity-card'))==5
    assert len(home.select('.home-articles .article-card'))>0

def test_empty_topics_not_in_sitemap():
    import json
    catalog=json.loads((ROOT/'data/articles.json').read_text(encoding='utf-8'))
    sitemap=(DIST/'sitemap.xml').read_text(encoding='utf-8')
    active={a['category'] for a in catalog['articles'] if a['status']=='published'}
    for topic in catalog['topics']:
        route=f"/vishay/{topic['slug']}/"
        assert (DIST/route.lstrip('/')/'index.html').exists()
        if topic['slug'] not in active:
            assert route not in sitemap
            html=(DIST/route.lstrip('/')/'index.html').read_text(encoding='utf-8')
            assert 'noindex' in html
