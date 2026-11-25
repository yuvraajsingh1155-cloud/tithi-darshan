"""Installability and offline privacy checks for the generated PWA."""
import json
import struct
from pathlib import Path

DIST=Path(__file__).resolve().parents[1]/'dist'

def test_manifest_has_generated_192_and_512_png_app_icons():
    manifest=json.loads((DIST/'manifest.webmanifest').read_text(encoding='utf-8'))
    icons=manifest['icons']
    for side in (192,512):
        item=next(x for x in icons if x['sizes']==f'{side}x{side}')
        assert item['type']=='image/png'
        path=DIST/item['src'].lstrip('/')
        assert path.exists(),path
        content=path.read_bytes()
        assert content[:8]==b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('!II',content[16:24])==(side,side)
        assert len(content)>300
    assert manifest['scope']=='/' and manifest['display']=='standalone'

def test_sw_excludes_private_and_time_sensitive_pages():
    sw=(DIST/'sw.js').read_text(encoding='utf-8')
    assert 'tithi-public-v3' in sw
    for route in ('/mera-account/','/settings/','/kundli-milan/'):
        assert route in sw
    for route in ('/calendar/','/panchang/','/shehar/','/rashifal/'):
        assert route in sw
    assert 'isSensitive(url.pathname)' in sw
    assert "url.origin!==self.location.origin" in sw
