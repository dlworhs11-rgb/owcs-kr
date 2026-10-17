"""Build owcs-data.js for the OWCS KR site from the OWCSKR collector data (Liquipedia, github.com/dlworhs11-rgb/OWCSKR).

Holds no local paths: runs in GitHub Actions (cloud_live.py) and on the PC (build_owcs_data.py imports it).

Reads <OWCSKR_DATA> (only add_next_stage writes there):
  site/matches.json, site/standings.json, site/players.json   -> schedule, results, maps, bans, POTM, rosters
  lp/<page>.json, lp-cache/<page>.wiki                         -> playoff slots (TBD kept), rounds, stage format
  live/<date>/mapstats.json                                    -> live map winners / bans / POTM from the broadcast capture
Plus data/ in this folder: socials.json, faces.json, achievements.json, picks.json, insta_posts.txt, insta_meta.json,
live_scores/<date>.json (score_watch.py on the PC) and live_maps/<date>.json (broadcast capture pushed from the PC).

OWCSKR_DATA defaults to ./OWCSKR/data (where the GitHub Actions workflow checks the collector out).
"""
import json, os, re, sys, time, glob, datetime, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get('OWCSKR_DATA') or os.path.join(HERE, 'OWCSKR', 'data')
KST = datetime.timezone(datetime.timedelta(hours=9))
sys.path.insert(0, HERE)  # python -I leaves the script folder off the path
from owcs_cloud import soop_vods, live_status, upcoming_ics, write_ics, ICS_FILE  # noqa: E402,F401
# The stage on the page (regular season + its playoffs) is picked from the collector data, see find_stages().
# OWCS_STAGE=2026/3 pins one stage by hand.

TEAMS = {
    'ZETA DIVISION':  dict(a='ZETA',  ko='제타 디비전',     logo=('ZETA-light.png', 'ZETA-white.png'),  color='#2A2A30'),
    'Crazy Raccoon':  dict(a='CR',    ko='크레이지 라쿤',   logo=('CR.png', 'CR.png'),    color='#E11919'),
    'Cheeseburger':   dict(a='CB',    ko='치즈버거',        logo=('CB.png', 'CB.png'),    color='#DF751F'),
    'T1':             dict(a='T1',    ko='T1',              logo=('T1.png', 'T1.png'),    color='#C8102E'),
    'Team Falcons':   dict(a='FLC',   ko='팀 팔콘스',       logo=('FLC.png', 'FLC.png'),  color='#02A862'),
    'O2 Blast':       dict(a='O2',    ko='O2 블래스트',     logo=('O2-light.png', 'O2-dark.png'),    color='#CD2221'),
    'SEIJI ESPORTS':  dict(a='SEIJI', ko='세이지 이스포츠', logo=('SEIJI-light.png', 'SEIJI-dark.png'), color='#3E8FA8'),
    'ZANSIDE GAMING': dict(a='ZAN',   ko='잔사이드 게이밍', logo=('ZAN-light.png', 'ZAN-dark.png'),   color='#4A4A55'),
    'Poker Face':     dict(a='PF',    ko='포커페이스',      logo=('PF-light.png', 'PF-dark.png'),    color='#501F64'),
}
# logos drawn on the team-colour panel: ZETA's dark variant is a different emblem and T1's red mark vanishes on red
ON_COLOR = {'ZETA': 'ZETA-white.png', 'T1': 'T1-white.png'}
NEW_COLOR = '#8A8A93'   # grey for a team not in TEAMS yet (newly promoted)
NEW_TEAMS = {}          # full name -> fallback entry, filled by team() during a build
WARNED = set()          # NEW_TEAMS already reported (--watch prints the warning once)
STAGE_TEAMS = set()     # teams of the stage on the page; only these get a fallback entry (older teams keep their full name)


def team(name):
    """TEAMS entry of a team; a team not listed there (promoted from the open qualifier, renamed) gets a fallback:
    Liquipedia short name if the cached team page has one, else initials / first letters, grey colour, no logo"""
    if name in TEAMS:
        return TEAMS[name]
    if name not in NEW_TEAMS:
        taken = {t['a'] for t in TEAMS.values()} | {t['a'] for t in NEW_TEAMS.values()}
        a = lp_short(name) or abbrev(name)
        base, i = a, 2
        while a in taken:
            a, i = f'{base}{i}', i + 1
        NEW_TEAMS[name] = dict(a=a, ko=name, logo=None, color=NEW_COLOR)
    return NEW_TEAMS[name]


def lp_short(name):
    """'|shortname=' / '|abbreviation=' of the team's Liquipedia page, when the collector has it cached"""
    f = os.path.join(SRC, 'lp-cache', re.sub(r'[^a-z0-9]+', '_', name, flags=re.I) + '.wiki')
    if os.path.exists(f):
        with open(f, encoding='utf-8') as fh:
            m = re.search(r'^\|\s*(?:shortname|abbreviation)\s*=\s*([^\n|{}]+)', fh.read(), re.M)
        if m and m.group(1).strip():
            return m.group(1).strip().upper()[:6]
    return None


def abbrev(name):
    words = re.findall(r'[A-Za-z0-9]+', name)
    words = [w for w in words if w.lower() not in ('team', 'gaming', 'esports', 'the')] or words
    if not words:
        return name[:4].upper()
    if len(words) == 1:
        return words[0][:4].upper()
    return ''.join(w[0] for w in words).upper()[:5]


def is_team(name):
    """a real team name (not an empty / TBD slot)"""
    return bool(name) and name.strip().upper() != 'TBD'
