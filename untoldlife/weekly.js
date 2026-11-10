'use strict';
/* The week: one challenge for every player, three daily goals the whole village fills together, and a leaderboard.
   - Weeks start on Sunday at 00:00 Riyadh time. Every player gets the same challenge, worked out from the week
     number, so the challenge needs no server. Progress is the change in the lifetime counters (S.stats).
   - Weekly challenge reward: +10% gold and XP for 7 days.
   - Village goals (VG): crops start over every day at 9:00, mine rocks at 15:00 and fish at 21:00, Riyadh time.
     When a round ends with its goal reached, everyone who helped gets extra speed in that area for 7 days,
     by how much they gave: 1st place +10%, 2nd +7.5%, 3rd +5%, everyone else +2% (VG_TIERS).
   - The village goals and the leaderboard use Firestore, only for signed-in players, and never for a save marked
     as edited from outside the game. Firestore layout:
       goals/v = one document for all three goals. For goal k (h, m, f):
                 kd = the round, kn = its total, kl = { uid: what each player gave this round },
                 kp / kq = the same map and total for the round before (kept for the prizes)
       weekly/{week}/p/{uid} = { name, gen, gold, fish, floor, gh, gm, gf, ts }   one player's week; gh/gm/gf keep
                                                                                 growing, and what they grow by goes to the goals
   - Sending is slow on purpose: at most once every 5 minutes from this page, and the database rules
     (tools/firestore.rules) refuse a player's write less than 2 minutes after their last one, cap how fast the
     numbers can grow, and only let a goal (and the player's own entry in it) grow by exactly what their row grew.
     Reading happens only on the village tab, at most every 2 minutes, plus one read of the goals before a send
     when a round has started since we last saw it (about three times a day). */
const WK_MS = 7 * 86400000;
const WK_OFFSET = 3 * 3600000 - 3 * 86400000; // Riyadh time (+3h), and weeks start on Sunday (epoch day 0 was a Thursday)
// Reading the boards costs ~31 Firestore reads (3 top-10 lists + goals), so they refresh every 10 minutes, not 2
// (the free plan allows 50K reads a day for everyone together).
const WK_PUSH_MS = 5 * 60000, WK_PULL_MS = 10 * 60000, WK_PUSH_IDLE_MS = 15 * 60000;
// A player who hasn't touched the game for 5 minutes gets no leaderboard refresh (it comes back on their next tap),
// and their numbers go up every 15 minutes instead of 5. This keeps reads and writes inside Firebase's free daily limit.
const WK_RATE = 950; // points a second this page may send for each goal (the rules allow 1,000), so a long offline stretch goes up over several sends
function wkNow() { return Math.floor((Date.now() + WK_OFFSET) / WK_MS); }
function wkStart(w) { return w * WK_MS - WK_OFFSET; }
function wkLeft() { return Math.max(0, wkStart(S.wk.id + 1) - Date.now()) / 1000; }

