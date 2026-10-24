"""The parts of the site build that need no PC: who is streaming (CHZZK / SOOP), SOOP replay links and the
calendar-subscription files. Used by build_owcs_data.py on the PC and by cloud_live.py in GitHub Actions.
Holds no local paths, so it is the only build code in the public repository."""
import datetime, json, os, re, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KST = datetime.timezone(datetime.timedelta(hours=9))

ICS_FILE = 'owcs-kr-upcoming.ics'   # calendar subscription: matches not played yet (rebuilt by cloud_live.py every ~10 min)


_REPLAYS = None
_SEED = None   # {year, vods, checked}: the last deploy's list. In Actions data/soop_vods.json is gone every run, so this stands in for it (10-24)
_READ = None   # {year, vods, checked} of the list soop_replays last used; cloud_live publishes it as owcs-vods.json for the next run


def seed_replays(seed):
    """give soop_replays the list of the last deploy ({year, vods, checked}); it is used when it is under 30 min old"""
    global _SEED
    ok = isinstance(seed, dict) and isinstance(seed.get('vods'), list) and isinstance(seed.get('checked'), (int, float))
    _SEED = seed if ok else None


def replays_state():
    """{year, vods, checked (epoch s)} of the list the build used, None when SOOP was never read"""
    return _READ


def soop_replays(year, fresh=False):
    """OWCS Korea broadcast replays on SOOP owesports since 1 January of `year`: [{no, start, end}] in epoch seconds.
    The list API gives 20 a page, newest first, and only the upload time (= broadcast end) and the length, so
    start = end - length. Cached 30 min in data/soop_vods.json (a stale copy is used when SOOP cannot be read);
    `fresh` reads SOOP regardless (replay_comment.py waiting for tonight's upload)."""
    global _REPLAYS, _READ
    if _REPLAYS is not None and not fresh:
        return _REPLAYS
    cache = os.path.join(HERE, 'data', 'soop_vods.json')
    old, at = None, 0
    if os.path.exists(cache):
        with open(cache, encoding='utf-8') as f:
            old = json.load(f)
        if not (isinstance(old, dict) and old.get('year') == year):   # older cache format / another season
            old = None
        at = os.path.getmtime(cache)
    if old is None and _SEED and _SEED.get('year') == year:
        old, at = _SEED, _SEED['checked']
    if old and not fresh and time.time() - at < 1800:
        _REPLAYS = old['vods']
        _READ = dict(year=year, vods=_REPLAYS, checked=at)
        return _REPLAYS
    vods = []
    try:
        for page in range(1, 31):
            url = f'https://chapi.sooplive.co.kr/api/owesports/vods/review?keyword=&orderby=reg_date&field=title,contents&page={page}'
            r = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read())
            rows = r.get('data', [])
            for v in rows:
                if not re.search(r'\bOWCS\b.*\bKOREA\b', v['title_name'].upper()):
                    continue
                end = datetime.datetime.fromisoformat(v['reg_date']).replace(tzinfo=KST).timestamp()
                vods.append(dict(no=v['title_no'], start=int(end - v['ucc']['total_file_duration'] / 1000), end=int(end)))
            if not rows or rows[-1]['reg_date'] < f'{year}-01-01' or page >= (r.get('meta') or {}).get('last_page', page):
                break
        with open(cache, 'w', encoding='utf-8') as f:
            json.dump(dict(year=year, vods=vods), f)
        _READ = dict(year=year, vods=vods, checked=time.time())
    except Exception as e:
        print('SOOP replays not read:', e)
        vods = old['vods'] if old else []
        if old:
            _READ = dict(year=year, vods=vods, checked=at)   # old time: the next run tries SOOP again
    _REPLAYS = vods
    return vods


