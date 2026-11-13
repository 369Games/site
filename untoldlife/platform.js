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

// The desktop build's menus (1.23.1): a main menu at start, and Esc opens a pause menu in the middle of a game.
// The picture behind is the village, or the ending picture once the First Train is finished. The game keeps running underneath.
let DM = null; // null, 'main' or 'pause'
function deskHasSave() { try { return !!(S && S.started) || !!localStorage.getItem(SAVE_KEY); } catch (e) { return !!(S && S.started); } }
function deskMenuDraw() {
  let el = document.getElementById('deskMenu');
  document.documentElement.style.overflow = DM ? 'hidden' : ''; // no page scrollbar behind the menu
  if (!DM) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'deskMenu'; document.body.appendChild(el); }
  const ended = typeof indTrainDone === 'function' && S && S.leg && indTrainDone();
  el.className = DM; el.style.backgroundImage = `url(assets/art/${ended ? 'ending-train' : 'menu-village'}.webp)`;
  const btn = (a, t, cls = 'ghost') => `<button class="btn ${cls}" data-dm="${a}">${t}</button>`;
  const list = DM === 'set' // settings stay inside the menu: leaving it for the «More» tab would step past the new-game screen
    ? [...LANGS.map(([id, name]) => btn('lang:' + id, name, LANG === id ? 'gold' : 'ghost')), btn('mute', typeof AU !== 'undefined' && AU.set && AU.set.muted ? L('🔊 شغّل الصوت') : L('🔇 كتم الصوت')), btn('full', L('⛶ ملء الشاشة (F11)')),
      ...(S && S.started ? [btn('more', L('⚙️ كل الإعدادات'))] : []), btn('back', L('↩️ رجوع'))]
    : DM === 'main'
    ? [deskHasSave() ? btn('go', L('▶️ كمّل اللعب'), 'gold') : btn('go', L('🌱 لعبة جديدة'), 'gold'), btn('load', L('📂 حمّل حفظ من ملف')), btn('set', L('⚙️ الإعدادات')), btn('quit', L('🚪 خروج'))]
    : [btn('go', L('▶️ كمّل اللعب'), 'gold'), btn('save', L('💾 احفظ الحين')), btn('set', L('⚙️ الإعدادات')), btn('main', L('🏠 القائمة الرئيسية')), btn('quit', L('🚪 احفظ واخرج'))];
  el.innerHTML = `<div class="dm-box"><img class="dm-logo" src="assets/art/brand/untoldlife-wordmark.webp" alt="UntoldLife">${DM === 'set' ? `<p class="dm-title">${L('⚙️ الإعدادات')}</p>` : ''}${DM === 'pause' ? `<p class="dm-title">${L('اللعبة شغّالة في الخلفية')}</p>` : ''}<div class="dm-list">${list.join('')}</div><p class="dm-msg" id="dmMsg"></p></div>`;
}
let DM_BACK = 'main';
function deskMenu(m) { DM = m || null; deskMenuDraw(); }
function deskSaveNow() { save(); deskMirror(); }
const DM_DO = {
  go: () => deskMenu(null),
  save: () => { deskSaveNow(); const m = document.getElementById('dmMsg'); if (m) m.textContent = L('تم الحفظ'); },
  set: () => { DM_BACK = DM === 'pause' ? 'pause' : 'main'; deskMenu('set'); },
  back: () => deskMenu(DM_BACK),
  mute: () => { if (A.muteToggle) A.muteToggle(); deskMenuDraw(); },
  full: () => DESK.fullscreen(),
  lang: id => { if (id !== LANG) setLang(id); },
  more: () => { if (!(S && S.started)) return; deskMenu(null); closeModal(); tab = 'settings'; lastSig = ''; renderTabs(); render(true); scrollTo(0, 0); }, // only inside a game
  load: () => { deskMenu(null); if (A.saveUpload) A.saveUpload(); },
  main: () => deskMenu('main'),
  quit: () => { deskSaveNow(); DESK.quit(); },
};
if (DESK) {
  const st = document.createElement('style');
  st.textContent = '#deskMenu{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:#14100c center/cover no-repeat}'
    + '#deskMenu.pause::before,#deskMenu.set::before{content:"";position:absolute;inset:0;background:#0b0805b8;backdrop-filter:blur(3px)}'
    + '.dm-box{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;width:min(430px,88vw);padding:26px 28px 22px;border-radius:18px;background:#1b140ee0;border:1px solid #e0b45366;box-shadow:0 18px 60px #000a}'
    + '.dm-logo{width:100%;height:auto;margin:-6px 0 2px}.dm-title{margin:0;color:#e9dcb8;font-size:14px}.dm-list{display:flex;flex-direction:column;gap:10px;width:100%}'
    + '.dm-list .btn{width:100%;justify-content:center;font-size:17px;padding:13px 16px}.dm-msg{min-height:1.4em;margin:0;color:#b9e08c;font-size:14px}';
  document.head.appendChild(st);
  addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-dm]'); if (!b) return; const [k, v] = b.dataset.dm.split(':'); if (DM_DO[k]) { e.preventDefault(); e.stopPropagation(); DM_DO[k](v); } }, true);
  // Esc: close the menu if one is open, otherwise open the pause menu (the main menu when no game has started).
  addEventListener('keydown', e => { if (e.key !== 'Escape') return; e.preventDefault(); e.stopPropagation(); deskMenu(DM === 'set' ? DM_BACK : DM === 'pause' ? null : DM === 'main' ? (S && S.started ? null : 'main') : (S && S.started ? 'pause' : 'main')); }, true);
  deskMenu('main');
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

