// Tournament mode: from the day after the regular season (owcs-data.js stageRange[1]) until the
// stage ends (stageEnd), the site leads with the playoffs.
//   - html[data-owcs-po] is set on every page
//   - the menu item 순위 reads 대진표 (it still opens ?view=standings, which now starts with the bracket)
//   - home: the standings section (bracket only; the final standings are not shown) moves up
//     right under TODAY, above the schedule; the final standings follow it, smaller
// ?phase=po previews it; ?date=YYYY-MM-DD picks the day like the home page does.
//
// International mode (owcs-data.js intl[], owcs-intl.js): from 3 days after the Korea stage final (stageEnd) until an
// international event ends (2026: 11-11 ~ 12-06 World Finals). An event with no Korea stage ending before it starts
// takes the 3 weeks before its start. Sets html[data-owcs-intl], puts <owcs-intl> at the top of the home page in place
// of TODAY (the Korea schedule, bracket and standings stay below), the menu item 순위 reads the event name and opens it.
// ?phase=intl&event=2026msc previews an event; ?date= works as above.
(function () {
  var D = window.OWCS;
  if (!D || !D.stageRange || !D.stageRange[1]) return;
  var q = new URLSearchParams(location.search);
  var now = q.get('date') ? new Date(q.get('date') + 'T' + (q.get('time') || '12:00') + ':00+09:00').getTime() : Date.now();
  var dayMs = function (s) { return new Date(s + 'T00:00:00+09:00').getTime(); };
  var ev = (D.intl || []).filter(function (e) {
    if (q.get('phase') === 'intl') return e.key === q.get('event') || !q.get('event');
    if (!e.start || !e.end) return false;
    var s = dayMs(e.start), from = D.stageEnd && dayMs(D.stageEnd) < s ? dayMs(D.stageEnd) + 3 * 86400e3 : s - 21 * 86400e3;
    return now >= from && now < dayMs(e.end) + 86400e3;
  }).pop();
  if (ev) { intl(ev); return; }
  var rsEnd = new Date(D.stageRange[1] + 'T23:59:59+09:00').getTime();
  var stEnd = new Date((D.stageEnd || D.stageRange[1]) + 'T23:59:59+09:00').getTime();
  var html = document.documentElement;
  var day = function (s) { return new Date(s + 'T00:00:00+09:00').getTime(); };
  var done = function (m) { return m.played && !m.live; };
  // every phase moves on the moment its last match is over, not at midnight (user, 10-23: people want the next
  // matchup right away). The home page's live scores (relay) end matches in this same window.OWCS, so this re-checks.
  var rsLast = (D.matches || []).filter(function (m) { return m.phase === 'rs'; }).map(function (m) { return m.day; }).sort().pop();
  var rsDone = function () {
    var rs = (D.matches || []).filter(function (m) { return m.phase === 'rs'; });
    return rs.length > 0 && rs.every(done) && now >= day(rsLast);
  };
  var inPo = function () { return q.get('phase') === 'po' || ((now > rsEnd || rsDone()) && now <= stEnd); };
  homePart();

  // Home shows only the part of the postseason that comes next (user rule, 10-23: no playoff bracket while the LCQ
  // is still to play): the seeding deciders + LCQ until their last match is over, then the playoffs. Before this
  // stage starts (the finished stage's bracket) and after it ends, the whole bracket as before.
  function homePart() {
    var road = (D.matches || []).filter(function (m) { return m.phase === 'seed' || m.phase === 'lcq'; });
    if (!road.length || now < day(D.stageRange[0]) || now > stEnd) return;
    function set() {
      var part = road.every(done) ? 'po' : 'road';
      Array.prototype.forEach.call(document.querySelectorAll('#tournament'), function (t) {
        var b = t.querySelector('owcs-bracket'), k = t.firstElementChild, h = t.querySelector('h3');
        if (b && b.getAttribute('part') !== part) b.setAttribute('part', part);
        // only the original words both ways: a translated label (owcs-i18n) is left alone
        var w = part === 'road' ? ['토너먼트', '플레이오프 가는 길', 'PLAYOFFS', 'SEEDING · LCQ'] : ['플레이오프 가는 길', '토너먼트', 'SEEDING · LCQ', 'PLAYOFFS'];
        if (k && k.textContent === w[0]) k.textContent = w[1];
        if (h && h.textContent === w[2]) h.textContent = w[3];
      });
    }
    var busy = false;
    function go() { set(); new MutationObserver(function () { if (busy) return; busy = true; setTimeout(function () { busy = false; set(); }, 30); }).observe(document.body, { childList: true, subtree: true }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  if (!inPo()) {
    // home during the regular season: the bracket shows from a week before the seeding deciders / LCQ start; the
    // finished stage's bracket stays until the next regular season starts (the data may switch stage weeks earlier)
    var post = (D.matches || []).filter(function (m) { return m.phase && m.phase !== 'rs'; }).map(function (m) { return m.day; }).sort()[0];
    var from = (post ? day(post) : rsEnd + 1) - 7 * 86400e3;
    var past = (D.pastStages && D.pastStages.length) || (D.lastStage && D.lastStage.columns && D.lastStage.columns.length);
    var show = now >= from || (now < day(D.stageRange[0]) && past);
    var hide = document.createElement('style');
    hide.textContent = show ? '' : '#tournament{display:none !important}';
    (document.head || html).appendChild(hide);
    // the last regular-season day: switch to tournament mode as soon as its last match ends on the page
    if (rsLast && now >= day(rsLast) && now <= rsEnd) {
      var wait = new MutationObserver(function () { if (inPo()) { wait.disconnect(); hide.textContent = ''; tournament(); } });
      var watch = function () { wait.observe(document.body, { childList: true, subtree: true, characterData: true }); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
    }
    return;
  }
  tournament();

  function tournament() {
  html.setAttribute('data-owcs-po', '');

  var P = 'html[data-owcs-po] ', S = P + '#dc-root [data-screen-label]';
  var st = document.createElement('style');
  st.textContent =
    S + '{display:flex !important;flex-direction:column}' +
    S + ' > [data-sec=sched],' + S + ' > [data-sec=sched] ~ *{order:2}' +
    S + ' > [data-sec=stand]{order:1}' +
    P + '[data-sec=stand]{display:flex;flex-direction:column}' +
    P + '[data-sec=stand] > #tournament{order:-2;margin-top:0 !important}' +
    // final regular-season standings stay, smaller, under the bracket: the seeds come from them
    P + '[data-sec=stand] > :not(#tournament){margin-top:56px}' +
    P + '[data-sec=stand] > :not(#tournament) h2{font-size:calc(var(--ts,1) * 48px) !important}' +
    P + '#tournament h3{font-size:calc(var(--ts,1) * 96px) !important;margin:14px 0 24px !important}' +
    P + '#tournament > div:first-child{font-size:15px !important}' +
    '@media (max-width:899px){' + P + '#tournament h3{font-size:calc(var(--ts,1) * 60px) !important;margin:10px 0 20px !important}}';
  (document.head || html).appendChild(st);

  // menu label: 순위 → 대진표 (every page, every language)
  var MAP = { '순위': '대진표', '順位': 'トーナメント', 'Standings': 'Bracket', '排名': '对阵图' };   // zh too: the dc pages kept 排名 (10-24)
  function relabel() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="view=standings"], a[href="standings"]'), function (a) {
      var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) { var k = n.nodeValue.trim(); if (MAP[k]) n.nodeValue = n.nodeValue.replace(k, MAP[k]); }
    });
  }
  var busy = false;
  function soon() { if (busy) return; busy = true; setTimeout(function () { busy = false; relabel(); }, 30); }
  function start() { relabel(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }

  function intl(e) {
    var html = document.documentElement, name = e.ko.replace(/^\d{4}\s*/, '');
    html.setAttribute('data-owcs-intl', e.key);
    if (window.customElements && !customElements.get('owcs-intl') && !document.querySelector('script[src*="owcs-intl.js"]')) {
      var sc = document.createElement('script'); sc.src = 'owcs-intl.js?v=' + encodeURIComponent(D.generated || ''); (document.head || html).appendChild(sc);   // only pages in this mode load it
    }
    var css = document.createElement('style');
    css.textContent = 'html[data-owcs-intl] #dc-root [data-today]{display:none !important}' +
      '[data-owcs-intlsec]{padding:40px 56px 56px;background:var(--paper,#fff)}' +
      '@media (max-width:899px){[data-owcs-intlsec]{padding:20px 16px 32px}}';
    (document.head || html).appendChild(css);
    // home page: one <owcs-intl> per screen (desktop, tablet, phone), right where TODAY was. The design runtime
    // re-renders, so this re-checks whenever the page changes.
    function place() {
      Array.prototype.forEach.call(document.querySelectorAll('#dc-root [data-screen-label] > section[data-today]'), function (t) {
        var p = t.previousElementSibling;
        if (p && p.hasAttribute('data-owcs-intlsec')) return;
        var s = document.createElement('section');
        s.setAttribute('data-owcs-intlsec', '');
        s.id = 'intl';
        s.innerHTML = '<owcs-intl event="' + e.key + '"></owcs-intl>';
        t.parentNode.insertBefore(s, t);
      });
      // menu item 순위 → the event (월드 파이널 …), every page, every language
      Array.prototype.forEach.call(document.querySelectorAll('a[href*="view=standings"], a[href="standings"]'), function (a) {
        var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) { var k = n.nodeValue.trim(); if (/^(순위|順位|Standings|排名|대진표|トーナメント|Bracket)$/.test(k)) n.nodeValue = n.nodeValue.replace(k, name); }
      });
    }
    function show() {
      var s = Array.prototype.find.call(document.querySelectorAll('[data-owcs-intlsec]'), function (x) { return x.offsetWidth > 0; });
      if (s) s.scrollIntoView({ block: 'start' });
    }
    // the menu item opens the event: on the home page scroll to it, from other pages land on the home page and scroll
    document.addEventListener('click', function (ev2) {
      var a = ev2.target.closest && ev2.target.closest('a[href*="view=standings"], a[href="standings"]');
      if (!a || !document.querySelector('[data-owcs-intlsec]')) return;
      ev2.preventDefault(); show();
    }, true);
    var busy = false;
    function start2() {
      place();
      new MutationObserver(function () { if (busy) return; busy = true; setTimeout(function () { busy = false; place(); }, 50); })
        .observe(document.body, { childList: true, subtree: true, characterData: true });
      if (q.get('view') === 'standings') setTimeout(show, 400);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start2); else start2();
  }
})();
