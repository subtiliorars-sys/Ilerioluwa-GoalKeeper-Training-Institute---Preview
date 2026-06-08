#!/usr/bin/env bash
# Pre-publish validation — run before every push to main (main = the LIVE site).
# Checks: HTML parse, JSON-LD, sitemap, internal links, nav consistency,
# wa.me number, JS syntax, and SW precache <-> HTML version agreement.
set -e
cd "$(dirname "$0")"

node --check sw.js
node --check assets/js/main.js
node --check assets/js/config.js
node --check assets/js/keeper-game.js

python3 - <<'EOF'
import glob, re, os, sys, json, html.parser
import xml.etree.ElementTree as ET

errs = []
pages = sorted(glob.glob('*.html'))

for p in pages:
    raw = open(p).read()
    html.parser.HTMLParser().feed(raw)                       # parses
    src = re.sub(r'<!--.*?-->', '', raw, flags=re.S)         # ignore comments
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', src, re.S):
        json.loads(m.group(1))                               # JSON-LD valid
    for m in re.finditer(r'(?:href|src)="([^"#]+?)(?:\?[^"]*)?(?:#[^"]*)?"', src):
        u = m.group(1)
        if u.startswith(('http', 'mailto:', 'tel:', 'data:')) or u == 'paystackUrl':
            continue
        if not os.path.exists(u):
            errs.append(f'{p}: missing target {u}')
    for m in re.finditer(r'wa\.me/(\d+)', src):
        if m.group(1) != '2347036190935':
            errs.append(f'{p}: wrong wa.me number {m.group(1)}')

# nav consistency (pages that have the main nav)
navs = set()
for p in pages:
    src = open(p).read()
    m = re.search(r'<nav class="main">.*?</nav>', src, re.S)
    if m:
        navs.add(tuple(re.findall(r'href="([^"]+)"', m.group(0))))
if len(navs) > 1:
    errs.append(f'nav differs across pages: {len(navs)} variants')

ET.parse('sitemap.xml')

# SW precache must exist and match the versions pages actually reference
sw = open('sw.js').read()
pre = re.findall(r"'\./([^']+)'", sw)
for u in pre:
    if not os.path.exists(u.split('?')[0]):
        errs.append(f'sw.js precaches missing file: {u}')
for asset in ('style.css', 'main.js', 'keeper-game.js'):
    versions = set(re.findall(asset.replace('.', r'\.') + r'\?v=(\d+)',
                              ' '.join(open(p).read() for p in pages)))
    swv = set(re.findall(asset.replace('.', r'\.') + r'\?v=(\d+)', sw))
    if len(versions) > 1:
        errs.append(f'{asset}: pages reference mixed versions {versions}')
    if versions and swv and versions != swv:
        errs.append(f'{asset}: pages use v{versions} but sw.js precaches v{swv}')

if errs:
    print('\n'.join('FAIL ' + e for e in errs)); sys.exit(1)
print(f'PASS: {len(pages)} pages — html/json-ld/sitemap/links/nav/number/sw-versions all clean')
EOF