MODE_KO = {'Control': '쟁탈', 'Hybrid': '혼합', 'Escort': '호위', 'Push': '밀기', 'Flashpoint': '플래시포인트', 'Clash': '격돌'}
MAP_MODE = {  # for maps read from the broadcast before Liquipedia has them
    'Antarctic Peninsula': 'Control', 'Busan': 'Control', 'Ilios': 'Control', 'Lijiang Tower': 'Control', 'Nepal': 'Control',
    'Oasis': 'Control', 'Samoa': 'Control', 'Blizzard World': 'Hybrid', 'Eichenwalde': 'Hybrid', 'Hollywood': 'Hybrid',
    "King's Row": 'Hybrid', 'Midtown': 'Hybrid', 'Numbani': 'Hybrid', 'Paraíso': 'Hybrid', 'Circuit Royal': 'Escort',
    'Dorado': 'Escort', 'Havana': 'Escort', 'Junkertown': 'Escort', 'Rialto': 'Escort', 'Route 66': 'Escort',
    'Shambali Monastery': 'Escort', 'Watchpoint: Gibraltar': 'Escort', 'Colosseo': 'Push', 'Esperança': 'Push',
    'New Queen Street': 'Push', 'Runasapi': 'Push', 'New Junk City': 'Flashpoint', 'Suravasa': 'Flashpoint',
    'Aatlis': 'Flashpoint', 'Hanaoka': 'Clash', 'Throne of Anubis': 'Clash', 'Neon Junction': 'Hybrid',
}
ROLE = {'TANK': ('탱', '탱커', 0), 'DPS': ('딜', '딜러', 1), 'SUP': ('힐', '힐러', 2)}


def load(rel):
    with open(os.path.join(SRC, rel), encoding='utf-8') as f:
        return json.load(f)


LP_NAME = 'Overwatch Champions Series'
RS_RE = re.compile(r'^OWCS (\d{4})/Asia/Stage (\d+)/Korea/Regular Season$')


def kst_day(iso):
    return datetime.datetime.fromisoformat(iso).astimezone(KST).date()


def find_stages():
    """every Korea stage with a regular season in the collector data, oldest first"""
    by = {}
    for m in load('site/matches.json'):
        r = RS_RE.match(m['competition'])
        if r:
            by.setdefault((int(r[1]), int(r[2])), []).append(kst_day(m['date']))
    out = []
    for (y, n), days in sorted(by.items()):
        start = min(days)
        out.append(dict(year=y, n=n, rs=f'OWCS {y}/Asia/Stage {n}/Korea/Regular Season', po=f'OWCS {y}/Asia/Stage {n}/Korea',
                        start=start, end=max(days), week0=start - datetime.timedelta(days=start.weekday())))
    return out


def current_stage(stages, today):
    """the newest stage whose regular season starts within 3 weeks: the next stage takes over once it is scheduled and close,
    until then the current one stays (with its playoffs)"""
    pin = os.environ.get('OWCS_STAGE')
    if pin:
        y, n = map(int, pin.split('/'))
        return next(s for s in stages if (s['year'], s['n']) == (y, n))
    cur = stages[0]
    for s in stages:
        if s['start'] <= today + datetime.timedelta(days=21):
            cur = s
    return cur


def lp_page(comp):
    """matches of one Liquipedia page as the collector stored it (data/lp/<slug>.json), with TBD slots kept;
    site/matches.json drops matches whose teams are not known yet"""
    title = comp.replace('OWCS ', LP_NAME + '/', 1)
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower().replace(LP_NAME.lower(), 'owcs')).strip('-')
    f = os.path.join(SRC, 'lp', slug + '.json')
    if not os.path.exists(f):
        return []
    with open(f, encoding='utf-8') as fh:
        page = json.load(fh).get('matches', [])
    # matches the collector already merged (canonical team names, replays) win; the rest get the alias names
    site = {m['idx']: m for m in load('site/matches.json') if m['competition'] == comp}
    alias = {k: v for k, v in load('aliases.json').items() if not k.startswith('_')}
    canon = lambda n: alias.get((n or '').strip().lower(), (n or '').strip())
    return [site.get(m['idx']) or dict(m, competition=comp, team1=canon(m['team1']), team2=canon(m['team2'])) for m in page]


def lp_wiki(comp):
    f = os.path.join(SRC, 'lp-cache', comp.replace('OWCS ', LP_NAME + '/', 1).replace(' ', '_').replace('/', '_') + '.wiki')
    if not os.path.exists(f):
        return ''
    with open(f, encoding='utf-8') as fh:
        return fh.read()


STAFF_KO = {'head coach': '감독', 'coach': '코치', 'assistant coach': '보조 코치', 'analyst': '분석관', 'manager': '매니저', 'team manager': '매니저'}


def stage_staff(comp):
    """coaching staff per team from the stage page's Participants list ({{Person|Crusty|role=head coach|type=staff}})"""
    w = lp_wiki(comp)
    i = w.find('==Participants==')
    if i < 0:
        return {}
    w = w[i:]
    j = w.find('\n==', 20)
    w = w[:j] if j > 0 else w
    alias = {k: v for k, v in load('aliases.json').items() if not k.startswith('_')}
    sp = os.path.join(HERE, 'data', 'staff.json')
    info = json.load(open(sp, encoding='utf-8')) if os.path.exists(sp) else {}
    out = {}
    for blk in re.split(r'\{\{Opponent\|', w)[1:]:
        name = blk.split('\n', 1)[0].split('|')[0].strip()
        name = alias.get(name.lower(), name)
        if not is_team(name):
            continue
        for pm in re.finditer(r'\{\{Person\|([^{}]*)\}\}', blk):
            parts = pm.group(1).split('|')
            kv = dict(x.split('=', 1) for x in parts[1:] if '=' in x)
            if kv.get('type', '').strip().lower() != 'staff':
                continue
            role = kv.get('role', '').strip().lower()
            pid = parts[0].strip()
            more = info.get(pid.lower(), {})   # fetch_staff.py: real name, birthday, country, career, photo (Namuwiki)
            out.setdefault(team(name)['a'], []).append(dict(id=pid, role=STAFF_KO.get(role, role.title()), ko=more.get('name', ''),
                                                            birth=more.get('birth', ''), country=more.get('country', ''), photo=more.get('photo', ''),
                                                            career=more.get('career', []), namu=more.get('namu', ''), lp=more.get('lp', '')))
    for a in out:
        out[a].sort(key=lambda p: next((k for k, r in enumerate(STAFF_KO.values()) if r == p['role']), 99))
    return out


