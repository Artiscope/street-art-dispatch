#!/usr/bin/env python3
"""Saves the licensed photos listed in data/photo-sources.json into
assets/images. Skips any that are already there. Run by the
"Fetch licensed photos" workflow; safe to run again at any time."""
import json, os, re, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, 'assets', 'images')
ALLOWED = ('https://upload.wikimedia.org/', 'https://thumb.wikimedia.org/')
os.makedirs(DEST, exist_ok=True)
failed = 0
for p in json.load(open(os.path.join(ROOT, 'data', 'photo-sources.json'), encoding='utf-8'))['photos']:
    name, url = p['file'], p['url']
    if not re.fullmatch(r'[A-Za-z0-9._-]{1,120}\.(png|jpe?g)', name) or not url.startswith(ALLOWED):
        print('refused', name); failed += 1; continue
    out = os.path.join(DEST, name)
    if os.path.exists(out):
        print('already there', name); continue
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'StreetArtDispatchSite/1.0 (https://streetartdispatch.com; info@artiscope.co.uk)'})
        data = urllib.request.urlopen(req, timeout=60).read()
        ok = data[:3] == b'\xff\xd8\xff' or data[:8] == b'\x89PNG\r\n\x1a\n'
        if not ok or not (20_000 < len(data) < 8_000_000):
            raise ValueError('not a picture of a sensible size (%d bytes)' % len(data))
        open(out, 'wb').write(data); print('saved', name, len(data))
    except Exception as e:
        print('FAILED', name, e); failed += 1
sys.exit(1 if failed else 0)
