'use strict';
/* Industrial Age (phase 1). A second world that opens after the village is "finished": generation 10, the whole legacy
   tree at max (except Valley's Blessing, which has no max) and 1,000 legacy stars. The tabs swap; one button goes back.
   Both worlds always run together (also offline). Everything is paid with village gold, and the village's own ores
   (copper, iron, silver) feed the furnaces straight from its stock. In return the city's rails and boat make village
   miners and fishers cheaper (up to 90% off and the cost growth falling from ×1.45 to ×1.12), so 200 of each are reachable.
   State lives in S.leg.ind, so it stays through retirement. Design: INDUSTRIAL_AGE.md. */
const IND_COST = 1000, IND_GEN = 10, IND_TEASE = 7;
const IND_RES = {
  clay: { n: L('طين'), e: '🟤' }, stone: { n: L('حجر'), e: '🪨' }, wood: { n: L('خشب'), e: '🪵' },
  coal: { n: L('فحم'), e: '⚫' }, brick: { n: L('طوب'), e: '🧱' }, block: { n: L('حجر مصقول'), e: '🧊' },
  cu: { n: L('سبيكة نحاس'), e: '🟠' }, fe: { n: L('سبيكة حديد'), e: '🔗' }, ag: { n: L('سبيكة فضة'), e: '💿' },
};
const IND_FIELDS = [
  { id: 'clay', n: L('حفرة الطين') }, { id: 'stone', n: L('جبل الحجر') }, { id: 'wood', n: L('الغابة') },
];
// Furnace recipes: inputs per batch (village ores by their item id), seconds per batch per furnace, base furnace price.
const IND_RECIPES = [
  { id: 'coal', in: { wood: 3 }, t: 3, c: 5e7 },
  { id: 'brick', in: { clay: 2, coal: 1 }, t: 4, c: 1e8 },
  { id: 'block', in: { stone: 3 }, t: 4, c: 1e8 },
  { id: 'cu', in: { copper: 3, coal: 1 }, t: 6, c: 3e8 },
  { id: 'fe', in: { iron: 3, coal: 2 }, t: 8, c: 6e8 },
  { id: 'ag', in: { silver: 3, coal: 2 }, t: 10, c: 1.2e9 },
];
// City: rails (village miners) and boat (village fishers). Level L: gold 5e8 × 2^(L-1) plus these materials.
const IND_BLD_MATS = [
  [['wood', 500], ['stone', 500]], [['wood', 1500], ['block', 300]], [['brick', 600], ['block', 600]], [['brick', 1500], ['cu', 200]],
  [['cu', 600], ['fe', 200]], [['fe', 600], ['brick', 3000]], [['fe', 1500], ['block', 3000]], [['ag', 300], ['fe', 2000]],
  [['ag', 800], ['fe', 3000]], [['ag', 2000], ['fe', 5000]],
];
const IND_BLD = [
  { id: 'rails', n: L('سكة الحديد'), e: '🛤️', who: L('عمال المنجم') },
  { id: 'boat', n: L('القارب'), e: '⛵', who: L('الصيادين') },
];
const IND_MAXLV = 10, IND_WMAX = 50, IND_FMAX = 20, VILLAGE_WMAX = 200;
const IND_TABS = [['fields', L('⛰️ الحقول')], ['furn', L('🏭 المراجل')], ['city', L('🏙️ المدينة')], ['settings', L('⚙️ المزيد')]];
// Tab emblems: the painted ones once art/industry is in, stand-ins until then.
const indArt = (k, alt) => ART['ind-tab-' + k] ? 'ind-tab-' + k : alt;
Object.assign(NAV_ART, { fields: indArt('fields', 'rock'), furn: indArt('furn', 'anvil'), city: indArt('city', 'icon-map') });