PHASES = [('seeding', 'seed', '시드 결정전'), ('last chance', 'lcq', '라스트 찬스 예선'), ('playoff', 'po', '플레이오프')]
ROUND_KO = {'upper bracket final': '승자조 결승', 'upper bracket semifinal': '승자조 준결승', 'lower bracket semifinal': '패자조 준결승',
            'lower bracket final': '패자조 결승', 'quarterfinals': '8강', 'semifinals': '4강', 'grand final': '결승', 'final': '결승',
            'third place match': '3위 결정전'}


def playoff_layout(comp):
    """Liquipedia match idx -> (phase key, phase name, round), read from the cached wiki page of the stage playoffs.
    The collector numbers every {{Match}} of the page in order, so counting them here gives the same idx."""
    out, phase, rnd, idx = {}, None, None, 0
    for t in re.finditer(r'==+\s*\{\{Stage\|([^}]*)\}\}\s*==+|<!--\s*(.*?)\s*-->|\{\{\s*Match\s*(?=[|}\n])', lp_wiki(comp), re.I):
        if t.group(1) is not None:
            phase = next(((k, n) for w, k, n in PHASES if w in t.group(1).lower()), ('po', t.group(1)))
            rnd = None
        elif t.group(2) is not None:
            rnd = t.group(2)
        else:
            p = phase or ('po', '플레이오프')
            out[idx] = (p[0], p[1], ROUND_KO.get((rnd or '').lower(), rnd or p[1]))
            idx += 1
    return out


def stage_format(comp):
    """regular-season places that go to the seeding deciders / last chance qualifier, from the format text on Liquipedia"""
    w = lp_wiki(comp)
    top = re.search(r"Top (\d+) teams\}\} advance to '''Playoffs Seeding", w)
    nxt = re.search(r"Next (\d+) teams\}\} advance to '''Last Chance", w)
    po = int(top.group(1)) if top else 4
    return po, po + (int(nxt.group(1)) if nxt else 4)


def hero_code(h):
    return ''.join(w[0] for w in h.split()).upper()[:3] if ' ' in (h or '') else (h or '?')[:3].upper()


def side(team, m):
    return 'a' if team == m['team1'] else ('b' if team == m['team2'] else None)


def live_day(date):
    """map winners / bans / POTM read from the broadcast for one day, keyed by 'Team1 vs Team2'"""
    f = os.path.join(HERE, 'data', 'live_maps', date + '.json')   # pushed from the PC (cloud build)
    if not os.path.exists(f):
        f = os.path.join(SRC, 'live', date, 'mapstats.json')        # the collector folder itself (PC build)
    if not os.path.exists(f):
        return None
    with open(f, encoding='utf-8') as fh:
        d = json.load(fh)
    out = {}
    for m in d.get('maps', []):
        out.setdefault(m['match'], {'maps': [], 'potm': None})['maps'].append(m)
    for r in d.get('matches', []):
        out.setdefault(r['match'], {'maps': [], 'potm': None})['potm'] = r.get('potm')
    return out


VOD_LIST = 'https://www.sooplive.com/station/owesports/vod/review'


def vod_links():
    """'Team1 vs Team2' -> SOOP VOD url at the start of map 1, from data/manual/mapstats/*.json
    (only while the timestamps keep increasing: a reset means the broadcast moved on to another VOD part)"""
    out = {}
    for f in glob.glob(os.path.join(SRC, 'manual', 'mapstats', '*.json')):
        with open(f, encoding='utf-8') as fh:
            d = json.load(fh)
        m = re.search(r'SOOP VOD (\d+)', d.get('source', ''))
        if not m:
            continue
        last = -1
        for mp in d.get('maps', []):
            sec = mp.get('vodSec')
            if sec is None or sec < last:
                break
            last = sec
            if mp.get('game') == 1:
                out[mp['match']] = f'https://vod.sooplive.com/player/{m.group(1)}?change_second={sec}'
    return out


def load_picks():
    f = os.path.join(HERE, 'data', 'picks.json')
    if not os.path.exists(f):
        return {}
    with open(f, encoding='utf-8') as fh:
        return {k: v for k, v in json.load(fh).items() if not k.startswith('_')}


def live_sets(day):
    """map name (from the hero-ban screen) and first heroes per map (from the HUD), read by pick_watch.py on the PC"""
    f = os.path.join(HERE, 'data', 'live_sets', day + '.json')
    if not os.path.exists(f):
        return []
    with open(f, encoding='utf-8') as fh:
        return json.load(fh).get('sets', [])


def live_scores(day):
    f = os.path.join(HERE, 'data', 'live_scores', day + '.json')
    if not os.path.exists(f):
        return {}
    with open(f, encoding='utf-8') as fh:
        return json.load(fh).get('matches', {})


def stage_raw(stage):
    """the stage's matches as the collector has them: regular season (site/matches.json) + playoffs (Liquipedia page,
    TBD slots included), each tagged with phase / round"""
    rs = [dict(m, phase='rs') for m in load('site/matches.json') if m['competition'] == stage['rs']
          and is_team(m['team1']) and is_team(m['team2'])]
    layout = playoff_layout(stage['po'])
    po = []
    for m in lp_page(stage['po']):
        ph = layout.get(m['idx'])
        if ph:
            po.append(dict(m, phase=ph[0], phaseName=ph[1], round=ph[2]))
    return rs + po


# Liquipedia writes a match without a start time as 00:00 KST; those get the usual first-match time of that weekday
# for ordering / countdowns and are flagged tbd (shown as 시간 미정, all-day in the calendar files)
DAY_START = {4: '17:00', 5: '15:00', 6: '15:00'}


def start_of(m):
    dt = datetime.datetime.fromisoformat(m['date']).astimezone(KST)
    if dt.hour or dt.minute:
        return dt, False
    h, mi = map(int, DAY_START.get(dt.weekday(), '19:00').split(':'))
    return dt.replace(hour=h, minute=mi), True


