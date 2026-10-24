// 경우의 수 (what each team still needs), shown on the schedule page's standings during the last two weeks of the regular season.
// Gives { kind: 'unknown' } for every team when too many matches are left to enumerate (10-24).
// OWCSCases(D, now, NAME) -> { left, caseOf(a), axeOf(i), racing(k) }
(function () {
  window.OWCSCases = function (D, NOW, NAME) {
    // regular season only (the playoff slots are not part of the table)
    const LEFT = D.matches.filter((m) => (!m.phase || m.phase === 'rs') && (!m.played || m.live || new Date(m.date).getTime() > NOW));
    // every result of the remaining matches, ranked the way the table is: wins, then set difference, then head-to-head.
    // A match ends 3-0 / 3-1 / 3-2 either way (6 results), so the sets decide ties that wins alone cannot. With too many
    // matches left for that (6^n), only win/loss is tried and a tie on wins counts as unresolved.
    // best = rank if every tie breaks our way, worst = rank if every tie breaks against us.
    const BYSETS = LEFT.length <= 7;
    const CASES = (() => {
      const teams = D.standings.map((s) => s.a), n = LEFT.length, out = {};
      const base = Object.fromEntries(D.standings.map((s) => [s.a, s.w]));
      const diff0 = Object.fromEntries(D.standings.map((s) => [s.a, BYSETS ? (s.diff || 0) : 0]));
      teams.forEach((a) => { out[a] = { best: 99, worst: 0, needPO: null, needLCQ: null, own: {}, bestIfLose: {} }; });
      if (n > 22) { teams.forEach((a) => { out[a].unknown = true; }); return out; } // too many to enumerate
      const done = D.matches.filter((m) => (!m.phase || m.phase === 'rs') && m.played && !m.live && !LEFT.includes(m) && m.sa != null && m.sb != null)
        .map((m) => [m.a, m.b, m.sa, m.sb]);
      const lose = BYSETS ? [0, 1, 2] : [0]; // sets the loser takes
      const RES = []; // every result of one match as [a wins?, set diff for a]
      for (const aw of [1, 0]) for (const l of lose) RES.push([aw, (aw ? 1 : -1) * (BYSETS ? 3 - l : 0)]);
      const R = RES.length, total = Math.pow(R, n);
      const own = Object.fromEntries(teams.map((a) => [a, LEFT.map((m, i) => (m.a === a || m.b === a ? i : -1)).filter((i) => i >= 0)]));
      const idx = Object.fromEntries(teams.map((a, i) => [a, i]));
      const T = teams.length, w = new Array(T), d = new Array(T), res = new Array(n), win = new Array(n), bestR = new Array(T), worstR = new Array(T);
      // head-to-head among the teams level on wins and set difference: a small table of their games against each other
      const h2h = (g) => {
        const h = {}; g.forEach((a) => { h[a] = [0, 0]; });
        const add = (a, b, sa, sb) => { if (a in h && b in h && sa !== sb) { h[sa > sb ? a : b][0]++; h[a][1] += sa - sb; h[b][1] += sb - sa; } };
        done.forEach((x) => add(x[0], x[1], x[2], x[3]));
        LEFT.forEach((m, i) => add(m.a, m.b, res[i][0] ? 3 : 0, res[i][0] ? 0 : 3));
        return h;
      };
      for (let k = 0; k < total; k++) {
        let rem = k;
        for (let i = 0; i < n; i++) { res[i] = RES[rem % R]; rem = (rem - rem % R) / R; }
        for (let t = 0; t < T; t++) { w[t] = base[teams[t]]; d[t] = diff0[teams[t]]; }
        const extra = {}, dx = {};
        for (let i = 0; i < n; i++) {
          const m = LEFT[i], aw = res[i][0], wn = aw ? m.a : m.b;
          win[i] = wn; w[idx[wn]]++; extra[wn] = (extra[wn] || 0) + 1;
          d[idx[m.a]] += res[i][1]; d[idx[m.b]] -= res[i][1];
          dx[m.a] = (dx[m.a] || 0) + res[i][1]; dx[m.b] = (dx[m.b] || 0) - res[i][1];
        }
        for (let t = 0; t < T; t++) {
          let above = 0, tied = 0;
          for (let u = 0; u < T; u++) if (u !== t) {
            if (w[u] > w[t] || (w[u] === w[t] && d[u] > d[t])) above++;
            else if (w[u] === w[t] && d[u] === d[t]) tied++;
          }
          bestR[t] = above + 1; worstR[t] = above + tied + 1;
        }
        for (let t = 0; t < T; t++) if (worstR[t] > bestR[t]) { // still level: head-to-head splits the group
          const g = teams.filter((_, u) => w[u] === w[t] && d[u] === d[t]), h = h2h(g), lo = bestR[t];
          const cmp = (x, y) => (h[y][0] - h[x][0]) || (h[y][1] - h[x][1]);
          const me = teams[t], above = g.filter((x) => cmp(x, me) < 0).length, same = g.filter((x) => cmp(x, me) === 0).length;
          bestR[t] = lo + above; worstR[t] = lo + above + same - 1;
        }
        for (let t = 0; t < T; t++) {
          const a = teams[t], o = out[a], best = bestR[t], worst = worstR[t];
          o.best = Math.min(o.best, best); o.worst = Math.max(o.worst, worst);
          const key = (extra[a] || 0) + '|' + (dx[a] || 0);
          o.own[key] = Math.max(o.own[key] || 0, worst);
          for (const i of own[a]) if (win[i] !== a) o.bestIfLose[i] = Math.min(o.bestIfLose[i] || 99, best);
        }
      }
      for (const a of teams) {
        const o = out[a], ks = Object.keys(o.own).map((x) => x.split('|').map(Number)).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
        // the weakest result of our own remaining matches (wins first, then set difference) that guarantees the spot whatever else happens
        const need = (cut) => {
          for (let j = 0; j < ks.length; j++) {
            if (ks.slice(j).every((x) => o.own[x.join('|')] <= cut)) {
              const k = ks[j][0], lowest = Math.min(...ks.filter((x) => x[0] === k).map((x) => x[1]));
              return { k, d: ks[j][1], plain: ks[j][1] === lowest };
            }
          }
          return null;
        };
        o.needPO = need(D.playoffs); o.needLCQ = need(D.lcq);
      }
      return out;
    })();
    // 단두대 매치: both teams are still fighting for the same cut, and whoever loses can no longer make it.
    // returns that cut (D.lcq first: losing = out of the season) or null
    const axeOf = (i) => {
      const m = LEFT[i], A = CASES[m.a] || {}, B = CASES[m.b] || {};
      if (!A.bestIfLose || !B.bestIfLose) return null;
      for (const cut of [D.lcq, D.playoffs]) {
        const open = (c) => c.best <= cut && c.worst > cut;
        if (open(A) && open(B) && (A.bestIfLose[i] || 99) > cut && (B.bestIfLose[i] || 99) > cut) return cut;
      }
      return null;
    };
    const axeNote = (a) => LEFT.map((m, i) => [m, axeOf(i)]).filter(([m, cut]) => cut && (m.a === a || m.b === a))
      .map(([m, cut]) => NAME(m.a === a ? m.b : m.a) + '전, 지면 ' + (cut === D.lcq ? '바로 탈락' : '플레이오프 직행 실패')).join(' · ');
    const racing = (k) => k.kind === 'maybe' || k.kind === 'lmaybe';
    // what our own remaining matches must give, e.g. "2승 하면", "져도 1세트만 따면", "1승 하고 세트 득실 +2 이상이면"
    const needText = (th, left, goal) => {
      if (left === 1 && th.k === 0) { const s = th.d + 3; return '남은 1경기는 져도 ' + (s <= 1 ? '1세트만 따면 ' : s + '세트 이상 따면 ') + goal + ' 확정'; }
      if (th.plain || !BYSETS) return '남은 ' + left + '경기 중 ' + th.k + '승 하면 ' + goal + ' 확정';
      return '남은 ' + left + '경기 중 ' + th.k + '승, 세트 득실 합계 ' + (th.d > 0 ? '+' : '') + th.d + ' 이상이면 ' + goal + ' 확정';
    };
    const caseKind = (c, left) => {
      if (c.unknown) return { tag: '계산 불가', kind: 'unknown', note: '남은 경기가 많아 경우의 수 계산 안 함' };
      if (c.worst && c.worst <= D.playoffs) return { tag: '플레이오프 확정', kind: 'sure', note: '남은 경기 결과와 관계없이 1–' + D.playoffs + '위 확정' };
      if (c.best > D.lcq) return { tag: '탈락', kind: 'out', note: '남은 경기를 모두 이겨도 ' + D.lcq + '위 안 진입 불가' };
      if (c.best <= D.playoffs) {
        const lcq = c.worst <= D.lcq ? ' / 최소 LCQ 확정' : '';   // joins the note before it: '… 결정 / 최소 LCQ 확정' (10-24)
        const need = c.needPO ? needText(c.needPO, left, '플레이오프') : '다른 팀 결과와 세트 득실에 따라 결정';
        return { tag: '플레이오프 경쟁', kind: 'maybe', note: need + lcq };
      }
      if (c.worst <= D.lcq) return { tag: 'LCQ 확정', kind: 'lsure', note: '플레이오프 직행은 어렵지만 LCQ 확정' };
      return { tag: 'LCQ 경쟁', kind: 'lmaybe', note: c.needLCQ ? needText(c.needLCQ, left, D.lcq + '위 안') : '다른 팀 결과에 따라 ' + D.lcq + '위 안 진입 가능' };
    };
    const caseOf = (a) => {
      const k = caseKind(CASES[a] || {}, LEFT.filter((m) => m.a === a || m.b === a).length);
      return { ...k, axe: racing(k) ? axeNote(a) : '' };
    };
    return { left: LEFT, caseOf, axeOf, racing, bySets: BYSETS };
  };
})();