function newInd() {
  return { hired: 0, f: { clay: { w: 0, l: 0 }, stone: { w: 0, l: 0 }, wood: { w: 1, l: 0 } }, r: {}, fu: {}, b: { rails: 0, boat: 0, store: 0 } };
}
function ind() { return S.leg.ind; }
function indOpen() { return !!S.leg.ind; }
function inInd() { return indOpen() && S.world === 'ind'; }
// --- unlock ---
function indPerksDone() { return PERKS.every(p => p.max === Infinity || P(p.id) >= p.max); }
function indReady() { return S.leg.gen >= IND_GEN && indPerksDone() && S.leg.stars >= IND_COST; }
// --- village effects: the discount only comes from here ---
function indLv(b) { return indOpen() ? ind().b[b] || 0 : 0; }
function indDisc(b) { return 0.09 * indLv(b); }
function indGrowth(b) { return 1.45 - 0.033 * indLv(b); }
// --- numbers ---
function indWorkers() { return 1 + ind().hired; }
function indUsed() { const f = ind().f; return IND_FIELDS.reduce((a, x) => a + f[x.id].w, 0); }
function indCap() { return 5000 * Math.pow(2, ind().b.store || 0); }
function indRate(id) { const x = ind().f[id]; return x.w * 0.5 * (1 + 0.5 * x.l); }
function indHireCost() { return Math.round(5e7 * Math.pow(1.3, ind().hired)); }
function indFieldCost(l) { return { gold: Math.round(2e8 * Math.pow(2.5, l)), qty: Math.round(200 * Math.pow(2, l)) }; }
function indFurnCost(r) { return Math.round(r.c * Math.pow(1.6, indFu(r.id).n)); }
function indStoreCost(l) { return { gold: Math.round(2e8 * Math.pow(3, l)), mats: [['wood', Math.round(1000 * Math.pow(2, l))], ['stone', Math.round(1000 * Math.pow(2, l))]] }; }
function indBldCost(l) { return { gold: Math.round(5e8 * Math.pow(2, l)), mats: IND_BLD_MATS[l] }; } // l = current level (0..9)
function indFu(id) { const fu = ind().fu; return fu[id] || (fu[id] = { n: 0, on: 1, p: 0 }); }
// A resource can be an industry one (S.leg.ind.r) or a village ore (S.inv).
function indHave(id) { return IND_RES[id] ? ind().r[id] || 0 : have(id); }
function indTake(id, q) { if (IND_RES[id]) ind().r[id] = (ind().r[id] || 0) - q; else take(id, q); }
function indCanPay(gold, mats) { return S.gold >= gold && (mats || []).every(([id, q]) => indHave(id) >= q); }
function indPay(gold, mats) { S.gold -= gold; (mats || []).forEach(([id, q]) => indTake(id, q)); }
// Small rates keep their decimals (0.33/s, not 0).
function indNum(n) { return n < 10 ? String(+n.toFixed(2)) : fmt(n); }
function indName(id) { return IND_RES[id] ? IND_RES[id].n : (ITEMS[id] || {}).n || id; }
function indIc(id, n = 24) { return ART['ind-' + id] ? icon('ind-' + id, n) : IND_RES[id] ? `<span class="ind-e">${IND_RES[id].e}</span>` : icon(ITEMS[id], n); }

