// Optional "Wise" look (from DESIGN-wise.md): sage canvas, white 24px cards, one lime-green accent,
// near-black ink, the default fonts. The default design stays as it is.
// Switch: the floating button (bottom-left), or ?theme=wise / ?theme=default (remembered in this browser).
// ?theme=calm is a second, quieter look (see calm() below); like wise it only applies while the query is on the link.
(function () {
  var KEY = 'owcs-theme';
  var q = new URLSearchParams(location.search).get('theme');
  try { if (q === 'wise' || q === 'default') localStorage.setItem(KEY, q); } catch (e) {}
  var theme = q === 'wise' ? 'wise' : q === 'calm' ? 'calm' : 'default';
  try { localStorage.removeItem(KEY); } catch (e) {}   // drop a Wise choice remembered from the old switch

  // ?theme=calm (10-24): a quieter second look for comparison. No hatch, lime only on the primary CTA and NEXT, one red
  // (#D92D20) for LIVE and the last-chance line, radii 8 / 14 / 999, display titles ~48px, one flat card style.
  // Colours that are not named here stay as the default look. Not sticky: the query has to be on the link, as with wise.
  function calm() {
    document.documentElement.setAttribute('data-owcs-theme', 'calm');
    // html:root[..][..] outranks the page's own html[data-owcs-bgb]:not([data-owcs-dark]) rules (owcs-theme.js / owcs-dark.js)
    var C = 'html:root[data-owcs-theme="calm"][data-owcs-theme] ';
    var LIME = ['[style*="background: var(--ac2"]', '[style*="background: rgb(198, 255, 51)"]'];
    var KEEP = ':not([style*="letter-spacing: 0.04em"]):not([style*="height: 40px"]):not([style*="height: 36px"])';   // NEXT, the CTAs
    var TITLE = 'clamp(40px,4vw,48px) !important';
    var rules = [
      // red: LIVE, last-chance line and labels share one value
      C + '#dc-root,' + C + '#dc-root [style*="--ac"]{--pi:#D92D20 !important}',
      C + 'span[style*="background: var(--pi"]{color:#fff !important}',
      C + '.ax em,' + C + '.m .ax2{background:#D92D20 !important}',
      C + '.tab .now{background:#D92D20 !important}',
      // no hatch (page paper, bars, placeholders, the ticket page glows)
      C + 'body{background-image:none !important}',
      C + '#dc-root [data-screen-label],' + C + '[data-owcs-mtop],' + C + '[data-owcs-tk].m,' + C + 'body.ticket-page .next{background-image:none !important}',
      C + '[style*="repeating-linear-gradient"]{background-image:none !important;background-color:rgba(128,128,140,.18) !important}',
      C + '[style*="repeating-linear-gradient"][style*="rgba(255, 255, 255"]{background-color:rgba(255,255,255,.12) !important}',
      C + '[style*="repeating-linear-gradient"][style*="rgb(26, 26, 32)"],' + C + '[style*="repeating-linear-gradient"][style*="rgb(36, 36, 43)"]{background-color:#1B1B21 !important}',
      // no glass
      C + '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}',
      C + 'header{background-color:rgba(255,255,255,.97) !important}',
      'html:root[data-owcs-theme="calm"][data-owcs-dark] body.streams-page header,html:root[data-owcs-theme="calm"][data-owcs-dark] body.ticket-page header{background-color:rgba(14,14,18,.97) !important}',
      // lime: only the primary CTA and NEXT keep it. Chips and badges turn neutral / green, text on dark turns light
      C + LIME.map(function (s) { return s + KEEP; }).join(',' + C) + '{background:#F6F3EC !important;color:#0B0B0F !important;outline:1px solid #D9D5CA;outline-offset:-1px}',
      C + '[style*="color: var(--ac2"]:not([data-tl]),' + C + '[style*="color: rgb(198, 255, 51)"]{color:#fff !important}',   /* [data-tl]: the date label owcs-theme.js inks on light days */
      C + '[style*="border: 1px solid var(--ac2"]{border-color:#fff !important}',
      C + '[style*="color: rgb(212, 212, 218)"]{color:#9C9CA8 !important}',
      C + '[data-owcs-tk] .k,' + C + '.ib .k,' + C + '.ib .ts em{color:#C9C9D1 !important}',
      C + '.ib:before{background:#fff !important}',
      C + '.ib .dd2{background:#fff !important}',
      C + '.dd .tag{color:#fff !important}',
      C + '.gm.now .v,' + C + '[style*="background: var(--ac2"] > span > span[style*="opacity: 0.55"]{opacity:.8 !important}',   /* "vs" in the today chips: AA on the pale chip */
      C + '.gm.now{background:#F6F3EC !important;outline:1px solid #D9D5CA;outline-offset:-1px}',
      C + '.ct.sure,' + C + 'body.ticket-page .b-open{background:#2E9E5B !important;color:#0B0B0F !important}',
      C + 'body.ticket-page .list li:before{background:var(--mute) !important}',
      'html:root[data-owcs-theme="calm"][data-owcs-dark] body a[data-owcs-nv][data-owcs-nv].cur{--nvu:#F2F2F5 !important}',   /* menu underline: lime stays on the CTA */
      // display titles
      C + '.hero h1,' + C + 'main h1,' + C + '.title h2,' + C + '#tournament h3{font-size:' + TITLE + '}',
      C + 'h1[style*="96px"],' + C + 'h2[style*="96px"],' + C + 'h2[style*="72px"],' + C + 'h2[style*="60px"],' + C + 'h2[style*="56px"],' + C + 'h2[style*="46px"],' + C + 'h2[style*="44px"]{font-size:' + TITLE + '}',
      // flat cards: 14px, no shadow
      C + '.done-note,' + C + '.wk,' + C + '.csbox,' + C + '.ib,' + C + '.calbox,' + C + '.lc,' + C + '.m,' + C + '.subpop,' +
        C + '.count,' + C + '.team,' + C + '.p,' + C + 'body.ticket-page .next,' + C + 'body.ticket-page .card,' + C + 'body.ticket-page .map,' +
        C + 'body.ticket-page .st,' + C + 'body.ticket-page .tablewrap,' + C + 'body.ticket-page .age,' + C + '[data-owcs-tk] a{border-radius:14px !important}',
      C + '.tab,' + C + '.subb,' + C + '.calbar button,' + C + '.cc,' + C + '.gm,' + C + '.ct,' + C + '.ax em,' + C + '.m .ax2,' + C + '.csbox .tie,' +
        C + '.subpop .lk a,' + C + '.subpop .lk>button,' + C + '.subpop .tg5 button,' + C + '.subpop .seg button,' + C + '.brand i,' +
        C + 'body.ticket-page .cta,' + C + '[data-owcs-tk] img,' + C + '[data-owcs-hw] .lb,' + C + '[data-owcs-hw] .mb,' + C + '[data-owcs-hw] .ab{border-radius:8px !important}',
      C + '[data-owcs-hw] .dd{border-radius:14px !important}',
      C + '.card,' + C + '.wk,' + C + '.csbox,' + C + '.team,' + C + '.next,' + C + '.map,' + C + '.st,' + C + '.tablewrap{box-shadow:none !important}'
    ];
    // inline radii (home, results, player) -> 8 / 14; pills, circles and 2-4px marks stay
    var to8 = [5, 6, 7, 9, 10, 11, 12], to14 = [13, 14, 16, 18, 20, 22, 24, 32];
    to8.forEach(function (n) { rules.push(C + '[style*="border-radius: ' + n + 'px;"]:not([data-screen-label]){border-radius:8px !important}'); });
    to14.forEach(function (n) { rules.push(C + '[style*="border-radius: ' + n + 'px;"]:not([data-screen-label]){border-radius:14px !important}'); });
    var st = document.createElement('style');
    st.textContent = rules.join('\n');
    (document.head || document.documentElement).appendChild(st);
  }

  // switch button, on every page
  function button() {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = theme === 'wise' ? '디자인: Wise → 기본으로' : '디자인: 기본 → Wise로';
    b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9999;height:40px;padding:0 16px;border-radius:24px;border:1px solid #0e0f0c;' +
      'background:' + (theme === 'wise' ? '#9fe870' : '#fff') + ';color:#0e0f0c;font:600 14px Pretendard,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18)';
    b.onclick = function () {
      var next = theme === 'wise' ? 'default' : 'wise';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      var u = new URL(location.href); u.searchParams.delete('theme'); location.href = u.toString();
    };
    document.body.appendChild(b);
  }
  // the on-page switch button is gone; ?theme=wise still opens the Wise look for a one-off comparison
  if (theme === 'calm') { calm(); return; }
  if (theme !== 'wise') return;

  document.documentElement.setAttribute('data-owcs-theme', 'wise');
  var W = 'html[data-owcs-theme="wise"] ';
  var css = [
    // design tokens (override the page's own variables, including the inline ones on the root element)
    W + '#dc-root,' + W + '#dc-root [style*="--ac"]{--ac:#163300 !important;--ac2:#9fe870 !important;--pi:#d03238 !important;' +
      '--paper:#ffffff !important;--paper2:#e8ebe6 !important;--paper3:#e8ebe6 !important;--line:#d9ddd6 !important;--ink:#0e0f0c !important;--mute:#454745 !important;' +
      '}',
    // fonts stay the default ones (Barlow Condensed display, Pretendard body); only the colours change.
    // The default diagonal texture and edge fades stay on and pick up the green accent through --ac.
    W + 'body{background:#e8ebe6 !important}',
    W + '[data-owcs-bg="dark"]{background-color:#0e0f0c !important}',
    W + '[data-owcs-bg="dark"] h2{color:#9fe870 !important}',                           /* hero-band-dark: green headline on ink */
    W + '[data-owcs-bg="card"]{background-color:#1b1d19 !important}',
    // ink buttons on light bands -> lime pill (button-primary)
    W + '[data-owcs-bg="light"] button[style*="background: rgb(11, 11, 15)"],' + W + '[data-owcs-bg="light"] a[style*="background: rgb(11, 11, 15)"]{background-color:#9fe870 !important;color:#0e0f0c !important;border-radius:24px !important}',
    // purple tints from the default look -> Wise greens
    W + '[style*="rgb(240, 234, 253)"],' + W + '[style*="rgb(239, 233, 252)"]{background-color:#e2f6d5 !important}',
    W + '[style*="rgb(91, 34, 194)"]{color:#163300 !important}',
    W + '[style*="rgb(125, 57, 235)"]{border-color:#163300 !important}',
    // pages that hard-code the default purple / lime instead of using the variables
    W + '[style*="; color: rgb(125, 57, 235)"],' + W + '[style^="color: rgb(125, 57, 235)"]{color:#163300 !important}',
    W + '[style*="background: rgb(125, 57, 235)"]{background-color:#163300 !important}',
    W + '[style*="background: rgb(198, 255, 51)"]{background-color:#9fe870 !important}',
    W + '[style*="; color: rgb(198, 255, 51)"],' + W + '[style^="color: rgb(198, 255, 51)"]{color:#9fe870 !important}',
    // cards: 24px radius
    W + '#dc-root [style*="border-radius: 20px"]:not([data-screen-label]),' + W + '#dc-root [style*="border-radius: 18px"]:not([data-screen-label]){border-radius:24px !important}',
    // OWCS KR 직관.html (its own variables)
    W + 'body.ticket-page{--bg:#e8ebe6;--panel:#ffffff;--line:#d9ddd6;--ink:#0e0f0c;--mute:#454745;--dim:#686a67;--ac:#163300;--ac2:#9fe870;color:#0e0f0c;background-image:radial-gradient(90% 60% at 0% 0%,rgba(159,232,112,.3),transparent 60%),repeating-linear-gradient(135deg,rgba(14,15,12,.035) 0 1px,transparent 1px 12px) !important}',
    W + 'body.ticket-page header{background:rgba(255,255,255,.92)}',
    W + 'body.ticket-page .brand i{background:#0e0f0c}',
    W + 'body.ticket-page nav a{color:#454745}' + W + 'body.ticket-page nav a:hover,' + W + 'body.ticket-page nav a.on{background:#e2f6d5;color:#0e0f0c}',
    W + 'body.ticket-page .eyebrow,' + W + 'body.ticket-page .title .ko{color:#163300}',
    W + 'body.ticket-page .chip{background:#fff;border-color:#d9ddd6}' + W + 'body.ticket-page .chip b{color:#163300}',
    W + 'body.ticket-page .card,' + W + 'body.ticket-page .tablewrap,' + W + 'body.ticket-page .st{background:#fff;border-color:transparent;border-radius:24px}',
    W + 'body.ticket-page .next{background:#0e0f0c;color:#fff;border:0;border-radius:24px}' + W + 'body.ticket-page .next .v{color:#9fe870}',
    W + 'body.ticket-page .cta{border-radius:24px}' + W + 'body.ticket-page .cta.ghost{color:#0e0f0c;border-color:#0e0f0c;background:#fff}' + W + 'body.ticket-page .next .cta.ghost{color:#fff;border-color:#fff;background:transparent}',
    W + 'body.ticket-page .list li{color:#454745}' + W + 'body.ticket-page .list li:before{background:#163300}' + W + 'body.ticket-page .list li.warn{color:#a72027}',
    W + 'body.ticket-page .open .card ul{color:#454745}' + W + 'body.ticket-page .open .card ul b{color:#0e0f0c}',
    W + 'body.ticket-page th{border-bottom-color:#0e0f0c;color:#454745}' + W + 'body.ticket-page tr.today td{background:#e2f6d5}',
    W + 'body.ticket-page .b-open{background:#9fe870}' + W + 'body.ticket-page .b-soon{border-color:#0e0f0c;color:#0e0f0c}' + W + 'body.ticket-page .b-closed{background:#e8ebe6;color:#454745}',
    W + 'body.ticket-page .age{background:#fff;border-color:#d03238}' + W + 'body.ticket-page .age .big{color:#d03238}',
    W + 'body.ticket-page .next .k,' + W + 'body.ticket-page .next .s{color:#c9cbc7}' + W + 'body.ticket-page .map{border-color:transparent;border-radius:24px;background:#fff}' + W + 'body.ticket-page .map iframe{filter:none}',
    W + 'body.ticket-page footer{background:#0e0f0c;color:#c9cbc7;border:0}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
