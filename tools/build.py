#!/usr/bin/env python3
"""Builds the Street Art Dispatch pages from data/content.json.
Run: python3 tools/build.py   (writes the pages next to this folder)"""
import json, re, html, os, sys, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOT
D = json.load(open(os.path.join(ROOT, 'data', 'content.json'), encoding='utf-8'))
SITE = 'https://streetartdispatch.com/'
NAME = 'Street Art Dispatch'
TAG = 'The Urban Art and Culture Publication'
NAV = [('Dispatches', 'dispatches/'), ('Artists', 'artists/'), ('Interventions', 'interventions/'),
       ('Urban Culture', 'urban-culture/'), ('Exhibitions', 'exhibitions/'), ('Collecting', 'collecting/')]
esc = lambda s: html.escape(str(s), quote=True)
slug = lambda s: re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))
ALL = D['features'] + D['columns']
COLS = {c['slug'] for c in D['columns']}

def path_of(s):
    return ('urban-culture/' if s in COLS else 'dispatches/') + s + '/'

def mins(a):
    words = len(re.sub(r'<[^>]+>', ' ', a['body']).split())
    return max(1, round(words / 225))

def photo(desc, ratio=None):
    st = f' style="aspect-ratio:{ratio}"' if ratio else ''
    return (f'<div class="ph" role="img" aria-label="Photograph to come: {esc(desc)}"{st}>'
            f'<span class="ph-t">Photo to come</span><span class="ph-d">{esc(desc)}</span></div>')

def fix_links(body, r):
    body = re.sub(r'href="#read/([\w-]+)"', lambda m: f'href="{r}{path_of(m.group(1))}"', body)
    body = re.sub(r'href="#artist/([\w-]+)"', lambda m: f'href="{r}artists/{m.group(1)}/"', body)
    return body.replace('href="#interventions"', f'href="{r}interventions/"')

PAGES = []
def page(path, title, desc, main, home=False, file=None, head=''):
    depth = path.count('/')
    r = '' if file else '../' * depth
    if not file: PAGES.append(path)
    links = ''.join(f'<li><a href="{r}{h}"{" aria-current=\"page\"" if path.startswith(h) else ""}>{t}</a></li>' for t, h in NAV)
    plate = (f'<header class="nameplate"><a href="{r or "./"}">{NAME}</a><p>{TAG}</p></header>'
             '<div id="navSentinel" aria-hidden="true"></div>') if home else ''
    doc = f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta property="og:type" content="{'website' if home else 'article'}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE}{path}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#163A30">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gloock&family=Libre+Franklin:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
{head}<link rel="stylesheet" href="{r}assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap"><span>Issue 01 · {D['date']}</span><span>streetartdispatch.com</span></div></div>
{plate}
<nav class="nav{'' if home else ' nav--inner'}" id="nav" aria-label="Sections">
  <div class="wrap">
    <a class="nav-mark" href="{r or './'}">{NAME}</a>
    <ul class="nav-links">{links}</ul>
    <div class="nav-right">
      <a class="btn btn--sm" href="{r}#newsletter">Subscribe</a>
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="sheet"><i aria-hidden="true"></i>Menu</button>
    </div>
  </div>
</nav>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="sheet-top"><span>{NAME}</span><button class="close-btn" id="sheetClose">Close <b aria-hidden="true">×</b></button></div>
  <ul>{links}</ul>
  <a class="btn" href="{r}#newsletter">Subscribe</a>
</div>
<main id="main">
{main}
</main>
<footer class="on-pine foot" id="contact">
  <div class="wrap">
    <div class="foot-grid">
      <div><p class="mark">{NAME}</p><p class="tag">{TAG}.</p></div>
      <nav aria-labelledby="f-sec"><h2 id="f-sec">Sections</h2><ul>{''.join(f'<li><a href="{r}{h}">{t}</a></li>' for t, h in NAV)}</ul></nav>
      <nav aria-labelledby="f-abt"><h2 id="f-abt">About</h2><ul>
        <li><a href="{r}about/">About and standards</a></li><li><a href="{r}contact/">Contact</a></li><li><a href="{r}#newsletter">Subscribe</a></li></ul></nav>
    </div>
    <p class="legal">© 2026 {NAME} · streetartdispatch.com</p>
  </div>