const WK_TASKS = [
  { id: 'harv', st: 'harvests', n: 1500, e: '🌾', t: n => L`احصد ${fmt(n)} محصول` },
  { id: 'prod', st: 'products', n: 1500, e: '🥚', t: n => L`اجمع ${fmt(n)} من منتجات الحيوانات` },
  { id: 'fish', st: 'fish', n: 400, e: '🎣', t: n => L`اصطد ${fmt(n)} سمكة` },
  { id: 'mine', st: 'blocks', n: 800, e: '⛏️', t: n => L`اكسر ${fmt(n)} صخرة في المنجم` },
  { id: 'kill', st: 'kills', n: 400, e: '⚔️', t: n => L`اهزم ${fmt(n)} وحش في الزنزانة` },
  { id: 'quest', st: 'quests', n: 12, e: '📜', t: n => L`خلّص ${fmt(n)} مهمة من النقابة` },
  { id: 'gold', st: 'earned', n: 0, e: '💰', t: n => L`اكسب ${fmt(n)} ذهب` }, // half of this generation's retire goal
];
// The three village goals. hr is the Riyadh hour (UTC+3) each one starts over: 06:00, 12:00 and 18:00 UTC.
// The same hours are in tools/firestore.rules.
const VG = [
  { k: 'h', st: 'harvests', hr: 9, n: 300000, e: '🌾', b: 'vh', t: L('المحاصيل'), when: L('🕘 يتجدد كل يوم 06:00 UTC'), area: L('سرعة نمو المحاصيل') },
  { k: 'm', st: 'blocks', hr: 15, n: 150000, e: '🪨', b: 'vm', t: L('صخور المنجم'), when: L('🕒 يتجدد كل يوم 12:00 UTC'), area: L('سرعة التعدين') },
  { k: 'f', st: 'fish', hr: 21, n: 80000, e: '🐟', b: 'vf', t: L('السمك'), when: L('🕘 يتجدد كل يوم 18:00 UTC'), area: L('سرعة الصيد') },
];
const VG_TIERS = [0.1, 0.075, 0.05], VG_ALL = 0.02; // places 1-3, then everyone else who helped
/* The daily target follows the village (1.15.1): 75% of the previous round's total, never under the base (n), rounded
   to two digits. Everyone reads the same totals, so everyone gets the same target. A round's target is remembered in
   the save (S.wk.vt), so the prize check after it ends uses the same number even though the doc only keeps one round back. */
function vgNice(x) { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1)); return Math.round(x / p) * p; }
function vgNeed(g, r = vgRound(g)) {
  const vt = S.wk.vt || (S.wk.vt = {}), m = vt[g.k] || (vt[g.k] = {});
  if (m[r] !== undefined) return m[r];
  if (r !== vgRound(g)) return g.n; // a round we never saw: the base
  // Only trust totals read after this round began (an older read may hold yesterday's total before it was final).
  const start = r * 86400000 - (3 - g.hr) * 3600000, p = WK.pullAt >= start ? vgData(g, r - 1) : null;
  if (!p) return g.n; // not read yet: the base, until the next refresh
  const t = Math.max(g.n, vgNice(p.n * 0.75));
  m[r] = t; for (const k of Object.keys(m)) if (+k < r - 2) delete m[k];
  return t;
}
function vgPrize(rank) { return VG_TIERS[rank - 1] || VG_ALL; }
function vgRound(g) { return Math.floor((Date.now() + (3 - g.hr) * 3600000) / 86400000); }
function vgLeft(g) { return Math.max(0, (vgRound(g) + 1) * 86400000 - (3 - g.hr) * 3600000 - Date.now()) / 1000; }
// A goal's round as last read: { n: total, l: { uid: amount } } for round r, or null if we haven't seen it.
function vgData(g, r = vgRound(g)) {
  const d = WK.g; if (!d) return null;
  if (d[g.k + 'd'] === r) return { n: d[g.k + 'n'] || 0, l: d[g.k + 'l'] || {} };
  if (d[g.k + 'd'] === r + 1) return { n: d[g.k + 'q'] || 0, l: d[g.k + 'p'] || {} };
  return d[g.k + 'd'] < r ? { n: 0, l: {} } : null;
}
// Place in a round (1 = most), counting only those who gave more.
function vgRank(l, uid) { const mine = l[uid] || 0; return mine > 0 ? 1 + Object.values(l).filter(v => v > mine).length : 0; }
function vgUid() { return typeof CLOUD !== 'undefined' && CLOUD.user ? CLOUD.user.uid : ''; }
// Extra speed from a village goal, for game.js (speedSrc).
function vgBuff(kind) { const g = VG.find(x => x.k === kind); return g && wkOn(g.b) ? S.wk[g.b + 'p'] || 0.1 : 0; }
function wkTask(w = S.wk.id) { return WK_TASKS[w % WK_TASKS.length]; }
function wkGot(st) { return Math.max(0, (S.stats[st] || 0) - ((S.wk.s || {})[st] || 0)); }
// Village goal counting starts at b2: the start of the week, or the first time this version ran mid-week.
function vgGot(st) { return Math.max(0, (S.stats[st] || 0) - ((S.wk.b2 || S.wk.s || {})[st] || 0)); }
function wkGoal() { const t = wkTask(); return t.st === 'earned' ? S.wk.gg : t.n; }

