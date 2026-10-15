// Optional "Wise" look (from DESIGN-wise.md): sage canvas, white 24px cards, one lime-green accent,
// near-black ink, the default fonts. The default design stays as it is.
// Switch: the floating button (bottom-left), or ?theme=wise / ?theme=default (remembered in this browser).
(function () {
  var KEY = 'owcs-theme';
  var q = new URLSearchParams(location.search).get('theme');
  try { if (q === 'wise' || q === 'default') localStorage.setItem(KEY, q); } catch (e) {}
  var theme = q === 'wise' ? 'wise' : 'default';
  try { localStorage.removeItem(KEY); } catch (e) {}   // drop a Wise choice remembered from the old switch

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
