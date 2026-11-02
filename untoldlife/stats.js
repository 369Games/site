'use strict';
/* Anonymous play stats for the published site.
   Sends nothing when playing locally: it only runs when site-config.js has a `stats` form (written by tools/build_site.py),
   and the player can turn it off in settings. No names, no save data: a random player id, the event and a few numbers.
   Each row goes to a hidden Google Form, so the results land in a sheet:
     visit     once per day; value = days since the first visit (retention)
     start     a new game began
     tutorial  the new-player guide was finished
     playN     N minutes of active play (10, 30, 60, 180, 600)
     genN      reached generation N; value = active minutes so far
     marry, floor30, floor100  big milestones */
const STATS_KEY = 'untoldlife_stats';
const ST = (() => { try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch (e) { return {}; } })();
if (!ST.id) ST.id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
if (!ST.first) ST.first = Date.now();
ST.sent = ST.sent || {}; ST.active = ST.active || 0;
function stSave() { try { localStorage.setItem(STATS_KEY, JSON.stringify(ST)); } catch (e) { /* storage off */ } }
stSave();

function statsForm() { const c = siteConfig().stats; return c && c.action && c.fields ? c : null; }
function statsOn() { return !!statsForm() && !ST.off; }

function track(ev, value) {
  if (ST.sent[ev]) return;
  ST.sent[ev] = 1; stSave();
  const c = statsForm(); if (!c || ST.off) return;
  const F = c.fields, b = new URLSearchParams();
  const put = (k, v) => { if (F[k]) b.set(F[k], String(v)); };
  put('player', ST.id); put('event', ev); put('value', value === undefined ? '' : value);
  put('gen', typeof S !== 'undefined' && S && S.leg ? S.leg.gen : 0);
  put('minutes', Math.round(ST.active / 60)); put('lang', typeof LANG !== 'undefined' ? LANG : '');
  put('device', typeof fbDevice === 'function' ? fbDevice() : ''); put('version', typeof fbVersion === 'function' ? fbVersion() : '');
  try { fetch(c.action, { method: 'POST', mode: 'no-cors', body: b }).catch(() => {}); } catch (e) { /* offline */ }
}

function statsCheck() {
  if (typeof S === 'undefined' || !S) return;
  const today = new Date().toISOString().slice(0, 10);
  track('visit-' + today, Math.floor((Date.now() - ST.first) / 864e5));
  if (!S.started) return;
  track('start');
  if (S.tut && S.tut.done) track('tutorial');
  for (const m of [10, 30, 60, 180, 600]) if (ST.active >= m * 60) track('play' + m);
  for (let g = 2; g <= Math.min(S.leg.gen, 30); g++) track('gen' + g, Math.round(ST.active / 60));
  if (S.spouse) track('marry');
  const best = Math.max(S.dun.max, S.leg.best.dun || 0);
  if (best >= 30) track('floor30');
  if (best >= 100) track('floor100');
}

// Count active play time: only while the page is visible and a game is running.
setInterval(() => {
  if (!document.hidden && typeof S !== 'undefined' && S && S.started) ST.active += 5;
  statsCheck();
  if (ST.active % 30 === 0) stSave();
}, 5000);
setTimeout(statsCheck, 3000);

function statsPanel() {
  if (!statsForm()) return '';
  return L`<h3>📈 إحصائيات مجهولة</h3><p class="hint">تساعدنا نعرف وين اللعبة حلوة ووين صعبة. ما نرسل اسمك ولا حفظك، بس أرقام مثل الجيل ووقت اللعب.</p>
  <div class="row"><button class="btn ghost sm" data-a="statsToggle">${ST.off ? '⬜' : '✅'} شارك إحصائيات مجهولة</button></div>`;
}
A.statsToggle = () => { ST.off = !ST.off; stSave(); lastSig = ''; };
