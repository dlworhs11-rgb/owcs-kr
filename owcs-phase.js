// Tournament mode: from the day after the regular season (owcs-data.js stageRange[1]) until the
// stage ends (stageEnd), the site leads with the playoffs.
//   - html[data-owcs-po] is set on every page
//   - the menu item 순위 reads 대진표 (it still opens ?view=standings, which now starts with the bracket)
//   - home: the standings section (bracket first, final standings folded under a button) moves up
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
  if (!po) return;
  var html = document.documentElement;
  html.setAttribute('data-owcs-po', '');

  var P = 'html[data-owcs-po] ', S = P + '#dc-root [data-screen-label]';
  var st = document.createElement('style');
  st.textContent =
    S + '{display:flex !important;flex-direction:column}' +
    S + ' > [data-sec=sched],' + S + ' > [data-sec=sched] ~ *{order:2}' +
    S + ' > [data-sec=stand]{order:1}' +
    P + '[data-sec=stand]{display:flex;flex-direction:column}' +
    P + '[data-sec=stand] > #tournament{order:-2;margin-top:0 !important}' +
    P + '[data-sec=stand] > [data-stand-tg]{order:-1}' +
    'html[data-owcs-po]:not([data-owcs-stand-open]) [data-sec=stand] > :not(#tournament):not([data-stand-tg]){display:none !important}' +
    'html[data-owcs-stand-open] [data-sec=stand] > [data-stand-tg]{margin-bottom:28px !important}' +
    '[data-stand-tg] [data-c],html[data-owcs-stand-open] [data-stand-tg] [data-o]{display:none}' +
    'html[data-owcs-stand-open] [data-stand-tg] [data-c]{display:inline}' +
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