// A new week: remember where the counters were, keep any reward that's still running.
function wkRoll() {
  const w = wkNow(); if (S.wk && S.wk.id === w) return;
  const old = S.wk || {}, s = { ...S.stats };
  S.wk = { id: w, s, b2: s, gg: Math.round(goldGoal() / 2), floor: 0, done: false, buf: old.buf || 0, vb: old.vb || 0, gx: old.gx || {}, vt: old.vt || {} }; // gx: rounds already paid out
  for (const g of VG) { S.wk[g.b] = old[g.b] || 0; S.wk[g.b + 'p'] = old[g.b + 'p'] || 0; }
  WK.top = null; WK.pullAt = 0; WK.sentWk = -1;
  if (old.id) log(L`📅 أسبوع جديد! تحدي الأسبوع: ${wkTask().e} ${wkTask().t(wkGoal())}`, 'season');
}
function wkCheck() {
  S.wk.floor = Math.max(S.wk.floor || 0, S.dun.max);
  if (!S.wk.done && wkGot(wkTask().st) >= wkGoal()) {
    S.wk.done = true; S.wk.buf = Date.now() + WK_MS;
    log(L('📅 أنجزت تحدي الأسبوع! +10% ذهب وخبرة لمدة 7 أيام'), 'golden');
    toast(L('📅 أنجزت تحدي الأسبوع!'));
  }
  if (!S.wk.b2) S.wk.b2 = { ...S.stats }; // first run of the three goals in this save
  S.wk.gx = S.wk.gx || {};
  const uid = vgUid(); if (!uid) return;
  // The prize for the round that just ended, once: only if the village reached it and this player helped.
  for (const g of VG) {
    const r = vgRound(g) - 1, d = vgData(g, r);
    if (!d || S.wk.gx[g.k] >= r) continue;
    const rank = vgRank(d.l, uid);
    if (d.n < vgNeed(g, r) || !rank) { if (WK.g && WK.g[g.k + 'd'] >= r) S.wk.gx[g.k] = r; continue; } // missed: nothing to give
    S.wk.gx[g.k] = r;
    const p = vgPrize(rank), cur = wkOn(g.b) ? S.wk[g.b + 'p'] || 0.1 : 0;
    if (p >= cur) { S.wk[g.b] = Date.now() + WK_MS; S.wk[g.b + 'p'] = p; } // a weaker prize never cuts a stronger one short
    log(L`🏆 القرية حققت هدف ${g.t}! مركزك ${rank}: +${p * 100}% ${g.area} لمدة 7 أيام`, 'golden'); // no medal emoji: 🥇🥈🥉 draw as ores
    toast(L`🏆 هدف ${g.t}: مركزك ${rank}`);
  }
}

/* ---- Firestore: the village goals and the leaderboard ---- */
const WK = { ver: 0, sentAt: 0, sentWk: -1, sent: null, busy: false, pullAt: 0, pulling: false, g: null, top: null, err: '', rk: '',
  mod: { admins: {}, ban: {} }, modAt: 0 }; // g: the goals document as last seen
/* Moderation: mod/v = { admins: { uid: true }, ban: { uid: name } }.
   The developer makes this document once in the Firebase console and puts their own uid in admins.
   After that, the developer bans or lets back a player from the leaderboard in the game (developer mode).
   A banned player is hidden from the boards, and the database rules refuse their numbers. */
