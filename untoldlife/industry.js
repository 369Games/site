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
  // Workshop products (phase 2) and the blueprints contracts pay with.
  plank: { n: L('ألواح خشب'), e: '📏' }, nails: { n: L('مسامير'), e: '📌' }, gear: { n: L('ترس'), e: '⚙️' },
  pipe: { n: L('أنبوب'), e: '🚰' }, machine: { n: L('آلة'), e: '🛠️' }, bp: { n: L('مخطط'), e: '📐' },
};
// The raw and furnace materials, shown on the fields, furnaces and city pages.
const IND_BASE = ['clay', 'stone', 'wood', 'coal', 'brick', 'block', 'cu', 'fe', 'ag'];
// The village ores the furnaces draw on, shown next to the factory stock (their net counts the village mining too).
const IND_ORES = ['copper', 'iron', 'silver'];
const IND_PREV = {};
const IND_FIELDS = [
  { id: 'clay', n: L('حفرة الطين') }, { id: 'stone', n: L('جبل الحجر') }, { id: 'wood', n: L('الغابة') },
];
// Furnace recipes: inputs per batch (village ores by their item id), seconds per batch per furnace, base furnace price.
const IND_RECIPES = [
  { id: 'coal', in: { wood: 3 }, out: 2, t: 3, c: 5e7 },
  { id: 'brick', in: { clay: 2, coal: 1 }, t: 4, c: 1e8 },
  { id: 'block', in: { stone: 3 }, t: 4, c: 1e8 },
  { id: 'cu', in: { copper: 3, coal: 1 }, t: 6, c: 3e8 },
  { id: 'fe', in: { iron: 3, coal: 2 }, t: 8, c: 6e8 },
  { id: 'ag', in: { silver: 3, coal: 2 }, t: 10, c: 1.2e9 },
];
// Workshop benches: the same mechanics as furnaces (their own count, pause, warehouse cap), making products.
const IND_PROD = [
  // out: how many each batch makes (1 when left out).
  { id: 'plank', in: { wood: 4 }, out: 2, t: 3, c: 1e8 },
  { id: 'nails', in: { fe: 1, block: 1 }, out: 3, t: 4, c: 3e8 }, // cut stone, so it has a use and coal isn't in everything
  { id: 'gear', in: { fe: 2, cu: 1 }, out: 2, t: 8, c: 6e8 },
  { id: 'pipe', in: { cu: 2, brick: 2 }, out: 2, t: 8, c: 6e8 },
  { id: 'machine', in: { gear: 3, pipe: 2, plank: 6, nails: 8 }, t: 30, c: 2e9 },
];
const IND_MAKERS = [...IND_RECIPES, ...IND_PROD];
// Contracts: three at a time, each asks for one or two things you already make. Base amount per material, and the gold
// a unit is worth (the reward is 1.5× that). Amounts grow 12% per finished contract and never pass 90% of the warehouse.
const IND_KQ = { clay: 400, stone: 400, wood: 400, coal: 200, brick: 200, block: 200, cu: 60, fe: 50, ag: 40, plank: 80, nails: 40, gear: 15, pipe: 15, machine: 3 };
// Contracts are the factory's big gold source; the further down the chain, the more a unit pays.
const IND_VAL = { clay: 3e6, stone: 3e6, wood: 3e6, coal: 1.5e7, brick: 2.5e7, block: 2.5e7, cu: 1e8, fe: 2e8, ag: 4e8, plank: 4.8e7, nails: 4.8e8, gear: 1.6e9, pipe: 1e9, machine: 2.4e10 };
// A delivered contract's slot waits 6 minutes for a new one (the contract trader cuts 18 s a level, down to 3 minutes).
// Two swaps; each used swap comes back after the same wait.
const IND_KSW = 2;
function indKN() { return 3 + indPt('slot4'); }
function indKWait() { return (360 - 18 * indEng('deal')) * 1000; }
// Engineer: permanent factory upgrades bought with blueprints and products (10 levels each).
const IND_ENG = [
  { id: 'furn', e: '⚡', a: 'ind-tab-furn', n: L('مراجل أسرع'), d: L('+15% سرعة لكل مستوى لكل المراجل') },
  { id: 'field', e: '⛏️', a: 'ind-tab-fields', n: L('حقول أغزر'), d: L('+15% إنتاج لكل مستوى لكل الحقول') },
  { id: 'bench', e: '🔧', a: 'ind-tab-ws', n: L('ورشة أسرع'), d: L('+15% سرعة لكل مستوى لكل طاولات الورشة') },
  { id: 'crew', e: '🏠', a: 'ind-housing', n: L('سكن العمال'), d: L('+10 لحد عمال حقول المصنع لكل مستوى (من 50 لين 150)') },
  { id: 'deal', e: '🤝', a: 'ind-trader', n: L('تاجر العقود'), d: L('+10% ذهب من العقود و−18 ثانية من انتظار العقود والتبديل لكل مستوى (من 6 دقايق لين 3)') },
];
const IND_ENG_BP = [1, 2, 3, 4, 6, 8, 10, 13, 16, 20];
// City: rails (village miners) and boat (village fishers). Level L: gold 5e8 × 2^(L-1) plus these materials.
// Each level asks more than the warehouse holds at the start (1,000, doubling per level), so the warehouse paces the climb:
// level 2 needs warehouse 1, 3 → 2, 4–5 → 3, 6 → 4, 7–8 → 5, 9–10 → 6.
const IND_BLD_MATS = [
  [['wood', 800], ['stone', 800]], [['wood', 1900], ['block', 1500]], [['brick', 3000], ['block', 3800]], [['brick', 6000], ['cu', 1000]],
  [['cu', 5000], ['fe', 1500]], [['fe', 5000], ['brick', 15000]], [['fe', 10000], ['block', 30000]], [['ag', 5000], ['fe', 20000]],
  [['ag', 12000], ['fe', 40000]], [['ag', 30000], ['fe', 60000]],
];
const IND_BLD = [
  { id: 'rails', n: L('سكة الحديد'), e: '🛤️', who: L('عمال المنجم') },
  { id: 'boat', n: L('القارب'), e: '⛵', who: L('الصيادين') },
];
const IND_MAXLV = 10, IND_WMAX = 50, IND_FMAX = 33, VILLAGE_WMAX = 200;
/* Town hall (1.11): the main building. No other building (rails, boat, warehouse) and no field goes above its level,
   and each level allows 3 more furnaces and 3 more benches of every kind (3 at level 0, 33 at level 10).
   Level L → L+1 costs gold 1B × 3^L plus materials that fit the warehouse you can have by then (15/16 of 1,000 × 2^L).
   It looks different as it grows: a small house (0–3), a big hall (4–6), a grand hall (7–9) and a palace (10). */
const IND_HALL_MATS = [
  [['wood', 800], ['stone', 800]], [['brick', 1500], ['block', 1500]], [['brick', 3000], ['plank', 1500]],
  [['block', 6000], ['cu', 3000], ['nails', 500]], [['fe', 10000], ['plank', 8000], ['gear', 300]],
  [['brick', 25000], ['fe', 15000], ['pipe', 1000]], [['block', 50000], ['ag', 20000], ['gear', 3000]],
  [['fe', 100000], ['pipe', 8000], ['machine', 100]], [['ag', 150000], ['gear', 30000], ['machine', 400]],
  [['fe', 400000], ['ag', 300000], ['machine', 1500]],
];
const IND_HALL_STAGES = [
  { from: 0, n: L('بيت البلدة'), e: '🏤' }, { from: 4, n: L('دار البلدة الكبيرة'), e: '🏤' },
  { from: 7, n: L('مقر البلدة الفخم'), e: '🏤' }, { from: 10, n: L('قصر البلدة'), e: '🏤' },
];
function indLocked() { return indPt('util') ? {} : { util: 1 }; }
function indTabs() {
  return [['fields', L('⛰️ الحقول')], ['furn', L('🏭 المراجل')], ['ws', L('🔧 الورشة')], ['city', L('🏙️ المدينة')],
    ['util', L('⚡ الخدمات')], ['pat', L('🔬 الاختراعات')], ['settings', L('⚙️ المزيد')]];
}
// Tab emblems: the painted ones once art/industry is in, stand-ins until then.
const indArt = (k, alt) => ART['ind-tab-' + k] ? 'ind-tab-' + k : alt;
Object.assign(NAV_ART, { fields: indArt('fields', 'rock'), furn: indArt('furn', 'anvil'), ws: indArt('ws', 'icon-auto-forge'), city: indArt('city', 'icon-map'), util: indArt('util', 'icon-sunny'), pat: indArt('pat', 'legacy-tree') });