// --- ticking (both worlds always run, so this is called from tick() whatever tab is open) ---
// Net change per second of every material (made minus used), smoothed over a few seconds; shown next to the stock.
const IND_NET = {};
function tickInd(dt) {
  if (!indOpen()) return;
  const I = ind(), cap = indCap(), before = {};
  for (const id in IND_RES) before[id] = I.r[id] || 0;
  for (const f of IND_FIELDS) { const v = I.r[f.id] || 0; if (v < cap) I.r[f.id] = Math.min(cap, v + indRate(f.id) * dt); }
  for (const r of IND_RECIPES) {
    const u = indFu(r.id); u.stall = '';
    if (!u.n || !u.on) { u.p = 0; continue; }
    if ((I.r[r.id] || 0) >= cap) { u.stall = 'full'; u.p = 0; continue; }
    u.p += dt * u.n / r.t;
    let k = Math.floor(u.p); if (!k) continue;
    for (const [id, q] of Object.entries(r.in)) k = Math.min(k, Math.floor(indHave(id) / q));
    k = Math.min(k, Math.floor(cap - (I.r[r.id] || 0)));
    if (k <= 0) { u.stall = 'in'; u.p = Math.min(u.p, 1); continue; }
    for (const [id, q] of Object.entries(r.in)) indTake(id, q * k);
    I.r[r.id] = (I.r[r.id] || 0) + k; u.p -= k;
  }
  if (offline || dt <= 0) return; // the catch-up's big steps would skew it
  const a = Math.min(1, dt / 3);
  for (const id in IND_RES) IND_NET[id] = (IND_NET[id] || 0) * (1 - a) + ((I.r[id] || 0) - before[id]) / dt * a;
}
function indNetTxt(id) {
  const v = IND_NET[id] || 0, z = Math.abs(v) < 0.005;
  return { t: z ? '±0' : (v > 0 ? '+' : '−') + indNum(Math.abs(v)), c: z ? 'z' : v > 0 ? 'up' : 'down' };
}
// Something in the factory needs a look: a field or a furnace is full, or a furnace is out of inputs.
function indAlert() {
  if (!indOpen()) return false;
  const cap = indCap();
  return IND_FIELDS.some(f => ind().f[f.id].w && (ind().r[f.id] || 0) >= cap) || IND_RECIPES.some(r => indFu(r.id).stall);
}
// The village needs you: the same dots as its tabs, or retirement is ready.
function villageAlert() { return Object.keys(tabAlerts()).length > 0 || canRetire(); }

// --- actions (game.js merges these into A; this file loads first, so the offline catch-up can tick the factory) ---
const IND_ACTIONS = {
  indUnlock: () => {
    if (indOpen() || !indReady()) return;
    S.leg.stars -= IND_COST; S.leg.ind = newInd();
    log(L('⚙️ فتحت عصر الصناعة! عالم جديد تبنيه من الصفر، ويرخّص عمال القرية. القرية تكمل شغلها وأنت هناك.'), 'golden');
    A.world('ind');
  },
  world: v => {
    if (v === 'ind' && !indOpen()) return;
    S.world = v === 'ind' ? 'ind' : 'village'; tab = S.world === 'ind' ? 'fields' : 'farm'; lastSig = ''; renderTabs(); scrollTo(0, 0);
  },
  // A new worker goes straight to the field with the fewest workers; move them any time.
  indHire: () => { const c = indHireCost(); if (ind().hired + 1 >= IND_WMAX || S.gold < c) return; S.gold -= c; ind().hired++; const f = ind().f; IND_FIELDS.map(x => f[x.id]).sort((a, b) => a.w - b.w)[0].w++; },
  indW: v => {
    const [id, d] = v.split(':'), f = ind().f[id]; if (!f) return;
    if (+d > 0 && indUsed() < indWorkers()) f.w++; else if (+d < 0 && f.w > 0) f.w--;
  },
  indEven: () => { const n = indWorkers(), f = ind().f; IND_FIELDS.forEach((x, i) => { f[x.id].w = Math.floor(n / 3) + (i < n % 3 ? 1 : 0); }); },
  indField: v => {
    const f = ind().f[v]; if (!f || f.l >= IND_MAXLV) return;
    const c = indFieldCost(f.l), mats = [[v, c.qty]]; if (!indCanPay(c.gold, mats)) return;
    indPay(c.gold, mats); f.l++;
  },
  indFurn: v => {
    const r = IND_RECIPES.find(x => x.id === v); if (!r) return; const u = indFu(v), c = indFurnCost(r);
    if (u.n >= IND_FMAX || S.gold < c) return; S.gold -= c; u.n++;
  },
  indFurnOn: v => { const u = indFu(v); u.on = u.on ? 0 : 1; },
  indBld: v => {
    const B = ind().b, l = B[v] || 0; if (!IND_BLD.some(b => b.id === v) || l >= IND_MAXLV) return;
    const c = indBldCost(l); if (!indCanPay(c.gold, c.mats)) return;
    indPay(c.gold, c.mats); B[v] = l + 1;
    const b = IND_BLD.find(x => x.id === v);
    log(L`${b.e} ${b.n} صارت مستوى ${B[v]}: ${b.who} في القرية أرخص ${Math.round(indDisc(v) * 100)}%`, 'golden');
  },
  indStore: () => {
    const B = ind().b, l = B.store || 0; if (l >= IND_MAXLV) return;
    const c = indStoreCost(l); if (!indCanPay(c.gold, c.mats)) return; indPay(c.gold, c.mats); B.store = l + 1;
  },
};

