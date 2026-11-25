"""Deterministic app-icon rasterization of Tithi Darshan's original favicon.svg.

Uses only Python's standard library. No paid CDN, image API, new license,
runtime network access or binary assets in Git source.
"""
from __future__ import annotations
import math
import struct
import zlib
from pathlib import Path

MAROON=(129,47,36)
GOLD=(239,186,106)

def in_round_rect(x,y):
    cx=min(max(x,16),48)
    cy=min(max(y,16),48)
    return (x-cx)**2+(y-cy)**2 <= 16**2

def near_segment(x,y,ax,ay,bx,by,width=1.5):
    dx=bx-ax;dy=by-ay
    length=dx*dx+dy*dy
    t=max(0.0,min(1.0,((x-ax)*dx+(y-ay)*dy)/length))
    return (x-(ax+t*dx))**2+(y-(ay+t*dy))**2<=width*width

RAYS=((32,5,32,12),(32,52,32,59),(5,32,12,32),(52,32,59,32),
      (13,13,18,18),(46,46,51,51),(51,13,46,18),(18,46,13,51))

def color_at(x,y):
    if not in_round_rect(x,y):return (0,0,0,0)
    distance=(x-32)**2+(y-32)**2
    if distance<=6**2:return (*MAROON,255)
    if distance<=16**2:return (*GOLD,255)
    if any(near_segment(x,y,*ray) for ray in RAYS):
        return (*GOLD,255)
    return (*MAROON,255)

def png_chunk(kind,data):
    return (struct.pack('!I',len(data))+kind+data+
            struct.pack('!I',zlib.crc32(kind+data)&0xffffffff))

def make_png(side):
    rows=bytearray()
    # Two subpixel samples per axis keep circles and rounded corners crisp.
    for y in range(side):
        rows.append(0)
        for x in range(side):
            samples=[color_at((x+sx)/side*64,(y+sy)/side*64)
                     for sy in (0.25,0.75) for sx in (0.25,0.75)]
            alpha=sum(p[3] for p in samples)//4
            if alpha:
                rgb=tuple(sum(p[c]*p[3] for p in samples)//
                          max(1,sum(p[3] for p in samples)) for c in range(3))
                rows.extend((*rgb,alpha))
            else:
                rows.extend((0,0,0,0))
    return (b'\x89PNG\r\n\x1a\n'
        +png_chunk(b'IHDR',struct.pack('!IIBBBBB',side,side,8,6,0,0,0))
        +png_chunk(b'IDAT',zlib.compress(bytes(rows),9))
        +png_chunk(b'IEND',b''))

def write_app_icons(out:Path):
    directory=out/'icons'
    directory.mkdir(parents=True,exist_ok=True)
    for size in (192,512):
        (directory/f'tithi-{size}.png').write_bytes(make_png(size))

if __name__=='__main__':
    write_app_icons(Path(__file__).resolve().parents[1]/'dist')
