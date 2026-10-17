// Tournament mode: from the day after the regular season (owcs-data.js stageRange[1]) until the
// stage ends (stageEnd), the site leads with the playoffs.
//   - html[data-owcs-po] is set on every page
//   - the menu item 순위 reads 대진표 (it still opens ?view=standings, which now starts with the bracket)
//   - home: the standings section (bracket only; the final standings are not shown) moves up
//     right under TODAY, above the schedule
// ?phase=po previews it; ?date=YYYY-MM-DD picks the day like the home page does.
(function () {
  var D = window.OWCS;
  if (!D || !D.stageRange || !D.stageRange[1]) return;
  var q = new URLSearchParams(location.search);
  var now = q.get('date') ? new Date(q.get('date') + 'T' + (q.get('time') || '12:00') + ':00+09:00').getTime() : Date.now();
  var rsEnd = new Date(D.stageRange[1] + 'T23:59:59+09:00').getTime();
  var stEnd = new Date((D.stageEnd || D.stageRange[1]) + 'T23:59:59+09:00').getTime();
  var po = q.get('phase') === 'po' || (now > rsEnd && now <= stEnd);
  var html = document.documentElement;
  if (!po) {
    // home during the regular season: the bracket shows from a week before the seeding deciders / LCQ start; the
    // finished stage's bracket stays until the next regular season starts (the data may switch stage weeks earlier)
    var day = function (s) { return new Date(s + 'T00:00:00+09:00').getTime(); };
    var post = (D.matches || []).filter(function (m) { return m.phase && m.phase !== 'rs'; }).map(function (m) { return m.day; }).sort()[0];
    var from = (post ? day(post) : rsEnd + 1) - 7 * 86400e3;
    var past = (D.pastStages && D.pastStages.length) || (D.lastStage && D.lastStage.columns && D.lastStage.columns.length);
    var show = now >= from || (now < day(D.stageRange[0]) && past);
    var hide = document.createElement('style');
    hide.textContent = show ? '' : '#tournament{display:none !important}';
    (document.head || html).appendChild(hide);
    return;
  }
  html.setAttribute('data-owcs-po', '');

  var P = 'html[data-owcs-po] ', S = P + '#dc-root [data-screen-label]';
  var st = document.createElement('style');
  st.textContent =
    S + '{display:flex !important;flex-direction:column}' +
    S + ' > [data-sec=sched],' + S + ' > [data-sec=sched] ~ *{order:2}' +
    S + ' > [data-sec=stand]{order:1}' +
    P + '[data-sec=stand]{display:flex;flex-direction:column}' +
    P + '[data-sec=stand] > #tournament{order:-2;margin-top:0 !important}' +
    P + '[data-sec=stand] > :not(#tournament){display:none !important}' +   // final regular-season standings: not shown during the playoffs
    P + '#tournament h3{font-size:calc(var(--ts,1) * 96px) !important;margin:14px 0 24px !important}' +
    P + '#tournament > div:first-child{font-size:15px !important}' +
    '@media (max-width:899px){' + P + '#tournament h3{font-size:calc(var(--ts,1) * 60px) !important;margin:10px 0 20px !important}}';
  (document.head || html).appendChild(st);

  // menu label: 순위 → 대진표 (every page, every language)
  var MAP = { '순위': '대진표', '順位': 'トーナメント', 'Standings': 'Bracket' };
  function relabel() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="view=standings"]'), function (a) {
      var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) { var k = n.nodeValue.trim(); if (MAP[k]) n.nodeValue = n.nodeValue.replace(k, MAP[k]); }
    });
  }
  var busy = false;
  function soon() { if (busy) return; busy = true; setTimeout(function () { busy = false; relabel(); }, 30); }
  function start() { relabel(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
