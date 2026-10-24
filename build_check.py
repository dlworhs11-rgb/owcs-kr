"""Checks the data build's contracts with the collector (OWCSKR) on small made-up inputs. No network, no collector
checkout, no build: about 1 s.

Run: python build_check.py   (CI runs it on every push and pull request: .github/workflows/check.yml; it does not
block the deploy). Exit code 1 and one line per problem when something is off.

What it checks, and the slip each one catches:
  1. run-lp.mjs failures come from data/lp/_status.json (or the ERR / SHRINK / STOP lines), not the exit code (RI-01)
  2. _missing.json values: floats, ISO strings an older collector wrote, junk (RI-10: float - str stopped the build)
  3. active.json: a full title matches only itself, a short legacy entry every title containing it (RC-12)
  4. broadcast mapstats: labelVerified False maps, matches not on the day's schedule and nameless POTMs are left out;
     matchKey picks the right one of two same-day meetings (P1-06, RI-09, RA-17)
  5. a broadcast POTM is kept only for a player of the two teams (exact or close spelling)
  6. wiki pages: a commented-out {{Match}} is no match, {{HiddenSort|..}} reads as its text (collector matchPlaces)
  7. dataBuilt / buildFails: kept and counted on a failed data build, reset on a good one (P1-04), and both in
     owcs-ver.json (read by the collector's tools/healthcheck.py) without changing its v
  8. ensure_wiki's age limit: 6 h near an event, 7 days otherwise (P2-07)"""
import datetime
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cloud_live  # noqa: E402
import owcs_build  # noqa: E402

problems = []


def expect(what, got, want):
    if got != want:
        problems.append(f'{what}: got {got!r}, expected {want!r}')


def put(root, rel, data):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(data if isinstance(data, str) else json.dumps(data))


def check_lp_failures(src):   # 1
    since = datetime.datetime(2026, 10, 24, 12, tzinfo=datetime.timezone.utc).timestamp()
    put(src, 'lp/_status.json', {'updatedAt': '2026-10-24T12:00:03.000Z', 'failures': 2, 'rateLimit': None, 'pages': {}})
    expect('lp_failures: this run\'s _status.json', cloud_live.lp_failures(['DONE 3 pages 2 failed'], since), (2, None))
    put(src, 'lp/_status.json', {'updatedAt': '2026-10-24T11:00:00.000Z', 'failures': 0})
    lines = ['ERR Overwatch Champions Series/x boom', 'MISSING y', 'SHRINK z 10 -> 2 (old file kept)', 'DONE']
    expect('lp_failures: older _status.json -> output lines', cloud_live.lp_failures(lines, since), (2, None))
    os.remove(os.path.join(src, 'lp', '_status.json'))
    expect('lp_failures: STOP is a rate limit', cloud_live.lp_failures(['STOP liquipedia 429', 'DONE'], since)[1], 'STOP liquipedia 429')


def check_seen_at():   # 2
    expect('seen_at float', cloud_live.seen_at(1761300000.5), 1761300000.5)
    expect('seen_at ISO Z', cloud_live.seen_at('2026-10-24T00:00:00.000Z'),
           datetime.datetime(2026, 10, 24, tzinfo=datetime.timezone.utc).timestamp())
    for junk in ('soon', None, [], True, {'a': 1}):
        expect(f'seen_at {junk!r}', cloud_live.seen_at(junk), 0.0)


def check_active(src):   # 3
    full = 'Overwatch Champions Series/2026/Asia/Stage 3/Korea'
    expect('is_active full title = itself', cloud_live.is_active(full, [full]), True)
    expect('is_active full title != its subpage', cloud_live.is_active(full + '/Open Qualifier', [full]), False)
    expect('is_active legacy entry = substring', cloud_live.is_active(full + '/Open Qualifier', ['2026/Asia/Stage 3']), True)
    wc = 'Overwatch World Cup/2027'
    put(src, 'competitions.json', {'core': [full, full + '/Open Qualifier', full + '/Regular Season'], 'world_cup': [wc, wc + '/Qualifier']})
    put(src, 'active.json', [full, wc])
    for t in (full, full + '/Open Qualifier', full + '/Regular Season', wc + '/Qualifier'):
        put(src, os.path.relpath(cloud_live.lp_file(t), src), {'title': t, 'matches': []})
    expect('lp_file name', os.path.basename(cloud_live.lp_file(wc)), 'owwc-2027.json')
    # wc has no data/lp file yet: re-read anyway (run-lp fetches it), as is any page without a file
    expect('active_titles', cloud_live.active_titles(), [full, wc])


