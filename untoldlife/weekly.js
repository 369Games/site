'use strict';
/* The week: one challenge for every player, a daily goal the whole village fills together, and a leaderboard.
   - Weeks start on Sunday at 00:00 Riyadh time. Every player gets the same challenge and village goal, worked
     out from the week number, so the challenge needs no server.
   - Progress is the change in the lifetime counters (S.stats) since the week started.
   - Weekly challenge reward: +10% gold and XP for 7 days. Village goal reward: +10% production for 7 days.
   - The village goal starts over every day at 00:00 Riyadh time (what to collect stays the same all week).
   - The village goal and the leaderboard use Firestore, only for signed-in players, and never for a save marked
     as edited from outside the game. Firestore layout:
       village/{day}         = { n }   today's village total
       weekly/{week}/p/{uid} = { name, gen, gold, fish, floor, vil, ts }   one player's week (vil keeps growing all week;
                                                                          what it grows by is added to the day it's sent)
   - Sending is slow on purpose: at most once every 5 minutes from this page, and the database rules
     (tools/firestore.rules) refuse a player's write less than 2 minutes after their last one, cap how fast the
     numbers can grow, and only let the village total grow by exactly what that player's own row grew.
     Reading the board happens only on the village tab, at most every 2 minutes. */
const WK_MS = 7 * 86400000;
const WK_OFFSET = 3 * 3600000 - 3 * 86400000; // Riyadh time (+3h), and weeks start on Sunday (epoch day 0 was a Thursday)
const WK_PUSH_MS = 5 * 60000, WK_PULL_MS = 2 * 60000;
const WK_RATE = 45; // village points a second this page may send (the rules allow 50), so a long offline stretch goes up over several sends
function wkNow() { return Math.floor((Date.now() + WK_OFFSET) / WK_MS); }
function wkStart(w) { return w * WK_MS - WK_OFFSET; }
function wkLeft() { return Math.max(0, wkStart(S.wk.id + 1) - Date.now()) / 1000; }
// The village goal's day, also from Riyadh midnight.
function wkDay() { return Math.floor((Date.now() + 3 * 3600000) / 86400000); }
function wkDayLeft() { return Math.max(0, (wkDay() + 1) * 86400000 - 3 * 3600000 - Date.now()) / 1000; }

const WK_TASKS = [
  { id: 'harv', st: 'harvests', n: 1500, e: '🌾', t: n => L`احصد ${fmt(n)} محصول` },
  { id: 'prod', st: 'products', n: 1500, e: '🥚', t: n => L`اجمع ${fmt(n)} من منتجات الحيوانات` },
  { id: 'fish', st: 'fish', n: 400, e: '🎣', t: n => L`اصطد ${fmt(n)} سمكة` },
  { id: 'mine', st: 'blocks', n: 800, e: '⛏️', t: n => L`اكسر ${fmt(n)} صخرة في المنجم` },
  { id: 'kill', st: 'kills', n: 400, e: '⚔️', t: n => L`اهزم ${fmt(n)} وحش في الزنزانة` },
  { id: 'quest', st: 'quests', n: 12, e: '📜', t: n => L`خلّص ${fmt(n)} مهمة من النقابة` },
  { id: 'gold', st: 'earned', n: 0, e: '💰', t: n => L`اكسب ${fmt(n)} ذهب` }, // half of this generation's retire goal
];
const WK_VILLAGE = [
  // Sized from the first hour of 1.11: the village gathered ~6,000 fish, so a week's goal is about ten times the first guess.
  { st: 'products', n: 300000, e: '🥚', t: L('منتجات الحيوانات') },
  { st: 'harvests', n: 300000, e: '🌾', t: L('المحاصيل') },
  { st: 'fish', n: 80000, e: '🐟', t: L('السمك') },
  { st: 'blocks', n: 150000, e: '🪨', t: L('صخور المنجم') },
  { st: 'kills', n: 80000, e: '👹', t: L('وحوش الزنزانة') },
];
function wkTask(w = S.wk.id) { return WK_TASKS[w % WK_TASKS.length]; }
function wkVillage(w = S.wk.id) {
  const t = wkTask(w); let i = (w + 2) % WK_VILLAGE.length;
  if (WK_VILLAGE[i].st === t.st) i = (i + 1) % WK_VILLAGE.length; // never the same thing as the challenge
  return WK_VILLAGE[i];
}
function wkGot(st) { return Math.max(0, (S.stats[st] || 0) - ((S.wk.s || {})[st] || 0)); }
function wkGoal() { const t = wkTask(); return t.st === 'earned' ? S.wk.gg : t.n; }

