"""Checks that the site's hand-kept lists still agree with each other. No network, no build: about 1 s.

Run: python site_check.py   (CI runs it on every push and pull request: .github/workflows/check.yml; it does not
block the deploy). Exit code 1 and one line per problem when something is off.

What it checks, and the slip each one catches:
  1. every deployed root file (site_urls.SITE_FILES) exists and git does not ignore it
  2. every root .html in git is deployed (10-24 gallery page: added, not in the deploy list, 404 on the site)
  3. the menu links in owcs-nav.js point at listed pages
  4. each page's scripts exist, use the tag form cloud_live.stamp_scripts versions (<script src="./x.js">),
     and load in the order they depend on
  5. dc templates: no single-brace bindings (value="{ x }" is always true, PR #4)
  6. the admin page's hero and map lists are not empty (admin_server reads owcs-maps.js / owcs_build by pattern)"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import site_urls  # noqa: E402

# a script on the left has to come before the ones on its right, on every page that loads both
ORDER = [
    ('owcs-data.js', ['owcs-phase.js', 'owcs-test.js', 'owcs-maps.js', 'support.js', 'owcs-bracket.js', 'owcs-cases.js']),
    ('owcs-maps.js', ['support.js']),   # OWCSMaps is read while the dc runtime renders
    ('owcs-test.js', ['support.js']),   # changes window.OWCS before the first render
    ('owcs-i18n.js', ['owcs-bracket.js']),   # replaces attachShadow before the bracket makes its shadow root
]   # (owcs-nav.js may come first: it reads OWCSi18n / OWCS only once the page is up)
problems = []


def bad(msg):
    problems.append(msg)


def git(*a):
    r = subprocess.run(['git', '-c', 'core.quotepath=false', *a], cwd=HERE, capture_output=True, text=True, encoding='utf-8')
    return r.returncode, r.stdout


def read(f):
    with open(os.path.join(HERE, f), encoding='utf-8') as fh:
        return fh.read()


def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    files = site_urls.SITE_FILES
    for f in files:   # 1
        if not os.path.exists(os.path.join(HERE, f)):
            bad(f'site_urls.SITE_FILES: {f} does not exist')
        elif git('check-ignore', '-q', f)[0] == 0:
            bad(f'.gitignore ignores {f}: it would never reach the site')
    code, out = git('ls-files', '*.html')
    if code == 0:   # 2 (only root pages: admin/ is copied on its own)
        for f in out.splitlines():
            if '/' not in f and f not in files:
                bad(f'{f} is in git but not in site_urls.SITE_FILES / PAGES: it would 404 on the site')

    nav = read('owcs-nav.js')   # 3
    m = re.search(r'var HREFS = \[(.*?)\];', nav, re.S)
    if not m:
        bad('owcs-nav.js: HREFS list not found')
    else:
        for h in re.findall(r"'([^']+)'", m.group(1)):
            if h.split('?')[0] not in site_urls.PAGES:
                bad(f'owcs-nav.js menu link {h!r} is not a page in site_urls.PAGES')

    for f in files:   # 4, 5
        if not f.endswith('.html') or not os.path.exists(os.path.join(HERE, f)):
            continue
        page = read(f)
        srcs = []
        for tag in re.findall(r'<script\b[^>]*\bsrc="([^"]+)"', page):
            if re.match(r'https?:', tag):
                continue
            name = tag.split('?')[0].removeprefix('./')
            srcs.append(name)
            if name != 'owcs-data.js' and not os.path.exists(os.path.join(HERE, name)):
                bad(f'{f}: script {tag} does not exist')
        for tag in re.findall(r'<script\b[^>]*\bsrc="(?!https?:)[^"]+"', page):
            if not re.match(r'<script src="(?:\./)?[\w.-]+\.js"', tag):
                bad(f'{f}: {tag}> is not in the form <script src="./x.js"> (no ?v= on deploy, the page keeps an old copy)')
        for first, later in ORDER:
            if first in srcs:
                for x in later:
                    if x in srcs and srcs.index(x) < srcs.index(first):
                        bad(f'{f}: {x} loads before {first}')
        if f.endswith('.dc.html'):
            for b in re.findall(r'="\{ [^{}"]*\}"', page):
                bad(f'{f}: single-brace binding {b} (use {{{{ }}}})')

    try:   # 6
        import admin_server
        if len(admin_server.heroes()) < 30:
            bad('admin_server.heroes(): fewer than 30 heroes (owcs-maps.js HERO_IMG / HERO_KO changed shape?)')
        if len(admin_server.maps()) < 20:
            bad('admin_server.maps(): fewer than 20 maps (owcs_build.MAP_MODE?)')
    except Exception as e:
        bad(f'admin page lists: {type(e).__name__}: {e}')

    for p in problems:
        print('✗', p)
    print(f'site_check: {len(problems)} problem(s)' if problems else 'site_check: ok')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
