// Re-read owcs-data.js only when a site build changed it. owcs-ver.json (written by cloud_live.py, ~20 bytes) holds the
// data file's hash, the same one the page's <script src="./owcs-data.js?v=..."> carries, so an open page downloads
// ~20 bytes per check instead of ~46 KB (GitHub Pages bandwidth). No owcs-ver.json (this PC, the preview site):
// the data file is read every time, as before.
// owcsDataPoll(done): done(true) after a new owcs-data.js ran (window.OWCS replaced), done(false) when nothing new.
// The version leaves out liveChecked (cloud_live.content_hash), so a build that only re-checked the streams keeps it;
// that check time comes in owcs-ver.json instead: window.owcsChecked (10-24).
(function () {
  var cur = (function () {
    var s = document.querySelector('script[src*="owcs-data.js"]');
    var m = s && /[?&]v=(\w+)/.exec(s.getAttribute('src'));
    return m ? m[1] : null;
  })();
  function load(v, done) {
    var s = document.createElement('script');
    s.src = 'owcs-data.js?v=' + (v || Date.now());
    s.onload = function () { s.remove(); if (v) cur = v; done(true); };
    s.onerror = function () { s.remove(); done(false); };
    document.head.appendChild(s);
  }
  // one poll at a time (10-24): a poll asked while the last still loads answers done(false). A poll that never answers
  // (a stalled fetch) stops blocking after 30 s.
  var since = 0;
  window.owcsDataPoll = function (done) {
    if (since && Date.now() - since < 30000) { done(false); return; }
    since = Date.now();
    var mine = since;
    var fin = function (ok) { if (since === mine) since = 0; done(ok); };
    fetch('owcs-ver.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { if (j.checked) window.owcsChecked = j.checked; if (j.v && j.v === cur) fin(false); else load(j.v, fin); },
            function () { load(null, fin); });
  };
})();
