// The installed app's service worker (owcs-nav.js registers it; it sits at the site root so it covers every page).
// It caches nothing: pages and data always come from the network as before (owcs-ver.json polling, ?v= stamps).
// Its only job is a page that says "no connection" when the app is opened offline, instead of the browser's error.
// The text follows the phone's language (a worker can't read the site's saved choice): ko / ja / zh, else English (10-24)
var TEXT = {
  ko: ['인터넷 연결 없음', '연결되면 다시 시도', '다시 시도'],
  en: ['You\'re offline', 'Try again once you\'re connected', 'Try again'],
  ja: ['インターネットに接続されていません', '接続されたら再試行', '再試行'],
  zh: ['未连接到互联网', '连接后重试', '重试']
};
function offlinePage() {
  var n = String((self.navigator.languages && self.navigator.languages[0]) || self.navigator.language || 'en').toLowerCase();
  var lang = /^(ko|ja|zh)/.test(n) ? n.slice(0, 2) : 'en', t = TEXT[lang];
  return '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>OWticker</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F1EDE5;color:#0B0B0F;' +
  'font-family:system-ui,sans-serif;text-align:center"><div style="padding:24px"><div style="width:48px;height:48px;margin:0 auto 18px;border-radius:12px;' +
  'background:#0B0B0F;display:grid;place-items:center"><i style="width:16px;height:16px;border-radius:4px;background:#C6FF33"></i></div>' +
  '<div style="font-size:18px;font-weight:700">' + t[0] + '</div>' +
  '<div style="font-size:14px;color:#55555C;margin-top:8px">' + t[1] + '</div>' +
  '<button onclick="location.reload()" style="margin-top:20px;height:44px;padding:0 20px;border:0;border-radius:999px;background:#0B0B0F;color:#fff;font:inherit;font-weight:700">' + t[2] + '</button>' +
  '</div></body></html>';
}

self.addEventListener('install', function () { self.skipWaiting(); });
// navigation preload (10-24): the page request starts while the worker boots instead of after it; still no caching
self.addEventListener('activate', function (e) {
  var np = self.registration.navigationPreload;
  e.waitUntil(Promise.all([self.clients.claim(), np ? np.enable().catch(function () {}) : null]));
});
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;   // scripts, data, images: the browser's own handling
  e.respondWith(Promise.resolve(e.preloadResponse).then(function (r) { return r || fetch(e.request); }).catch(function () {
    return new Response(offlinePage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