SCHED = {('OWCS 2026/Asia/Stage 3/Korea/Regular Season', 1): dict(key=owcs_build.LP_NAME + '/2026/Asia/Stage 3/Korea/Regular Season#1', t1='Cheeseburger', t2='O2 Blast'),
         ('OWCS 2026/Asia/Stage 3/Korea', 4): dict(key=owcs_build.LP_NAME + '/2026/Asia/Stage 3/Korea#4', t1='O2 Blast', t2='Cheeseburger'),
         ('OWCS 2026/Asia/Stage 3/Korea/Regular Season', 2): dict(key=owcs_build.LP_NAME + '/2026/Asia/Stage 3/Korea/Regular Season#2', t1='Crazy Raccoon', t2='SEIJI ESPORTS')}


def check_live_index():   # 4
    rs1, po4, rs2 = list(SCHED)
    d = {'maps': [
        {'match': 'Cheeseburger vs O2 Blast', 'game': 1, 'matchKey': 'OWCS 2026/Asia/Stage 3/Korea/Regular Season#1', 'winner': 'Cheeseburger'},
        {'match': 'Cheeseburger vs O2 Blast', 'game': 1, 'matchKey': 'Overwatch_Champions_Series/2026/Asia/Stage_3/Korea#4', 'winner': 'O2 Blast'},
        {'match': 'Cheeseburger vs O2 Blast', 'game': 2, 'labelVerified': False},
        {'match': 'Cheeseburger vs O2 Blast', 'game': 3},   # no key, two meetings that day: not guessed
        {'match': 'Crazy Raccoon vs SEIJI ESPORTS', 'game': 1, 'matchKey': 'Overwatch Champions Series/2026/Old#9',
         'teams': {'Crazy Raccoon': [{'name': None, 'unknownId': '?1'}]}},   # key not that day's: label decides
        {'match': 'Crazy Raccoon vs Poker Face', 'game': 3},
    ], 'matches': [
        {'match': 'Crazy Raccoon vs SEIJI ESPORTS', 'potm': None, 'potmMethod': 'unresolved'},
        {'match': 'Crazy Raccoon vs Poker Face', 'potm': {'name': 'HeeSang'}},
        {'match': 'Cheeseburger vs O2 Blast', 'matchKey': po4[0].replace('OWCS ', owcs_build.LP_NAME + '/') + '#4', 'potm': {'name': 'Lip'}},
    ]}
    out = owcs_build.live_index(d, SCHED, 'test')
    expect('live_index matches', sorted(out, key=str), sorted([rs1, po4, rs2], key=str))
    expect('live_index matchKey -> first meeting', [m['winner'] for m in out[rs1]['maps']], ['Cheeseburger'])
    expect('live_index matchKey -> rematch', [m['winner'] for m in out[po4]['maps']], ['O2 Blast'])
    expect('live_index unresolved POTM', out[rs2]['potm'], None)
    expect('live_index POTM by matchKey', out[po4]['potm'], {'name': 'Lip'})
    expect('live_index unknown key, label', len(out[rs2]['maps']), 1)


def check_roster():   # 5
    players = [{'id': 'Viol2t', 'team': 'CB'}, {'id': 'Lip', 'team': 'O2'}, {'id': 'Someone', 'team': 'FLC'}]
    m = {'a': 'CB', 'b': 'O2'}
    expect('roster_name exact', owcs_build.roster_name('lip', players, m), 'Lip')
    expect('roster_name close', owcs_build.roster_name('Violet', players, m), 'Viol2t')
    expect('roster_name other team', owcs_build.roster_name('Someone', players, m), None)