const WK_MOD_MS = 600000; // players read the ban list every 10 minutes; the developer on every refresh
function wkAdmin() { return wkSignedIn() && !!WK.mod.admins[CLOUD.user.uid]; }
function wkBanned(uid) { return !!WK.mod.ban[uid]; }
function wkCloud() { return typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.ready && CLOUD.err !== 'load'; }
function wkSignedIn() { return wkCloud() && !!CLOUD.user; }
function wkAllowed() { return wkSignedIn() && S && S.started && S.wk && !saveBlocked && !S.leg.mod && S.wk.id === wkNow() && !wkBanned(CLOUD.user.uid); }
async function wkRefs() {
  await cloudDoc(); // loads the database library
  const w = CLOUD.db.collection('weekly').doc(String(S.wk.id));
  return { w, goals: CLOUD.db.collection('goals').doc('v'), me: w.collection('p').doc(CLOUD.user.uid) };
}
function wkVals() {
  const v = { gold: Math.round(wkGot('earned')), fish: wkGot('fish'), floor: S.wk.floor || 0 };
  for (const g of VG) v['g' + g.k] = Math.round(vgGot(g.st));
  return v;
}
const WK_KEYS = ['gold', 'fish', 'floor', 'gen', 'name', ...VG.map(g => 'g' + g.k)];
async function wkPush() {
  if (!wkAllowed() || WK.busy || Date.now() - WK.sentAt < (playerIdle() && !document.hidden ? WK_PUSH_IDLE_MS : WK_PUSH_MS)) return;
  WK.busy = true; WK.sentAt = Date.now(); // the wait counts from every try, so a failing send never repeats quickly
  try {
    const { goals, me } = await wkRefs(), uid = CLOUD.user.uid, F = firebase.firestore.FieldValue;
    if (WK.sentWk !== S.wk.id) { const s = await me.get(); WK.sent = s.exists ? s.data() : null; WK.sentWk = S.wk.id; }
    const old = WK.sent || {}, cur = wkVals(), was = k => old[k] || 0;
    // Never more than the rules allow since the last send (or since the week began).
    const since = (Date.now() - (old.ts && old.ts.toMillis ? old.ts.toMillis() : wkStart(S.wk.id))) / 1000;
    const lim = Math.floor(WK_RATE * Math.max(0, since - 5));
    const row = { name: (!badName(S.name) && String(S.name || '').replace(/[<>&"'`]/g, '').slice(0, 24)) || '…', gen: S.leg.gen,
      gold: Math.max(cur.gold, was('gold')), fish: Math.max(cur.fish, was('fish')), floor: Math.max(cur.floor, was('floor')) };
    const add = {}, round = {};
    for (const g of VG) { const k = 'g' + g.k; row[k] = Math.min(Math.max(cur[k], was(k)), was(k) + lim); add[g.k] = row[k] - was(k); round[g.k] = vgRound(g); }
    if (WK.sent && WK_KEYS.every(k => row[k] === old[k])) { WK.busy = false; return; }
    const b = CLOUD.db.batch(), any = VG.some(g => add[g.k] > 0);
    b.set(me, { ...row, ts: F.serverTimestamp() });
    const same = {};
    if (any) {
      // A round started since we last saw the goals: read them first, so we know whether to add to them or start them over.
      if (!WK.g || VG.some(g => WK.g[g.k + 'd'] !== round[g.k])) { const s = await goals.get(); WK.g = s.exists ? s.data() : {}; }
      const G = WK.g, up = {}, fresh = !Object.keys(G).length;
      for (const g of VG) {
        const k = g.k, a = add[k], r = round[k];
        same[k] = G[k + 'd'] === r;
        up[k + 'd'] = r;
        if (same[k]) {
          up[k + 'n'] = F.increment(a);
          if (a > 0) up[k + 'l.' + uid] = F.increment(a);
        } else { // this send starts the round: the old round moves to kp / kq if it was the one just before
          const prev = G[k + 'd'] === r - 1;
          Object.assign(up, { [k + 'n']: a, [k + 'l']: a > 0 ? { [uid]: a } : {}, [k + 'p']: prev ? G[k + 'l'] || {} : {}, [k + 'q']: prev ? G[k + 'n'] || 0 : 0 });
        }
      }
      if (fresh) b.set(goals, up); // first write ever (no round to add to, so no "kl.uid" paths, which only work in update)
      else b.update(goals, up);
    }
    await b.commit();
    WK.sent = { ...row, ts: firebase.firestore.Timestamp.now() }; WK.err = '';
    if (any) for (const g of VG) { // keep our copy of the goals in step without reading them again
      const k = g.k, a = add[k], G = WK.g;
      if (!same[k]) { const prev = G[k + 'd'] === round[k] - 1; G[k + 'p'] = prev ? G[k + 'l'] || {} : {}; G[k + 'q'] = prev ? G[k + 'n'] || 0 : 0; G[k + 'n'] = 0; G[k + 'l'] = {}; }
      G[k + 'd'] = round[k]; G[k + 'n'] = (G[k + 'n'] || 0) + a;
      if (a > 0) G[k + 'l'] = { ...G[k + 'l'], [uid]: ((G[k + 'l'] || {})[uid] || 0) + a };
    }
  } catch (e) { WK.err = (e && e.code) || 'x'; WK.sentWk = -1; WK.g = null; console.warn('weekly', WK.err); }
  WK.busy = false;
}
async function wkPull() {
  if (!wkSignedIn() || !S.wk || WK.pulling || document.hidden || Date.now() - WK.pullAt < WK_PULL_MS || (WK.pullAt && playerIdle())) return;
  WK.pulling = true; WK.pullAt = Date.now();
  try {
    const { w, goals, me } = await wkRefs(), uid = CLOUD.user.uid;
    const snap = await goals.get(); WK.g = snap.exists ? snap.data() : {};
    if (wkAdmin() || Date.now() - WK.modAt > WK_MOD_MS) {
      const m = await CLOUD.db.collection('mod').doc('v').get(), d = m.exists ? m.data() : {};
      WK.mod = { admins: d.admins || {}, ban: d.ban || {} }; WK.modAt = Date.now();
    }
    const top = {}, extra = Math.min(20, Object.keys(WK.mod.ban).length); // read a few more, so 10 are left after the banned
    for (const k of ['gold', 'floor', 'fish']) {
      const q = await w.collection('p').orderBy(k, 'desc').limit(10 + extra).get();
      top[k] = q.docs.filter(d => !wkBanned(d.id)).map(d => ({ id: d.id, name: d.data().name, gen: d.data().gen, v: d.data()[k], me: d.id === uid })).filter(r => r.v > 0).slice(0, 10);
    }
    WK.top = top; WK.err = '';
    if (WK.sentWk !== S.wk.id) { const s = await me.get(); WK.sent = s.exists ? s.data() : null; WK.sentWk = S.wk.id; }
  } catch (e) { WK.err = (e && e.code) || 'x'; console.warn('weekly', WK.err); }
  WK.pulling = false; WK.ver++; wkCheck(); // ver redraws the panel once the lists have arrived
}

/* ---- the panel at the top of the village tab ---- */
function wkSig() { return [S.wk && S.wk.id, S.wk && S.wk.done, wkOn('buf'), ...VG.map(g => [vgRound(g), wkOn(g.b)]), wkSignedIn(), WK.ver, WK.err, !!(S.leg && S.leg.mod)]; }
function wkBar(id, cls = '') { return `<div class="bar ${cls}"><i id="${id}"></i></div>`; }
function wkBoard(title, k, unit) {
  const rows = (WK.top && WK.top[k]) || [], adm = wkAdmin();
  // Players see a rude name as «…»; the developer sees the real name, the account id and a ban button.
  const nm = r => adm || !badName(r.name) ? esc(r.name) : '…';
  const tools = r => adm && !r.me ? `<button class="wk-ban" data-a="wkBan" data-v="${esc(r.id)}" data-n="${esc(r.name)}" title="${L('🚫 احظر من المتصدرين')}">🚫</button>` : '';
  const uidLine = r => adm ? `<small class="wk-uid" dir="ltr">${esc(r.id)}</small>` : '';
  return `<div class="wk-board"><b>${title}</b>${rows.length ? `<ol>${rows.map(r => `<li class="${r.me ? 'me' : ''}"><span>${tools(r)}${nm(r)}${String(r.name || '').trim().endsWith(' ' + r.gen) ? '' : ` <small>${L`ج${r.gen}`}</small>`}${uidLine(r)}</span><b>${unit(r.v)}</b></li>`).join('')}</ol>` : L('<small class="hint">ما أحد للحين، كن الأول!</small>')}</div>`;
}
// Developer mode: the banned players, each with a button to let them back.
function wkModPanel() {
  if (!wkAdmin()) return '';
  const ids = Object.keys(WK.mod.ban);
  return L`<div class="wk-box wk-mod"><b>🛠️ وضع المطوّر: المحظورين (${ids.length})</b><small class="hint">اضغط 🚫 جنب أي اسم في القوائم تحت عشان تحظره. المحظور يختفي من المتصدرين، وأرقامه ما تنقبل.</small>`
    + (ids.length ? `<ol>${ids.map(id => `<li><span>${esc(String(WK.mod.ban[id]))} <small class="wk-uid" dir="ltr">${esc(id)}</small></span><button class="btn ghost sm" data-a="wkUnban" data-v="${esc(id)}">${L('↩️ رجّعه')}</button></li>`).join('')}</ol>` : '') + '</div>';
}
async function wkModSet(uid, name) {
  try {
    await cloudDoc();
    const F = firebase.firestore.FieldValue;
    await CLOUD.db.collection('mod').doc('v').update({ ['ban.' + uid]: name === null ? F.delete() : name });
    if (name === null) delete WK.mod.ban[uid]; else WK.mod.ban[uid] = name;
    if (WK.top) for (const k in WK.top) WK.top[k] = WK.top[k].filter(r => !wkBanned(r.id));
    WK.pullAt = 0; WK.ver++; lastSig = '';
    toast(name === null ? L('↩️ رجع للمتصدرين') : L('🚫 انحظر'));
  } catch (e) { console.warn('mod', e && e.code); toast(L('❌ ما انحفظ، تأكد إن قواعد Firebase منشورة')); }
}
A.wkBan = (uid, b) => { const n = (b && b.dataset.n) || '…'; if (uid && confirm(L`نحظر «${n}» من المتصدرين؟`)) wkModSet(uid, n.slice(0, 24)); };
A.wkUnban = uid => { if (uid) wkModSet(uid, null); };
function weeklyPanel() {
  if (!S.wk) return '';
  const T = wkTask(), goal = wkGoal();
  const rew = S.wk.done ? (wkOn('buf') ? L`✅ أنجزته! المكافأة شغالة، باقي ${ftime((S.wk.buf - Date.now()) / 1000)}` : L('✅ أنجزته!')) : L('🎁 المكافأة: +10% ذهب وخبرة لمدة 7 أيام');
  let h = L`<div class="panel wk"><div class="ph"><h2>📅 هذا الأسبوع</h2><span class="stat">⏳ يتجدد بعد ${ftime(wkLeft())}</span></div>
    <div class="wk-box"><b>${T.e} تحدي الأسبوع: ${T.t(goal)}</b><small class="hint">نفس التحدي عند كل اللاعبين.</small>
    ${wkBar('wk_tb', S.wk.done ? 'done' : '')}<small id="wk_tt"></small><small>${rew}</small></div>`;
  if (!wkCloud()) return h + '</div>';
  if (!wkSignedIn()) return h + L`<div class="wk-box"><b>🏘️ أهداف القرية والمتصدرين</b><small class="hint">كل اللاعبين يجمعون مع بعض، ولوحة ترتيب أسبوعية. اربط حسابك عشان تشارك.</small><div class="row"><button class="btn gold sm" data-a="cloudChip">☁️ اربط حسابك</button></div></div></div>`;
  if (S.leg.mod) return h + L('<div class="wk-box"><small class="hint">🧪 المزارع المعدّلة ما تشارك في أهداف القرية ولا المتصدرين.</small></div></div>');
  h += L`<div class="wk-box"><b>🏘️ أهداف القرية اليومية</b><small class="hint">كل اللاعبين يجمعون مع بعض، وكل هدف يبدأ من جديد في وقته. إذا اكتمل الهدف، الجوائز تتوزع لما ينتهي وقته حسب مساهمتك:</small>
    <small class="vg-tiers">🏆 الأول +10% • الثاني +7.5% • الثالث +5% • كل من ساهم +2% (لمدة 7 أيام)</small><div class="vgs">`;
  for (const g of VG) {
    const d = vgData(g), done = d && d.n >= vgNeed(g), on = wkOn(g.b);
    h += `<div class="vg"><b>${g.e} ${g.t}: <span id="wk_vn_${g.k}">${fmt(vgNeed(g))}</span></b><small class="hint">${g.when} <span id="wk_vl_${g.k}"></span></small>
      ${wkBar('wk_vb_' + g.k, done ? 'done' : '')}<small id="wk_vt_${g.k}"></small><small id="wk_vr_${g.k}"></small><small id="wk_vp_${g.k}" class="vg-prev"></small>
      ${on ? `<small>${L`✅ جائزتك شغالة: +${(S.wk[g.b + 'p'] || 0.1) * 100}% ${g.area}، باقي ${ftime((S.wk[g.b] - Date.now()) / 1000)}`}</small>` : ''}</div>`;
  }
  h += `</div></div>
    ${wkModPanel()}<div class="wk-boards">${wkBoard(L('💰 أكثر ذهب'), 'gold', fmt)}${wkBoard(L('⚔️ أعمق طابق'), 'floor', v => fmt(v))}${wkBoard(L('🎣 أكثر صيد'), 'fish', fmt)}</div>
    <small class="hint">${WK.err ? L('⚠️ ما قدرنا نحدّث القائمة الحين، بنحاول بعد شوي.') : L('تتحدث كل 10 دقايق تقريباً. أرقامك تنرسل كل 5 دقايق.')}</small>`;
  return h + '</div>';
}
function wkUpd() {
  if (!S.wk) return;
  const goal = wkGoal(), got = Math.min(goal, wkGot(wkTask().st));
  const b = $('wk_tb'); if (b) { b.style.width = Math.min(100, got / goal * 100) + '%'; $('wk_tt').textContent = `${fmt(got)} / ${fmt(goal)}`; }
  const uid = vgUid();
  for (const g of VG) {
    const vb = $('wk_vb_' + g.k); if (!vb) continue;
    const d = vgData(g);
    const need = vgNeed(g); $('wk_vn_' + g.k).textContent = fmt(need);
    vb.style.width = Math.min(100, ((d && d.n) || 0) / need * 100) + '%'; vb.parentNode.classList.toggle('done', !!d && d.n >= need);
    $('wk_vl_' + g.k).textContent = L`(باقي ${ftime(vgLeft(g))})`;
    if (!d) { $('wk_vt_' + g.k).textContent = L('جاري التحميل…'); $('wk_vr_' + g.k).textContent = ''; continue; }
    const mine = d.l[uid] || 0, rank = vgRank(d.l, uid), n = Object.keys(d.l).length;
    // The numbers sit in their own left-to-right span so "total / goal" doesn't flip in Arabic.
    $('wk_vt_' + g.k).innerHTML = L`${`<span dir="ltr">${fmt(d.n)} / ${fmt(need)}</span>`} • مساهمتك: ${fmt(mine)}`;
    $('wk_vr_' + g.k).textContent = rank ? L`🏆 مركزك ${rank} من ${n} مساهم` : L('🏅 ساهم عشان تدخل الترتيب');
    // The round before: where this player finished and what it paid, so the prize can always be checked.
    const pd = vgData(g, vgRound(g) - 1), pr = pd ? vgRank(pd.l, uid) : 0, pn = pd ? Object.keys(pd.l).length : 0;
    $('wk_vp_' + g.k).textContent = !pd ? '' : !pr ? L('📋 الجولة الماضية: ما ساهمت')
      : pd.n < vgNeed(g, vgRound(g) - 1) ? L`📋 الجولة الماضية: مركزك ${pr} من ${pn}، والهدف ما اكتمل`
      : L`📋 الجولة الماضية: مركزك ${pr} من ${pn} ← جائزة +${vgPrize(pr) * 100}%`;
  }
}

/* ---- timers ---- */
function wkTick() {
  if (!S || !S.started) return;
  wkRoll();
  const rk = VG.map(vgRound).join();
  if (WK.rk && WK.rk !== rk) { WK.pullAt = 0; WK.ver++; } // a goal started over: read the result soon
  WK.rk = rk;
  wkCheck();
  if (document.hidden) return;
  wkPush();
  if (typeof tab !== 'undefined' && tab === 'village') wkPull();
}
setInterval(wkTick, 15000);
setTimeout(wkTick, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.wk) wkPush(); });