/* Factory renewal and patents (1.12). With the town hall at level 10 (the palace) the factory can be renewed: it starts over
   (fields, workers, furnaces and benches, warehouse, town hall, materials, contracts, and the engineer unless kept) and
   pays patents by how far it got. Rails and boat stay, so the village keeps its discounts. Patents buy permanent perks;
   the first one opens the public services, which pay gold straight into your purse (no market). */
const IND_RENEW_HALL = 10;
// A skill tree: r/col place each invention, and it opens once the one above (need) reaches level nl.
const IND_PT = [
  { id: 'util', r: 1, col: 2, e: '⚡', max: 1, c: [10], n: L('الخدمات العامة'), d: L('يفتح تبويب الخدمات: الكهرباء والمياه والضرايب، وكلها تجيب ذهب مباشرة') },
  { id: 'hall', r: 2, col: 1, need: 'util', nl: 1, e: '🏤', max: 3, c: [8, 8, 8], n: L('أساس متين'), d: L('بعد كل تجديد يبدأ مبنى البلدة من مستوى أعلى (+1 لكل مستوى)') },
  { id: 'store', r: 2, col: 3, need: 'util', nl: 1, e: '📦', max: 3, c: [8, 8, 8], n: L('مخزن جاهز'), d: L('بعد كل تجديد يبدأ المخزن من مستوى أعلى (+1 لكل مستوى)') },
  { id: 'eng', r: 4, col: 1, need: 'fast', nl: 1, e: '👷', max: 1, c: [20], n: L('دفتر المهندس'), d: L('تطويرات المهندس تبقى معك بعد التجديد') },
  { id: 'slot4', r: 3, col: 3, need: 'store', nl: 1, e: '📜', max: 1, c: [15], n: L('تاجر رابع'), d: L('خانة عقد رابعة في المدينة') },
  { id: 'fast', r: 3, col: 1, need: 'hall', nl: 1, e: '⚙️', max: 5, c: [6, 6, 6, 6, 6], n: L('آلات محسّنة'), d: L('+10% سرعة لكل المراجل وطاولات الورشة لكل مستوى') },
  { id: 'thrift', r: 3, col: 2, need: 'grid', nl: 5, e: '♻️', max: 1, c: [40], n: L('مصانع موفّرة'), d: L('كل الأفران وطاولات الورشة تعطي نفس الإنتاج بنص المواد') },
  { id: 'grid', r: 2, col: 2, need: 'util', nl: 1, e: '🔌', max: 5, c: [10, 10, 10, 10, 10], n: L('شبكة أقوى'), d: L('+20% ذهب من الخدمات لكل مستوى') },
];
/* Public services: built with village gold and factory goods, kept forever (they don't reset with a renewal).
   Gold per second = base × the village gold multiplier, so they keep pace with the generations like the barn does.
   All three at level 10 come to about 3× a strong generation-13 barn. */