// --- views ---
function indReqs(gold, mats) {
  const row = (id, need, got) => `<li class="${got >= need ? 'ok' : 'no'}"><span class="ri">${id === 'gold' ? '💰' : indIc(id, 22)}</span><span class="rn">${id === 'gold' ? L('ذهب') : indName(id)}</span><span class="rq"><b>${fmt(got)}</b> / ${fmt(need)}</span><span class="rs">${got >= need ? '✔' : L`ينقصك ${fmt(need - got)}`}</span></li>`;
  return `<ul class="reqs">${row('gold', gold, S.gold)}${(mats || []).map(([id, q]) => row(id, q, indHave(id))).join('')}</ul>`;
}
function indStock() {
  const cap = indCap();
  return `<div class="ind-stock">${Object.keys(IND_RES).map(id => `<span class="ind-chip">${indIc(id, 20)} <b data-ir="${id}">${fmt(Math.floor(ind().r[id] || 0))}</b><small class="ind-net" data-inet="${id}"></small></span>`).join('')}<span class="ind-chip ghost">${L`📦 السعة ${fmt(cap)}`}</span><span class="ind-chip ghost">${L('📈 الرقم الملوّن: الصافي بالثانية بعد اللي تاكله المراجل')}</span></div>`;
}
function viewFields() {
  const I = ind(), n = indWorkers(), used = indUsed();
  let h = L`<div class="panel"><div class="ph"><h2>⛰️ الحقول</h2><span class="stat">👷 ${used} / ${n} عامل</span></div>
    <p class="hint">العمال يجمعون الخام لحالهم. وزّعهم على الحقول حسب اللي تحتاجه، وغيّر التوزيع متى ما تبي ببلاش.</p>
    <div class="row">${costBtn('indHire', '', indHireCost(), L`👷 وظّف عامل (${fmt(indHireCost())}💰)`, 'gold', I.hired + 1 >= IND_WMAX)}<button class="btn ghost" data-a="indEven">⚖️ وزّع بالتساوي</button></div>`;
  h += indStock() + '<div class="grid ind-grid">';
  for (const f of IND_FIELDS) {
    const x = I.f[f.id], c = indFieldCost(x.l), full = (I.r[f.id] || 0) >= indCap();
    h += `<div class="card ind-card"><div class="top"><span class="big">${indIc(f.id, 48)}</span><div class="meta"><b>${f.n}</b><small>${L`المستوى ${x.l} من ${IND_MAXLV}`}</small></div></div>
      <div class="kv"><span>${indName(f.id)}</span><span><b data-ir="${f.id}">${fmt(Math.floor(I.r[f.id] || 0))}</b> / ${fmt(indCap())}</span></div>
      <div class="kv"><span>${L('الإنتاج')}</span><span>${L`${indNum(indRate(f.id))} بالثانية`}</span></div>
      ${full ? `<p class="bad">${L('📦 المخزن مليان، الحقل واقف')}</p>` : ''}
      <div class="row ind-w"><button class="btn ghost sm" data-a="indW" data-v="${f.id}:-1" ${x.w ? '' : 'disabled'}>−</button><b>${L`👷 ${x.w} عامل`}</b><button class="btn ghost sm" data-a="indW" data-v="${f.id}:1" ${used < n ? '' : 'disabled'}>+</button></div>
      ${x.l < IND_MAXLV ? `<small>${L`⬆️ التطوير: +50% إنتاج لكل عامل`}</small>${indReqs(c.gold, [[f.id, c.qty]])}<div class="row"><button class="btn gold" data-a="indField" data-v="${f.id}" ${indCanPay(c.gold, [[f.id, c.qty]]) ? '' : 'disabled'}>${L('⬆️ طوّر')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  return h + '</div></div>';
}
function viewFurn() {
  let h = L`<div class="panel"><div class="ph"><h2>🏭 المراجل</h2></div>
    <p class="hint">المراجل تحوّل الخام لمواد صناعة. كل فرن يشتغل لحاله ما دام عنده مواد. النحاس والحديد والفضة تنسحب من مخزون القرية مباشرة، والفحم وقود أغلب الوصفات.</p>`;
  h += indStock() + '<div class="grid ind-grid">';
  for (const r of IND_RECIPES) {
    const u = indFu(r.id), c = indFurnCost(r);
    const ins = Object.entries(r.in).map(([id, q]) => `${q} ${indIc(id, 22)}`).join(' + ');
    const st = !u.n ? '' : !u.on ? `<p class="hint">${L('⏸️ موقف')}</p>` : u.stall === 'in' ? `<p class="bad">${L('⚠️ واقف: المواد ما تكفي')}</p>` : u.stall === 'full' ? `<p class="bad">${L('📦 المخزن مليان')}</p>` : `<p class="good">${L('⚒️ شغّال')}</p>`;
    h += `<div class="card ind-card"><div class="top"><span class="big">${indIc(r.id, 48)}</span><div class="meta"><b>${indName(r.id)}</b><small>${L`${u.n} فرن`}</small></div></div>
      <div class="kv ind-recipe"><span>${ins}</span><span>→ 1 ${indIc(r.id, 22)}</span></div>
      <div class="kv"><span>${L('الإنتاج')}</span><span>${L`${indNum(u.n / r.t)} بالثانية`}</span></div>
      <div class="kv"><span>${L('عندك')}</span><span><b data-ir="${r.id}">${fmt(Math.floor(ind().r[r.id] || 0))}</b></span></div>${st}
      <div class="row">${costBtn('indFurn', r.id, c, L`➕ فرن (${fmt(c)}💰)`, 'gold', u.n >= IND_FMAX)}${u.n ? `<button class="btn ghost sm" data-a="indFurnOn" data-v="${r.id}">${u.on ? L('⏸️ وقّف') : L('▶️ شغّل')}</button>` : ''}</div></div>`;
  }
  return h + '</div></div>';
}
function viewCity() {
  const B = ind().b;
  let h = L`<div class="panel"><div class="ph"><h2>🏙️ المدينة</h2></div>
    <p class="hint">مباني المدينة تخدم القرية: كل مستوى يرخّص العمال هناك، لين خصم 90% وزيادة سعر العامل تنزل من ×1.45 إلى ×1.12. يعني توصل 200 عامل في المنجم و200 في البحيرة.</p>`;
  h += indStock() + '<div class="grid ind-grid">';
  for (const b of IND_BLD) {
    const l = B[b.id] || 0, c = l < IND_MAXLV ? indBldCost(l) : null;
    h += `<div class="card ind-card ${l ? 'lgcard g' : ''}"><div class="top"><span class="big">${ART['ind-' + b.id] ? icon('ind-' + b.id, 48) : `<span class="ind-e big">${b.e}</span>`}</span><div class="meta"><b>${b.n}</b><small>${L`المستوى ${l} من ${IND_MAXLV}`}</small></div></div>
      <div class="kv"><span>${L`${b.who} في القرية`}</span><span class="good">${L`خصم ${Math.round(indDisc(b.id) * 100)}% • ×${indGrowth(b.id).toFixed(3)}`}</span></div>
      ${c ? `<small>${L`⬆️ المستوى ${l + 1}: خصم ${Math.round(0.09 * (l + 1) * 100)}% • ×${(1.45 - 0.033 * (l + 1)).toFixed(3)}`}</small>${indReqs(c.gold, c.mats)}<div class="row"><button class="btn gold" data-a="indBld" data-v="${b.id}" ${indCanPay(c.gold, c.mats) ? '' : 'disabled'}>${L('🏗️ ابنِ')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  const sl = B.store || 0, sc = sl < IND_MAXLV ? indStoreCost(sl) : null;
  h += `<div class="card ind-card"><div class="top"><span class="big"><span class="ind-e big">📦</span></span><div class="meta"><b>${L('المخزن')}</b><small>${L`المستوى ${sl} من ${IND_MAXLV}`}</small></div></div>
    <div class="kv"><span>${L('السعة لكل مادة')}</span><span>${fmt(indCap())}</span></div>
    ${sc ? `<small>${L('⬆️ التطوير يضاعف السعة')}</small>${indReqs(sc.gold, sc.mats)}<div class="row"><button class="btn gold" data-a="indStore" ${indCanPay(sc.gold, sc.mats) ? '' : 'disabled'}>${L('🏗️ وسّع')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  return h + '</div></div>';
}
// Numbers that change every frame are written in place; the page itself only redraws when the signature changes.
function updInd() {
  document.querySelectorAll('[data-ir]').forEach(el => { el.textContent = fmt(Math.floor(ind().r[el.dataset.ir] || 0)); });
  document.querySelectorAll('[data-inet]').forEach(el => { const n = indNetTxt(el.dataset.inet); el.textContent = n.t; el.className = 'ind-net ' + n.c; });
}
function indSig() {
  const I = ind(); if (!I) return [];
  const pay = (g, m) => indCanPay(g, m);
  return [I.hired, I.f, I.b, IND_RECIPES.map(r => { const u = indFu(r.id); return [u.n, u.on, u.stall]; }), IND_FIELDS.map(f => (I.r[f.id] || 0) >= indCap()),
    IND_FIELDS.map(f => { const c = indFieldCost(I.f[f.id].l); return pay(c.gold, [[f.id, c.qty]]); }),
    IND_BLD.map(b => (I.b[b.id] || 0) < IND_MAXLV && pay(indBldCost(I.b[b.id] || 0).gold, indBldCost(I.b[b.id] || 0).mats)),
    (I.b.store || 0) < IND_MAXLV && pay(indStoreCost(I.b.store || 0).gold, indStoreCost(I.b.store || 0).mats)];
}
const IND_VIEWS = {
  fields: [viewFields, updInd, indSig],
  furn: [viewFurn, updInd, indSig],
  city: [viewCity, updInd, indSig],
};

// The teaser / unlock card at the top of the legacy tab (from generation 7).
function indLegacyCard() {
  if (S.leg.gen < IND_TEASE) return '';
  if (indOpen()) return L`<div class="panel ind-tease open"><div class="ph"><h2>⚙️ عصر الصناعة</h2></div><p class="hint">عصر الصناعة مفتوح لعائلتك. القرية والمصنع يشتغلون مع بعض.</p><div class="row"><button class="btn gold" data-a="world" data-v="ind">⚙️ روح للمصنع</button></div></div>`;
  const ok = [S.leg.gen >= IND_GEN, indPerksDone(), S.leg.stars >= IND_COST];
  const row = (k, t) => `<li class="${ok[k] ? 'ok' : 'no'}">${ok[k] ? '✅' : '⬜'} ${t}</li>`;
  return L`<div class="panel ind-tease"><div class="ph"><h2>⚙️ عصر الصناعة</h2><span class="stat">🔒</span></div>
    <p class="hint">بعيد عن الوادي فيه أرض فاضية تنتظر عائلة تبني فيها أول مصنع. عالم جديد تبنيه من الصفر، والقرية تكمل شغلها وأنت هناك، والمصنع يرخّص عمال المنجم والصيادين لين توصل 200 عامل.</p>
    <ul class="ind-conds">${row(0, L`الجيل ${IND_GEN} أو أكثر`)}${row(1, L('كل شجرة الإرث على الحد الأقصى (ما عدا بركة الوادي)'))}${row(2, L`${fmt(IND_COST)} نجمة إرث`)}</ul>
    <div class="row"><button class="btn gold" data-a="indUnlock" ${indReady() ? '' : 'disabled'}>${L`⚙️ افتح عصر الصناعة (${fmt(IND_COST)} نجمة)`}</button></div></div>`;
}
