// The top of every page laid out like the home page (the reference, measured from it): a 45px tool bar
// (다크 모드 · language) above a 76px header, the logo (30px mark + 28px wordmark) on the content column's left
// edge, and the menu (일정 · 결과 · 순위 · 직관 · 선수 · 방송) with the home page's link size, at the spot the home
// page's own layout puts it: 110.5px left of the page centre (half of its 136px logo block minus its 357px right block).
// The home page itself is left as it is.
(function () {
  if (/Home/.test(decodeURIComponent(location.pathname).split('/').pop())) return;
  var css = [
    '@media (min-width:900px){',
    '  #dc-root header{position:relative}',
    '  header nav{position:absolute !important;left:calc(50% - 110.5px) !important;top:50% !important;transform:translate(-50%,-50%) !important;display:flex !important;gap:6px !important;margin:0 !important;overflow:visible !important}',
    '  header nav a{height:44px !important;padding:0 16px !important;font-size:16px !important;font-weight:600 !important;white-space:nowrap;box-sizing:border-box}',
    // tickets / streams pages: their own header markup, sized like the design pages
    '  header .wrap{max-width:none !important;height:75px !important;padding:0 max(56px, calc(50% - 680px)) !important;box-sizing:border-box}',
    '  header .brand{gap:10px !important}',
    '  header .brand i{width:30px !important;height:30px !important;border-radius:7px !important}',
    '  header .brand i:after{width:10px !important;height:10px !important}',
    // tickets / streams header: on the page paper like the home page's (not a white sticky band), ink links, no active pill
    '  body.streams-page header,body.ticket-page header{position:relative !important;background:transparent !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important;border-bottom:1px solid #E6E6E1 !important}',
    '  html[data-owcs-dark] body.streams-page header,html[data-owcs-dark] body.ticket-page header{border-bottom-color:#2E2E37 !important}',
    '  body.streams-page header nav a,body.ticket-page header nav a{color:var(--ink,#0B0B0F) !important;background:transparent}',
    '  body.streams-page header nav a.on,body.ticket-page header nav a.on,html[data-owcs-dark] body.streams-page header nav a.on,html[data-owcs-dark] body.ticket-page header nav a.on{background:transparent !important}',
    '  body.streams-page header nav a:hover,body.ticket-page header nav a:hover{background:#F1F1ED !important}',
    '  html[data-owcs-dark] body.streams-page header nav a:hover,html[data-owcs-dark] body.ticket-page header nav a:hover{background:#24242C !important}',
    '  header .brand span{font-size:28px !important;line-height:normal !important;letter-spacing:.56px !important}',
    // the tool bar above the header, like the home page's
    // the bar's 45px is reserved on the header from the first paint, and the bar sits in it (absolute), so nothing
    // moves when the bar is added a moment later (the design pages render their header after the script runs)
    '  #dc-root [data-screen-label]{position:relative}',
    '  #dc-root header,body.streams-page > header,body.ticket-page > header{margin-top:45px !important}',
    '  [data-owcs-bar]{position:absolute !important;top:0;left:0;right:0;display:flex;justify-content:flex-end;align-items:center;gap:8px;height:45px;padding:0 max(56px, calc(50% - 680px));box-sizing:border-box;border-bottom:1px solid #E6E6E1;font:600 13px Pretendard,system-ui,sans-serif;color:#0B0B0F;z-index:11}',
    '  html[data-owcs-dark] [data-owcs-bar]{border-bottom-color:#2E2E37;color:#F2F2F5}',
    '  [data-owcs-bar] [data-owcs-darkbtn]{position:static !important;height:32px !important;padding:0 10px !important;border:0 !important;border-radius:999px !important;background:transparent !important;color:inherit !important;box-shadow:none !important;font:inherit !important}',
    '  [data-owcs-bar] [data-owcs-lang]{position:static !important;padding:2px !important;border:0 !important;box-shadow:none !important;background:#E6E6E1 !important;font:700 12px Pretendard,system-ui,sans-serif !important}',
    '  html[data-owcs-dark] [data-owcs-bar] [data-owcs-lang]{background:#24242C !important}',
    '  html[data-owcs-dark] [data-owcs-bar] [data-owcs-lang] button[style*="background: transparent"]{color:#F2F2F5 !important}',
    '}',
    '@media (max-width:899.98px){[data-owcs-bar]{display:none}}',
    // --- 직관 안내 banner under the menu, as on the home page (desktop: 80 px QR + 예매하기, phone / tablet: 56 px QR) ---
    '[data-owcs-tk]{padding:20px max(56px, calc(50% - 680px));background:transparent}',
    '[data-owcs-tk] a{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:20px;padding:12px 18px 12px 12px;border-radius:18px;background:#0B0B0F;color:#fff;text-decoration:none;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif}',
    '[data-owcs-tk] img{display:block;width:80px;height:80px;border-radius:10px;background:#fff;padding:4px;box-sizing:border-box}',
    '[data-owcs-tk] .k{display:block;font-size:13px;font-weight:700;color:#C6FF33}',
    '[data-owcs-tk] .v{display:block;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:30px;line-height:1;margin-top:6px}',
    '[data-owcs-tk] .s{display:none;font-size:12px;color:#B5B5BD;margin-top:4px}',
    '[data-owcs-tk] .b{display:inline-flex;align-items:center;height:40px;padding:0 16px;border-radius:999px;background:#C6FF33;color:#0B0B0F;font-weight:800;font-size:14px}',
    'html[data-owcs-dark] [data-owcs-tk] a{box-shadow:inset 0 0 0 1px #2E2E37}',
    '@media (max-width:899.98px){',
    '  [data-owcs-tk]{padding:12px 20px}',
    '  [data-owcs-tk] a{grid-template-columns:auto minmax(0,1fr);gap:12px;padding:8px 10px;border-radius:14px}',
    '  [data-owcs-tk] img{width:56px;height:56px;border-radius:8px;padding:3px}',
    '  [data-owcs-tk] .k{font-size:12px}',
    '  [data-owcs-tk] .v{font-size:18px;line-height:1.05;margin-top:3px}',
    '  [data-owcs-tk] .s{display:block}',
    '  [data-owcs-tk] .b,[data-owcs-tk] .kd{display:none}',
    '  [data-owcs-tk]:not(.m){display:none}',
    '}',
    '@media (min-width:900px){[data-owcs-tk].m{display:none}}',
    // --- phone / tablet top, a copy of the home page's (tool bar, logo + search + menu button, menu chips) ---
    '[data-owcs-mtop]{display:none}',
    '@media (max-width:899.98px){',
    '  [data-owcs-mtop]{display:block;color:#0B0B0F;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;text-align:left}',
    '  [data-owcs-mtop] *{box-sizing:content-box}',
    // 스포일러 방지 · 다크 모드 · language live in the menu the menu button opens (as on the home page)
    '  [data-owcs-mtop] .tb{display:none;justify-content:flex-start;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:12px 20px;border-bottom:1px solid #E6E6E1;font-size:13px}',
    '  [data-owcs-mtop].open .tb{display:flex}',
    '  [data-owcs-mtop] .sw{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:none;border-radius:999px;background:transparent;font:inherit;font-size:13px;font-weight:600;color:inherit !important;cursor:pointer}',
    '  [data-owcs-mtop] .sw.ph{display:none}',
    '  [data-owcs-mtop] .tr{position:relative;width:30px;height:18px;border-radius:999px;background:#B9B9B3}',
    '  [data-owcs-mtop] .on .tr{background:#7D39EB}',
    '  [data-owcs-mtop] .kn{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff}',
    '  [data-owcs-mtop] .on .kn{left:14px}',
    '  [data-owcs-mtop] .lg{display:flex;padding:2px;border-radius:999px;background:#E6E6E1}',
    '  [data-owcs-mtop] .lg button{height:28px;padding:0 10px;border:none;border-radius:999px;background:transparent;color:#0B0B0F !important;font:inherit;font-size:12px;font-weight:700;cursor:pointer}',
    '  [data-owcs-mtop] .lg button.on{background:#0B0B0F;color:#fff !important}',
    '  [data-owcs-mtop] .hd{position:relative;border-bottom:1px solid #E6E6E1}',
    '  [data-owcs-mtop] .row{display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 12px 0 20px}',
    '  [data-owcs-mtop] .brand{display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none}',
    '  [data-owcs-mtop] .mk{width:24px;height:24px;background:#0B0B0F;border-radius:6px;display:grid;place-items:center}',
    '  [data-owcs-mtop] .mk i{width:8px;height:8px;background:#C6FF33;border-radius:2px}',
    '  [data-owcs-mtop] .wm{font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:24px;line-height:normal}',
    '  [data-owcs-mtop] .ic{display:flex;align-items:center;gap:4px}',
    '  [data-owcs-mtop] .se{display:inline-flex;align-items:center;gap:6px;height:42px;padding:0 16px 0 14px;border-radius:999px;border:1px solid #E6E6E1;background:#F6F6F3;font-size:15px;font-weight:700;color:inherit !important;text-decoration:none}',
    '  [data-owcs-mtop] .se span{font-size:20px;line-height:1}',
    '  [data-owcs-mtop] .hm{width:44px;height:44px;border:none;background:transparent;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;padding:0;cursor:pointer;color:inherit}',
    '  [data-owcs-mtop] .hm span{width:20px;height:2px;background:currentColor}',
    '  [data-owcs-mtop] nav{display:flex !important;gap:4px;padding:0 12px 10px;overflow-x:auto;position:static !important;transform:none !important}',
    '  [data-owcs-mtop] nav a{flex:none;display:flex;align-items:center;height:44px;padding:0 14px;border-radius:999px;background:#F3F3EF;font-size:15px;font-weight:600;color:#0B0B0F !important;text-decoration:none}',
    '  [data-owcs-mtop],[data-owcs-tk].m{background:#F1EDE5 repeating-linear-gradient(135deg,rgba(60,45,25,.043) 0 1px,transparent 1px 11px)}',
    '  html[data-owcs-dark] [data-owcs-mtop],html[data-owcs-dark] [data-owcs-tk].m{background:#13110E repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 1px,transparent 1px 11px)}',
    '  html[data-owcs-dark] [data-owcs-mtop]{color:#F2F2F5}',
    '  html[data-owcs-dark] [data-owcs-mtop] .tb,html[data-owcs-dark] [data-owcs-mtop] .hd{border-bottom-color:#2E2E37}',
    '  html[data-owcs-dark] [data-owcs-mtop] .kn{background:#16161C}',
    '  html[data-owcs-dark] [data-owcs-mtop] .lg{background:#24242C}',
    '  html[data-owcs-dark] [data-owcs-mtop] .lg button{color:#F2F2F5 !important}',
    '  html[data-owcs-dark] [data-owcs-mtop] .lg button.on{background:#F2F2F5;color:#16161C !important}',
    '  html[data-owcs-dark] [data-owcs-mtop] .se{background:#0E0E12;border-color:#2E2E37}',
    '  html[data-owcs-dark] [data-owcs-mtop] nav a{background:#24242C;color:#F2F2F5 !important}',
    // the page's own phone header and the floating 다크 모드 / language switches give way to it
    '  #dc-root [data-screen-label] > header,body.streams-page > header,body.ticket-page > header{display:none !important}',
    '  [data-owcs-darkbtn],[data-owcs-lang]{display:none !important}',
    '}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var LANG = (function () {
    var l;
    try { l = localStorage.getItem('owcs-lang'); } catch (e) {}
    var n = (navigator.languages && navigator.languages[0] || navigator.language || 'ko').toLowerCase();
    return /^(ko|ja|en)$/.test(l || '') ? l : /^ja/.test(n) ? 'ja' : /^ko/.test(n) ? 'ko' : 'en';
  })();
  var T = {   // the home page's own labels (Home v6 I18N)
    ko: { nav: ['일정', '결과', '순위', '직관', '선수', '방송'], spoiler: '스포일러 방지', dark: '다크 모드' },
    ja: { nav: ['日程', '結果', '順位', '観戦', '選手', '配信'], spoiler: 'ネタバレ防止', dark: 'ダークモード' },
    en: { nav: ['Schedule', 'Results', 'Standings', 'Tickets', 'Players', 'Live'], spoiler: 'No spoilers', dark: 'Dark mode' }
  }[LANG];
  var HREFS = ['OWCS KR Home v6.dc.html', 'OWCS KR Results.dc.html', 'OWCS KR Home v6.dc.html?view=standings',
               'OWCS KR 직관.html', 'OWCS KR Home v6.dc.html?view=teams', 'OWCS KR 방송.html'];
  function isDark() { try { return localStorage.getItem('owcs-dark') === '1'; } catch (e) { return document.documentElement.hasAttribute('data-owcs-dark'); } }

  function ticket() {
    var s = document.createElement('section');
    s.setAttribute('data-owcs-tk', '');
    var no = (window.OWCS && window.OWCS.stageNo) || 3;
    s.innerHTML = '<a href="https://www.ticketlink.co.kr/sports/1262/631" target="_blank" rel="noopener">' +
      '<img src="assets/qr-ticket-black.png" alt="직관 예매 QR"><span><span class="k">직관 안내 · <span class="kd">OWCS ASIA : </span>KOREA STAGE ' + no + '</span>' +
      '<span class="v">WDG STUDIO HONGDAE에서 직관!</span><span class="s">눌러서 티켓링크에서 예매 ↗</span></span><span class="b">예매하기 ↗</span></a>';
    return s;
  }

  // the page's own spoiler switch (results page), so the phone tool bar can drive it
  function spoilerBtn() {
    return Array.prototype.find.call(document.querySelectorAll('header button'), function (b) {
      return /스포일러|ネタバレ|spoiler/i.test(b.textContent) && !b.closest('[data-owcs-mtop]');
    });
  }

  function mobileTop() {
    var m = document.createElement('div');
    m.setAttribute('data-owcs-mtop', '');
    var dark = isDark(), sp = spoilerBtn();
    m.innerHTML = '<div class="hd"><div class="row"><a class="brand" href="OWCS KR Home v6.dc.html"><span class="mk"><i></i></span><span class="wm">OWCS KR</span></a>' +
      '<span class="ic"><button class="hm" aria-label="메뉴"><span></span><span></span></button></span></div>' +
      '<nav>' + T.nav.map(function (l, k) { return '<a href="' + HREFS[k] + '">' + l + '</a>'; }).join('') + '</nav></div>' +
      '<div class="tb">' +
      '<button class="sw sp' + (sp ? '' : ' ph') + '"><span class="tr"><span class="kn"></span></span>' + T.spoiler + '</button>' +
      '<button class="sw dk' + (dark ? ' on' : '') + '"><span class="tr"><span class="kn"></span></span>' + T.dark + '</button>' +
      '<div class="lg">' + [['ko', '한국어'], ['ja', '日本語'], ['en', 'EN']].map(function (x) {
        return '<button data-l="' + x[0] + '"' + (x[0] === LANG ? ' class="on"' : '') + '>' + x[1] + '</button>';
      }).join('') + '</div></div>';
    m.querySelector('.hm').onclick = function () { m.classList.toggle('open'); };
    m.querySelector('.dk').onclick = function () { try { localStorage.setItem('owcs-dark', isDark() ? '0' : '1'); } catch (e) {} location.reload(); };
    Array.prototype.forEach.call(m.querySelectorAll('.lg button'), function (b) {
      b.onclick = function () {
        var l = b.getAttribute('data-l');
        try { localStorage.setItem('owcs-lang', l); } catch (e) {}
        if (l !== LANG) location.reload();
      };
    });
    var spb = m.querySelector('.sp');
    spb.onclick = function () {
      var own = spoilerBtn();
      if (!own) return;
      own.click();
      setTimeout(function () { syncSpoiler(m); }, 60);
    };
    syncSpoiler(m);
    return m;
  }
  function syncSpoiler(m) {
    var own = spoilerBtn(), tr = own && own.querySelector('span');
    var on = tr && /125, 57, 235|7D39EB/i.test(tr.getAttribute('style') || '');
    m.querySelector('.sp').classList.toggle('on', !!on);
  }

  // phone / tablet: the home page's top (tool bar, header, menu chips, 직관 안내) at the top of the page
  function placeMobile() {
    var host, before;
    var scr = Array.prototype.find.call(document.querySelectorAll('#dc-root [data-screen-label]'), function (x) { return x.offsetWidth > 0; });
    if (scr) { host = scr; before = scr.firstElementChild; }
    else if (document.body && document.body.firstElementChild) { host = document.body; before = document.body.firstElementChild; }
    if (!host) return;
    var m = host.querySelector(':scope > [data-owcs-mtop]');
    if (!m) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-owcs-mtop],[data-owcs-tk].m'), function (x) { x.remove(); });
      m = mobileTop();
      host.insertBefore(m, before);
    }
    var tk = m.nextElementSibling && m.nextElementSibling.matches('[data-owcs-tk]') ? m.nextElementSibling : null;
    if (!tk) { tk = ticket(); tk.classList.add('m'); host.insertBefore(tk, m.nextSibling); }
  }

  // desktop: the 직관 안내 banner right under the header, where the home page has it
  function placeTicket(h) {
    var n = h.nextElementSibling;
    if (n && n.matches('[data-owcs-tk]')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-owcs-tk]:not(.m)'), function (x) { x.remove(); });
    h.parentNode.insertBefore(ticket(), h.nextSibling);
  }

  // put the bar above the visible header and move the floating 다크 모드 / language switches into it (wide screens;
  // on phones they stay floating). The design runtime re-renders, so this re-checks when the page changes.
  function place() {
    if (window.innerWidth < 900) { placeMobile(); return; }
    var h = Array.prototype.find.call(document.querySelectorAll('header'), function (x) { return x.offsetWidth > 0; });
    if (!h) return;
    // the wordmark's letter spacing as on the home page (.02em)
    Array.prototype.forEach.call(h.querySelectorAll('span,div'), function (x) {
      if (!x.children.length && x.textContent.trim() === 'OWCS KR' && x.style.letterSpacing !== '0.56px') x.style.letterSpacing = '0.56px';
    });
    placeTicket(h);
    var bar = h.previousElementSibling && h.previousElementSibling.hasAttribute('data-owcs-bar') ? h.previousElementSibling : null;
    if (!bar) {
      bar = document.querySelector('[data-owcs-bar]') || document.createElement('div');
      bar.setAttribute('data-owcs-bar', '');
      h.parentNode.insertBefore(bar, h);
    }
    // the 다크 모드 switch drawn like the home page's (track + knob), not the floating pill's icon and label
    var db = document.querySelector('[data-owcs-darkbtn]');
    if (db && !db.hasAttribute('data-owcs-sw')) {
      var on = document.documentElement.hasAttribute('data-owcs-dark');
      db.setAttribute('data-owcs-sw', '');
      db.innerHTML = '<span style="position:relative;display:inline-block;width:30px;height:18px;border-radius:999px;background:' + (on ? '#7D39EB' : '#B9B9B3') + '"><span style="position:absolute;top:2px;left:' + (on ? '14px' : '2px') + ';width:14px;height:14px;border-radius:50%;background:#fff"></span></span>다크 모드';
      db.style.setProperty('display', 'inline-flex', 'important');
      db.style.setProperty('align-items', 'center');
      db.style.setProperty('gap', '8px');
    }
    ['[data-owcs-darkbtn]', '[data-owcs-lang]'].forEach(function (q) {
      var el = document.querySelector(q);
      if (el && el.parentNode !== bar) bar.appendChild(el);
    });
  }
  var busy = false;
  new MutationObserver(function () {
    if (busy) return;
    busy = true;
    setTimeout(function () { busy = false; place(); }, 50);   // not requestAnimationFrame: it never fires in a background tab
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); else place();
  window.addEventListener('resize', function () { setTimeout(place, 50); });
})();
