// Instagram posts on the player page: every <div data-ig-url> becomes Instagram's own embed (no account or key needed).
// The links come from data/insta_posts.txt on the PC (build_owcs_data.py -> owcs-data.js).
(function () {
  var loading = false;
  function fill() {
    var todo = document.querySelectorAll('[data-ig-url]:not([data-ig-done])');
    if (!todo.length) return;
    Array.prototype.forEach.call(todo, function (el) {
      var url = el.getAttribute('data-ig-url');
      if (!/^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]+\/$/.test(url)) return;
      el.setAttribute('data-ig-done', '');
      var q = document.createElement('blockquote');
      q.className = 'instagram-media';
      q.setAttribute('data-instgrm-permalink', url);
      q.setAttribute('data-instgrm-version', '14');
      q.style.cssText = 'margin:0;width:100%;min-width:0;max-width:none;background:#fff;border:1px solid #E6E6E1;border-radius:16px;padding:0';
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = '인스타그램에서 보기';
      a.style.cssText = 'display:block;padding:40px 16px;text-align:center;color:#0B0B0F;font:600 14px Pretendard,system-ui,sans-serif';
      q.appendChild(a);
      el.appendChild(q);
    });
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    if (loading) return;
    loading = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = function () { if (window.instgrm) window.instgrm.Embeds.process(); };
    document.body.appendChild(s);
  }
  function start() {
    fill();
    new MutationObserver(fill).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