def build_matches(stage):
    global PICKS
    PICKS = load_picks()
    raw = stage_raw(stage)
    order = {}   # day -> match keys in start order = MATCH 1 / 2 / 3 on the broadcast bar
    for m in sorted(raw, key=lambda m: m['date']):
        order.setdefault(kst_day(m['date']).isoformat(), []).append((m['competition'], m['idx']))
    lives = {}
    out = []
    for m in raw:
        dt, tbd = start_of(m)
        day = dt.date().isoformat()
        t1, t2 = m['team1'] or 'TBD', m['team2'] or 'TBD'
        if day not in lives:
            lives[day] = live_day(day)
        lv = (lives[day] or {}).get(f"{t1} vs {t2}") or (lives[day] or {}).get(f"{t2} vs {t1}")
        maps = []
        for mp in m.get('maps') or []:
            if not mp.get('map'):
                continue
            bans = mp.get('bans') or {}
            first = 'a' if mp.get('banstart') == 1 else ('b' if mp.get('banstart') == 2 else None)
            maps.append(dict(no=mp['n'], map=mp['map'], mode=MODE_KO.get(mp.get('mode'), mp.get('mode') or ''),
                             winner={1: 'a', 2: 'b'}.get(mp.get('winner')),
                             bans=[x for x in [dict(t='a', h=bans.get('t1')), dict(t='b', h=bans.get('t2'))] if x['h']],
                             banFirst=first, src='liquipedia', sa=mp.get('score1'), sb=mp.get('score2')))
        sa, sb, played, potm, live = m['score1'], m['score2'], m['played'], m.get('potm'), False
        need = (m.get('bestof') or (7 if m['phase'] == 'po' else 5)) // 2 + 1   # maps to win the series
        if lv and lv['maps']:
            # broadcast capture: fill in maps Liquipedia does not have yet, and the live series score
            lmaps = sorted(lv['maps'], key=lambda x: x.get('game') or 0)
            for lm in lmaps:
                g = lm.get('game')
                cur = next((x for x in maps if x['no'] == g), None)
                if cur is None:
                    cur = dict(no=g, map=lm.get('map') or '?', mode=MODE_KO.get(MAP_MODE.get(lm.get('map')), ''),
                               winner=None, bans=[], banFirst=None, src='live')
                    maps.append(cur)
                if not cur['winner'] and lm.get('winner'):
                    cur['winner'] = side(lm['winner'], m)
                b = lm.get('bans') or {}
                if not cur['bans'] and b.get('initial'):
                    cur['bans'] = [dict(t=side(x['team'], m), h=x['hero']) for x in (b.get('initial'), b.get('followUp')) if x and x.get('hero')]
                    cur['banFirst'] = side(b['initial'].get('team'), m)
                if lm.get('mapTime'):
                    cur['time'] = lm['mapTime']
            maps.sort(key=lambda x: x['no'] or 0)
            if not played:
                sa = sum(1 for x in maps if x['winner'] == 'a')
                sb = sum(1 for x in maps if x['winner'] == 'b')
                live = max(sa, sb) < need
                played = not live
            if not potm and lv.get('potm') and re.fullmatch(r'[A-Za-z0-9_]{2,}', lv['potm'].get('name') or ''):
                potm = lv['potm']['name']   # a half-read name ('?51') stays out
        # map name as soon as the ban screen shows it, and the first heroes off the HUD (pick_watch.py)
        auto_comps = {}
        for s in live_sets(day):
            if set(s.get('teams') or []) != {t1, t2} or not s.get('game'):
                continue
            cur = next((x for x in maps if x['no'] == s['game']), None)
            if cur is None:
                cur = dict(no=s['game'], map=s.get('map') or f"{s['game']}세트", mode=MODE_KO.get(MAP_MODE.get(s.get('map')), ''),
                           winner=None, bans=[], banFirst=None, src='live')
                maps.append(cur)
            b = s.get('bans') or {}
            if not cur['bans'] and (b.get('initial') or {}).get('hero'):
                cur['bans'] = [dict(t=side(x['team'], m), h=x['hero']) for x in (b.get('initial'), b.get('followUp')) if x and x.get('hero')]
                cur['banFirst'] = side(b['initial'].get('team'), m)
            sc = s.get('score') or {}
            if cur.get('sa') is None and t1 in sc and t2 in sc:   # read off the HUD; Liquipedia's score replaces it
                cur['sa'], cur['sb'] = sc[t1], sc[t2]
            if s.get('comps'):
                auto_comps[str(s['game'])] = {side(t, m): rows for t, rows in s['comps'].items() if side(t, m)}
        maps.sort(key=lambda x: x['no'] or 0)
        # series score read off the broadcast break screen (score_watch.py): the fastest map winner we get
        key = (m['competition'], m['idx'])
        sc = live_scores(day).get(str(order[day].index(key) + 1)) if key in order.get(day, []) else None
        if sc and sc.get('potm') and not potm:
            potm = sc['potm']   # read off the POTM card by score_watch.py seconds after it shows (already snapped to a roster id)
        # also when Liquipedia already calls the match over but has fewer maps in (it lags: 0-1 while the broadcast is at 0-3)
        if sc and (not m['played'] or sc['sa'] + sc['sb'] > (sa or 0) + (sb or 0)):
            for h in sc['history']:
                cur = next((x for x in maps if x['no'] == h['map']), None)
                if cur is None:
                    cur = dict(no=h['map'], map=f"{h['map']}세트", mode='', winner=None, bans=[], banFirst=None, src='score')
                    maps.append(cur)
                if not cur['winner']:
                    cur['winner'] = h['winner']
            maps.sort(key=lambda x: x['no'] or 0)
            sa, sb = max(sa, sc['sa']), max(sb, sc['sb'])
            live = max(sa, sb) < need
            played = not live
        # first heroes per player, from data/picks.json (filled by hand or by a hero-recognition tool)
        pk = {**auto_comps, **PICKS.get(f"{day} {short(t1)} vs {short(t2)}", {})}
        rp = m.get('replays') or []   # replay codes per game from the community sheet (collector/replays.mjs)
        for x in maps:
            x['bans'] = [dict(b, code=hero_code(b['h'])) for b in x['bans']]
            if pk.get(str(x['no'])):
                x['comps'] = pk[str(x['no'])]
            if 0 < x['no'] <= len(rp) and rp[x['no'] - 1]:
                x['replay'] = rp[x['no'] - 1]
        week = (dt.date() - stage['week0']).days // 7 + 1
        rs = m['phase'] == 'rs'
        out.append(dict(
            # regular season ids stay '<day>-<idx>' (calendar UIDs people already subscribed to); playoff ids do not
            # carry the day, so a rescheduled playoff match keeps its calendar entry
            id=f"{day}-{m['idx']}" if rs else f"{stage['year']}s{stage['n']}-p{m['idx']}",
            date=dt.isoformat(), day=day, time=dt.strftime('%H:%M'), tbd=tbd, week=week,
            n=m['idx'], phase=m['phase'], round=None if rs else m['round'],
            label=f'정규 리그 {week}주차' if rs else (m['phaseName'] if m['round'] == m['phaseName'] else f"{m['phaseName']} {m['round']}"),
            group=f'{week}주차' if rs else ('플레이오프' if m['phase'] == 'po' else '시드 결정전 · LCQ'),
            bo=need * 2 - 1,
            a=short(t1), b=short(t2), sa=sa, sb=sb, played=played, live=live,
            potm=potm, casters=[c for c in (m.get('casters') or []) if c],
            stream='https://play.sooplive.com/owesports/embed?autoPlay=true&mutePlay=true', maps=maps))
    out.sort(key=lambda x: (x['date'], x['phase'] != 'lcq'))
    vods = soop_vods(out, stage['n'], stage['year'])
    for x in out:
        x['vod'] = vods.get(x['day']) or (VOD_LIST if x['played'] else None)
    return out, lives