// A new week: remember where the counters were, keep any reward that's still running.
function wkRoll() {
  const w = wkNow(); if (S.wk && S.wk.id === w) return;
  const old = S.wk || {};
  S.wk = { id: w, s: { ...S.stats }, gg: Math.round(goldGoal() / 2), floor: 0, done: false, buf: old.buf || 0, vb: old.vb || 0, vc: old.vc || 0 };
  WK.vn = null; WK.top = null; WK.pullAt = 0; WK.sentWk = -1;
  if (old.id) log(L`📅 أسبوع جديد! تحدي الأسبوع: ${wkTask().e} ${wkTask().t(wkGoal())}`, 'season');
}
function wkCheck() {
  S.wk.floor = Math.max(S.wk.floor || 0, S.dun.max);
  if (!S.wk.done && wkGot(wkTask().st) >= wkGoal()) {
    S.wk.done = true; S.wk.buf = Date.now() + WK_MS;
    log(L('📅 أنجزت تحدي الأسبوع! +10% ذهب وخبرة لمدة 7 أيام'), 'golden');
    toast(L('📅 أنجزت تحدي الأسبوع!'));
  }
  const V = wkVillage();
  if (WK.vn != null && WK.day === wkDay() && WK.vn >= V.n && S.wk.vc !== WK.day && S.wk.gd === WK.day) {
    S.wk.vc = WK.day; S.wk.vb = Date.now() + WK_MS;
    log(L('🏘️ القرية حققت هدف اليوم! +10% سرعة إنتاج لمدة 7 أيام لكل اللي ساهموا'), 'golden');
    toast(L('🏘️ القرية حققت الهدف!'));
  }
}

