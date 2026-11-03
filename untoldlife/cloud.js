'use strict';
/* Optional account and cloud save (Firebase Auth + Firestore).
   Players always start as guests with the save on their device. Linking Google or an email sign-in link
   copies the save to the cloud, keeps it in sync, and brings it back on any device.
   Runs only on the published site, when SITE_CONFIG.firebase is set (tools/site/config.json). Locally nothing loads.
   Cloud document: players/{uid}/saves/untoldlife = { game, save (protected UL2 string), name, gen, play, t, ts }.
   Upload limits (Firebase's free plan allows 20,000 writes a day for everyone together):
   - automatic upload every 3 minutes while the game is on screen, and when the page is hidden, shown again or closed;
   - never two uploads from this device less than 25 seconds apart; the «Upload now» button once a minute;
   - the database rules (tools/firestore.rules) refuse any write less than 20 seconds after the last one,
     using the server's clock (ts), so a script that skips the game can't flood it either. */
const CLOUD = { on: false, ready: false, user: null, last: 0, lastPlay: -1, busy: false, err: '', sentTo: '', pending: null, sentAt: 0, manualAt: 0, retryT: 0 };
const FB_VER = '10.14.1';
const EMAIL_KEY = 'untoldlife_email', NUDGE_KEY = 'untoldlife_cloud_nudge';
const PREV_KEY = 'untoldlife_save_prev';   // the save that lost to the other one, kept just in case
const LOADED_KEY = 'untoldlife_cloud_loaded';
const SYNC_MS = 180000, GAP_MS = 25000, MANUAL_MS = 60000;

function cloudCfg() { const c = siteConfig().firebase; return c && c.apiKey ? c : null; }
function cloudScript(src) {
  return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
}
// The database library is big, so it loads only once a player is signed in (guests never download it).
async function cloudDoc() {
  if (!CLOUD.db) {
    CLOUD.dbLoad = CLOUD.dbLoad || cloudScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`).then(() => { CLOUD.db = firebase.firestore(); });
    await CLOUD.dbLoad;
  }
  return CLOUD.db.collection('players').doc(CLOUD.user.uid).collection('saves').doc('untoldlife');
}
function cloudRefresh() { if (typeof tab !== 'undefined' && tab === 'settings') lastSig = ''; cloudChip(); }
function cloudChip() {
  const c = document.getElementById('cloudChip'); if (!c) return;
  const show = CLOUD.on && CLOUD.ready && CLOUD.err !== 'load' && S && S.started;
  c.classList.toggle('hidden', !show); if (!show) return;
  const state = !CLOUD.user ? 'off' : CLOUD.err === 'sync' ? 'warn' : 'on';
  const txt = state === 'off' ? L('☁️ غير محفوظ بالسحابة') : state === 'warn' ? L('☁️ ما انرفع، بنحاول') : L('☁️ محفوظ بالسحابة');
  if (c.dataset.state !== state || c.textContent !== txt) { c.dataset.state = state; c.textContent = txt; }
  c.title = CLOUD.user ? (CLOUD.user.email || '') : L('اضغط واربط حسابك عشان ما يضيع تقدمك');
}
function cloudFail(e) {
  const code = (e && e.code) || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
  console.warn('cloud', code || e);
  toast(code === 'auth/network-request-failed' ? L('❌ ما فيه اتصال بالإنترنت') : L('❌ صار خطأ، جرّب مرة ثانية'));
}

async function cloudInit() {
  const c = cloudCfg();
  if (!c || location.protocol === 'file:') return;
  CLOUD.on = true;
  try {
    for (const m of ['app', 'auth']) await cloudScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}-compat.js`);
    firebase.initializeApp(c);
    CLOUD.auth = firebase.auth();
    // Sign-in emails and Google's screens follow the game's language.
    CLOUD.auth.languageCode = ({ zh: 'zh-CN', pt: 'pt-BR' })[LANG] || LANG;
    await cloudEmailFinish();
    CLOUD.auth.onAuthStateChanged(u => {
      CLOUD.user = u; CLOUD.ready = true; cloudRefresh();
      if (u) cloudOnSignIn();
    });
  } catch (e) { CLOUD.err = 'load'; CLOUD.ready = true; cloudRefresh(); }
}