def potm_awards():
    """every Player of the Match award in the collector data, newest first, keyed by lowercase handle"""
    aliases = {'becky': 'bekey'}  # broadcast spelling -> roster handle
    out = {}
    for m in load('site/matches.json'):
        name = (m.get('potm') or '').strip().lower()
        if not name:
            continue
        comp = m['competition'].replace('OWCS ', '').replace('/Asia/', ' ').replace('/Korea', '').replace('/Regular Season', '').replace('Stage ', '스테이지 ')
        out.setdefault(aliases.get(name, name), []).append(dict(date=m['date'][:10], comp=comp, t1=m['team1'], t2=m['team2'], s1=m['score1'], s2=m['score2']))
    for v in out.values():
        v.sort(key=lambda x: x['date'], reverse=True)
    return out


SOOP_ONLY = {'CR', 'ZAN'}   # Crazy Raccoon and ZANSIDE GAMING stream on SOOP only (their CHZZK channels are unused)



def soop_url(v):
    """SOOP station link from a station id or link; the collector sometimes has station/undefined (Heiser), so
    socials.json "soop" (a station id) wins and a broken id gives None"""
    bid = (v or '').rstrip('/').split('/')[-1]
    return f'https://www.sooplive.com/station/{bid}' if bid and bid not in ('undefined', 'null', 'None') else None


INSTA_FILE = os.path.join(HERE, 'data', 'insta_posts.txt')
INSTA_HELP = """# 선수 인스타 게시물 링크를 한 줄에 하나씩 붙여넣으세요. 맨 위가 가장 최근 글로 보여요(선수마다 최대 4개).
# 링크에 계정 이름이 없으면 앞에 선수 이름을 적어 주세요.
#   예) Bernar https://www.instagram.com/p/AbC123xyz/
#   예) https://www.instagram.com/heesang1/p/AbC123xyz/
# '#'으로 시작하는 줄은 무시돼요. 저장한 뒤 바탕화면 '인스타 글 올리기'를 실행하면 사이트에 반영돼요.
"""


