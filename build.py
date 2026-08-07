#!/usr/bin/env python3
"""Stamp a content hash onto the asset URLs in index.html.

Why this exists. The stylesheet and script keep their filenames across releases,
so a browser that cached them once will keep serving the old copy and the page
renders new markup against old CSS and old JS. Appending a hash of the file's
own contents changes the URL whenever the file changes, which makes a stale copy
impossible to serve. Run this after editing anything under assets/.

    python3 build.py
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
INDEX = ROOT / 'index.html'
ASSETS = ['assets/css/style.css', 'assets/js/main.js']


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()[:10]


def main():
    html = INDEX.read_text(encoding='utf-8')
    original = html
    for rel in ASSETS:
        h = digest(rel)
        # match the asset with or without an existing ?v= stamp
        pattern = re.compile(re.escape(rel) + r'(\?v=[0-9a-f]+)?')
        found = pattern.search(html)
        if not found:
            print('  %-24s NOT REFERENCED in index.html' % rel, file=sys.stderr)
            continue
        html = pattern.sub(rel + '?v=' + h, html)
        print('  %-24s -> ?v=%s' % (rel, h))

    if html == original:
        print('  no change')
    else:
        INDEX.write_text(html, encoding='utf-8')
        print('  index.html updated')


if __name__ == '__main__':
    main()
