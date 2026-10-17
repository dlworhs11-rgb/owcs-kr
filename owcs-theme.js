// Textured section backgrounds (accent glow + fine diagonal lines) for the OWCS KR pages.
// Tags each section / footer as dark or light from its computed colour (so dark mode works too)
// and paints the texture as a background-image layer; the design's own colours stay underneath.
(function () {
  var css = [
    '[data-owcs-bg="dark"]{background-image:',
    '  radial-gradient(90% 120% at 0% 0%, color-mix(in srgb, var(--ac,#7D39EB) 18%, transparent), transparent 60%),',
    '  radial-gradient(70% 90% at 100% 100%, color-mix(in srgb, var(--ac,#7D39EB) 7%, transparent), transparent 65%),',
    '  repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 1px, transparent 1px 12px) !important}',
    '[data-owcs-bg="card"]{background-image:',
    '  linear-gradient(120deg, color-mix(in srgb, var(--ac,#7D39EB) 24%, transparent), transparent 55%),',
    '  repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 1px, transparent 1px 10px) !important}',
    '[data-owcs-bg="light"]{background-image:repeating-linear-gradient(135deg, rgba(11,11,15,.026) 0 1px, transparent 1px 12px) !important}',
    /* dark mode: the page bands stay plain dark surfaces; only the real feature band (today) keeps the glow + lime edges */
    '[data-owcs-bg="surface"]{background-image:repeating-linear-gradient(135deg, rgba(255,255,255,.022) 0 1px, transparent 1px 12px) !important}',
    /* one page, not stacked slabs: the diagonal lines are pinned to the viewport so they run straight across
       section edges, and a dark band fades in from the colour of its light neighbours (set by tag() below) */
    '[data-owcs-bg="dark"]{background-attachment:scroll,scroll,fixed !important;position:relative;isolation:isolate}',
    '[data-owcs-bg="light"],[data-owcs-bg="surface"]{background-attachment:fixed !important;position:relative;isolation:isolate}',
    '[data-owcs-bg="surface"]{--owcs-line:rgba(255,255,255,.08)}',
    /* section edges: a crisp cut plus one thin line that fades out toward both sides (no colour smear) */
    '[data-owcs-bg]::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;z-index:1;background:linear-gradient(90deg, transparent, var(--owcs-line, rgba(11,11,15,.12)) 30%, var(--owcs-line, rgba(11,11,15,.12)) 70%, transparent)}',
    '[data-owcs-bg="dark"]::before{height:2px;--owcs-line:color-mix(in srgb, var(--ac2,#C6FF33) 70%, transparent)}',
    '[data-owcs-bg="dark"]::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;pointer-events:none;z-index:1;background:linear-gradient(90deg, transparent, color-mix(in srgb, var(--ac2,#C6FF33) 70%, transparent) 30%, color-mix(in srgb, var(--ac2,#C6FF33) 70%, transparent) 70%, transparent)}',
    '[data-owcs-bg][data-owcs-first]::before,footer[data-owcs-bg]::after{display:none}',
    /* gray version: one soft charcoal, no purple glow, quiet edges */
    '[data-tm~="gray"] section[data-today]{background-color:var(--paper,#fff) !important;background-image:none !important}',
    '[data-tm~="gray"] section[data-today] [data-tbox]{background-image:repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 1px, transparent 1px 12px)}',
    '[data-tm~="gray"] section[data-today]::before,[data-tm~="gray"] section[data-today]::after{display:none !important}',
    '[data-tm~="gray"] section[data-today] [data-tcard]{background:#3C3C45;border-color:#4A4A54 !important}',
    '[data-tm~="gray"] section[data-today] [data-tscreen]{background:#24242B !important}',
    '[data-tm~="gray"] section[data-today] [data-owcs-bg="card"]{background-image:none !important}',
    '[data-tm~="gray"] section[data-today] [data-tbox] [style*="color: rgb(181, 181, 189)"]{color:#D6D6DC !important}',
    /* light mode: the upcoming-match cards are very light grey cards inside the charcoal box */
    '[data-tm="gray"] section[data-today] [data-tcard]{background:#F1F1EE !important;border-color:transparent !important;color:#0B0B0F}',
    '[data-tm="gray"] section[data-today] [data-tcard] [style*="color: rgb(181, 181, 189)"]{color:#55555C !important}',
    '[data-tm="gray"] section[data-today] [data-tcard] a{color:#0B0B0F !important;border-color:rgba(11,11,15,.22) !important;background:#fff}',
    /* today's band, light version: page paper; only the stream, scoreboard and map rows stay dark screens */
    '[data-tm="light"] section[data-today]{background-color:var(--paper2,#F6F6F3) !important;color:var(--ink,#0B0B0F) !important}',
    '[data-tm="light"] section[data-today] [data-tl]{color:var(--mute,#55555C) !important}',
    '[data-tm="light"] section[data-today] [data-tcard]{background:var(--paper,#fff);border-color:var(--line,#E6E6E1) !important}',
    '[data-tm="light"] section[data-today] [data-tcard] [style*="rgb(181, 181, 189)"]{color:var(--mute,#55555C) !important}',
    '[data-tm="light"] section[data-today] [data-tcard] [style*="border: 1px solid rgb(255, 255, 255)"]{border-color:var(--ink,#0B0B0F) !important;color:var(--ink,#0B0B0F) !important}',
    '[data-tm="light"] section[data-today] [data-tcard] [style*="border: 1.5px solid rgb(255, 255, 255)"]{border-color:var(--ink,#0B0B0F) !important}',
    '[data-tm="light"] section[data-today] [data-tscreen]{background:#15151B !important;color:#fff !important}',
    '[data-tm="light"] section[data-today] [style*="background: rgb(21, 21, 27)"],[data-tm="light"] section[data-today] [style*="background: rgb(20, 20, 25)"]{color:#fff}',
  ].join('\n');
  // Site mode (default): the design file is a canvas of fixed-width mock screens side by side.
  // Show only the screen for this viewport, full width, without the canvas labels.
  // ?canvas=1 shows the original design canvas.
  if (new URLSearchParams(location.search).get('canvas') !== '1') {
    var D = '[data-screen-label$="Desktop"]';
    var M = '[data-screen-label="Mobile"],[data-screen-label$=" Mobile"]';
    // the canvas section sits right under the runtime host, or one wrapper div deeper
    var CANVAS = ['#dc-root .sc-host > section', '#dc-root .sc-host > div > section'];
    var wrapOf = function (sel) { return sel.split(',').map(function (s) { return '#dc-root div:has(> ' + s + ')'; }).join(','); };
    css += [
      '',
      'html,body{background:#0B0B0F !important}',
      CANVAS.map(function (c) { return c + '{padding:0 !important;gap:0 !important}'; }).join(''),
      CANVAS.map(function (c) { return c + ' > div:first-child{display:none !important}'; }).join(''),   /* canvas title row */
      CANVAS.map(function (c) { return c + ' > div:nth-child(2){display:block !important}'; }).join(''), /* screens row */
      '#dc-root div:has(> [data-screen-label]){gap:0 !important}',
      '#dc-root div:has(> [data-screen-label]) > div:first-child:not([data-screen-label]){display:none !important}', /* "6a 데스크톱" labels */
      '#dc-root div:has(> [data-screen-label]){display:none !important}',
      '#dc-root [data-screen-label]{width:100% !important;max-width:none !important;border-radius:0 !important;border:0 !important;box-shadow:none !important}',
      '@media (min-width:900px){' + wrapOf(D) + '{display:flex !important}}',
      '@media (max-width:899.98px){' + wrapOf(M) + '{display:flex !important}}',
      /* desktop: content in a centred column (about 15% margin each side on a 1920 screen); backgrounds stay full width */
      '@media (min-width:900px){#dc-root ' + D + ' > *{padding-left:max(56px, calc(50% - 680px)) !important;padding-right:max(56px, calc(50% - 680px)) !important;--padx:max(56px, calc(50% - 680px))}}',
      /* today's box reaches 48px past the content column, so what is inside keeps the same width as the other bands */
      '@media (min-width:900px){#dc-root ' + D + ' > section[data-today]{padding-left:max(8px, calc(50% - 728px)) !important;padding-right:max(8px, calc(50% - 728px)) !important}}'
    ].join('\n');
  }
  // "B" background (home page): one warm paper sheet with fine hatching from the top bar to the footer; sections
  // lose their own fills, edge lines and glows and are told apart by spacing only. ?bg=old shows the previous look.
  if (/Home/.test(decodeURIComponent(location.pathname).split('/').pop()) && new URLSearchParams(location.search).get('bg') !== 'old') {
    var H = 'html[data-owcs-bgb] ';
    document.documentElement.setAttribute('data-owcs-bgb', '');
    css += '\n' + [
      'html[data-owcs-bgb],html[data-owcs-bgb] body{background:#F1EDE5 !important}',
      H + '#dc-root [data-screen-label]{--sheet:#F1EDE5;--hatch:rgba(60,45,25,.045);background:var(--sheet) repeating-linear-gradient(135deg, var(--hatch) 0 1px, transparent 1px 11px) fixed !important}',
      H + '#dc-root [style*="--paper: #16161C"] [data-screen-label]{--sheet:#13110E;--hatch:rgba(255,255,255,.03)}',   /* dark mode */
      'html[data-owcs-bgb]:has([style*="--paper: #16161C"]),html[data-owcs-bgb]:has([style*="--paper: #16161C"]) body{background:#13110E !important}',
      H + '#dc-root [data-screen-label] section,' + H + '#dc-root [data-screen-label] footer,' + H + '#dc-root [data-screen-label] > div:first-child,' + H + '#dc-root [data-screen-label] > header{background:transparent !important;background-image:none !important}',
      H + '[data-owcs-bg]::before,' + H + '[data-owcs-bg]::after{display:none !important}',
      // today: content back to the normal column; the dark screens (stream, score, map rows) stay as cards
      H + '[data-tm="light"] section[data-today] [data-tbox]{background:transparent !important;background-image:none !important;color:inherit !important;border:2px solid color-mix(in srgb, var(--ink,#0B0B0F) 22%, transparent);border-radius:28px !important;padding:39px 46px 47px !important}',
      '@media (min-width:900px){' + H + '#dc-root [data-screen-label] > section[data-today]{padding:40px max(8px, calc(50% - 728px)) 72px !important}}',
      '@media (max-width:899.98px){' + H + '#dc-root [data-screen-label] > section[data-today]{padding:20px 8px 32px !important}' + H + '[data-tm="light"] section[data-today] [data-tbox]{border-radius:20px !important;padding:23px 11px 27px !important}}',
      H + '[data-tm="light"] section[data-today] [data-tcard] a{color:var(--ink,#0B0B0F) !important;border-color:color-mix(in srgb, var(--ink,#0B0B0F) 25%, transparent) !important}',
      // footer on the sheet: ink text instead of white
      H + 'footer{color:var(--ink,#0B0B0F) !important;border-top:0 !important}',
      H + 'footer [style*="color: rgb(255, 255, 255)"]{color:var(--ink,#0B0B0F) !important}',
      H + 'footer [style*="color: rgb(138, 138, 147)"],' + H + 'footer [style*="color: rgb(181, 181, 189)"],' + H + 'footer [style*="color: rgb(201, 201, 209)"]{color:var(--mute,#55555C) !important}'
    ].join('\n');
  }
  // dark mode on the other pages (results, player): the same dark sheet as the home page, bands without their own fills
  var darkQ = new URLSearchParams(location.search).get('dark'), darkOn = darkQ === '1';
  if (darkQ !== '0' && darkQ !== '1') { try { darkOn = localStorage.getItem('owcs-dark') === '1'; } catch (e) {} }
  if (!/Home/.test(decodeURIComponent(location.pathname).split('/').pop()) && darkOn) {
    var X = 'html[data-owcs-bgb][data-owcs-dark] ';
    document.documentElement.setAttribute('data-owcs-bgb', '');
    css += '\n' + [
      'html[data-owcs-bgb][data-owcs-dark],html[data-owcs-bgb][data-owcs-dark] body{background:#13110E !important}',
      X + '#dc-root [data-screen-label]{background:#13110E repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 1px, transparent 1px 11px) fixed !important}',
      X + '#dc-root [data-screen-label] section,' + X + '#dc-root [data-screen-label] footer,' + X + '#dc-root [data-screen-label] > header{background:transparent !important;background-image:none !important}',
      X + '[data-owcs-bg]::before,' + X + '[data-owcs-bg]::after{display:none !important}'
    ].join('\n');
  }
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var SCREENS = '#dc-root [data-screen-label]:not([data-screen-label="Components"])';
  function lum(el) {
    var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!m || (m.length > 3 && +m[3] === 0)) return null;
    return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
  }
  function set(el, v) { if (el.getAttribute('data-owcs-bg') !== v) el.setAttribute('data-owcs-bg', v); }
  function tag() {
    document.querySelectorAll(SCREENS + ' section, ' + SCREENS + ' footer').forEach(function (band) {
      var l = lum(band);
      if (l == null) return;
      // a band painted with the theme paper (var(--paper…)) is a page surface even when dark mode makes it dark
      var themed = /var\(--paper|background: rgb\((255, 255, 255|246, 246, 243)\)/.test(band.getAttribute('style') || '');   // page paper, darkened by dark mode
      set(band, l >= 0.3 ? 'light' : themed ? 'surface' : 'dark');
      if (themed) l = Math.max(l, 0.3);
      // edge line: skip it on the first band, and on a light band right under a dark one
      // (the dark band already draws its bottom line there)
      var prev = band.previousElementSibling, pl = prev ? lum(prev) : null;
      var noLine = pl == null || (l >= 0.3 && pl < 0.3);
      if (noLine !== band.hasAttribute('data-owcs-first')) { if (noLine) band.setAttribute('data-owcs-first', ''); else band.removeAttribute('data-owcs-first'); }
      if (l >= 0.3) return;
      // raised panels inside dark bands (score box, countdown, map cards)
      band.querySelectorAll('div').forEach(function (d) {
        var c = getComputedStyle(d).backgroundColor;
        if (c === 'rgb(21, 21, 27)' && d.offsetHeight > 80) set(d, 'card');
      });
    });
  }
  var queued = false;
  function soon() { if (queued) return; queued = true; setTimeout(function () { queued = false; tag(); }, 60); }
  // page#standings etc.: the target only exists after the runtime renders, so scroll once it appears
  function jumpToHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var tries = 0, t = setInterval(function () {
      var el = document.querySelector('#dc-root [id="' + id + '"]');
      if (el || ++tries > 50) { clearInterval(t); if (el) el.scrollIntoView({ block: 'start' }); }
    }, 100);
  }
  function start() {
    jumpToHash();
    tag();
    new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// Standings / players on their own page: the home page opened with ?view=standings or ?view=teams shows only its top
// (tool bar, header, 직관 안내) and that one section, in every layout. The home page itself is unchanged; the menus on
// every page link here instead of scrolling the home page.
(function () {
  if (!/Home/.test(decodeURIComponent(location.pathname).split('/').pop())) return;
  var view = new URLSearchParams(location.search).get('view');
  var KEY = { standings: 'STANDINGS', teams: 'TEAMS' }[view];
  if (!KEY) return;
  document.documentElement.setAttribute('data-owcs-view', view);
  var st = document.createElement('style');
  st.textContent = 'html[data-owcs-view] #dc-root [data-screen-label] > section[data-owcs-off]{display:none !important}';
  (document.head || document.documentElement).appendChild(st);
  function mark() {
    Array.prototype.forEach.call(document.querySelectorAll('#dc-root [data-screen-label] > section'), function (s) {
      var keep = s.querySelector('a[href*="ticketlink"]') || (s.textContent.indexOf(KEY) >= 0 && s.textContent.indexOf(KEY) < 80);
      if (keep) s.removeAttribute('data-owcs-off');
      else if (!s.hasAttribute('data-owcs-off')) s.setAttribute('data-owcs-off', '');
    });
  }
  var busy = false;
  function soon() { if (busy) return; busy = true; setTimeout(function () { busy = false; mark(); }, 30); }
  function start() { mark(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