def load_insta():
    """data/insta_posts.txt -> [(who, permalink)]; who = player handle or Instagram account, lower case"""
    if not os.path.exists(INSTA_FILE):
        with open(INSTA_FILE, 'w', encoding='utf-8') as f:
            f.write(INSTA_HELP)
        return []
    out = []
    for line in open(INSTA_FILE, encoding='utf-8-sig'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = re.search(r'instagram\.com/(?:([A-Za-z0-9_.]+)/)?(p|reel|tv)/([A-Za-z0-9_-]+)', line)
        if not m:
            continue
        before = line[:m.start()].replace('https://', '').replace('http://', '').replace('www.', '').strip()
        who = (before.split()[0] if before else (m.group(1) or '')).lower()
        out.append((who, f'https://www.instagram.com/{m.group(2)}/{m.group(3)}/'))
    return out


def insta_post(url):
    """local copy of the post's full-size photo (assets/insta/<code>.jpg; Instagram's own embed shows a soft
    low-res preview) + caption and date from the page's link-preview tags; cached in data/insta_meta.json"""
    import html as _html
    code = url.rstrip('/').split('/')[-1]
    cache_f = os.path.join(HERE, 'data', 'insta_meta.json')
    cache = json.load(open(cache_f, encoding='utf-8')) if os.path.exists(cache_f) else {}
    img_rel = f'assets/insta/{code}.jpg'
    img = os.path.join(HERE, img_rel)
    meta = cache.get(code)
    try:
        if not os.path.exists(img):
            os.makedirs(os.path.dirname(img), exist_ok=True)
            req = urllib.request.Request(f'https://www.instagram.com/p/{code}/media/?size=l', headers={'User-Agent': 'Mozilla/5.0'})   # /p/ also serves reels
            data = urllib.request.urlopen(req, timeout=20).read()
            from PIL import Image
            import io
            im = Image.open(io.BytesIO(data)).convert('RGB')
            im.thumbnail((1080, 1350))
            im.save(img, quality=86)
        if meta is None:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; facebookexternalhit/1.1)'})
            page = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'replace')
            d = re.search(r'<meta property="og:description" content="([^"]*)', page)
            desc = _html.unescape(d.group(1)).strip() if d else ''
            md = re.search(r' on ([A-Z][a-z]+ \d{1,2}, \d{4})', desc)   # posts without a caption still carry the date
            mt = re.search(r'\d{4}: "(.*)"\.?$', desc, re.S)
            date = datetime.datetime.strptime(md.group(1), '%B %d, %Y').date().isoformat() if md else ''
            meta = dict(date=date, text=(mt.group(1) if mt else '').strip())
            cache[code] = meta
            json.dump(cache, open(cache_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    except Exception as e:
        print('instagram post not readable:', url, type(e).__name__, e)
    return dict(url=url, img=img_rel if os.path.exists(img) else '', text=(meta or {}).get('text', ''), date=(meta or {}).get('date', ''))


def build_players(socials, stage_teams):
    photos = {os.path.splitext(f)[0].lower(): f for f in os.listdir(os.path.join(HERE, 'assets', 'players'))}
    awards = potm_awards()
    fp = os.path.join(HERE, 'data', 'faces.json')   # [cx, cy, face height, w/h] of each photo, from YuNet
    faces = json.load(open(fp, encoding='utf-8')) if os.path.exists(fp) else {}
    ap = os.path.join(HERE, 'data', 'achievements.json')   # big-tournament top-4 finishes, from fetch_achievements.py
    ach = json.load(open(ap, encoding='utf-8')) if os.path.exists(ap) else {}
    insta = load_insta()
    out = []
    for p in load('site/players.json'):
        if p['team'] not in TEAMS and p['team'] not in stage_teams:   # national / other-region rosters
            continue
        a = team(p['team'])['a']
        handle = p['handle'].split(' ')[0]
        s = socials['players'].get(handle, {})
        role = ROLE.get(p['role'], ('?', '?', 3))
        photo = photos.get(handle.lower())
        out.append(dict(id=handle, ko=p.get('nameKo') or '', team=a, role=role[0], roleFull=role[1], order=role[2],
                        name=s.get('name', ''), birth=s.get('birth', ''), potm=p.get('potm') or 0,
                        photo=f'assets/players/{photo}' if photo else '', face=faces.get(os.path.splitext(photo)[0]) if photo else None,
                        soop=soop_url(s.get('soop')) or soop_url(p.get('soop')), chzzk=None if a in SOOP_ONLY else p.get('chzzk'), discord=p.get('discord'), youtube=p.get('youtube') or (s.get('youtube') and 'https://youtube.com/' + s['youtube']),
                        instagram=s.get('instagram') and 'https://instagram.com/' + s['instagram'],
                        x=s.get('x') and 'https://x.com/' + s['x'], lp=s.get('lp'),
                        insta=sorted([x for x in (insta_post(u) for w, u in insta if w in (handle.lower(), (s.get('instagram') or '').lower())) if x['img']],
                                     key=lambda x: x['date'], reverse=True)[:4],   # newest first; posts whose photo could not be read are left out
                        achievements=[{k: v for k, v in x.items() if k != 'k'} for x in ach.get(handle.lower(), [])][:10],
                        awards=awards.get(handle.lower(), [])[:6], awardCount=len(awards.get(handle.lower(), []))))
    out.sort(key=lambda x: (x['team'], x['order'], -x['potm']))
    return out


def write_records(matches, lives):
    """기록/<date>.md: map-by-map win record for every day that has broadcast capture data"""
    os.makedirs(os.path.join(HERE, '기록'), exist_ok=True)
    full = {v['a']: k for k, v in {**TEAMS, **NEW_TEAMS}.items()}
    name = {a: full.get(a, a) for m in matches for a in (m['a'], m['b'])}
    for day, lv in lives.items():
        if not lv:
            continue
        ms = [m for m in matches if m['day'] == day]
        lines = ['---', 'tags: [owcs, 경기기록]', f'created: {day}', 'status: ' + ('진행중' if any(m['live'] for m in ms) else '완료'), '---', '',
                 f'# {day} OWCS KR 경기 기록', '', '방송 캡처(OWCSKR live_capture) 기준. 맵이 끝날 때마다 갱신됩니다.', '']
        for m in ms:
            state = 'LIVE' if m['live'] else ('종료' if m['played'] else '예정')
            win = name[m['a']] if m['sa'] > m['sb'] else name[m['b']]
            lines += [f"## {m['time']} {name[m['a']]} {m['sa']} : {m['sb']} {name[m['b']]} ({state})", '']
            if m['played'] and not m['live']:
                lines += [f'- 승리: **{win}**']
            if m['potm']:
                lines += [f"- POTM: {m['potm']}"]
            for x in m['maps']:
                w = name[m[x['winner']]] if x['winner'] else '기록 중'
                lines += [f"- {x['no']}세트 {x['map']} ({x['mode']}) → {w}" + (f" · {x['time']}" if x.get('time') else '')]
            lines += ['']
        path = os.path.join(HERE, '기록', f'{day}.md')
        text = '\n'.join(lines)
        old = open(path, encoding='utf-8').read() if os.path.exists(path) else None
        if old != text:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)


def short(name):
    if not is_team(name):
        return 'TBD'
    return team(name)['a'] if name in TEAMS or name in STAGE_TEAMS else name


def build_history(stages, year):
    """every played Korea match of the season (regular seasons + playoffs) for the results search, newest first"""
    week0 = {s['po']: s['week0'] for s in stages}
    out = []
    for m in load('site/matches.json'):
        c = m['competition']
        if not (c.startswith(f'OWCS {year}/Asia/Stage') and '/Korea' in c and 'Open Qualifier' not in c) or not m['played']:
            continue
        dt = datetime.datetime.fromisoformat(m['date']).astimezone(KST)
        stage = '스테이지 ' + c.split('Stage ')[1].split('/')[0] + (' 플레이오프' if c.endswith('/Korea') else '')
        start = week0.get(c.replace('/Regular Season', ''))
        out.append(dict(date=dt.date().isoformat(), stage=stage, week=((dt.date() - start).days // 7 + 1) if start else None,
                        a=short(m['team1']), b=short(m['team2']), sa=m['score1'], sb=m['score2']))
    out.sort(key=lambda x: x['date'], reverse=True)
    return out


DOW_KO = '월화수목금토일'


def build_bracket(stage, matches, standings, playoffs):
    """playoff bracket of one stage: seeding deciders, last chance qualifier, then the playoff rounds
    (the third-place match shares the final's column). matches = built match dicts (phase / round / scores)."""
    ms = [m for m in matches if m['phase'] != 'rs']
    if not ms:
        return None
    full = {v['a']: k for k, v in {**TEAMS, **NEW_TEAMS}.items()}
    cols = []

    def col(title, key):
        if not cols or cols[-1]['key'] != key:
            cols.append(dict(key=key, title=title, matches=[]))
        return cols[-1]

    for m in sorted(ms, key=lambda m: ({'seed': 0, 'lcq': 1, 'po': 2}[m['phase']], m['n'])):   # Liquipedia page order
        if m['phase'] == 'seed':
            c = col('시드 결정전', 'seed')
        elif m['phase'] == 'lcq':
            c = col('LCQ', 'lcq')
        elif m['round'] == '3위 결정전' and cols and cols[-1]['key'] == 'po-결승':
            c = cols[-1]
            c['title'] = '결승 · 3위전'
        else:
            c = col(m['round'], 'po-' + m['round'])
        d = datetime.date.fromisoformat(m['day'])
        done = m['played'] and not m['live']
        c['matches'].append(dict(id=m['id'], round=m['round'], day=m['day'], live=m['live'], played=done,
                                 when=f"{d.month:02d}.{d.day:02d} ({DOW_KO[d.weekday()]})" + ('' if m['tbd'] else ' ' + m['time']),
                                 rows=[dict(n=full.get(a, a), a=a, s=s if (done or m['live']) else None) for a, s in ((m['a'], m['sa']), (m['b'], m['sb']))]))
    final = next((x for c in cols for x in c['matches'] if x['round'] == '결승' and x['played']), None)
    champ = final and max(final['rows'], key=lambda r: r['s'] or 0)['n']
    # seeding decider table: regular-season record carries over (Liquipedia format), plus the decider results
    seeds = [m for m in ms if m['phase'] == 'seed']
    teams = sorted({t for m in seeds for t in (m['a'], m['b']) if t != 'TBD'})
    if not teams and standings and all(m['played'] for m in matches if m['phase'] == 'rs'):
        teams = [s['a'] for s in standings[:playoffs]]
    rec = {s['a']: dict(a=s['a'], w=s['w'], l=s['l'], diff=s['diff'], sw=0, sl=0) for s in standings if s['a'] in teams}
    for m in seeds:
        if m['played'] and not m['live'] and m['a'] in rec and m['b'] in rec:
            win, lose = (m['a'], m['b']) if m['sa'] > m['sb'] else (m['b'], m['a'])
            rec[win]['w'] += 1; rec[win]['sw'] += 1; rec[lose]['l'] += 1; rec[lose]['sl'] += 1
            rec[m['a']]['diff'] += m['sa'] - m['sb']; rec[m['b']]['diff'] += m['sb'] - m['sa']
    seeding = sorted(rec.values(), key=lambda r: (-r['w'], -r['diff']))
    label = f"{stage['year']} 스테이지 {stage['n']}"
    return dict(label=label, title=label + ' 플레이오프', champion=champ, columns=cols, seeding=seeding,
                start=min(m['day'] for m in ms), end=max(m['day'] for m in ms))


def stage_brief(stage):
    """minimal match dicts of a past stage (enough for its bracket)"""
    out = []
    layout = playoff_layout(stage['po'])
    for m in stage_raw(stage):
        dt, tbd = start_of(m)
        out.append(dict(id=f"{stage['year']}s{stage['n']}-p{m['idx']}", n=m['idx'], phase=m['phase'], round=m.get('round'), day=dt.date().isoformat(),
                        date=dt.isoformat(), time=dt.strftime('%H:%M'), tbd=tbd, a=short(m['team1'] or 'TBD'), b=short(m['team2'] or 'TBD'),
                        sa=m['score1'], sb=m['score2'], played=m['played'], live=False))
    return out if layout else []


def standings_of(stage, matches=None):
    """Liquipedia's table; with `matches`, recounted from the regular-season results instead, so a match counts the
    moment its score is in (broadcast capture or Liquipedia's match page) without waiting for the table to be edited.
    Order: wins, set difference, head-to-head, then Liquipedia's own order."""
    st = load('site/standings.json').get(stage['rs'], [])
    lp = [dict(a=short(s['team']), w=s['w'], l=s['l'], mw=s['mw'], ml=s['ml'], diff=s['diff']) for s in st]
    rs = [m for m in matches or [] if m['phase'] == 'rs' and m['played'] and m['sa'] is not None and m['sb'] is not None]
    if not rs:
        return lp
    rec = {s['a']: dict(a=s['a'], w=0, l=0, mw=0, ml=0, diff=0) for s in lp}
    beat = {}
    for m in rs:
        for t, f, a in ((m['a'], m['sa'], m['sb']), (m['b'], m['sb'], m['sa'])):
            r = rec.setdefault(t, dict(a=t, w=0, l=0, mw=0, ml=0, diff=0))
            r['w' if f > a else 'l'] += 1
            r['mw'] += f; r['ml'] += a; r['diff'] = r['mw'] - r['ml']
        win, lose = (m['a'], m['b']) if m['sa'] > m['sb'] else (m['b'], m['a'])
        beat[(win, lose)] = beat.get((win, lose), 0) + 1
    order = [s['a'] for s in lp]
    out = sorted(rec.values(), key=lambda r: (-r['w'], -r['diff'], order.index(r['a']) if r['a'] in order else 99))
    for i in range(len(out) - 1):   # two teams level on wins and set difference: the head-to-head winner goes first
        x, y = out[i], out[i + 1]
        if (x['w'], x['diff']) == (y['w'], y['diff']) and beat.get((y['a'], x['a']), 0) > beat.get((x['a'], y['a']), 0):
            out[i], out[i + 1] = y, x
    return out


def build(check_live=False, prev_live=None, out=HERE, records=True):
    """owcs-data.js + calendar files into `out`; records = also write 기록/<date>.md (PC)"""
    with open(os.path.join(HERE, 'data', 'socials.json'), encoding='utf-8') as f:
        socials = json.load(f)
    stages = find_stages()
    stage = current_stage(stages, datetime.datetime.now(KST).date())
    prev = stages[stages.index(stage) - 1] if stages.index(stage) else None
    playoffs, lcq = stage_format(stage['po'])
    NEW_TEAMS.clear()
    STAGE_TEAMS.clear()
    STAGE_TEAMS.update(t for m in stage_raw(stage) for t in (m['team1'], m['team2']) if is_team(t))
    matches, lives = build_matches(stage)
    players = build_players(socials, STAGE_TEAMS)
    # a POTM name read off the broadcast card ('Violet') -> the closest handle on the two teams' rosters ('Viol2t')
    import difflib
    for m in matches:
        if m['potm'] and not any(p['id'].lower() == m['potm'].lower() for p in players):
            ids = [p['id'] for p in players if p['team'] in (m['a'], m['b'])]
            best = difflib.get_close_matches(m['potm'].lower(), [i.lower() for i in ids], 1, .6)
            if best:
                m['potm'] = next(i for i in ids if i.lower() == best[0])
    standings = standings_of(stage, matches)
    live =live_status(players) if check_live else (prev_live or {})
    bracket = build_bracket(stage, matches, standings, playoffs)
    last = prev and build_bracket(prev, stage_brief(prev), standings_of(prev), playoffs)
    # every earlier stage's bracket, newest first: the home page and the results page let you pick one
    past = []
    for s_ in stages[:stages.index(stage)][::-1]:
        b_ = build_bracket(s_, stage_brief(s_), standings_of(s_), stage_format(s_['po'])[0])
        if b_:
            past.append(b_)
    history = build_history(stages, stage['year'])
    teams = []   # every team in TEAMS, then the ones the build met that are not there yet (after matches / brackets / history)
    for full, t in list(TEAMS.items()) + list(NEW_TEAMS.items()):
        s = socials['teams'].get(full, {})
        logo = t['logo'] or ('', '')
        teams.append(dict(a=t['a'], n=full, ko=t['ko'], color=t['color'],
                          logo=logo[0] and 'assets/logos2/' + logo[0], logoDark=logo[1] and 'assets/logos2/' + logo[1],
                          logoOnColor=logo[1] and 'assets/logos2/' + ON_COLOR.get(t['a'], logo[1]),
                          photo=('assets/teams/' + t['a'] + '.webp') if os.path.exists(os.path.join(HERE, 'assets', 'teams', t['a'] + '.webp')) else '',
                          x=s.get('x') and 'https://x.com/' + s['x'], instagram=s.get('instagram') and 'https://instagram.com/' + s['instagram'], youtube=s.get('youtube') and 'https://www.youtube.com/' + s['youtube'],
                          lp=s.get('lp'), new=full not in TEAMS))
    if NEW_TEAMS and NEW_TEAMS.keys() != WARNED:
        WARNED.clear(); WARNED.update(NEW_TEAMS)
        print('! teams not in TEAMS (grey, no logo) - add them to TEAMS in owcs_build.py + logos in assets/logos2:')
        for full, t in NEW_TEAMS.items():
            print(f"    {full!r:28} -> {t['a']}")
    data = dict(generated=datetime.datetime.now(KST).isoformat(timespec='seconds'),
                stage=f"{stage['year']} OWCS KR 스테이지 {stage['n']}", year=stage['year'], stageNo=stage['n'],
                stageRange=[stage['start'].isoformat(), stage['end'].isoformat()],
                stageEnd=max([stage['end'].isoformat()] + [m['day'] for m in matches]),
                playoffs=playoffs, lcq=lcq,
                format=f'1–{playoffs}위 플레이오프 시드 결정전 · {playoffs + 1}–{lcq}위 라스트 찬스 예선 · 전 경기 3선승제',
                teams=teams, players=players, matches=matches, live=live,
                history=history, bracket=bracket, lastStage=last or dict(label='', title='', champion=None, columns=[]), pastStages=past,
                tiebreak='승수가 같으면 세트 득실 → 맞대결 성적 순으로 순위를 정해요.',
                standings=standings, staff=stage_staff(stage['po']),
                sources='데이터: Liquipedia (CC-BY-SA 3.0)')
    js = '// generated by owcs_build.py - do not edit\nwindow.OWCS = ' + json.dumps(data, ensure_ascii=False) + ';\n'
    with open(os.path.join(out, 'owcs-data.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    if records:
        write_records(matches, lives)
    write_ics(data, out)
    return data


def next_stage_pages():
    """Liquipedia pages of the next Korea stage the collector does not fetch yet, read from the '|next=' field of the
    newest stage page in lp-cache (filled by Liquipedia once the next stage is announced)"""
    with open(os.path.join(SRC, 'competitions.json'), encoding='utf-8') as f:
        have = set(json.load(f)['core'])
    newest = find_stages()[-1]
    m = re.search(r'^\|\s*next\s*=\s*([^\n]*)', lp_wiki(newest['po']), re.M)
    nxt = m and re.split(r'\{\{!\}\}|\|', m.group(1))[0].strip().replace('_', ' ')
    if not nxt or not nxt.startswith(LP_NAME + '/'):
        return []
    nxt = re.sub(r'/Korea(/.*)?$', '', nxt) + '/Korea'   # the overview / APAC / Regular Season link -> Korea stage page
    return [p for p in (nxt, nxt + '/Regular Season') if p not in have]


def add_next_stage(pages):
    """append the pages to the collector's competitions.json (core) and the stage to active.json"""
    for name, key in (('competitions.json', 'core'), ('active.json', None)):
        fp = os.path.join(SRC, name)
        with open(fp, encoding='utf-8') as f:
            d = json.load(f)
        lst = d[key] if key else d
        add = pages if key else [pages[0].replace(LP_NAME + '/', '', 1)]
        lst += [p for p in add if p not in lst]
        with open(fp, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
