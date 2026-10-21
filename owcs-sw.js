// The installed app's service worker (owcs-nav.js registers it; it sits at the site root so it covers every page).
// It caches nothing: pages and data always come from the network as before (owcs-ver.json polling, ?v= stamps).
// Its only job is a page that says "no connection" when the app is opened offline, instead of the browser's error.
var OFFLINE = '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>OWticker</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F1EDE5;color:#0B0B0F;' +
  'font-family:system-ui,sans-serif;text-align:center"><div style="padding:24px"><div style="width:48px;height:48px;margin:0 auto 18px;border-radius:12px;' +
  'background:#0B0B0F;display:grid;place-items:center"><i style="width:16px;height:16px;border-radius:4px;background:#C6FF33"></i></div>' +
  '<div style="font-size:18px;font-weight:700">인터넷에 연결되어 있지 않아요</div>' +
  '<div style="font-size:14px;color:#55555C;margin-top:8px">연결되면 다시 열어 주세요</div>' +
  '<button onclick="location.reload()" style="margin-top:20px;height:44px;padding:0 20px;border:0;border-radius:999px;background:#0B0B0F;color:#fff;font:inherit;font-weight:700">다시 시도</button>' +
  '</div></body></html>';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;   // scripts, data, images: the browser's own handling
  e.respondWith(fetch(e.request).catch(function () {
    return new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
