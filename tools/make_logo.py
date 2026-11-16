#!/usr/bin/env python3
"""Draws the Street Art Dispatch logo files into assets/brand/.
The stamp is the dispatch, the brick wall is the street, the painted
mark is the art. Run: python3 tools/make_logo.py [path to Gloock-Regular.ttf]
The typeface is only needed for the versions that include the name."""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'brand')
PINE, LINEN, RUBY = '#163A30', '#EFE6D3', '#F0283C'

def perfs(n_x=11, n_y=10, r=4.6):
    c = ''
    for i in range(n_x):
        x = 30 + i * 140 / (n_x - 1)
        c += f'<circle cx="{x:.1f}" cy="22" r="{r}"/><circle cx="{x:.1f}" cy="178" r="{r}"/>'
    for j in range(1, n_y):
        y = 22 + j * 156 / n_y
        c += f'<circle cx="30" cy="{y:.1f}" r="{r}"/><circle cx="170" cy="{y:.1f}" r="{r}"/>'
    return c

def bricks():
    b = ''
    for row in range(4):
        y = 41.5 + row * 31
        for x in ((49.5, 103.5) if row % 2 == 0 else (22.5, 76.5, 130.5)):
            b += f'<rect x="{x}" y="{y}" width="47" height="24"/>'
    return b

def stamp(body, picture, brick, dot, uid='a', ring=None, small=False):
    """body: the stamp paper. picture: the wall behind the bricks (None = see-through)."""
    pf = perfs(7, 7, 6.4) if small else perfs()
    hole = '' if picture else '<rect x="46" y="38" width="108" height="124" fill="#000"/>'
    out = f'<mask id="m{uid}"><rect width="200" height="200" fill="#fff"/><g fill="#000">{pf}</g>{hole}</mask>'
    out += f'<rect x="30" y="22" width="140" height="156" fill="{body}" mask="url(#m{uid})"/>'
    if picture:
        out += f'<rect x="46" y="38" width="108" height="124" fill="{picture}"/>'
    if not small:
        out += f'<clipPath id="c{uid}"><rect x="49.5" y="41.5" width="101" height="117"/></clipPath>'
        cut = f'<mask id="r{uid}"><rect width="200" height="200" fill="#fff"/><circle cx="100" cy="100" r="{ring}" fill="#000"/></mask>' if ring else ''
        out += cut + f'<g clip-path="url(#c{uid})"><g fill="{brick}"{f" mask=\"url(#r{uid})\"" if ring else ""}>{bricks()}</g></g>'
    out += f'<circle cx="100" cy="100" r="{30 if small else 26}" fill="{dot}"/>'
    return out

def doc(inner, w=200, h=200, title='Street Art Dispatch'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{inner}</svg>\n'

FILES = {
    'sad-tile.svg': doc(f'<rect width="200" height="200" fill="{PINE}"/>' + stamp(LINEN, PINE, LINEN, RUBY)),
    'sad-mark-on-dark.svg': doc(stamp(LINEN, None, LINEN, RUBY)),
    'sad-mark-on-light.svg': doc(stamp(PINE, LINEN, PINE, RUBY)),
    'sad-mark-one-colour.svg': doc(stamp(PINE, None, PINE, PINE, ring=32)),
    'favicon.svg': doc(f'<rect width="200" height="200" fill="{PINE}"/>' + stamp(LINEN, PINE, LINEN, RUBY, small=True)),
}

def wordmark(ttf, colour, x0=0, baseline=0, size=100):
    """The name as outlines, so the file needs no typeface installed."""
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = TTFont(ttf); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm; x = x0; d = ''
    track = -0.012 * size
    for ch in 'Street Art Dispatch':
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs); g.draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        d += pen.getCommands(); x += g.width * s + track
    r = size * 0.085
    return f'<path d="{d}" fill="{colour}"/><circle cx="{x + r + size*0.03:.1f}" cy="{baseline - r:.1f}" r="{r:.1f}" fill="{RUBY}"/>', x + 2 * r + size * 0.03

if len(sys.argv) > 1:
    ttf = sys.argv[1]
    for name, colour, mark in (('sad-logo-on-light.svg', PINE, f'<rect width="200" height="200" fill="{PINE}"/>' + stamp(LINEN, PINE, LINEN, RUBY)),
                               ('sad-logo-on-dark.svg', LINEN, stamp(LINEN, None, LINEN, RUBY))):
        wm, end = wordmark(ttf, colour, x0=250, baseline=134, size=104)
        FILES[name] = doc(mark + wm, w=round(end + 6), h=200)
    for name, colour in (('sad-wordmark-on-light.svg', PINE), ('sad-wordmark-on-dark.svg', LINEN)):
        wm, end = wordmark(ttf, colour, x0=4, baseline=84, size=104)
        FILES[name] = doc(wm, w=round(end + 6), h=112)

os.makedirs(OUT, exist_ok=True)
for name, text in FILES.items():
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(text)
print('wrote', len(FILES), 'files to', OUT)