def soop_vod(replays, day, start=None, lead=90):
    """SOOP replay url of a Korea match on `day` (YYYY-MM-DD, KST). With the match start (epoch seconds) it is the
    part of the broadcast holding that moment, opened `lead` seconds before it; without, the first broadcast of that day."""
    on_day = sorted((v for v in replays if datetime.datetime.fromtimestamp(v['start'], KST).date().isoformat() == day
                     or datetime.datetime.fromtimestamp(v['end'], KST).date().isoformat() == day), key=lambda v: v['start'])
    if not on_day:
        return None
    if start:
        for v in on_day:
            if v['start'] <= start < v['end']:
                return f"https://vod.sooplive.com/player/{v['no']}?change_second={max(0, int(start - v['start']) - lead)}"
    return f"https://vod.sooplive.com/player/{on_day[0]['no']}"


def live_status(players):
    """which players are streaming right now (CHZZK polling API, SOOP player API); best effort"""
    live = {}
    for p in players:
        try:   # CHZZK and SOOP each in their own try: a CHZZK error must not skip the SOOP check
            if p['chzzk']:
                cid = p['chzzk'].rstrip('/').split('/')[-1]
                req = urllib.request.Request(f'https://api.chzzk.naver.com/polling/v2/channels/{cid}/live-status', headers={'User-Agent': 'Mozilla/5.0'})
                st = json.loads(urllib.request.urlopen(req, timeout=8).read())
                if (st.get('content') or {}).get('status') == 'OPEN':
                    live[p['id']] = f'https://chzzk.naver.com/live/{cid}'   # <channel>/live is not a CHZZK page: it opens the channel home
                    continue
        except Exception:
            pass
        try:
            if p['soop']:
                bid = p['soop'].rstrip('/').split('/')[-1]
                req = urllib.request.Request('https://live.sooplive.co.kr/afreeca/player_live_api.php', data=f'bid={bid}'.encode(),
                                             headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded'})
                st = json.loads(urllib.request.urlopen(req, timeout=8).read())
                if (st.get('CHANNEL') or {}).get('RESULT') == 1:
                    live[p['id']] = f'https://play.sooplive.com/{bid}'
        except Exception:
            pass
        time.sleep(0.3)
    return live


def last_streams(players, prev=None):
    """players with both a SOOP and a CHZZK channel -> {id: {'soop': start, 'chzzk': start}} of their latest broadcast
    ('YYYY-MM-DD HH:MM:SS', KST). CHZZK lives under 10 minutes are skipped: some players open one only to post
    'SOOP으로 오세용'. A channel that cannot be read keeps the date from `prev`."""
    out = {}
    for p in players:
        if not (p.get('soop') and p.get('chzzk')):
            continue
        d = dict((prev or {}).get(p['id']) or {})
        try:
            cid = p['chzzk'].rstrip('/').split('/')[-1]
            req = urllib.request.Request(f'https://api.chzzk.naver.com/service/v3/channels/{cid}/live-detail', headers={'User-Agent': 'Mozilla/5.0'})
            c = json.loads(urllib.request.urlopen(req, timeout=8).read()).get('content') or {}
            o, e = c.get('openDate'), c.get('closeDate')
            if o and not (e and (datetime.datetime.fromisoformat(e) - datetime.datetime.fromisoformat(o)).total_seconds() < 600):
                d['chzzk'] = o
        except Exception:
            pass
        try:
            bid = p['soop'].rstrip('/').split('/')[-1]
            req = urllib.request.Request(f'https://chapi.sooplive.co.kr/api/{bid}/station', headers={'User-Agent': 'Mozilla/5.0'})
            s = (json.loads(urllib.request.urlopen(req, timeout=8).read()).get('station') or {}).get('broad_start')
            if s:
                d['soop'] = s
        except Exception:
            pass
        out[p['id']] = d
        time.sleep(0.3)
    return out


YT_JP = 'https://www.youtube.com/@ow_esports_jp/live'
YT_FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCDMOG3oKXEh5Omaw9FaVqDw'


def yt_live(prev=None, matches=(), stage_no=None, now=None):
    """Video id of today's Japanese broadcast on @ow_esports_jp (live now, or scheduled for today).
    The home page embeds it for the YouTube / 日本語 choice: YouTube no longer plays embed/live_stream?channel=...
    1. the channel's /live page (works from a home PC; GitHub's servers often get a page without the stream)
    2. the channel's RSS feed: the stream titled "...Stage N】Week W Day D ライブ" for today's match day
    Keeps the previous id when YouTube can't be read, '' when nothing fits."""
    ua = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'ja,en;q=0.8', 'Cookie': 'CONSENT=YES+1; SOCS=CAI'}
    try:
        html = urllib.request.urlopen(urllib.request.Request(YT_JP, headers=ua), timeout=10).read().decode('utf-8', 'replace')
        m = re.search(r'<link rel="canonical" href="https://www\.youtube\.com/watch\?v=([\w-]{11})"', html)
        if m and ('"isLiveNow":true' in html or '"isUpcoming":true' in html):
            return m.group(1)
    except Exception:
        pass
    today = (now or datetime.datetime.now(KST)).date().isoformat()
    tm = [m for m in matches if m.get('day') == today]
    if not tm:
        return ''
    week = tm[0].get('week')
    days = sorted({m['day'] for m in matches if m.get('week') == week and m.get('phase', 'rs') == 'rs'})
    want = (week, days.index(today) + 1) if week and today in days else None
    try:
        xml = urllib.request.urlopen(urllib.request.Request(YT_FEED, headers=ua), timeout=10).read().decode('utf-8', 'replace')
        for vid, title in re.findall(r'<yt:videoId>([\w-]{11})</yt:videoId>.*?<title>([^<]*)</title>', xml, re.S):
            t = re.search(r'Stage\s*(\d+)\D*Week\s*(\d+)\s*Day\s*(\d+)', title, re.I)
            if want and t and 'ライブ' in title and (stage_no is None or int(t.group(1)) == stage_no) and (int(t.group(2)), int(t.group(3))) == want:
                return vid
        return ''
    except Exception:
        return prev or ''


