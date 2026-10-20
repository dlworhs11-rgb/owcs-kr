// The top of every page laid out like the home page (the reference, measured from it): one 76px header row with
// the logo (30px mark + 28px wordmark) on the content column's left edge, the menu (일정 · 결과 · 순위 · 직관 · 선수 · 방송)
// in the middle, and on the right the language picker (🌐 KOR ⌄: KOR · ENG · JPN · CHN with flags) and a ⋮ menu that holds
// 스포일러 방지 · 다크 모드. Phones / tablets: the picker sits next to the ☰ button, whose menu holds the two switches.
// The page's own switches (the home page's tool bar, the results page's spoiler switch, owcs-dark.js's floating button)
// stay in the page but hidden; the picker and the ⋮ menu press them, so each page keeps its own behaviour.
(function () {
  // the menu sits exactly in the middle of the header on every page, the home page too, so it never moves
  // between pages whatever the window width
  var centre = '@media (min-width:900px){#dc-root header{position:relative}' +
    'header nav{position:absolute !important;left:50% !important;top:50% !important;transform:translate(-50%,-50%) !important;display:flex !important;gap:6px !important;margin:0 !important;overflow:visible !important}}';
  var HOME = /Home/.test(decodeURIComponent(location.pathname).split('/').pop());
  // --- the language picker + ⋮ menu (all pages, the home page too) ---
  var hw = [
    '#dc-root [data-screen-label]{position:relative}',
    '[data-owcs-tools],[data-owcs-langpill],[data-owcs-darkbtn],[data-owcs-lang]{display:none !important}',
    '[data-owcs-hw]{position:absolute;z-index:20;display:flex;align-items:center;gap:4px;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;color:var(--ink,#0B0B0F);text-align:left}',
    // owcs-theme.js pads every child of a screen to the content column; the picker is not a section
    '#dc-root [data-screen-label] > [data-owcs-hw],[data-owcs-hw]{padding:0 !important;margin:0 !important;background:transparent !important;border:0 !important}',
    'html [data-owcs-hw] *{box-sizing:border-box}',
    '[data-owcs-hw] .w{position:relative}',
    '[data-owcs-hw] .lb{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 12px;border:1px solid var(--line,#E6E6E1);border-radius:10px;background:var(--paper,#fff);color:inherit;font-family:inherit;font-size:15px;font-weight:700;line-height:1;cursor:pointer}',
    '[data-owcs-hw] .mb{display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:10px;background:transparent;color:inherit;cursor:pointer}',
    '[data-owcs-hw] .lb:hover,[data-owcs-hw] .mb:hover,[data-owcs-hw] .it:hover{background:var(--paper3,#F1F1ED)}',
    '[data-owcs-hw] .dd{display:none;position:absolute;top:calc(100% + 6px);right:0;min-width:150px;padding:6px;border-radius:12px;background:var(--paper,#fff);border:1px solid var(--line,#E6E6E1);box-shadow:0 10px 30px rgba(0,0,0,.12)}',
    '[data-owcs-hw] .w.open .dd{display:block}',
    '[data-owcs-hw] .it{display:flex;align-items:center;gap:12px;width:100%;height:42px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--mute,#6B6B72);font-family:inherit;font-size:15px;font-weight:500;white-space:nowrap;text-align:left;cursor:pointer}',
    // the chosen language: darker and bold, no colour
    '[data-owcs-hw] .it.on{color:var(--ink,#0B0B0F);font-weight:800}',
    '[data-owcs-hw] .fl{flex:none;display:block;width:22px;height:15px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.14)}',
    '[data-owcs-hw] .hsw{color:var(--ink,#0B0B0F);font-size:14px;font-weight:600}',
    '[data-owcs-hw] .htr{position:relative;flex:none;width:30px;height:18px;border-radius:999px;background:#B9B9B3}',
    '[data-owcs-hw] .son .htr{background:#7D39EB}',
    '[data-owcs-hw] .hkn{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff}',
    '[data-owcs-hw] .son .hkn{left:14px}',
    '[data-owcs-hw] .my{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;font-size:13px;font-weight:700;white-space:nowrap}',
    '[data-owcs-hw] .my:empty{display:none}',
    // the menu: the page you are on in ink with a short lime bar under it (the site's accent), the others muted
    // (html body + the doubled attribute: beats the phone menu's own chip colours, light and dark)
    'html body a[data-owcs-nv][data-owcs-nv]{color:var(--mute,#6B6B72) !important}',
    'html body a[data-owcs-nv]:hover{color:var(--ink,#0B0B0F) !important}',
    'html[data-owcs-dark] body a[data-owcs-nv][data-owcs-nv]{color:#A3A3AD !important}',
    'html[data-owcs-dark] body a[data-owcs-nv]:hover{color:#F2F2F5 !important}',
    // light: a lime highlighter stroke under the word, just touching the letters' feet; dark: a thin lime line under it.
    // An underline, not a background: it follows the text, so it sits the same on every page whatever the button's size
    'html body a[data-owcs-nv][data-owcs-nv].cur{color:var(--ink,#0B0B0F) !important;text-decoration:underline var(--ac2,#C6FF33) 5px !important;text-underline-offset:-1px !important;text-decoration-skip-ink:none !important}',
    'html[data-owcs-dark] body a[data-owcs-nv][data-owcs-nv].cur{color:#F2F2F5 !important;text-decoration-thickness:2px !important;text-underline-offset:3px !important}',
    'html[data-owcs-dark] [data-owcs-hw]{color:#F2F2F5}',
    'html[data-owcs-dark] [data-owcs-hw] .lb,html[data-owcs-dark] [data-owcs-hw] .dd{background:#16161C;border-color:#2E2E37}',
    'html[data-owcs-dark] [data-owcs-hw] .it{color:#A3A3AD}',
    'html[data-owcs-dark] [data-owcs-hw] .it.on,html[data-owcs-dark] [data-owcs-hw] .hsw{color:#F2F2F5}',
    'html[data-owcs-dark] [data-owcs-hw] .lb:hover,html[data-owcs-dark] [data-owcs-hw] .mb:hover,html[data-owcs-dark] [data-owcs-hw] .it:hover{background:#24242C}',
    '@media (max-width:899.98px){',
    '  [data-owcs-hw] .lb{height:36px;padding:0 10px;font-size:14px}',
    '  [data-owcs-hw] .mw{display:none}',
    '  [data-owcs-mtop] [data-owcs-hw]{position:static}',
    '}'
  ].join('\n');
  var hst = document.createElement('style');
  // wordmark: italic caps, OW in lime (darker lime on the light header so it stays readable)
  var owt = '.owt{font-style:italic;letter-spacing:.02em;padding-right:.06em}.owt b{font-weight:inherit;color:var(--owt,#6E8F14)}' +
    'html[data-owcs-dark] .owt b{color:#C6FF33}';
  // shared footer (same as the home page): wordmark + channels | contact | notes, on the paper sheet, a hairline on top
  var F = 'html body footer.owft';
  var ft = [
    F + '{--fi:#0B0B0F;--fm:#55555C;background:transparent !important;color:var(--fi) !important;border:0 !important;border-top:1px solid color-mix(in srgb, var(--fi) 16%, transparent) !important;padding:56px 0 72px;font-size:13px;line-height:1.6}',
    'html[data-owcs-dark] body footer.owft{--fi:#F2F2F5;--fm:#A3A3AD}',
    '#dc-root ' + F + '{padding:56px 56px 72px}',
    F + ' .ft-g{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1.4fr);gap:40px}',
    F + ' .ft-logo{font-family:var(--disp,"Barlow Condensed"),"Barlow Condensed",sans-serif;font-weight:800;font-size:32px;line-height:1.2}',
    F + ' .ft-desc{font-size:15px;color:var(--fm);margin-top:10px;max-width:420px}',
    F + ' .ft-ch{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;margin-top:18px}',
    F + ' .ft-k{width:100%;font-size:13px;color:var(--fm)}',
    F + ' .ft-ch a{display:inline-flex;align-items:center;gap:8px;height:40px;color:var(--fi);text-decoration:none;font-size:14px;font-weight:600}',
    F + ' .ft-ch img{width:28px;height:28px;border-radius:8px}',
    F + ' .ft-mail{display:block;font-size:15px;color:var(--fi);margin-top:8px;text-decoration:underline}',
    F + ' .ft-note{font-size:13px;color:var(--fm)}',
    '@media (max-width:1180px){' + F + ' .ft-g{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px}}',
    '@media (max-width:899.98px){' + F + ',#dc-root ' + F + '{padding:32px 20px 40px}' + F + ' .wrap{padding:0}' +
      F + ' .ft-g{display:flex;flex-direction:column;gap:14px}' + F + ' .ft-logo{font-size:26px}' + F + ' .ft-desc{font-size:14px;margin-top:0}' +
      F + ' .ft-ch{margin-top:2px}' + F + ' .ft-mail{margin-top:4px;font-size:14px}' + F + ' .ft-note{font-size:12px}}'
  ].join('\n');
  hst.textContent = centre + '\n' + hw + '\n' + owt + '\n' + ft;
  (document.head || document.documentElement).appendChild(hst);
  var css = HOME ? '' : [
    '@media (min-width:900px){',
    '  #dc-root header{position:relative}',
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
    // the results page's own spoiler switch in its header: the ⋮ menu presses it
    '  header [data-owcs-ownsp]{display:none !important}',
    '}',
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
    // 스포일러 방지 · 다크 모드 live in the menu the menu button opens (as on the home page); the language picker sits next to it
    '  [data-owcs-mtop] .tb{display:none;justify-content:flex-start;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:12px 20px;border-bottom:1px solid #E6E6E1;font-size:13px}',
    '  [data-owcs-mtop].open .tb{display:flex}',
    '  [data-owcs-mtop] .sw{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:none;border-radius:999px;background:transparent;font:inherit;font-size:13px;font-weight:600;color:inherit !important;cursor:pointer}',
    '  [data-owcs-mtop] .tr{position:relative;width:30px;height:18px;border-radius:999px;background:#B9B9B3}',
    '  [data-owcs-mtop] .on .tr{background:#7D39EB}',
    '  [data-owcs-mtop] .kn{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff}',
    '  [data-owcs-mtop] .on .kn{left:14px}',
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
    '  [data-owcs-mtop] nav{display:flex !important;gap:4px;padding:0 12px 10px;overflow-x:auto;scrollbar-width:none;position:static !important;transform:none !important}',
    '  [data-owcs-mtop] nav::-webkit-scrollbar{display:none}',
    '  [data-owcs-mtop] nav a{flex:none;display:flex;align-items:center;height:44px;padding:0 14px;border-radius:999px;background:#F3F3EF;font-size:15px;font-weight:600;color:#0B0B0F !important;text-decoration:none}',
    '  [data-owcs-mtop],[data-owcs-tk].m{background:#F1EDE5 repeating-linear-gradient(135deg,rgba(60,45,25,.043) 0 1px,transparent 1px 11px)}',
    '  html[data-owcs-dark] [data-owcs-mtop],html[data-owcs-dark] [data-owcs-tk].m{background:#13110E repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 1px,transparent 1px 11px)}',
    '  html[data-owcs-dark] [data-owcs-mtop]{color:#F2F2F5}',
    '  html[data-owcs-dark] [data-owcs-mtop] .tb,html[data-owcs-dark] [data-owcs-mtop] .hd{border-bottom-color:#2E2E37}',
    '  html[data-owcs-dark] [data-owcs-mtop] .kn{background:#16161C}',
    '  html[data-owcs-dark] [data-owcs-mtop] .se{background:#0E0E12;border-color:#2E2E37}',
    '  html[data-owcs-dark] [data-owcs-mtop] nav a{background:#24242C;color:#F2F2F5 !important}',
    // the page's own phone header gives way to it
    '  #dc-root [data-screen-label] > header,body.streams-page > header,body.ticket-page > header{display:none !important}',
    '}'
  ].join('\n');
  if (css) {
    var st = document.createElement('style');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  var LANG = (function () {
    if (window.OWCSi18n && window.OWCSi18n.lang) return window.OWCSi18n.lang;
    var l;
    try { l = localStorage.getItem('owcs-lang'); } catch (e) {}
    var n = (navigator.languages && navigator.languages[0] || navigator.language || 'ko').toLowerCase();
    return /^(ko|ja|en|zh)$/.test(l || '') ? l : /^ja/.test(n) ? 'ja' : /^ko/.test(n) ? 'ko' : /^zh/.test(n) ? 'zh' : 'en';
  })();
  var T = {   // the home page's own labels (Home v6 I18N)
    ko: { nav: ['일정', '결과', '순위', '직관', '선수', '방송'], spoiler: '스포일러 방지', dark: '다크 모드', lang: '언어', more: '설정' },
    ja: { nav: ['日程', '結果', '順位', '観戦', '選手', '配信'], spoiler: 'ネタバレ防止', dark: 'ダークモード', lang: '言語', more: '設定' },
    en: { nav: ['Schedule', 'Results', 'Standings', 'Tickets', 'Players', 'Live'], spoiler: 'No spoilers', dark: 'Dark mode', lang: 'Language', more: 'Settings' },
    zh: { nav: ['赛程', '结果', '排名', '现场观赛', '选手', '直播'], spoiler: '防剧透', dark: '深色模式', lang: '语言', more: '设置' }
  }[LANG];
  var HREFS = ['OWCS KR 일정.html', 'OWCS KR Results.dc.html', 'OWCS KR Home v6.dc.html?view=standings',
               'OWCS KR 직관.html', 'OWCS KR Home v6.dc.html?view=teams', 'OWCS KR 방송.html'];
  // which menu item is this page: the file name, and for the home page its ?view= (a player's page counts as 선수)
  function navKey(href) {
    var a = document.createElement('a');
    a.href = href;
    var f = decodeURIComponent(a.pathname).split('/').pop(), v = new URLSearchParams(a.search).get('view') || '';
    if (/Player/.test(f)) { f = 'OWCS KR Home v6.dc.html'; v = 'teams'; }
    return f + '?' + v;
  }
  function markNav() {
    var here = navKey(location.href), keys = HREFS.map(navKey);
    Array.prototype.forEach.call(document.querySelectorAll('header nav a, [data-owcs-mtop] nav a'), function (a) {
      var k = navKey(a.getAttribute('href') || '');
      if (keys.indexOf(k) < 0) return;
      if (!a.hasAttribute('data-owcs-nv')) a.setAttribute('data-owcs-nv', '');
      if (a.classList.contains('cur') !== (k === here)) a.classList.toggle('cur', k === here);
    });
  }

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

  // the page's own switches: the results page's spoiler switch in its header, the home page's tool bar (hidden)
  function ownBtn(re) {
    return Array.prototype.find.call(document.querySelectorAll('header button, [data-owcs-tools] button'), function (b) {
      return re.test(b.textContent) && !b.closest('[data-owcs-mtop],[data-owcs-hw]');
    });
  }
  var SP_RE = /스포일러|ネタバレ|spoiler|剧透/i, DK_RE = /다크|ダーク|dark|深色/i;
  function spoilerBtn() { return ownBtn(SP_RE); }

  // 스포일러 방지 is one site-wide setting (localStorage 'owcs-spoiler'): pages with spoilers read it, the others
  // just keep it, so the switch is in the same place on every page
  function spStored() { try { return localStorage.getItem('owcs-spoiler') === '1'; } catch (e) { return false; } }
  function spOn() {
    var own = spoilerBtn(), tr = own && own.querySelector('span');
    return own ? /125, 57, 235|7D39EB/i.test(tr && tr.getAttribute('style') || '') : spStored();
  }
  function spToggle(after) {
    var own = spoilerBtn();
    if (own) own.click(); else { try { localStorage.setItem('owcs-spoiler', spStored() ? '0' : '1'); } catch (e) {} }
    setTimeout(after, 60);
  }
  // 다크 모드: the home page switches in place; the other pages reload into it (as owcs-dark.js's own button does)
  function darkToggle(after) {
    var own = ownBtn(DK_RE);
    if (own) { own.click(); setTimeout(after, 60); return; }
    try { localStorage.setItem('owcs-dark', isDark() ? '0' : '1'); } catch (e) {}
    location.reload();
  }

  // --- language picker (🌐 KOR ⌄) + ⋮ menu ---
  function star(cx, cy, r) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.382 : r;
      p.push((cx + q * Math.cos(a)).toFixed(2) + ',' + (cy + q * Math.sin(a)).toFixed(2));
    }
    return '<polygon points="' + p.join(' ') + '"/>';
  }
  function svg(body) { return '<svg class="fl" viewBox="0 0 36 24" preserveAspectRatio="none" aria-hidden="true">' + body + '</svg>'; }
  var FLAGS = {
    // 태극기: taegeuk on the top-left / bottom-right diagonal, the four trigrams drawn as plain bars
    ko: svg('<rect width="36" height="24" fill="#fff"/><g transform="rotate(33.69 18 12)"><path d="M12 12a6 6 0 0 1 12 0z" fill="#CD2E3A"/><path d="M12 12a6 6 0 0 0 12 0z" fill="#0047A0"/>' +
      '<circle cx="15" cy="12" r="3" fill="#CD2E3A"/><circle cx="21" cy="12" r="3" fill="#0047A0"/></g><g fill="#000">' +
      [[6.5, 4.3, -56.31], [29.5, 19.7, -56.31], [29.5, 4.3, 56.31], [6.5, 19.7, 56.31]].map(function (t) {
        return '<g transform="translate(' + t[0] + ' ' + t[1] + ') rotate(' + t[2] + ')"><rect x="-3" y="-2.1" width="6" height="1"/><rect x="-3" y="-0.5" width="6" height="1"/><rect x="-3" y="1.1" width="6" height="1"/></g>';
      }).join('') + '</g>'),
    en: svg('<rect width="36" height="24" fill="#fff"/><g fill="#B22234">' + [0, 2, 4, 6, 8, 10, 12].map(function (k) {
        return '<rect y="' + (k * 24 / 13).toFixed(3) + '" width="36" height="' + (24 / 13).toFixed(3) + '"/>';
      }).join('') + '</g><rect width="15" height="12.92" fill="#3C3B6E"/><g fill="#fff">' + [0, 1, 2, 3].map(function (r) {
        return [0, 1, 2, 3, 4].map(function (c) { return '<circle cx="' + (1.8 + c * 2.85 + (r % 2) * 1.2) + '" cy="' + (1.8 + r * 3.1) + '" r=".55"/>'; }).join('');
      }).join('') + '</g>'),
    ja: svg('<rect width="36" height="24" fill="#fff"/><circle cx="18" cy="12" r="7.2" fill="#BC002D"/>'),
    zh: svg('<rect width="36" height="24" fill="#EE1C25"/><g fill="#FFFF00">' + star(6, 6, 3.6) + star(12, 2.4, 1.2) + star(14.4, 4.8, 1.2) + star(14.4, 8.4, 1.2) + star(12, 10.8, 1.2) + '</g>')
  };
  var CODES = [['ko', 'KOR'], ['en', 'ENG'], ['ja', 'JPN'], ['zh', 'CHN']];
  var GLOBE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
  var CHEV = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
  var KEBAB = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="10" cy="4" r="1.8"/><circle cx="10" cy="10" r="1.8"/><circle cx="10" cy="16" r="1.8"/></svg>';
  function setLang(l) {
    if (window.OWCSi18n) { window.OWCSi18n.set(l); return; }
    try { localStorage.setItem('owcs-lang', l); } catch (e) {}
    if (l !== LANG) location.reload();
  }
  var HW = null;
  function headerWidget() {
    if (HW) return HW;
    var w = document.createElement('div');
    w.setAttribute('data-owcs-hw', '');
    var cur = CODES.filter(function (x) { return x[0] === LANG; })[0] || CODES[0];
    w.innerHTML = '<div class="w lw"><button class="lb" aria-haspopup="true" aria-label="' + T.lang + '">' + GLOBE + '<span>' + cur[1] + '</span>' + CHEV + '</button><div class="dd">' +
      CODES.map(function (x) { return '<button class="it' + (x[0] === LANG ? ' on' : '') + '" data-l="' + x[0] + '">' + FLAGS[x[0]] + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="w mw"><button class="mb" aria-haspopup="true" aria-label="' + T.more + '">' + KEBAB + '</button><div class="dd">' +
      '<div class="my"></div>' +
      '<button class="it hsw sp"><span class="htr"><span class="hkn"></span></span>' + T.spoiler + '</button>' +
      '<button class="it hsw dk"><span class="htr"><span class="hkn"></span></span>' + T.dark + '</button></div></div>';
    var lw = w.querySelector('.lw'), mw = w.querySelector('.mw');
    function sync() {
      w.querySelector('.sp').classList.toggle('son', spOn());
      w.querySelector('.dk').classList.toggle('son', isDark());
      // 내 팀 (home page tool bar): shown at the top of the ⋮ menu
      var my = document.querySelector('[data-owcs-tools] > span');
      w.querySelector('.my').innerHTML = my ? my.innerHTML : '';
    }
    w.querySelector('.lb').onclick = function (e) { e.stopPropagation(); mw.classList.remove('open'); lw.classList.toggle('open'); };
    w.querySelector('.mb').onclick = function (e) { e.stopPropagation(); lw.classList.remove('open'); sync(); mw.classList.toggle('open'); };
    Array.prototype.forEach.call(w.querySelectorAll('[data-l]'), function (b) {
      b.onclick = function () { lw.classList.remove('open'); setLang(b.getAttribute('data-l')); };
    });
    w.querySelector('.sp').onclick = function (e) { e.stopPropagation(); spToggle(sync); };
    w.querySelector('.dk').onclick = function (e) { e.stopPropagation(); darkToggle(sync); };
    w.querySelector('.mw .dd').onclick = function (e) { e.stopPropagation(); };
    // a click elsewhere closes the menus (not the page's own hidden switch the ⋮ menu just pressed)
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-owcs-hw],[data-owcs-tools],[data-owcs-ownsp]')) return;
      lw.classList.remove('open'); mw.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { lw.classList.remove('open'); mw.classList.remove('open'); } });
    return (HW = w);
  }
  // put the picker (absolute) in the screen at top / right (px from the host's top and right edges)
  function pin(host, top, right) {
    var w = headerWidget();
    if (w.parentNode !== host) host.appendChild(w);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var t = Math.round(top) + 'px', r = Math.round(right) + 'px';
    if (w.style.top !== t) w.style.top = t;
    if (w.style.right !== r) w.style.right = r;
  }

  function mobileTop() {
    var m = document.createElement('div');
    m.setAttribute('data-owcs-mtop', '');
    var dark = isDark();
    m.innerHTML = '<div class="hd"><div class="row"><a class="brand" href="OWCS KR Home v6.dc.html"><span class="mk"><i></i></span><span class="wm"><span class="owt"><b>OW</b>TICKER</span></span></a>' +
      '<span class="ic"><button class="hm" aria-label="메뉴"><span></span><span></span></button></span></div>' +
      '<nav>' + T.nav.map(function (l, k) { return '<a href="' + HREFS[k] + '">' + l + '</a>'; }).join('') + '</nav></div>' +
      '<div class="tb">' +
      '<button class="sw sp"><span class="tr"><span class="kn"></span></span>' + T.spoiler + '</button>' +
      '<button class="sw dk' + (dark ? ' on' : '') + '"><span class="tr"><span class="kn"></span></span>' + T.dark + '</button></div>';
    m.querySelector('.hm').onclick = function () { m.classList.toggle('open'); };
    m.querySelector('.dk').onclick = function () { try { localStorage.setItem('owcs-dark', isDark() ? '0' : '1'); } catch (e) {} location.reload(); };
    var spb = m.querySelector('.sp');
    spb.onclick = function () { spToggle(function () { syncSpoiler(m); }); };
    syncSpoiler(m);
    return m;
  }
  function syncSpoiler(m) { m.querySelector('.sp').classList.toggle('on', spOn()); }

  // phone / tablet: the home page's top (header, menu chips, 직관 안내) at the top of the page, the picker next to ☰
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
    var ic = m.querySelector('.ic'), w = headerWidget();
    if (w.parentNode !== ic) ic.insertBefore(w, ic.firstChild);
    var tk = m.nextElementSibling && m.nextElementSibling.matches('[data-owcs-tk]') ? m.nextElementSibling : null;
    if (!tk) { tk = ticket(); tk.classList.add('m'); host.insertBefore(tk, m.nextSibling); }
  }

  // the home page on a phone / tablet keeps its own header: the picker goes just left of its ☰ button
  function placeHomeMobile() {
    var scr = Array.prototype.find.call(document.querySelectorAll('#dc-root [data-screen-label]'), function (x) { return x.offsetWidth > 0; });
    var h = scr && Array.prototype.find.call(scr.querySelectorAll('header'), function (x) { return x.offsetWidth > 0; });
    var hm = h && h.querySelector('button[aria-label]');
    if (!hm) return;
    var pr = scr.getBoundingClientRect(), br = hm.getBoundingClientRect();
    pin(scr, br.top - pr.top + (br.height - 36) / 2, pr.right - br.left + 2);
  }

  // desktop: the 직관 안내 banner right under the header, where the home page has it
  function placeTicket(h) {
    var n = h.nextElementSibling;
    if (n && n.matches('[data-owcs-tk]')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-owcs-tk]:not(.m)'), function (x) { x.remove(); });
    h.parentNode.insertBefore(ticket(), h.nextSibling);
  }

  // desktop: the picker and ⋮ at the right end of the header row, as far from the edge as the logo is.
  // The design runtime re-renders, so this re-checks when the page changes.
  function place() {
    markNav();
    if (window.innerWidth < 900) { if (HOME) placeHomeMobile(); else placeMobile(); return; }
    var h = Array.prototype.find.call(document.querySelectorAll('header'), function (x) { return x.offsetWidth > 0 && !x.closest('[data-owcs-mtop]'); });
    if (!h) return;
    if (!HOME) {
      // the wordmark's letter spacing as on the home page (.02em)
      Array.prototype.forEach.call(h.querySelectorAll('span,div'), function (x) {
        if (x.classList.contains('owt') && x.parentNode.style.letterSpacing !== '0.56px') x.parentNode.style.letterSpacing = '0.56px';
      });
      placeTicket(h);
      var own = spoilerBtn();
      if (own && !own.hasAttribute('data-owcs-ownsp')) (own.parentNode.tagName === 'DIV' && own.parentNode.children.length === 1 ? own.parentNode : own).setAttribute('data-owcs-ownsp', '');
    }
    var host = h.parentNode, pr = host.getBoundingClientRect(), hr = h.getBoundingClientRect();
    var logo = h.querySelector('.brand') || h.querySelector('.wrap > *') || h.firstElementChild;
    var inset = logo ? logo.getBoundingClientRect().left - hr.left : 56;
    pin(host, hr.top - pr.top + (hr.height - 40) / 2, pr.right - hr.right + inset);
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