const IND_UTIL = [
  { id: 'power', e: '🔌', n: L('شركة الكهرباء'), d: L('أكبر دخل، ويكبر مع مستوى مبنى البلدة'), first: L('🔌 قريتك صار فيها كهرب! الأنوار تشتغل في الليل'),
    g: 2e10, mats: l => [['cu', 2000 * (l + 1)], ['machine', 5 * (l + 1)]] },
  { id: 'water', e: '💧', n: L('المياه والصرف'), d: L('دخل ثابت، والقرية صارت أنظف'), first: L('💧 قريتك صارت أنظف! المياه وصلت كل بيت'),
    g: 1.5e10, mats: l => [['pipe', 200 * (l + 1)], ['brick', 5000 * (l + 1)]] },
  { id: 'tax', e: '🧾', n: L('مكتب الضرايب'), d: L('يكبر مع عدد عمال المنجم والصيادين في القرية'), first: L('🧾 أهل القرية صاروا يدفعون ضرايب، والخزنة تمتلي'),
    g: 1e10, mats: l => [['block', 5000 * (l + 1)], ['plank', 2000 * (l + 1)]] },
];
function indInMult() { return indPt('thrift') ? 0.5 : 1; }
function indPt(id) { const t = (S.leg.ind || {}).pt; return t ? t[id] || 0 : 0; }
function indPtLocked(x) { return !!x.need && indPt(x.need) < x.nl; }
function indPats() { return Math.floor(ind().pat || 0); }
function indRenewLv() { const I = ind(); return indHall() + (I.b.store || 0) + IND_FIELDS.reduce((a, f) => a + I.f[f.id].l, 0); }
function indRenewGain() { return 10 + Math.floor(indRenewLv() / 2) + Math.floor((ind().kd || 0) / 20); }
function indUl(id) { const u = ind().u; return u ? u[id] || 0 : 0; }
function indUtilCost(x, l) { return { gold: Math.round(x.g * Math.pow(1.6, l)), mats: x.mats(l) }; }
// Base gold per second of one service at level l (before the village gold multiplier and the grid patent).
function indUtilBase(id, l = indUl(id)) {
  if (id === 'power') return 4e5 * l * (1 + indHall() / 10);
  if (id === 'water') return 4e5 * l;
  return 1125 * l * Math.min(VILLAGE_WMAX * 2, S.mine.miners + S.lake.fishers);
}
function indUtilMult() { return goldMult() * (1 + 0.2 * indPt('grid')); }
function indUtilRate(id) { return indUtilBase(id) * indUtilMult(); }
function indUtilTotal() { return indOpen() && indPt('util') ? IND_UTIL.reduce((a, x) => a + indUtilRate(x.id), 0) : 0; }
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
function indCap() { return 1000 * Math.pow(2, ind().b.store || 0); }
function indRate(id) { const x = ind().f[id]; return x.w * 0.5 * (1 + 0.5 * x.l) * (1 + 0.15 * indEng('field')); }
function indEng(id) { const e = ind().e; return e ? e[id] || 0 : 0; }
function indWMax() { return IND_WMAX + 10 * indEng('crew'); }
// Furnaces and benches speed up with their engineer upgrade.
function indSpeed(r) { return (1 + 0.15 * indEng(IND_PROD.includes(r) ? 'bench' : 'furn')) * (1 + 0.1 * indPt('fast')); }
function indEngCost(l) {
  const mats = l < 3 ? [['plank', 50 * (l + 1)], ['nails', 20 * (l + 1)]] : l < 6 ? [['gear', 10 * (l - 2)], ['pipe', 10 * (l - 2)]] : [['machine', 2 * (l - 5)]];
  return { gold: 0, mats: [['bp', IND_ENG_BP[l]], ...mats] };
}
// +7% per worker, so every level of workers' housing is worth buying (worker 150 ≈ 1.2T, all 150 ≈ 18T).
function indHireCost() { return Math.round(5e7 * Math.pow(1.07, ind().hired)); }
function indFieldCost(l) { return { gold: Math.round(2e8 * Math.pow(2.5, l)), qty: Math.round(200 * Math.pow(2, l)) }; }
// ×1.3 per furnace (was ×1.6), so the 33 the town hall allows are within reach: the 33rd coal furnace ≈ 221B.
function indFurnCost(r) { return Math.round(r.c * Math.pow(1.3, indFu(r.id).n)); }
// Never ask for a full warehouse: furnaces keep nibbling at the stock, so it would sit a few short of the cap forever.
// The expansion asks 15/16 of the current capacity, rounded to two digits (32K → 30K).
function indSig2(n) { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n / p) * p; }
function indStoreCost(l) { const q = indSig2(1000 * Math.pow(2, l) * 15 / 16); return { gold: Math.round(2e8 * Math.pow(3, l)), mats: [['wood', q], ['stone', q]] }; }
function indBldCost(l) { return { gold: Math.round(5e8 * Math.pow(2, l)), mats: IND_BLD_MATS[l] }; } // l = current level (0..9)
function indHall() { return ind().b.hall || 0; }
// Half of the original price at every level (1.13.6): gold 500M × 3^L and half the materials.
function indHallCost(l) { return { gold: Math.round(5e8 * Math.pow(3, l)), mats: IND_HALL_MATS[l].map(([id, q]) => [id, Math.round(q / 2)]) }; }
function indHallStage(l = indHall()) { let i = 0; IND_HALL_STAGES.forEach((x, k) => { if (l >= x.from) i = k; }); return i; }
function indHallIc(n, l = indHall()) { const i = indHallStage(l), k = 'ind-hall-' + (i + 1); return ART[k] ? icon(k, n) : `<span class="ind-e big">${IND_HALL_STAGES[i].e}</span>`; }
// Every levelled building and field has four looks, like the town hall: levels 0–3, 4–6, 7–9 and 10.
// Painted as ind-<key>-1..4; until those exist it falls back to its single picture, then to its emoji.
function indStage(l) { return l >= 10 ? 3 : l >= 7 ? 2 : l >= 4 ? 1 : 0; }
function indLvIc(key, l, n, alt) { const k = 'ind-' + key + '-' + (indStage(l) + 1); return ART[k] ? icon(k, n) : ART['ind-' + key] ? icon('ind-' + key, n) : alt; }
function indStageLog(name, l) { if (l === 4 || l === 7 || l === 10) log(L`🎉 شكل ${name} تغيّر مع المستوى ${l}!`, 'golden', 'ind'); }
function indFurnMax() { return Math.min(IND_FMAX, 3 * (indHall() + 1)); }
// Shown instead of the upgrade button when the town hall holds a building or field back.
function indHallGate(next) { return next > indHall() ? `<p class="bad">${L`🏤 يحتاج مبنى البلدة مستوى ${next}`}</p>` : ''; }
function indFu(id) { const fu = ind().fu; return fu[id] || (fu[id] = { n: 0, on: 1, p: 0 }); }
// A resource can be an industry one (S.leg.ind.r) or a village ore (S.inv).
function indHave(id) { return IND_RES[id] ? ind().r[id] || 0 : have(id); }
function indTake(id, q) { if (IND_RES[id]) ind().r[id] = (ind().r[id] || 0) - q; else take(id, q); }
function indCanPay(gold, mats) { return S.gold >= gold && (mats || []).every(([id, q]) => indHave(id) >= q); }
function indPay(gold, mats) { S.gold -= gold; (mats || []).forEach(([id, q]) => indTake(id, q)); }
// Small rates keep their decimals (0.33/s, not 0).
function indClock(ms) { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
function indNum(n) { return n < 10 ? String(+n.toFixed(2)) : fmt(n); }
function indName(id) { return IND_RES[id] ? IND_RES[id].n : (ITEMS[id] || {}).n || id; }
function indIc(id, n = 24) { return ART['ind-' + id] ? icon('ind-' + id, n) : IND_RES[id] ? `<span class="ind-e">${IND_RES[id].e}</span>` : icon(ITEMS[id], n); }

// --- ticking (both worlds always run, so this is called from tick() whatever tab is open) ---
// Net change per second of every material (made minus used), smoothed over a few seconds; shown next to the stock.
const IND_NET = {};
// For the countdowns: a snapshot of every stock once a second for the last minute, so a rate is (now − a minute ago) / time.
// Furnaces work in batches, so the quick average above jumps too much to time anything with.
const IND_HIST = [], IND_ETA = {};
function tickInd(dt) {
  if (!indOpen()) return;
  const I = ind(), cap = indCap(), before = {};
  for (const id in IND_RES) before[id] = I.r[id] || 0;
  for (const f of IND_FIELDS) { const v = I.r[f.id] || 0; if (v < cap) I.r[f.id] = Math.min(cap, v + indRate(f.id) * dt); }
  for (const r of IND_MAKERS) {
    const u = indFu(r.id); u.stall = '';
    if (!u.n || !u.on) { u.p = 0; u.sz = 0; continue; }
    if ((I.r[r.id] || 0) >= cap) { u.stall = 'full'; u.p = 0; u.sz = 0; continue; }
    u.p += dt * u.n * indSpeed(r) / r.t;
    let k = Math.floor(u.p); if (!k) continue;
    // With the thrift patent every input costs half; the leftover half-units carry over (u.c), so stocks stay whole numbers.
    const hf = indInMult(), cr = u.c || (u.c = {});
    for (const [id, q] of Object.entries(r.in)) k = Math.min(k, Math.floor((indHave(id) + (cr[id] || 0)) / (q * hf)));
    const out = r.out || 1;
    k = Math.min(k, Math.floor((cap - (I.r[r.id] || 0)) / out));
    if (k <= 0) { u.stall = 'in'; u.p = Math.min(u.p, 1); u.sz = (u.sz || 0) + dt; continue; }
    for (const [id, q] of Object.entries(r.in)) { const need = q * k * hf - (cr[id] || 0), t = Math.max(0, Math.ceil(need - 1e-9)); indTake(id, t); cr[id] = t - need; }
    I.r[r.id] = (I.r[r.id] || 0) + k * out; u.p -= k; u.sz = 0;
  }
  indKFill();
  const ug = indUtilTotal() * dt; if (ug > 0) addGold(ug);
  if (offline || dt <= 0) return; // the catch-up's big steps would skew it
  const a = Math.min(1, dt / 3);
  for (const id in IND_RES) IND_NET[id] = (IND_NET[id] || 0) * (1 - a) + ((I.r[id] || 0) - before[id]) / dt * a;
  // Village ores change outside this function too (the miners), so their net runs from one tick to the next.
  { const e = S.gen.earned; if (IND_PREV.gold !== undefined && e >= IND_PREV.gold) IND_NET.gold = (IND_NET.gold || 0) * (1 - a) + (e - IND_PREV.gold) / dt * a; IND_PREV.gold = e; }
  for (const id of IND_ORES) { const v = have(id); if (IND_PREV[id] !== undefined) IND_NET[id] = (IND_NET[id] || 0) * (1 - a) + (v - IND_PREV[id]) / dt * a; IND_PREV[id] = v; }
  const now = Date.now(), last = IND_HIST[IND_HIST.length - 1];
  if (!last || now - last.t >= 1000) {
    const v = { gold: S.gen.earned }; for (const id in IND_RES) v[id] = I.r[id] || 0; for (const id of IND_ORES) v[id] = have(id);
    IND_HIST.push({ t: now, v }); while (IND_HIST.length > 2 && now - IND_HIST[0].t > 60000) IND_HIST.shift();
  }
}
// Net per second over the last minute (gold: gold earned). null while there are under 20 seconds of history.
function indRateOf(id) {
  const a = IND_HIST[0], b = IND_HIST[IND_HIST.length - 1]; if (!a || b.t - a.t < 20000) return null;
  const r = ((b.v[id] || 0) - (a.v[id] || 0)) / ((b.t - a.t) / 1000);
  return id === 'gold' ? Math.max(0, r) : r;
}
function indNetTxt(id) {
  const v = IND_NET[id] || 0, z = Math.abs(v) < 0.005;
  return { t: z ? '±0' : (v > 0 ? '+' : '−') + indNum(Math.abs(v)), c: z ? 'z' : v > 0 ? 'up' : 'down' };
}
// Something in the factory needs a look: a field or a furnace is full, or a furnace is out of inputs.
function indAlert() {
  if (!indOpen()) return false;
  return IND_FIELDS.some(f => indFieldSt(f.id).c) || IND_MAKERS.some(r => indMakerSt(r).c === 'bad') || indKReady();
}
// Status lines. Stock hovers right at the cap (furnaces nibble, fields refill), so "full" counts from 99%, and
// "out of materials" only after 2 seconds of waiting; both are written in place, so the cards never jump.
function indFull(id) { return (ind().r[id] || 0) >= indCap() * 0.99; }
function indFieldSt(id) { return ind().f[id].w && indFull(id) ? { c: 'bad', t: L('📦 المخزن مليان، الحقل واقف') } : { c: '', t: '' }; }
function indMakerSt(r) {
  const u = indFu(r.id);
  return !u.n ? { c: '', t: '' } : !u.on ? { c: 'hint', t: L('⏸️ موقف') } : indFull(r.id) ? { c: 'bad', t: L('📦 المخزن مليان') }
    : (u.sz || 0) >= 2 ? { c: 'bad', t: L('⚠️ واقف: المواد ما تكفي') } : { c: 'good', t: L('⚒️ شغّال') };
}
function indStLine(key, st) { return `<p class="ind-st ${st.c}" data-ist="${key}">${st.t}</p>`; }

// --- contracts ---
// Things you can already make: the three fields, plus every furnace or bench you own.
function indPool() { return [...IND_FIELDS.map(f => f.id), ...IND_MAKERS.filter(r => indFu(r.id).n).map(r => r.id)]; }
function indNewK() {
  const t = ind().kd || 0, pool = indPool(), n = t >= 3 && pool.length > 1 ? 2 : 1, max = Math.floor(indCap() * 0.9), need = [];
  // The newest things you make turn up a bit more often than raw materials.
  const pick = () => pool[Math.min(pool.length - 1, Math.floor(Math.pow(Math.random(), 0.7) * pool.length))];
  while (need.length < n) { const id = pick(); if (!need.some(x => x[0] === id)) need.push([id, Math.max(1, Math.min(max, Math.round(IND_KQ[id] * (1 + 0.12 * t))))]); }
  const v = need.reduce((a, [id, q]) => a + q * IND_VAL[id], 0), prod = need.some(([id]) => IND_PROD.some(p => p.id === id));
  return { need, g: Math.round(v * 1.5), bp: n + (prod ? 1 : 0) + Math.floor(t / 10) };
}
// An empty slot ({ at }) gets its new contract once the wait is over.
function indKFill() {
  const I = ind(), now = Date.now(); if (!I.k) I.k = [];
  while (I.k.length < indKN()) I.k.push(indNewK());
  I.k.forEach((k, i) => { if (!k.need && now >= k.at) I.k[i] = indNewK(); });
}
// Worked out from what it asks (not stored), so contracts already on the board follow any price change.
function indKGold(k) { return Math.round(k.need.reduce((a, [id, q]) => a + q * IND_VAL[id], 0) * 1.5 * (1 + 0.1 * indEng('deal'))); }
function indKCan(k) { return !!k.need && k.need.every(([id, q]) => indHave(id) >= q); }
function indSwaps() { const now = Date.now(); return IND_KSW - (ind().sw || []).filter(t => t > now).length; }
function indSwapBack() { const now = Date.now(); return Math.min(...(ind().sw || []).filter(t => t > now)); }
function indKReady() { return (ind().k || []).some(indKCan); }
// The village needs you: the same dots as its tabs, or retirement is ready.
function villageAlert() { return Object.keys(tabAlerts()).length > 0 || canRetire(); }

// --- actions (game.js merges these into A; this file loads first, so the offline catch-up can tick the factory) ---
let indRenewArm = 0;
const IND_ACTIONS = {
  indUnlock: () => {
    if (indOpen() || !indReady()) return;
    S.leg.stars -= IND_COST; S.leg.ind = newInd();
    log(L('⚙️ فتحت عصر الصناعة! عالم جديد تبنيه من الصفر، ويرخّص عمال القرية. القرية تكمل شغلها وأنت هناك.'), 'golden', 'ind');
    A.world('ind');
  },
  world: v => {
    if (v === 'ind' && !indOpen()) return;
    S.world = v === 'ind' ? 'ind' : 'village'; tab = S.world === 'ind' ? 'fields' : 'farm'; lastSig = ''; renderTabs(); scrollTo(0, 0);
    logDirty = true; logDrawT = 0; lastBuffs = ''; renderSide(); // the side panel follows the world
  },
  // A new worker goes straight to the field with the fewest workers; move them any time.
  indHire: () => { const c = indHireCost(); if (ind().hired + 1 >= indWMax() || S.gold < c) return; S.gold -= c; ind().hired++; const f = ind().f; IND_FIELDS.map(x => f[x.id]).sort((a, b) => a.w - b.w)[0].w++; },
  indW: v => {
    const [id, d] = v.split(':'), f = ind().f[id]; if (!f) return;
    if (+d > 0 && indUsed() < indWorkers()) f.w++; else if (+d < 0 && f.w > 0) f.w--;
  },
  indEven: () => { const n = indWorkers(), f = ind().f; IND_FIELDS.forEach((x, i) => { f[x.id].w = Math.floor(n / 3) + (i < n % 3 ? 1 : 0); }); },
  indField: v => {
    const f = ind().f[v]; if (!f || f.l >= IND_MAXLV || f.l >= indHall()) return;
    const c = indFieldCost(f.l), mats = [[v, c.qty]]; if (!indCanPay(c.gold, mats)) return;
    indPay(c.gold, mats); f.l++; indStageLog(IND_FIELDS.find(x => x.id === v).n, f.l);
  },
  indFurn: v => {
    const r = IND_MAKERS.find(x => x.id === v); if (!r) return; const u = indFu(v), c = indFurnCost(r);
    if (u.n >= indFurnMax() || S.gold < c) return; S.gold -= c; u.n++;
  },
  indFurnOn: v => { const u = indFu(v); u.on = u.on ? 0 : 1; },
  indBld: v => {
    const B = ind().b, l = B[v] || 0; if (!IND_BLD.some(b => b.id === v) || l >= IND_MAXLV || l >= indHall()) return;
    const c = indBldCost(l); if (!indCanPay(c.gold, c.mats)) return;
    indPay(c.gold, c.mats); B[v] = l + 1;
    const b = IND_BLD.find(x => x.id === v); indStageLog(b.n, B[v]);
    log(L`${b.e} ${b.n} صارت مستوى ${B[v]}: ${b.who} في القرية أرخص ${Math.round(indDisc(v) * 100)}%`, 'golden', 'ind');
  },
  indStore: () => {
    const B = ind().b, l = B.store || 0; if (l >= IND_MAXLV || l >= indHall()) return;
    const c = indStoreCost(l); if (!indCanPay(c.gold, c.mats)) return; indPay(c.gold, c.mats); B.store = l + 1; indStageLog(L('المخزن'), B.store);
  },
  indHall: () => {
    const B = ind().b, l = B.hall || 0; if (l >= IND_MAXLV) return;
    const c = indHallCost(l); if (!indCanPay(c.gold, c.mats)) return;
    indPay(c.gold, c.mats); B.hall = l + 1;
    const st = IND_HALL_STAGES[indHallStage()];
    log(L`🏤 مبنى البلدة صار مستوى ${B.hall}: المباني والحقول لين مستوى ${B.hall}، و${indFurnMax()} فرن وطاولة من كل نوع`, 'golden', 'ind');
    if (st.from === B.hall) log(L`🎉 مبنى البلدة كبر وصار ${st.n}!`, 'golden', 'ind');
  },
  // Deliver a contract: the materials go, gold and blueprints come, and a new contract takes its place.
  indK: v => {
    const I = ind(), k = (I.k || [])[+v]; if (!k || !indKCan(k)) return;
    k.need.forEach(([id, q]) => indTake(id, q));
    const g = indKGold(k); addGold(g); // gold from contracts counts as earned, like any other gold
    I.r.bp = (I.r.bp || 0) + k.bp; I.kd = (I.kd || 0) + 1;
    I.k[+v] = { at: Date.now() + indKWait() };
    log(L`📜 سلّمت عقد: +${fmt(g)}💰 و+${k.bp} 📐`, 'golden', 'ind');
  },
  // Swap a contract you don't want for a new one: two swaps, each comes back after the contract wait.
  indKSkip: v => {
    const I = ind(), k = (I.k || [])[+v]; if (!k || !k.need || indSwaps() < 1) return;
    I.sw = (I.sw || []).filter(t => t > Date.now()); I.sw.push(Date.now() + indKWait());
    I.k[+v] = indNewK();
  },
  indPt: v => {
    const x = IND_PT.find(p => p.id === v); if (!x) return;
    const I = ind(), l = indPt(v); if (l >= x.max || indPtLocked(x) || indPats() < x.c[l]) return;
    I.pat -= x.c[l]; I.pt = I.pt || {}; I.pt[v] = l + 1;
    log(L`🔬 اخترعت ${x.e} ${x.n}${x.max > 1 ? ` (${l + 1}/${x.max})` : ''}`, 'golden', 'ind');
    if (v === 'util') { log(L('⚡ تبويب الخدمات انفتح: ابنِ شركة الكهرباء والمياه ومكتب الضرايب، وكلها تجيب ذهب لحالها'), 'golden', 'ind'); renderTabs(); }
  },
  indUtil: v => {
    const x = IND_UTIL.find(u => u.id === v); if (!x || !indPt('util')) return;
    const I = ind(), l = indUl(v); if (l >= IND_MAXLV) return;
    const c = indUtilCost(x, l); if (!indCanPay(c.gold, c.mats)) return;
    indPay(c.gold, c.mats); I.u = I.u || {}; I.u[v] = l + 1;
    log(l ? L`${x.e} ${x.n} صار مستوى ${l + 1}` : x.first, 'golden', 'ind'); indStageLog(x.n, l + 1);
    if (!l && v === 'power') renderTabs(); // the village night lights up (world-theme.css: .village-lit)
  },
  // Renewing asks twice (the button arms itself for a few seconds), since it starts the factory over.
  indRenew: () => {
    if (indHall() < IND_RENEW_HALL) return;
    if (!indRenewArm || Date.now() > indRenewArm) { indRenewArm = Date.now() + 5000; lastSig = ''; return; }
    indRenewArm = 0;
    const I = ind(), gain = indRenewGain();
    I.pat = (I.pat || 0) + gain; I.ren = (I.ren || 0) + 1;
    const keep = { rails: I.b.rails || 0, boat: I.b.boat || 0 }, fresh = newInd();
    Object.assign(I, { hired: 0, f: fresh.f, r: {}, fu: {}, k: [], kd: 0, sw: [] });
    I.b = { ...keep, store: indPt('store'), hall: indPt('hall') };
    if (!indPt('eng')) I.e = {};
    log(L`🔬 جدّدت المصنع! أخذت ${gain} براءة اختراع. المصنع رجع من الصفر، والقرية محتفظة بخصوماتها`, 'golden', 'ind');
    tab = 'pat'; lastSig = ''; renderTabs();
  },
  indEng: v => {
    const g = IND_ENG.find(x => x.id === v); if (!g) return;
    const I = ind(), l = indEng(v); if (l >= IND_MAXLV) return;
    const c = indEngCost(l); if (!indCanPay(0, c.mats)) return;
    indPay(0, c.mats); I.e = I.e || {}; I.e[v] = l + 1;
    log(L`👷 المهندس طوّر ${g.e} ${g.n} لمستوى ${l + 1}`, 'golden', 'ind');
  },
};

// --- views ---
// A warning when a cost is more than the warehouse can hold, so the player knows to expand it first.
function indTooBig(mats) { const big = Math.max(...mats.map(m => m[1])); return big > indCap() ? `<p class="bad">${L`📦 تحتاج مخزن أكبر: السعة ${fmt(indCap())} وهذا يحتاج ${fmt(big)}`}</p>` : ''; }
/* Countdowns, from the smoothed net rates: how long until a requirement is met (gold uses the gold earned per second),
   and how long until a field or a furnace's output fills the warehouse. */
function indGot(id) { return id === 'gold' ? S.gold : indHave(id); }
// A countdown keeps its finish time and just ticks down; it only takes a new estimate when the rate really changed
// (more than 20% off, or a minute, whichever is bigger), so it doesn't jump around every second.
function indEta(key, left, rate) {
  if (rate === null) return null;
  if (!(rate > 0.0001)) { delete IND_ETA[key]; return 0; }
  const now = Date.now(), est = now + left / rate * 1000, e = IND_ETA[key];
  if (!e || Math.abs(est - e) > Math.max(60000, (est - now) * 0.2)) IND_ETA[key] = est;
  return Math.max(0, (IND_ETA[key] - now) / 1000);
}
// [what's missing, how long] for a requirement row; the time sits on its own line under it.
function indEtaTxt(id, need) {
  const got = indGot(id); if (got >= need) return ['✔', ''];
  const t = indEta('r:' + id + ':' + need, need - got, indRateOf(id));
  return [L`ينقصك ${fmt(need - got)}`, t === null ? L('يحسب...') : t ? L`بعد ${ftime(t)}` : L('ما يزيد حالياً')];
}
function indFillTxt(id) {
  const v = indHave(id), cap = indCap(); if (v >= cap * 0.99) return L('المخزن مليان');
  const t = indEta('f:' + id, cap - v, indRateOf(id));
  return t === null ? L('يحسب...') : t ? L`المخزن يمتلي بعد ${ftime(t)}` : L('ما يزيد حالياً');
}
function indReqs(gold, mats) {
  const row = (id, need, got) => `<li class="${got >= need ? 'ok' : 'no'}"><span class="ri">${id === 'gold' ? '💰' : indIc(id, 22)}</span><span class="rn">${id === 'gold' ? L('ذهب') : indName(id)}</span><span class="rq"><b data-eg="${id}">${fmt(got)}</b> / ${fmt(need)}</span><span class="rs">${(e => `<span data-eta="${id}:${need}">${e[0]}</span><span class="eta" data-etat="${id}:${need}">${e[1]}</span>`)(indEtaTxt(id, need))}</span></li>`;
  return `<ul class="reqs">${gold ? row('gold', gold, S.gold) : ''}${(mats || []).map(([id, q]) => row(id, q, indHave(id))).join('')}</ul>`;
}
function indStock(ids = IND_BASE) {
  const cap = indCap();
  return `<div class="ind-stock">${ids.map(id => `<span class="ind-chip${IND_RES[id] ? '' : ' vil'}" title="${IND_RES[id] ? indName(id) : L`${indName(id)} (مخزن القرية)`}">${indIc(id, 20)} <b data-ir="${id}">${fmt(Math.floor(indHave(id)))}</b><small class="ind-net" data-inet="${id}"></small></span>`).join('')}<span class="ind-chip ghost">${L`📦 السعة ${fmt(cap)}`}</span><span class="ind-chip ghost wide">${L('📈 الرقم الملوّن: الصافي بالثانية بعد اللي تاكله المراجل')}</span></div>`;
}
function viewFields() {
  const I = ind(), n = indWorkers(), used = indUsed();
  let h = L`<div class="panel"><div class="ph"><h2>⛰️ الحقول</h2><span class="stat">👷 ${used} / ${n} عامل</span></div>
    <p class="hint">العمال يجمعون الخام لحالهم. وزّعهم على الحقول حسب اللي تحتاجه، وغيّر التوزيع متى ما تبي ببلاش.</p>
    <div class="row">${costBtn('indHire', '', indHireCost(), L`👷 وظّف عامل (${fmt(indHireCost())}💰)`, 'gold', I.hired + 1 >= indWMax())}<button class="btn ghost" data-a="indEven">⚖️ وزّع بالتساوي</button></div>`;
  h += indStock() + '<div class="grid ind-grid">';
  for (const f of IND_FIELDS) {
    const x = I.f[f.id], c = indFieldCost(x.l);
    h += `<div class="card ind-card"><div class="top"><span class="big">${indLvIc('f-' + f.id, x.l, 48, indIc(f.id, 48))}</span><div class="meta"><b>${f.n}</b><small>${L`المستوى ${x.l} من ${IND_MAXLV}`}</small></div></div>
      <div class="kv"><span>${indName(f.id)}</span><span><b data-ir="${f.id}">${fmt(Math.floor(I.r[f.id] || 0))}</b> / ${fmt(indCap())}</span></div>
      <div class="kv"><span>${L('الإنتاج')}</span><span>${L`${indNum(indRate(f.id))} بالثانية`}</span></div>
      <small class="ind-fill">⏳ <span data-fill="${f.id}">${indFillTxt(f.id)}</span></small>
      ${indStLine('f:' + f.id, indFieldSt(f.id))}
      <div class="row ind-w"><button class="btn ghost sm" data-a="indW" data-v="${f.id}:-1" ${x.w ? '' : 'disabled'}>−</button><b>${L`👷 ${x.w} عامل`}</b><button class="btn ghost sm" data-a="indW" data-v="${f.id}:1" ${used < n ? '' : 'disabled'}>+</button></div>
      ${x.l < IND_MAXLV ? `<small>${L`⬆️ التطوير: +50% إنتاج لكل عامل`}</small>${indReqs(c.gold, [[f.id, c.qty]])}${indTooBig([[f.id, c.qty]])}${indHallGate(x.l + 1)}<div class="row"><button class="btn gold" data-a="indField" data-v="${f.id}" ${indCanPay(c.gold, [[f.id, c.qty]]) && x.l < indHall() ? '' : 'disabled'}>${L('⬆️ طوّر')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  return h + '</div></div>';
}
function viewFurn() {
  let h = L`<div class="panel"><div class="ph"><h2>🏭 المراجل</h2></div>
    <p class="hint">المراجل تحوّل الخام لمواد صناعة. كل فرن يشتغل لحاله ما دام عنده مواد. النحاس والحديد والفضة تنسحب من مخزون القرية مباشرة، والفحم وقود أغلب الوصفات.</p>`;
  h += indStock([...IND_BASE, ...IND_ORES]) + '<div class="grid ind-grid">' + IND_RECIPES.map(r => indMakerCard(r, false)).join('');
  return h + '</div></div>';
}
// One furnace or workbench card: recipe, output per second, stock, state, and buy/pause.
function indMakerCard(r, bench) {
  const u = indFu(r.id), c = indFurnCost(r);
  const ins = Object.entries(r.in).map(([id, q]) => `<span class="ind-q" title="${indName(id)}">${indNum(q * indInMult())} ${indIc(id, 22)}</span>`).join(' + ');
  const st = u.n ? indStLine('m:' + r.id, indMakerSt(r)) : '';
  return `<div class="card ind-card"><div class="top"><span class="big">${indIc(r.id, 48)}</span><div class="meta"><b>${indName(r.id)}</b><small>${bench ? L`${u.n} طاولة` : L`${u.n} فرن`}</small></div></div>
    <div class="kv ind-recipe"><span>${L('يحتاج')}</span><span>${ins}</span></div>
    <div class="kv ind-recipe"><span>${L('يعطي')}</span><span class="ind-q">${r.out || 1} ${indIc(r.id, 22)}</span></div>
    <div class="kv"><span>${L('الإنتاج')}</span><span>${L`${indNum(u.n * indSpeed(r) * (r.out || 1) / r.t)} بالثانية`}</span></div>
    <div class="kv"><span>${L('عندك')}</span><span><b data-ir="${r.id}">${fmt(Math.floor(ind().r[r.id] || 0))}</b></span></div>${u.n ? `<small class="ind-fill">⏳ <span data-fill="${r.id}">${indFillTxt(r.id)}</span></small>` : ''}${st}
    ${u.n >= indFurnMax() && u.n < IND_FMAX ? `<p class="hint">${L`🏤 الحد ${indFurnMax()}: طوّر مبنى البلدة عشان تزيد`}</p>` : ''}
    <div class="row">${costBtn('indFurn', r.id, c, bench ? L`➕ طاولة (${fmt(c)}💰)` : L`➕ فرن (${fmt(c)}💰)`, 'gold', u.n >= indFurnMax())}${u.n ? `<button class="btn ghost sm" data-a="indFurnOn" data-v="${r.id}">${u.on ? L('⏸️ وقّف') : L('▶️ شغّل')}</button>` : ''}</div></div>`;
}
// The workshop: products on benches and the engineer.
function viewWs() {
  const I = ind();
  let h = L`<div class="panel"><div class="ph"><h2>🔧 الورشة</h2><span class="stat">📐 ${fmt(I.r.bp || 0)} مخطط</span></div>
    <p class="hint">طاولات الورشة تحوّل الطوب والسبايك لمنتجات. المنتجات تسلّمها في العقود، والمهندس يحتاجها مع المخططات عشان يطوّر المصنع.</p>`;
  h += indStock([...IND_BASE, ...IND_PROD.map(p => p.id), 'bp']) + '<div class="grid ind-grid">' + IND_PROD.map(r => indMakerCard(r, true)).join('') + '</div></div>';
  h += L`<div class="panel"><div class="ph"><h2>${indIc('engineer', 28)} المهندس</h2></div>
    <p class="hint">المهندس يطوّر المصنع للأبد بالمخططات والمنتجات. أول المستويات تحتاج ألواح ومسامير، بعدها تروس وأنابيب، وآخرها آلات.</p><div class="grid ind-grid">`;
  for (const g of IND_ENG) {
    const l = indEng(g.id), c = l < IND_MAXLV ? indEngCost(l) : null;
    h += `<div class="card ind-card ${l ? 'lgcard g' : ''}"><div class="top"><span class="big">${ART[g.a] ? icon(g.a, 48) : `<span class="ind-e big">${g.e}</span>`}</span><div class="meta"><b>${g.n}</b><small>${L`المستوى ${l} من ${IND_MAXLV}`}</small></div></div>
      <p class="hint">${g.d}</p>
      ${c ? `${indReqs(0, c.mats)}${indTooBig(c.mats.filter(m => m[0] !== 'bp'))}<div class="row"><button class="btn gold" data-a="indEng" data-v="${g.id}" ${indCanPay(0, c.mats) ? '' : 'disabled'}>${L('⬆️ طوّر')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  return h + '</div></div>';
}
// Contracts (in the city): three slots, a wait after each delivery, and two swaps that come back after the same wait.
function indContracts() {
  const I = ind(), now = Date.now(), sw = indSwaps(), w = Math.round(indKWait() / 1000);
  let h = L`<div class="panel"><div class="ph"><h2>${indIc('contract', 28)} العقود</h2><span class="stat">✅ ${fmt(I.kd || 0)} عقد</span></div>
    <p class="hint">التجار يطلبون أشياء تسويها. سلّمها وخذ ذهب ومخططات 📐. كل عقد تسلّمه يكبّر الطلبات اللي بعده ومكافآتها. بعد ما تسلّم عقد، التجار يحتاجون ${indClock(w * 1000)} يجهّزون طلب جديد (تاجر العقود عند المهندس يقصّرها لين 3 دقايق). عندك تبديلين، وكل تبديل يرجع بعد نفس الوقت.</p>`;
  h += `<p class="ind-sw">${sw > 0 ? L`🔄 التبديلات: ${sw} من ${IND_KSW}` : L`🔄 التبديلات خلصت، يرجع واحد بعد <b data-kw="${indSwapBack()}">${indClock(indSwapBack() - now)}</b>`}</p><div class="grid ind-grid">`;
  (I.k || []).forEach((k, i) => {
    if (!k.need) { h += `<div class="card ind-card ind-k ind-kwait"><div class="top"><span class="big">${indIc('contract', 48)}</span><div class="meta"><b>${L`عقد ${i + 1}`}</b><small>${L('التجار يجهّزون طلب جديد')}</small></div></div><p class="hint">${L`⏳ عقد جديد بعد <b data-kw="${k.at}">${indClock(k.at - now)}</b>`}</p></div>`; return; }
    h += `<div class="card ind-card ind-k ${indKCan(k) ? 'lgcard g' : ''}"><div class="top"><span class="big">${indIc('contract', 48)}</span><div class="meta"><b>${L`عقد ${i + 1}`}</b><small>${L`المكافأة: ${fmt(indKGold(k))}💰 + ${k.bp} 📐`}</small></div></div>
      ${indReqs(0, k.need)}
      <div class="row"><button class="btn gold" data-a="indK" data-v="${i}" ${indKCan(k) ? '' : 'disabled'}>${L('📦 سلّم')}</button><button class="btn ghost sm" data-a="indKSkip" data-v="${i}" ${sw > 0 ? '' : 'disabled'}>${L`🔄 بدّل (${sw})`}</button></div></div>`;
  });
  return h + '</div></div>';
}
// The town hall card, first in the city.
function indHallCard() {
  const l = indHall(), st = IND_HALL_STAGES[indHallStage()], c = l < IND_MAXLV ? indHallCost(l) : null, nx = l < IND_MAXLV ? IND_HALL_STAGES.find(x => x.from === l + 1) : null;
  return `<div class="card ind-card ind-hall lgcard g"><div class="top"><span class="big">${indHallIc(64)}</span><div class="meta"><b>${st.n}</b><small>${L`مبنى البلدة: المستوى ${l} من ${IND_MAXLV}`}</small></div></div>
    <p class="hint">${L('المبنى الرئيسي: ما فيه مبنى ولا حقل يطلع فوق مستواه، وكل مستوى يسمح لك بـ3 أفران و3 طاولات زيادة من كل نوع.')}</p>
    <div class="kv"><span>${L('أعلى مستوى للمباني والحقول')}</span><span>${l}</span></div>
    <div class="kv"><span>${L('أفران وطاولات من كل نوع')}</span><span>${indFurnMax()}</span></div>
    ${c ? `<small>${L`⬆️ المستوى ${l + 1}: ${3 * (l + 2) > IND_FMAX ? IND_FMAX : 3 * (l + 2)} فرن وطاولة من كل نوع`}${nx ? L` • ويصير ${nx.n} ${nx.e}` : ''}</small>${indReqs(c.gold, c.mats)}${indTooBig(c.mats)}<div class="row"><button class="btn gold" data-a="indHall" ${indCanPay(c.gold, c.mats) ? '' : 'disabled'}>${L('🏤 طوّر مبنى البلدة')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
}
function viewCity() {
  const B = ind().b;
  let h = L`<div class="panel"><div class="ph"><h2>🏙️ المدينة</h2></div>
    <p class="hint">مباني المدينة تخدم القرية: كل مستوى يرخّص العمال هناك، لين خصم 90% وزيادة سعر العامل تنزل من ×1.45 إلى ×1.12. يعني توصل 200 عامل في المنجم و200 في البحيرة.</p>`;
  h += indStock([...IND_BASE, ...IND_PROD.map(p => p.id)]) + '<div class="grid ind-grid">' + indHallCard();
  for (const b of IND_BLD) {
    const l = B[b.id] || 0, c = l < IND_MAXLV ? indBldCost(l) : null;
    h += `<div class="card ind-card ${l ? 'lgcard g' : ''}"><div class="top"><span class="big">${indLvIc(b.id, l, 48, `<span class="ind-e big">${b.e}</span>`)}</span><div class="meta"><b>${b.n}</b><small>${L`المستوى ${l} من ${IND_MAXLV}`}</small></div></div>
      <div class="kv"><span>${L`${b.who} في القرية`}</span><span class="good">${L`خصم ${Math.round(indDisc(b.id) * 100)}% • ×${indGrowth(b.id).toFixed(3)}`}</span></div>
      ${c ? `<small>${L`⬆️ المستوى ${l + 1}: خصم ${Math.round(0.09 * (l + 1) * 100)}% • ×${(1.45 - 0.033 * (l + 1)).toFixed(3)}`}</small>${indReqs(c.gold, c.mats)}${indTooBig(c.mats)}${indHallGate(l + 1)}<div class="row"><button class="btn gold" data-a="indBld" data-v="${b.id}" ${indCanPay(c.gold, c.mats) && l < indHall() ? '' : 'disabled'}>${L('🏗️ ابنِ')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  const sl = B.store || 0, sc = sl < IND_MAXLV ? indStoreCost(sl) : null;
  h += `<div class="card ind-card"><div class="top"><span class="big">${indLvIc('store', sl, 48, '<span class="ind-e big">📦</span>')}</span><div class="meta"><b>${L('المخزن')}</b><small>${L`المستوى ${sl} من ${IND_MAXLV}`}</small></div></div>
    <div class="kv"><span>${L('السعة لكل مادة')}</span><span>${fmt(indCap())}</span></div>
    ${sc ? `<small>${L('⬆️ التطوير يضاعف السعة')}</small>${indReqs(sc.gold, sc.mats)}${indHallGate(sl + 1)}<div class="row"><button class="btn gold" data-a="indStore" ${indCanPay(sc.gold, sc.mats) && sl < indHall() ? '' : 'disabled'}>${L('🏗️ وسّع')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  return h + '</div></div>' + indContracts();
}
// Inventions: the renewal card and the patent tree.
function viewPat() {
  const I = ind(), ok = indHall() >= IND_RENEW_HALL, armed = indRenewArm && Date.now() < indRenewArm;
  let h = L`<div class="panel"><div class="ph"><h2>🔬 الاختراعات</h2><span class="stat">🎫 ${indPats()} براءة</span></div>
    <p class="hint">لما يصير مبنى البلدة قصر (المستوى ${IND_RENEW_HALL})، تقدر تجدّد المصنع: يرجع من الصفر وتاخذ براءات اختراع حسب وين وصلت. البراءات تشتري فيها اختراعات تبقى معك للأبد. سكة الحديد والقارب ما ينعادون، فخصومات القرية باقية.</p>`;
  h += `<div class="card ind-card ind-renew ${ok ? 'lgcard g' : ''}"><div class="top"><span class="big">${indHallIc(64, 10)}</span><div class="meta"><b>${L('جدّد المصنع')}</b><small>${L`تجديدات: ${I.ren || 0}`}</small></div></div>
    <div class="kv"><span>${L('البراءات اللي بتاخذها الحين')}</span><span class="good">+${indRenewGain()} 🎫</span></div>
    <small>${L`10 أساس + نص مجموع مستويات مبنى البلدة والمخزن والحقول (${indRenewLv()}) + براءة لكل 20 عقد (${I.kd || 0})`}</small>
    <p class="hint">${L('ينعاد: الحقول والعمال والأفران والطاولات والمخزن ومبنى البلدة والمواد والعقود، والمهندس (إلا لو عندك دفتر المهندس). يبقى: سكة الحديد والقارب والخدمات والاختراعات.')}</p>
    ${ok ? `<div class="row"><button class="btn ${armed ? 'red' : 'gold'}" data-a="indRenew">${armed ? L('⚠️ متأكد؟ اضغط مرة ثانية') : L('🔬 جدّد المصنع')}</button></div>` : `<p class="bad">${L`🏤 يحتاج مبنى البلدة مستوى ${IND_RENEW_HALL} (عندك ${indHall()})`}</p>`}</div>`;
  h += '</div>' + L`<div class="panel"><div class="ph"><h2>🗾 خريطة الاختراعات</h2></div><div class="pt-tree"><i class="pt-bar" aria-hidden="true"></i>`;
  for (const x of IND_PT) {
    const l = indPt(x.id), lock = indPtLocked(x), c = l < x.max ? x.c[l] : 0, nd = x.need && IND_PT.find(p => p.id === x.need);
    h += `<div class="card ind-card pt-node ${x.need ? 'has-need' : 'pt-root'} ${l ? 'lgcard g on' : ''} ${lock ? 'pt-lock' : ''}" style="grid-row:${x.r};grid-column:${x.col}"><div class="top"><span class="big">${ART['ind-pt-' + x.id] ? icon('ind-pt-' + x.id, 48) : x.id === 'hall' ? indHallIc(48, 4) : `<span class="ind-e big">${x.e}</span>`}</span><div class="meta"><b>${x.n}</b><small>${L`المستوى ${l} من ${x.max}`}</small></div></div>
      <p class="hint">${x.d}</p>
      ${l >= x.max ? `<p class="good">${L('✅ أعلى مستوى')}</p>` : lock ? `<p class="bad">${x.nl > 1 ? L`🔒 يحتاج ${nd.n} ${x.nl}/${nd.max}` : L`🔒 يحتاج ${nd.n}`}</p>`
        : `<div class="row"><button class="btn gold" data-a="indPt" data-v="${x.id}" ${indPats() >= c ? '' : 'disabled'}>${L`🔬 اخترع (${c} 🎫)`}</button></div>`}</div>`;
  }
  return h + '</div></div>';
}
// Public services: three buildings that pay gold every second, straight into the purse.
function viewUtil() {
  let h = L`<div class="panel"><div class="ph"><h2>⚡ الخدمات</h2><span class="stat">💰 ${fmt(indUtilTotal())} بالثانية</span></div>
    <p class="hint">الخدمات العامة تخدم القرية وتجيب ذهب لحالها كل ثانية، بدون سوق. تبقى معك حتى لو جدّدت المصنع، ودخلها يكبر مع مضاعف الذهب في القرية.</p><div class="grid ind-grid">`;
  for (const x of IND_UTIL) {
    const l = indUl(x.id), c = l < IND_MAXLV ? indUtilCost(x, l) : null;
    const next = c ? (indUtilBase(x.id, l + 1) - indUtilBase(x.id, l)) * indUtilMult() : 0;
    h += `<div class="card ind-card ${l ? 'lgcard g' : ''}"><div class="top"><span class="big">${indLvIc('u-' + x.id, l, 48, `<span class="ind-e big">${x.e}</span>`)}</span><div class="meta"><b>${x.n}</b><small>${L`المستوى ${l} من ${IND_MAXLV}`}</small></div></div>
      <p class="hint">${x.d}</p>
      <div class="kv"><span>${L('الدخل')}</span><span class="good">${L`${fmt(indUtilRate(x.id))} بالثانية`}</span></div>
      ${c ? `<small>${L`⬆️ المستوى ${l + 1}: +${fmt(next)} بالثانية`}</small>${indReqs(c.gold, c.mats)}${indTooBig(c.mats)}<div class="row"><button class="btn gold" data-a="indUtil" data-v="${x.id}" ${indCanPay(c.gold, c.mats) ? '' : 'disabled'}>${l ? L('⬆️ طوّر') : L('🏗️ ابنِ')}</button></div>` : `<p class="good">${L('✅ أعلى مستوى')}</p>`}</div>`;
  }
  return h + '</div></div>';
}
// Numbers that change every frame are written in place; the page itself only redraws when the signature changes.
function updInd() {
  document.querySelectorAll('[data-ir]').forEach(el => { el.textContent = fmt(Math.floor(indHave(el.dataset.ir))); });
  document.querySelectorAll('[data-ist]').forEach(el => {
    const [k, id] = el.dataset.ist.split(':'), st = k === 'f' ? indFieldSt(id) : indMakerSt(IND_MAKERS.find(r => r.id === id));
    if (el.textContent !== st.t) { el.textContent = st.t; el.className = 'ind-st ' + st.c; }
  });
  document.querySelectorAll('[data-kw]').forEach(el => { el.textContent = indClock(+el.dataset.kw - Date.now()); });
  document.querySelectorAll('[data-eg]').forEach(el => { el.textContent = fmt(indGot(el.dataset.eg)); });
  document.querySelectorAll('[data-eta]').forEach(el => { const [id, n] = el.dataset.eta.split(':'), t = indEtaTxt(id, +n)[0]; if (el.textContent !== t) el.textContent = t; });
  document.querySelectorAll('[data-etat]').forEach(el => { const [id, n] = el.dataset.etat.split(':'), t = indEtaTxt(id, +n)[1]; if (el.textContent !== t) el.textContent = t; });
  document.querySelectorAll('[data-fill]').forEach(el => { const t = indFillTxt(el.dataset.fill); if (el.textContent !== t) el.textContent = t; });
  document.querySelectorAll('[data-inet]').forEach(el => { const n = indNetTxt(el.dataset.inet); el.textContent = n.t; el.className = 'ind-net ' + n.c; });
}
function indSig() {
  const I = ind(); if (!I) return [];
  const pay = (g, m) => indCanPay(g, m);
  return [I.hired, I.f, I.b, I.e, IND_MAKERS.map(r => { const u = indFu(r.id); return [u.n, u.on]; }), (I.b.hall || 0) < IND_MAXLV && pay(indHallCost(I.b.hall || 0).gold, indHallCost(I.b.hall || 0).mats),
    IND_FIELDS.map(f => { const c = indFieldCost(I.f[f.id].l); return pay(c.gold, [[f.id, c.qty]]); }),
    IND_BLD.map(b => (I.b[b.id] || 0) < IND_MAXLV && pay(indBldCost(I.b[b.id] || 0).gold, indBldCost(I.b[b.id] || 0).mats)),
    (I.b.store || 0) < IND_MAXLV && pay(indStoreCost(I.b.store || 0).gold, indStoreCost(I.b.store || 0).mats)];
}
const IND_VIEWS = {
  fields: [viewFields, updInd, indSig],
  furn: [viewFurn, updInd, indSig],
  city: [viewCity, updInd, () => { const I = ind(); return [indSig(), I.kd, (I.k || []).map(k => k.need ? [k.need, indKCan(k)] : 0), indSwaps()]; }],
  pat: [viewPat, updInd, () => { const I = ind(); return [I.pat, I.pt, I.ren, indHall(), indRenewGain(), !!(indRenewArm && Date.now() < indRenewArm)]; }],
  util: [viewUtil, updInd, () => { const I = ind(); return [I.u, I.pt, Math.floor(indUtilTotal() / 1e3), IND_UTIL.map(x => indUl(x.id) < IND_MAXLV && indCanPay(indUtilCost(x, indUl(x.id)).gold, indUtilCost(x, indUl(x.id)).mats))]; }],
  ws: [viewWs, updInd, () => {
    const I = ind();
    return [indSig(), IND_ENG.map(g => indEng(g.id) < IND_MAXLV && indCanPay(0, indEngCost(indEng(g.id)).mats)), Math.floor(I.r.bp || 0)];
  }],
};

// The factory's own buffs panel: what speeds each part up, and what the factory gives the village.
function indBuffsHtml() {
  const g = buffGroup, I = ind(), B = I.b, cnt = list => list.reduce((a, r) => a + indFu(r.id).n, 0);
  const row = (n, v) => [n, v];
  // Info-only card (no multiplier line).
  const info = (title, rows) => `<div class="bf"><div class="bfh"><b>${title}</b></div>${rows.map(([n, v]) => `<div class="bfl ex"><span>${n}</span><span>${v}</span></div>`).join('')}</div>`;
  let h = '';
  if (indPt('util')) h += g(L('⚡ ذهب الخدمات'), [[L('💰 مضاعف الذهب في القرية'), goldMult()], [L('🔌 شبكة أقوى (اختراع)'), 1 + 0.2 * indPt('grid')]],
    [row(L('💰 المجموع'), L`${fmt(indUtilTotal())} بالثانية`), ...IND_UTIL.map(x => row(`${x.e} ${x.n} (${L`مستوى ${indUl(x.id)}`})`, L`${fmt(indUtilRate(x.id))} بالثانية`))]);
  h += info(L('🔬 الاختراعات'), [row(L('🎫 براءات عندك'), indPats()), row(L('🔁 تجديدات'), I.ren || 0), row(L('🎫 لو جدّدت الحين'), '+' + indRenewGain())]);
  h += info(L('🏤 مبنى البلدة'), [row(IND_HALL_STAGES[indHallStage()].n, L`مستوى ${indHall()}`), row(L('أعلى مستوى للمباني والحقول'), indHall()), row(L('أفران وطاولات من كل نوع'), indFurnMax())]);
  h += g(L('⛰️ إنتاج الحقول'), [[L('⛏️ حقول أغزر (المهندس)'), 1 + 0.15 * indEng('field')]],
    [row(L('👷 العمال'), `${indWorkers()} / ${indWMax()}`), ...IND_FIELDS.map(f => row(`${f.n} (${L`مستوى ${I.f[f.id].l}`})`, L`${indNum(indRate(f.id))} بالثانية`))]);
  h += g(L('🏭 سرعة المراجل'), [[L('⚡ مراجل أسرع (المهندس)'), 1 + 0.15 * indEng('furn')]], [row(L('🏭 عدد الأفران'), cnt(IND_RECIPES))]);
  h += g(L('🔧 سرعة الورشة'), [[L('🔧 ورشة أسرع (المهندس)'), 1 + 0.15 * indEng('bench')]], [row(L('🪚 عدد الطاولات'), cnt(IND_PROD))]);
  h += g(L('📜 ذهب العقود'), [[L('🤝 تاجر العقود (المهندس)'), 1 + 0.1 * indEng('deal')]],
    [row(L('⏳ انتظار العقد والتبديل'), indClock(indKWait())), row(L('✅ عقود مسلّمة'), fmt(I.kd || 0)), row(L('📈 حجم الطلب الجاي'), '×' + (1 + 0.12 * (I.kd || 0)).toFixed(2)), row(L('📐 مخططاتك'), fmt(I.r.bp || 0))]);
  h += info(L('🏘️ للقرية'), IND_BLD.map(b => row(`${b.e} ${b.n} (${L`مستوى ${B[b.id] || 0}`})`, L`${b.who}: خصم ${Math.round(indDisc(b.id) * 100)}% • ×${indGrowth(b.id).toFixed(3)}`)).concat([row(L('👷 حد العمال في القرية'), VILLAGE_WMAX)]));
  h += info(L('📦 المخزن'), [row(L`السعة لكل مادة (مستوى ${B.store || 0})`, fmt(indCap()))]);
  return h;
}
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