/* ---- sign in ---- */
async function cloudGoogle() {
  if (!CLOUD.auth) return;
  const p = new firebase.auth.GoogleAuthProvider();
  try { await CLOUD.auth.signInWithPopup(p); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') CLOUD.auth.signInWithRedirect(p);
    else cloudFail(e);
  }
}
async function cloudEmailSend() {
  const inp = $('cloudEmail'), em = ((inp && inp.value) || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return toast(L('❌ اكتب بريدك صح'));
  try {
    await CLOUD.auth.sendSignInLinkToEmail(em, { url: location.origin + location.pathname, handleCodeInApp: true });
    try { localStorage.setItem(EMAIL_KEY, em); } catch (e) { /* */ }
    CLOUD.sentTo = em; cloudRefresh(); toast(L('📧 أرسلنا لك رابط الدخول'));
  } catch (e) { cloudFail(e); }
}
// The emailed link opens the game; finish signing in here.
async function cloudEmailFinish() {
  if (!CLOUD.auth.isSignInWithEmailLink(location.href)) return;
  let em = ''; try { em = localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { /* */ }
  if (!em) em = (prompt(L('اكتب بريدك عشان نكمل الدخول:')) || '').trim();
  const href = location.href;
  history.replaceState(null, '', location.pathname);
  if (!em) return;
  try { await CLOUD.auth.signInWithEmailLink(em, href); try { localStorage.removeItem(EMAIL_KEY); } catch (e) { /* */ } }
  catch (e) { toast(L('❌ رابط الدخول انتهى أو استُخدم قبل، اطلب رابط جديد')); }
}

/* ---- sync ---- */
function cloudSummary(st) { return { name: String(st.name || '').replace(/[<>&"'`]/g, ''), gen: (st.leg && st.leg.gen) || 1, play: Math.round((st.stats && st.stats.play) || 0) }; }
async function cloudUpload(force) {
  if (!CLOUD.user || !S || !S.started || CLOUD.busy || CLOUD.pending || saveBlocked) return;
  const play = Math.round(S.stats.play);
  if (!force && play === CLOUD.lastPlay) return;
  const wait = CLOUD.sentAt + GAP_MS - Date.now();
  if (wait > 0) { cloudRetry(wait); return; } // too soon after the last upload: try again when allowed
  CLOUD.busy = true;
  try {
    const doc = await cloudDoc();
    await doc.set({ game: 'untoldlife', save: encodeSave(S), ...cloudSummary(S), t: Date.now(), ts: firebase.firestore.FieldValue.serverTimestamp() });
    CLOUD.last = CLOUD.sentAt = Date.now(); CLOUD.lastPlay = play; CLOUD.err = '';
  } catch (e) {
    // Refused by the 20-second rule (another device uploaded just now): try once more a little later.
    if (e && e.code === 'permission-denied' && !CLOUD.retried) { CLOUD.retried = true; CLOUD.sentAt = Date.now(); cloudRetry(GAP_MS); }
    else CLOUD.err = 'sync';
  }
  if (!CLOUD.err && CLOUD.sentAt === CLOUD.last) CLOUD.retried = false;
  CLOUD.busy = false; cloudRefresh();
}
function cloudRetry(ms) {
  if (CLOUD.retryT) return;
  CLOUD.retryT = setTimeout(() => { CLOUD.retryT = 0; cloudUpload(true); }, ms + 500);
}
async function cloudOnSignIn() {
  let snap;
  try { snap = await (await cloudDoc()).get(); } catch (e) { CLOUD.err = 'sync'; return cloudRefresh(); }
  const who = CLOUD.user.email || '';
  if (!snap.exists) {
    if (S.started) { await cloudUpload(true); log(L`☁️ ربطت حسابك (${who}). تقدمك صار محفوظ في السحابة`, 'good'); }
    return;
  }
  const d = snap.data(), info = readSave(d.save);
  if (!info) return cloudUpload(true);
  if (!S.started) return cloudApply(info);
  // No question: keep whichever save got further (generation first, then play time).
  // The other one is kept on this device as a backup, so nothing is ever lost.
  const here = cloudSummary(S), there = cloudSummary(info.st);
  const ahead = (there.gen - here.gen) || (there.play - here.play);
  if (ahead > 60 || there.gen > here.gen) {
    try { localStorage.setItem(PREV_KEY, encodeSave(S)); } catch (e) { /* */ }
    return cloudApply(info);
  }
  if (there.gen !== here.gen || Math.abs(there.play - here.play) > 60 || there.name !== here.name) { try { localStorage.setItem(PREV_KEY, d.save); } catch (e) { /* */ } }
  CLOUD.lastPlay = there.play; CLOUD.last = d.t || 0; cloudRefresh();
  return cloudUpload(true);
}
function cloudApply(info) {
  saveBlocked = false;
  S = migrate(info.st); S.last = Date.now();
  markMod(info.mod || saveOddity(S));
  save(); saveBlocked = true;
  try { sessionStorage.setItem(LOADED_KEY, String(S.leg.gen)); } catch (e) { /* */ }
  location.reload();
}

/* ---- account ---- */
async function cloudSignOut() {
  await cloudUpload(true);
  try { await CLOUD.auth.signOut(); } catch (e) { return cloudFail(e); }
  CLOUD.last = 0; CLOUD.lastPlay = -1; cloudRefresh(); toast(L('👋 سجلت خروج. حفظك باقي في هذا الجهاز'));
}
async function cloudDelete() {
  if (!CLOUD.user || !confirm(L('متأكد؟ بنحذف حسابك وحفظك من السحابة نهائياً. الحفظ اللي في هذا الجهاز يبقى.'))) return;
  try {
    await (await cloudDoc()).delete();
    try { await CLOUD.user.delete(); }
    catch (e) {
      if (e.code !== 'auth/requires-recent-login') throw e;
      const google = CLOUD.user.providerData.some(p => p.providerId === 'google.com');
      if (!google) { await CLOUD.auth.signOut(); return toast(L('حذفنا حفظك من السحابة. عشان نحذف الحساب نفسه، سجل دخول من جديد واضغط حذف مرة ثانية')); }
      await CLOUD.user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
      await CLOUD.user.delete();
    }
    toast(L('🗑️ انحذف حسابك وحفظك السحابي'));
  } catch (e) { cloudFail(e); }
  cloudRefresh();
}

/* ---- settings panel ---- */
function cloudSig() { return [CLOUD.on, CLOUD.ready, CLOUD.err, CLOUD.user && CLOUD.user.uid, CLOUD.sentTo, Math.floor(CLOUD.last / 60000)]; }
const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function cloudPanel() {
  if (!CLOUD.on) return '';
  let h = L('<h3>☁️ الحساب والحفظ السحابي</h3>');
  if (!CLOUD.ready) return h + L('<p class="hint">جاري التحميل…</p>');
  if (CLOUD.err === 'load') return h + L('<p class="hint">الحفظ السحابي ما اشتغل الحين. حفظك في هذا الجهاز شغال عادي.</p>');
  if (!CLOUD.user) {
    return h + L`<p class="hint">اختياري: اربط حسابك عشان ما يضيع تقدمك لو مسحت المتصفح، وتكمل من أي جهاز.</p>
    <div class="row"><button class="btn cloud-google" data-a="cloudGoogle">${GOOGLE_G} الدخول بحساب Google</button></div>
    <div class="row cloud-email"><input id="cloudEmail" type="email" inputmode="email" autocomplete="email" placeholder="بريدك الإلكتروني" value="${esc(CLOUD.sentTo)}"><button class="btn ghost" data-a="cloudEmail">📧 أرسل رابط الدخول</button></div>
    ${CLOUD.sentTo ? L`<p class="hint">📧 أرسلنا رابط لـ ${esc(CLOUD.sentTo)}. افتحه من بريدك على هذا الجهاز (شوف مجلد الرسائل غير المرغوبة لو ما وصل).</p>` : L('<p class="hint">بدون كلمة سر: نرسل لك رابط، تضغطه، وتدخل.</p>')}`;
  }
  const who = esc(CLOUD.user.email || CLOUD.user.displayName || '');
  const when = CLOUD.err === 'sync' ? L('⚠️ آخر محاولة رفع ما نجحت، بنحاول مرة ثانية') : CLOUD.last ? L`آخر رفع: قبل ${ftime(Math.max(1, (Date.now() - CLOUD.last) / 1000))}` : L('ما رفعنا شي للحين');
  return h + L`<p class="hint">✅ متصل: <b>${who}</b><br>${when}. الحفظ يترفع تلقائياً كل 3 دقايق، وكل ما تطلع من اللعبة.</p>
  <div class="row"><button class="btn gold sm" data-a="cloudUpload">☁️ ارفع الحين</button><button class="btn ghost sm" data-a="cloudOut">تسجيل خروج</button><button class="btn red sm" data-a="cloudDelete">حذف الحساب</button></div>`;
}

A.cloudGoogle = () => cloudGoogle();
A.cloudEmail = () => cloudEmailSend();
A.cloudUpload = async () => {
  const wait = CLOUD.manualAt + MANUAL_MS - Date.now();
  if (wait > 0) return toast(L`⏳ رفعت قبل شوي. تقدر ترفع مرة ثانية بعد ${Math.ceil(wait / 1000)}ث`);
  CLOUD.manualAt = Date.now();
  await cloudUpload(true); if (!CLOUD.err && CLOUD.sentAt > CLOUD.manualAt - 1000) toast(L('☁️ انرفع حفظك'));
};
A.cloudOut = () => cloudSignOut();
A.cloudDelete = () => cloudDelete();
A.cloudChip = () => {
  A.tab('settings'); render(true);
  setTimeout(() => { const el = document.querySelector('[data-a=cloudGoogle], [data-a=cloudUpload]'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
};

// Sync while playing, and when the page is hidden or closed.
// A hidden tab doesn't upload every 3 minutes: the save goes up when it's hidden, and again when the player comes back.
setInterval(() => { if (!document.hidden) cloudUpload(); }, SYNC_MS);
document.addEventListener('visibilitychange', () => cloudUpload());
window.addEventListener('pagehide', () => cloudUpload());
// One gentle suggestion to link an account, after the first retirement or an hour of play.
setInterval(() => {
  if (!CLOUD.ready || CLOUD.user || CLOUD.err || !S || !S.started) return;
  try { if (localStorage.getItem(NUDGE_KEY)) return; } catch (e) { return; }
  if (S.leg.gen < 2 && (S.stats.play || 0) < 3600) return;
  try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) { /* */ }
  log(L('☁️ نصيحة: اربط حسابك من «المزيد» عشان ما يضيع تقدمك وتكمل من أي جهاز'), 'new');
  toast(L('☁️ اربط حسابك عشان ما يضيع تقدمك'));
}, 30000);

setInterval(cloudChip, 2000);
cloudInit().then(() => {
  let g = null; try { g = sessionStorage.getItem(LOADED_KEY); sessionStorage.removeItem(LOADED_KEY); } catch (e) { /* */ }
  if (g) log(L`☁️ كمّلنا من حفظك في السحابة (الجيل ${g}) لأنه أبعد من حفظ هذا الجهاز`, 'good');
});