def check_wiki(src):   # 6
    text = ('==Results==\n===={{HiddenSort|Group A}}====\n<!-- Opening Matches -->\n{{Match|opponent1=A}}\n'
            '<!--\n{{Match|opponent1=old}}\n-->\n<!-- Winners {{abbr}} -->\n{{Match|opponent1=B|x={{Map|map=Busan}}}}\n'
            '===[[Page|Playoffs]]===\n<!-- Grand Final -->\n{{ Match\n|opponent1=C}}\n')
    put(src, 'lp-cache/Overwatch_Champions_Series_2027_Test.wiki', text)
    expect('match_spans count', len(owcs_build.match_spans(text)), 3)
    expect('intl_layout', owcs_build.intl_layout('OWCS 2027/Test'),
           {0: ('Group A', 'Opening Matches'), 1: ('Group A', 'Opening Matches'), 2: ('Playoffs', 'Grand Final')})
    expect('clean_label', owcs_build.clean_label("{{nowrap|{{HiddenSort|Day 1}}}} '''x'''"), 'Day 1 x')


def check_stamp_build():   # 7
    good = {'dataBuilt': '2026-10-24T10:00:00+09:00', 'buildFails': 2}
    cloud_live.stamp_build(good, None, True, '2026-10-24T11:00:00+09:00')
    expect('stamp_build good', (good['dataBuilt'], good['buildFails']), ('2026-10-24T11:00:00+09:00', 0))
    prev = {'dataBuilt': '2026-10-24T10:00:00+09:00', 'buildFails': 2}
    cloud_live.stamp_build(prev, prev, False, '2026-10-24T11:00:00+09:00')
    expect('stamp_build failed', (prev['dataBuilt'], prev['buildFails']), ('2026-10-24T10:00:00+09:00', 3))
    expect('VOLATILE has the build fields', {'dataBuilt', 'buildFails'} <= set(cloud_live.VOLATILE), True)
    # owcs-ver.json: the collector's tools/healthcheck.py reads dataBuilt and buildFails from it
    data = {'matches': [{'id': 'x'}], 'liveChecked': '2026-10-24T11:05:00+09:00', **prev}
    ver = cloud_live.ver_record(data)
    expect('owcs-ver.json fields', ver, {'v': cloud_live.content_hash(data), 'checked': '2026-10-24T11:05:00+09:00',
                                         'dataBuilt': '2026-10-24T10:00:00+09:00', 'buildFails': 3})
    expect('owcs-ver.json v ignores buildFails', cloud_live.ver_record(dict(data, buildFails=0))['v'], ver['v'])
    expect('owcs-ver.json buildFails before any count', cloud_live.ver_record({'matches': []})['buildFails'], 0)


def check_wiki_age(src):   # 8
    today = datetime.date(2026, 10, 24)
    put(src, 'lp-cache/Overwatch_Champions_Series_2026_World_Finals.wiki', '{{Infobox\n|sdate=2026-11-20\n|edate=2026-11-29\n}}')
    expect('wiki_max_age near (infobox)', cloud_live.wiki_max_age(owcs_build.LP_NAME + '/2026/World Finals', today), 6 * 3600)
    put(src, 'lp/owcs-2025-champions-clash.json', {'matches': [{'date': '2025-03-01T18:00:00+09:00'}]})
    expect('wiki_max_age far (data/lp dates)', cloud_live.wiki_max_age(owcs_build.LP_NAME + '/2025/Champions Clash', today), 7 * 86400)
    expect('wiki_max_age no dates, next year', cloud_live.wiki_max_age(owcs_build.LP_NAME + '/2027/Champions Clash', today), 6 * 3600)


def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    src = tempfile.mkdtemp(prefix='owcs-build-check-')
    old = owcs_build.SRC
    owcs_build.SRC = src
    try:
        for step in (lambda: check_lp_failures(src), check_seen_at, lambda: check_active(src), check_live_index,
                     check_roster, lambda: check_wiki(src), check_stamp_build, lambda: check_wiki_age(src)):
            try:
                step()
            except Exception as e:
                problems.append(f'{getattr(step, "__name__", "check")}: {type(e).__name__}: {e}')
    finally:
        owcs_build.SRC = old
        shutil.rmtree(src, ignore_errors=True)
    for p in problems:
        print('✗', p)
    print(f'build_check: {len(problems)} problem(s)' if problems else 'build_check: ok')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