// ---------- 4. notifications ----------
/* Optional (1.22.2): a system notification when something is waiting and the player is looking elsewhere (the tab is
   hidden or the window isn't in front). No server: it only works while the game is open somewhere, in a background tab,
   an installed app or the desktop build. Each kind fires when it becomes true, and at most once every 30 minutes. */
const NT_KEY = 'untoldlife_notif';
const NT = { on: false, was: null, at: {} };
try { NT.on = localStorage.getItem(NT_KEY) === '1'; } catch (e) { /* storage off */ }
function ntCan() { return typeof Notification !== 'undefined' && (DESK || !siteConfig().portal); } // a portal copy runs in a frame, where notifications are blocked
function ntOn() { return NT.on && ntCan() && Notification.permission === 'granted'; }
A.ntToggle = () => {
  if (!ntCan()) return;
  NT.on = !ntOn();
  if (NT.on && Notification.permission !== 'granted') { try { const p = Notification.requestPermission(() => { lastSig = ''; }); if (p && p.then) p.then(() => { lastSig = ''; }); } catch (e) { /* old browser */ } }
  try { localStorage.setItem(NT_KEY, NT.on ? '1' : '0'); } catch (e) { /* storage off */ }
  lastSig = '';
};
const NT_LIST = [
  ['ship', () => indOpen() && indHbBack(), () => L('⚓ سفينتك رجعت من الرحلة')],
  ['deal', () => indOpen() && indKReady(), () => L('📜 عندك عقد جاهز للتسليم')],
  ['full', () => indOpen() && (IND_FIELDS.some(f => indFieldSt(f.id).c) || IND_MAKERS.some(r => indMakerSt(r).c === 'bad')), () => L('📦 المصنع يحتاجك: مخزن مليان أو فرن واقف')],
  ['retire', () => canRetire(), () => L('🌅 تقدر تتقاعد وتسلّم المزرعة لولدك')],
];
function ntCheck() {
  if (typeof S === 'undefined' || !S || !S.started) return;
  const first = !NT.was, was = NT.was || (NT.was = {}), away = document.hidden || !document.hasFocus(), now = Date.now();
  for (const [k, fn, txt] of NT_LIST) {
    let v = false; try { v = !!fn(); } catch (e) { /* that part of the game isn't open yet */ }
    if (v && !was[k] && !first && away && ntOn() && now - (NT.at[k] || 0) > 30 * 60e3) {
      NT.at[k] = now;
      try { const n = new Notification('UntoldLife', { body: txt(), icon: 'assets/icons/icon-192.png', tag: 'ul-' + k }); n.onclick = () => { try { window.focus(); } catch (e) { /* not allowed */ } n.close(); }; } catch (e) { /* the system refused */ }
    }
    was[k] = v;
  }
}
setInterval(ntCheck, 15000);
function ntPanel() {
  if (!ntCan()) return '';
  const blocked = Notification.permission === 'denied';
  return `<h3>${L('🔔 التنبيهات')}</h3><p class="hint">${L('تنبيه لما ترجع سفينة، يجهز عقد، يوقف المصنع، أو تقدر تتقاعد، وأنت في نافذة ثانية. يشتغل ما دامت اللعبة مفتوحة في الخلفية.')}</p>`
    + `<div class="row"><button class="tog ${ntOn() ? 'on' : ''}" data-a="ntToggle" ${blocked ? 'disabled' : ''}>🔔 ${ntOn() ? L('التنبيهات: شغّالة') : L('التنبيهات: موقفة')}</button></div>`
    + (blocked ? `<p class="hint">${L('المتصفح مانع التنبيهات لهذا الموقع. اسمح لها من إعدادات الموقع في المتصفح.')}</p>` : '');
}

// ---------- the block in «More» ----------
function platformSig() { return [!!PWA_EVT, pwaInstalled(), deskOn(), rwOn() && !!RW.show, rwOn() && rwLeft() > 0, ntOn(), ntCan() && Notification.permission]; }
function platformPanel() {
  let h = '';
  if (deskOn()) {
    h += `<h3>${L('🖥️ نسخة الكمبيوتر')}</h3><div class="row"><button class="btn ghost" data-a="deskFull">${L('⛶ ملء الشاشة (F11)')}</button><button class="btn ghost" data-a="deskQuit">${L('🚪 خروج من اللعبة')}</button></div>`
      + `<p class="hint">${L('حفظك ينكتب في ملف على جهازك، وستيم يرفعه لحسابك لحاله.')} ${L('زر Esc يفتح القائمة.')}</p>`;
    return h + ntPanel();
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
  return h + ntPanel();
}