IG_EMBED = 'https://www.instagram.com/ow_esports_kr/embed/'


def ig_reels(prev=None, checked=None, now=None):
    """Newest videos (reels) on the official Instagram @ow_esports_kr, newest first: (shortcodes, checked time).
    Read from the account's public embed page (its data API answers 429 without a login), at most every 5 minutes (each build);
    in between, or when Instagram can't be read, the previous list stays. The home page plays them in Instagram's
    own embed beside the 방송 예정 board."""
    now = now or datetime.datetime.now(KST)
    prev = list(prev or [])
    try:
        if checked and now - datetime.datetime.fromisoformat(checked) < datetime.timedelta(minutes=5):
            return prev, checked
    except ValueError:
        pass
    try:
        req = urllib.request.Request(IG_EMBED, headers={'User-Agent': 'Mozilla/5.0'})   # a full browser UA gets the script-built page with no data in it
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', 'replace').replace('\\"', '"')
        found = re.findall(r'"__typename":"GraphVideo","id":"\d+","shortcode":"([\w-]+)".*?"taken_at_timestamp":(\d+)', html, re.S)
        ids = [c for c, _ in sorted(dict(found).items(), key=lambda x: -int(x[1]))][:6]
        return (ids or prev), now.isoformat(timespec='seconds')
    except Exception:
        return prev, checked


def fold_ics(line):
    """RFC 5545 3.1: a content line is at most 75 octets; longer ones continue on the next line after CRLF + space.
    Cut by UTF-8 bytes, never inside a multi-byte character."""
    if len(line.encode('utf-8')) <= 75:
        return line
    out, cur, size, room = [], '', 0, 75
    for ch in line:
        n = len(ch.encode('utf-8'))
        if size + n > room:
            out.append(cur)
            cur, size, room = '', 0, 74   # the leading space of a continuation line counts too
        cur += ch
        size += n
    out.append(cur)
    return '\r\n '.join(out)


