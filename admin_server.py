"""Match-day admin page, for when the recorders miss something: type the crew, bans, comps, map, score or POTM by hand.

Runs on this PC only (127.0.0.1, not reachable from other devices). Saving writes data/live_admin/<date>.json;
live_relay.py sends it to the site within a second or two (signed), the GitHub push keeps it, and on the site and in
owcs_build.py a hand entry wins over what the recorders read.

    python admin_server.py          # then open http://127.0.0.1:8799/
Every write needs the X-OWCS-Admin header, which only the page served here sends: another website open in the
same browser cannot post to it (a cross-site request with a custom header needs a preflight this server never allows).
"""
import datetime, http.server, json, os, re, sys, webbrowser
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HERE = os.path.dirname(os.path.abspath(__file__))
KST = datetime.timezone(datetime.timedelta(hours=9))
PORT = 8799


def site_data():
    t = open(os.path.join(HERE, 'owcs-data.js'), encoding='utf-8').read()
    return json.loads(t[t.index('{'):t.rindex('}') + 1])


def heroes():
    t = open(os.path.join(HERE, 'owcs-maps.js'), encoding='utf-8').read()
    import unicodedata
    img = re.search(r"HERO_IMG = Object\.fromEntries\('([^']+)'", t)
    img = img.group(1).split() if img else []
    compact = {k.replace('-', ''): k for k in img}

    # owcs-maps.js heroKey(): 'junker queen', 'soldier: 76', 'torbjörn', 'd.va' -> junker-queen, soldier-76, torbjorn, dva,
    # the keys the recorders save; the two spellings used to show up as two entries, one without its Korean name (10-24)
    def key(h):
        h = ''.join(c for c in unicodedata.normalize('NFD', h) if not unicodedata.combining(c))
        k = re.sub(r'\s+', '-', re.sub(r"[.:']", '', h.lower()).strip())
        return k if k in img else compact.get(k.replace('-', ''), k)
    ko = {key(k): v for k, v in re.findall(r"'([^']+)': '([^']+)'", t[t.index('HERO_KO'):t.index('};', t.index('HERO_KO'))])}
    return sorted(({'k': k, 'ko': ko.get(k, k)} for k in set(ko) | set(img)), key=lambda h: h['ko'])


def maps():
    # the table itself: a regex over the source cut "King's Row" at its apostrophe into "s Row" (10-24)
    if HERE not in sys.path:
        sys.path.insert(0, HERE)   # python -I leaves the script folder off the path
    import owcs_build
    return sorted(owcs_build.MAP_MODE)


def admin_file(date):
    return os.path.join(HERE, 'data', 'live_admin', date + '.json')


def state(date):
    d = site_data()
    teams = {t['a']: t for t in d['teams']}
    ms = [m for m in d['matches'] if m['day'] == date]
    roster = lambda a: [p['id'] for p in sorted(d['players'], key=lambda p: (p.get('order', 9), p['id'])) if p['team'] == a]
    try:
        adm = json.load(open(admin_file(date), encoding='utf-8'))
    except (OSError, ValueError):
        adm = {'date': date, 'casters': [], 'matches': {}}
    return {
        'date': date, 'admin': adm, 'heroes': heroes(), 'maps': maps(),
        'matches': [{'id': m['id'], 'time': m['time'], 'a': m['a'], 'b': m['b'], 'an': teams.get(m['a'], {}).get('n', m['a']),
                     'bn': teams.get(m['b'], {}).get('n', m['b']), 'bo': m.get('bo') or 5, 'sa': m.get('sa'), 'sb': m.get('sb'),
                     'potm': m.get('potm'), 'casters': m.get('casters') or [], 'ra': roster(m['a']), 'rb': roster(m['b']),
                     'maps': [{'no': x['no'], 'map': x.get('map'), 'winner': x.get('winner'), 'sa': x.get('sa'), 'sb': x.get('sb'), 'bans': x.get('bans') or [],
                               'banFirst': x.get('banFirst'), 'comps': x.get('comps')} for x in m.get('maps') or []]} for m in ms],
    }


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, body, ctype='application/json; charset=utf-8'):
        b = body if isinstance(body, bytes) else body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def date(self):
        q = re.search(r'date=(\d{4}-\d\d-\d\d)', self.path)
        return q.group(1) if q else datetime.datetime.now(KST).date().isoformat()

    def do_GET(self):
        if self.path == '/' or self.path.startswith('/?'):
            return self.send(200, open(os.path.join(HERE, 'admin', 'index.html'), 'rb').read(), 'text/html; charset=utf-8')
        if self.path.startswith('/api/state'):
            return self.send(200, json.dumps(state(self.date()), ensure_ascii=False))
        if self.path.startswith('/assets/') and '..' not in self.path:
            f = os.path.join(HERE, self.path.lstrip('/').split('?')[0].replace('/', os.sep))
            if os.path.isfile(f):
                return self.send(200, open(f, 'rb').read(), 'image/png' if f.endswith('.png') else 'image/webp' if f.endswith('.webp') else 'application/octet-stream')
        self.send(404, '{}')

    def do_POST(self):
        if self.headers.get('X-OWCS-Admin') != '1' or not self.path.startswith('/api/save'):
            return self.send(403, '{"error":"forbidden"}')
        n = int(self.headers.get('Content-Length') or 0)
        if n > 200000:
            return self.send(413, '{}')
        try:
            body = json.loads(self.rfile.read(n).decode('utf-8'))
            date = body['date']
            assert re.fullmatch(r'\d{4}-\d\d-\d\d', date)
        except Exception:
            return self.send(400, '{"error":"bad body"}')
        body['at'] = datetime.datetime.now(KST).isoformat(timespec='seconds')
        os.makedirs(os.path.dirname(admin_file(date)), exist_ok=True)
        with open(admin_file(date), 'w', encoding='utf-8') as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
        print(time_now(), 'saved', date, flush=True)
        self.send(200, json.dumps({'ok': True, 'at': body['at']}))

    def do_OPTIONS(self):   # no CORS: cross-site posts never get past the preflight
        self.send(403, '{}')


def time_now():
    return datetime.datetime.now(KST).strftime('%H:%M:%S')


if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H)
    print(time_now(), f'admin page: http://127.0.0.1:{PORT}/', flush=True)
    if '--open' in sys.argv:
        webbrowser.open(f'http://127.0.0.1:{PORT}/')
    srv.serve_forever()
