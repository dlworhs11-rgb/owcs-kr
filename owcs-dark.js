// Site-wide dark mode for the pages other than home (results, player, tickets, streams).
// The choice is shared with the home page's 다크 모드 switch (localStorage 'owcs-dark' = '1' / '0'),
// so whatever was picked last stays on every page and on the next visit. ?dark=1 / ?dark=0 also sets it.
(function () {
  var KEY = 'owcs-dark';
  var q = new URLSearchParams(location.search).get('dark');
  var on = false;
  try { if (q === '1' || q === '0') localStorage.setItem(KEY, q); on = localStorage.getItem(KEY) === '1'; } catch (e) { on = q === '1'; }
  var html = document.documentElement;
  if (on) html.setAttribute('data-owcs-dark', '');

  var D = 'html[data-owcs-dark] ';
  var R = D + '#dc-root [data-screen-label] ';          // design-runtime pages (results, player): inline styles
  var NOT_LIME = ':not([style*="background: rgb(198, 255, 51)"]):not([style*="background: var(--ac2"])';
  var css = [
    D + 'body{background:#0E0E12}',
    // --- results / player: remap the light paper, ink text and hairlines written inline ---
    D + '#dc-root [data-screen-label]{background:#0E0E12 !important;color:#F2F2F5}',
    R + '[style*="background: rgb(255, 255, 255)"]{background-color:#16161C !important}',
    R + '[style*="background: rgb(246, 246, 243)"],' + R + '[style*="background: rgb(231, 231, 226)"]{background-color:#0E0E12 !important}',
    R + '[style*="background: rgb(241, 241, 237)"],' + R + '[style*="background: rgb(236, 236, 232)"],' + R + '[style*="background: rgb(242, 242, 238)"],' + R + '[style*="background: rgb(241, 238, 251)"]{background-color:#24242C !important}',
    R + '[style*="color: rgb(11, 11, 15)"]' + NOT_LIME + '{color:#F2F2F5 !important}',
    R + '[style*="color: rgb(85, 85, 92)"],' + R + '[style*="color: rgb(107, 107, 114)"]{color:#A3A3AD !important}',
    R + '[style*="color: rgb(125, 57, 235)"],' + R + '[style*="color: rgb(91, 34, 194)"]{color:#B89BFF !important}',
    R + '[style*="rgb(230, 230, 225)"],' + R + '[style*="rgb(236, 236, 231)"],' + R + '[style*="rgb(225, 225, 219)"],' + R + '[style*="rgb(240, 240, 235)"]{border-color:#2E2E37 !important}',
    R + '[style*="solid rgb(11, 11, 15)"]{border-color:#F2F2F5 !important}',
    R + 'header{background:#16161C !important;border-color:#2E2E37 !important}',
    R + 'header a[style*="color: rgb(11, 11, 15)"]{color:#F2F2F5 !important}',
    R + 'input{background:#16161C !important;color:#F2F2F5 !important;border-color:#2E2E37 !important}',
    // --- streams page (its own variables) ---
    D + 'body.streams-page{--bg:#0E0E12;--panel:#16161C;--line:#2E2E37;--ink:#F2F2F5;--mute:#A3A3AD;--dim:#8E8E98;color:#F2F2F5;background-image:radial-gradient(90% 60% at 0% 0%,color-mix(in srgb,var(--ac) 22%,transparent),transparent 60%),radial-gradient(60% 50% at 100% 40%,color-mix(in srgb,var(--red) 10%,transparent),transparent 65%),repeating-linear-gradient(135deg,rgba(255,255,255,.028) 0 1px,transparent 1px 12px)}',
    D + 'body.streams-page header{background:rgba(14,14,18,.9)}',
    D + 'body.streams-page .brand i{background:#F2F2F5}',
    D + 'body.streams-page nav a:hover,' + D + 'body.streams-page nav a.on{background:#24242C;color:#F2F2F5}',
    D + 'body.streams-page .count b{color:#F2F2F5}',
    D + 'body.streams-page .team,' + D + 'body.streams-page .count{background:#16161C}',
    D + 'body.streams-page .p{border-bottom-color:#24242C}' + D + 'body.streams-page .p:hover{background:#1C1C23}',
    D + 'body.streams-page .av{background-color:#24242C;color:#C9C9CF}',
    D + 'body.streams-page .go.chzzk{color:#5BEA87}' + D + 'body.streams-page .go.soop{color:#8FB4FF}' + D + 'body.streams-page .go.none{background:#24242C}',
    D + 'body.streams-page .eyebrow{color:#B89BFF}',
    // --- tickets page (its own variables) ---
    D + 'body.ticket-page{--bg:#0E0E12;--panel:#16161C;--line:#2E2E37;--ink:#F2F2F5;--mute:#A3A3AD;--dim:#8E8E98;color:#F2F2F5;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.022) 0 1px,transparent 1px 12px)}',
    D + 'body.ticket-page header{background:rgba(14,14,18,.9)}',
    D + 'body.ticket-page .brand i{background:#F2F2F5}',
    D + 'body.ticket-page nav a:hover,' + D + 'body.ticket-page nav a.on{background:#24242C;color:#F2F2F5}',
    D + 'body.ticket-page .chip,' + D + 'body.ticket-page .card,' + D + 'body.ticket-page .tablewrap,' + D + 'body.ticket-page .st,' + D + 'body.ticket-page .map{background:#16161C}',
    D + 'body.ticket-page .eyebrow,' + D + 'body.ticket-page .title .ko,' + D + 'body.ticket-page .chip b{color:#B89BFF}',
    D + 'body.ticket-page .cta.ghost{color:#F2F2F5;border-color:#F2F2F5}',
    D + 'body.ticket-page .next{border:1px solid #2E2E37}',
    D + 'body.ticket-page th{border-bottom-color:#F2F2F5}',
    D + 'body.ticket-page .list li,' + D + 'body.ticket-page .open .card ul{color:#C9C9CF}',
    D + 'body.ticket-page .open .card ul b{color:#F2F2F5}',
    D + 'body.ticket-page .b-soon{border-color:#F2F2F5;color:#F2F2F5}' + D + 'body.ticket-page .b-closed{background:#24242C;color:#A3A3AD}',
    D + 'body.ticket-page .age{background:color-mix(in srgb,#D92D20 12%,#16161C)}' + D + 'body.ticket-page .age .big{color:#FF8A80}',
    D + 'body.ticket-page .dots span:nth-child(2){border-bottom-color:#3A3A44}',
    D + 'body.ticket-page .map iframe{filter:invert(.92) hue-rotate(180deg) saturate(.6) contrast(.9)}',
    D + 'body.ticket-page tr.today td{background:color-mix(in srgb,#7D39EB 18%,transparent)}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || html).appendChild(st);

  // switch (the home page has its own 다크 모드 toggle)
  function button() {
    if (/Home/.test(decodeURIComponent(location.pathname)) || document.querySelector('[data-owcs-darkbtn]')) return;
    var b = document.createElement('button');
    b.setAttribute('data-owcs-darkbtn', '');
    b.textContent = on ? '☀ 라이트 모드' : '☾ 다크 모드';
    b.style.cssText = 'position:fixed;right:16px;bottom:60px;z-index:60;height:34px;padding:0 14px;border-radius:999px;cursor:pointer;font:600 13px/1 Pretendard,system-ui,sans-serif;'
      + (on ? 'background:#F2F2F5;color:#0B0B0F;border:1px solid #F2F2F5' : 'background:#0B0B0F;color:#fff;border:1px solid #0B0B0F') + ';box-shadow:0 4px 18px rgba(0,0,0,.12)';
    b.onclick = function () { try { localStorage.setItem(KEY, on ? '0' : '1'); } catch (e) {} location.reload(); };
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', button); else button();
})();
