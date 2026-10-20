// Map rows shared by the live box (home) and the results page: map art, per-map score,
// and on click the bans plus each player's first hero. Loaded before support.js.
(function () {
  const HERO_KO = { 'widowmaker': '위도우메이커', 'tracer': '트레이서', 'ana': '아나', 'kiriko': '키리코', 'sojourn': '소전', 'genji': '겐지', 'lucio': '루시우', 'baptiste': '바티스트', 'mercy': '메르시', 'zenyatta': '젠야타', 'mizuki': '미즈키', 'brigitte': '브리기테', 'juno': '주노', 'illari': '일리아리', 'lifeweaver': '라이프위버', 'moira': '모이라', 'cassidy': '캐서디', 'ashe': '애쉬', 'echo': '에코', 'hanzo': '한조', 'pharah': '파라', 'sombra': '솜브라', 'soldier: 76': '솔저: 76', 'symmetra': '시메트라', 'sierra': '시에라', 'torbjörn': '토르비욘', 'venture': '벤처', 'freja': '프레야', 'mei': '메이', 'reaper': '리퍼', 'bastion': '바스티온', 'junkrat': '정크랫', 'dva': 'D.Va', 'd.va': 'D.Va', 'doomfist': '둠피스트', 'hazard': '해저드', 'junker queen': '정커퀸', 'mauga': '마우가', 'orisa': '오리사', 'ramattra': '라마트라', 'reinhardt': '라인하르트', 'roadhog': '로드호그', 'sigma': '시그마', 'winston': '윈스턴', 'wrecking ball': '레킹볼', 'zarya': '자리야', 'jetpack cat': '제트팩 캣', 'wuyang': '우양', 'vendetta': '벤데타' };
  // hero portraits and map art (assets copied from the scrim dashboard)
  const HERO_IMG = Object.fromEntries('ana anran ashe baptiste bastion brigitte cassidy dmon doctrine domina doomfist dva echo emre freja genji hanzo hazard illari jetpack-cat junker-queen junkrat juno kiriko lifeweaver lucio mauga mei mercy mizuki moira orisa pharah ramattra reaper reinhardt roadhog shion sierra sigma sojourn soldier-76 sombra symmetra torbjorn tracer vendetta venture widowmaker winston wrecking-ball wuyang zarya zenyatta'.split(' ').map((k) => [k, 1]));
  const deaccent = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const heroKey = (h) => deaccent(h).toLowerCase().replace(/[.:']/g, '').trim().replace(/\s+/g, '-');
  const heroCode = (h) => String(h || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  const heroBg = (h) => HERO_IMG[heroKey(h)] ? "url('assets/heroes/" + heroKey(h) + ".png') center / cover no-repeat, #1B1B21" : 'repeating-linear-gradient(135deg,#24242B 0 4px,#1B1B21 4px 8px)';
  const MAP_FILE = { 'antarctic-peninsula': 'antarctic', 'throne-of-anubis': 'anubis', 'aatlis': 'atlis', 'watchpoint-gibraltar': 'gibraltar', 'kings-row': 'kings-row', 'route-66': 'route66', 'shambali-monastery': 'shambali' };
  const WIN_AT = Object.fromEntries([...['Antarctic Peninsula', 'Busan', 'Ilios', 'Lijiang Tower', 'Nepal', 'Oasis', 'Samoa'].map((n) => [n, 2]),
    ...['New Junk City', 'Suravasa', 'Aatlis'].map((n) => [n, 3])]);   // first to this many wins the map
  const MAP_HAVE = 'antarctic anubis atlis blizzard-world busan circuit-royal colosseo dorado eichenwalde esperanca gibraltar gridsbolten hanaoka havana hollywood ilios junkertown kings-row lijiang-tower lunasapphire midtown nepal neon-junction new-junk-city new-queen-street numbani oasis paraiso rialto route66 samoa shambali suravasa'.split(' ');
  const mapBg = (name) => { const k0 = deaccent(name).toLowerCase().replace(/[.:']/g, '').trim().replace(/\s+/g, '-'); const k = MAP_FILE[k0] || k0;
    return MAP_HAVE.includes(k) ? "linear-gradient(90deg, #15151B 0, #15151B calc(100% - 330px), rgba(21,21,27,.3) calc(100% - 140px), rgba(21,21,27,.25) 100%), url('assets/maps/" + k + ".webp') right center / auto 100% no-repeat, #15151B" : 'transparent'; };
  const heroName = (h) => { const k = (h || '').toLowerCase(), en = (h || '').replace(/\b\w/g, (c) => c.toUpperCase()); return HERO_KO[k] && !(window.OWCSi18n && window.OWCSi18n.lang !== 'ko') ? HERO_KO[k] + ' · ' + en : en; };
  const pad = (n) => String(n).padStart(2, '0');
  // push maps report distance in metres; everything else is a round count
  const pts = (v) => (v == null ? '' : Number.isInteger(+v) ? String(v) : (+v).toFixed(1) + 'm');
  /* m: a match from owcs-data.js (with m.st = 'live' | 'done' | 'up'); o: { spoiler, showBans, isOpen(key), toggle(key) } */
  // winner's logo next to its name on the map art: the white logo (the rows are dark), else the team colour
  const logoOf = (a) => { const t = ((window.OWCS || {}).teams || []).find((x) => x.a === a); if (!t) return '';
    const u = t.logoDark || t.logoOnColor || t.logo; return u ? "url('" + u + "') center / contain no-repeat" : t.color || ''; };
  function build(m, o) {
    const SP = !!o.spoiler, showBans = o.showBans !== false;
    return (m ? m.maps : []).map((x) => {
      const w = x.winner ? m[x.winner] : null;
      const recording = !w && m.st === 'live';
      const key = m.id + '-' + x.no, open = !!o.isOpen(key);
      // copy the code; the button's [data-l] label (or the button) says 복사됨 for 1.5 s
      const copyReplay = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const b = e && e.currentTarget, l = b && (b.querySelector('[data-l]') || b), was = l && l.textContent;
        const done = () => { if (l) { l.textContent = '복사됨'; setTimeout(() => { l.textContent = was; }, 1500); } };
        if (navigator.clipboard) navigator.clipboard.writeText(x.replay).then(done, done); else done();
      };
      // Control / Flashpoint end at a fixed score (2 / 3): once the map's winner is known, its score is that, even when
      // the HUD could not be read (Flashpoint shows points as dots, not digits: 10-18 map 3 stayed at 0 : 0)
      const tgt = WIN_AT[x.map] || { '쟁탈': 2, '플래시포인트': 3 }[x.mode];
      let sa = x.sa, sb = x.sb;
      if (tgt && x.winner === 'a' && (sa == null || sa < tgt)) { sa = tgt; sb = Math.min(sb || 0, tgt - 1); }
      if (tgt && x.winner === 'b' && (sb == null || sb < tgt)) { sb = tgt; sa = Math.min(sa || 0, tgt - 1); }
      const score = sa != null && sb != null ? (x.winner === 'b' ? pts(sb) + ' : ' + pts(sa) : pts(sa) + ' : ' + pts(sb)) : '';
      const comps = x.comps ? ['a', 'b'].map((t) => ({ team: m[t], win: !SP && x.winner === t,
        picks: (x.comps[t] || []).map(([pl, h]) => ({ pl, h, bg: heroBg(h), txt: HERO_IMG[heroKey(h)] ? '' : heroCode(h) })) })) : [];
      return { no: pad(x.no), name: x.map, mode: x.mode + (x.time ? ' · ' + x.time : ''),
        winner: SP ? '?' : (w || '–'), wlogo: SP || !w ? '' : logoOf(w), score: SP || !w ? '' : score,
        // the phone row shows the winner's number in lime and the loser's in grey (winner's number first)
        scoreHi: SP || !w || !score ? '' : score.split(' : ')[0], scoreLo: SP || !w || !score ? '' : score.split(' : ')[1],
        done: !!w || m.st === 'done', recording, bg: mapBg(x.map),
        chev: open ? '−' : '+', isOpen: open, showBans: open && showBans && x.bans.length > 0, showComps: open && comps.length > 0,
        showRec: open && !comps.length, comps,
        recNote: recording ? '기록 중이에요. 세트가 끝나면 양 팀 조합이 올라와요.' : '이 세트의 첫 조합 기록이 아직 없어요.',
        recNoteShort: recording ? '세트가 끝나면 조합이 올라와요.' : '첫 조합 기록 없음',
        // replay code (community sheet): a small copy chip at the right end of the last ban card; its own row only
        // when the map has no bans to sit beside
        bans: x.bans.map((b, i, all) => ({ k: b.t === x.banFirst ? '선벤' : '후벤', team: m[b.t] || '?', h: b.code, name: heroName(b.h), bg: heroBg(b.h), txt: HERO_IMG[heroKey(b.h)] ? '' : b.code,
          rc: i === all.length - 1 ? x.replay || '' : '', copy: (e) => copyReplay(e) })),
        replay: x.replay || '', hasReplay: !!x.replay, showReplay: open && !!x.replay && !(showBans && x.bans.length),
        showReplayRow: open && !!x.replay,   // phone: ban cards are too narrow, the chip gets a slim row under them
        copyReplay: (e) => copyReplay(e),
        toggle: () => o.toggle(key) };
    });
  }
  window.OWCSMaps = { build, heroName, heroBg, mapBg };
})();
