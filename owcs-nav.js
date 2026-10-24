// The top of every page laid out like the home page (the reference, measured from it): one 76px header row with
// the logo (30px mark + 28px wordmark) on the content column's left edge, the menu (홈 · 일정 · 결과 · 순위 · 선수 · 방송 · 직관)
// in the middle, and on the right the language picker (🌐 KOR ⌄: KOR · ENG · JPN · CHN with flags) and a ⋮ menu that holds
// 스포일러 방지 · 다크 모드. Phones / tablets: the picker sits next to the ☰ button, whose menu holds the two switches.
// The page's own switches (the home page's tool bar, the results page's spoiler switch, owcs-dark.js's floating button)
// stay in the page but hidden; the picker and the ⋮ menu press them, so each page keeps its own behaviour.
(function () {
  // SEIJI -> SEJ and ZAN -> ROZE (2026-10-23): a team picked before the change keeps working
  try {
    var NEW = { SEIJI: 'SEJ', ZAN: 'ROZE' }, mt = localStorage.getItem('owcs-myteam'), sb = localStorage.getItem('owcs-subbed');
    if (mt && NEW[mt]) localStorage.setItem('owcs-myteam', NEW[mt]);
    if (sb) localStorage.setItem('owcs-subbed', sb.replace(/"(SEIJI|ZAN)"/g, function (_, c) { return '"' + NEW[c] + '"'; }));
  } catch (e) {}
  // the menu sits exactly in the middle of the header on every page, the home page too, so it never moves
  // between pages whatever the window width
  var centre = '@media (min-width:900px){#dc-root header{position:relative}' +
    'header nav{position:absolute !important;left:50% !important;top:50% !important;transform:translate(-50%,-50%) !important;display:flex !important;gap:6px !important;margin:0 !important;overflow:visible !important}}';
  var HOME = /Home|^(index|standings|players)?(\.html)?$/.test(decodeURIComponent(location.pathname).split('/').pop());
  // --- the language picker + ⋮ menu (all pages, the home page too) ---
  var hw = [
    '#dc-root [data-screen-label]{position:relative}',
    '[data-owcs-tools],[data-owcs-langpill],[data-owcs-darkbtn],[data-owcs-lang]{display:none !important}',
    '[data-owcs-hw]{position:absolute;z-index:20;display:flex;align-items:center;gap:4px;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;color:var(--ink,#0B0B0F);text-align:left}',
    // owcs-theme.js pads every child of a screen to the content column; the picker is not a section
    '#dc-root [data-screen-label] > [data-owcs-hw],[data-owcs-hw]{padding:0 !important;margin:0 !important;background:transparent !important;border:0 !important}',
    'html [data-owcs-hw] *{box-sizing:border-box}',
    '[data-owcs-hw] .w{position:relative}',
    '[data-owcs-hw] .lb{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 12px;border:1px solid var(--line,#E6E6E1);border-radius:12px;background:var(--paper,#fff);color:inherit;font-family:inherit;font-size:15px;font-weight:700;line-height:1;cursor:pointer}',
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
    // phone / tablet menu chips (the home page's and the other pages' copy): centred when they fit (tablet);
    // on a phone they don't fit, so they start at the left and scroll
    '@media (max-width:899.98px){[data-owcs-mtop] nav a:first-child,header nav a[data-owcs-nv]:first-child{margin-left:auto !important}' +
    '[data-owcs-mtop] nav a:last-child,header nav a[data-owcs-nv]:last-child{margin-right:auto !important}}',
    // phones: the 7 chips share the row, so 직관 is not cut off at the right edge (a language with longer labels still scrolls)
    '@media (max-width:559.98px){[data-owcs-mtop] nav,header nav:has(> a[data-owcs-nv]){padding:0 10px 10px !important}' +
    '[data-owcs-mtop] nav a,header nav a[data-owcs-nv]{flex:1 0 auto !important;justify-content:center !important;padding:0 clamp(6px,1.6vw,14px) !important}}',
    // the menu: the page you are on in ink with a short lime bar under it (the site's accent), the others muted
    // (html body + the doubled attribute: beats the phone menu's own chip colours, light and dark)
    'html body a[data-owcs-nv][data-owcs-nv]{color:var(--mute,#6B6B72) !important}',
    'html body a[data-owcs-nv]:hover{color:var(--ink,#0B0B0F) !important}',
    'html[data-owcs-dark] body a[data-owcs-nv][data-owcs-nv]{color:#A3A3AD !important}',
    'html[data-owcs-dark] body a[data-owcs-nv]:hover{color:#F2F2F5 !important}',
    // light: an olive highlighter stroke under the word, just touching the letters' feet; dark: a thin lime line under it.
    // menu links: no underline but the current page's. Not inline on the pages' links: an inline text-decoration made
    // iPhone Safari draw the home page's current-page underline thin (순위 · 선수), unlike every other page's
    'header nav a{text-decoration:none}',
    // An underline, not a background: it follows the text, so it sits the same on every page whatever the button's size
    // current page: a soft olive stroke under the word on the light page (the neon lime was too loud on the beige), a thin lime
    // line in dark mode. Drawn on the label span too: on the home page's views (순위 · 선수) the text sits in a block span inside the
    // flex link, and iPhone Safari drew the link's own underline there thin
    'html body a[data-owcs-nv][data-owcs-nv].cur{color:var(--ink,#0B0B0F) !important}',
    'html body a[data-owcs-nv][data-owcs-nv].cur,html body a[data-owcs-nv][data-owcs-nv].cur > span{text-decoration-line:underline !important;text-decoration-style:solid !important;text-decoration-color:var(--nvu,#A9C95A) !important;text-decoration-thickness:var(--nvt,5px) !important;text-underline-offset:var(--nvo,-1px) !important;text-decoration-skip-ink:none !important}',
    'html[data-owcs-dark] body a[data-owcs-nv][data-owcs-nv].cur{color:#F2F2F5 !important;--nvu:#C6FF33;--nvt:2px;--nvo:3px}',
    '[style*="--owt: #C6FF33"] a[data-owcs-nv][data-owcs-nv].cur,[style*="--owt:#C6FF33"] a[data-owcs-nv][data-owcs-nv].cur{--nvu:#C6FF33;--nvt:2px;--nvo:3px}',
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
  // leaned 8deg past the italic, with a diagonal cut through the legs of K and R: two mask stripes over those letters
  // (em boxes = the K and R advance boxes measured on TICKER, so they hold at every size and a cut never runs into the E;
  // the .1em side padding keeps the italic overhang inside the mask
  // and the negative margins give the same width as before)
  var owt = '.owt{font-style:italic;letter-spacing:.02em;display:inline-block;line-height:1.214;padding:0 .1em;margin:0 -.04em 0 -.1em;transform:skewX(-8deg);' +
      '--owcut:linear-gradient(150deg,transparent 58.6%,#000 59.1%,#000 63.5%,transparent 64%);' +
      '-webkit-mask:var(--owcut) 2.502em 0/.511em 100% no-repeat,var(--owcut) 3.46em 0/.487em 100% no-repeat,linear-gradient(#000,#000);-webkit-mask-composite:xor;' +
      'mask:var(--owcut) 2.502em 0/.511em 100% no-repeat,var(--owcut) 3.46em 0/.487em 100% no-repeat,linear-gradient(#000,#000);mask-composite:exclude}' +
      '.owt b{font-weight:inherit;color:var(--owt,#6E8F14)}' +
    'html[data-owcs-dark] .owt b{color:#C6FF33}' +
    // phones / tablets: the top bar's wordmark 24px on every page (schedule / streams / live-viewing gave it 26px from their own .brand span rule)
    '[data-owcs-mtop] .wm span{font-size:inherit !important}' +
    // the logo mark: every page's header tile (a dark square with a lime dot, inline on some pages) drawn as the round logo
    // (black with a dark-lime top arc on the beige page, light grey and lime in dark mode)
    'a:has(> span .owt) > :first-child:not(span),[data-owcs-mtop] .mk{background:url(assets/app/logo-light.svg?v=2) center/contain no-repeat !important;border-radius:0 !important;flex:none !important}' +
    // a round mark reads smaller than the old square tile: 34px next to the 28px wordmark, 28px on phones (24px wordmark)
    'header a:has(> span .owt) > :first-child:not(span){width:34px !important;height:34px !important}' +
    '@media (max-width:899.98px){header a:has(> span .owt) > :first-child:not(span),[data-owcs-mtop] .mk{width:28px !important;height:28px !important}}' +
    // (dark mode: <html data-owcs-dark> on the other pages; the home page only switches its theme box's --owt to lime)
    'html[data-owcs-dark] a:has(> span .owt) > :first-child:not(span),html[data-owcs-dark] [data-owcs-mtop] .mk,[style*="--owt: #C6FF33"] a:has(> span .owt) > :first-child:not(span),[style*="--owt:#C6FF33"] a:has(> span .owt) > :first-child:not(span){background-image:url(assets/app/logo-dark.svg?v=2) !important;background-color:transparent !important}' +
    // owcs-dark.js turns the old dark tile light on the results / player pages; one element more specific than its rule
    'html[data-owcs-dark] #dc-root [data-screen-label] header a > div[style*="width: 30px"][style*="border-radius: 7px"][style*="background: rgb(11, 11, 15)"]{background-color:transparent !important}' +
    'a:has(> span .owt) > :first-child:not(span) > *,a:has(> span .owt) > :first-child:not(span):after,[data-owcs-mtop] .mk > *{display:none !important}';
  // the name under the icon when an iPhone adds the site to its home screen (otherwise the page title)
  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) { var amt = document.createElement('meta'); amt.name = 'apple-mobile-web-app-title'; amt.content = 'OWticker'; (document.head || document.documentElement).appendChild(amt); }
  // shared footer (same as the home page): wordmark + channels | contact | notes, on the paper sheet, a hairline on top
  var F = 'html body footer.owft';
  var ft = [
    F + '{--fi:#0B0B0F;--fm:#55555C;background:transparent !important;color:var(--fi) !important;border:0 !important;border-top:1px solid color-mix(in srgb, var(--fi) 16%, transparent) !important;padding:56px 0 72px;font-size:13px;line-height:1.6}',
    'html[data-owcs-dark] body footer.owft{--fi:#F2F2F5;--fm:#A3A3AD}',
    '#dc-root ' + F + '{padding:56px 56px 72px}',
    F + ' .ft-g{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1.4fr);gap:40px}',
    F + ' .ft-logo{font-family:var(--disp,"Barlow Condensed"),"Barlow Condensed",sans-serif;font-weight:800;font-size:32px;line-height:1.2}',
    F + ' .ft-desc{font-size:15px;color:var(--fm);margin-top:10px;max-width:420px;word-break:keep-all;overflow-wrap:break-word}',   // Korean words stay whole (10-24)
    F + ' .ft-ch{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;margin-top:18px}',
    F + ' .ft-k{width:100%;font-size:13px;color:var(--fm)}',
    F + ' .ft-ch a{display:inline-flex;align-items:center;gap:8px;height:40px;color:var(--fi);text-decoration:none;font-size:14px;font-weight:600}',
    F + ' .ft-ch img{width:28px;height:28px;border-radius:8px}',
    F + ' .ft-mail{display:block;font-size:15px;color:var(--fi);margin-top:8px;text-decoration:underline}',
    // the mail / chat links were 22px high on phones (the 22px icon): at least a 24px target, the home page's own footer too (10-24)
    'footer a[href^="mailto:"],footer a[href*="discord."]{min-height:24px}',
    F + ' .ft-note{font-size:13px;color:var(--fm);word-break:keep-all;overflow-wrap:break-word}',
    '@media (max-width:1180px){' + F + ' .ft-g{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px}}',
    '@media (min-width:900px) and (max-width:1180px){' + F + ' .ft-g>div:nth-child(2){border-left:1px solid color-mix(in srgb, var(--fi) 16%, transparent);padding-left:28px}' + F + ' .ft-note{grid-column:1/-1;border-top:1px solid color-mix(in srgb, var(--fi) 16%, transparent);padding-top:18px}}',
    '@media (max-width:899.98px){' + F + ',#dc-root ' + F + '{padding:32px 20px 40px}' + F + ' .wrap{padding:0}' +
      F + ' .ft-g{display:flex;flex-direction:column;gap:14px}' + F + ' .ft-logo{font-size:26px}' + F + ' .ft-desc{font-size:14px;margin-top:0}' +
      F + ' .ft-ch{margin-top:2px}' + F + ' .ft-g>div+div{border-top:1px solid color-mix(in srgb, var(--fi) 16%, transparent);padding-top:16px}' + F + ' .ft-mail{margin-top:4px;font-size:14px}' + F + ' .ft-note{font-size:12px}}'
  ].join('\n');
  // the wordmark stays hidden until Barlow Condensed 800 italic is in: on an iPhone it was drawn in the wider fallback
  // font first and shrank a moment later (the results / player / home pages load this script before the font's stylesheet).
  // Shown anyway after 3s so a font that never arrives can't hide the logo.
  owt += 'html:not([data-owt-font]) .owt{visibility:hidden}';
  (function () {
    var de = document.documentElement, fs = document.fonts;
    function show() { de.setAttribute('data-owt-font', ''); }
    function face() {
      var hit = false;
      fs.forEach(function (f) { if (/Barlow Condensed/.test(f.family) && f.style === 'italic' && String(f.weight) === '800') hit = true; });
      return hit;
    }
    function test() {
      if (de.hasAttribute('data-owt-font')) return;
      // check() is also true while the font's stylesheet hasn't declared the face yet, so the face must exist first
      if (face() && fs.check("italic 800 24px 'Barlow Condensed'")) show();
      else if (face()) fs.load("italic 800 24px 'Barlow Condensed'").then(test, show);
    }
    if (!fs || !fs.check) { show(); return; }
    setTimeout(show, 3000);
    test();
    fs.addEventListener && fs.addEventListener('loadingdone', test);
    document.addEventListener('DOMContentLoaded', test);
    window.addEventListener('load', test);
  })();
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
    // results / player pages turn every hovered link ink (a:hover), which hid the white text on the black banner
    '[data-owcs-tk] a:hover{color:#fff}',
    '[data-owcs-tk] img{display:block;width:80px;height:80px;border-radius:10px;background:#fff;padding:4px;box-sizing:border-box}',
    '[data-owcs-tk] .k{display:block;font-size:13px;font-weight:700;color:#C6FF33}',
    '[data-owcs-tk] .v{display:block;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:30px;line-height:1;margin-top:6px}',
    '[data-owcs-tk] .s{display:none;font-size:12px;color:#B5B5BD;margin-top:4px}',
    '[data-owcs-tk] .b{display:inline-flex;align-items:center;height:40px;padding:0 16px;border-radius:999px;background:#C6FF33;color:#0B0B0F;font-weight:800;font-size:14px}',
    'html[data-owcs-dark] [data-owcs-tk] a{box-shadow:inset 0 0 0 1px #2E2E37}',
    '@media (max-width:899.98px){',
    '  [data-owcs-tk]{padding:12px 20px}',
    // block, not the schedule page's .m match-card grid (its 2nd column cut 10 px off the banner's right side)
    '  [data-owcs-tk].m{display:block;border-radius:0}',
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
    '  [data-owcs-mtop] .row{display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 12px 0 20px;margin:0}',   // margin 0: the schedule page has its own .row with a margin that pushed the menu 14px down
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
    // schedule / streams / tickets load this in <head>, before owcs-i18n.js stores ?lang=: read it here too, or the
    // picker said KOR over an English page (10-24)
    var q = new URLSearchParams(location.search).get('lang');
    if (/^(ko|ja|en|zh)$/.test(q || '')) return q;
    var l;
    try { l = localStorage.getItem('owcs-lang'); } catch (e) {}
    var n = (navigator.languages && navigator.languages[0] || navigator.language || 'ko').toLowerCase();
    return /^(ko|ja|en|zh)$/.test(l || '') ? l : /^ja/.test(n) ? 'ja' : /^ko/.test(n) ? 'ko' : /^zh/.test(n) ? 'zh' : 'en';
  })();
  var T = {   // the home page's own labels (Home v6 I18N)
    ko: { nav: ['홈', '일정', '결과', '순위', '선수', '방송', '직관'], spoiler: '스포일러 방지', dark: '다크 모드', lang: '언어', more: '설정' },
    ja: { nav: ['ホーム', '日程', '結果', '順位', '選手', '配信', '観戦'], spoiler: 'ネタバレ防止', dark: 'ダークモード', lang: '言語', more: '設定' },
    en: { nav: ['Home', 'Schedule', 'Results', 'Standings', 'Players', 'Live', 'Tickets'], spoiler: 'No spoilers', dark: 'Dark mode', lang: 'Language', more: 'Settings' },
    zh: { nav: ['首页', '赛程', '结果', '排名', '选手', '直播', '现场观赛'], spoiler: '防剧透', dark: '深色模式', lang: '语言', more: '设置' }
  }[LANG];
  var HREFS = ['OWCS KR Home v6.dc.html', 'OWCS KR 일정.html', 'OWCS KR Results.dc.html', 'OWCS KR Home v6.dc.html?view=standings',
               'OWCS KR Home v6.dc.html?view=teams', 'OWCS KR 방송.html', 'OWCS KR 직관.html'];
  // which menu item is this page: the file name, and for the home page its ?view= (a player's page counts as 선수)
  function navKey(href) {
    var a = document.createElement('a');
    a.href = href;
    var f = decodeURIComponent(a.pathname).split('/').pop(), v = new URLSearchParams(a.search).get('view') || '';
    f = f.replace(/\.html$/, '');   // the site's short addresses: / (home), standings, players, player, schedule ...
    if (/^(standings|players)$/.test(f)) { v = f === 'players' ? 'teams' : f; f = ''; }
    if (/Player|^player$/.test(f)) { f = ''; v = 'teams'; }
    if (/Home|^index$/.test(f)) f = '';
    return f + '?' + v;
  }
  function markNav() {
    var here = navKey(location.href), keys = HREFS.map(navKey);
    Array.prototype.forEach.call(document.querySelectorAll('header nav a, [data-owcs-mtop] nav a'), function (a) {
      var k = navKey(a.getAttribute('href') || '');
      if (keys.indexOf(k) < 0) return;
      if (!a.hasAttribute('data-owcs-nv')) a.setAttribute('data-owcs-nv', '');
      if (a.classList.contains('cur') !== (k === here)) a.classList.toggle('cur', k === here);
      if (k === here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');   // screen readers: the colour alone said which page (10-24)
    });
  }

  function isDark() { try { return sessionStorage.getItem('owcs-dark') === '1'; } catch (e) { return document.documentElement.hasAttribute('data-owcs-dark'); } }

  // the tickets page is the 직관 안내 itself: no banner there, desktop or phone (10-24)
  function onTickets() { return !!document.body && document.body.classList.contains('ticket-page'); }
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
    try { sessionStorage.setItem('owcs-dark', isDark() ? '0' : '1'); } catch (e) {}
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
    // menus say open / closed (aria-expanded) and the switches on / off (role=switch, aria-checked): before, only the
    // look told (10-24)
    w.innerHTML = '<div class="w lw"><button class="lb" aria-expanded="false" aria-label="' + T.lang + '">' + GLOBE + '<span>' + cur[1] + '</span>' + CHEV + '</button><div class="dd">' +
      CODES.map(function (x) { return '<button class="it' + (x[0] === LANG ? ' on' : '') + '" data-l="' + x[0] + '"' + (x[0] === LANG ? ' aria-current="true"' : '') + '>' + FLAGS[x[0]] + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="w mw"><button class="mb" aria-expanded="false" aria-label="' + T.more + '">' + KEBAB + '</button><div class="dd">' +
      '<div class="my"></div>' +
      '<button class="it hsw sp" role="switch" aria-checked="false"><span class="htr" aria-hidden="true"><span class="hkn"></span></span>' + T.spoiler + '</button>' +
      '<button class="it hsw dk" role="switch" aria-checked="false"><span class="htr" aria-hidden="true"><span class="hkn"></span></span>' + T.dark + '</button></div></div>';
    var lw = w.querySelector('.lw'), mw = w.querySelector('.mw');
    function open(x, on) { x.classList.toggle('open', on); x.querySelector('button').setAttribute('aria-expanded', on ? 'true' : 'false'); }
    function sync() {
      w.querySelector('.sp').classList.toggle('son', spOn());
      w.querySelector('.dk').classList.toggle('son', isDark());
      w.querySelector('.sp').setAttribute('aria-checked', spOn() ? 'true' : 'false');
      w.querySelector('.dk').setAttribute('aria-checked', isDark() ? 'true' : 'false');
      // 내 팀 (home page tool bar): shown at the top of the ⋮ menu
      var my = document.querySelector('[data-owcs-tools] > span');
      w.querySelector('.my').innerHTML = my ? my.innerHTML : '';
    }
    w.querySelector('.lb').onclick = function (e) { e.stopPropagation(); open(mw, false); open(lw, !lw.classList.contains('open')); };
    w.querySelector('.mb').onclick = function (e) { e.stopPropagation(); open(lw, false); sync(); open(mw, !mw.classList.contains('open')); };
    Array.prototype.forEach.call(w.querySelectorAll('[data-l]'), function (b) {
      b.onclick = function () { open(lw, false); setLang(b.getAttribute('data-l')); };
    });
    w.querySelector('.sp').onclick = function (e) { e.stopPropagation(); spToggle(sync); };
    w.querySelector('.dk').onclick = function (e) { e.stopPropagation(); darkToggle(sync); };
    w.querySelector('.mw .dd').onclick = function (e) { e.stopPropagation(); };
    // a click elsewhere closes the menus (not the page's own hidden switch the ⋮ menu just pressed)
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-owcs-hw],[data-owcs-tools],[data-owcs-ownsp]')) return;
      open(lw, false); open(mw, false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(lw, false); open(mw, false); } });
    sync();
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
      '<span class="ic"><button class="hm" aria-label="메뉴" aria-expanded="false"><span></span><span></span></button></span></div>' +
      '<nav>' + T.nav.map(function (l, k) { return '<a href="' + HREFS[k] + '">' + l + '</a>'; }).join('') + '</nav></div>' +
      '<div class="tb">' +
      '<button class="sw sp" role="switch" aria-checked="false"><span class="tr" aria-hidden="true"><span class="kn"></span></span>' + T.spoiler + '</button>' +
      '<button class="sw dk' + (dark ? ' on' : '') + '" role="switch" aria-checked="' + (dark ? 'true' : 'false') + '"><span class="tr" aria-hidden="true"><span class="kn"></span></span>' + T.dark + '</button></div>';
    m.querySelector('.hm').onclick = function () { this.setAttribute('aria-expanded', m.classList.toggle('open') ? 'true' : 'false'); };
    m.querySelector('.dk').onclick = function () { try { sessionStorage.setItem('owcs-dark', isDark() ? '0' : '1'); } catch (e) {} location.reload(); };
    var spb = m.querySelector('.sp');
    spb.onclick = function () { spToggle(function () { syncSpoiler(m); }); };
    syncSpoiler(m);
    return m;
  }
  function syncSpoiler(m) { m.querySelector('.sp').classList.toggle('on', spOn()); m.querySelector('.sp').setAttribute('aria-checked', spOn() ? 'true' : 'false'); }

  // phone / tablet: the home page's top (header, menu chips, 직관 안내) at the top of the page, the picker next to ☰.
  // A dc page (results, player) waits for its screen: put at the top of <body> first and moved into the screen once React
  // drew it, the 211 px bar pushed the page down and back (results on a phone: CLS 0.25, 10-24). The observer below
  // places it in the same frame the screen appears. React never coming (a failed CDN): <body> after 4 s, as before.
  // A dc page loads support.js in its <head>, which is read by the time the body is (this script runs before both)
  var dcWait = 0, dcLate = false;
  function dcEarly() {
    if (dcLate || !document.querySelector('script[src*="support.js"]')) return false;
    if (!dcWait) dcWait = setTimeout(function () { dcLate = true; place(); }, 4000);
    return true;
  }
  function placeMobile() {
    var host, before;
    var scr = Array.prototype.find.call(document.querySelectorAll('#dc-root [data-screen-label]'), function (x) { return x.offsetWidth > 0; });
    if (!scr && dcEarly()) return;
    if (scr) { host = scr; before = scr.firstElementChild; }
    else if (document.body && document.body.firstElementChild) {   // after the skip link, which stays the first Tab stop
      host = document.body; before = document.body.firstElementChild;
      if (before.hasAttribute('data-owcs-skip')) before = before.nextElementSibling;
    }
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
    if (!tk && !onTickets()) { tk = ticket(); tk.classList.add('m'); host.insertBefore(tk, m.nextSibling); }
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
    if (onTickets()) return;
    var n = h.nextElementSibling;
    if (n && n.matches('[data-owcs-tk]')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-owcs-tk]:not(.m)'), function (x) { x.remove(); });
    h.parentNode.insertBefore(ticket(), h.nextSibling);
  }

  // desktop: the picker and ⋮ at the right end of the header row, as far from the edge as the logo is.
  // The design runtime re-renders, so this re-checks when the page changes.
  function place() {
    markNav();
    appSync();
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
  // --- the site as a phone app (홈 화면에 추가): the manifest and icons in the head, a service worker, a lime 앱 설치
  // button in the top bar (next to the language picker, every page; no bottom banner: the user found it pushy, 10-21).
  // Android / desktop Chrome install with one tap (beforeinstallprompt). An iPhone can't be asked (Apple
  // allows no install button), so the button shows the taps as icon chips (⋯ → 공유 → 홈 화면에 추가) with a bouncing
  // arrow at the browser button to press first: bottom right in Safari 26's compact bar, bottom middle in older Safari,
  // top right in Chrome / iPad. In-app browsers (KakaoTalk, Instagram ...) can't install at all: the guide sends the
  // page to the real browser. Icons: assets/app (the logo).
  var AT = {
    ko: { add: '앱 설치', addS: '앱', ok: '알겠어요',
      tip: '홈 화면에 추가하는 법', more: '더보기', share: '공유', home: '홈 화면에 추가', menu: '메뉴', fin: '추가',
      hMore: '<b>⋯</b> 버튼. 안 보이면 주소창의 <b>☰</b> 아이콘', hShareM: '열린 메뉴의 맨 위', hShareB: '네모에 위쪽 화살표 모양. 화면 위나 아래에 있어요', hShareT: '네모에 위쪽 화살표 모양. 화면 위나 아래에 있어요',
      hHome: '목록을 아래로 조금 내리면 있어요', hFin: '오른쪽 위. 누르면 끝!', hMenu: '화면 오른쪽 위 ⋮ 버튼', hHomeA: '<b>앱 설치</b>라고 되어 있을 수도 있어요',
      keep: '이 안내는 위에 그대로 있어요. 보면서 하나씩 따라 하세요', nohome: '공유 목록에 <b>홈 화면에 추가</b>가 없으면: 목록 속 <b>Safari에서 열기</b>를 누른 뒤 처음부터 다시 해 주세요',
      inT: '브라우저에서 열어 주세요', inapp: '이 앱 안의 화면에서는 설치가 안 돼요. <b>⋯</b> 메뉴나 공유 버튼에서 <b>Safari에서 열기</b>(또는 <b>브라우저로 열기</b>)를 누른 뒤, 다시 <b>앱</b> 버튼을 눌러 주세요.', ext: '브라우저로 열기' },
    en: { add: 'Get app', addS: 'App', ok: 'Got it',
      tip: 'How to add it to your home screen', more: 'More', share: 'Share', home: 'Add to Home Screen', menu: 'Menu', fin: 'Add',
      hMore: 'The <b>⋯</b> button. If there is none, the <b>☰</b> icon in the address bar', hShareM: 'Top of the menu that opens', hShareB: 'A square with an up arrow, at the top or bottom of the screen', hShareT: 'A square with an up arrow, at the top or bottom of the screen',
      hHome: 'Scroll the list down a little', hFin: 'Top right, and you\'re done!', hMenu: 'The ⋮ button at the top right', hHomeA: 'It may say <b>Install app</b>',
      keep: 'This guide stays up here. Follow it step by step', nohome: 'No <b>Add to Home Screen</b> in the share list? Tap <b>Open in Safari</b> there, then start again',
      inT: 'Open in your browser', inapp: 'Apps can\'t be installed from this in-app browser. In the <b>⋯</b> menu or the share button, choose <b>Open in Safari</b> (or <b>Open in browser</b>), then tap <b>App</b> again.', ext: 'Open in browser' },
    ja: { add: 'アプリ', addS: 'アプリ', ok: 'OK',
      tip: 'ホーム画面への追加方法', more: 'その他', share: '共有', home: 'ホーム画面に追加', menu: 'メニュー', fin: '追加',
      hMore: '<b>⋯</b>ボタン。なければアドレスバーの<b>☰</b>アイコン', hShareM: '開いたメニューの一番上', hShareB: '四角に上向き矢印のアイコン。画面の上か下にあります', hShareT: '四角に上向き矢印のアイコン。画面の上か下にあります',
      hHome: 'リストを少し下にスクロール', hFin: '右上。これで完了！', hMenu: '右上の ⋮ ボタン', hHomeA: '<b>アプリをインストール</b>の場合も',
      keep: 'この案内は上に表示されたままです', nohome: '共有リストに<b>ホーム画面に追加</b>がない場合：<b>Safariで開く</b>を押して最初からやり直してください',
      inT: 'ブラウザで開いてください', inapp: 'このアプリ内ブラウザではインストールできません。<b>⋯</b>メニューか共有ボタンから<b>Safariで開く</b>（または<b>ブラウザで開く</b>）を選び、もう一度<b>アプリ</b>を押してください。', ext: 'ブラウザで開く' },
    zh: { add: '安装', addS: '安装', ok: '知道了',
      tip: '如何添加到主屏幕', more: '更多', share: '分享', home: '添加到主屏幕', menu: '菜单', fin: '添加',
      hMore: '<b>⋯</b>按钮。没有的话点地址栏里的<b>☰</b>图标', hShareM: '打开的菜单最上方', hShareB: '方框加向上箭头的图标，在屏幕顶部或底部', hShareT: '方框加向上箭头的图标，在屏幕顶部或底部',
      hHome: '将列表向下滑一点', hFin: '右上角，完成！', hMenu: '右上角的 ⋮ 按钮', hHomeA: '也可能显示为<b>安装应用</b>',
      keep: '此说明会一直显示在上方', nohome: '分享列表里没有<b>添加到主屏幕</b>？请点<b>在 Safari 中打开</b>，然后重新开始',
      inT: '请在浏览器中打开', inapp: '此应用内浏览器无法安装。请在<b>⋯</b>菜单或分享按钮中选择<b>在 Safari 中打开</b>（或<b>在浏览器中打开</b>），然后再点一次<b>安装</b>。', ext: '在浏览器中打开' }
  }[LANG];
  var UA = navigator.userAgent || '';
  var IPAD = /iPad/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var IOS = IPAD || /iPhone|iPod/.test(UA);
  var SAFARI = IOS && !/CriOS|FxiOS|EdgiOS|OPiOS|Whale|NAVER|KAKAOTALK|GSA\//i.test(UA);
  var SAFARI26 = SAFARI && +((UA.match(/Version\/(\d+)/) || [])[1] || 0) >= 26;   // the compact bar: share is under ⋯
  var ANDROID = /Android/.test(UA);
  var INAPP = /KAKAOTALK|GSA\/|Twitter|dcinside|Reddit|Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|DaumApps|everytimeApp|BAND\//i.test(UA);
  var BIP = null;   // Chrome's install prompt, kept for the button
  function standalone() { return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone); }
  // phones and tablets only: a computer's Chrome / Edge offers an install too, but the app is for phones (10-23)
  function canAdd() { return !standalone() && (IOS || ANDROID); }
  function appHead() {
    var h = document.head;
    if (!h || h.querySelector('link[rel="manifest"]')) return;
    var dk = isDark(), add = function (tag, at) { var x = document.createElement(tag); for (var k in at) x.setAttribute(k, at[k]); h.appendChild(x); };
    add('link', { rel: 'manifest', href: 'assets/app/owticker.webmanifest' });
    add('link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'assets/app/favicon-32.png' });
    add('link', { rel: 'icon', type: 'image/png', sizes: '48x48', href: 'assets/app/favicon-48.png' });
    add('link', { rel: 'apple-touch-icon', href: 'assets/app/apple-touch-icon.png' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-title', content: 'OWticker' });
    add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
    // the status bar in the app: the page paper (cream / dark brown), as the top of every page
    if (!h.querySelector('meta[name="theme-color"]')) add('meta', { name: 'theme-color', content: dk ? '#13110E' : '#F1EDE5' });
  }
  var ic = function (d, sz) { return '<svg width="' + (sz || 20) + '" height="' + (sz || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var I_SHARE = ic('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>');
  var I_MORE = ic('<circle cx="12" cy="12" r="10"/><circle cx="7.5" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16.5" cy="12" r=".9" fill="currentColor"/>');
  var I_ADD = ic('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>');
  var I_KEBAB = ic('<circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>');
  var I_PHONE = ic('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/>', 18);
  var MARK = '<span class="am"><i></i></span>';
  var acss = [
    // the top bar's 앱 설치 button: lime, next to the language picker
    '[data-owcs-hw] .ab{display:inline-flex;align-items:center;gap:5px;height:40px;padding:0 12px 0 10px;border:0;border-radius:12px;background:#C6FF33;color:#0B0B0F;font-family:inherit;font-size:15px;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer}',
    // results / player pages in dark mode: owcs-dark.js gives their buttons the light page text (white on lime); keep it ink
    'html body #dc-root [data-owcs-hw] button.ab{color:#0B0B0F}',
    '[data-owcs-hw] .ab[hidden]{display:none}',
    '[data-owcs-hw] .ab .s{display:none}',
    // phones: 앱 (the long label meets the logo on a 390px iPhone), the icon alone under 375px
    '@media (max-width:899.98px){[data-owcs-hw] .ab{height:36px;padding:0 10px 0 8px;font-size:14px}[data-owcs-hw] .ab .l{display:none}[data-owcs-hw] .ab .s{display:inline}}',
    '@media (max-width:374.98px){[data-owcs-hw] .ab .s{display:none}[data-owcs-hw] .ab{padding:0 9px}}',
    '[data-owcs-app]{position:fixed;z-index:70;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;color:#0B0B0F;text-align:left;line-height:1.45}',
    '[data-owcs-app] *{box-sizing:border-box}',
    '[data-owcs-app] .am{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:11px;background:#0B0B0F}',
    '[data-owcs-app] .am i{width:15px;height:15px;border-radius:4px;background:#C6FF33}',
    // the guide: a dim page, one card, and a lime arrow bouncing at the browser button to press first
    '[data-owcs-app].sheet{inset:0;display:flex;justify-content:center;background:rgba(0,0,0,.6)}',
    '[data-owcs-app].sheet.b,[data-owcs-app].sheet.t{align-items:flex-start;padding-top:calc(12px + env(safe-area-inset-top))}',
    '[data-owcs-app].sheet.t{padding-top:84px}',
    '[data-owcs-app].sheet.c{align-items:center}',
    '[data-owcs-app] .pn{width:100%;max-width:440px;margin:0 12px;padding:20px 18px 16px;border-radius:24px;background:#fff}',
    '[data-owcs-app] .hd2{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:800}',
    '[data-owcs-app] .fl2{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:16px}',
    '[data-owcs-app] .ch{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 12px;border-radius:12px;background:#F1F1ED;font-size:15px;font-weight:800;white-space:nowrap}',
    '[data-owcs-app] .ch svg{color:#0A84FF}',
    '[data-owcs-app] .ch.f{background:#C6FF33;box-shadow:0 0 0 2px #0B0B0F}',
    '[data-owcs-app] .ch.f svg{color:#0B0B0F}',
    '[data-owcs-app] .to{color:#8A8A92;font-size:18px;font-weight:800}',
    // the pages style ol / li themselves (borders, padding): reset here
    '[data-owcs-app] .st{list-style:none !important;margin:14px 0 0 !important;padding:0 !important;border:0 !important;background:none !important;box-shadow:none !important;display:flex;flex-direction:column;align-items:stretch !important;gap:8px}',
    '[data-owcs-app] .st li{display:flex !important;justify-content:flex-start !important;text-align:left !important;align-items:flex-start;gap:12px;margin:0 !important;padding:0 !important;border:0 !important;background:none !important}',
    '[data-owcs-app] .st li::before,[data-owcs-app] .st li::after{content:none !important}',
    '[data-owcs-app] .st .sx{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;text-align:left}',
    '[data-owcs-app] .st em{margin-top:5px}',
    // compact: Safari's menu and share sheet cover the lower half of the screen, the card has to fit above them
    '[data-owcs-app] .sheet .am,[data-owcs-app].sheet .am{width:36px;height:36px;border-radius:9px}',
    '[data-owcs-app].sheet .am i{width:12px;height:12px;border-radius:3px}',
    '[data-owcs-app].sheet .pn{padding:16px 16px 14px}',
    '[data-owcs-app] .st em{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#0B0B0F;color:#C6FF33;font-style:normal;font-size:13px;font-weight:800}',
    '[data-owcs-app] .st .ch{height:36px;font-size:14.5px}',
    '[data-owcs-app] .st small{font-size:13px;line-height:1.35;color:#55555C}',
    '[data-owcs-app] .st small b{font-size:inherit;font-weight:800}',
    '[data-owcs-app] .kp{margin:10px 0 0;font-size:13px;color:#55555C}',
    '[data-owcs-app].sheet .bs2{margin-top:12px}',
    '[data-owcs-app].sheet .bs2 button{height:42px}',
    '[data-owcs-app] p{margin:12px 0 0;font-size:14.5px}',
    '[data-owcs-app] .bs2{display:flex;gap:8px;margin-top:16px}',
    '[data-owcs-app] .bs2 a,[data-owcs-app] .bs2 button{flex:1;display:grid;place-items:center;height:46px;border:0;border-radius:14px;background:#F1F1ED;color:#0B0B0F;font:inherit;font-size:15px;font-weight:800;text-decoration:none;cursor:pointer}',
    '[data-owcs-app] .bs2 a{background:#0B0B0F;color:#fff}',
    '[data-owcs-app] .ar{position:fixed;width:88px;height:88px;color:#C6FF33;filter:drop-shadow(0 0 10px rgba(198,255,51,.55)) drop-shadow(0 3px 8px rgba(0,0,0,.6));pointer-events:none}',
    '[data-owcs-app] .ar.bc{left:calc(50% - 44px);bottom:calc(8px + env(safe-area-inset-bottom));animation:owapd 1s ease-in-out infinite}',
    '[data-owcs-app] .ar.br{right:13px;bottom:calc(8px + env(safe-area-inset-bottom));animation:owapd 1s ease-in-out infinite}',
    '[data-owcs-app] .ar.tr{right:6px;top:4px;transform:rotate(180deg);animation:owapu 1s ease-in-out infinite}',
    '@keyframes owapd{50%{transform:translateY(14px)}}',
    '@keyframes owapu{0%,100%{transform:rotate(180deg)}50%{transform:rotate(180deg) translateY(14px)}}',
    // dark mode: the guide stays a white card on a deeper dim, so it stands apart from the dark page (a dark card on the dark page read as one mass, 10-21)
    'html[data-owcs-dark] [data-owcs-app].sheet{background:rgba(0,0,0,.75)}'
  ].join('\n');
  function closeApp() { Array.prototype.forEach.call(document.querySelectorAll('[data-owcs-app]'), function (x) { x.remove(); }); }
  function appGuide() {
    closeApp();
    var s = document.createElement('div'), title, body = '', ext = '', at = 'c', chips;
    s.setAttribute('data-owcs-app', '');
    if (INAPP) {
      title = AT.inT;
      body = '<p>' + AT.inapp + '</p>';
      // KakaoTalk can hand the page to the phone's own browser (Safari / Chrome) itself
      var back = location.origin + location.pathname + '?app=1';
      if (/KAKAOTALK/i.test(UA)) ext = '<a href="kakaotalk://web/openExternal?url=' + encodeURIComponent(back) + '">' + AT.ext + '</a>';
      // other iPhone apps (Google, X ...): iOS 17+ opens x-safari-https:// links in Safari itself
      else if (IOS) ext = '<a href="x-safari-' + back + '">' + AT.ext + '</a>';
    } else {
      // where the first button is: Safari 26's compact bar ⋯ bottom right, older iPhone Safari's share bottom middle,
      // iPad / Chrome / other iPhone browsers / Android browsers top right
      var FIN = ['', AT.fin, AT.hFin], HOME = [I_ADD, AT.home, AT.hHome];
      if (SAFARI26 && !IPAD) { at = 'br'; chips = [[I_MORE, AT.more, AT.hMore], [I_SHARE, AT.share, AT.hShareM], HOME, FIN]; }
      else if (IOS) { at = SAFARI && !IPAD ? 'bc' : 'tr'; chips = [[I_SHARE, AT.share, at === 'bc' ? AT.hShareB : AT.hShareT], HOME, FIN]; }
      else { at = 'tr'; chips = [[I_KEBAB, AT.menu, AT.hMenu], [I_ADD, AT.home, AT.hHomeA]]; }
      title = AT.tip;
      body = '<ol class="st">' + chips.map(function (c, i) {
        return '<li><em>' + (i + 1) + '</em><span class="sx"><span class="ch' + (i ? '' : ' f') + '">' + c[0] + c[1] + '</span><small>' + c[2] + '</small></span></li>';
      }).join('') + '</ol><p class="kp">' + AT.keep + '</p>' + (IOS ? '<p class="kp">' + AT.nohome + '</p>' : '');
    }
    s.className = 'sheet ' + (at === 'c' ? 'c' : at.charAt(0));
    s.innerHTML = '<div class="pn" role="dialog" aria-modal="true" aria-labelledby="owcs-app-t" data-owcs-modal=""><div class="hd2" id="owcs-app-t">' + MARK + title + '</div>' +
      body + '<div class="bs2">' + ext + '<button class="ok" data-owcs-close="">' + AT.ok + '</button></div></div>';
    s.onclick = function (e) {
      if (e.target === s || e.target.closest('.ok')) closeApp();
    };
    document.body.appendChild(s);
  }
  function install() {
    if (BIP && !INAPP) {
      var p = BIP;
      p.prompt();
      p.userChoice.then(function (r) { if (r.outcome === 'accepted') { BIP = null; closeApp(); appSync(); } });
      return;
    }
    appGuide();
  }
  // the top bar's 앱 설치 button (every page; never on a computer)
  function appSync() {
    var w = HW, b = w && w.querySelector('.ab'), show = canAdd() || INAPP;
    if (!w) return;
    if (!b) {
      b = document.createElement('button');
      b.className = 'ab';
      b.setAttribute('aria-label', AT.add);
      b.innerHTML = I_PHONE + '<span class="l">' + AT.add + '</span><span class="s">' + AT.addS + '</span>';
      b.onclick = function (e) { e.stopPropagation(); install(); };
      w.insertBefore(b, w.firstChild);
    }
    if (b.hidden === show) b.hidden = !show;
  }
  function appInit() {
    appHead();
    var s = document.createElement('style');
    s.textContent = acss;
    document.head.appendChild(s);
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('owcs-sw.js').catch(function () {});
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); BIP = e; appSync(); });
    window.addEventListener('appinstalled', function () { BIP = null; closeApp(); appSync(); });
    // arriving from KakaoTalk's 브라우저로 열기 (?app=1): show the guide at once, no second tap on 앱 설치
    if (/[?&]app=1/.test(location.search)) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (x) {}
      setTimeout(function () { if (!INAPP && canAdd()) appGuide(); }, 700);
    }
  }
  appInit();

  // --- status messages for screen readers (검색 결과 없음, 복사됨 ...): one polite live region per page, in the page from
  // the start (a region added together with its text is mostly not read). Pages call window.owcsSay(text) (10-24)
  var SAY = null, sayT = 0;
  function sayBox() {
    if (SAY && SAY.isConnected) return SAY;
    if (!document.body) return null;
    SAY = document.createElement('div');
    SAY.setAttribute('role', 'status');
    SAY.setAttribute('data-owcs-say', '');
    SAY.style.cssText = SAY_CSS;
    document.body.appendChild(SAY);
    return SAY;
  }
  // an open aria-modal dialog hides the rest of the page from screen readers, this region too: there the message goes to
  // a region inside the dialog (put in when it opens, dlgSync below; again here if the dialog was drawn anew)
  function dlgSay() {
    var d = Array.prototype.find.call(document.querySelectorAll('[data-owcs-modal]'), function (x) { return x.offsetWidth > 0; });
    if (!d) return null;
    var r = d.querySelector('[data-owcs-say-dlg]');
    if (!r) {
      r = document.createElement('div');
      r.setAttribute('role', 'status');
      r.setAttribute('data-owcs-say-dlg', '');
      r.style.cssText = SAY_CSS;
      d.appendChild(r);
    }
    return r;
  }
  var SAY_CSS = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
  window.owcsSay = function (text) {
    var t = window.OWCSi18n ? window.OWCSi18n.t(text) : text;   // already in the page's language, not Korean first
    var box = dlgSay() || sayBox();
    if (!box) return;
    clearTimeout(sayT);
    box.textContent = '';   // emptied first, so the same message twice is read twice
    sayT = setTimeout(function () { var b2 = dlgSay() || sayBox(); if (b2) b2.textContent = t; }, 150);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sayBox); else sayBox();

  // --- 본문 바로가기: the first Tab on every page shows a link past the header and menu to the page's content: <main>, or
  // on the dc pages (no <main>) the first section of the screen in view (10-24)
  function skipTarget() {
    var vis = function (x) { return x && x.offsetWidth > 0; };
    var main = Array.prototype.find.call(document.querySelectorAll('main'), vis);
    if (main) return main;
    var scr = Array.prototype.find.call(document.querySelectorAll('#dc-root [data-screen-label]'), vis);
    // past the header, the phone top bar and the 직관 안내 banner (this script's or the home page's own)
    return scr && (Array.prototype.find.call(scr.querySelectorAll('section'), function (x) {
      return vis(x) && !x.closest('header,[data-owcs-mtop],[data-owcs-tk]') && !x.querySelector('a[href*="ticketlink"]');
    }) || scr);
  }
  function skipLink() {
    if (!document.body || document.querySelector('a[data-owcs-skip]')) return;
    var st = document.createElement('style');
    st.textContent = 'a[data-owcs-skip]{position:fixed;left:12px;top:-80px;z-index:2147483000;padding:10px 16px;border-radius:10px;' +
      'background:#0B0B0F;color:#fff;font:700 15px/1.2 Pretendard,system-ui,sans-serif;text-decoration:none;outline:2px solid #C6FF33;outline-offset:2px}' +
      'a[data-owcs-skip]:focus{top:12px}';
    document.head.appendChild(st);
    var a = document.createElement('a');
    a.setAttribute('data-owcs-skip', '');
    a.href = '#';
    a.textContent = '본문 바로가기';
    a.onclick = function (e) {
      e.preventDefault();
      var t = skipTarget();
      if (!t) return;
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
      t.scrollIntoView({ block: 'start' });
    };
    document.body.insertBefore(a, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', skipLink); else skipLink();

  // --- owcs-data.js missing (blocked, not deployed, a failed download): every page then draws empty. A band at the top
  // says so, with a retry. Checked once the page has loaded, when the data script has had its chance to run (10-24)
  function dataNotice() {
    if (window.OWCS || !document.body || !document.querySelector('script[src*="owcs-data.js"]') || document.querySelector('[data-owcs-nodata]')) return;
    var t = function (s) { return window.OWCSi18n ? window.OWCSi18n.t(s) : s; };
    var st = document.createElement('style');
    st.textContent = '[data-owcs-nodata]{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 16px;padding:12px 20px;background:var(--ink,#0B0B0F);color:var(--paper,#F1EDE5);' +
      'font:600 15px/1.45 Pretendard,system-ui,sans-serif;text-align:center}' +
      '[data-owcs-nodata] button{height:36px;padding:0 16px;border:0;border-radius:999px;background:#C6FF33;color:#0B0B0F;font:inherit;font-weight:800;cursor:pointer}';
    document.head.appendChild(st);
    var n = document.createElement('div');
    n.setAttribute('role', 'alert');
    n.setAttribute('data-owcs-nodata', '');
    var msg = document.createElement('span');
    msg.textContent = t('데이터를 불러오지 못했어요. 화면이 비어 있을 수 있어요.');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('다시 시도');
    btn.onclick = function () { location.reload(); };
    n.appendChild(msg);
    n.appendChild(btn);
    var skip = document.querySelector('a[data-owcs-skip]');
    document.body.insertBefore(n, skip ? skip.nextSibling : document.body.firstChild);
  }
  if (document.readyState === 'complete') dataNotice(); else window.addEventListener('load', dataNotice);

  // --- sheets and popovers as dialogs (10-24): the 앱 설치 guide here, the home page's share sheet and calendar
  // popover, the schedule page's calendar popover. Each marks its box [data-owcs-modal] (with role="dialog"
  // aria-modal="true") and its close control [data-owcs-close]. While one is open: focus goes into it, Tab stays in it,
  // Esc presses its close control, and when it goes away focus returns to the button that opened it. The boxes are
  // drawn by the dc runtime or by innerHTML, so this watches the page instead of being called (no <dialog>.showModal())
  var DLG = null, dlgFrom = null, dlgLast = null, focusOut = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  function dlgItems(d) { return Array.prototype.filter.call(d.querySelectorAll(FOCUSABLE), function (x) { return x.offsetWidth > 0 || x.offsetHeight > 0; }); }
  function dlgSync() {
    if (!DLG && !document.querySelector('[data-owcs-modal]')) return;   // the usual case, cheap
    var d = Array.prototype.find.call(document.querySelectorAll('[data-owcs-modal]'), function (x) { return x.offsetWidth > 0; }) || null;
    if (d === DLG) return;
    var redrawn = d && DLG && !DLG.isConnected;   // the same box drawn again (the schedule page redraws on every click)
    // the opener: focused now, or (redrawn together with the box, schedule page) the last thing focused before
    if (d && !DLG) dlgFrom = document.activeElement && document.activeElement !== document.body ? document.activeElement : focusOut;
    DLG = d;
    if (d) {
      var same = redrawn && dlgLast && dlgLast.getAttribute('data-act') ? d.querySelector('[data-act="' + dlgLast.getAttribute('data-act') + '"]' +
        (dlgLast.getAttribute('data-t') ? '[data-t="' + dlgLast.getAttribute('data-t') + '"]' : '')) : null;
      dlgSay();   // its status region, there before any message
      var first = same || dlgItems(d)[0];
      if (first && !d.contains(document.activeElement)) first.focus();
    } else if (dlgFrom && (document.activeElement === document.body || !document.activeElement)) {
      // the opener drawn again meanwhile (schedule page): its new copy, found by data-act
      var to = dlgFrom.isConnected ? dlgFrom : dlgFrom.getAttribute('data-act') &&
        Array.prototype.find.call(document.querySelectorAll('[data-act="' + dlgFrom.getAttribute('data-act') + '"]'), function (x) { return x.offsetWidth > 0; });
      if (to) to.focus();
      dlgFrom = null;
    }
  }
  document.addEventListener('focusin', function (e) { if (DLG && DLG.contains(e.target)) dlgLast = e.target; else focusOut = e.target; });
  document.addEventListener('keydown', function (e) {
    if (!DLG || !DLG.isConnected) return;
    if (e.key === 'Escape') {
      var c = DLG.querySelector('[data-owcs-close]') || Array.prototype.find.call(document.querySelectorAll('[data-owcs-close]'), function (x) { return x.offsetWidth > 0; });
      if (c) { e.preventDefault(); c.click(); }
      return;
    }
    if (e.key !== 'Tab') return;
    var items = dlgItems(DLG);
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && (i < 0 || i === items.length - 1)) { e.preventDefault(); items[0].focus(); }
  }, true);
  new MutationObserver(dlgSync).observe(document.documentElement, { childList: true, subtree: true });

  var busy = false;
  new MutationObserver(function () {
    // until the 직관 안내 banner is in, place at once (before the first paint): put in 50 ms later it pushed the page down
    if (!HOME && !onTickets() && !document.querySelector('[data-owcs-tk]')) { place(); return; }
    if (busy) return;
    busy = true;
    setTimeout(function () { busy = false; place(); }, 50);   // not requestAnimationFrame: it never fires in a background tab
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); else place();
  window.addEventListener('resize', function () { setTimeout(place, 50); });
})();