</footer>
<script src="{r}assets/site.js" defer></script>
</body>
</html>
'''
    dest = os.path.join(OUT, file) if file else os.path.join(OUT, path, 'index.html')
    os.makedirs(os.path.dirname(dest) or '.', exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(doc)

# ---------- shared pieces ----------
def story(f, cls, r):
    stand = f'<p class="stand">{f["standfirst"]}</p>' if cls != 's-side' else ''
    return (f'<article class="story {cls}">{photo(D["photos"][f["slug"]])}<p class="kicker">{f["kicker"]}</p>'
            f'<h3><a href="{r}{path_of(f["slug"])}">{f["title"]}</a></h3>{stand}'
            f'<p class="byline">By {D["desk"]} · {mins(f)} min read</p></article>')

def icard(x, r):
    badge = '<span class="badge">Awaiting confirmation</span>' if x.get('pending') else ''
    more = f'<a class="tlink" href="{r}{path_of(x["read"])}">Read the story</a>' if x.get('read') else ''
    return (f'<li class="icard"><p class="kicker"><span>{esc(x["type"])}</span>{badge}</p><h4>{esc(x["title"])}</h4>'
            f'<p class="who"><a href="{r}interventions/?artist={slug(x["artist"])}">{esc(x["artist"])}</a> · {esc(x["city"])}, {esc(x["country"])}</p>'
            f'<p>{esc(x["note"])}</p>{more}</li>')

def newsletter():
    return '''<section class="sec" id="newsletter" aria-labelledby="h-news">
    <div class="wrap news">
      <div><h2 id="h-news">Get the Dispatch</h2><p class="dek">One email a week with new interventions, artist profiles and collecting news.</p></div>
      <div>
        <form class="nl" id="nl"><label class="sr" for="nlEmail">Email address</label><input id="nlEmail" type="email" required placeholder="you@example.com" autocomplete="email"><button class="btn" type="submit">Subscribe</button></form>
        <p class="nl-msg" id="nlMsg" aria-live="polite"></p>
        <p class="pitch">Pitches, tips and press: <a class="tlink" style="min-height:0" href="mailto:info@artiscope.co.uk">info@artiscope.co.uk</a></p>
      </div>
    </div>
  </section>'''

# ---------- home ----------
def home():
    r = ''
    lead, a, b, *rest = D['features']
    dgrid = story(lead, 's-lead', r) + f'<div class="side">{story(a, "s-side", r)}{story(b, "s-side", r)}</div>' + ''.join(story(f, 's-small', r) for f in rest)
    recent = sorted(D['archive'], key=lambda x: x['y'] if isinstance(x['y'], int) else -1, reverse=True)[:6]
    cols = ''.join(f'<li class="ccard"><p class="kicker">{c["kicker"]} · {mins(c)} min</p><h3><a href="{path_of(c["slug"])}">{c["title"]}</a></h3><p>{c["standfirst"]}</p><span class="more" aria-hidden="true">Read the column</span></li>' for c in D['columns'])
    exs = ''.join(f'<li class="ecard"><p class="kicker">{x["venue"]}</p><h3>{x["t"]}</h3><p>{x["sub"]}</p><dl><div><dt>Dates: </dt><dd>{x["when"]}</dd></div></dl><span class="badge">{x["status"]}</span></li>' for x in D['exhibitions'])
    main = f'''  <div class="wrap">
    <section class="hero" aria-labelledby="heroTitle">
      <div>
        <p class="kicker">From the editors</p>
        <h1 id="heroTitle">Art Doesn’t Always Wait for an Invitation.</h1>
        <p class="hero-intro">Street Art Dispatch follows artists taking their work beyond conventional gallery spaces. From public interventions and urban installations to experimental materials and collectable artworks, we document the evolving relationship between contemporary art, the city and its audience.</p>
        <div class="actions"><a class="btn" href="dispatches/">Read Issue 01</a><a class="tlink" href="interventions/">Search the archive</a></div>
      </div>
      <figure>{photo('Lead image: Konn Artiss, the Venice intervention')}<figcaption>On the cover: Konn Artiss in Venice. <a href="dispatches/konn-artiss/">Read the profile</a>.</figcaption></figure>
    </section>
  </div>
  <section class="sec" id="dispatches" aria-labelledby="h-dispatches" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><h2 id="h-dispatches">Dispatches</h2><p class="dek">Six commissioned features for our first issue.</p></div>
    <div class="dgrid">{dgrid}</div></div></section>
  <section class="sec" id="artists" aria-labelledby="h-artists" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><h2 id="h-artists">Artists</h2><p class="dek">The people taking art beyond the gallery. We start with Konn Artiss and add a new profile from the Grove Gallery roster every week.</p></div>
    <ul class="agrid">{''.join(acard(x, r) for x in D['artists'])}</ul></div></section>
  <section class="sec" id="interventions" aria-labelledby="h-arch" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><h2 id="h-arch">The Intervention Archive</h2><p class="dek">Art made in public, documented and dated. Search by artist, city or year.</p></div>
    <ul class="cards">{''.join(icard(x, r) for x in recent)}</ul>
    <p class="amore"><a class="btn" href="interventions/">Search all {len(D['archive'])} interventions</a></p></div></section>
  <section class="sec" id="culture" aria-labelledby="h-culture" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><h2 id="h-culture">Urban Culture</h2><p class="dek">Short columns on attention, virality and the crowd.</p></div>
    <ul class="cgrid">{cols}</ul></div></section>
  <section class="sec" id="exhibitions" aria-labelledby="h-ex" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><h2 id="h-ex">Exhibitions</h2><p class="dek">Where the street meets the gallery. Listings are provisional until venues confirm dates.</p></div>
    <ul class="egrid">{exs}</ul></div></section>
  <section class="sec on-pine" id="collecting" aria-labelledby="h-col"><div class="wrap">
    <div class="sec-head"><h2 id="h-col">Collecting Street Art</h2><p class="dek">Originals, editions and auction results, and what to check before you buy.</p></div>
    <ul class="facts">{''.join(f'<li class="fact"><strong>{v}</strong><span>{l}</span></li>' for v, l in D['stats'])}</ul>
    <div class="primer"><div class="intro"><h3>A collector’s primer</h3>
      <p>Art made in public is hard to own, so the objects that carry it into a collection need to be understood exactly. Four things to know before you buy.</p>
      <a class="btn" href="collecting/">Read the collecting guide</a></div>
      <div class="terms">{''.join(f'<div><h4>{t}</h4><p>{p}</p></div>' for t, p in D['glossary'])}</div></div></div></section>
  {newsletter()}'''
    page('', f'{NAME} | {TAG}', 'Street Art Dispatch follows artists taking their work beyond conventional gallery spaces: public interventions, urban installations, experimental materials and collectable artworks.', main, home=True)

# ---------- article ----------
def article(a):
    p = path_of(a['slug']); r = '../../'
    pool = D['columns'] if a['slug'] in COLS else D['features']
    nxt = pool[(pool.index(a) + 1) % len(pool)]
    sect, sect_href = ('Urban Culture', 'urban-culture/') if a['slug'] in COLS else ('Dispatches', 'dispatches/')
    fig = f'<figure class="r-fig">{photo(D["photos"][a["slug"]])}<figcaption>Photograph to be commissioned.</figcaption></figure>' if a['slug'] in D['photos'] else ''
    draft = '<p class="note"><b>Draft</b>Biographical details, dates, titles and market data in this profile are being confirmed with the artist’s studio and Grove Gallery before publication.</p>' if a.get('draft') else ''
    main = f'''<article>
    <header class="r-head"><p class="crumb"><a href="{r}{sect_href}">{sect}</a></p><p class="kicker">{a['kicker']}</p><h1>{a['title']}</h1><p class="r-stand">{a['standfirst']}</p><p class="byline">By {D['desk']} · {D['date']} · {mins(a)} min read</p></header>
    {fig}
    <div class="r-body">{draft}{fix_links(a['body'], r)}</div>
    <footer class="r-foot"><p class="filed">Filed under {', '.join(a['tags'])}.</p>
      <div class="next"><p class="kicker">Next {'column' if a['slug'] in COLS else 'dispatch'}</p><h2>{nxt['title']}</h2><a class="btn" href="{r}{path_of(nxt['slug'])}">Read next</a></div></footer>
  </article>'''
    page(p, f"{a['title']} | {NAME}", re.sub(r'<[^>]+>', '', a['standfirst']), main)


# ---------- list pages ----------
def head(title, dek):
    return f'<div class="sec-head"><h1>{title}</h1><p class="dek">{dek}</p></div>'

def dispatches():
    r = '../'
    lead, a, b, *rest = D['features']
    grid = story(lead, 's-lead', r) + f'<div class="side">{story(a, "s-side", r)}{story(b, "s-side", r)}</div>' + ''.join(story(f, 's-small', r) for f in rest)
    main = f'<section class="sec sec--top"><div class="wrap">{head("Dispatches", "Six commissioned features for our first issue.")}<div class="dgrid">{grid}</div></div></section>'
    page('dispatches/', f'Dispatches | {NAME}', 'Six commissioned features for the first issue of Street Art Dispatch.', main)

def culture():
    r = '../'
    cols = ''.join(f'<li class="ccard"><p class="kicker">{c["kicker"]} · {mins(c)} min</p><h3><a href="{r}{path_of(c["slug"])}">{c["title"]}</a></h3><p>{c["standfirst"]}</p><span class="more" aria-hidden="true">Read the column</span></li>' for c in D['columns'])
    main = f'<section class="sec sec--top"><div class="wrap">{head("Urban Culture", "Short columns on attention, virality and the crowd.")}<ul class="cgrid">{cols}</ul></div></section>'
    page('urban-culture/', f'Urban Culture | {NAME}', 'Short columns on attention, virality and the crowd.', main)

def acard(x, r):
    inner = f'{photo(D["artist_photos"][x["name"]])}<h3>{x["name"]}</h3><p>{x["role"]}</p>'
    if x.get('read'):
        return f'<li><a class="acard" href="{r}artists/{slug(x["name"])}/">{inner}<span class="more">Open profile</span></a></li>'
    return f'<li><div class="acard acard--soon">{inner}<span class="soon">Coming soon</span></div></li>'

def artists():
    r = '../'
    main = f'<section class="sec sec--top"><div class="wrap">{head("Artists", "The people taking art beyond the gallery. We start with Konn Artiss and add a new profile from the Grove Gallery roster every week.")}<ul class="agrid">{"".join(acard(x, r) for x in D["artists"])}</ul></div></section>'
    page('artists/', f'Artists | {NAME}', 'Profiles of artists taking their work beyond the gallery, starting with Konn Artiss.', main)

def year_of(x):
    return x['y'] if isinstance(x['y'], int) else -1

def artist(x):
    r = '../../'; s = slug(x['name'])
    works = sorted([w for w in D['archive'] if w['artist'] == x['name']], key=year_of, reverse=True)
    feat = next(f for f in ALL if f['slug'] == x['read'])
    facts = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in x['facts'])
    arch = ''
    if works:
        rows = ''.join(f'<li><strong>{"Date to confirm" if w["y"] == "TBC" else w["y"]}</strong>: {esc(w["title"])}, {esc(w["city"])}</li>' for w in works)
        arch = f'<h2>In the archive</h2><ul class="plain">{rows}</ul><p><a href="{r}interventions/?artist={s}">See these entries in the archive</a></p>'
    main = f"""<article>
    <header class="r-head"><p class="crumb"><a href="{r}artists/">Artists</a></p><p class="kicker">Artist</p><h1>{x['name']}</h1><p class="r-stand">{x['role']}</p></header>
    <figure class="r-fig">{photo(D['artist_photos'][x['name']])}<figcaption>Photograph to be commissioned.</figcaption></figure>
    <div class="r-body"><p>{x['summary']}</p><p>{D['artist_notes'][x['name']]}</p>
      <dl class="kfacts">{facts}</dl>{arch}</div>
    <footer class="r-foot"><div class="next"><p class="kicker">Read more</p><h2>{feat['title']}</h2><a class="btn" href="{r}{path_of(feat['slug'])}">Read the story</a></div></footer>
  </article>"""
    page(f'artists/{s}/', f"{x['name']} | {NAME}", re.sub(r'<[^>]+>', '', x['summary']), main)

def interventions():
    r = '../'
    A = D['archive']
    names = sorted({x['artist'] for x in A}); cities = sorted({x['city'] for x in A})
    dec = lambda x: str(x['y'] // 10 * 10) if isinstance(x['y'], int) else 'tbc'
    groups = {}
    for x in sorted(A, key=year_of, reverse=True):
        groups.setdefault(str(x['y']), []).append(x)
    def card(x):
        c = icard(x, r)
        text = esc(' '.join(str(x[k]) for k in ('title', 'artist', 'city', 'country', 'type', 'note', 'y')).lower())
        return c.replace('<li class="icard">', f'<li class="icard" data-artist="{slug(x["artist"])}" data-city="{esc(x["city"])}" data-dec="{dec(x)}" data-text="{text}">', 1)
    label = lambda y: 'Date to confirm' if y == 'TBC' else y
    out = ''.join(f'<section class="yr" aria-label="{label(y)}"><h2>{label(y)}</h2><ul class="cards">{"".join(card(x) for x in xs)}</ul></section>' for y, xs in groups.items())
    chips = ''.join(f'<button type="button" class="chip" data-dec="{v}" aria-pressed="{"true" if v == "" else "false"}">{l}</button>' for v, l in [('', 'All years'), ('2020', '2020s'), ('2010', '2010s'), ('2000', '2000s'), ('1990', '1990s'), ('1980', '1980s'), ('tbc', 'Date to confirm')])
    aopts = ''.join(f'<option value="{slug(n)}">{esc(n)}</option>' for n in names)
    copts = ''.join(f'<option>{esc(c)}</option>' for c in cities)
    main = f"""<section class="sec sec--top" id="archive" data-total="{len(A)}"><div class="wrap">
    {head("The Intervention Archive", "Art made in public, documented and dated. Search by artist, city or year.")}
    <form class="atools" role="search" onsubmit="return false">
      <div class="field"><label for="fQ">Search</label><input id="fQ" type="search" placeholder="Try “Venice” or “mosaic”" autocomplete="off"></div>
      <div class="field"><label for="fArtist">Artist</label><select id="fArtist"><option value="">All artists</option>{aopts}</select></div>
      <div class="field"><label for="fCity">City</label><select id="fCity"><option value="">All cities</option>{copts}</select></div>
      <div class="field decades" role="group" aria-labelledby="decLbl"><span class="lbl" id="decLbl">Year</span><div class="chips" id="decades">{chips}</div></div>
    </form>
    <div class="astatus"><p id="aCount" aria-live="polite">{len(A)} interventions, newest first</p><button class="tlink" id="aClear" type="button" hidden>Clear filters</button></div>
    <div class="results" id="results">{out}</div>
    <p class="empty" id="aEmpty" hidden>Nothing matches those filters yet.</p>
    <p class="anote">Every entry is sourced and dated. Entries marked “Awaiting confirmation” are being checked with the artist or gallery. Know of one we’ve missed? <a class="tlink" href="mailto:info@artiscope.co.uk" style="min-height:0">Send it to the archive</a></p>
  </div></section>"""
    page('interventions/', f'The Intervention Archive | {NAME}', 'A dated record of art made in public. Search by artist, city or year.', main)

def exhibitions():
    exs = ''.join(f'<li class="ecard"><p class="kicker">{x["venue"]}</p><h3>{x["t"]}</h3><p>{x["sub"]}</p><dl><div><dt>Dates: </dt><dd>{x["when"]}</dd></div></dl><span class="badge">{x["status"]}</span></li>' for x in D['exhibitions'])
    main = f'<section class="sec sec--top"><div class="wrap">{head("Exhibitions", "Where the street meets the gallery. Listings are provisional until venues confirm dates.")}<ul class="egrid">{exs}</ul></div></section>'
    page('exhibitions/', f'Exhibitions | {NAME}', 'Exhibition listings from Street Art Dispatch. Listings are provisional until venues confirm dates.', main)

def collecting():
    r = '../'
    guide = next(f for f in D['features'] if f['slug'] == 'spectacle-to-collectable')
    facts = ''.join(f'<li class="fact"><strong>{v}</strong><span>{l}</span></li>' for v, l in D['stats'])
    terms = ''.join(f'<div><h3>{t}</h3><p>{p}</p></div>' for t, p in D['glossary'])
    main = f"""<section class="sec sec--top on-pine"><div class="wrap">
    {head("Collecting Street Art", "Originals, editions and auction results, and what to check before you buy.")}
    <ul class="facts">{facts}</ul>
    <div class="primer"><div class="intro"><h2>A collector’s primer</h2>
      <p>Art made in public is hard to own, so the objects that carry it into a collection need to be understood exactly. Four things to know before you buy.</p></div>
      <div class="terms">{terms}</div></div></div></section>
  <section class="sec"><div class="wrap"><div class="sec-head"><h2>The collecting guide</h2></div>
    <div class="dgrid">{story(guide, 's-lead', r)}</div></div></section>"""
    page('collecting/', f'Collecting Street Art | {NAME}', 'Originals, editions and auction results, and what to check before you buy street art.', main)

def text_page(path, title, stand, body, desc):
    main = f'<article><header class="r-head"><h1>{title}</h1><p class="r-stand">{stand}</p></header><div class="r-body r-body--page">{body}</div></article>'
    page(path, f'{title} | {NAME}', desc, main)

def about():
    P = D['pages']['about']
    body = ''.join(f'<p>{p}</p>' for p in P['intro'])
    body += '<h2 id="standards">Editorial standards</h2><dl class="stds">' + ''.join(f'<div><dt>{t}</dt><dd>{d}</dd></div>' for t, d in P['standards']) + '</dl>'
    body += f'<h2>Get in touch</h2><p>{P["contact"]}</p>'
    text_page('about/', 'About and standards', P['stand'], body.replace('{root}', '../'), P['stand'])

def contact():
    P = D['pages']['contact']
    body = '<dl class="stds">' + ''.join(f'<div><dt>{t}</dt><dd>{d}</dd></div>' for t, d in P['routes']) + '</dl>'
    text_page('contact/', 'Contact', P['stand'], body.replace('{root}', '../'), P['stand'])

def notfound():
    base = "<script>document.write('<base href=\"'+(location.hostname.slice(-9)==='github.io'?'/street-art-dispatch/':'/')+'\">')</script>\n"
    main = '<article><header class="r-head"><p class="kicker">Page not found</p><h1>That page isn’t here.</h1><p class="r-stand">It may have moved, or the address may be mistyped.</p></header><div class="r-body r-body--page"><p><a href="./">Go to the front page</a> or <a href="interventions/">search the archive</a>.</p></div></article>'
    page('', f'Page not found | {NAME}', 'That page is not here.', main, file='404.html', head=base)

home(); dispatches(); culture(); artists(); interventions(); exhibitions(); collecting(); about(); contact()
for a in ALL:
    article(a)
for x in D['artists']:
    if x.get('read'):
        artist(x)
notfound()
urls = ''.join(f'<url><loc>{SITE}{p}</loc></url>\n' for p in PAGES)
open(os.path.join(OUT, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n')
if os.path.abspath(OUT) != ROOT:
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(OUT, 'assets'), dirs_exist_ok=True)
    open(os.path.join(OUT, 'CNAME'), 'w').write('streetartdispatch.com\n')
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
print('built', len(PAGES) + 1, 'pages into', OUT)