/* ---- Firestore: the village goal and the leaderboard ---- */
const WK = { ver: 0, day: -1, sentAt: 0, sentWk: -1, sent: null, busy: false, pullAt: 0, pulling: false, vn: null, top: null, err: '' };
function wkCloud() { return typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.ready && CLOUD.err !== 'load'; }
function wkSignedIn() { return wkCloud() && !!CLOUD.user; }
function wkAllowed() { return wkSignedIn() && S && S.started && S.wk && !saveBlocked && !S.leg.mod && S.wk.id === wkNow(); }
async function wkRefs() {
  await cloudDoc(); // loads the database library
  const w = CLOUD.db.collection('weekly').doc(String(S.wk.id));
  return { w, day: CLOUD.db.collection('village').doc(String(wkDay())), me: w.collection('p').doc(CLOUD.user.uid) };
}
function wkVals() {
  const V = wkVillage();
  return { gold: Math.round(wkGot('earned')), fish: wkGot('fish'), floor: S.wk.floor || 0, vil: Math.round(wkGot(V.st)) };
}
async function wkPush() {
  if (!wkAllowed() || WK.busy || Date.now() - WK.sentAt < WK_PUSH_MS) return;
  WK.busy = true; WK.sentAt = Date.now(); // the wait counts from every try, so a failing send never repeats quickly
  try {
    const { day, me } = await wkRefs(), d = wkDay();
    if (WK.sentWk !== S.wk.id) { const s = await me.get(); WK.sent = s.exists ? s.data() : null; WK.sentWk = S.wk.id; }
    const old = WK.sent || { gold: 0, fish: 0, floor: 0, vil: 0 }, cur = wkVals();
    // Never more than the rules allow since the last send (or since the week began).
    const since = (Date.now() - (old.ts && old.ts.toMillis ? old.ts.toMillis() : wkStart(S.wk.id))) / 1000;
    const vil = Math.min(Math.max(cur.vil, old.vil || 0), (old.vil || 0) + Math.floor(WK_RATE * Math.max(0, since - 5)));
    const row = { name: String(S.name || '').replace(/[<>&"'`]/g, '').slice(0, 24) || '…', gen: S.leg.gen,
      gold: Math.max(cur.gold, old.gold || 0), fish: Math.max(cur.fish, old.fish || 0), floor: Math.max(cur.floor, old.floor || 0), vil };
    if (WK.sent && ['gold', 'fish', 'floor', 'vil', 'gen', 'name'].every(k => row[k] === old[k])) { WK.busy = false; return; }
    const b = CLOUD.db.batch(), add = vil - (old.vil || 0);
    b.set(me, { ...row, ts: firebase.firestore.FieldValue.serverTimestamp() });
    if (add > 0) b.set(day, { n: firebase.firestore.FieldValue.increment(add) }, { merge: true });
    await b.commit();
    WK.sent = { ...row, ts: firebase.firestore.Timestamp.now() }; WK.err = '';
    if (add > 0) { S.wk.gd = d; // helped today: gets the reward if the village makes it
      if (WK.vn != null && WK.day === d) WK.vn += add; }
  } catch (e) { WK.err = (e && e.code) || 'x'; WK.sentWk = -1; console.warn('weekly', WK.err); }
  WK.busy = false;
}
async function wkPull() {
  if (!wkSignedIn() || !S.wk || WK.pulling || Date.now() - WK.pullAt < WK_PULL_MS) return;
  WK.pulling = true; WK.pullAt = Date.now();
  try {
    const { w, day, me } = await wkRefs(), uid = CLOUD.user.uid, d = wkDay();
    const snap = await day.get(); WK.vn = snap.exists ? (snap.data().n || 0) : 0; WK.day = d;
    const top = {};
    for (const k of ['gold', 'floor', 'fish']) {
      const q = await w.collection('p').orderBy(k, 'desc').limit(10).get();
      top[k] = q.docs.map(d => ({ name: d.data().name, gen: d.data().gen, v: d.data()[k], me: d.id === uid })).filter(r => r.v > 0);
    }
    WK.top = top; WK.err = '';
    if (WK.sentWk !== S.wk.id) { const s = await me.get(); WK.sent = s.exists ? s.data() : null; WK.sentWk = S.wk.id; }
  } catch (e) { WK.err = (e && e.code) || 'x'; console.warn('weekly', WK.err); }
  WK.pulling = false; WK.ver++; wkCheck(); // ver redraws the panel once the lists have arrived
}

/* ---- the panel at the top of the village tab ---- */
function wkSig() { return [S.wk && S.wk.id, S.wk && S.wk.done, wkOn('buf'), wkOn('vb'), wkSignedIn(), WK.ver, WK.err, !!(S.leg && S.leg.mod)]; }
function wkBar(id, cls = '') { return `<div class="bar ${cls}"><i id="${id}"></i></div>`; }
function wkBoard(title, k, unit) {
  const rows = (WK.top && WK.top[k]) || [];
  return `<div class="wk-board"><b>${title}</b>${rows.length ? `<ol>${rows.map(r => `<li class="${r.me ? 'me' : ''}"><span>${esc(r.name)} <small>${L`ج${r.gen}`}</small></span><b>${unit(r.v)}</b></li>`).join('')}</ol>` : L('<small class="hint">ما أحد للحين، كن الأول!</small>')}</div>`;
}
function weeklyPanel() {
  if (!S.wk) return '';
  const T = wkTask(), V = wkVillage(), goal = wkGoal();
  const rew = S.wk.done ? (wkOn('buf') ? L`✅ أنجزته! المكافأة شغالة، باقي ${ftime((S.wk.buf - Date.now()) / 1000)}` : L('✅ أنجزته!')) : L('🎁 المكافأة: +10% ذهب وخبرة لمدة 7 أيام');
  let h = L`<div class="panel wk"><div class="ph"><h2>📅 هذا الأسبوع</h2><span class="stat">⏳ يتجدد بعد ${ftime(wkLeft())}</span></div>
    <div class="wk-box"><b>${T.e} تحدي الأسبوع: ${T.t(goal)}</b><small class="hint">نفس التحدي عند كل اللاعبين.</small>
    ${wkBar('wk_tb', S.wk.done ? 'done' : '')}<small id="wk_tt"></small><small>${rew}</small></div>`;
  if (!wkCloud()) return h + '</div>';
  if (!wkSignedIn()) return h + L`<div class="wk-box"><b>🏘️ هدف القرية والمتصدرين</b><small class="hint">كل اللاعبين يجمعون مع بعض، ولوحة ترتيب أسبوعية. اربط حسابك عشان تشارك.</small><div class="row"><button class="btn gold sm" data-a="cloudChip">☁️ اربط حسابك</button></div></div></div>`;
  if (S.leg.mod) return h + L('<div class="wk-box"><small class="hint">🧪 المزارع المعدّلة ما تشارك في هدف القرية ولا المتصدرين.</small></div></div>');
  const vr = wkOn('vb') ? L`✅ تحقق! المكافأة شغالة، باقي ${ftime((S.wk.vb - Date.now()) / 1000)}` : L('🎁 إذا اكتمل: +10% سرعة إنتاج لمدة 7 أيام لكل اللي ساهموا');
  h += L`<div class="wk-box"><b>🏘️ هدف القرية اليوم: ${fmt(V.n)} من ${V.e} ${V.t}</b><small class="hint">كل اللاعبين يجمعون مع بعض، والهدف يبدأ من جديد كل يوم (باقي ${ftime(wkDayLeft())}). اللي تجمعه أنت ينضاف تلقائياً.</small>
    ${wkBar('wk_vb', WK.vn >= V.n ? 'done' : '')}<small id="wk_vt"></small><small>${vr}</small></div>
    <div class="wk-boards">${wkBoard(L('💰 أكثر ذهب'), 'gold', fmt)}${wkBoard(L('⚔️ أعمق طابق'), 'floor', v => fmt(v))}${wkBoard(L('🎣 أكثر صيد'), 'fish', fmt)}</div>
    <small class="hint">${WK.err ? L('⚠️ ما قدرنا نحدّث القائمة الحين، بنحاول بعد شوي.') : L('تتحدث كل دقيقتين تقريباً. أرقامك تنرسل كل 5 دقايق.')}</small>`;
  return h + '</div>';
}
function wkUpd() {
  if (!S.wk) return;
  const goal = wkGoal(), got = Math.min(goal, wkGot(wkTask().st));
  const b = $('wk_tb'); if (b) { b.style.width = Math.min(100, got / goal * 100) + '%'; $('wk_tt').textContent = `${fmt(got)} / ${fmt(goal)}`; }
  const vb = $('wk_vb');
  if (vb) {
    const V = wkVillage(), n = WK.vn || 0, mine = Math.max(wkVals().vil, (WK.sent && WK.sent.vil) || 0);
    vb.style.width = Math.min(100, n / V.n * 100) + '%';
    $('wk_vt').textContent = WK.vn == null ? L('جاري التحميل…') : L`${fmt(n)} / ${fmt(V.n)} • مساهمتك هالأسبوع: ${fmt(mine)}`;
  }
}

/* ---- timers ---- */
function wkTick() {
  if (!S || !S.started) return;
  wkRoll();
  if (WK.day !== -1 && WK.day !== wkDay()) { WK.vn = null; WK.day = -1; WK.pullAt = 0; WK.ver++; } // a new day: the village starts again
  wkCheck();
  if (document.hidden) return;
  wkPush();
  if (typeof tab !== 'undefined' && tab === 'village') wkPull();
}
setInterval(wkTick, 15000);
setTimeout(wkTick, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.wk) wkPush(); });
