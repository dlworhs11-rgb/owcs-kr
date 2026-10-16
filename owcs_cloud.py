"""The parts of the site build that need no PC: who is streaming (CHZZK / SOOP), SOOP replay links and the
calendar-subscription files. Used by build_owcs_data.py on the PC and by cloud_live.py in GitHub Actions.
Holds no local paths, so it is the only build code in the public repository."""
import datetime, json, os, re, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KST = datetime.timezone(datetime.timedelta(hours=9))

ICS_FILE = 'owcs-kr-upcoming.ics'   # calendar subscription: matches not played yet (rebuilt by cloud_live.py every ~10 min)


def soop_vods(matches=(), stage=None, year=None):
    """match day -> SOOP replay, one VOD per broadcast day, titled '2026 OWCS ASIA l KOREA STAGE 3 - Week W Day D'
    (regular season and the seeding / LCQ week) or '... STAGE 3 - PLAYOFFS DAY D'. Day D is the D-th match day of
    that week / of the playoffs in `matches` (owcs-data.js matches: day, week, phase). Titles cached 30 min."""
    cache = os.path.join(HERE, 'data', 'soop_vods.json')
    data = None
    if os.path.exists(cache) and time.time() - os.path.getmtime(cache) < 1800:
        with open(cache, encoding='utf-8') as f:
            data = json.load(f)
    if data is None:
        data = []
        try:
            for page in (1, 2):
                url = f'https://chapi.sooplive.co.kr/api/owesports/vods/review?keyword=&orderby=reg_date&perPage=60&field=title,contents&page={page}'
                r = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read())
                data += [dict(no=v['title_no'], title=v['title_name']) for v in r.get('data', [])]
            with open(cache, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception:
            if os.path.exists(cache):
                with open(cache, encoding='utf-8') as f:
                    data = json.load(f)
    days = {}   # 'po' or week number -> match days in order
    for m in matches:
        days.setdefault('po' if m.get('phase') == 'po' else m.get('week'), set()).add(m['day'])
    days = {k: sorted(v) for k, v in days.items()}
    out = {}
    for v in sorted(data or [], key=lambda v: v['no']):
        t = v['title'].upper()
        m = re.search(r'(\d{4}) OWCS\b.*\bKOREA STAGE (\d+)\s*-\s*(?:WEEK (\d+) DAY (\d+)|(?:PLAYOFFS?|FINALS?) DAY (\d+))', t)
        if not m or (stage and int(m.group(2)) != stage) or (year and int(m.group(1)) != year):
            continue
        key, n = (int(m.group(3)), int(m.group(4))) if m.group(3) else ('po', int(m.group(5)))
        ds = days.get(key, [])
        if 0 < n <= len(ds):
            out[ds[n - 1]] = f"https://vod.sooplive.com/player/{v['no']}"
    return out


def live_status(players):
    """which players are streaming right now (CHZZK polling API, SOOP player API); best effort"""
    live = {}
    for p in players:
        try:
            if p['chzzk']:
                cid = p['chzzk'].rstrip('/').split('/')[-1]
                req = urllib.request.Request(f'https://api.chzzk.naver.com/polling/v2/channels/{cid}/live-status', headers={'User-Agent': 'Mozilla/5.0'})
                st = json.loads(urllib.request.urlopen(req, timeout=8).read())
                if (st.get('content') or {}).get('status') == 'OPEN':
                    live[p['id']] = p['chzzk'] + '/live' if '/live' not in p['chzzk'] else p['chzzk']
                    continue
            if p['soop']:
                bid = p['soop'].rstrip('/').split('/')[-1]
                req = urllib.request.Request('https://live.sooplive.co.kr/afreeca/player_live_api.php', data=f'bid={bid}'.encode(),
                                             headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded'})
                st = json.loads(urllib.request.urlopen(req, timeout=8).read())
                if (st.get('CHANNEL') or {}).get('RESULT') == 1:
                    live[p['id']] = f'https://play.sooplive.co.kr/{bid}'
        except Exception:
            pass
        time.sleep(0.3)
    return live


def upcoming_ics(data, now=None, team=None):
    """iCalendar text with every match that has not started yet, so a subscribed Google Calendar keeps itself current
    (new playoff dates appear once they are in the schedule, finished matches drop out)."""
    now = now or datetime.datetime.now(KST)
    names = {t['a']: t['n'] for t in data['teams']}
    teams = (team,) if isinstance(team, str) else tuple(team or ())
    title = 'OWCS KR ' + ('·'.join(teams if len(teams) > 1 else [names.get(x, x) for x in teams]) + ' ' if teams else '') + '남은 경기'
    esc = lambda x: str(x).replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,')
    utc = lambda dt: dt.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    stamp = utc(now)
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OWCS KR fan//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
             'X-WR-CALNAME:' + title, 'X-WR-TIMEZONE:Asia/Seoul', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H']
    for m in data['matches']:
        t0 = datetime.datetime.fromisoformat(m['date'])
        if m.get('played') or t0 <= now or (teams and m['a'] not in teams and m['b'] not in teams):
            continue
        label = m.get('label') or f"{m['week']}주차"
        vs = f"{names.get(m['a'], m['a'])} vs {names.get(m['b'], m['b'])}"
        if 'TBD' in (m['a'], m['b']):
            vs = (m.get('round') or label) + (f" · {names.get(m['a'], m['a'])} vs 미정" if m['a'] != 'TBD' else ' · 대진 미정')
        # no start time on Liquipedia yet: all-day entry on that day (moves to the real time once it is announced)
        when = ([f"DTSTART;VALUE=DATE:{m['day'].replace('-', '')}",
                 f"DTEND;VALUE=DATE:{(datetime.date.fromisoformat(m['day']) + datetime.timedelta(days=1)).strftime('%Y%m%d')}"]
                if m.get('tbd') else [f'DTSTART:{utc(t0)}', f'DTEND:{utc(t0 + datetime.timedelta(hours=2))}'])
        lines += ['BEGIN:VEVENT', f"UID:owcs-{m['id']}@owcskr.fan", f'DTSTAMP:{stamp}', *when,
                  'SUMMARY:' + esc(f"[OWCS KR] {vs}"),
                  'DESCRIPTION:' + esc(f"{data['stage']} {label}" + (' · 시작 시간 발표 전' if m.get('tbd') else '')
                                       + ' · SOOP owesports 생중계 https://www.sooplive.com/station/owesports'),
                  'LOCATION:' + esc('WDG STUDIO HONGDAE · SOOP owesports'), 'END:VEVENT']
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'


def write_ics(data, folder=HERE):
    """owcs-kr-upcoming.ics (every team) + one file for every combination of teams, so picking several teams on the
    site is still a single subscription: owcs-kr-upcoming-<team>-<team>....ics, codes lower case in alphabetical order"""
    import itertools
    codes = sorted(t['a'] for t in data['teams'])
    with open(os.path.join(folder, ICS_FILE), 'w', encoding='utf-8', newline='') as f:
        f.write(upcoming_ics(data))
    for k in range(1, len(codes)):
        for combo in itertools.combinations(codes, k):
            name = ICS_FILE.replace('.ics', '-' + '-'.join(c.lower() for c in combo) + '.ics')
            with open(os.path.join(folder, name), 'w', encoding='utf-8', newline='') as f:
                f.write(upcoming_ics(data, team=combo))
