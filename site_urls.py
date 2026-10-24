"""Short English page addresses on the deployed site (owticker.com/schedule instead of /OWCS%20KR%20일정.html).

The source files keep their names (local preview, the preview site and the docs use them); only the deploy renames:
  - each page is written under its short name, and every link to the old names in the site's .html / .js is rewritten
  - standings / players: copies of the home page (owcs-theme.js reads the view from the address)
  - each old name stays as a small page that forwards to the new address, so links already shared keep working
GitHub Pages serves /schedule from schedule.html, so links leave out the .html."""
import os
import re
import urllib.parse

HOME = 'OWCS KR Home v6.dc.html'
PAGES = {   # source file -> short name ('' = the site root, index.html)
    HOME: '',
    'OWCS KR 일정.html': 'schedule',
    'OWCS KR Results.dc.html': 'results',
    'OWCS KR Player.dc.html': 'player',
    'OWCS KR 방송.html': 'streams',
    'OWCS KR 직관.html': 'tickets',
}
# every other file at the repo root that the deploy copies (owcs-*.js are picked up by name). A new page goes in PAGES
# (or here when it keeps its own name), plus the menu in owcs-nav.js; site_check.py checks the lists agree
OTHER_FILES = ['index.html', 'gallery-k7x2q9.html', 'support.js', '404.html',
               'naver47dd45ef166fd4aa1393b2a3ed899fef.html',   # Naver Search Advisor ownership check: keep it
               'favicon.ico', 'apple-touch-icon.png']
SITE_FILES = list(PAGES) + OTHER_FILES
VIEWS = {'standings': 'standings', 'teams': 'players'}   # home ?view= -> its own page
SITE = 'https://owticker.com/'
VIEW_META = {   # the home copies get their own title and description, so search and share cards don't show the home page's
    'standings': ('OWticker 순위 · 대진표', 'OWCS 코리아 정규 리그 팀별 순위와 플레이오프 대진표.'),
    'players': ('OWticker 팀 & 선수', 'OWCS 코리아 참가 팀과 선수 라인업, 팀별 로스터와 선수 방송.'),
}


def _forms(name):
    """the ways a page name is written in links: plain, spaces as %20, fully encoded"""
    return list(dict.fromkeys([name, name.replace(' ', '%20'), urllib.parse.quote(name)]))


def rewrite(text):
    for old, new in PAGES.items():
        for f in _forms(old):
            if old == HOME:
                for view, page in VIEWS.items():
                    text = text.replace(f + '?view=' + view + '&', page + '?').replace(f + '?view=' + view, page)
            text = text.replace(SITE + f, SITE + new)
            text = text.replace(f, new or './')
    return text


def head(page, new, meta=None):
    """canonical address (and for a home copy its own title / description / og:url) in a renamed page's <head>"""
    url = SITE + new
    if meta:
        title, desc = meta
        page = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', page, count=1)
        page = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, page, count=1)
        page = re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*', lambda m: m.group(1) + desc, page, count=2)
        page = re.sub(r'<script type="application/ld\+json">.*?</script>\n', '', page, count=1)   # the site's WebSite data: home only
    page = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, page, count=1)
    if 'rel="canonical"' not in page:
        page = page.replace('<head>', f'<head>\n<link rel="canonical" href="{url}">', 1)
    return page


def stub(new):
    url = new or './'
    return ('<!DOCTYPE html>\n<html lang="ko"><head><meta charset="utf-8"><title>OWticker</title>\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<link rel="canonical" href="{SITE}{new}">\n'
            f"<script>location.replace('{url}' + location.search + location.hash);</script></head>\n"
            '<body style="background:#0B0B0F;color:#fff;font-family:system-ui;padding:24px">'
            f'<a style="color:#C6FF33" href="{url}">OWticker</a></body></html>\n')


def write_crawl_files(out):
    """robots.txt and sitemap.xml for search engines, written by the build (the .gitignore keeps only listed files in git):
    the sitemap lists the short addresses above, not the old names, which are only forwarding pages"""
    urls = [SITE + new for new in PAGES.values()] + [SITE + v for v in VIEWS.values()]
    with open(os.path.join(out, 'robots.txt'), 'w', encoding='utf-8', newline='') as fh:
        fh.write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n')
    with open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8', newline='') as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                 + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')


def apply(out):
    """rename the pages in the built site folder `out` and rewrite the links in its .html / .js"""
    for f in os.listdir(out):
        if f.endswith(('.html', '.js')) and f != 'owcs-data.js':   # the data has no page links
            p = os.path.join(out, f)
            with open(p, encoding='utf-8') as fh:
                text = fh.read()
            new = rewrite(text)
            if new != text:
                with open(p, 'w', encoding='utf-8', newline='') as fh:
                    fh.write(new)
    for old, new in PAGES.items():
        src = os.path.join(out, old)
        if not os.path.exists(src):
            continue
        with open(src, encoding='utf-8') as fh:
            page = fh.read()
        names = [new or 'index'] + (list(VIEWS.values()) if old == HOME else [])
        for n in names:
            with open(os.path.join(out, n + '.html'), 'w', encoding='utf-8', newline='') as fh:
                fh.write(head(page, '' if n == 'index' else n, VIEW_META.get(n)))
        with open(src, 'w', encoding='utf-8', newline='') as fh:
            fh.write(stub(new))
    write_crawl_files(out)   # robots.txt + sitemap.xml with the short addresses
