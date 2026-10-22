// 경우의 수 (what each team still needs), shown under the home page's standings during the last weeks of the regular season.
// Moved here from the results page (10-23: the user wanted it next to the standings, not in 결과).
// OWCSCases(D, now, NAME) -> { left, caseOf(a), axeOf(i), racing(k) }
(function () {
  window.OWCSCases = function (D, NOW, NAME) {
    // regular season only (the playoff slots are not part of the table)
    const LEFT = D.matches.filter((m) => (!m.phase || m.phase === 'rs') && (!m.played || m.live || new Date(m.date).getTime() > NOW));
    // every win/loss combination of the remaining matches (2^n), ranked by match wins.
    // best = rank if every tie breaks our way, worst = rank if every tie breaks against us.
    const CASES = (() => {
      const base = Object.fromEntries(D.standings.map((s) => [s.a, s.w]));
      const teams = Object.keys(base), n = LEFT.length, out = {};
      teams.forEach((a) => { out[a] = { best: 99, worst: 0, needPO: null, needLCQ: null, byWins: {}, bestIfLose: {} }; });
      if (n > 22) return out; // too many to enumerate; leave unknown
      const own = Object.fromEntries(teams.map((a) => [a, LEFT.map((m, i) => (m.a === a || m.b === a ? i : -1)).filter((i) => i >= 0)]));
      for (let mask = 0; mask < (1 << n); mask++) {
        const w = { ...base }, extra = {}, won = [];
        for (let i = 0; i < n; i++) { const win = (mask >> i) & 1 ? LEFT[i].a : LEFT[i].b; won[i] = win; w[win]++; extra[win] = (extra[win] || 0) + 1; }
        for (const a of teams) {
          let above = 0, tied = 0;
          for (const b of teams) if (b !== a) { if (w[b] > w[a]) above++; else if (w[b] === w[a]) tied++; }
          const o = out[a], best = above + 1, worst = above + tied + 1, k = extra[a] || 0;
          o.best = Math.min(o.best, best); o.worst = Math.max(o.worst, worst);
          o.byWins[k] = Math.max(o.byWins[k] || 0, worst);
          for (const i of own[a]) if (won[i] !== a) o.bestIfLose[i] = Math.min(o.bestIfLose[i] || 99, best);
        }
      }
      for (const a of teams) {
        const o = out[a], ks = Object.keys(o.byWins).map(Number).sort((x, y) => x - y);
        // smallest number of remaining wins that guarantees the spot whatever else happens
        const need = (cut) => { for (const k of ks) if (ks.filter((j) => j >= k).every((j) => o.byWins[j] <= cut)) return k; return null; };
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
    const caseKind = (c, left) => {
      if (c.worst && c.worst <= D.playoffs) return { tag: '플레이오프 확정', kind: 'sure', note: '남은 경기 결과와 관계없이 1–' + D.playoffs + '위 안이에요.' };
      if (c.best > D.lcq) return { tag: '탈락', kind: 'out', note: '남은 경기를 모두 이겨도 ' + D.lcq + '위 안에 들 수 없어요.' };
      if (c.best <= D.playoffs) {
        const lcq = c.worst <= D.lcq ? ' 최소 라스트 찬스 예선은 확정이에요.' : '';
        const need = c.needPO != null ? '남은 ' + left + '경기 중 ' + c.needPO + '승 하면 플레이오프 확정.' : '다른 팀 결과와 세트 득실에 따라 플레이오프가 갈려요.';
        return { tag: '플레이오프 경쟁', kind: 'maybe', note: need + lcq };
      }
      if (c.worst <= D.lcq) return { tag: 'LCQ 확정', kind: 'lsure', note: '플레이오프 직행은 어렵지만 라스트 찬스 예선은 확정이에요.' };
      return { tag: 'LCQ 경쟁', kind: 'lmaybe', note: c.needLCQ != null ? '남은 ' + left + '경기 중 ' + c.needLCQ + '승 하면 ' + D.lcq + '위 안 확정.' : '다른 팀 결과에 따라 ' + D.lcq + '위 안에 들 수 있어요.' };
    };
    const caseOf = (a) => {
      const k = caseKind(CASES[a] || {}, LEFT.filter((m) => m.a === a || m.b === a).length);
      return { ...k, axe: racing(k) ? axeNote(a) : '' };
    };
    return { left: LEFT, caseOf, axeOf, racing };
  };
})();
