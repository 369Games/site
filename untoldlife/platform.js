'use strict';
/* What depends on where the game runs (1.23). Loaded after game.js.
   1. Install as an app (the website only): the browser's own install prompt behind a button in «More»,
      and a one-line how-to on iPhone, where there is no prompt.
   2. The desktop build (Steam): desktop/preload.js puts `window.ulDesktop` on the page. The save is mirrored to a file
      (Steam Cloud syncs that folder), achievements are passed on, and there is a fullscreen button.
   3. The rewarded ad: «watch an ad, get two hours of production». Off until site-config.js has adsense.rewarded = true,
      which waits for AdSense to approve the site and its H5 games ads. Entirely optional for the player. */

// ---------- 1. install as an app ----------
let PWA_EVT = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA_EVT = e; if (typeof lastSig !== 'undefined') lastSig = ''; });
addEventListener('appinstalled', () => { PWA_EVT = null; if (typeof track === 'function') track('installed'); if (typeof lastSig !== 'undefined') lastSig = ''; });
function pwaInstalled() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function pwaIos() { return /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent); }
A.pwaInstall = () => { const e = PWA_EVT; if (!e) return; e.prompt(); e.userChoice.then(() => { PWA_EVT = null; lastSig = ''; }, () => {}); };

// ---------- 2. the desktop build ----------
const DESK = window.ulDesktop || null;
function deskOn() { return !!DESK; }
A.deskFull = () => { if (DESK) DESK.fullscreen(); };
A.deskQuit = () => { if (DESK) { deskMirror(); DESK.quit(); } };
let DESK_LAST = '';
// The game keeps saving to localStorage as always; this copies the newest save text to the file Steam Cloud watches.
function deskMirror() {
  if (!DESK || saveBlocked) return;
  try { const t = localStorage.getItem(SAVE_KEY); if (t && t !== DESK_LAST) { DESK.saveFile(t); DESK_LAST = t; } } catch (e) { /* the next round tries again */ }
}
// Steam achievements carry the game's own ids (publishing/steam-achievements.csv). Sent when earned, and once at start
// for the ones earned before (a save moved from the website, or Steam was offline).
function platformAch(id) { if (DESK) try { DESK.achieve(String(id)); } catch (e) { /* Steam not running */ } }
if (DESK) {
  setInterval(deskMirror, 20000);
  addEventListener('beforeunload', deskMirror);
  setTimeout(() => { if (typeof S !== 'undefined' && S && S.leg) Object.keys(S.leg.ach || {}).forEach(platformAch); }, 8000);
}

// ---------- 3. the rewarded ad ----------
const RW = { show: null, asked: false, hours: 2, cool: 4 * 3600e3 };
function rwOn() { const a = siteConfig().adsense; return !!(a && a.rewarded && !DESK && !siteConfig().portal); }
function rwLeft() { return Math.max(0, ((S.leg.rwAt || 0) + RW.cool) - Date.now()); }
// Ask AdSense for a rewarded ad. It calls beforeReward only when it has one to show; the button appears then.
function rwAsk() {
  if (!rwOn() || RW.asked || RW.show || rwLeft() > 0) return;
  RW.asked = true;
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) { const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous'; s.dataset.adFrequencyHint = '30s'; s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + siteConfig().adsense.client; document.head.appendChild(s); }
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({
      type: 'reward', name: 'two_hours',
      beforeReward: show => { RW.show = show; lastSig = ''; },
      adDismissed: () => {},
      adViewed: () => rwGive(),
      adBreakDone: () => { RW.show = null; RW.asked = false; lastSig = ''; },
    });
  } catch (e) { RW.asked = false; }
}
function rwGive() {
  const secs = RW.hours * 3600, g0 = S.gold;
  S.leg.rwAt = Date.now();
  offline = true; simulate(secs, 4); offline = false;
  log(L`📺 شكراً على المشاهدة! أخذت إنتاج ${RW.hours} ساعات: 💰 ${fmt(Math.max(0, S.gold - g0))}`, 'golden');
  toast(L('📺 وصلك إنتاج ساعتين!')); save(); lastSig = '';
}
A.rwWatch = () => { const f = RW.show; if (f && rwLeft() <= 0) { RW.show = null; f(); } };
if (typeof setInterval === 'function') setInterval(() => { if (typeof S !== 'undefined' && S && S.started) rwAsk(); }, 30000);

// ---------- the block in «More» ----------
function platformSig() { return [!!PWA_EVT, pwaInstalled(), deskOn(), rwOn() && !!RW.show, rwOn() && rwLeft() > 0]; }
function platformPanel() {
  let h = '';
  if (deskOn()) {
    h += `<h3>${L('🖥️ نسخة الكمبيوتر')}</h3><div class="row"><button class="btn ghost" data-a="deskFull">${L('⛶ ملء الشاشة (F11)')}</button><button class="btn ghost" data-a="deskQuit">${L('🚪 خروج من اللعبة')}</button></div>`
      + `<p class="hint">${L('حفظك ينكتب في ملف على جهازك، وستيم يرفعه لحسابك لحاله.')}</p>`;
    return h;
  }
  if (rwOn()) {
    const left = rwLeft();
    h += `<h3>${L('📺 إنتاج ببلاش')}</h3><p class="hint">${L('شوف إعلان قصير وخذ إنتاج ساعتين كاملة من القرية والمصنع. اختياري تماماً، ومرة كل 4 ساعات.')}</p>`
      + `<div class="row"><button class="btn gold" data-a="rwWatch" ${RW.show && left <= 0 ? '' : 'disabled'}>${L('📺 شوف إعلان وخذ ساعتين')}</button>`
      + `<span class="stat">${left > 0 ? L`يرجع بعد ${ftime(left / 1000)}` : RW.show ? L('جاهز ✔') : L('ما فيه إعلان الحين')}</span></div>`;
  }
  if (!siteConfig().portal && !pwaInstalled()) {
    if (PWA_EVT) h += `<h3>${L('📲 ثبّت اللعبة')}</h3><p class="hint">${L('حط اللعبة على شاشتك الرئيسية أو سطح المكتب وتفتح مثل أي تطبيق، بنافذة لحالها وبدون شريط المتصفح.')}</p><div class="row"><button class="btn gold" data-a="pwaInstall">${L('📲 ثبّت كتطبيق')}</button></div>`;
    else if (pwaIos()) h += `<h3>${L('📲 ثبّت اللعبة')}</h3><p class="hint">${L('على الآيفون: اضغط زر المشاركة في سفاري، ثم «إضافة إلى الشاشة الرئيسية». اللعبة تفتح بعدها مثل أي تطبيق.')}</p>`;
  }
  return h;
}
