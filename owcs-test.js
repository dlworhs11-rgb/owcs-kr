// Test mode: open any page with ?test=1 to see made-up results for the next match days.
// Only changes window.OWCS in this browser tab; owcs-data.js and the real data stay untouched.
(function () {
  // made-up results only on this PC (file:// or localhost), never on the public site
  if (/^https:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if (new URLSearchParams(location.search).get('test') !== '1' || !window.OWCS) return;
  var D = window.OWCS;
  var MAPS = [['Busan', '쟁탈'], ['Lijiang Tower', '쟁탈'], ['Suravasa', '플래시포인트'], ['New Junk City', '플래시포인트'], ['Colosseo', '밀기'],
    ['Esperança', '밀기'], ["King's Row", '혼합'], ['Midtown', '혼합'], ['Circuit Royal', '호위'], ['Shambali Monastery', '호위']];
  var HEROES = ['widowmaker', 'tracer', 'sojourn', 'genji', 'ana', 'kiriko', 'lucio', 'sigma', 'winston', 'dva'];
  var SCORES = [[3, 1], [0, 3], [3, 2], [1, 3], [3, 0], [2, 3], [3, 1], [3, 2], [0, 3]];
  // made-up first heroes: one tank, two damage, two support from each roster
  var POOL = { '탱': ['winston', 'dva', 'sigma', 'reinhardt', 'ramattra'], '딜': ['tracer', 'sojourn', 'genji', 'widowmaker', 'cassidy', 'ashe'], '힐': ['ana', 'kiriko', 'lucio', 'juno', 'brigitte'] };
  function lineup(team, seed) {
    var ps = D.players.filter(function (p) { return p.team === team; });
    var pick = function (role, k) { return ps.filter(function (p) { return p.role === role; })[k]; };
    return [['탱', 0], ['딜', 0], ['딜', 1], ['힐', 0], ['힐', 1]].map(function (r, j) {
      var p = pick(r[0], r[1]) || ps[j] || { id: '?' }, pool = POOL[r[0]];
      return [p.id, pool[(seed + j * 2) % pool.length]];
    });
  }
  var upcoming = D.matches.filter(function (m) { return !m.played; });
  var firstDay = upcoming.length ? upcoming[0].day : null;
  // the first upcoming match day gets results (the last match of it stays LIVE at 1:1)
  upcoming.filter(function (m) { return m.day === firstDay; }).forEach(function (m, i, list) {
    var live = i === list.length - 1;
    var s = live ? [1, 1] : SCORES[i % SCORES.length];
    // map winners in play order; the series winner takes the last map
    var order = [], ra = s[0], rb = s[1], W = s[0] > s[1] ? 'a' : 'b';
    while (ra + rb > 0) {
      var pick = (live || ra + rb > 1) ? ((ra + rb) % 2 ? (ra >= rb ? 'a' : 'b') : (ra >= rb ? 'b' : 'a')) : W;
      if (pick === 'a' && !ra) pick = 'b'; if (pick === 'b' && !rb) pick = 'a';
      if (!live && ra + rb === 1) pick = W;
      order.push(pick); if (pick === 'a') ra--; else rb--;
    }
    m.maps = order.map(function (w, n) {
      var mp = MAPS[(i * 3 + n) % MAPS.length];
      var sc = mp[1] === '쟁탈' ? (w === 'a' ? [2, 1] : [1, 2]) : (w === 'a' ? [3, 2] : [2, 3]);
      return { no: n + 1, map: mp[0], mode: mp[1], winner: w, banFirst: n % 2 ? 'b' : 'a', src: 'test', sa: sc[0], sb: sc[1],
        comps: { a: lineup(m.a, i + n), b: lineup(m.b, i + n + 3) },
        bans: [{ t: 'a', h: HEROES[(i + n) % 10], code: HEROES[(i + n) % 10].slice(0, 3).toUpperCase() }, { t: 'b', h: HEROES[(i + n + 5) % 10], code: HEROES[(i + n + 5) % 10].slice(0, 3).toUpperCase() }] };
    });
    if (live) m.maps.push({ no: 3, map: MAPS[(i * 3 + 2) % MAPS.length][0], mode: MAPS[(i * 3 + 2) % MAPS.length][1], winner: null, banFirst: 'a', bans: [], src: 'test' });
    m.sa = s[0]; m.sb = s[1]; m.played = !live; m.live = live;
    m.potm = live ? null : (D.players.filter(function (p) { return p.team === (s[0] > s[1] ? m.a : m.b); })[0] || {}).id || null;
    m.vod = live ? null : 'https://www.sooplive.com/station/owesports/vod/review';
    if (!live) D.history.unshift({ date: m.day, stage: '스테이지 3', week: m.week, a: m.a, b: m.b, sa: m.sa, sb: m.sb });
  });
  // standings from every finished match
  var tab = {};
  D.standings.forEach(function (s) { tab[s.a] = { a: s.a, w: 0, l: 0, mw: 0, ml: 0, diff: 0 }; });
  D.matches.forEach(function (m) {
    if (!m.played || m.live || !tab[m.a] || !tab[m.b]) return;
    var A = tab[m.a], B = tab[m.b];
    A.mw += m.sa; A.ml += m.sb; B.mw += m.sb; B.ml += m.sa;
    if (m.sa > m.sb) { A.w++; B.l++; } else { B.w++; A.l++; }
  });
  D.standings = Object.keys(tab).map(function (k) { var t = tab[k]; t.diff = t.mw - t.ml; return t; })
    .sort(function (x, y) { return y.w - x.w || y.diff - x.diff; });
  D.sources = (D.sources || '') + ' · 테스트 모드: ' + (firstDay || '') + ' 결과는 임의로 넣은 값';
  // pretend "now" is that match day, so the page shows it as today
  if (firstDay && !new URLSearchParams(location.search).get('date')) window.__owcsNow = new Date(firstDay + 'T21:30:00+09:00').getTime();

  // keep ?test=1 when moving between the site's pages, and show a badge
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!/\.(dc\.)?html/.test(href) || /test=1/.test(href) || /^https?:/.test(href)) return;
    var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    var base = hash ? href.slice(0, href.indexOf('#')) : href;
    a.setAttribute('href', base + (base.indexOf('?') >= 0 ? '&' : '?') + 'test=1' + hash);
  }, true);
  function badge() {
    var b = document.createElement('div');
    b.textContent = 'TEST · 임의 결과';
    b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;padding:8px 14px;border-radius:999px;background:#D92D20;color:#fff;font:700 13px Pretendard,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    document.body.appendChild(b);
  }
  if (document.body) badge(); else document.addEventListener('DOMContentLoaded', badge);
})();