def upcoming_ics(data, now=None, team=None):
    """iCalendar text with every match that has not started yet, so a subscribed Google Calendar keeps itself current
    (new playoff dates appear once they are in the schedule, finished matches drop out)."""
    now = now or datetime.datetime.now(KST)
    names = {t['a']: t['n'] for t in data['teams']}
    teams = (team,) if isinstance(team, str) else tuple(team or ())
    title = (' · '.join(teams if len(teams) > 1 else [names.get(x, x) for x in teams]) if teams else 'OWCS KR') + ' 남은 경기'
    # calendar colour = the team's colour (first team when several; site green for every team). Apple Calendar reads it,
    # Google Calendar ignores colours in subscribed files and picks its own.
    colors = {t['a']: t.get('color') for t in data['teams']}
    color = (colors.get(teams[0]) if teams else None) or '#C6FF33'
    esc = lambda x: str(x).replace('\r', '').replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')   # a newline would end the line (10-24)
    utc = lambda dt: dt.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    stamp = utc(now)
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OWCS KR fan//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
             'X-WR-CALNAME:' + esc(title), 'X-APPLE-CALENDAR-COLOR:' + color, 'X-WR-TIMEZONE:Asia/Seoul', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H']
    for m in data['matches']:
        t0 = datetime.datetime.fromisoformat(m['date'])
        if m.get('played') or t0 <= now or (teams and m['a'] not in teams and m['b'] not in teams):
            continue
        label = m.get('label') or f"{m['week']}주차"
        vs = f"{names.get(m['a'], m['a'])} vs {names.get(m['b'], m['b'])}"
        if 'TBD' in (m['a'], m['b']):
            vs = (m.get('round') or label) + (f" - {names.get(m['a'], m['a'])} vs TBD" if m['a'] != 'TBD' else ' - 대진 미정')
        # no start time on Liquipedia yet: all-day entry on that day (moves to the real time once it is announced)
        when = ([f"DTSTART;VALUE=DATE:{m['day'].replace('-', '')}",
                 f"DTEND;VALUE=DATE:{(datetime.date.fromisoformat(m['day']) + datetime.timedelta(days=1)).strftime('%Y%m%d')}"]
                if m.get('tbd') else [f'DTSTART:{utc(t0)}', f'DTEND:{utc(t0 + datetime.timedelta(minutes=120 if (m.get("bo") or 5) >= 7 else 90))}'])   # as the official schedule: BO5 1h30, BO7 2h
        lines += ['BEGIN:VEVENT', f"UID:owcs-{m['id']}@owcskr.fan", f'DTSTAMP:{stamp}', *when,
                  'SUMMARY:' + esc(vs),
                  'DESCRIPTION:' + esc(f"{data['stage']} {label}" + (' - 경기 시각 미정' if m.get('tbd') else '')
                                       + ' - SOOP owesports https://www.sooplive.com/station/owesports'),
                  'LOCATION:' + esc('WDG STUDIO HONGDAE · SOOP owesports'), 'END:VEVENT']
    lines.append('END:VCALENDAR')
    return '\r\n'.join(fold_ics(x) for x in lines) + '\r\n'


# calendar file names keep the codes teams had when people subscribed (SEIJI -> SEJ, ZAN -> ROZE on 2026-10-23): the pages build the same names
ICS_SLUG = {'SEJ': 'seiji', 'ROZE': 'zan'}


def write_ics(data, folder=HERE):
    """owcs-kr-upcoming.ics (every team) + one file for every combination of teams, so picking several teams on the
    site is still a single subscription: owcs-kr-upcoming-<team>-<team>....ics, codes lower case in alphabetical order"""
    import itertools
    slug = lambda c: ICS_SLUG.get(c, c.lower())
    codes = sorted((t['a'] for t in data['teams']), key=slug)
    with open(os.path.join(folder, ICS_FILE), 'w', encoding='utf-8', newline='') as f:
        f.write(upcoming_ics(data))
    for k in range(1, len(codes)):
        for combo in itertools.combinations(codes, k):
            name = ICS_FILE.replace('.ics', '-' + '-'.join(slug(c) for c in combo) + '.ics')
            with open(os.path.join(folder, name), 'w', encoding='utf-8', newline='') as f:
                f.write(upcoming_ics(data, team=combo))
