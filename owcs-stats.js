// Visitor count (GoatCounter: free, no cookies). Only on the public site, never on this PC.
// Set CODE to the site code chosen at goatcounter.com sign-up (https://CODE.goatcounter.com shows the numbers).
(function () {
  var CODE = '';
  if (!CODE || !/github\.io$/.test(location.hostname)) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
  document.head.appendChild(s);
})();
