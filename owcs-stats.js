// Visitor count (Cloudflare Web Analytics: free, no cookies). Only on the public site, never on this PC or the preview.
// Numbers: Cloudflare dashboard > Analytics & Logs > Web Analytics > owticker.com.
(function () {
  var TOKEN = '65f031c79bfe401d97ff39f4d79069e7';
  if (!TOKEN || !/(^|\.)owticker\.com$/.test(location.hostname)) return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
