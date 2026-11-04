'use strict';
/* Google AdSense banner at the bottom of the game.
   It only exists on the published site, once tools/site/config.json has "adsense": {"client": "ca-pub-…", "slot": "…"}.
   It appears after the player has started (never on the first screen), and the page leaves room for it,
   so it never covers a button. The consent message for Europe comes from AdSense itself (Privacy & messaging). */
(function () {
  const C = (window.SITE_CONFIG || {}).adsense || {};
  if (!/^ca-pub-\d+$/.test(C.client || '') || !/^\d+$/.test(C.slot || '') || location.protocol === 'file:') return;
  function show() {
    if (document.getElementById('adbar')) return;
    const bar = document.createElement('div');
    bar.id = 'adbar';
    bar.innerHTML = `<ins class="adsbygoogle" style="display:block;width:100%;height:100%" data-ad-client="${C.client}" data-ad-slot="${C.slot}"></ins>`;
    document.body.appendChild(bar);
    document.body.classList.add('has-ad');
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + C.client;
    document.head.appendChild(s);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }
  const wait = setInterval(() => { if (typeof S !== 'undefined' && S && S.started) { clearInterval(wait); show(); } }, 2000);
})();
