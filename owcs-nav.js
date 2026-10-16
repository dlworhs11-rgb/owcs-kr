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
    '@media (max-width:899.98px){[data-owcs-bar]{display:none}}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  // put the bar above the visible header and move the floating 다크 모드 / language switches into it (wide screens;
  // on phones they stay floating). The design runtime re-renders, so this re-checks when the page changes.
  function place() {
    if (window.innerWidth < 900) return;
    var h = Array.prototype.find.call(document.querySelectorAll('header'), function (x) { return x.offsetWidth > 0; });
    if (!h) return;
    // the wordmark's letter spacing as on the home page (.02em)
    Array.prototype.forEach.call(h.querySelectorAll('span,div'), function (x) {
      if (!x.children.length && x.textContent.trim() === 'OWCS KR' && x.style.letterSpacing !== '0.56px') x.style.letterSpacing = '0.56px';
    });
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
})();
