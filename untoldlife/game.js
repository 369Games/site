'use strict';
/* =====================================================
   UntoldLife — لعبة idle: مزرعة، حيوانات، منجم، ونقابة مرتزقة
   كل شيء يعمل محلياً ويُحفظ في المتصفح (localStorage)
   ===================================================== */

const SAVE_KEY = 'untoldlife_save_v1';
const DAY_LEN = 150;            // ثواني حقيقية لليوم الواحد
const DAYS_PER_SEASON = 7;
const MAX_PLOTS = 30;

const SEASONS = [
  { n: L('الربيع'), e: '🌸' }, { n: L('الصيف'), e: '☀️' }, { n: L('الخريف'), e: '🍂' }, { n: L('الشتاء'), e: '❄️' },
];
const WEATHER = {
  sunny: { n: L('مشمس'), e: '☀️' }, cloudy: { n: L('غائم'), e: '⛅' },
  rain: { n: L('ممطر'), e: '🌧️' }, snow: { n: L('ثلجي'), e: '🌨️' },
};
const TIER = [L('عادي'), L('نحاسي'), L('حديدي'), L('فضي'), L('ذهبي'), L('ميثريل'), L('أدامانتيت')];
const SKILL_N = { farm: L('الزراعة'), ranch: L('الرعي'), mine: L('التعدين'), fish: L('الصيد') };
const CAT_NAMES = { crop: L('🌾 محاصيل'), animal: L('🥚 منتجات حيوانية'), fish: L('🐟 أسماك'), monster: L('🦴 غنائم الوحوش'), ore: L('⛏️ معادن'), gem: L('💎 جواهر') };

/* ---------------- بيانات اللعبة ---------------- */
const ITEMS = {};
function addItem(id, o) { ITEMS[id] = { id, ...o }; }

const CROPS = [
  // الربيع
  { id: 'turnip', n: L('لفت'), e: '🥬', seed: 5, price: 12, grow: 20, season: 0, lvl: 1 },
  { id: 'garlic', n: L('ثوم'), e: '🧄', seed: 10, price: 28, grow: 35, season: 0, lvl: 2 },
  { id: 'potato', n: L('بطاطس'), e: '🥔', seed: 15, price: 40, grow: 45, season: 0, lvl: 3 },
  { id: 'strawberry', n: L('فراولة'), e: '🍓', seed: 60, price: 150, grow: 90, season: 0, lvl: 5 },
  { id: 'broccoli', n: L('بروكلي'), e: '🥦', seed: 100, price: 270, grow: 110, season: 0, lvl: 8 },
  // الصيف
  { id: 'cucumber', n: L('خيار'), e: '🥒', seed: 6, price: 15, grow: 22, season: 1, lvl: 1 },
  { id: 'tomato', n: L('طماطم'), e: '🍅', seed: 30, price: 80, grow: 50, season: 1, lvl: 3 },
  { id: 'corn', n: L('ذرة'), e: '🌽', seed: 80, price: 210, grow: 100, season: 1, lvl: 6 },
  { id: 'bellpepper', n: L('فلفل رومي'), e: '🫑', seed: 140, price: 380, grow: 130, season: 1, lvl: 9 },
  { id: 'watermelon', n: L('بطيخ'), e: '🍉', seed: 250, price: 700, grow: 200, season: 1, lvl: 10 },
  // الخريف
  { id: 'mushroom', n: L('فطر'), e: '🍄', seed: 7, price: 17, grow: 25, season: 2, lvl: 1 },
  { id: 'eggplant', n: L('باذنجان'), e: '🍆', seed: 50, price: 130, grow: 70, season: 2, lvl: 4 },
  { id: 'apple', n: L('تفاح'), e: '🍎', seed: 90, price: 240, grow: 95, season: 2, lvl: 6 },
  { id: 'pumpkin', n: L('يقطين'), e: '🎃', seed: 180, price: 480, grow: 150, season: 2, lvl: 8 },
  { id: 'grape', n: L('عنب'), e: '🍇', seed: 400, price: 1100, grow: 260, season: 2, lvl: 12 },
  // الشتاء
  { id: 'carrot', n: L('جزر'), e: '🥕', seed: 8, price: 20, grow: 30, season: 3, lvl: 1 },
  { id: 'onion', n: L('بصل'), e: '🧅', seed: 25, price: 65, grow: 50, season: 3, lvl: 3 },
  { id: 'sweetpotato', n: L('بطاطا حلوة'), e: '🍠', seed: 120, price: 330, grow: 120, season: 3, lvl: 7 },
  { id: 'pepper', n: L('فلفل حار'), e: '🌶️', seed: 300, price: 850, grow: 220, season: 3, lvl: 11 },
  { id: 'chestnut', n: L('كستناء'), e: '🌰', seed: 450, price: 1250, grow: 280, season: 3, lvl: 13 },
  // نادرة (تنفتح في الجيل الثالث) — تنمو بسرعة كاملة في كل المواسم
  { id: 'saffron', n: L('زعفران'), e: '🌺', seed: 600, price: 1700, grow: 300, season: 4, lvl: 10 },
  { id: 'dates', n: L('تمر'), e: '🌴', seed: 900, price: 2600, grow: 380, season: 4, lvl: 13 },
  { id: 'mango', n: L('مانجو'), e: '🥭', seed: 1400, price: 4000, grow: 450, season: 4, lvl: 16 },
  { id: 'pineapple', n: L('أناناس'), e: '🍍', seed: 2200, price: 6500, grow: 560, season: 4, lvl: 20 },
];
const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));
CROPS.forEach(c => addItem(c.id, { n: c.n, e: c.e, price: c.price, cat: 'crop' }));

const ANIMALS = [
  { id: 'chicken', n: L('دجاجة'), e: '🐔', cost: 150, prod: 'egg', time: 30, lvl: 1 },
  { id: 'cow', n: L('بقرة'), e: '🐄', cost: 1500, prod: 'milk', time: 60, lvl: 3 },
  { id: 'sheep', n: L('خروف'), e: '🐑', cost: 4500, prod: 'wool', time: 120, lvl: 5 },
  { id: 'goat', n: L('ماعز'), e: '🐐', cost: 10000, prod: 'cheese', time: 150, lvl: 6 },
  { id: 'bee', n: L('خلية نحل'), e: '🐝', cost: 20000, prod: 'honey', time: 240, lvl: 8, gn: { n0: L('عادية'), p: L('ممتازة'), g: L('ملكية') } },
  { id: 'turkey', n: L('ديك رومي'), e: '🦃', cost: 60000, prod: 'meat', time: 300, lvl: 10 },
  // The priciest animal; like the others, each one costs 25% more than the last. Its grades have their own names.
  { id: 'camel', n: L('ناقة'), e: '🐪', cost: 500000, prod: 'hashi', time: 600, lvl: 12, gn: { n0: L('مجهم'), p: L('وضحى'), g: L('شقحاء') } },
];
function gName(a, to) { return (a.gn && a.gn[to]) || (to === 'n0' ? L('عادي') : GRADE[to].n); }
// 1.3.3: every product x2 except camel meat, which went to half (60,000 -> 30,000), so a full golden barn isn't all camels.
[['egg', L('بيض'), '🥚', 50], ['milk', L('حليب'), '🥛', 240], ['wool', L('صوف'), '🧶', 700], ['cheese', L('جبن'), '🧀', 1400], ['honey', L('عسل'), '🍯', 3000], ['meat', L('فخذ ديك رومي'), '🍗', 8000], ['hashi', L('لحم حاشي'), '🍖', 30000]]
  .forEach(([id, n, e, price]) => addItem(id, { n, e, price, cat: 'animal' }));
// Golden animals give golden products worth 5x the base price.
[['egg_g', L('بيضة ذهبية'), 250], ['milk_g', L('حليب ذهبي'), 1200], ['wool_g', L('صوف ذهبي'), 3500], ['cheese_g', L('جبن ذهبي'), 7000], ['honey_g', L('عسل ملكي'), 15000], ['meat_g', L('فخذ ديك رومي ذهبي'), 40000], ['hashi_g', L('لحم حاشي ذهبي'), 150000]]
  .forEach(([id, n, price]) => addItem(id, { n, e: '🌟', price, cat: 'animal', golden: true }));
// Until dedicated art exists, golden products reuse the base art with a gold tint.
if (typeof ART !== 'undefined') ['egg', 'milk', 'wool', 'cheese', 'honey', 'meat', 'hashi'].forEach(b => { if (!ART[b + '_g'] && ART[b]) ART[b + '_g'] = { ...ART[b], tint: true }; });
// Bee hives have no grade art yet: the premium hive gets a silver shine, the royal hive the gold tint.
if (typeof ART !== 'undefined' && ART.bee) { ART['bee-p'] = ART['bee-p'] || { ...ART.bee, silver: true }; ART['bee-g'] = ART['bee-g'] || { ...ART.bee, tint: true }; }
const BREEDABLE = ['chicken', 'cow', 'sheep', 'goat', 'bee', 'turkey', 'camel'];
const GRADE_SVG = {
  p: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
  g: '<svg viewBox="0 0 24 24"><path d="M3 18.5h18l-1.6-10-4.6 4.2L12 5l-2.8 7.7-4.6-4.2zM3.5 20.2h17v1.8h-17z"/></svg>',
};
function gradeBadge(to) { return `<i class="gb gb-${to}" aria-hidden="true">${GRADE_SVG[to]}</i>`; }
const GRADE = {
  p: { n: L('ممتاز'), e: '⭐', lvl: 5 },
  g: { n: L('ذهبي'), e: '👑', lvl: 10 },
};

const ORES = [
  { id: 'copper', n: L('نحاس'), e: '🥉', price: 15, depth: 1 },
  { id: 'iron', n: L('حديد'), e: '🔩', price: 40, depth: 10 },
  { id: 'silver', n: L('فضة'), e: '🥈', price: 100, depth: 25 },
  { id: 'gold_ore', n: L('ذهب خام'), e: '🥇', price: 260, depth: 45 },
  { id: 'mithril', n: L('ميثريل'), e: '💠', price: 700, depth: 70 },
  { id: 'adamant', n: L('أدامانتيت'), e: '🟣', price: 2000, depth: 100 },
  // Deep ores (sale: true): only for selling, so going deeper keeps paying. Not used by tools or gifts.
  { id: 'orichalcum', n: L('أوريكالكوم'), e: '🔶', price: 50000, depth: 500, sale: true },
  { id: 'starmetal', n: L('معدن النجوم'), e: '✴️', price: 250000, depth: 1000, sale: true },
];
ORES.forEach(o => addItem(o.id, { n: o.n, e: o.e, price: o.price, cat: 'ore' }));
addItem('gem', { n: L('جوهرة'), e: '💎', price: 2500, cat: 'gem' });
const PICK_CAP = [12, 28, 48, 75, 105, 150, 1e9];

const MONSTER_MATS = [
  { id: 'gel', n: L('هلام'), e: '🧪', price: 12, f: 1 },
  { id: 'bone', n: L('عظمة'), e: '🦴', price: 35, f: 11 },
  { id: 'fang', n: L('ناب وحش'), e: '🦷', price: 90, f: 26 },
  { id: 'ecto', n: L('جوهر شبحي'), e: '✨', price: 220, f: 41 },
  { id: 'ember', n: L('جمرة شيطانية'), e: '🔥', price: 500, f: 61 },
  { id: 'dscale', n: L('حرشفة تنين'), e: '🐉', price: 1200, f: 81 },
];
MONSTER_MATS.forEach(m => addItem(m.id, { n: m.n, e: m.e, price: m.price, cat: 'monster' }));

// Fishing spots open with the fishing level. Each has its own fish and one rare «king».
const SPOTS = [
  { id: 'lake', n: L('البحيرة'), e: '🏞️', lvl: 1 },
  { id: 'river', n: L('النهر'), e: '🌊', lvl: 8 },
  { id: 'sea', n: L('البحر'), e: '🌅', lvl: 15 },
];
// w = average weight in kg.
const FISH = [
  { id: 'sardine', n: L('سردين'), e: '🐟', price: 18, lvl: 1, spot: 'lake', w: 0.1 },
  { id: 'shrimp', n: L('روبيان'), e: '🦐', price: 30, lvl: 1, spot: 'lake', w: 0.05 },
  { id: 'crab', n: L('سلطعون'), e: '🦀', price: 60, lvl: 3, spot: 'lake', w: 0.5 },
  { id: 'tropical', n: L('سمك ملوّن'), e: '🐠', price: 110, lvl: 5, spot: 'lake', w: 0.3 },
  { id: 'puffer', n: L('سمك منتفخ'), e: '🐡', price: 200, lvl: 7, spot: 'lake', w: 1 },
  { id: 'squid', n: L('حبّار'), e: '🦑', price: 380, lvl: 10, spot: 'lake', w: 2 },
  { id: 'octopus', n: L('أخطبوط'), e: '🐙', price: 700, lvl: 13, spot: 'lake', w: 5 },
  { id: 'shark', n: L('قرش'), e: '🦈', price: 1500, lvl: 16, spot: 'lake', w: 80 },
  { id: 'trout', n: L('سلمون مرقّط'), e: '🐟', price: 260, lvl: 8, spot: 'river', w: 1.5 },
  { id: 'crayfish', n: L('جراد النهر'), e: '🦞', price: 420, lvl: 10, spot: 'river', w: 0.3 },
  { id: 'eel', n: L('ثعبان الماء'), e: '🐍', price: 650, lvl: 12, spot: 'river', w: 2 },
  { id: 'catfish', n: L('سمك السلّور'), e: '🐡', price: 1000, lvl: 14, spot: 'river', w: 8 },
  { id: 'sturgeon', n: L('سمك الحفش'), e: '🐟', price: 1900, lvl: 17, spot: 'river', w: 25 },
  { id: 'tuna', n: L('تونة'), e: '🐟', price: 1300, lvl: 15, spot: 'sea', w: 20 },
  { id: 'oyster', n: L('محار اللؤلؤ'), e: '🦪', price: 2000, lvl: 17, spot: 'sea', w: 0.5 },
  { id: 'jelly', n: L('قنديل البحر'), e: '🪼', price: 2600, lvl: 18, spot: 'sea', w: 1 },
  { id: 'swordfish', n: L('أبو سيف'), e: '🗡️', price: 4200, lvl: 20, spot: 'sea', w: 60 },
  { id: 'whaleshark', n: L('القرش الحوتي'), e: '🐋', price: 8000, lvl: 23, spot: 'sea', w: 300 },
];
const KINGS = [
  { id: 'k_lake', n: L('الشبوط الذهبي'), e: '👑', price: 20000, lvl: 5, spot: 'lake', w: 12, king: 1 },
  { id: 'k_river', n: L('تنين النهر'), e: '🐉', price: 80000, lvl: 12, spot: 'river', w: 40, king: 1 },
  { id: 'k_sea', n: L('ملك الأعماق'), e: '🔱', price: 300000, lvl: 20, spot: 'sea', w: 500, king: 1 },
];
[...FISH, ...KINGS].forEach(f => addItem(f.id, { n: f.n, e: f.e, price: f.price, cat: 'fish' }));
// x = weight multiplier, m = how many fish one catch of that rarity is worth.
const RARITY = [
  { n: L('عادية'), x: 1, m: 1 },
  { n: L('نادرة'), x: 1.8, m: 3 },
  { n: L('أسطورية'), x: 3.5, m: 10 },
];
// Bait: one crop from each season. 5 crops = 25 baited catches with double the rare chances.
const BAIT = ['potato', 'corn', 'apple', 'sweetpotato'], BAIT_COST = 5, BAIT_USES = 25;

const MONSTERS = [
  [L('سلايم'), '🟢'], [L('جرذ عملاق'), '🐀'], [L('خفاش الكهف'), '🦇'], [L('عنكبوت سام'), '🕷️'], [L('هيكل عظمي'), '💀'],
  [L('ذئب بري'), '🐺'], [L('عقرب الرمال'), '🦂'], [L('غول الكهوف'), '👹'], [L('شبح هائم'), '👻'], [L('أفعى عملاقة'), '🐍'],
  [L('غولم صخري'), '🗿'], [L('ساحر مظلم'), '🧙'], [L('شيطان ناري'), '😈'], [L('تنين صغير'), '🐲'],
];
const BOSSES = [
  [L('ملك السلايم'), '👑'], [L('أم العناكب'), '🕸️'], [L('الفارس الميت'), '⚔️'], [L('ألفا الذئاب'), '🌕'],
  [L('ملك الأشباح'), '☠️'], [L('حارس الأطلال'), '🏛️'], [L('التنين الأحمر'), '🐉'],
];
const EPITHET = ['', L('المتوحش'), L('الأسطوري'), L('الكارثي')];

const SWORD = [0, 5, 14, 30, 60, 120, 240];
const ARMOR_DEF = [0, 3, 9, 20, 40, 80, 160];
const ARMOR_HP = [0, 30, 80, 160, 320, 640, 1200];
/* 1.6 fighting gear. Shield and helmet: flat defence plus a % on all defence. Amulet: % attack and defence,
   and more healing from food. Boots: faster hits. All grow with the legendary forge roll (lf), like the other tools. */
const SHIELD_DEF = [0, 5, 15, 35, 70, 140, 280], SHIELD_PCT = [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1];
const HELM_DEF = [0, 4, 12, 28, 56, 110, 220], HELM_PCT = [0, 0.05, 0.1, 0.2, 0.3, 0.45, 0.6];
const AMULET_POW = [0, 0.05, 0.1, 0.15, 0.22, 0.3, 0.4], AMULET_HEAL = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1];
const BOOTS_SPD = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8];
function gearPct(arr, id) { return arr[S.tools[id] || 0] * lf(id); }
function heroSpeed() { return (1 + gearPct(BOOTS_SPD, 'boots')) * (1 + titleB('swift', 0.05)) * (1 + saddleB('griffin')); } // hits per second
function amuletMult() { return 1 + gearPct(AMULET_POW, 'amulet'); }

// Hold to dig or fish: hits per second for each level of the worker's gloves.
const HOLD_RATE = [2, 3, 4, 5, 6, 8, 10];
const TOOLS = [
  { id: 'hoe', n: L('المعزقة'), e: '🌾', eff: (l, m = 1) => L`+${Math.round(l * 20 * m)}% سرعة نمو المحاصيل` },
  { id: 'can', n: L('المرشة'), e: '🚿', eff: (l, m = 1) => L`السقي يسرّع النمو ×${(2 + 0.25 * l * m).toFixed(2)}${l >= 1 ? L(' • زر "سقي الكل"') : ''}` },
  { id: 'pick', n: L('الفأس'), e: '⛏️', eff: (l, m = 1) => L`قوة حفر ×${(1 + 0.6 * l * m).toFixed(1)} • أقصى عمق ${PICK_CAP[l] > 1e8 ? '∞' : PICK_CAP[l]}` },
  { id: 'sword', guild: 1, n: L('السيف'), e: '🗡️', eff: (l, m = 1) => L`+${Math.round(SWORD[l] * m)} هجوم` },
  { id: 'armor', guild: 1, n: L('الدرع'), e: '🛡️', eff: (l, m = 1) => L`+${Math.round(ARMOR_DEF[l] * m)} دفاع • +${Math.round(ARMOR_HP[l] * m)} صحة` },
  { id: 'helmet', guild: 1, n: L('الخوذة'), e: '⛑️', eff: (l, m = 1) => L`+${Math.round(HELM_DEF[l] * m)} دفاع • +${Math.round(HELM_PCT[l] * m * 100)}% لكل الدفاع` },
  { id: 'shield', guild: 1, n: L('الترس'), e: '🔰', eff: (l, m = 1) => L`+${Math.round(SHIELD_DEF[l] * m)} دفاع • +${Math.round(SHIELD_PCT[l] * m * 100)}% لكل الدفاع` },
  { id: 'amulet', guild: 1, n: L('القلادة'), e: '📿', eff: (l, m = 1) => L`+${Math.round(AMULET_POW[l] * m * 100)}% هجوم ودفاع • +${Math.round(AMULET_HEAL[l] * m * 100)}% شفاء الأكل` },
  { id: 'boots', guild: 1, n: L('الحذاء'), e: '👢', eff: (l, m = 1) => L`+${Math.round(BOOTS_SPD[l] * m * 100)}% سرعة الضرب` },
  { id: 'rod', n: L('السنارة'), e: '🎣', eff: (l, m = 1) => L`قوة الصيد ×${(1 + 0.5 * l * m).toFixed(1)} • أسماك نادرة أكثر` },
  { id: 'glove', n: L('قفازات العامل'), e: '🧤', eff: (l, m = 1) => L`الضغط المطوّل: ${Math.round(HOLD_RATE[l] * m)} ضربات بالثانية في المنجم والبحيرة` },
  { id: 'crook', n: L('عصا الراعي'), e: '🐑', eff: (l, m = 1) => L`+${Math.round(l * 50 * m)}% سرعة الإنتاج الحيواني` },
];
/* Legendary forge: an adamantite tool can be forged into its legendary form for 500 mithril + 1000 adamantite.
   Each forge rolls a bonus from 5% to 100% on the tool's own effect; forging again rolls a new one (it replaces the old).
   Low rolls are common: white 5–29%, blue 30–59%, purple 60–99%, gold = 100% (0.5%). Starts over every generation. */
const LEG_TOOLS = { hoe: L('معزقة الخصوبة'), can: L('مرشة الحياة'), pick: L('فأس الدمار'), sword: L('سيف العاصفة'), armor: L('درع الحارس الخالد'), rod: L('سنارة الأعماق'), glove: L('قفازات العمالقة'), crook: L('عصا القطيع'),
  helmet: L('خوذة الملوك'), shield: L('ترس الجبل'), amulet: L('قلادة الأجداد'), boots: L('حذاء الريح') };
const LEG_COST = [['mithril', 500], ['adamant', 1000]];
const LEG_RAR = [{ n: L('بيضاء'), c: 'w' }, { n: L('زرقاء'), c: 'b' }, { n: L('بنفسجية'), c: 'p' }, { n: L('ذهبية'), c: 'g' }];
// Buffs panel label for a tool: its legendary name and roll once forged.
function tlab(id, e, plain) { return lgv(id) && (S.tools[id] || 0) >= 6 ? `${e} ${LEG_TOOLS[id]} (+${lgv(id)}%)` : plain; }
function lgv(id) { return (S.tlg || {})[id] || 0; }
function lf(id) { return 1 + lgv(id) / 100; }
function lgTier(v) { return v >= 100 ? 3 : v >= 60 ? 2 : v >= 30 ? 1 : 0; }
function lgRoll() { return Math.random() < 0.005 ? 100 : Math.round(5 + 94 * Math.pow(Math.random(), 2.5)); }
// The first forge costs the full price; forging again costs 10% of it. Qasim's discount (hearts) and season buff both cut it.
function lgCost(t) { const k = Math.max(0.1, (1 - spv('smith', 'forge')) * (1 - 0.03 * hearts('smith'))); return LEG_COST.map(([id, q]) => [id, Math.ceil((lgv(t) ? q / 10 : q) * k)]); }
function lgCanPay(t) { return lgCost(t).every(([id, q]) => have(id) >= q); }
// One forge roll: pay, roll, store. Returns the new roll.
function lgDo(v) { lgCost(v).forEach(([id, q]) => take(id, q)); const r = lgRoll(); (S.tlg || (S.tlg = {}))[v] = r; return r; }
/* Auto-forge (1.7.16): a one-time 1B gold upgrade at Qasim's (kept for the family). Pick a tool and a target %,
   and it reforges by itself (5 tries a second) until the roll reaches the target or the ores run out. */
const AF_COST = 1e9, AF_RATE = 5;
const AF_UI = { t: '', goal: 60 };
function afTools() { return TOOLS.filter(t => (S.tools[t.id] || 0) >= 6 && !(t.id === 'rod' && S.leg.gen < 2)); }
function afStop(msg, cls) { const j = S.af; S.af = null; if (msg) { log(msg, cls); toast(msg); } return j; }
function tickForge(dt) {
  const j = S.af; if (!j) return;
  const t = TOOLS.find(x => x.id === j.t);
  if (!S.leg.afOwn || !t || (S.tools[j.t] || 0) < 6) return afStop();
  j.acc = (j.acc || 0) + dt * AF_RATE;
  while (j.acc >= 1) {
    j.acc--;
    if (lgv(j.t) >= j.goal) return afStop(L`🤖 الصياغة التلقائية: ${LEG_TOOLS[j.t]} وصلت +${lgv(j.t)}% بعد ${fmt(j.n)} محاولة`, 'golden');
    if (!lgCanPay(j.t)) return afStop(L`🤖 الصياغة التلقائية وقفت: خلصت الخامات (${LEG_TOOLS[j.t]} +${lgv(j.t)}% بعد ${fmt(j.n)} محاولة)`, 'bad');
    lgDo(j.t); j.n++;
  }
  if (lgv(j.t) >= j.goal) afStop(L`🤖 الصياغة التلقائية: ${LEG_TOOLS[j.t]} وصلت +${lgv(j.t)}% بعد ${fmt(j.n)} محاولة`, 'golden');
}
/* Pets (1.7): a very rare egg can drop when you clear a dungeon floor, at the same chance as a king fish (0.08%).
   The egg hatches after 30 minutes into a griffin, a dragon or a unicorn (one you don't have yet), and the pet grows
   with every floor you clear: baby → teen → adult. Dragon: attack, unicorn: defence, griffin: power (guild hunts).
   Pets belong to the family, so they stay across generations. */
const PET_EGG_CH = 0.0008, PET_HATCH = 1800;
const PETS = [
  { id: 'dragon', n: L('التنين'), e: '🐉', stat: 'atk', sn: L('الهجوم') },
  { id: 'unicorn', n: L('اليونيكورن'), e: '🦄', stat: 'def', sn: L('الدفاع') },
  { id: 'griffin', n: L('الغريفين'), e: '🦅', stat: 'pow', sn: L('القوة') },
];
// Floors cleared to reach each stage, and what each stage adds.
const PET_STAGE = [{ n: L('رضيع'), xp: 0, b: 0.10 }, { n: L('مراهق'), xp: 300, b: 0.25 }, { n: L('بالغ'), xp: 1500, b: 0.50 }];
function petData() { const L2 = S.leg; L2.pets = L2.pets || {}; L2.eggs = L2.eggs || []; return L2; }
// Leila doubles the egg chance at 10 hearts (x1 + hearts/10, so marriage or a soul twin gives more).
function petEggX(h) { return Math.round((1 + Math.max(0, h) / 10) * 10) / 10; }
function petStage(xp) { let s = 0; PET_STAGE.forEach((x, i) => { if (xp >= x.xp) s = i; }); return s; }
function petMult(stat) {
  const ps = petData().pets; let m = 1;
  for (const p of PETS) if (p.stat === stat && ps[p.id]) m += PET_STAGE[petStage(ps[p.id].xp)].b;
  if (stat === 'atk') m += saddleB('dragon');
  if (stat === 'def') m += saddleB('unicorn');
  return m;
}
/* Saddle (1.7.17): crafted once for 100M gold and kept by the family. It goes on one pet at a time (moving it is free).
   The saddled pet earns the same combat XP as you and levels up (each level +0.01%), and wakes its second skill:
   dragon: +2 floors per clear and +0.01% attack a level; griffin: double monster materials and +0.01% hit speed a level;
   unicorn: three active titles next to your name instead of one, and +0.01% defence a level. */
const SADDLE_COST = 1e8, SADDLE_STEP = 0.0001;
const SADDLE_SK = { dragon: L('ينزلك طابقين بدل طابق كل ما تخلص طابق'), griffin: L('ضعف مواد الوحوش'), unicorn: L('يفعّل 3 ألقاب جنب اسمك بدل لقب واحد، وكلها يشتغل بفها') };
const SADDLE_LV = { dragon: L('هجوم'), griffin: L('سرعة الضرب'), unicorn: L('دفاع') };
function saddled(id) { const sd = S.leg.saddle; return !!(sd && sd.on === id && (S.leg.pets || {})[id]); }
function saddleLv(id) { const p = (S.leg.pets || {})[id]; return (p && p.sl) || 0; }
function saddleB(id) { return saddled(id) ? SADDLE_STEP * saddleLv(id) : 0; }
function saddleXp(x) {
  const sd = S.leg.saddle, p = sd && sd.on && (S.leg.pets || {})[sd.on]; if (!p) return;
  p.sl = p.sl || 0; p.sx = (p.sx || 0) + x;
  while (p.sx >= hxpNeed(p.sl + 1)) {
    p.sx -= hxpNeed(p.sl + 1); p.sl++;
    if (p.sl % 10 === 0) { const P0 = PETS.find(q => q.id === sd.on); log(L`🏇 ${P0.n} وصل مستوى السرج ${p.sl}: +${(p.sl * SADDLE_STEP * 100).toFixed(2)}% ${SADDLE_LV[sd.on]}`, 'season'); }
  }
}
function sadIc(n) { return ART['icon-saddle'] ? icon('icon-saddle', n || 22) : '🏇'; }
/* How much a cleared floor grows the pets, by its difficulty for you (the same labels as the dungeon info):
   easy 0 (1 on the deepest floor open this generation), fitting 1, hard 2, very hard 4, deadly 6. So pets only grow on floors that push you. */
function petGrow(f) {
  const { r, s } = assess(f);
  if (r >= 1.5) return f >= S.dun.max ? 1 : 0; // easy only counts on new ground: the deepest floor open this generation
  if (r >= 0.8) return 1;
  if (s >= 1) return 2;
  if (foodList().length > 0 && s >= 0.35) return 4;
  return 6;
}
function petFloor(f) {
  const d = petData(), g = Object.keys(d.pets).length ? petGrow(f) : 0;
  for (const id in d.pets) {
    const p = d.pets[id], s = petStage(p.xp); p.xp += g;
    if (petStage(p.xp) > s) { const P0 = PETS.find(x => x.id === id); log(L`${P0.e} ${P0.n} كبر وصار ${PET_STAGE[petStage(p.xp)].n}! +${Math.round(PET_STAGE[petStage(p.xp)].b * 100)}% ${P0.sn}`, 'season'); }
  }
  // Eggs only drop while you're watching: never in the time away from the game (offline) or with the tab hidden.
  if (!offline && !document.hidden && Math.random() < PET_EGG_CH * petEggX(hearts('leila')) * (1 + titleB('tamer', 0.25))) { d.eggs.push(PET_HATCH); d.eggNew = 1; log(L('🥚 طاحت لك بيضة أسطورية بعد ما خلصت الطابق! تلقاها في النقابة ← «🐾 الحيوانات الأسطورية» تحت العدّة، وتفقس بعد 30 دقيقة.'), 'egg'); toast(L('🥚 طاحت لك بيضة أسطورية! تلقاها في النقابة تحت العدّة')); }
}
function hatchEgg() {
  const d = petData(), free = PETS.filter(p => !d.pets[p.id]);
  if (free.length) {
    const p = pick(free); d.pets[p.id] = { xp: 0, born: S.leg.gen }; d.eggNew = 1;
    log(L`🐣 فقست البيضة وطلع ${p.e} ${p.n}! يعطيك +${Math.round(PET_STAGE[0].b * 100)}% ${p.sn}، ويكبر لما تخلص طوابق مناسبة أو أصعب.`, 'egg');
    return;
  }
  const young = PETS.map(p => d.pets[p.id]).filter(p => petStage(p.xp) < 2).sort((a, b) => a.xp - b.xp)[0];
  if (young) { young.xp += 500; log(L('🐣 فقست البيضة، وحيوانك الأصغر أكل منها وكبر: +500 خبرة.'), 'egg'); return; }
  S.leg.stars += 20; S.leg.totalStars += 20; log(L('🐣 كل حيواناتك بالغة، فالبيضة صارت 20 نجمة إرث!'), 'egg');
}
function tickPets(dt) {
  const d = S.leg.eggs; if (!d || !d.length) return;
  for (let i = d.length - 1; i >= 0; i--) { d[i] -= dt; if (d[i] <= 0) { d.splice(i, 1); hatchEgg(); } }
}
function petIcon(p, stage, size, sad) {
  const key = sad && stage === 2 && ART['pet-' + p.id + '-saddle'] ? 'pet-' + p.id + '-saddle' : 'pet-' + p.id + '-' + stage;
  return ART[key] ? `<span class="pet-pic">${icon(key, [84, 104, 124][stage] || size)}</span>` : `<span class="pet-emoji s${stage}">${p.e}</span>`;
}
function petPanel() {
  const d = petData();
  const eggs = d.eggs.map(t => `<div class="pet-card egg">${ART['pet-egg'] ? `<span class="pet-pic">${icon('pet-egg', 76)}</span>` : '<span class="pet-emoji s1">🥚</span>'}<b>${L('بيضة غامضة')}</b>
    <small>${L`تفقس بعد ${Math.ceil(t / 60)} د`}</small><div class="bar"><i style="width:${Math.round((1 - t / PET_HATCH) * 100)}%"></i></div></div>`).join('');
  const cards = PETS.map(p => {
    const me = d.pets[p.id];
    if (!me) return `<div class="pet-card off"><span class="pet-emoji s1">❔</span><b>???</b><small>${L('ما عندك هذا الحيوان')}</small></div>`;
    const s = petStage(me.xp), nx = PET_STAGE[s + 1];
    const prog = nx ? `<small>${L`${fmt(me.xp - PET_STAGE[s].xp)} / ${fmt(nx.xp - PET_STAGE[s].xp)} طابق لين يصير ${nx.n}`}</small><div class="bar"><i style="width:${Math.round((me.xp - PET_STAGE[s].xp) / (nx.xp - PET_STAGE[s].xp) * 100)}%"></i></div>` : `<small>${L('وصل أقصى قوته')}</small>`;
    return `<div class="pet-card st${s} ${saddled(p.id) ? 'sad' : ''}">${petIcon(p, s, 64, saddled(p.id))}<b>${p.n} • ${PET_STAGE[s].n}</b><span class="good">+${Math.round(PET_STAGE[s].b * 100)}% ${p.sn}</span>${prog}${saddleCard(p)}</div>`;
  }).join('');
  return L`<div class="panel pets"><div class="ph"><h2>🐾 الحيوانات الأسطورية</h2><span class="stat">بيضة نادرة جداً تطيح لما تخلص طابق وأنت فاتح اللعبة</span></div>
    <p class="hint">البيضة تفقس بعد 30 دقيقة: تنين (+هجوم)، يونيكورن (+دفاع)، أو غريفين (+قوة في مهام النقابة). يكبر لما تخلص طوابق تتحداك: السهل ما يحسب إلا لو كان أعلى طابق وصلته في هالجيل، المناسب بطابق، الصعب بطابقين، الصعب جداً بـ4، والقاتل بـ6. رضيع +10%، مراهق +25%، بالغ +50%. الحيوانات للعائلة وتبقى معك كل الأجيال.</p>
    ${Object.keys(d.pets).length ? `<p class="hint pet-grow">${L`🌱 الطابق ${S.dun.floor} يكبّر حيواناتك: ${[L('ولا شي (سهل)'), S.dun.floor >= S.dun.max && assess(S.dun.floor).r >= 1.5 ? L('طابق واحد (سهل، بس أعلى طابق وصلته)') : L('طابق واحد (مناسب)'), L('طابقين (صعب)'), '', L('4 طوابق (صعب جداً)'), '', L('6 طوابق (قاتل)')][petGrow(S.dun.floor)]}`}</p>` : ''}
    ${saddleHead()}<div class="pet-list">${eggs}${cards}</div></div>`;
}
function saddleHead() {
  if (S.leg.saddle) return '';
  return L`<div class="lgbox saddle-box"><b>${sadIc()} السرج الأسطوري</b>
    <small>يُصنع مرة وحدة ويبقى للعائلة. تحطه على حيوان واحد (وتقدر تنقله ببلاش)، فيصحى له مهارة ثانية وياخذ خبرة من قتالك: كل مستوى +0.01%. 🐉 التنين: ${SADDLE_SK.dragon}. 🦅 الغريفين: ${SADDLE_SK.griffin}. 🦄 اليونيكورن: ${SADDLE_SK.unicorn}.</small>
    <div class="row">${costBtn('saddleMake', '', SADDLE_COST, L`${sadIc()} اصنع السرج (${fmt(SADDLE_COST)}💰)`, 'gold', !Object.keys(petData().pets).length)}</div></div>`;
}
function saddleCard(p) {
  if (!S.leg.saddle) return '';
  const me = petData().pets[p.id], l = me.sl || 0, need = hxpNeed(l + 1), on = saddled(p.id);
  const lv = `<small>${L`مستوى السرج ${l}: +${(l * SADDLE_STEP * 100).toFixed(2)}% ${SADDLE_LV[p.id]}`}</small><div class="bar"><i style="width:${Math.min(100, (me.sx || 0) / need * 100)}%"></i></div>`;
  return `<div class="saddle-sk ${on ? 'on' : ''}"><small>${on ? '' : L('لما يلبس السرج: ')}${SADDLE_SK[p.id]}</small>${lv}${on ? `<small class="sad-on">${L`${sadIc(18)} عليه السرج`}</small>` : `<button class="btn ghost sm" data-a="saddleOn" data-v="${p.id}">${L`${sadIc(18)} حط السرج عليه`}</button>`}</div>`;
}

const BUILDINGS = [
  { id: 'harvester', n: L('عامل حصاد'), e: '🧑‍🌾', desc: L('يحصد المحاصيل الجاهزة تلقائياً'), cost: 300, mult: 3, max: 5, cover: 1 },
  { id: 'bin', n: L('صندوق الشحن'), e: '📦', desc: L('يبيع كل الأغراض غير المقفلة نهاية كل يوم'), cost: 600 },
  { id: 'planter', n: L('عامل زراعة'), e: '👨‍🌾', desc: L('يعيد زراعة الأحواض الفارغة بالبذرة المختارة'), cost: 1500, req: 'harvester', mult: 3, max: 5, cover: 1 },
  { id: 'zoning', n: L('تخصيص الحقول'), e: '🎯', desc: L('خصص لكل حوض محصولاً ثابتاً يعيد عامل الزراعة زراعته'), cost: 5000, req: 'planter' },
  { id: 'barn', n: L('توسعة الحظيرة'), e: '🏚️', desc: L('+5 سعة لكل نوع حيوان'), cost: 1200, mult: 3, max: 6 },
  { id: 'merc', n: L('رفيق مرتزق'), e: '🧝', desc: L('+1 مهمة متزامنة في النقابة'), cost: 2000, mult: 5, max: 3 },
  { id: 'inn', n: L('النُزل'), e: '🛏️', desc: L('مضاعفة سرعة استعادة الصحة'), cost: 2500 },
  { id: 'rancher', n: L('راعي'), e: '🤠', desc: L('يعتني بالحيوانات ويبقي سعادتها كاملة'), cost: 6000 },
  { id: 'kitchen', n: L('المطبخ'), e: '🍳', desc: L('الطعام يشفي ضعف الكمية في المعارك'), cost: 8000 },
  { id: 'sprinkler', n: L('رشاشات ماء'), e: '💦', desc: L('تسقي الأحواض تلقائياً'), cost: 15000, mult: 3, max: 5, cover: 1 },
  { id: 'greenhouse', n: L('بيت محمي'), e: '🏡', desc: L('يحمي 4 أحواض من عقوبة خارج الموسم، وكل تطوير يزيد 4 (لين 12). أول الأحواض في الحقل هي اللي تحت البيت.'), costs: [100000, 300000, 1000000], max: 3 },
  { id: 'breedlab', n: L('أدوات التهجين'), e: '🧬', desc: L('تسرّع راحة بيوت التهجين وترفع نسبة النجاح'), cost: 25000, mult: 12, max: 2 },
];

const NPCS = [
  { id: 'mayor', g: 'm', n: L('أبو سالم'), role: L('عمدة وادي الصدى'), story: L('يدير القرية منذ ثلاثين سنة، وكان أقرب أصدقاء جدك. يعرف كل بيت وكل حكاية في الوادي، ويفرح كلما رأى السوق عامراً. أهدِه العسل وسيحدثك عن الأيام القديمة.'), e: '👴', love: 'honey', like: 'milk', perk: h => L`+${2 * h}% سعر البيع`,
    lines: [L('أهلاً بك في وادي الصدى! جدك كان رجلاً طيباً.'), L('المزرعة بدأت تعود للحياة بفضلك يا بني.'), L('أنت فخر القرية كلها!')] },
  { id: 'noura', g: 'f', n: L('نورة'), role: L('مزارعة القرية'), story: L('كبرت بين الحقول وتعرف موعد كل بذرة. كانت تساعد جدك في المزرعة لما تعب، وتتمنى أن ترى أرضه خضراء من جديد. اليقطين أحب شيء عندها.'), e: '👩‍🌾', love: 'pumpkin', like: 'turnip', perk: h => L`+${3 * h}% سرعة نمو`,
    lines: [L('الأرض تحب من يسقيها كل يوم.'), L('محاصيلك صارت أجمل من محاصيلي!'), L('لو احتجت أي نصيحة في الزراعة أنا موجودة دائماً.')] },
  { id: 'smith', g: 'm', n: L('قاسم'), role: L('حداد القرية'), story: L('ورث الورشة عن أبيه، ويقول إن لكل معدن صوتاً. قليل الكلام لكنه لا يرد أحداً، وإذا أحضرت له فضة نسي تعبه وابتسم.'), e: '🧔', love: 'silver', like: 'copper', perk: h => L`-${3 * h}% تكلفة الحداد`,
    lines: [L('هممم... أحضر لي معدناً جيداً وسأصنع لك العجب.'), L('يدك قوية، تصلح للفأس والسيف.'), L('أنت أفضل زبون عندي، خصم خاص لك!')] },
  { id: 'leila', g: 'f', n: L('ليلى'), role: L('طبيبة القرية'), story: L('رجعت إلى الوادي بعد سنوات من الدراسة في المدينة، وفتحت عيادة صغيرة قرب الساحة. تعالج المرتزقة العائدين من الزنزانة، وتقول إن الفراولة أفضل دواء للقلب.'), e: '👩‍⚕️', love: 'strawberry', like: 'egg', perk: h => L`+${5 * h}% صحة قصوى • +${2 * h}% دفاع • بيض الحيوانات الأسطورية ×${petEggX(h)}`,
    lines: [L('انتبه لنفسك في الزنزانة، الجروح هناك عميقة.'), L('كُل جيداً قبل القتال، الطعام دواء.'), L('أشعر بالأمان حين أعرف أنك بخير.')] },
  { id: 'raad', g: 'm', n: L('رعد'), role: L('قائد نقابة المرتزقة'), story: L('جاب الأراضي البعيدة مرتزقاً قبل أن يستقر في الوادي ويؤسس النقابة. صارم مع المبتدئين لأنه فقد رفاقاً في الأعماق، لكنه يحترم من يثبت نفسه. يجمع أنياب الوحوش تذكاراً من معاركه.'), e: '🤺', love: 'fang', like: 'gel', perk: h => L`+${4 * h}% مكافآت المهمات`,
    lines: [L('مرتزق جديد؟ أثبت نفسك أولاً.'), L('سمعت عن انتصاراتك، أحسنت.'), L('أنت أسطورة النقابة الآن!')] },
  { id: 'salma', g: 'f', n: L('سلمى'), role: L('مربّية المواشي'), story: L('ربّت أجيالاً من الحيوانات في مزرعة أهلها خلف التلال، وتعرف من نظرة أي اثنين يطلع منهم أحسن نسل. جاءت الوادي لما سمعت عن بيوت التهجين، وتحب الصوف والحليب، وتحلم تشوف تنين النهر بعينها.'), e: '👩‍🦱', love: 'wool', like: 'milk',
    perk: h => L`نسب التهجين ×${(1 + 0.103 * h).toFixed(2)}`,
    lines: [L('الحيوان يعرف اللي يحبه، اعتنِ فيهم زين.'), L('شفت قطيعك؟ صار أحلى من قطيع أهلي!'), L('أنت ويّاي نقدر نطلع أندر سلالة في الوادي.')] },
];
/* Royal gifts: each villager has a fixed favourite king fish. Once a season you can give it for +5 hearts at once,
   apart from the daily gift. Kings are never eaten as food. */
const KING_GIFT = { mayor: 'k_sea', raad: 'k_sea', smith: 'k_lake', noura: 'k_lake', leila: 'k_river', salma: 'k_river' };
function seasonKey() { return S.year * 4 + S.season; }
const TOGGLES = {
  harvester: L('الحصاد التلقائي'), planter: L('الزراعة التلقائية'), zoning: L('تخصيص الحقول'), sprinkler: L('الرشاشات'),
  greenhouse: L('البيت المحمي'), bin: L('صندوق الشحن'), rancher: L('الراعي'), miners: L('عمال المنجم'), fishers: L('الصيادين'),
};

/* ---------------- الإرث والأجيال ---------------- */
const ORD = ['', L('الأول'), L('الثاني'), L('الثالث'), L('الرابع'), L('الخامس'), L('السادس'), L('السابع'), L('الثامن'), L('التاسع'), L('العاشر')];
const BRANCHES = { farm: L('🌾 المزارع'), ranch: L('🐄 الراعي'), mine: L('⛏️ المنقّب'), war: L('⚔️ المحارب'), trade: L('💰 التاجر'), family: L('🏡 العائلة') };
const PERKS = [
  { id: 'f_grow', b: 'farm', n: L('تربة خصبة'), e: '🌱', max: 10, cost: 2, mult: 1.6, eff: l => L`+${25 * l}% سرعة النمو` },
  { id: 'f_plots', req: ['f_grow', 3], b: 'farm', n: L('أرض موروثة'), e: '🟫', max: 5, cost: 3, mult: 1.8, start: 1, eff: l => L`تبدأ بـ ${4 + 2 * l} أحواض` },
  { id: 'f_golden', req: ['f_xp', 3], b: 'farm', n: L('البذرة الذهبية'), e: '✨', max: 5, cost: 5, mult: 2, eff: l => L`${l}% فرصة محصول ذهبي يعطي ×10 سعره ذهباً` },
  { id: 'f_xp', req: ['f_grow', 3], b: 'farm', n: L('حكمة الأرض'), e: '📗', max: 5, cost: 2, mult: 1.7, eff: l => L`+${30 * l}% خبرة الزراعة` },
  { id: 'r_cost', req: ['r_speed', 3], b: 'ranch', n: L('تاجر المواشي'), e: '🏷️', max: 5, cost: 2, mult: 1.7, eff: l => L`-${10 * l}% سعر الحيوانات` },
  { id: 'r_start', req: ['r_speed', 3], b: 'ranch', n: L('قطيع العائلة'), e: '🐔', max: 3, cost: 3, mult: 2, start: 1, eff: l => L`تبدأ ومعك ${2 * l} دجاجات` },
  { id: 'r_speed', b: 'ranch', n: L('حيوانات سعيدة'), e: '💕', max: 10, cost: 2, mult: 1.6, eff: l => L`+${20 * l}% سرعة الإنتاج الحيواني` },
  { id: 'm_power', b: 'mine', n: L('سواعد قوية'), e: '💪', max: 10, cost: 2, mult: 1.6, eff: l => L`+${30 * l}% قوة الحفر والصيد` },
  { id: 'm_miners', req: ['m_power', 3], b: 'mine', n: L('رفاق المنجم'), e: '👷', max: 3, cost: 3, mult: 2, start: 1, eff: l => L`تبدأ ومعك ${2 * l} عمال منجم` },
  { id: 'm_gem', req: ['m_power', 3], b: 'mine', n: L('عين الجواهري'), e: '💎', max: 5, cost: 3, mult: 1.8, eff: l => L`+${50 * l}% فرصة الجواهر` },
  { id: 'w_power', b: 'war', n: L('دم المحارب'), e: '❤️‍🔥', max: 10, cost: 2, mult: 1.6, eff: l => L`+${15 * l}% هجوم وصحة` },
  { id: 'w_floor', req: ['w_power', 3], b: 'war', n: L('ذاكرة المعارك'), e: '🗺️', max: 5, cost: 3, mult: 1.8, start: 1, eff: l => L`تبدأ الزنزانة من ${10 * l}% من أعلى طابق وصلته عائلتك` },
  { id: 'w_quest', req: ['w_xp', 3], b: 'war', n: L('سمعة العائلة'), e: '📜', max: 5, cost: 2, mult: 1.7, eff: l => L`+${25 * l}% مكافآت المهمات` },
  { id: 'w_xp', req: ['w_power', 3], b: 'war', n: L('تدريب الأب'), e: '🥋', max: 5, cost: 2, mult: 1.7, eff: l => L`+${30 * l}% خبرة القتال` },
  { id: 't_price', b: 'trade', n: L('مساومة'), e: '🤝', max: 10, cost: 2, mult: 1.6, eff: l => L`+${10 * l}% ذهب من كل المصادر` },
  { id: 't_gold', req: ['t_price', 3], b: 'trade', n: L('رأس مال'), e: '💰', max: 5, cost: 2, mult: 1.9, start: 1, eff: l => L`تبدأ بـ ${fmt(startGold(l))} ذهب` },
  { id: 't_offline', req: ['t_price', 3], b: 'trade', n: L('نوم هانئ'), e: '😴', max: 4, cost: 3, mult: 1.8, eff: l => L`التقدم أثناء الغياب حتى ${12 + 6 * l} ساعة` },
  { id: 't_stars', req: ['t_offline', 2], b: 'trade', n: L('حكمة الأجيال'), e: '🌟', max: 10, cost: 4, mult: 1.7, eff: l => L`+${10 * l}% نجوم الإرث وحد النجوم لكل جيل` },
  { id: 'q_workers', req: ['q_hearts', 3], b: 'family', n: L('العمال يتذكرونك'), e: '🧑‍🌾', max: 3, cost: 3, mult: 2.5, start: 1,
    eff: l => ['—', L('تبدأ مع عامل الحصاد وعامل الزراعة (50% من الحقل)'), L('الحصاد والزراعة + صندوق الشحن والرشاشات (50%)'), L('كل ما سبق + الراعي وتخصيص الحقول')][l] },
  { id: 'q_hearts', b: 'family', n: L('سمعة الجد'), e: '💞', max: 5, cost: 2, mult: 1.7, start: 1, eff: l => L`أهل القرية يبدؤون من ${2.5 + l} قلوب` },
  { id: 'q_heirs', req: ['q_hearts', 3], b: 'family', n: L('خزانة العائلة'), e: '🗝️', max: 2, cost: 5, mult: 3, eff: l => L`${3 + l} خيارات لقطع الإرث عند التقاعد` },
  { id: 'q_bless', req: ['q_workers', 2], b: 'family', n: L('بركة الوادي'), e: '🌈', max: Infinity, cost: 10, mult: 1.35, eff: l => L`+${5 * l}% لكل شيء (بلا حد)` },
  // Special skills: one per branch, unlocked after spending KS_NEED levels in that branch.
  { id: 'f_seeds', ks: 1, b: 'farm', n: L('بذور خالدة'), e: '♾️', max: 1, cost: 25, mult: 1, eff: () => L('الزراعة ما تكلف بذور أبداً') },
  { id: 'r_twin', ks: 1, b: 'ranch', n: L('مربّي خبير'), e: '🧬', max: 1, cost: 25, mult: 1, eff: () => L('لو فشل التهجين ما تخسر حيواناتك') },
  { id: 'm_tnt', ks: 1, b: 'mine', n: L('ديناميت'), e: '🧨', max: 1, cost: 25, mult: 1, eff: () => L('كل طابق تكمله في المنجم ينزلك طابقين') },
  { id: 'w_ally', ks: 1, b: 'war', n: L('رفيق المعارك'), e: '🛡️', max: 1, cost: 25, mult: 1, eff: () => L('رفيق يقاتل معك بنصف قوتك، وينقذك من السقوط مرة كل 5 دقائق، ويقبل مهمات الصيد بدالك') },
  { id: 't_deal', ks: 1, b: 'trade', n: L('تاجر الموسم'), e: '🧺', max: 1, cost: 25, mult: 1, eff: () => L('كل موسم يجيك تاجر يشتري محصول من محاصيل الموسم بـ ×3 السعر') },
  { id: 'q_tools', ks: 1, b: 'family', n: L('إرث الأدوات'), e: '🧰', max: 1, cost: 25, mult: 1, start: 1, eff: () => L('أدواتك تنتقل للجيل الجديد بدرجة أقل بدل ما ترجع للصفر، والأسطورية ترجع أدامانتيت') },
  { id: 'q_twin', ks: 1, b: 'family', n: L('توأم الروح'), e: '🌟', max: 1, cost: 300, mult: 1, eff: () => L('بعد ما يكون عندك زوج وصديق عمر: تختار شخص واحد من الباقين يصير توأم روحك بـ10 مليون، حتى العمدة. مكافأته ×2.5 وحبه ما يقل أبد') },
];
const HEIRLOOMS = [
  { id: 'sword', n: L('سيف الجد'), e: '🗡️', max: 6, eff: l => L`تبدأ كل جيل بسيف ${TIER[l]} • +${l}% ذهب` },
  { id: 'armor', n: L('درع الأب'), e: '🛡️', max: 6, eff: l => L`تبدأ كل جيل بدرع ${TIER[l]} • +${l}% ذهب` },
  { id: 'hoe', n: L('معزقة الأجداد'), e: '🌾', max: 6, eff: l => L`تبدأ كل جيل بمعزقة ${TIER[l]} • +${l}% ذهب` },
  { id: 'can', n: L('المرشة الذهبية'), e: '🚿', max: 6, eff: l => L`تبدأ كل جيل بمرشة ${TIER[l]} • +${l}% ذهب` },
  { id: 'pick', n: L('فأس العائلة'), e: '⛏️', max: 6, eff: l => L`تبدأ كل جيل بفأس ${TIER[l]} • +${l}% ذهب` },
  { id: 'rod', n: L('سنارة الجد'), e: '🎣', max: 6, eff: l => L`تبدأ كل جيل بسنارة ${TIER[l]} • +${l}% ذهب` },
  { id: 'cow', n: L('بقرة العائلة'), e: '🐄', max: 10, eff: l => L`تبدأ كل جيل ومعك ${l} بقرة` },
  { id: 'diary', n: L('مذكرات الجد'), e: '📜', max: 20, eff: l => L`+${10 * l}% خبرة لكل المهارات` },
  { id: 'coin', n: L('العملة القديمة'), e: '🪙', max: 20, eff: l => L`+${5 * l}% ذهب من كل المصادر` },
  { id: 'amulet', n: L('قلادة الحظ'), e: '📿', max: 20, eff: l => L`+${5 * l}% نجوم إرث` },
  { id: 'ring', n: L('خاتم الجدة'), e: '💍', max: 5, eff: l => L`+${l / 2} قلب مبدئي مع كل أهل القرية` },
  { id: 'seedbag', n: L('كيس بذور قديم'), e: '🎒', max: 10, eff: l => L`+${3 * l}% فرصة حصاد مضاعف` },
];
const CHALLENGES = [
  { id: 'winter', n: L('شتاء أبدي'), e: '❄️', rule: L('الموسم شتاء طوال الجيل'), type: 'gold', base: 1e6, rew: l => L`+${15 * l}% نمو المحاصيل` },
  { id: 'noworkers', n: L('بدون عمال'), e: '🙅', rule: L('ممنوع توظيف أي عامل أو مبنى تلقائي'), type: 'gold', base: 5e5, rew: l => L`+${10 * l}% ذهب من كل المصادر` },
  { id: 'warrior', n: L('المحارب فقط'), e: '⚔️', rule: L('لا زراعة ولا حيوانات — تأكل من غنائم الوحوش والسمك'), type: 'floor', base: 25, rew: l => L`+${10 * l}% هجوم وصحة` },
  { id: 'poverty', n: L('سنوات القحط'), e: '💸', rule: L('كل الذهب اللي تكسبه نصف'), type: 'gold', base: 1e6, rew: l => L`+${10 * l}% نجوم الإرث` },
  { id: 'slow', n: L('الزمن البطيء'), e: '🐌', rule: L('كل الإنتاج بنصف السرعة'), type: 'gold', base: 1e6, rew: l => L`+${10 * l}% سرعة كل الإنتاج` },
  { id: 'underground', n: L('تحت الأرض'), e: '🕳️', rule: L('لا زراعة ولا حيوانات — المنجم والزنزانة والبحيرة فقط'), type: 'depth', base: 40, rew: l => L`+${20 * l}% قوة التعدين والجواهر` },
];
const ROADMAP = [
  [2, L('🎣 البحيرة وصيد السمك + السنارة عند الحداد')],
  [3, L('🌟 المحاصيل النادرة: زعفران، تمر، مانجو، أناناس')],
  [4, L('🕳️ الأعماق المنسية: طوابق بعد 100، وكل زعيم فيها يعطيك نجمة إرث')],
  [5, L('💍 الزواج و🤝 صداقة العمر مع أهل القرية + 🏆 تحديات الأجيال اللانهائية')],
];
const ACH = [];
function ach(id, e, n, d, fn) { ACH.push({ id, e, n, d, fn }); }
function achSet(key, e, list, d, fn) { list.forEach(([v, n], i) => ach(key + i, e, n, d(v), () => fn() >= v)); }
achSet('har', '🧺', [[100, L('مزارع مبتدئ')], [1000, L('مزارع مجتهد')], [10000, L('سيد الحقول')], [100000, L('أسطورة الحصاد')]], v => L`احصد ${fmt(v)} محصول`, () => S.stats.harvests);
achSet('pro', '🥚', [[100, L('راعٍ صغير')], [1000, L('صاحب قطيع')], [10000, L('ملك المراعي')]], v => L`اجمع ${fmt(v)} منتج حيواني`, () => S.stats.products);
achSet('blk', '⛏️', [[100, L('حفّار')], [1000, L('عامل منجم')], [10000, L('سيد الصخور')]], v => L`اكسر ${fmt(v)} صخرة`, () => S.stats.blocks);
achSet('kil', '⚔️', [[100, L('مقاتل')], [1000, L('صياد وحوش')], [10000, L('سفّاح الزنزانة')]], v => L`اهزم ${fmt(v)} وحش`, () => S.stats.kills);
achSet('qst', '📜', [[10, L('مرتزق')], [100, L('مرتزق محترف')], [500, L('أسطورة النقابة')]], v => L`أنجز ${fmt(v)} مهمة`, () => S.stats.quests);
achSet('gld', '💰', [[1e6, L('مليونير')], [1e8, L('ثري القرية')], [1e10, L('إمبراطور الوادي')]], v => L`اكسب ${fmt(v)} ذهب على مر الأجيال`, () => S.stats.earned);
achSet('dun', '🕳️', [[10, L('نازل الزنزانة')], [50, L('مغامر')], [100, L('قاهر الظلام')], [200, L('ابن الأعماق')]], v => L`وصل الطابق ${v} في الزنزانة`, () => bestDun());
achSet('min', '⛰️', [[50, L('منقّب')], [100, L('حفّار الأعماق')], [200, L('قلب الأرض')]], v => L`انزل للطابق ${v} في المنجم`, () => bestMine());
achSet('gen', '🌳', [[2, L('الجيل الثاني')], [5, L('سلالة عريقة')], [10, L('عائلة أسطورية')], [25, L('الخالدون')]], v => L`وصل الجيل ${v}`, () => S.leg.gen);
achSet('fsh', '🎣', [[100, L('صياد')], [1000, L('سيد البحيرة')]], v => L`اصطد ${fmt(v)} سمكة`, () => S.stats.fish);
achSet('chl', '🏆', [[1, L('متحدٍّ')], [10, L('لا يُقهر')], [30, L('سيد التحديات')]], v => L`أنجز ${v} تحدي أجيال`, () => Object.values(S.leg.ch).reduce((a, b) => a + b, 0));
ach('love', '💞', L('صديق القرية'), L('وصّل علاقتك مع شخص إلى 10 قلوب'), () => NPCS.some(n => (S.npc[n.id] || {}).pts >= 1000));
ach('marry', '💍', L('فرحة الوادي'), L('تزوّج من أحد أهل القرية'), () => !!S.leg.married);
const NPC_BY = Object.fromEntries(NPCS.map(n => [n.id, n]));
const GENDER = { m: { n: L('رجل'), e: '👨', child: L('ابن') }, f: { n: L('امرأة'), e: '👩', child: L('ابنة') } };
/* Gifts change every season: each villager loves one thing and likes another, picked at random from their kind
   of items (Noura: this season's crops, Qasem: ores, Raad: monster loot...), preferring items the player already knows.
   Love fades by half a heart a day once half a season
   of play passes without a gift; time away from the game doesn't count, and a spouse never fades. */
const GIFT_GRACE = 4;
function seasonCrops() { return CROPS.filter(c => c.season === S.season).map(c => c.id); }
function giftPool(np) {
  const ores = [...ORES.filter(o => !o.sale).map(o => o.id), 'gem'], loot = MONSTER_MATS.map(m => m.id), farm = ['egg', 'milk', 'wool', 'cheese', 'honey', 'meat', 'hashi'];
  // With farming and animals banned (Warrior / Underground challenges), the villagers who want crops or animal products take fish.
  if (noFarm() && ['noura', 'leila', 'mayor', 'salma'].includes(np.id)) return FISH.filter(f => !f.king).map(f => f.id);
  return { noura: seasonCrops(), leila: [...seasonCrops(), 'egg', 'milk'], mayor: [...farm, ...seasonCrops()], smith: ores, raad: loot, salma: farm }[np.id] || seasonCrops();
}
function giftRng(seed) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }
function giftsOf(np) {
  const st = S.npc[np.id] || (S.npc[np.id] = { pts: 0, gd: 0 }), key = S.year * 4 + S.season;
  if (st.gk !== key || !ITEMS[st.gl] || !ITEMS[st.gm] || !giftPool(np).includes(st.gl)) {
    const all = giftPool(np).filter(id => ITEMS[id]), seen = all.filter(id => S.seen[id]);
    const pool = seen.length >= 2 ? seen : all.slice(0, 2), r = giftRng(np.id + ':' + key);
    const a = pool[Math.floor(r() * pool.length)]; let b = pool[Math.floor(r() * pool.length)];
    for (let i = 0; b === a && i < 8; i++) b = pool[Math.floor(r() * pool.length)];
    st.gk = key; st.gl = a; st.gm = b === a ? (pool.find(x => x !== a) || np.like) : b;
  }
  return { love: st.gl, like: st.gm };
}
/* Seasonal perks: on top of each villager's fixed perk, one of three extra perks, picked at random every season.
   It follows the hearts: nothing at 5 hearts, the full value (max) at 10, and the same amount against you at 0.
   Bond hearts count too (a spouse or friend at 20 hearts gives 3x max, a soul twin at 25 gives 4x). */
function sgn(v) { return (v >= 0 ? '+' : '−') + Math.round(Math.abs(v) * 1000) / 10 + '%'; }
const SEASON_PERKS = {
  mayor: [{ id: 'sell', max: 0.05, d: v => L`${sgn(v)} سعر البيع لكل شي` }, { id: 'feat', max: 0.3, d: v => L`${sgn(v)} سعر ${ITEMS[featItem()].n} (عنصر الموسم)` }, { id: 'off', max: 0.1, d: v => L`${sgn(v)} سعر المحاصيل اللي برا موسمها` }],
  noura: [{ id: 'gold', max: 0.01, d: v => L`${sgn(v)} فرصة المحصول الذهبي` }, { id: 'seed', max: 0.2, d: v => L`${sgn(-v)} سعر البذور` }, { id: 'offgrow', max: 0.5, d: v => L`${sgn(v)} نمو المحاصيل اللي برا موسمها` }],
  smith: [{ id: 'mine', max: 0.2, d: v => L`${sgn(v)} قوة الحفر` }, { id: 'gem', max: 0.5, d: v => L`${sgn(v)} فرصة الجواهر` }, { id: 'forge', max: 0.2, d: v => L`${sgn(-v)} خامات الصياغة الأسطورية` }],
  leila: [{ id: 'guard', max: 0.1, d: v => L`${sgn(-v)} الضرر اللي تاخذه في الزنزانة` }, { id: 'regen', max: 0.3, d: v => L`${sgn(v)} سرعة التعافي` }, { id: 'xp', max: 0.2, d: v => L`${sgn(v)} خبرة القتال` }],
  raad: [{ id: 'gp', max: 0.2, d: v => L`${sgn(v)} نقاط النقابة` }, { id: 'hunt', max: 0.15, d: v => L`${sgn(-v)} وقت مهمات الصيد` }, { id: 'loot', max: 0.2, d: v => L`${sgn(v)} ذهب الوحوش` }],
  salma: [{ id: 'ranch', max: 0.15, d: v => L`${sgn(v)} سرعة إنتاج الحيوانات` }, { id: 'rest', max: 0.2, d: v => L`${sgn(-v)} راحة بيوت التهجين` }, { id: 'cost', max: 0.15, d: v => L`${sgn(-v)} سعر الحيوانات` }],
};
const SP_CACHE = { k: null, p: {}, f: null }; // picks only change with the season
function spCache() { const k = seasonKey(); if (SP_CACHE.k !== k) { SP_CACHE.k = k; SP_CACHE.p = {}; SP_CACHE.f = null; } return SP_CACHE; }
function seasonPerk(id) {
  const c = spCache(); if (id in c.p) return c.p[id];
  const L3 = SEASON_PERKS[id]; return (c.p[id] = L3 ? L3[Math.floor(giftRng(id + ':sp:' + c.k)() * L3.length)] : null);
}
function spv(npc, key) { const p = seasonPerk(npc); return p && p.id === key ? p.max * (hearts(npc) - 5) / 5 : 0; }
// The mayor's «item of the season»: a crop of this season or an ore, picked at random each season.
function featItem() {
  const c = spCache(); if (c.f) return c.f;
  const pool = [...CROPS.filter(x => x.season === S.season).map(x => x.id), ...ORES.map(o => o.id)];
  return (c.f = pool[Math.floor(giftRng('feat:' + c.k)() * pool.length)]);
}
function offSeasonCrop(id) { const c = CROP[id]; return !!c && c.season !== S.season && c.season !== 4; }
// The villager card line: this season's extra perk and how the hearts set it.
function seasonLine(np) {
  const p = seasonPerk(np.id); if (!p) return '';
  const v = spv(np.id, p.id), cls = v > 0 ? 'okline' : v < 0 ? 'warnline' : '';
  return L`<small class="hint season-perk ${cls}">${SEASONS[S.season].e} بف الموسم: ${p.d(v)}${hearts(np.id) < 5 ? L(' (يصير موجب من 6 قلوب)') : hearts(np.id) === 5 ? L(' (يبدأ من 6 قلوب)') : ''}</small>`;
}
function giftDaysLeft(np) { const st = S.npc[np.id]; return st && st.cd !== undefined ? GIFT_GRACE - (dayAbs() - st.cd) : GIFT_GRACE; }
// Auto donor (kept by the family): pays the Donor at the start of every season, as soon as there's enough gold.
function autoDonor() { if (S.leg.donorAuto && !donorOn() && S.gold >= DONOR_COST) A.donor(); }
function tickLove() {
  autoDonor();
  for (const np of NPCS) {
    const st = S.npc[np.id]; if (!st) continue;
    if (st.cd === undefined) st.cd = dayAbs();
    if (offline) { st.cd++; continue; } // days away from the game don't count
    if (bonded(np.id) || donorOn() || dayAbs() - st.cd < GIFT_GRACE || st.pts <= 0) continue;
    const before = hearts(np.id); st.pts = Math.max(0, st.pts - 50);
    if (hearts(np.id) < before) log(L`💔 ${np.n} زعل لأنك ما أهديته من فترة: صار ${hearts(np.id)} قلوب`, 'warn');
  }
}
function canWed(np) { return np.id !== 'mayor' && !!S.gender && np.g !== S.gender; }
/* Lifelong friend: the same-gender match for marriage, with the same rewards (+10 hearts so the perk doubles,
   love never fades, +10% to all production). You can have a spouse and a lifelong friend. Never the mayor. */
function canBond(np) { return np.id !== 'mayor' && !!S.gender && np.g === S.gender; }
/* Soul twin (legacy perk q_twin): once you have a spouse and a lifelong friend, any other villager (the mayor too,
   either gender) can become a soul twin for TWIN_COST each, at 10 hearts. Their perk is x2.5 (+15 hearts) and love
   never fades. Starts over every generation, like marriage. */
const TWIN_COST = 10e6;
function twinIcon(t, size = 22) { return t.replace('🌟', icon('perk-q_twin', size)); } // soul twin lines show the twin badge, not the plain star
function twinOpen() { return P('q_twin') > 0 && !!S.spouse && !!S.friend && !Object.keys(S.twins || {}).length; } // one soul twin only
function isTwin(id) { return !!(S.twins && S.twins[id]); }
function bonded(id) { return S.spouse === id || S.friend === id || isTwin(id); }
function gv(m, f) { return S.gender === 'f' ? f : m; }
function genderPick(action, cur) {
  return `<div class="row genderpick">${['m', 'f'].map(g => `<button class="btn ${cur === g ? 'gold' : 'ghost'} sm" data-a="${action}" data-v="${g}">${GENDER[g].e} ${GENDER[g].n}</button>`).join('')}</div>`;
}

const RANKS = [['F', 0], ['E', 40], ['D', 150], ['C', 450], ['B', 1200], ['A', 3000], ['S', 8000]];
const HUNT_NAMES = [L('القضاء على ذئاب الغابة'), L('حماية قافلة تجارية'), L('تطهير كهف العناكب'), L('مطاردة قطّاع الطرق'),
  L('حراسة المعبد القديم'), L('صيد وحش البحيرة'), L('استكشاف الأطلال المنسية'), L('إنقاذ حطّاب مفقود'),
  L('طرد الغيلان من الطاحونة'), L('مرافقة الكاهن إلى الجبل'), L('تدمير عش الخفافيش'), L('استعادة سيف الفارس')];

/* ---------------- الحالة ---------------- */
function newState() {
  const plots = [];
  for (let i = 0; i < 4; i++) plots.push({ c: null, p: 0, w: false });
  return {
    v: 1, name: '', started: false,
    gold: 50, clock: 10, day: 1, season: 0, year: 1, weather: 'sunny',
    inv: {}, seen: {},
    locked: { copper: 1, iron: 1, silver: 1, gold_ore: 1, mithril: 1, adamant: 1, gem: 1 },
    skills: { farm: { l: 1, x: 0 }, ranch: { l: 1, x: 0 }, mine: { l: 1, x: 0 }, fish: { l: 1, x: 0 } },
    farm: { plots, seed: 'turnip' },
    barn: { n: {}, t: {}, h: {}, q: {}, br: null, houses: 1, cd: [], lab: 0 },
    mine: { depth: 1, max: 1, prog: 0, blocks: 0, miners: 0 },
    tools: { hoe: 0, can: 0, pick: 0, sword: 0, armor: 0, rod: 0, crook: 0, glove: 0, helmet: 0, shield: 0, amulet: 0, boots: 0 }, tlg: {},
    lake: { prog: 0, fishers: 0, last: null, spot: 'lake', bait: 0, autoBait: false },
    hero: { lvl: 1, xp: 0, hp: 60, xc: 1 },
    af: null, // auto-forge job { t, goal, n }
    world: 'village', // which world's tabs are showing (industry.js)
    wk: null, // the weekly challenge and village goal (weekly.js)
    wv: 1,
    dun: { active: false, floor: 1, max: 1, kills: 0, enemy: null, auto: true, autoEat: true, resting: false, ht: 0, et: 0, retry: 0, eatCd: 0 },
    guild: { gp: 0, board: [], active: [], boardT: 0, qid: 0, sk: {}, refCd: 0 },
    bld: {}, off: {}, spouse: null, friend: null, twins: {}, gender: null,
    npc: Object.fromEntries(NPCS.map(n => [n.id, { pts: 250, gd: 0 }])),
    stats: { earned: 0, harvests: 0, products: 0, blocks: 0, kills: 0, quests: 0, play: 0, fish: 0 },
    gen: { earned: 0, days: 0, ch: null, chDone: false },
    leg: { gen: 1, family: '', stars: 0, totalStars: 0, perks: {}, heir: {}, ch: {}, ach: {}, best: { dun: 0, mine: 0 }, history: [], married: 0, album: {}, fishRec: {}, pets: {}, eggs: [] },
    last: Date.now(),
  };
}

let S = null;
let tab = 'farm';
let lastSig = '';
let offline = false;
let logs = [], indLogs = []; // each world keeps its own event log (industry.js logs with world 'ind')
let logDirty = true, logDrawT = 0;
let zoneMode = false;
function owned(id) { return id === 'miners' ? S.mine.miners > 0 : id === 'fishers' ? S.lake.fishers > 0 : !!S.bld[id]; }

/* ----- مضاعفات الإرث ----- */
const P = id => S.leg.perks[id] || 0;
const H = id => S.leg.heir[id] || 0;
const CC = id => S.leg.ch[id] || 0;
const inCh = id => S.gen.ch === id;
function bless() { return 1 + 0.05 * P('q_bless'); }
function achMult() { return 1 + 0.01 * Object.keys(S.leg.ach).length; }
// Tool heirlooms also give +1% gold per level, so they stay worth taking next to the «Tool legacy» perk.
function heirToolGold() { return ['sword', 'armor', 'hoe', 'can', 'pick', 'rod'].reduce((a, k) => a + H(k), 0) * 0.01; }
// Weekly rewards (weekly.js): each lasts 7 days from the moment it's earned. buf = weekly challenge, vb = village goal.
function wkOn(k) { return !!(S.wk && S.wk[k] > Date.now()); }
function goldMult() { return (wkOn('buf') ? 1.1 : 1) * (1 + 0.1 * P('t_price')) * (1 + 0.05 * H('coin') + heirToolGold()) * (1 + 0.1 * CC('noworkers')) * achMult() * bless() * (inCh('poverty') ? 0.5 : 1); }
/* Production speeds use two buckets. Inside a bucket the bonuses add up; the two buckets multiply.
   - this generation: tools, skill levels, villagers (starts over every generation)
   - the family: legacy perks, challenge rewards, the valley's blessing, marriage
   Penalties (an active challenge) multiply on top. Each list is [label, bonus] with bonus 0.3 = +30%. */
/* Village fund (a gold sink for late generations): the family donates, and each level gives +1% to every kind of
   production, for good. No top level; each level costs double the one before. The Donor: pay once a season and
   nobody's love fades that season. */
const DON_BASE = 10e6, DONOR_COST = 10e6;
function donLv() { return S.leg.don || 0; }
function donCost(l = donLv()) { return DON_BASE * Math.pow(2, l); }
function donorOn() { return S.donor === seasonKey(); }
function familyProd() { return [[L('💍 الزواج'), S.spouse ? 0.1 : 0], [L('🤝 صديق العمر'), S.friend ? 0.1 : 0], [L`🏛️ صندوق القرية (${donLv()})`, 0.01 * donLv()], [L('🌈 بركة الوادي'), 0.05 * P('q_bless')], [L('🐌 مكافأة تحدي الزمن البطيء'), 0.1 * CC('slow')], [L('🏘️ هدف القرية الأسبوعي'), wkOn('vb') ? 0.1 : 0]]; }
// A village goal prize (weekly.js), for its own area: h crops, m mine, f fish.
function vgSrc(k) { return [L('🏘️ جائزة هدف القرية'), typeof vgBuff === 'function' ? vgBuff(k) : 0]; }
function speedSrc(kind) {
  const pen = [[L('⚠️ تحدي الزمن البطيء (نشط)'), inCh('slow') ? 0.5 : 1]];
  if (kind === 'grow') return { gen: [[tlab('hoe', '🌾', L`🌾 المعزقة ${TIER[S.tools.hoe]}`), 0.2 * S.tools.hoe * lf('hoe')], [L`📈 مستوى الزراعة ${S.skills.farm.l}`, 0.02 * (S.skills.farm.l - 1)], [L`👩‍🌾 نورة (${hearts('noura')} قلوب)`, 0.03 * hearts('noura')]],
    fam: [[L('🌳 تربة خصبة'), 0.25 * P('f_grow')], [L('❄️ مكافأة تحدي الشتاء'), 0.15 * CC('winter')], vgSrc('h'), ...familyProd()], pen };
  if (kind === 'ranch') return { gen: [[tlab('crook', '🐑', L`🐑 عصا الراعي ${TIER[S.tools.crook || 0]}`), 0.5 * (S.tools.crook || 0) * lf('crook')], [L`📈 مستوى الرعي ${S.skills.ranch.l}`, 0.02 * (S.skills.ranch.l - 1)], [L('👩‍🦱 سلمى: بف الموسم'), spv('salma', 'ranch')]],
    fam: [[L('🌳 حيوانات سعيدة'), 0.2 * P('r_speed')], ...familyProd()], pen };
  if (kind === 'mine') return { gen: [[tlab('pick', '⛏️', L`⛏️ الفأس ${TIER[S.tools.pick]}`), 0.6 * S.tools.pick * lf('pick')], [L`📈 مستوى التعدين ${S.skills.mine.l}`, 0.05 * (S.skills.mine.l - 1)], [L('🧔 قاسم: بف الموسم'), spv('smith', 'mine')]],
    fam: [[L('🌳 سواعد قوية'), 0.3 * P('m_power')], [L('🕳️ مكافأة تحدي تحت الأرض'), 0.2 * CC('underground')], vgSrc('m'), ...familyProd()], pen };
  return { gen: [[tlab('rod', '🎣', L`🎣 السنارة ${TIER[S.tools.rod]}`), 0.5 * S.tools.rod * lf('rod')], [L`📈 مستوى الصيد ${S.skills.fish.l}`, 0.03 * (S.skills.fish.l - 1)]],
    fam: [[L('🌳 سواعد قوية'), 0.3 * P('m_power')], vgSrc('f'), ...familyProd()], pen };
}
function bucket(list) { return list.reduce((a, [, b]) => a + b, 1); }
function speedMult(kind) { const s = speedSrc(kind); return bucket(s.gen) * bucket(s.fam) * s.pen.reduce((a, [, f]) => a * f, 1); }
function xpMult() { return (wkOn('buf') ? 1.1 : 1) * (1 + 0.1 * H('diary')) * achMult() * bless(); }
function warMult() { return (1 + 0.15 * P('w_power')) * (1 + 0.1 * CC('warrior')) * bless(); }
function starMult() { return (1 + 0.1 * P('t_stars')) * (1 + 0.05 * H('amulet')) * (1 + 0.1 * CC('poverty')) * bless(); }
function offlineCap() { return (12 + 6 * P('t_offline')) * 3600; }
function startGold(l) { return l ? 2000 * Math.pow(4, l - 1) : 0; }
function noFarm() { return inCh('warrior') || inCh('underground'); }
function bestDun() { return Math.max(S.leg.best.dun, S.dun.max); }
function bestMine() { return Math.max(S.leg.best.mine, S.mine.max); }
function deepLocked() { return S.leg.gen < 4 && S.dun.max >= 100; }
function on(id) { return owned(id) && !S.off[id]; }
function togBtn(id) {
  const o = on(id);
  return L`<button class="tog ${o ? 'on' : ''}" data-a="toggleAuto" data-v="${id}" title="اضغط للتشغيل/الإيقاف">${o ? '🟢' : '⏸️'} ${TOGGLES[id]}: ${o ? L('يعمل') : L('متوقف')}</button>`;
}

/* ---------------- أدوات ---------------- */
const R = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const $ = id => document.getElementById(id);

function fmt(n) {
  n = Math.floor(n);
  if (Math.abs(n) < 10000) return n.toLocaleString('en');
  const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = 0, x = n;
  while (Math.abs(x) >= 1000 && i < u.length - 1) { x /= 1000; i++; }
  return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0) + u[i];
}
function ftime(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + L('ث');
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return m + L('د') + (r ? ' ' + r + L('ث') : '');
  const h = Math.floor(m / 60);
  return h + L('س ') + (m % 60) + L('د');
}
function clockStr() {
  const mins = Math.floor(6 * 60 + (S.clock / DAY_LEN) * 20 * 60);
  const h = Math.floor(mins / 60) % 24, m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function log(msg, type = '', world = 'village') {
  if (offline) return;
  const list = world === 'ind' ? indLogs : logs;
  list.unshift({ t: clockStr(), msg, type });
  if (list.length > 80) list.pop();
  logDirty = true;
  eventVisual(msg, type);
}
let toastT = 0;
function toast(msg) {
  const t = $('toast'); visualText(t, msg); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

function have(id) { return S.inv[id] || 0; }
function give(id, n = 1) {
  S.inv[id] = (S.inv[id] || 0) + n;
  if (!S.seen[id]) { S.seen[id] = 1; log(L`اكتشفت غرضاً جديداً: ${ITEMS[id].e} ${ITEMS[id].n}`, 'new'); }
}
function take(id, n = 1) {
  if (have(id) < n) return false;
  S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id];
  return true;
}
function addGold(n) { S.gold += n; if (n > 0) { S.stats.earned += n; S.gen.earned += n; } }
function hearts(id) { return Math.floor(((S.npc[id] || {}).pts || 0) / 100) + (isTwin(id) ? 15 : S.spouse === id || S.friend === id ? 10 : 0); }
function sellPrice(id) { return Math.round(ITEMS[id].price * (1 + 0.02 * hearts('mayor')) * Math.max(0.1, 1 + spv('mayor', 'sell') + (id === featItem() ? spv('mayor', 'feat') : 0) + (offSeasonCrop(id) ? spv('mayor', 'off') : 0)) * goldMult() * (id === dealCrop() ? 3 : 1) * (ITEMS[id].cat === 'fish' ? fishMult() : 1)); }
// Seasonal trader (special skill): one crop of the current season sells for x3.
function dealCrop() {
  if (!P('t_deal')) return null;
  const k = S.year + '-' + S.season;
  if (!S.deal || S.deal.k !== k) {
    const fit = CROPS.filter(c => c.season === S.season || c.season === 4), open = fit.filter(cropUnlocked);
    const c = pick(open.length ? open : fit.length ? fit : CROPS);
    S.deal = { k, id: c.id };
  }
  return S.deal.id;
}
function dayAbsOf(x) { return (x.year - 1) * 4 * DAYS_PER_SEASON + x.season * DAYS_PER_SEASON + x.day; }
function dayAbs() { return (S.year - 1) * 4 * DAYS_PER_SEASON + S.season * DAYS_PER_SEASON + S.day; }

function xpNeed(l) { return Math.floor(25 * Math.pow(l, 2.5)); }
function addXp(k, x) {
  const s = S.skills[k];
  x *= xpMult() * (k === 'farm' ? 1 + 0.3 * P('f_xp') : 1);
  s.x += x;
  while (s.x >= xpNeed(s.l)) { s.x -= xpNeed(s.l); s.l++; if (!LITE || s.l % 10 === 0) log(L`⭐ ارتفع مستوى ${SKILL_N[k]} إلى ${s.l}!`, 'good'); }
}

/* ---------------- المزرعة ---------------- */
function cropUnlocked(c) { return S.skills.farm.l >= c.lvl && (c.season !== 4 || S.leg.gen >= 3); }
function waterMult() { return 2 + 0.25 * S.tools.can * lf('can'); }
// The greenhouse covers the first 4 plots per level; the rest follow the season.
function ghCount() { return on('greenhouse') ? 4 * Math.min(3, S.bld.greenhouse || 0) : 0; }
function growMult(c, gh) {
  let m = speedMult('grow');
  if (c.season !== S.season && c.season !== 4 && !gh) m *= Math.max(0.1, Math.min(1, 0.5 * (1 + spv('noura', 'offgrow'))));
  return m;
}
function plotSpeed(p) { return growMult(CROP[p.c], S.farm.plots.indexOf(p) < ghCount()) * (p.w ? waterMult() : 1); }
/* The harvester, planter and sprinklers work on part of the field, growing with each level: 10%, 25%, 50%, 75%, 100%.
   They cover the first plots in the field. */
const WORK_COVER = [0, 0.1, 0.25, 0.5, 0.75, 1];
function coverN(id) { return on(id) ? Math.ceil(S.farm.plots.length * WORK_COVER[Math.min(5, S.bld[id] || 0)]) : 0; }
function covers(id, i) { return i < coverN(id); }
function autoWet(i) { return S.weather === 'rain' || covers('sprinkler', i); }
function isReady(p) { return p.c && p.p >= CROP[p.c].grow; }
function plotCrop(p) {
  const a = on('zoning') && p.a && CROP[p.a];
  return a && cropUnlocked(a) ? a : CROP[S.farm.seed];
}
function seedCost(c) { return P('f_seeds') ? 0 : Math.round(c.seed * Math.max(0.1, 1 - spv('noura', 'seed'))); }
function plant(i) {
  const p = S.farm.plots[i]; if (p.c || noFarm()) return false;
  const c = plotCrop(p);
  if (!c || !cropUnlocked(c) || S.gold < seedCost(c)) return false;
  S.gold -= seedCost(c); p.c = c.id; p.p = 0; p.w = autoWet(i);
  return true;
}
function harvest(i) {
  const p = S.farm.plots[i]; if (!isReady(p)) return false;
  const c = CROP[p.c];
  const n = Math.random() < 0.01 * S.skills.farm.l + 0.03 * H('seedbag') ? 2 : 1;
  give(c.id, n);
  if (Math.random() < Math.max(0, 0.01 * P('f_golden') + spv('noura', 'gold'))) {
    const g = sellPrice(c.id) * 10; addGold(g);
    if (!LITE) log(L`✨ محصول ذهبي! ${c.e} ${c.n} يلمع ذهب: +${fmt(g)}💰 (×10 سعره)`, 'golden');
    if (!offline && typeof goldenVisual === 'function') goldenVisual(i, g);
  } addXp('farm', c.price / 5 * n); S.stats.harvests += n;
  p.c = null; p.p = 0; p.w = false;
  return true;
}
function water(i) {
  const p = S.farm.plots[i];
  if (!p.c || p.w || isReady(p)) return false;
  p.w = true; return true;
}
function plotCost() { return Math.round(80 * Math.pow(1.75, S.farm.plots.length - 4)); }
function tickFarm(dt) {
  const hv = coverN('harvester'), pl = coverN('planter');
  S.farm.plots.forEach((p, i) => {
    if (p.c) {
      if (autoWet(i)) p.w = true;
      const c = CROP[p.c];
      if (p.p < c.grow) p.p = Math.min(c.grow, p.p + dt * plotSpeed(p));
    }
    if (i < hv && isReady(p)) harvest(i);
    if (i < pl && !p.c) plant(i);
  });
}

/* ---------------- الحظيرة ---------------- */
// Always an even number (6, 10, 16 … 36), so every animal can find a breeding pair.
function barnCap() { const c = 5 + 5 * (S.bld.barn || 0); return c % 2 ? c + 1 : c; }
function animalCostAt(a, n) { return Math.round(a.cost * Math.pow(a.grow || 1.25, n) * (1 - 0.1 * P('r_cost')) * Math.max(0.1, 1 - spv('salma', 'cost'))); }
function animalCost(a) { return animalCostAt(a, S.barn.n[a.id] || 0); }
// Buying several at once: each one costs a bit more than the last, the same as buying them one by one.
function animalCostN(a, k) { const n = S.barn.n[a.id] || 0; let t = 0; for (let i = 0; i < k; i++) t += animalCostAt(a, n + i); return t; }
function animalMaxBuy(a) { const n = S.barn.n[a.id] || 0, room = Math.max(0, barnCap() - n); let k = 0, t = 0; while (k < room && t + animalCostAt(a, n + k) <= S.gold) { t += animalCostAt(a, n + k); k++; } return k; }
function animalBuyCalc(id) {
  const a = ANIMALS.find(x => x.id === id), i = $('buyAnN'), o = $('buyAnT'); if (!a || !i || !o) return;
  const k = Math.max(0, Math.floor(+i.value || 0)), room = Math.max(0, barnCap() - (S.barn.n[id] || 0)), c = animalCostN(a, Math.min(k, room));
  o.innerHTML = k > room ? L`ما فيه مكان إلا لـ${room}` : L`المبلغ: <b>${fmt(c)}💰</b>` + (c > S.gold ? L` • ينقصك ${fmt(c - S.gold)}` : '');
}
function animalSpeed(a) { return (0.5 + (S.barn.h[a.id] ?? 100) / 100) * speedMult('ranch'); }
function grades(id) { const q = S.barn.q[id] || { p: 0, g: 0 }, n = S.barn.n[id] || 0; return { n0: Math.max(0, n - (q.p || 0) - (q.g || 0)), p: q.p || 0, g: q.g || 0 }; }
/* Breeding: put two animals of the same grade in a house and the result comes at once.
   Success: both become the next grade. Failure: both animals are gone (unless the «Expert breeder» perk).
   Then that house rests a few minutes. «Breeding tools» from the market shorten the rest and raise the chances. */
const HOUSE_MAX = 6; // the 6th house also opens the auto-breed focus
const BREED_LV = [
  { rest: 300, p: 0.20, g: 0.05 },
  { rest: 240, p: 0.25, g: 0.08, cost: 25000 },
  { rest: 120, p: 0.33, g: 0.12, cost: 300000 },
];
// Level from the «Breeding tools» building (S.barn.lab is where 1.4.1 kept it for one day).
function breedLv() { return BREED_LV[Math.min(BREED_LV.length - 1, Math.max(S.bld.breedlab || 0, S.barn.lab || 0))]; }
// Salma's hearts raise the chances: at 10 hearts the best tools go from 33% to 67% and from 12% to 25%.
function breedChance(to) { return Math.min(to === 'p' ? 0.9 : 0.4, breedLv()[to] * (1 + (to === 'p' ? 0.103 : 0.108) * hearts('salma'))); }
function breedFrom(to) { return to === 'p' ? 'n0' : 'p'; }
function houseRest() { return Math.round(breedLv().rest * Math.max(0.2, 1 - spv('salma', 'rest'))); }
function houseCount() { return Math.min(HOUSE_MAX, S.barn.houses || 1); }
function houseCost() { return Math.round(5000 * Math.pow(5, houseCount() - 1)); }
function houseCd(i) { return (S.barn.cd || [])[i] || 0; }
function freeHouse() { for (let i = 0; i < houseCount(); i++) if (houseCd(i) <= 0) return i; return -1; }
function breedBlock(a, to) {
  const G = GRADE[to], g = grades(a.id);
  if (S.skills.ranch.l < G.lvl) return L`يتطلب رعي ${G.lvl}`;
  if (g[breedFrom(to)] < 2) return L`تحتاج ${to === 'p' ? L('اثنين عاديين') : L('اثنين ممتازين')}`;
  if (freeHouse() < 0) return L('كل البيوت ترتاح');
  return '';
}
/* Focus (with all 6 houses): pick one animal and the free houses breed it by themselves,
   normal to premium first, then premium to golden. Same chances and losses as breeding by hand. */
function focusOn() { return houseCount() >= HOUSE_MAX && ANIMALS.some(a => a.id === S.barn.focus) ? S.barn.focus : null; }
function autoBreed() {
  const id = focusOn(); if (!id) return;
  const a = ANIMALS.find(x => x.id === id);
  for (let n = 0; n < HOUSE_MAX && freeHouse() >= 0; n++) {
    const to = !breedBlock(a, 'p') ? 'p' : !breedBlock(a, 'g') ? 'g' : null;
    if (!to) break;
    breedRoll(id, to);
  }
}
function tickBreed(dt) {
  const cd = S.barn.cd || (S.barn.cd = []);
  for (let i = 0; i < cd.length; i++) if (cd[i] > 0) cd[i] = Math.max(0, cd[i] - dt);
  autoBreed();
  // Breeding started before the gamble update finishes right away with the chance it had.
  for (const k of ['br', 'br2']) {
    const B = S.barn[k]; if (!B) continue;
    S.barn[k] = null;
    const a = ANIMALS.find(x => x.id === B.a), G = GRADE[B.to];
    if (!a || !G || grades(B.a)[breedFrom(B.to)] < 1 || Math.random() >= (B.chance || 0)) continue;
    const q = S.barn.q[B.a] || (S.barn.q[B.a] = { p: 0, g: 0 });
    if (B.to === 'g') q.p = (q.p || 0) - 1;
    q[B.to] = (q[B.to] || 0) + 1;
    log(L`🧬 نجح التهجين! صار عندك ${a.n} ${gName(a, B.to)} ${G.e}`, 'season');
  }
}
function breedRoll(id, to) {
  const a = ANIMALS.find(x => x.id === id), G = GRADE[to], i = freeHouse();
  const q = S.barn.q[id] || (S.barn.q[id] = { p: 0, g: 0 });
  q.p = q.p || 0; q.g = q.g || 0;
  const cd = S.barn.cd || (S.barn.cd = []);
  cd[i] = houseRest();
  S.stats.breeds = (S.stats.breeds || 0) + 1;
  const win = Math.random() < breedChance(to);
  if (win) {
    if (to === 'g') q.p -= 2;
    q[to] += 2;
    S.stats.breedWins = (S.stats.breedWins || 0) + 1;
    log(L`🧬 نجح التهجين! صار عندك ${a.n} ${gName(a, to)} ×2 ${G.e}`, 'golden');
  } else if (P('r_twin')) {
    log(L`🧬 فشل التهجين، لكن ${a.n} سالمة بفضل «مربّي خبير»`, 'warn');
  } else {
    if (to === 'g') q.p -= 2;
    S.barn.n[id] = Math.max(0, (S.barn.n[id] || 0) - 2);
    log(L`💀 فشل التهجين... خسرت ${a.n} ×2`, 'warn');
  }
  return win;
}
function tickRanch(dt) {
  tickBreed(dt);
  for (const a of ANIMALS) {
    const n = S.barn.n[a.id] || 0; if (!n) continue;
    S.barn.h[a.id] = on('rancher') ? 100 : Math.max(0, (S.barn.h[a.id] ?? 100) - dt * 0.12);
    S.barn.t[a.id] = (S.barn.t[a.id] || 0) + dt * animalSpeed(a);
    while (S.barn.t[a.id] >= a.time) {
      S.barn.t[a.id] -= a.time;
      const g = BREEDABLE.includes(a.id) ? grades(a.id) : { n0: n, p: 0, g: 0 };
      const base = g.n0 + 2 * g.p, gold = 2 * g.g, gid = a.prod + '_g';
      if (base) give(a.prod, base);
      if (gold) give(gid, gold);
      S.stats.products += base + gold;
      addXp('ranch', (ITEMS[a.prod].price * base + (gold ? ITEMS[gid].price * gold : 0)) / 8);
    }
  }
}

/* ---------------- المنجم ---------------- */
function mineMult() { return speedMult('mine'); }
function hardness() { const d = S.mine.depth; return 4 + d * 0.8 + d * d * 0.01; }
// Rails in the Industrial Age cut the price and its growth (×1.45 → ×1.12), so 200 miners are reachable.
function minerCost() { return Math.round(250 * Math.pow(indGrowth('rails'), S.mine.miners) * (1 - indDisc('rails'))); }
function minerRate() { return S.mine.miners * 0.4 * mineMult(); }
function oresAt(d) { return ORES.filter(o => o.depth <= d); }
function dig(amount) {
  S.mine.prog += amount;
  let guard = 0;
  while (S.mine.prog >= hardness() && guard++ < 500) { S.mine.prog -= hardness(); blockDone(); }
}
function blockDone() {
  const d = S.mine.depth, av = oresAt(d);
  const ws = av.map((o, i) => Math.pow(0.55, av.length - 1 - i));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), o = av[av.length - 1];
  for (let i = 0; i < av.length; i++) { r -= ws[i]; if (r <= 0) { o = av[i]; break; } }
  give(o.id, 1 + Math.floor(d / 40));
  if (Math.random() < (0.004 + d * 0.0001) * (1 + 0.5 * P('m_gem')) * (1 + 0.2 * CC('underground')) * Math.max(0, 1 + spv('smith', 'gem'))) { give('gem'); log(L('💎 عثرت على جوهرة نادرة!'), 'good'); }
  addXp('mine', 1 + d * 0.15); S.stats.blocks++;
  if (d === S.mine.max && d < PICK_CAP[S.tools.pick]) {
    S.mine.blocks++;
    if (S.mine.blocks >= 5) {
      const was = S.mine.depth;
      S.mine.blocks = 0; S.mine.depth = Math.min(PICK_CAP[S.tools.pick], was + (P('m_tnt') ? 2 : 1)); S.mine.max = S.mine.depth;
      const no = ORES.find(x => x.depth > was && x.depth <= S.mine.depth);
      if (no) log(L`⛏️ الطابق ${S.mine.depth}: ظهر معدن جديد ${no.e} ${no.n}!`, 'good');
      else if (Math.floor(S.mine.depth / 10) > Math.floor(was / 10)) log(L`⛏️ نزلت إلى الطابق ${S.mine.depth} في المنجم`);
    }
  }
}

/* ---------------- البطل والقتال ---------------- */
function heroMaxHp() { return Math.floor((60 + 20 * (S.hero.lvl - 1) + ARMOR_HP[S.tools.armor] * lf('armor')) * (1 + 0.05 * hearts('leila')) * warMult() * (1 + titleB('iron', 0.05))); }
function heroAtk() { return (6 + 3 * (S.hero.lvl - 1) + SWORD[S.tools.sword] * lf('sword')) * warMult() * mskPow() * amuletMult() * petMult('atk') * (1 + titleB('sword', 0.05)); }
function heroDef() {
  const flat = 1 + (S.hero.lvl - 1) + ARMOR_DEF[S.tools.armor] * lf('armor') + gearPct(SHIELD_DEF, 'shield') + gearPct(HELM_DEF, 'helmet');
  return flat * (1 + gearPct(SHIELD_PCT, 'shield') + gearPct(HELM_PCT, 'helmet')) * mskPow() * amuletMult() * petMult('def') * (1 + 0.02 * hearts('leila')) * (1 + titleB('guard', 0.05));
}
// Leila's season buff «guard»: less damage taken in the dungeon (more below 5 hearts). Never under 40% of the hit.
function leilaGuard() { return clamp(1 - spv('leila', 'guard'), 0.4, 2); }
function heroPower() { return Math.round((heroAtk() * 2 + heroDef() * 2 + heroMaxHp() / 5) * petMult('pow') * (1 + titleB('legend', 0.05))); }
// Combat levels come about twice as fast as before 1.9.1 (the old curve was 50·l^2.2): the same xp gives about double the level.
function hxpNeed(l) { return Math.floor(5.5 * Math.pow(l, 2.2)); }
function heroXp(x) {
  const h = S.hero, g = x * xpMult() * (1 + 0.3 * P('w_xp')) * Math.max(0.1, 1 + spv('leila', 'xp')) * (1 + titleB('sage', 0.1));
  h.xp += g; saddleXp(g);
  while (h.xp >= hxpNeed(h.lvl)) {
    h.xp -= hxpNeed(h.lvl); h.lvl++; h.hp = heroMaxHp();
    log(L`⚔️ ارتفع مستواك القتالي إلى ${h.lvl}!`, 'good');
  }
}
function makeEnemy(f) {
  const boss = f % 10 === 0;
  let m, cyc;
  if (boss) { const i = f / 10 - 1; m = BOSSES[i % BOSSES.length]; cyc = Math.floor(i / BOSSES.length); }
  else { const i = Math.floor((f - 1) / 5); m = MONSTERS[i % MONSTERS.length]; cyc = Math.floor(i / MONSTERS.length); }
  const hp = Math.round((15 + 8 * f + 0.6 * f * f) * (boss ? 3 : 1));
  return {
    n: m[0] + (cyc ? ' ' + EPITHET[Math.min(cyc, 3)] : ''), e: m[1], boss, hp, mhp: hp,
    atk: (2 + 1.2 * f + 0.012 * f * f) * (boss ? 1.25 : 1), def: 0.5 * f + 0.01 * f * f,
  };
}
function dmg(a, d) { return Math.max(1, a * a / (a + d)) * R(0.85, 1.15); }
function regenRate() { return heroMaxHp() * 0.03 * (S.bld.inn ? 2 : 1) * Math.max(0.1, 1 + spv('leila', 'regen')); }
function healOf(id) { return (ITEMS[id].price * 1.5 + 10) * (S.bld.kitchen ? 2 : 1) * (1 + gearPct(AMULET_HEAL, 'amulet')) * (1 + titleB('healer', 0.1)); }
function foodList() {
  const cats = noFarm() ? ['crop', 'animal', 'fish', 'monster'] : ['crop', 'animal', 'fish'];
  return Object.keys(S.inv).filter(id => cats.includes(ITEMS[id].cat) && !S.locked[id] && !KINGS.some(k => k.id === id))
    .sort((a, b) => ITEMS[a].price - ITEMS[b].price);
}
/* Eating has a cooldown (10s, down to 2s with the «fast eating» skill), so food can't make you unbeatable.
   It picks the cheapest food that fills the missing health, or the most filling one if none does (golden items are never eaten). */
const EAT_CD = [10, 8, 6, 4, 3, 2];
function eatCd() { return EAT_CD[gsk('eat')]; }
// The same skill also shortens the wait before the quest board can be changed again.
const REF_CD = [60, 50, 40, 30, 22, 15];
function refreshCd() { return REF_CD[gsk('eat')]; }
function eat() {
  const D = S.dun, h = S.hero, mhp = heroMaxHp(), list = foodList().filter(id => !ITEMS[id].golden);
  if (!list.length) return 'none';
  if (D.eatCd > 0) return 'cd';
  const miss = mhp - h.hp; if (miss < 1) return 'full';
  const f = list.find(id => healOf(id) >= miss) || list[list.length - 1];
  take(f); h.hp = Math.min(mhp, h.hp + healOf(f)); D.eatCd = eatCd();
  return 'ok';
}
// What a monster on floor f gives (xp before the xp bonuses, which heroXp adds).
function enemyLoot(f, boss) {
  return { gold: Math.round((3 + 2 * f + 0.15 * f * f) * (boss ? 5 : 1) * goldMult() * (1 + titleB('hunt', 0.1)) * Math.max(0.1, 1 + spv('raad', 'loot'))), xp: (4 + 1.5 * f + 0.1 * f * f) * (boss ? 4 : 1) };
}
// Material chance; mastery adds to it with no limit. Above 100% every monster drops, and the rest raises the chance
// of one extra material (on top of the 50% from loot level 5).
function dropRaw(l = gsk('loot'), m = gsk('mast')) { return 0.35 + 0.08 * l + MAST_STEP * m; }
function dropCh(l, m) { return Math.min(1, dropRaw(l, m)); }
function extraCh(l = gsk('loot'), m = gsk('mast')) { return Math.min(1, (l >= 5 ? 0.5 : 0) + Math.max(0, dropRaw(l, m) - 1)); }
function killEnemy() {
  const D = S.dun, e = D.enemy, f = D.floor;
  const lt = enemyLoot(f, e.boss);
  addGold(lt.gold);
  if (e.boss && f > 100) { S.leg.stars += 1; S.leg.totalStars += 1; log(L('🌟 زعيم من الأعماق المنسية أعطاك نجمة إرث!'), 'season'); }
  heroXp(lt.xp);
  S.stats.kills++;
  const mats = MONSTER_MATS.filter(m => m.f <= f);
  const mat = Math.random() < 0.7 ? mats[mats.length - 1] : pick(mats);
  if (e.boss || Math.random() < dropCh()) give(mat.id, ((e.boss ? 3 : 1) + (Math.random() < extraCh() ? 1 : 0)) * (saddled('griffin') ? 2 : 1));
  if (e.boss && Math.random() < 0.25) give('gem');
  if (e.boss) log(L`🏆 هزمت الزعيم ${e.e} ${e.n}!`, 'good');
  if (e.boss && f > (S.guild.bossTop || 0)) {
    const gp = Math.round(f / 2); S.guild.bossTop = f; S.guild.gp += gp;
    log(L`🎖️ النقابة سمعت بانتصارك على زعيم الطابق ${f}: +${gp} نقاط نقابة`, 'good');
  }
  D.kills++;
  if (D.kills >= (e.boss ? 1 : 5)) {
    D.kills = 0; petFloor(f);
    const st = saddled('dragon') ? 2 : 1; // the saddled dragon carries you two floors down
    if (D.floor === D.max && !deepLocked() && D.max < floorCap()) { D.max = Math.min(floorCap(), D.max + st); if (D.max % 5 < st || e.boss) log(L`🗝️ فتحت الطابق ${D.max} في الزنزانة`); }
    if (D.auto && !(D.retry > 0)) D.floor = Math.min(D.max, D.floor + st);
  }
  D.enemy = makeEnemy(D.floor);
}
function heroDie() {
  const D = S.dun;
  S.hero.hp = 0; D.resting = true; D.enemy = null; D.kills = 0;
  D.floor = Math.max(1, D.floor - 1);
  D.retry = 180; // التقدم التلقائي يتوقف 3 دقائق ثم يحاول مجدداً
  log(L`☠️ سقطت في المعركة! تراجعت للطابق ${D.floor}. سترتاح حتى تتعافى${D.auto ? L('، وستحاول التقدم مجدداً بعد قليل') : ''}.`, 'bad');
}
function tickCombat(dt) {
  const D = S.dun, h = S.hero, mhp = heroMaxHp();
  if (h.hp > mhp) h.hp = mhp;
  if (D.retry > 0) D.retry -= dt;
  if (D.allyT > 0) D.allyT -= dt;
  if (D.eatCd > 0) D.eatCd = Math.max(0, D.eatCd - dt);
  if (!D.active || D.resting) {
    h.hp = Math.min(mhp, h.hp + regenRate() * dt);
    if (D.active && D.resting && h.hp >= mhp) { D.resting = false; log(L('💪 تعافيت تماماً وعدت للزنزانة')); }
    return;
  }
  if (!D.enemy) D.enemy = makeEnemy(D.floor);
  if (D.autoEat && h.hp < mhp * 0.4) eat();
  h.hp = Math.min(mhp, h.hp + mhp * 0.005 * dt); // تعافٍ بسيط أثناء القتال
  D.ht += dt; D.et += dt;
  const hitT = 1 / heroSpeed(); // the boots shorten the time between hits
  while (D.ht >= hitT) {
    D.ht -= hitT;
    D.enemy.hp -= dmg(heroAtk(), D.enemy.def);
    if (D.enemy.hp <= 0) killEnemy();
    if (P('w_ally')) { D.enemy.hp -= dmg(heroAtk() * 0.5, D.enemy.def); if (D.enemy.hp <= 0) killEnemy(); }
  }
  while (D.et >= 1.25) {
    D.et -= 1.25;
    h.hp -= dmg(D.enemy.atk, heroDef()) * leilaGuard();
    if (h.hp <= 0 && P('w_ally') && !(D.allyT > 0)) { h.hp = mhp * 0.3; D.allyT = 300; log(L('🫡 رفيقك وقف قدامك وأنقذك من السقوط!'), 'good'); }
    if (h.hp <= 0) { heroDie(); return; }
  }
}

/* ---------------- النقابة والمهمات ---------------- */
function rankIdx() { let r = 0; RANKS.forEach((x, i) => { if (S.guild.gp >= x[1]) r = i; }); return r; }
function questSlots() { return 1 + (S.bld.merc || 0) + (gsk('quest') >= 3 ? 1 : 0); }
/* Your guild rank limits how deep you can open the dungeon. Never below the start floor + 15, so the retire goal can always be reached. */
const RANK_FLOOR = [15, 30, 50, 75, 100, 150, Infinity];
function floorCap() { return Math.max(RANK_FLOOR[rankIdx()], (S.gen.dun0 || 1) + 15); }
/* Mercenary skills: only for the guild and the dungeon, and they start over every generation.
   Points: 1 for every 2 combat levels + 2 for every guild rank. Level n of a skill costs n points. */
const MSK = [
  { id: 'pow', ic: 'power', e: '⚔️', n: L('القوة'), d: l => L`+${10 * l}% هجوم ودفاع` },
  { id: 'loot', ic: 'loot', e: '💰', n: L('الغنائم'), d: l => L`فرصة المواد ${Math.round(dropCh(l, 0) * 100)}%` + (l >= 5 ? L(' • نص المرات مادة زيادة') : '') },
  { id: 'eat', ic: 'eat', e: '🍽️', n: L('الأكل السريع'), d: l => L`الانتظار بين الأكلات ${EAT_CD[l]}ث • تغيير المهمات ${REF_CD[l]}ث` },
  { id: 'quest', ic: 'quests', e: '📜', n: L('المهام'), d: l => L`مهام الصيد أسرع ${10 * l}% • +${20 * l}% نقاط النقابة` + (l >= 3 ? L(' • +1 خانة مهمة') : '') },
];
function gsk(id) { return (S.guild.sk || {})[id] || 0; }
/* Mastery: opens once every skill above is at level 5. Each level costs MAST_COST points, with no top level,
   and adds MAST_STEP to attack, defence and the material chance. */
const MAST_COST = 2, MAST_STEP = 0.002;
function mastOpen() { return MSK.every(k => gsk(k.id) >= 5); }
function mskPow() { return 1 + 0.1 * gsk('pow') + MAST_STEP * gsk('mast'); }
function mskPts() { return Math.floor(S.hero.lvl / 2) + 2 * rankIdx() - MSK.reduce((a, k) => a + gsk(k.id) * (gsk(k.id) + 1) / 2, 0) - MAST_COST * gsk('mast'); }
function pctTxt(v) { return Math.round(v * 1000) / 10 + '%'; } // 0.046 -> "4.6%"
// Guild points a hunt gives per 90 seconds at each rank (F..S); the quest skill adds +20% a level (×2 at level 5).
const QUEST_GP = [6, 10, 16, 26, 40, 60, 80];
function qGp(q) { return Math.round((q.type === 'deliver' ? Math.max(20, q.gp) : q.gp) * (1 + 0.2 * gsk('quest')) * Math.max(0.1, 1 + spv('raad', 'gp'))); }
function qDur(q) { return Math.round(q.dur * (1 - 0.1 * gsk('quest')) * Math.max(0.3, 1 - spv('raad', 'hunt'))); }
function questMult() { return (1 + 0.04 * hearts('raad')) * (1 + 0.25 * P('w_quest')) * goldMult(); }
/* Hunt rewards grow with the generation, in step with the gold goal to retire: x1 up to generation 3,
   about x14 at generation 8. Deliveries don't (their reward already follows the item's price). */
/* Guild titles (1.7.9): once the guild rank is S, guild points also fill the title you picked. Each title needs
   TITLE_XP points; when it's full the title is yours for good (kept by the family).
   1.8: a title only gives its bonus while it's active next to your name: one title, or three while the unicorn wears the saddle. */
const TITLE_XP = 50000;
const TITLES = [
  { id: 'hunt', e: '💰', n: L('صائد الوحوش'), d: L('+10% ذهب الوحوش') },
  { id: 'sword', e: '⚔️', n: L('سيف النقابة'), d: L('+5% هجوم') },
  { id: 'guard', e: '🛡️', n: L('حارس الوادي'), d: L('+5% دفاع') },
  { id: 'iron', e: '❤️', n: L('القلب الحديدي'), d: L('+5% صحة قصوى') },
  { id: 'sage', e: '📖', n: L('المحارب الحكيم'), d: L('+10% خبرة القتال') },
  { id: 'quest', e: '📜', n: L('سيد المهام'), d: L('+10% ذهب مهام الصيد') },
  { id: 'swift', e: '⚡', n: L('البرق'), d: L('+5% سرعة الضرب') },
  { id: 'tamer', e: '🥚', n: L('مروض الأساطير'), d: L('+25% فرصة بيض الحيوانات') },
  { id: 'healer', e: '🍽️', n: L('نصير الجرحى'), d: L('+10% شفاء الأكل') },
  { id: 'legend', e: '👑', n: L('أسطورة القرية'), d: L('+5% قوة في مهام النقابة') },
];
function titleData() { const T = S.leg.titles || (S.leg.titles = { have: {}, cur: '', xp: 0, show: '' }); T.have = T.have || {}; return T; }
// Titles active next to your name: the main one, plus two more while the unicorn wears the saddle.
function titleSide() { const T = titleData(); T.side = (T.side || []).filter(id => T.have[id] && id !== T.show).slice(0, 2); return T.side; }
function titleActive() { const T = S.leg.titles; if (!T || !T.have) return []; return [T.show, ...(saddled('unicorn') ? titleSide() : [])].filter(id => id && T.have[id]); }
function hasTitle(id) { return titleActive().includes(id); }
function titleB(id, v) { return hasTitle(id) ? v : 0; }
function titleOpen() { return rankIdx() >= RANKS.length - 1; }
// Called every guild tick: guild points earned since the last tick go to the chosen title once the rank is S.
function tickTitles() {
  const g = S.guild; if (g.gpT === undefined || g.gp < g.gpT) g.gpT = g.gp;
  const d = g.gp - g.gpT; g.gpT = g.gp;
  if (d <= 0 || !titleOpen()) return;
  const T = titleData();
  if (!T.cur || T.have[T.cur]) return;
  T.xp += d;
  if (T.xp >= TITLE_XP) {
    const id = T.cur, t = TITLES.find(x => x.id === id); T.xp -= TITLE_XP; T.have[id] = 1; T.cur = '';
    // A new title turns on by itself only into a free slot, so it never switches off one you picked.
    const on = !T.show || !T.have[T.show] ? (T.show = id) : saddled('unicorn') && titleSide().length < 2 ? T.side.push(id) : 0;
    log(L`🎖️ حصلت على لقب «${t.n}»! ${t.d}. ${on ? L('صار مفعّل جنب اسمك.') : L('فعّله جنب اسمك من النقابة عشان يشتغل بفه.')} اختر لقبك الجاي.`, 'golden'); toast(L`🎖️ لقب جديد: ${t.n}`);
  }
}
function titleName() {
  const T = S.leg.titles, ids = titleActive(); if (!ids.length) return '';
  return ids.map((id, i) => { const t = TITLES.find(x => x.id === id); return (ART['title-' + id] ? icon('title-' + id, 26) : t.e) + (i ? '' : ' ' + t.n); }).join(' ');
}
function titlePanel() {
  if (!titleOpen()) return '';
  const T = titleData(), n = Object.keys(T.have).length, uni = saddled('unicorn'), on = titleActive(), slots = uni ? 3 : 1;
  const cards = TITLES.map(t => {
    const own = T.have[t.id], cur = T.cur === t.id, act0 = on.includes(t.id);
    const act = own ? (act0 ? `<small class="good">${L('✅ مفعّل جنب اسمك')}</small>` + (t.id !== T.show ? `<button class="btn ghost sm" data-a="titleDrop" data-v="${t.id}">${L('✖ شيله')}</button>` : '') : `<button class="btn ghost sm" data-a="titleShow" data-v="${t.id}">${L('فعّله جنب اسمك')}</button>`)
      : cur ? `<small>${L`${fmt(T.xp)} / ${fmt(TITLE_XP)} نقطة`}</small><div class="bar"><i style="width:${Math.min(100, T.xp / TITLE_XP * 100)}%"></i></div>`
      : `<button class="btn sm" data-a="titlePick" data-v="${t.id}">${L('افرم هذا اللقب')}</button>`;
    const pic = ART['title-' + t.id] ? `<span class="title-pic">${icon('title-' + t.id, 64)}</span>` : '';
    return `<div class="title-card ${own ? 'own' : ''} ${cur || act0 ? 'cur' : ''}">${pic}<b>${pic ? '' : t.e + ' '}${t.n}</b><small>${t.d}</small>${act}</div>`;
  }).join('');
  return L`<div class="panel titles"><div class="ph"><h2>🎖️ ألقاب النقابة</h2><span class="stat">${n} / ${TITLES.length} • ${L`مفعّل ${on.length} / ${slots}`}</span></div>
    <p class="hint">وصلت الرتبة S! اختر لقب تفرمه، وكل نقاط النقابة اللي تجيبها بعدها تروح له. كل لقب يحتاج ${fmt(TITLE_XP)} نقطة، ولما يكتمل يصير لك للأبد ويبقى للعائلة كل الأجيال. <b>بف اللقب ما يشتغل إلا إذا كان مفعّل جنب اسمك</b>: لقب واحد، أو 3 ألقاب لو اليونيكورن لابس السرج.${T.cur ? '' : L(' <b>ما اخترت لقب تفرمه للحين، فالنقاط ما تنحسب.</b>')}</p>
    <div class="title-list">${cards}</div></div>`;
}
const GUILD_GEN_CAP = 200; // capped so very high generations don't get hunts worth tens of billions (×200 from generation 16)
function guildGen() { return Math.min(GUILD_GEN_CAP, Math.max(1, goldGoal() / 1e6)); }
function qGold(q) { return Math.round(q.gold * questMult() * (q.type === 'deliver' ? 1 : guildGen() * (1 + titleB('quest', 0.1)))); }
function questBasePower() { return heroPower() / (petMult('pow') * (1 + titleB('legend', 0.05))); }
function chanceOf(q) { return clamp(Math.pow(heroPower() / q.req, 2), 0.05, 1); }
function genQuest() {
  const r = rankIdx(), g = S.guild; g.qid++;
  const del = Object.keys(S.seen).filter(id => ['crop', 'animal', 'monster'].includes(ITEMS[id].cat) && !ITEMS[id].golden);
  if (del.length && Math.random() < 0.45) {
    const id = pick(del), it = ITEMS[id];
    const qty = Math.max(1, Math.round(R(3, 10) * (1 + r * 0.4) * Math.pow(60 / it.price, 0.35)));
    return { id: g.qid, type: 'deliver', item: id, qty, gold: Math.round(it.price * qty * 1.7), gp: 20, exp: 480 };
  }
  const dur = pick([45, 90, 180, 360, 600]);
  // Rewards still follow the rank-based size (so they don't jump with your power).
  const base = Math.round(25 * Math.pow(2, r) * R(0.6, 1.4) * (0.8 + dur / 1200));
  // 1.7.13: the power a hunt needs is 50%–150% of your own power without the griffin and the «Village Legend» title,
  // so those two make hunts easier and the rest stays a real choice.
  const req = Math.max(base, Math.round(questBasePower() * R(0.5, 1.5)));
  return {
    id: g.qid, type: 'hunt', n: pick(HUNT_NAMES), dur, req,
    gold: Math.round(base * dur / 25 * (1 + r * 0.3)), gp: Math.max(2, Math.round(QUEST_GP[r] * dur / 90)),
    xp: Math.round(base * dur / 90), exp: 480,
  };
}
const ALLY_MIN = 0.75;
function fillBoard() { while (S.guild.board.length < 4) S.guild.board.push(genQuest()); }
function tickGuild(dt) {
  const g = S.guild;
  tickTitles();
  for (const q of [...g.active]) {
    q.t += dt;
    if (q.t >= q.dur) {
      g.active.splice(g.active.indexOf(q), 1);
      if (Math.random() < q.chance) {
        const gold = qGold(q);
        addGold(gold); g.gp += qGp(q); heroXp(q.xp); S.stats.quests++;
        log(L`✅ نجحت مهمة «${Lx(q.n)}»: 💰 ${bi('+' + fmt(gold))} • ${bi('+' + qGp(q))} نقاط نقابة`, 'good');
      } else log(L`❌ فشلت مهمة «${Lx(q.n)}»... حاول عندما تصبح أقوى`, 'bad');
    }
  }
  for (const q of [...g.board]) { q.exp = (q.exp ?? 480) - dt; if (q.exp <= 0) g.board.splice(g.board.indexOf(q), 1); }
  // «Battle companion» perk: the companion takes hunting quests from the board when a slot is free, the surest first.
  // Only ones with at least ALLY_MIN chance, so none are wasted. Deliveries stay with the player (they use the storage).
  if (P('w_ally')) while (g.active.length < questSlots()) {
    const q = g.board.filter(x => x.type !== 'deliver' && chanceOf(x) >= ALLY_MIN).sort((a, b) => chanceOf(b) - chanceOf(a))[0];
    if (!q) break;
    g.board.splice(g.board.indexOf(q), 1); g.boardT = 0;
    g.active.push({ ...q, dur: qDur(q), t: 0, chance: chanceOf(q) });
    if (!offline) log(L`🫡 رفيقك قبل مهمة «${Lx(q.n)}»`); // 🫡 = the companion's portrait (🛡️ draws the armour)
  }
  if (g.refCd > 0) g.refCd = Math.max(0, g.refCd - dt);
  if (g.board.length < 4) { g.boardT += dt; if (g.boardT >= 40) { g.boardT = 0; g.board.push(genQuest()); } }
}

/* ---------------- البيع والأيام ---------------- */
function sellItem(id, n) {
  n = Math.min(n, have(id)); if (n <= 0) return 0;
  take(id, n); const g = sellPrice(id) * n; addGold(g); return g;
}
function shipAll(auto) {
  let total = 0;
  for (const id of Object.keys(S.inv)) if (!S.locked[id]) total += sellItem(id, have(id));
  if (total > 0) log(L`📦 ${auto ? L('صندوق الشحن باع') : L('بعت')} أغراضاً بقيمة ${fmt(total)}💰`, 'gold');
  return total;
}
function newDay() {
  S.day++; S.gen.days++;
  if (S.day > DAYS_PER_SEASON) {
    S.day = 1; S.season++;
    if (S.season > 3) { S.season = 0; S.year++; }
    if (!inCh('winter')) log(L`${SEASONS[S.season].e} بدأ موسم ${SEASONS[S.season].n}!`, 'season');
    const d = dealCrop(); if (d) log(L`🧺 تاجر الموسم وصل: يشتري ${CROP[d].e} ${CROP[d].n} بـ ×3 السعر`, 'gold');
    log(L('🏘️ أهل القرية عندهم بفات موسم جديدة: شوفها في تبويب القرية'), 'season');
  }
  if (inCh('winter')) S.season = 3;
  const r = Math.random();
  S.weather = S.season === 3 ? (r < 0.3 ? 'snow' : r < 0.6 ? 'cloudy' : 'sunny') : (r < 0.22 ? 'rain' : r < 0.45 ? 'cloudy' : 'sunny');
  if (on('bin')) shipAll(true);
  tickLove();
  log(L`🌅 صباح اليوم ${S.day}: ${WEATHER[S.weather].e} ${WEATHER[S.weather].n}${S.weather === 'rain' ? L(' — المطر يسقي حقلك') : ''}`);
}

function tick(dt) {
  S.stats.play += dt;
  S.clock += dt;
  while (S.clock >= DAY_LEN) { S.clock -= DAY_LEN; newDay(); }
  tickFarm(dt);
  tickRanch(dt);
  if (on('miners')) dig(minerRate() * dt);
  if (S.leg.gen >= 2 && on('fishers')) fish(fisherRate() * dt);
  tickCombat(dt);
  tickGuild(dt);
  tickPets(dt);
  tickForge(dt);
  tickInd(dt);
  checkChallenge();
}

/* ---------------- البحيرة ---------------- */
function fishPower() { return speedMult('fish'); }
function biteNeed() { return 6 + S.skills.fish.l * 0.5; }
function fisherCost() { return Math.round(400 * Math.pow(indGrowth('boat'), S.lake.fishers) * (1 - indDisc('boat'))); }
function fisherRate() { return S.lake.fishers * 0.35 * fishPower(); }
function fish(amount) {
  S.lake.prog += amount;
  let g = 0;
  while (S.lake.prog >= biteNeed() && g++ < 500) { S.lake.prog -= biteNeed(); catchFish(); }
}
function curSpot() { return SPOTS.find(s => s.id === S.lake.spot && S.skills.fish.l >= s.lvl) || SPOTS[0]; }
function baitX() { return S.lake.bait > 0 ? 2 : 1; }
function rareChance() { return Math.min(0.4, (0.08 + 0.01 * S.tools.rod) * baitX()); }
// Kept low on purpose: the album is permanent, so its legendaries and kings should take a few generations.
function legChance() { return Math.min(0.03, (0.003 + 0.0005 * S.tools.rod) * baitX()); }
// Fish album (kept by the family across generations): every fish with all 3 rarities gives +4% fish price, every king +10%.
function albumBits(id) { return (S.leg.album || {})[id] || 0; }
function albumRows() { return FISH.filter(f => (albumBits(f.id) & 7) === 7).length; }
function albumKings() { return KINGS.filter(k => albumBits(k.id)).length; }
function fishMult() { return 1 + 0.04 * albumRows() + 0.1 * albumKings(); }
function albumDone() { let n = 0; for (const f of FISH) for (let r = 0; r < 3; r++) if (albumBits(f.id) & (1 << r)) n++; return n + albumKings(); }
function albumTotal() { return FISH.length * 3 + KINGS.length; }
function makeBait(id) {
  if (!BAIT.includes(id) || !take(id, BAIT_COST)) return false;
  S.lake.bait = (S.lake.bait || 0) + BAIT_USES; return true;
}
function catchFish() {
  if (!(S.lake.bait > 0) && S.lake.autoBait) makeBait(BAIT.slice().sort((a, b) => have(b) - have(a))[0]);
  const bx = baitX(), rc = rareChance(), lc = legChance();
  if (S.lake.bait > 0) S.lake.bait--;
  if (Math.random() < 0.01) {
    const g = Math.round(300 * S.skills.fish.l * goldMult()); addGold(g);
    S.lake.last = 'treasure'; S.stats.fish++; if (!offline && !LITE) log(L`🧰 اصطدت صندوق كنز! +${fmt(g)}💰`, 'gold'); return;
  }
  const sp = curSpot(), K = KINGS.find(k => k.spot === sp.id);
  if (K && S.skills.fish.l >= K.lvl && Math.random() < 0.0008) return landFish(K, 0); // bait doesn't help kings
  const av = FISH.filter(f => f.spot === sp.id && f.lvl <= S.skills.fish.l);
  const ws = av.map((f, i) => Math.pow(0.62, i) * Math.pow(1 + 0.15 * S.tools.rod, i));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), f = av[0];
  for (let i = 0; i < av.length; i++) { r -= ws[i]; if (r <= 0) { f = av[i]; break; } }
  const roll = Math.random();
  landFish(f, roll < lc ? 2 : roll < lc + rc ? 1 : 0);
}
function landFish(f, r) {
  const R = RARITY[r], kg = Math.max(0.01, Math.round(f.w * (0.6 + Math.random() * 0.8) * R.x * 100) / 100);
  const n = f.king || !r ? 1 : Math.max(2, Math.round(R.m * kg / (f.w * R.x)));
  give(f.id, n); S.stats.fish++;
  const al = S.leg.album || (S.leg.album = {}), rec = S.leg.fishRec || (S.leg.fishRec = {});
  al[f.id] = (al[f.id] || 0) | (1 << r);
  const old = rec[f.id] || 0;
  if (kg > old) { rec[f.id] = kg; if (old && !offline) S.lake.recFx = 1; }
  S.lake.last = f.id; S.lake.lastR = r; S.lake.lastKg = kg; S.lake.lastN = n;
  addXp('fish', f.price * n / 6);
  if (offline) return;
  if (f.king) log(L`👑 اصطدت ${f.e} ${f.n}! وزنه ${kg} كغ`, 'golden');
  else if (r === 2 && !LITE) log(L`🌟 صيدة أسطورية! ${f.e} ${f.n} ${kg} كغ (×${n})`, 'golden');
}

/* ---------------- التحديات والإنجازات ---------------- */
function chGoal(c, t = CC(c.id)) { return c.type === 'gold' ? c.base * Math.pow(4, t) : c.type === 'floor' ? c.base + 10 * t : c.base + 20 * t; }
function chValue(c) { return c.type === 'gold' ? S.gen.earned : c.type === 'floor' ? S.dun.max : S.mine.max; }
function goalText(c) {
  const g = chGoal(c);
  return c.type === 'gold' ? L`اكسب ${fmt(g)} ذهب` : c.type === 'floor' ? L`وصّل الطابق ${g} في الزنزانة` : L`انزل للطابق ${g} في المنجم`;
}
function checkChallenge() {
  const id = S.gen.ch; if (!id || S.gen.chDone) return;
  const c = CHALLENGES.find(x => x.id === id);
  if (chValue(c) >= chGoal(c)) {
    S.gen.chDone = true; S.leg.ch[id] = CC(id) + 1;
    log(L`🏆 أنجزت تحدي «${c.n}» (مستوى ${CC(id)})! مكافأة دائمة: ${c.rew(1)}`, 'season');
    if (!offline) toast(L`🏆 أنجزت تحدي ${c.n}!`);
  }
}
function checkAch() {
  if (!S || !S.started) return;
  for (const a of ACH) {
    if (!S.leg.ach[a.id] && a.fn()) {
      S.leg.ach[a.id] = 1;
      log(L`🏅 إنجاز جديد: ${a.e} ${a.n} (+1% ذهب وخبرة)`, 'good');
      toast(L`🏅 إنجاز: ${a.n}`);
    }
  }
}

/* ---------------- التقاعد ---------------- */
// The retirement goal grows after generation 3, so strong legacy perks can't turn a generation into a few minutes.
// Retire gold goal: 1M up to gen 3, then ×1.7 a generation up to gen 10, ×1.3 up to gen 20 and ×1.1 after that.
function goldGoal() {
  const G = S.leg.gen; if (G <= 3) return 1e6;
  let v = 1e6; for (let k = 4; k <= G; k++) v *= k <= 10 ? 1.7 : k <= 20 ? 1.3 : 1.1;
  const d = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / d) * d;
}
// The dungeon goal also sits at least 15 floors above where this generation started (the «Battle memory» perk starts you deep).
function dunGoal() { return Math.max(30 + 3 * Math.max(0, S.leg.gen - 3), (S.gen.dun0 || 1) + 15); }
function canRetire() { return S.gen.earned >= goldGoal() && S.dun.max >= dunGoal(); }
// Dungeon stars only count floors climbed this generation, not the free start floor.
// Stars per retirement have a cap that grows every 5 generations, and the mine gives at most 200 of them.
const MINE_STAR_CAP = 200;
function starCapBase() { const g = S.leg.gen; return g <= 5 ? 300 : g <= 10 ? 500 : g <= 15 ? 800 : g <= 20 ? 1200 : 1800; }
// «Wisdom of Generations» raises the per-generation star cap by the same % it adds to the stars (the mine part keeps its own cap).
function starCap() { return Math.round(starCapBase() * (1 + 0.1 * P('t_stars'))); }
function starParts() {
  const m = starMult();
  return { gold: 3 * Math.sqrt(S.gen.earned / 1e6) * m, dun: Math.max(0, S.dun.max - Math.max(10, S.gen.dun0 || 1)) / 3 * m,
    mine: Math.min(MINE_STAR_CAP, Math.max(0, S.mine.max - 20) / 10 * m) };
}
function starsBase() { const p = starParts(); return (p.gold + p.dun + p.mine) / starMult(); }
function starsGain() { const p = starParts(); return Math.min(starCap(), Math.floor(p.gold + p.dun + p.mine)); }
function perkCost(p, l) { return Math.ceil(p.cost * Math.pow(p.mult, l)); }
const KS_NEED = 10;
function branchLv(b) { return PERKS.filter(p => p.b === b && !p.ks).reduce((n, p) => n + P(p.id), 0); }
// Why a perk can't be learned yet ('' = open). Perks already owned always stay open.
function perkLock(p) {
  if (P(p.id)) return '';
  if (p.ks) { const n = branchLv(p.b); return n >= KS_NEED ? '' : L`اصرف ${KS_NEED} مستويات في هذا الفرع (${n}/${KS_NEED})`; }
  if (p.req && P(p.req[0]) < p.req[1]) return L`يتطلب ${PERKS.find(x => x.id === p.req[0]).n} مستوى ${p.req[1]}`;
  return '';
}
function perkTier(p) { let t = 0, q = p; while (q.req) { t++; q = PERKS.find(x => x.id === q.req[0]); } return t; }
const START_GRACE = 2; // days
function startNow() { return S.leg.gen > 1 && S.gen.days < START_GRACE; }
function applyStartNow(id, l) {
  const nw = inCh('noworkers');
  if (id === 't_gold') S.gold += startGold(l) - startGold(l - 1);
  else if (id === 'f_plots') for (let i = 0; i < 2; i++) S.farm.plots.push({ c: null, p: 0, w: false });
  else if (id === 'r_start' && !noFarm()) { S.barn.n.chicken = (S.barn.n.chicken || 0) + 2; if (S.barn.h.chicken === undefined) S.barn.h.chicken = 100; }
  else if (id === 'm_miners' && !nw) S.mine.miners += 2;
  else if (id === 'q_workers' && !nw) {
    const add = [[], ['harvester', 'planter'], ['bin', 'sprinkler'], ['rancher', 'zoning']][l] || [];
    for (const k of add) S.bld[k] = Math.max(S.bld[k] || 0, BUILDINGS.find(b => b.id === k).cover ? 3 : 1);
  }
  else if (id === 'q_hearts') for (const n of NPCS) { const st = S.npc[n.id] || (S.npc[n.id] = { pts: 0, gd: 0 }); st.pts = Math.max(st.pts, heartStart()); }
  else if (id === 'w_floor') {
    let f = Math.max(1, Math.floor(S.leg.best.dun * 0.1 * l)); if (S.leg.gen < 4) f = Math.min(f, 100);
    if (f > S.dun.max) S.dun.max = f;
    if (f > S.dun.floor) S.dun.floor = f;
    S.gen.dun0 = Math.max(S.gen.dun0 || 1, f);
  }
  else if (id === 'q_tools' && S.gen.prevTools) for (const t in S.tools) S.tools[t] = Math.min(6, Math.max(S.tools[t], (S.gen.prevTools[t] || 0) - 1));
}
function perkSpent() { let n = 0; for (const p of PERKS) for (let l = 0; l < P(p.id); l++) n += perkCost(p, l); return n; }
function heartStart() { return Math.min(1000, 250 + 100 * P('q_hearts') + 50 * H('ring')); }
function childName() { const g = S.leg.gen + 1; return `${S.leg.family || S.name} ${ORD[g] || g}`; }
function applyGenStart(oldTools) {
  const LG = S.leg, nw = inCh('noworkers');
  S.gold = 50 + startGold(P('t_gold'));
  for (let i = 0; i < 2 * P('f_plots'); i++) S.farm.plots.push({ c: null, p: 0, w: false });
  for (const t of ['hoe', 'can', 'pick', 'sword', 'armor', 'rod', 'crook', 'glove', 'helmet', 'shield', 'amulet', 'boots']) S.tools[t] = Math.min(6, Math.max(H(t), P('q_tools') && oldTools ? (oldTools[t] || 0) - 1 : 0));
  if (!noFarm()) {
    if (P('r_start')) { S.barn.n.chicken = 2 * P('r_start'); S.barn.h.chicken = 100; }
    if (H('cow')) { S.barn.n.cow = H('cow'); S.barn.h.cow = 100; }
  }
  if (!nw) {
    S.mine.miners = 2 * P('m_miners');
    const q = P('q_workers');
    if (q >= 1) { S.bld.harvester = 3; S.bld.planter = 3; }
    if (q >= 2) { S.bld.bin = 1; S.bld.sprinkler = 3; }
    if (q >= 3) { S.bld.rancher = 1; S.bld.zoning = 1; }
  }
  let f = Math.max(1, Math.floor(LG.best.dun * 0.1 * P('w_floor')));
  if (LG.gen < 4) f = Math.min(f, 100);
  S.dun.floor = S.dun.max = f; S.gen.dun0 = f;
  for (const n of NPCS) S.npc[n.id] = { pts: heartStart(), gd: 0 };
  if (inCh('winter')) { S.season = 3; S.weather = 'snow'; }
}
let RS = null;
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function openRetire() {
  if (!canRetire()) return;
  const pool = HEIRLOOMS.filter(x => H(x.id) < x.max).sort(() => Math.random() - 0.5);
  const opts = pool.slice(0, 3 + P('q_heirs')).map(x => x.id);
  RS = { opts, heir: opts[0] || null, ch: null, name: childName(), gender: S.gender || 'm' };
  showRetire();
}
function showRetire() {
  const LG = S.leg, gain = starsGain(), hb = heartStart() / 100;
  openModal(L`<h2>🌅 التقاعد وتسليم المزرعة</h2>
  <div class="retirestar">${icon("legacy-crown",48)} +${fmt(gain)} <small>نجمة إرث</small></div>
  <p class="hint">❌ يروح: الذهب والمخزن والأحواض والحيوانات والأدوات والمباني والمستويات.<br>
  ✅ يبقى: النجوم وشجرة الإرث وقطع الإرث والإنجازات والإحصائيات، وأهل القرية يبدؤون معك من ${hb} قلوب لأنهم يذكرون عائلتك.</p>
  <h3>🏺 اختر قطعة إرث (تبقى في العائلة للأبد)</h3>
  ${RS.opts.length ? `<div class="heirpick">${RS.opts.map(id => {
    const x = HEIRLOOMS.find(h => h.id === id), l = H(id);
    return `<button class="hp ${RS.heir === id ? 'sel' : ''}" data-a="rsHeir" data-v="${id}"><span class="big">${icon('heir-' + x.id,48)}</span><b>${x.n}</b><small>${l ? L`تطوير: مستوى ${l} ← ${l + 1}` : L('قطعة جديدة')}</small><small>${x.eff(l + 1)}</small></button>`;
  }).join('')}</div>` : L('<p class="hint">كل قطع الإرث وصلت أعلى مستوى!</p>')}
  ${LG.gen >= 5 ? L`<h3>🏆 تحدي الجيل القادم (اختياري)</h3><div class="heirpick">
    <button class="hp ${!RS.ch ? 'sel' : ''}" data-a="rsCh" data-v="none"><span class="big">🌿</span><b>بدون تحدي</b><small>جيل عادي</small></button>
    ${CHALLENGES.map(c => L`<button class="hp ${RS.ch === c.id ? 'sel' : ''}" data-a="rsCh" data-v="${c.id}"><span class="big">${icon('challenge-' + c.id,48)}</span><b>${c.n} • مستوى ${CC(c.id) + 1}</b><small>${c.rule}</small><small>🎯 ${goalText(c)}</small><small>🎁 ${c.rew(1)} للأبد</small></button>`).join('')}
  </div>` : L('<p class="hint">🏆 تحديات الأجيال تنفتح لما تتقاعد من الجيل الخامس.</p>')}
  <h3>👶 من يستلم المزرعة؟</h3><div class="row genderpick">${['m', 'f'].map(g => `<button class="btn ${RS.gender === g ? 'gold' : 'ghost'} sm" data-a="rsGender" data-v="${g}">${GENDER[g].e} ${GENDER[g].child}</button>`).join('')}</div>
  <label><b>اسم ${GENDER[RS.gender].child === L('ابن') ? L('الابن') : L('الابنة')}</b></label><input id="childIn" maxlength="24" value="${esc(RS.name)}">
  <div class="row"><button class="btn gold" data-a="retireGo" style="flex:1">🌅 سلّم المزرعة وابدأ الجيل ${LG.gen + 1}</button><button class="btn ghost" data-a="closeModal">إلغاء</button></div>`);
  setTimeout(() => { const i = $('childIn'); if (i) i.oninput = () => { RS.name = i.value; }; }, 30);
}
function doRetire() {
  if (!RS || !canRetire()) return;
  const LG = S.leg, gain = starsGain();
  const old = { name: S.name, days: S.gen.days, earned: S.gen.earned, dun: S.dun.max, mine: S.mine.max, ch: S.gen.ch, chDone: S.gen.chDone,
    friend: NPCS.reduce((b, n) => ((S.npc[n.id] || {}).pts || 0) > ((S.npc[b.id] || {}).pts || 0) ? n : b, NPCS[0]), spouse: S.spouse };
  LG.best.dun = Math.max(LG.best.dun, S.dun.max); LG.best.mine = Math.max(LG.best.mine, S.mine.max);
  LG.stars += gain; LG.totalStars += gain;
  LG.history.push({ gen: LG.gen, name: S.name, earned: S.gen.earned, dun: S.dun.max, stars: gain });
  const heir = RS.heir ? HEIRLOOMS.find(x => x.id === RS.heir) : null;
  if (heir) LG.heir[heir.id] = H(heir.id) + 1;
  LG.gen++;
  const keep = { leg: LG, stats: S.stats, locked: S.locked, wk: S.wk }, oldTools = { ...S.tools };
  for (const t in oldTools) if (oldTools[t] >= 6 && lgv(t)) oldTools[t] = 7; // a legendary tool counts one tier above adamantite, so «Tool legacy» keeps it adamantite
  let nm = (RS.name || '').trim().slice(0, 24) || childName();
  if (badName(nm)) nm = childName();
  S = newState(); Object.assign(S, keep);
  for (const o of [...ORES.filter(x => !x.sale).map(x => x.id), 'gem']) S.locked[o] = 1; // ores start locked again every generation
  S.name = nm; S.gender = RS.gender; S.started = true; S.gen.ch = RS.ch; S.gen.prevTools = oldTools;
  applyGenStart(oldTools); fillBoard();
  S.last = Date.now(); logs = []; logDirty = true; zoneMode = false; lastSig = ''; tab = 'farm';
  log(L`🌱 بدأ الجيل ${LG.gen}: ${S.name} ${gv(L('يستلم'), L('تستلم'))} مزرعة العائلة`, 'season');
  if (S.gen.ch) { const c = CHALLENGES.find(x => x.id === S.gen.ch); log(L`🏆 تحدي هذا الجيل: ${c.e} ${c.n} — ${goalText(c)}`, 'season'); }
  save(); RS = null;
  if (!(typeof CLOUD !== 'undefined' && CLOUD.user)) log(L('💾 جيل جديد! وقت مناسب تنزّل نسخة من حفظك من «المزيد»'), 'new');
  showLetter(old, gain, heir);
}
function showLetter(o, gain, heir) {
  const g = S.leg.gen;
  const unlock = { 2: L('🎣 انفتحت <b>البحيرة</b>! تقدر تصطاد سمك الحين.'), 3: L('🌟 انفتحت <b>المحاصيل النادرة</b> في المزرعة!'),
    4: L('🕳️ انفتحت <b>الأعماق المنسية</b>: الزنزانة تكمل بعد الطابق 100!'), 5: L('💍 صار <b>الزواج</b> و🤝 <b>صداقة العمر</b> متاحين، و<b>تحديات الأجيال</b> تنفتح عند تقاعدك القادم!') }[g] || '';
  const c = o.ch && CHALLENGES.find(x => x.id === o.ch);
  openModal(L`<h2>✉️ رسالة من ${esc(o.name)}</h2>
  <div class="letter"><p>يا ${esc(S.name)}،</p>
  <p>عشت في وادي الصدى ${o.days} يوماً. كسبت ${fmt(o.earned)} ذهب، ونزلت إلى الطابق ${o.dun} في الزنزانة والطابق ${o.mine} في المنجم.</p>
  ${heir ? L`<p>تركت لك ${icon("heir-" + heir.id)} <b>${heir.n}</b>. ${gv(L('حافظ'), L('حافظي'))} عليها، فهي تنتقل في عائلتنا من جيل إلى جيل.</p>` : ''}
  <p>${o.spouse ? (NPC_BY[o.spouse].g === 'f' ? L`أمك ${NPC_BY[o.spouse].n} كانت سندي طول عمري. ` : L`أبوك ${NPC_BY[o.spouse].n} كان سندي طول عمري. `) : ''}أهل القرية يذكرونني بخير، و${o.friend.n} بالذات كان أقرب الناس لي. ${gv(L('لن تبدأ'), L('لن تبدئي'))} معهم من الصفر.</p>
  ${c ? `<p>${o.chDone ? L`وأنهيت تحدي «${c.n}» بنجاح، والعائلة كلها تفتخر بذلك.` : L`حاولت تحدي «${c.n}» ولم أكمله... ربما ${gv(L('تكمله'), L('تكمليه'))} ${gv(L('أنت'), L('أنتِ'))} يوماً.`}</p>` : ''}
  <p>المزرعة الآن لك. ${gv(L('اكتب'), L('اكتبي'))} قصتك.</p>
  <p style="text-align:left">— ${esc(o.name)}، الجيل ${g - 1}</p></div>
  <p>${icon("legacy-crown",24)} <b>+${fmt(gain)}</b> نجمة إرث — صرفها في ${icon("legacy-tree",24)} شجرة الإرث.</p>
  ${unlock ? `<p class="unlock">${unlock}</p>` : ''}
  <button class="btn gold" data-a="closeModal" style="width:100%">🌱 ابدأ الجيل ${g}</button>`);
}
function simulate(total, step = 1) {
  while (total > 0) { const st = Math.min(step, total); tick(st); total -= st; }
}

/* ---------------- الأوامر ---------------- */
const A = {
  tab: v => {
    if (!tabOpen(v)) return toast(L`🔒 «${tabName(v)}» يفتح لما: ${TAB_UNLOCK[v].why}`);
    if (v === 'util' && !indPt('util')) return toast(L('🔒 «الخدمات» تنفتح باختراع «الخدمات العامة» من تبويب الاختراعات'));
    if ((S.unl || {})[v] === 2) S.unl[v] = 1;
    tab = v; lastSig = ''; if (v === 'guild') S.leg.eggNew = 0; const y = $('wrap').getBoundingClientRect().top + scrollY - $('tabs').offsetHeight - 16; if (scrollY > y) scrollTo(0, Math.max(0, y)); },
  seed: v => { S.farm.seed = v; },
  plot: v => {
    const i = +v, p = S.farm.plots[i];
    if (zoneMode) { p.a = p.a === S.farm.seed ? null : S.farm.seed; return; }
    if (!p.c) { if (!plant(i)) toast(cropUnlocked(CROP[S.farm.seed]) ? L('ما عندك ذهب كافي للبذرة') : L('البذرة مقفلة')); }
    else if (isReady(p)) harvest(i);
    else if (!water(i)) toast(L('الحوض مسقي بالفعل 💧'));
  },
  plantAll: () => {
    let n = 0; S.farm.plots.forEach((p, i) => { if (plant(i)) n++; });
    toast(n ? L`زرعت ${n} حوض` : L('لا توجد أحواض فارغة أو الذهب غير كافٍ'));
  },
  waterAll: () => { let n = 0; S.farm.plots.forEach((p, i) => { if (water(i)) n++; }); toast(n ? L`سقيت ${n} حوض 💧` : L('كل شيء مسقي')); },
  harvestAll: () => { let n = 0; S.farm.plots.forEach((p, i) => { if (harvest(i)) n++; }); toast(n ? L`حصدت ${n} محصول 🧺` : L('لا يوجد محصول جاهز')); },
  buyPlot: () => {
    const c = plotCost();
    if (S.gold < c || S.farm.plots.length >= MAX_PLOTS) return;
    S.gold -= c; S.farm.plots.push({ c: null, p: 0, w: false }); log(L('🟫 أضفت حوضاً جديداً للمزرعة'));
  },
  buyAnimal: v => {
    const a = ANIMALS.find(x => x.id === v), c = animalCost(a), n = S.barn.n[v] || 0;
    if (noFarm()) return toast(L('🚫 ممنوع في تحدي هذا الجيل'));
    if (S.skills.ranch.l < a.lvl || n >= barnCap() || S.gold < c) return;
    S.gold -= c; S.barn.n[v] = n + 1; if (S.barn.h[v] === undefined) S.barn.h[v] = 100;
    log(L`${a.e} اشتريت ${a.n}! (${n + 1})`);
  },
  buyAnimalAsk: v => {
    const a = ANIMALS.find(x => x.id === v); if (!a) return;
    const n = S.barn.n[v] || 0, room = Math.max(0, barnCap() - n), mx = animalMaxBuy(a);
    openModal(L`<h2>${a.e} شراء ${a.n}</h2><p class="hint">عندك ${n}، والمكان يكفي ${room} زيادة. كل واحد أغلى شوي من اللي قبله. تقدر تشتري لين ${mx} بذهبك الحين.</p>
      <input id="buyAnN" class="txt" type="number" inputmode="numeric" min="1" max="${room}" value="${Math.max(1, mx)}" style="width:100%;font-size:18px;padding:10px;margin:8px 0 6px"
        oninput="animalBuyCalc('${v}')" onkeydown="if(event.key==='Enter')A.buyAnimalN('${v}')">
      <p id="buyAnT" class="hint" style="margin:0 0 12px"></p>
      <div class="row"><button class="btn gold" data-a="buyAnimalN" data-v="${v}" style="flex:1">شراء ✔</button><button class="btn ghost" data-a="buyAnimalMax" data-v="${v}">الأقصى (${mx})</button><button class="btn ghost" data-a="closeModal">إلغاء</button></div>`);
    animalBuyCalc(v); setTimeout(() => { const i = $('buyAnN'); if (i) { i.focus(); i.select(); } }, 50);
  },
  buyAnimalMax: v => { const i = $('buyAnN'), a = ANIMALS.find(x => x.id === v); if (i && a) { i.value = animalMaxBuy(a); animalBuyCalc(v); } },
  buyAnimalN: v => {
    const a = ANIMALS.find(x => x.id === v), i = $('buyAnN'); if (!a || !i) return;
    if (noFarm()) return toast(L('🚫 ممنوع في تحدي هذا الجيل'));
    const n = S.barn.n[v] || 0, k = Math.min(Math.max(0, Math.floor(+i.value || 0)), Math.max(0, barnCap() - n));
    if (!k || S.skills.ranch.l < a.lvl) return;
    const c = animalCostN(a, k); if (S.gold < c) return toast(L`ما عندك ذهب كافي (تحتاج ${fmt(c)}💰)`);
    S.gold -= c; S.barn.n[v] = n + k; if (S.barn.h[v] === undefined) S.barn.h[v] = 100;
    log(L`${a.e} اشتريت ${k} ${a.n} بـ${fmt(c)}💰 (صار عندك ${n + k})`); closeModal(); lastSig = '';
  },
  breed: v => {
    const [id, to] = v.split(':'), a = ANIMALS.find(x => x.id === id);
    if (!a || !GRADE[to] || !BREEDABLE.includes(id) || breedBlock(a, to)) return;
    if (noFarm()) return toast(L('🚫 ممنوع في تحدي هذا الجيل'));
    const win = breedRoll(id, to);
    if (typeof breedVisual === 'function') breedVisual(a, to, win);
  },
  buyHouse: () => {
    if (houseCount() >= HOUSE_MAX) return;
    const c = houseCost(); if (S.gold < c) return;
    S.gold -= c; S.barn.houses = houseCount() + 1;
    log(L`🏠 بنيت بيت تهجين جديد (${houseCount()}/${HOUSE_MAX})`);
  },
  pet: v => { S.barn.h[v] = Math.min(100, (S.barn.h[v] ?? 100) + 25); toast(L('❤️ الحيوانات سعيدة')); },
  dig: () => { dig(mineMult()); },
  cast: () => { fish(fishPower()); },
  spot: v => { const s = SPOTS.find(x => x.id === v); if (s && S.skills.fish.l >= s.lvl) { S.lake.spot = v; S.lake.prog = 0; } },
  bait: v => { if (makeBait(v)) log(L`🪱 جهّزت طُعم من ${ITEMS[v].e} ${ITEMS[v].n}: +${BAIT_USES} صيدة`); },
  autoBait: () => { S.lake.autoBait = !S.lake.autoBait; },
  hireFisher: () => { if (inCh('noworkers')) return toast(L('🚫 ممنوع في تحدي بدون عمال')); const c = fisherCost(); if (S.gold < c || S.lake.fishers >= VILLAGE_WMAX) return; S.gold -= c; S.lake.fishers++; log(L`🎣 وظّفت صياداً (${S.lake.fishers})`); },
  hireMiner: () => { if (inCh('noworkers')) return toast(L('🚫 ممنوع في تحدي بدون عمال')); const c = minerCost(); if (S.gold < c || S.mine.miners >= VILLAGE_WMAX) return; S.gold -= c; S.mine.miners++; log(L`👷 وظّفت عامل منجم (${S.mine.miners})`); },
  mineUp: () => { if (S.mine.depth > 1) { S.mine.depth--; S.mine.prog = 0; } },
  mineDown: () => { if (S.mine.depth < S.mine.max) { S.mine.depth++; S.mine.prog = 0; } },
  mineDeep: () => { S.mine.depth = S.mine.max; S.mine.prog = 0; },
  mineTo: v => { const f = Math.floor(+v); if (f >= 1 && f <= S.mine.max) { S.mine.depth = f; S.mine.prog = 0; } },
  dunToggle: () => {
    const D = S.dun; D.active = !D.active;
    if (D.active) { D.resting = S.hero.hp < heroMaxHp() * 0.2; D.enemy = null; log(L`🗡️ دخلت الزنزانة — الطابق ${D.floor}`); }
    else { D.enemy = null; D.kills = 0; log(L('🏃 انسحبت من الزنزانة')); }
  },
  dunAuto: () => { S.dun.auto = !S.dun.auto; },
  donate: v => {
    let n = 0;
    while ((v === 'all' ? n < 200 : n < 1) && S.gold >= donCost()) { S.gold -= donCost(); S.leg.don = donLv() + 1; n++; }
    if (n) log(L`🏛️ تبرعت لصندوق القرية: صار المستوى ${donLv()} (+${donLv()}% لكل الإنتاج)`, 'good');
  },
  buyOre: v => {
    const [id, n] = String(v).split(':'), c = ORE_SHOP[id] * +n;
    if (!ORE_SHOP[id] || !(+n > 0) || S.gold < c) return;
    S.gold -= c; give(id, +n); toast(L`🧳 اشتريت ${n} ${ITEMS[id].n}`);
  },
  breedFocus: v => {
    if (houseCount() < HOUSE_MAX) return;
    S.barn.focus = v && ANIMALS.some(a => a.id === v) ? v : null;
    const a = ANIMALS.find(x => x.id === S.barn.focus);
    log(a ? L`🎯 التهجين التلقائي يركز على ${a.n}` : L('⏹️ وقفت التهجين التلقائي'));
  },
  donor: () => {
    if (donorOn() || S.gold < DONOR_COST) return;
    S.gold -= DONOR_COST; S.donor = seasonKey();
    log(L('🤝 صرت المتبرع هالموسم: أهل القرية ما يزعلون لين يخلص الموسم'), 'good');
  },
  donorAuto: () => { S.leg.donorAuto = !S.leg.donorAuto; autoDonor(); },
  dunEat: () => { S.dun.autoEat = !S.dun.autoEat; },
  // The deepest opened floor the hero handles well right now («fits» in the difficulty tag). Only opened floors,
  // so the guild rank limit doesn't matter here.
  floorFit: () => {
    const D = S.dun; let f = D.max;
    while (f > 1 && assess(f).r < 0.8) f--;
    if (f !== D.floor) { D.floor = f; D.kills = 0; D.enemy = null; }
    toast(L`⚖️ الطابق ${f} يناسب قوتك`);
  },
  floor: v => { const D = S.dun; const f = clamp(D.floor + (+v), 1, D.max); if (f !== D.floor) { D.floor = f; D.kills = 0; D.enemy = null; } },
  unlockGo: v => { closeModal(); A.tab(v); },
  titlePick: v => { const T = titleData(); if (T.have[v] || !TITLES.some(t => t.id === v)) return; T.cur = v; lastSig = ''; },
  // Turn a title on next to your name: into a free unicorn slot if there is one, otherwise it replaces the main title.
  titleShow: v => {
    const T = titleData(); if (!T.have[v] || titleActive().includes(v)) return;
    if (T.show && T.have[T.show] && saddled('unicorn') && titleSide().length < 2) T.side.push(v); else T.show = v;
    lastSig = '';
  },
  titleDrop: v => { const T = titleData(); T.side = titleSide().filter(x => x !== v); lastSig = ''; },
  saddleMake: () => {
    if (S.leg.saddle || S.gold < SADDLE_COST || !Object.keys(petData().pets).length) return;
    S.gold -= SADDLE_COST; const first = PETS.find(p => S.leg.pets[p.id]);
    S.leg.saddle = { on: first.id };
    log(L('🏇 صنعت سرج أسطوري! حطه على واحد من حيواناتك ويصحى له مهارة ثانية. السرج للعائلة كل الأجيال.'), 'golden');
  },
  saddleOn: v => {
    const sd = S.leg.saddle; if (!sd || !(S.leg.pets || {})[v] || sd.on === v) return;
    sd.on = v; const P0 = PETS.find(p => p.id === v); toast(L`🏇 حطيت السرج على ${P0.n}`); lastSig = '';
  },
  floorMax: () => { S.dun.floor = S.dun.max; S.dun.kills = 0; S.dun.enemy = null; },
  // Jump to any open floor by number (e.g. back to floor 1 to clear easy floors fast).
  floorGo: () => {
    openModal(L`<h2>🔢 روح لطابق</h2><p class="hint">اكتب رقم أي طابق من 1 لين ${S.dun.max}.</p>
      <input id="floorGoIn" class="txt" type="number" inputmode="numeric" min="1" max="${S.dun.max}" value="${S.dun.floor}" style="width:100%;font-size:18px;padding:10px;margin:8px 0 14px"
        onkeydown="if(event.key==='Enter')A.floorGoOk()">
      <div class="row"><button class="btn gold" data-a="floorGoOk" style="flex:1">روح ✔</button><button class="btn ghost" data-a="closeModal">إلغاء</button></div>`);
    setTimeout(() => { const i = $('floorGoIn'); if (i) { i.focus(); i.select(); } }, 50);
  },
  floorGoOk: () => {
    const i = $('floorGoIn'), n = Math.floor(+(i && i.value)); if (!n) return;
    const D = S.dun, f = clamp(n, 1, D.max);
    if (f !== D.floor) { D.floor = f; D.kills = 0; D.enemy = null; }
    closeModal(); lastSig = ''; toast(L`🔢 رحت للطابق ${f}`);
  },
  eatNow: () => {
    const r = eat();
    if (r === 'none') toast(L('ما عندك طعام غير مقفل'));
    else if (r === 'cd') toast(L`⏳ تقدر تاكل بعد ${Math.ceil(S.dun.eatCd)}ث`);
    else if (r === 'full') toast(L('❤️ صحتك كاملة'));
  },
  mskUp: v => {
    const k = MSK.find(x => x.id === v), l = gsk(v); if (!k || l >= 5 || mskPts() < l + 1) return;
    (S.guild.sk || (S.guild.sk = {}))[v] = l + 1;
    log(L`🌟 طوّرت مهارة ${k.e} ${k.n} للمستوى ${l + 1}`, 'good');
  },
  // Mastery: one level, or every level the points allow (v = 'all').
  mastUp: v => {
    if (!mastOpen()) return;
    const n = v === 'all' ? Math.floor(mskPts() / MAST_COST) : mskPts() >= MAST_COST ? 1 : 0; if (n <= 0) return;
    const sk = S.guild.sk || (S.guild.sk = {}); sk.mast = (sk.mast || 0) + n;
    log(L`🌟 إتقان المرتزق صار مستوى ${sk.mast}: +${pctTxt(MAST_STEP * sk.mast)} هجوم ودفاع وفرصة المواد`, 'good');
  },
  quest: v => {
    const g = S.guild, i = g.board.findIndex(q => q.id === +v); if (i < 0) return;
    const q = g.board[i];
    if (q.type === 'deliver') {
      if (!take(q.item, q.qty)) return toast(L('ما عندك الكمية المطلوبة'));
      const m = questMult(); addGold(Math.round(q.gold * m)); g.gp += qGp(q); S.stats.quests++;
      log(L`📬 سلّمت ${q.qty} ${ITEMS[q.item].e} ${ITEMS[q.item].n}: 💰 ${bi('+' + fmt(q.gold * m))} • ${bi('+' + qGp(q))} نقاط`, 'good');
    } else {
      if (g.active.length >= questSlots()) return toast(L('كل الخانات مشغولة'));
      g.active.push({ ...q, dur: qDur(q), t: 0, chance: chanceOf(q) });
      log(L`📜 بدأت مهمة «${Lx(q.n)}»`);
    }
    g.board.splice(i, 1); g.boardT = 0;
  },
  refreshBoard: () => {
    const c = refreshCost(); if (S.gold < c || S.guild.refCd > 0) return;
    S.gold -= c; S.guild.board = []; S.guild.refCd = refreshCd(); fillBoard();
  },
  upgrade: v => {
    const l = (S.tools[v] || 0) + 1; if (l > 6 || !TOOLS.some(x => x.id === v)) return;
    const c = toolCost(l);
    if (S.gold < c.gold || have(c.ore) < c.qty) return;
    S.gold -= c.gold; take(c.ore, c.qty); S.tools[v] = l;
    const t = TOOLS.find(x => x.id === v);
    log(L`🔨 الحداد قاسم طوّر ${t.n} إلى ${TIER[l]}!`, 'good');
  },
  forge: v => {
    const t = TOOLS.find(x => x.id === v); if (!t || (S.tools[v] || 0) < 6 || !lgCanPay(v)) return;
    const old = lgv(v);
    if (old >= 60 && !confirm(L`عندك ${LEG_TOOLS[v]} بقوة +${old}%. الصياغة الجديدة تستبدلها حتى لو طلعت أقل. أكيد؟`)) return;
    const r = lgDo(v), k = LEG_RAR[lgTier(r)];
    log(L`⚒️ الحداد قاسم صاغ ${LEG_TOOLS[v]}: +${r}% قوة (${k.n})`, lgTier(r) >= 2 ? 'golden' : 'good');
    toast(L`✨ ${LEG_TOOLS[v]}: +${r}% (${k.n})`);
  },
  afBuy: () => {
    if (S.leg.afOwn || S.gold < AF_COST) return;
    S.gold -= AF_COST; S.leg.afOwn = 1;
    log(L('🤖 اشتريت الصياغة التلقائية من قاسم! تبقى للعائلة كل الأجيال.'), 'golden');
  },
  afStart: () => {
    if (!S.leg.afOwn || S.af) return;
    const ts = afTools(), t = ts.find(x => x.id === AF_UI.t) || ts[0];
    if (!t) return toast(L('❌ ما عندك أداة أدامانتيت للصياغة'));
    const goal = Math.round(+AF_UI.goal);
    if (!(goal >= 5 && goal <= 100)) return toast(L('❌ اكتب نسبة من 5 إلى 100'));
    if (lgv(t.id) >= goal) return toast(L`✅ ${LEG_TOOLS[t.id]} أصلاً +${lgv(t.id)}%`);
    if (!lgCanPay(t.id)) return toast(L('❌ ما عندك خامات تكفي محاولة وحدة'));
    S.af = { t: t.id, goal, n: 0, acc: 1 };
  },
  afStop: () => { const j = afStop(); if (j) toast(L`⏹️ وقفت الصياغة التلقائية بعد ${fmt(j.n)} محاولة`); },
  sell1: v => { sellItem(v, 1); },
  // Sell the amount typed next to the item (more than you have sells everything).
  sellN: v => { const n = Math.floor(+(MK_Q[v] || 1)); if (!(n > 0)) return toast(L('❌ اكتب كمية صحيحة')); const g = sellItem(v, n); if (g) toast(`+${fmt(g)}💰`); },
  sellAll: v => { const g = sellItem(v, have(v)); if (g) toast(`+${fmt(g)}💰`); },
  shipAll: () => { const g = shipAll(false); if (!g) toast(L('لا يوجد ما يُباع (أو كله مقفل)')); },
  lock: v => { if (S.locked[v]) delete S.locked[v]; else S.locked[v] = 1; },
  kingGift: v => {
    const np = NPC_BY[v], kid = KING_GIFT[v]; if (!np || !kid) return;
    const st = S.npc[v] || (S.npc[v] = { pts: 0, gd: 0 });
    if (st.kk === seasonKey() || st.pts >= 1000 || !take(kid)) return;
    const before = hearts(v);
    st.pts = Math.min(1000, st.pts + 500); st.kk = seasonKey(); st.cd = dayAbs();
    log(L`👑 أهديت ${np.n} ${ITEMS[kid].e} ${ITEMS[kid].n}! «ما أصدق! هذي أغلى هدية جتني» +5 قلوب`, 'golden');
    if (hearts(v) > before) log(L`❤️ علاقتك مع ${np.n} صارت ${hearts(v)} قلوب!`, 'good');
  },
  gift: v => {
    const [nid, item] = v.split(':'); const np = NPC_BY[nid];
    const st = S.npc[nid] || (S.npc[nid] = { pts: 0, gd: 0 });
    const gf = giftsOf(np);
    if (st.gd === dayAbs() || st.pts >= 1000 || ![gf.love, gf.like].includes(item) || !take(item)) return;
    const before = hearts(nid), loved = item === gf.love;
    st.pts = Math.min(1000, st.pts + (loved ? 100 : 50)); st.gd = st.cd = dayAbs();
    log(L`🎁 أهديت ${np.n} ${ITEMS[item].e} — ${loved ? L('«واااو! هذا أكثر شيء أحبه!» +1 قلب') : L('«شكراً، لطيف منك» +½ قلب')}`);
    if (hearts(nid) > before) log(L`❤️ علاقتك مع ${np.n} صارت ${hearts(nid)} قلوب!`, 'good');
  },
  build: v => {
    if (inCh('noworkers') && TOGGLES[v]) return toast(L('🚫 ممنوع في تحدي بدون عمال'));
    const b = BUILDINGS.find(x => x.id === v), l = S.bld[v] || 0, c = bCost(b);
    if (l >= (b.max || 1) || S.gold < c || (b.req && !S.bld[b.req])) return;
    S.gold -= c; S.bld[v] = l + 1; log(L`🏗️ تم بناء/توظيف: ${b.e} ${b.n}`, 'good');
  },
  toggleAuto: v => { if (S.off[v]) delete S.off[v]; else S.off[v] = 1; toast(`${TOGGLES[v]}: ${on(v) ? L('يعمل 🟢') : L('متوقف ⏸️')}`); },
  allAuto: v => { for (const k in TOGGLES) { if (v === 'off') S.off[k] = 1; else delete S.off[k]; } toast(v === 'off' ? L('⏸️ أوقفت كل الأشياء التلقائية') : L('🟢 شغّلت كل الأشياء التلقائية')); },
  zoneMode: () => { zoneMode = !zoneMode; },
  zoneAll: () => { S.farm.plots.forEach(p => { p.a = S.farm.seed; }); },
  zoneClear: () => { S.farm.plots.forEach(p => { p.a = null; }); },
  lang: v => {
    if (!v) return openModal(`${langPick()}<div class="row"><button class="btn ghost" data-a="closeLang">✖</button></div>`);
    if (v !== LANG) setLang(v);
    else if ($('mbox').querySelector('[data-a="closeLang"]')) closeModal(); // never close the intro
  },
  closeLang: () => closeModal(),
  closeBox: () => closeModal(),
  npcInfo: v => {
    const np = NPC_BY[v]; if (!np) return;
    const hr = Math.floor(((S.npc[v] || {}).pts || 0) / 100);
    openModal(`<div class="npc-story">${ART['npc-' + v + '-0'] ? icon('npc-' + v + '-' + Math.min(2, Math.floor(hr / 4)), 112) : `<span class="tool-emoji npc-emoji">${np.e}</span>`}<div><h2>${np.n}</h2><small class="hint">${np.role}</small></div></div><p class="npc-story-text">${np.story}</p><div class="row"><button class="btn ghost" data-a="closeBox">✖</button></div>`);
  },
  theme: () => { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* */ } applyTheme(); },
  buyPerk: v => {
    const p = PERKS.find(x => x.id === v), l = P(v), c = perkCost(p, l);
    if (!p || l >= p.max || S.leg.stars < c || perkLock(p)) return;
    S.leg.stars -= c; S.leg.perks[v] = l + 1;
    const now = p.start && startNow();
    if (now) applyStartNow(v, l + 1);
    log(L`🌟 تعلّمت ${p.e} ${p.n} (مستوى ${l + 1})${p.start ? now ? L(' — طبقت عليك الحين') : L(' — تطبق من الجيل القادم') : ''}`, 'good');
  },
  retire: () => openRetire(),
  respec: () => {
    if (S.gen.respec || !perkSpent()) return;
    openModal(L`<h2>↺ إعادة توزيع النقاط</h2><p>ترجع لك كل النجوم اللي صرفتها (${fmt(perkSpent())}) وتقدر توزعها من جديد. مسموح مرة وحدة كل جيل.</p><p class="hint">المهارات المعلّمة بـ 🌱 اللي طبقت على هذا الجيل تبقى لين نهايته.</p>
    <div class="row"><button class="btn gold" data-a="respecGo">↺ أعد التوزيع</button><button class="btn ghost" data-a="closeModal">إلغاء</button></div>`);
  },
  respecGo: () => {
    if (S.gen.respec) return;
    const n = perkSpent(); S.leg.stars += n; S.leg.perks = {}; S.gen.respec = 1;
    closeModal(); log(L`↺ رجعت لك ${fmt(n)} نجمة إرث، وزّعها من جديد`, 'good');
  },
  rsHeir: v => { RS.heir = v; showRetire(); },
  rsCh: v => { RS.ch = v === 'none' ? null : v; showRetire(); },
  retireGo: () => doRetire(),
  marry: v => {
    const st = S.npc[v];
    if (S.leg.gen < 5 || S.spouse || !NPC_BY[v] || !canWed(NPC_BY[v]) || !st || st.pts < 1000 || S.gold < 50000) return;
    S.gold -= 50000; S.spouse = v; S.leg.married = 1;
    log(L`💍 تزوجت ${NPC_BY[v].n}! القرية كلها احتفلت بالعرس 🎉`, 'season');
  },
  befriend: v => {
    const st = S.npc[v];
    if (S.leg.gen < 5 || S.friend || !NPC_BY[v] || !canBond(NPC_BY[v]) || !st || st.pts < 1000 || S.gold < 50000) return;
    S.gold -= 50000; S.friend = v;
    const n = NPC_BY[v].n;
    log(NPC_BY[v].g === 'f' ? L`🤝 صارت ${n} صديقة عمرك! القرية كلها احتفلت معكم 🎉` : L`🤝 صار ${n} صديق عمرك! القرية كلها احتفلت معكم 🎉`, 'season');
  },
  soulTwin: v => {
    const st = S.npc[v];
    if (!twinOpen() || !NPC_BY[v] || bonded(v) || !st || st.pts < 1000 || S.gold < TWIN_COST) return;
    S.gold -= TWIN_COST; (S.twins || (S.twins = {}))[v] = 1;
    const n = NPC_BY[v].n;
    log(NPC_BY[v].g === 'f' ? L`🌟 صارت ${n} توأم روحك! مكافأتها صارت ×2.5` : L`🌟 صار ${n} توأم روحك! مكافأته صارت ×2.5`, 'season');
  },
  setGender: v => { if (S.spouse || S.friend || !GENDER[v]) return; S.gender = v; lastSig = ''; toast(L`${GENDER[v].e} تم تحديد شخصيتك: ${GENDER[v].n}`); },
  introGender: v => { introGender = v; document.querySelectorAll('.genderpick [data-a=introGender]').forEach(b => { b.classList.toggle('gold', b.dataset.v === v); b.classList.toggle('ghost', b.dataset.v !== v); }); },
  rsGender: v => { RS.gender = v; showRetire(); },
  save: () => { save(); toast(L('💾 تم الحفظ')); },
  export: () => {
    save();
    prompt(L('انسخ هذا الكود واحتفظ به:'), encodeSave(S));
  },
  import: () => {
    const code = prompt(L('الصق كود الحفظ:')); if (!code) return;
    const info = readSave(code);
    if (!info) return toast(L('❌ الكود غير صالح'));
    S = migrate(info.st); S.last = Date.now(); lastSig = ''; toast(L('✅ تم الاستيراد'));
    markMod(info.mod || saveOddity(S)); save();
  },
  saveDownload: () => saveDownload(),
  saveUpload: () => saveUpload(),
  saveLoadGo: () => saveLoadGo(),
  reset: () => {
    if (!confirm(L('متأكد؟ سيتم حذف كل تقدمك نهائياً!'))) return;
    localStorage.removeItem(SAVE_KEY); S = newState(); logs = []; indLogs = []; logDirty = true; lastSig = ''; showIntro();
  },
  start: () => {
    const nm = ($('nameIn').value || '').trim() || L('المزارع');
    if (badName(nm)) return toast(L('❌ اختر اسم ثاني'));
    S.name = nm.slice(0, 20); S.leg.family = S.name; S.gender = introGender; S.started = true; S.last = Date.now();
    fillBoard(); closeModal();
    log(L`🏡 ${gv(L('وصل'), L('وصلت'))} ${S.name} إلى قرية وادي الصدى. حياة جديدة تبدأ!`, 'season');
    log(L('💡 ابدأ بزراعة اللفت، ثم بِع المحصول من السوق.'));
    save();
  },
  // A returning player on a new phone, browser or home-screen app: sign in first and the cloud save loads.
  introCloud: () => { if (typeof CLOUD === 'undefined' || !CLOUD.auth) return toast(L('⏳ لحظة، جاري التحميل…')); cloudGoogle(); },
  closeModal: () => closeModal(),
  reloadNew: () => { try { save(); } catch (e) { /* */ } location.reload(); },
  side: v => { sideTab = v; lastBuffs = ''; renderSide(); },
};
function toolCost(l) {
  const disc = 1 - 0.03 * hearts('smith');
  return { gold: Math.round(500 * Math.pow(6, l - 1) * disc), ore: ORES[l - 1].id, qty: Math.round((10 + 10 * l) * disc) };
}
function bCost(b) { const l = S.bld[b.id] || 0; return b.costs ? b.costs[Math.min(l, b.costs.length - 1)] : Math.round(b.cost * Math.pow(b.mult || 1, l)); }
function refreshCost() { return 100 * Math.pow(rankIdx() + 1, 2); }

/* Human click limit for the buttons that pay per click (dig, cast).
   A fast hand manages about 10 clicks a second, so anything faster is ignored: an auto-clicker gains nothing over a person.
   Human clicks are never evenly spaced; a machine-steady rhythm makes the character "tired" (3 clicks/s) for 20 s.
   Clicks made by scripts (not a real mouse or finger) don't count at all. */
const WORK_ACTIONS = { dig: 1, cast: 1 };
const CLICK_CAP = 10, TIRED_MS = 20000;
const clicks = { times: [], gaps: [], prev: 0, tired: 0, last: 0, warned: 0 };
function workClickOk(e) {
  if (!e.isTrusted) return false;
  const now = performance.now();
  if (clicks.prev) { clicks.gaps.push(now - clicks.prev); if (clicks.gaps.length > 24) clicks.gaps.shift(); }
  clicks.prev = now;
  if (now < clicks.tired) { if (now - clicks.last < 333) return false; clicks.last = now; return true; }
  const g = clicks.gaps;
  if (g.length >= 24) {
    const mean = g.reduce((a, b) => a + b, 0) / g.length, sd = Math.sqrt(g.reduce((a, b) => a + (b - mean) ** 2, 0) / g.length);
    if (mean < 250 && sd < 6) {
      clicks.tired = now + TIRED_MS; clicks.gaps = [];
      if (now - clicks.warned > 60000) { clicks.warned = now; toast(L('😮‍💨 إيدك تعبت! ضغطاتك منتظمة مرة كأنها آلة 🤖 ارتاح شوي')); }
      if (typeof track === 'function') track('autoclick');
      return false;
    }
  }
  const t = clicks.times; t.push(now);
  while (t.length && now - t[0] > 1000) t.shift();
  if (t.length > CLICK_CAP) { t.pop(); return false; }
  return true;
}
// Hold to dig or fish: keep pressing the button and it hits by itself, at the gloves' speed.
// A quick tap is still a normal click. Hits from holding never go above 10 a second, like a fast hand.
const hold = { a: '', t: 0, start: 0, n: 0, end: 0 };
function holdRate() { return Math.round(HOLD_RATE[Math.min(6, S.tools.glove || 0)] * lf('glove')); }
function holdStop() { if (hold.t) { clearInterval(hold.t); if (hold.n) hold.end = performance.now(); } hold.t = 0; hold.a = ''; }
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-a=dig],[data-a=cast]');
  if (!b || !e.isTrusted || e.button > 0) return;
  holdStop(); hold.a = b.dataset.a; hold.start = performance.now(); hold.n = 0;
  hold.t = setInterval(() => {
    const el = document.querySelector(`[data-a=${hold.a}]`);
    if (!el || document.hidden || !S) return holdStop();
    const held = performance.now() - hold.start - 350; if (held < 0) return;
    const want = Math.min(hold.n + 3, Math.floor(held / 1000 * holdRate()) + 1);
    while (hold.n < want) { hold.n++; A[hold.a](); if (hold.n % 3 === 1) { burstVisual(el); floatVisual(el, hold.a === 'cast' ? icon('water', 24) : icon('copper', 24)); } }
  }, 50);
});
['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, holdStop));
document.addEventListener('visibilitychange', holdStop);
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-a=dig],[data-a=cast]')) e.preventDefault(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const fn = A[b.dataset.a]; if (!fn) return;
  if (WORK_ACTIONS[b.dataset.a] && (performance.now() - hold.end < 400 || !workClickOk(e))) return; // the click that ends a long hold is not one more hit
  const earnedBefore = S.gold, harvestsBefore = S.stats.harvests;
  const selectedPlot = b.dataset.a === 'plot' ? S.farm.plots[+b.dataset.v] : null;
  const harvested = b.dataset.a === 'harvestAll' ? S.farm.plots.filter(isReady).slice(0,6).map(p=>p.c) : selectedPlot && isReady(selectedPlot) ? [selectedPlot.c] : [];
  fn(b.dataset.v, b);
  if (['dig','cast'].includes(b.dataset.a)) { burstVisual(b); floatVisual(b, b.dataset.a === 'cast' ? icon('water',24) : icon('copper',24)); }
  if (S.stats.harvests > harvestsBefore) harvested.forEach(c=>floatVisual(b, '+1 ' + icon(c,24)));
  if (['sell1','sellN','sellAll','shipAll'].includes(b.dataset.a) && S.gold > earnedBefore) { floatVisual($('hGold'), '+' + fmt(S.gold-earnedBefore) + ' ' + icon('coin',24)); burstVisual($('hGold')); }
  render(true);
});

/* ---------------- الواجهة ---------------- */
const TABS = [
  ['farm', L('🌱 المزرعة')], ['barn', L('🐄 الحظيرة')], ['mine', L('⛏️ المنجم')], ['lake', L('🎣 البحيرة')], ['guild', L('⚔️ النقابة')],
  ['smith', L('🔨 الحداد')], ['market', L('🛒 السوق')], ['village', L('🏘️ القرية')], ['legacy', L('🌳 الإرث')], ['settings', L('⚙️ المزيد')],
];
/* Tabs open step by step in the first generation, so a new player isn't flooded with ten tabs at once.
   A locked tab shows dimmed with a lock and says what opens it; when it opens, a small window says what it's for.
   From generation 2 everything is open. Opened tabs are kept in S.unl (1 = seen, 2 = new, still shows ✦). */
const TAB_UNLOCK = {
  village: { ok: () => S.stats.earned > 0, why: L('بِع أول محصول في السوق'),
    what: L('هنا أهل القرية والمباني. وظّف عمال يشتغلون عنك حتى وأنت مسكّر اللعبة، واعطِ أهل القرية هدايا عشان تكسب صداقتهم وبفاتهم.') },
  barn: { ok: () => (S.bld.harvester || 0) > 0, why: L('وظّف أول عامل حصاد في القرية'),
    what: L('اشترِ دجاج وأبقار وخرفان تنتج لك بيض وحليب وصوف لحالها. أول دجاجة بـ150 ذهب بس.') },
  mine: { ok: () => S.stats.earned >= 1000, why: L('اكسب 1,000 ذهب'),
    what: L('احفر الصخور واجمع النحاس والحديد والمعادن الأغلى. المعادن تبيعها، أو تاخذها للحداد عشان يطوّر أدواتك.') },
  smith: { ok: () => S.stats.blocks >= 20, why: L('اكسر 20 صخرة في المنجم'),
    what: L('قاسم الحداد يطوّر أدواتك بالذهب والمعادن: معزقة تسرّع الزرع، فأس يحفر أقوى، وسيف ودرع للقتال.') },
  guild: { ok: () => TOOLS.some(t => (S.tools[t.id] || 0) > 0), why: L('طوّر أي أداة عند الحداد'),
    what: L('ادخل الزنزانة وقاتل الوحوش عشان الذهب والمواد والخبرة، وخذ مهام صيد من النقابة عشان ترفع رتبتك.') },
  legacy: { ok: () => S.stats.earned >= 25000 || canRetire(), why: L('اكسب 25,000 ذهب'),
    what: L('هنا هدف جيلك. لما توصل له تتقاعد ويكمّل حفيدك المزرعة بنجوم إرث تخليه أقوى من البداية.') },
  lake: { ok: () => S.leg.gen >= 2, why: L('تفتح في الجيل الثاني'), what: L('اصطد السمك في البحيرة والنهر والبحر، وجمّع ألبوم الصيد.') },
};
let UNL_Q = [];
function tabOpen(id) { return S.leg.gen > 1 || !TAB_UNLOCK[id] || !!(S.unl || {})[id]; }
function tabName(id) { const t = TABS.find(x => x[0] === id); return t ? t[1].replace(/^\S+\s/, '') : id; }
function worldSig() { return indOpen() ? S.world + (inInd() ? villageAlert() : indAlert()) : ''; }
function unlSig() { return S.leg.gen > 1 ? 'all' : Object.entries(S.unl || {}).join(); }
// Checked every frame. The first time a save sees this (S.unl missing), what's already earned opens quietly.
function checkUnlocks() {
  if (S.leg.gen > 1) return;
  const first = !S.unl; if (first) S.unl = {};
  for (const id in TAB_UNLOCK) {
    if (S.unl[id] || !TAB_UNLOCK[id].ok()) continue;
    S.unl[id] = first || !S.started ? 1 : 2;
    if (!first && S.started) { UNL_Q.push(id); log(L`🎉 فتحت تبويب «${tabName(id)}»!`, 'golden'); }
  }
  if (UNL_Q.length && $('modal').classList.contains('hidden')) {
    const id = UNL_Q.shift(), u = TAB_UNLOCK[id];
    openModal(L`<div class="unlock-pop"><div class="unlock-ic">${icon(NAV_ART[id], 96)}</div><h2>🎉 فتحت ${tabName(id)}!</h2><p>${u.what}</p>
      <div class="row"><button class="btn gold" data-a="unlockGo" data-v="${id}" style="flex:1">${L('روح له الحين')}</button><button class="btn ghost" data-a="closeModal">${L('بعدين')}</button></div></div>`);
  }
}
/* Red dots on the tabs: something there is waiting for the player.
   Village: someone can get a gift today (or a royal gift this season). Guild: a delivery you can hand in, or a free
   quest slot with a quest you'd most likely win. Smith: you can afford the next level of a tool. */
function tabAlerts() {
  const a = {}, g = S.guild;
  if (NPCS.some(np => {
    const st = S.npc[np.id] || { pts: 0 }; if (st.pts >= 1000) return false;
    const kid = KING_GIFT[np.id]; if (kid && st.kk !== seasonKey() && have(kid) >= 1) return true;
    if (st.gd === dayAbs()) return false;
    const gf = giftsOf(np); return have(gf.love) >= 1 || have(gf.like) >= 1;
  })) a.village = 1;
  if (g.board.some(q => q.type === 'deliver' ? have(q.item) >= q.qty : g.active.length < questSlots() && chanceOf(q) >= ALLY_MIN) || S.leg.eggNew) a.guild = 1;
  if (TOOLS.some(t => { const l = S.tools[t.id] + 1; if (l > 6) return false; const c = toolCost(l); return S.gold >= c.gold && have(c.ore) >= c.qty; })) a.smith = 1;
  return a;
}
let tabAlertSig = '';
function renderTabs() {
  const ready = S.farm.plots.filter(isReady).length;
  const badge = { farm: ready, legacy: canRetire() ? '⭐' : 0 }, al = tabAlerts();
  for (const k in al) if (!badge[k]) badge[k] = 'dot';
  const locked = {};
  for (const id in TAB_UNLOCK) { if (!tabOpen(id)) { locked[id] = 1; delete badge[id]; } else if ((S.unl || {})[id] === 2) badge[id] = 'new'; }
  tabAlertSig = Object.keys(al).join() + unlSig() + worldSig();
  // In the Industrial Age the tabs swap for the factory's; the last button goes back (with a dot when the other world needs you).
  const iw = inInd(), list = iw ? indTabs() : TABS;
  document.documentElement.classList.toggle('ind-world', iw); // the factory's own colours (world-theme.css)
  if (!list.some(t => t[0] === tab)) { tab = list[0][0]; lastSig = ''; }
  const sw = indOpen() ? `<button data-a="world" data-v="${iw ? 'village' : 'ind'}" class="world-btn"><span class="nav-emblem" aria-hidden="true">${icon(iw ? indArt('village', 'village') : indArt('factory', 'icon-auto-forge'), 40)}${(iw ? villageAlert() : indAlert()) ? '<i class="tab-dot"></i>' : ''}</span><span>${iw ? L('القرية') : L('المصنع')}</span></button>` : '';
  $('tabs').innerHTML = tabsMarkup(list, iw ? {} : badge, tab, iw ? indLocked() : locked) + sw;
}
function skillBar(k) {
  return `<div class="skill"><span>${SKILL_N[k]} <b id="sk_${k}_l"></b></span><div class="bar xp"><i id="sk_${k}_b"></i></div><small id="sk_${k}_t"></small></div>`;
}
function costBtn(a, v, cost, label, cls = 'gold', extraDisabled = false) {
  return `<button class="btn ${cls}" data-a="${a}" ${v !== undefined ? `data-v="${v}"` : ''} ${extraDisabled ? 'disabled' : `data-cost="${cost}"`}>${label}</button>`;
}

/* ----- المزرعة ----- */
function viewFarm() {
  const s = SEASONS[S.season], gh = ghCount();
  let h = L`<div class="panel"><div class="ph"><h2>🌱 المزرعة</h2>${skillBar('farm')}</div>
  <details class="farm-help"><summary>${icon('icon-help', 20)} إرشادات الزراعة وموسم ${s.n}</summary><p class="hint">${icon(s)} نحن في موسم <b>${s.n}</b>: محاصيل الموسم تنمو بسرعة كاملة وغيرها بنصف السرعة${gh ? L` — البيت المحمي يحمي أول ${gh} أحواض 🏡` : ''}.
  اضغط الحوض الفارغ للزراعة، والنامي لسقيه 💧 (يضاعف السرعة)، والجاهز للحصاد.</p></details>
  ${noFarm() ? L('<p class="hint">🚫 الزراعة ممنوعة في تحدي هذا الجيل.</p>') : ''}
  `;
  h += L`<div class="row farm-actions">
    <button class="btn" data-a="plantAll">🌱 زراعة الكل</button>
    <button class="btn blue" data-a="waterAll" ${S.tools.can < 1 ? L('disabled title="طوّر المرشة عند الحداد"') : ''}>💧 سقي الكل</button>
    <button class="btn gold" data-a="harvestAll">🧺 حصاد الكل</button>
    ${S.farm.plots.length < MAX_PLOTS ? costBtn('buyPlot', undefined, plotCost(), L`➕ حوض جديد (${fmt(plotCost())}💰)`) : ''}
  </div>`;
  const autos = ['harvester', 'planter', 'zoning', 'sprinkler', 'greenhouse'].filter(owned);
  if (autos.length || S.weather === 'rain') h += `<div class="row">${autos.map(togBtn).join('')}${S.weather === 'rain' ? L('<span class="stat">🌧️ المطر يسقي الحقل اليوم</span>') : ''}</div>`;
  h += seasonChooser();
  for (let si = 0; si < 5; si++) {
    const full = si === S.season || si === 4;
    const SL = si < 4 ? SEASONS[si] : { e: '🌟', n: L('نادرة') };
    const sub = si === 4 ? (S.leg.gen >= 3 ? L('كل المواسم ✔') : L('🔒 الجيل 3')) : si === S.season ? L('الموسم الحالي ✔') : gh ? L`نصف السرعة • 🏡 كاملة في ${gh} أحواض` : L('نصف السرعة');
    h += `<div data-season="${si}" class="srow ${(shelfSeason === null ? S.season : shelfSeason) === si ? 'shown' : ''} ${si === S.season ? 'now' : ''} ${si === 4 ? 'rare' : ''}"><div class="slabel"><span>${icon(SL)} ${SL.n}</span><small>${sub}</small></div><div class="seeds">`;
    for (const c of CROPS.filter(x => x.season === si)) {
      const un = cropUnlocked(c);
      h += `<button class="seed ${S.farm.seed === c.id ? 'sel' : ''}" data-a="seed" data-v="${c.id}" ${un ? '' : 'disabled'}>
        <span class="big">${icon(c.id + '-seed',48)}${un ? '' : '<span class="seed-lock">🔒</span>'}</span><b>${c.n}</b>
        ${un ? L`<small>بذرة ${fmt(seedCost(c))}💰 • بيع ${fmt(sellPrice(c.id))}💰</small><small>⏱ ${ftime(full ? c.grow : c.grow * 2)}</small>` : `<small>${c.season === 4 && S.leg.gen < 3 ? L('تنفتح في الجيل 3') : L`يتطلب زراعة ${c.lvl}`}</small>`}</button>`;
    }
    h += '</div></div>';
  }
  if (S.bld.zoning) {
    const sc = CROP[S.farm.seed], cnt = {};
    S.farm.plots.forEach(p => { if (p.a && CROP[p.a]) cnt[p.a] = (cnt[p.a] || 0) + 1; });
    const sum = Object.entries(cnt).map(([id, n]) => `${icon(CROP[id])}×${n}`).join('  ') || L('لا يوجد تخصيص');
    h += L`<div class="zonebox"><div class="row" style="margin:0">
      <button class="btn ${zoneMode ? 'red' : 'blue'}" data-a="zoneMode">🎯 ${zoneMode ? L('إنهاء التخصيص') : L('تخصيص الأحواض')}</button>
      ${zoneMode ? L`<button class="btn ghost sm" data-a="zoneAll">خصص الكل لـ ${icon(sc)} ${sc.n}</button><button class="btn ghost sm" data-a="zoneClear">مسح كل التخصيص</button>` : ''}
      <span class="stat">التخصيص الحالي: ${sum}</span></div>
      ${zoneMode ? L('<p class="hint" style="margin:8px 0 0">🎯 اختر بذرة من الأعلى ثم اضغط على الأحواض لتخصيصها لها (مثلاً 3 جزر و3 بطيخ و4 فراولة). اضغط الحوض مرة ثانية بنفس البذرة لإلغاء تخصيصه. يطبق التخصيص عند الزراعة القادمة.</p>') : ''}
      ${!on('zoning') ? L('<p class="hint" style="margin:8px 0 0">⏸️ التخصيص متوقف حالياً — كل الأحواض تُزرع بالبذرة المختارة.</p>') : ''}</div>`;
  }
  h += L`<div class="field-head"><span>حقولك <small>• ${S.farm.plots.length} حوض</small></span><div class="field-stats"><span><b id="fieldReady"></b> جاهز</span><span><b id="fieldGrowing"></b> ينمو</span></div></div><div class="plots">`;
  S.farm.plots.forEach((p, i) => {
    h += `<button class="plot" id="plot${i}" data-a="plot" data-v="${i}"><span class="pw">💧</span><span class="pa"></span><span class="pe"></span><span class="pt"></span><div class="bar sm"><i></i></div></button>`;
  });
  h += '</div>';
  return h + '</div>';
}
function updFarm() {
  $('fieldReady').textContent = S.farm.plots.filter(isReady).length;
  $('fieldGrowing').textContent = S.farm.plots.filter(p => p.c && !isReady(p)).length;
  S.farm.plots.forEach((p, i) => {
    const el = $('plot' + i); if (!el) return;
    let emo = glyph('plus'), pct = 0, cls = 'plot', tip = L('حوض فارغ — اضغط للزراعة');
    if (p.c) {
      const c = CROP[p.c]; pct = p.p / c.grow;
      if (pct >= 1) { emo = icon(c,48); cls += ' ready'; tip = L`${c.n} جاهز للحصاد!`; }
      else { emo = icon(c.id + (pct < 0.35 ? '-sprout' : '-leaf'),48); cls += ' growing'; tip = L`${c.n} — متبقي ${ftime((c.grow - p.p) / plotSpeed(p))}${p.w ? '' : L(' (اضغط للسقي)')}`; }
      if (p.w) cls += ' wet';
    } else cls += ' empty';
    if (zoneMode) cls += ' zoning';
    if (i < ghCount()) cls += ' gh';
    const za = p.a && CROP[p.a] ? CROP[p.a] : null;
    if (za) tip += L` • مخصص لـ ${za.n}`;
    const pa = el.querySelector('.pa'), tag = za ? icon(za,16) : '';
    visualText(pa,tag);
    if (el.className !== cls) el.className = cls;
    const pe = el.querySelector('.pe');
    if (el.dataset.crop && !p.c) floatVisual(el, '+1 ' + icon(el.dataset.crop,24));
    el.dataset.crop = p.c || '';
    visualText(pe,emo);
    el.querySelector('i').style.width = Math.min(100, pct * 100) + '%';
    el.title = tip;
    el.setAttribute('aria-label',tip);
    const text = el.querySelector('.pt');
    if (text) text.textContent = !p.c ? L('ازرع هنا') : CROP[p.c].n + ' · ' + (pct >= 1 ? L('جاهز') : ftime((CROP[p.c].grow-p.p)/plotSpeed(p)));

  });
}

/* ----- الحظيرة ----- */
function viewBarn() {
  let h = L`<div class="panel"><div class="ph"><h2>🐄 الحظيرة</h2>${skillBar('ranch')}</div>
  <p class="hint">الحيوانات تنتج تلقائياً. السعادة ❤️ تقل مع الوقت وتؤثر على سرعة الإنتاج (من ×0.5 إلى ×1.5) — دلّلها باستمرار أو وظّف راعياً من القرية. السعة: ${barnCap()} لكل نوع.</p>${owned('rancher') ? `<div class="row">${togBtn('rancher')}</div>` : ''}<div class="grid">`;
  for (const a of ANIMALS) {
    const un = S.skills.ranch.l >= a.lvl, n = S.barn.n[a.id] || 0, pr = ITEMS[a.prod], c = animalCost(a);
    h += L`<div class="card ${un ? '' : 'locked'}"><div class="top"><span class="big">${icon(a,48)}</span>
      <div class="meta"><b>${a.n}</b> × ${n}<small>تنتج ${icon(pr)} ${pr.n} (${fmt(sellPrice(a.prod))}💰) كل ${ftime(a.time)}</small></div></div>`;
    if (!un) h += L`<p class="hint">يتطلب مستوى رعي ${a.lvl}</p>`;
    else {
      if (n && BREEDABLE.includes(a.id)) { const g = grades(a.id); h += L`<div class="grades"><span class="g-norm">${icon(a,40)}<b>${gName(a, 'n0')}</b><em>×${g.n0}</em></span><span class="g-prem">${icon(a.id+'-p',40)}${gradeBadge('p')}<b>${gName(a, 'p')}</b><em>×${g.p}</em></span><span class="g-gold">${icon(a.id+'-g',40)}${gradeBadge('g')}<b>${gName(a, 'g')}</b><em>×${g.g}</em></span></div>`; }
      if (n) h += L`<div class="kv"><span>الإنتاج</span><span id="an_tt_${a.id}"></span></div><div class="bar"><i id="an_t_${a.id}"></i></div>
        <div class="kv"><span>السعادة</span><span id="an_hh_${a.id}"></span></div><div class="bar joy"><i id="an_h_${a.id}"></i></div>`;
      h += `<div class="row">${n >= barnCap() ? L`<button class="btn" disabled>✅ وصلت الحد (${barnCap()})</button>` // full: no price to confuse anyone
        : costBtn('buyAnimal', a.id, c, L`شراء (${fmt(c)}💰)`, 'gold') + `<button class="btn ghost sm" data-a="buyAnimalAsk" data-v="${a.id}">${L('🔢 كمية')}</button>`}
        ${n && !on('rancher') ? L`<button class="btn ghost" data-a="pet" data-v="${a.id}">🤲 دلّل</button>` : ''}</div>`;
    }
    h += '</div>';
  }
  return h + '</div></div>' + breedPanel();
}
function breedPanel() {
  const lvlOk = S.skills.ranch.l >= GRADE.p.lvl;
  let h = L`<div class="panel"><div class="ph"><h2>🧬 بيت التهجين</h2></div>
  <p class="hint">حط حيوانين من نفس الدرجة وهجّنهم! لو نجح التهجين يصيرون الاثنين درجة أعلى، ولو فشل <b>تخسرهم الاثنين</b>. بعد كل محاولة البيت يرتاح ${ftime(houseRest())}، وكل ما عندك بيوت أكثر تقدر تهجّن أكثر. طوّر «أدوات التهجين» من القرية عشان ترتفع النسبة ويقل الانتظار.
  <b>الممتاز ${gradeBadge('p')}</b> ينتج ضعف الإنتاج. <b>الذهبي ${gradeBadge('g')}</b> ينتج ضعف الإنتاج من منتج ذهبي سعره ×5. الدرجات تبدأ من جديد مع كل جيل.</p>`;
  if (!lvlOk) return h + L`<p class="hint">🔒 يتطلب مستوى رعي ${GRADE.p.lvl}</p></div>`;
  h += '<div class="houses">';
  for (let i = 0; i < houseCount(); i++) h += `<span class="house" id="hs${i}"></span>`;
  h += '</div>';
  if (houseCount() < HOUSE_MAX) h += `<div class="row">${costBtn('buyHouse', '', houseCost(), L`🏠 بيت تهجين جديد (${houseCount() + 1}/${HOUSE_MAX}) — ${fmt(houseCost())}💰`)}</div>`
    + (houseCount() === HOUSE_MAX - 1 ? L('<p class="hint">🎯 البيت السادس يفتح التهجين التلقائي.</p>').replace('🎯', icon('icon-autobreed', 24)) : '');
  else {
    const f = focusOn(), list = BREEDABLE.map(id => ANIMALS.find(x => x.id === id)).filter(a => S.skills.ranch.l >= a.lvl && (S.barn.n[a.id] || 0));
    h += L`<div class="zonebox"><b>🎯 التهجين التلقائي</b>`.replace('🎯', icon('icon-autobreed', 28)) + L` <small class="hint">اختر حيوان، والبيوت تهجّنه لحالها: العادي لين يصير ممتاز، وبعدين الممتاز لين يصير ذهبي. نفس النسب والخسارة مثل التهجين باليد.</small><div class="row">`
      + list.map(a => `<button class="btn ${f === a.id ? 'gold' : 'ghost'} sm" data-a="breedFocus" data-v="${a.id}">${icon(a, 24)} ${a.n}</button>`).join('')
      + (f ? L`<button class="btn ghost sm" data-a="breedFocus" data-v="">⏹️ إيقاف</button>` : '') + '</div></div>';
  }
  h += '<div class="grid">';
  let any = false;
  for (const id of BREEDABLE) {
    const a = ANIMALS.find(x => x.id === id); if (S.skills.ranch.l < a.lvl || !(S.barn.n[id] || 0)) continue;
    any = true;
    h += `<div class="card"><div class="top"><span class="big">${icon(a,48)}</span><div class="meta"><b>${a.n}</b></div></div>`;
    for (const to of ['p', 'g']) {
      const G = GRADE[to], why = breedBlock(a, to);
      h += L`<div class="kv grade-line g-${to}"><span>${gradeBadge(to)} ${gName(a, to)} ×2</span><span>نسبة النجاح ${Math.round(breedChance(to) * 100)}%</span></div>
        <div class="row">${why ? `<span class="stat">${why}</span>` : L`<button class="btn ${to === 'g' ? 'gold' : ''}" data-a="breed" data-v="${id}:${to}">🧬 هجّن</button>`}</div>`;
    }
    h += '</div>';
  }
  if (!any) h += L('<p class="hint">اشترِ دجاج أو بقر أو خرفان أولاً.</p>');
  return h + '</div></div>';
}
function updBarn() {
  for (let i = 0; i < houseCount(); i++) {
    const el = $('hs' + i); if (!el) continue;
    const c = houseCd(i), t = c > 0 ? `🏠 ${i + 1} · ⏳ ${ftime(c)}` : L`🏠 ${i + 1} · ✅ جاهز`;
    if (el.textContent !== t) { el.textContent = t; el.className = 'house' + (c > 0 ? ' rest' : ' ready'); }
  }
  for (const a of ANIMALS) {
    const t = $('an_t_' + a.id); if (!t) continue;
    const hp = S.barn.h[a.id] ?? 100;
    const productionTime = S.barn.t[a.id] || 0;
    if (t._productionTime !== undefined && productionTime < t._productionTime) floatVisual(t.closest('.card'), '+1 ' + icon(a.prod,24));
    t._productionTime = productionTime;
    t.style.width = (productionTime / a.time * 100) + '%';
    $('an_h_' + a.id).style.width = hp + '%';
    $('an_hh_' + a.id).textContent = Math.round(hp) + '%';
    $('an_tt_' + a.id).textContent = `${ftime((a.time - (S.barn.t[a.id] || 0)) / animalSpeed(a))} • ×${(S.barn.n[a.id])}`;
  }
}

/* ----- المنجم ----- */
function viewMine() {
  const cap = PICK_CAP[S.tools.pick];
  let h = L`<div class="panel"><div class="ph"><h2>⛏️ المنجم القديم</h2>${skillBar('mine')}</div>
  <p class="hint">اضغط زر الحفر لتكسير الصخور، أو وظّف عمالاً يحفرون عنك. كل 5 صخور في أعمق طابق تنزلك طابقاً. المعادن الأعمق أغلى وتحتاجها لتطوير أدواتك. الفأس ${TIER[S.tools.pick]} يسمح بالنزول حتى الطابق ${cap > 1e8 ? '∞' : cap}.</p>
  <div class="minebox"><button class="digbtn" data-a="dig"><span class="dig-scene">${icon("rock",64)}${icon(lgv('pick') && S.tools.pick >= 6 ? 'pick-7' : 'pick-' + S.tools.pick,48)}</span>احفر!<small class="hold-hint">اضغط مطوّل ✊</small></button>
  <div class="mineinfo">
    <div class="depth">الطابق <span id="m_depth"></span> <small style="font-size:14px;color:var(--muted)">/ الأعمق <span id="m_max"></span></small></div>
    <div class="kv"><span>صلابة الصخرة</span><span id="m_hard"></span></div><div class="bar"><i id="m_prog"></i></div>
    <div class="kv"><span>التقدم نحو الطابق التالي</span><span id="m_blocks"></span></div>
    <div class="kv"><span>قوة الضربة</span><span id="m_click"></span></div>
    <div class="kv"><span>${icon('worker-miner',24)} العمال: ${S.mine.miners}</span><span id="m_rate"></span></div>
    <div class="row">${S.mine.miners >= VILLAGE_WMAX ? L`<button class="btn" disabled>✅ وصلت الحد (${VILLAGE_WMAX})</button>` : costBtn('hireMiner', undefined, minerCost(), L`${icon('worker-miner',24)} وظّف عامل (${fmt(minerCost())}💰)`)}${owned('miners') ? togBtn('miners') : ''}</div>${indLv('rails') ? `<p class="hint">${L`🛤️ سكة الحديد (مستوى ${indLv('rails')}): العمال أرخص ${Math.round(indDisc('rails') * 100)}%`}</p>` : ''}
    <div class="row"><button class="btn ghost sm" data-a="mineUp" id="m_up">⬆️ اصعد</button><button class="btn ghost sm" data-a="mineDown" id="m_down">⬇️ انزل</button></div>
    <div class="mine-jump"><small class="hint">🧭 انتقل لطابق:</small><div class="row">
      <button class="btn ghost sm" data-a="mineTo" data-v="1">⏫ الأعلى</button>
      ${ORES.filter(o => o.depth > 1).map(o => o.depth <= S.mine.max
        ? `<button class="btn ghost sm" data-a="mineTo" data-v="${o.depth}">${icon(o, 24)} ${o.n} • ${o.depth}</button>`
        : `<button class="btn ghost sm" disabled title="${L`من الطابق ${o.depth}`}">🔒 ${o.n}</button>`).join('')}
      <button class="btn ghost sm" data-a="mineDeep" id="m_deep">⏬ الأعمق</button></div></div>
    <p class="hint" id="m_capmsg"></p>
  </div></div>
  <h3>المعادن حسب العمق</h3><div class="ores">`;
  for (const o of ORES) h += L`<div class="ore" id="ore_${o.id}">${icon(o)} <b>${o.n}</b><br><small>من الطابق ${o.depth} • ${fmt(o.price)}💰</small></div>`;
  return h + '</div></div>';
}
/* Scene backgrounds (assets/art/scenes-v1): the mine follows the deepest ore of the current floor,
   the lake follows the fishing spot, the dungeon shows a boss cave on boss floors. Set only when it changes. */
const MINE_SCENE = { gold_ore: 'gold' };
function sceneBg(el, name) {
  if (!el || (el.dataset.scene === name && el.classList.contains('scene-bg'))) return; // the enemy box resets its classes
  el.dataset.scene = name; el.classList.add('scene-bg');
  el.style.setProperty('--scene', `url("assets/art/scenes-v1/${name}.webp")`);
}
function updMine() {
  const m = S.mine; if (!$('m_depth')) return;
  const top = oresAt(m.depth).pop(); sceneBg(document.querySelector('#view .minebox'), 'mine-' + (MINE_SCENE[top.id] || top.id));
  $('view').style.setProperty('--cave', ['#465554','#3d4d4d','#354347','#303b44','#303344','#2a293c'][[1,10,25,45,70,100].filter(n=>m.depth>=n).length-1]);
  $('m_depth').textContent = m.depth; $('m_max').textContent = m.max;
  $('m_prog').style.width = (m.prog / hardness() * 100) + '%';
  $('m_hard').textContent = `${fmt(m.prog)} / ${fmt(hardness())}`;
  const capped = m.max >= PICK_CAP[S.tools.pick];
  $('m_blocks').textContent = m.depth < m.max ? L('انزل للأعمق للتقدم') : capped ? L('وصلت حد الفأس') : `${m.blocks} / 5`;
  $('m_click').textContent = mineMult().toFixed(1);
  $('m_rate').textContent = L`${minerRate().toFixed(1)} / ث`;
  $('m_up').disabled = m.depth <= 1; $('m_down').disabled = m.depth >= m.max; $('m_deep').disabled = m.depth >= m.max;
  document.querySelectorAll('.mine-jump [data-a=mineTo]').forEach(b => b.classList.toggle('here', +b.dataset.v === m.depth));
  $('m_deep').classList.toggle('here', m.depth === m.max);
  $('m_capmsg').textContent = capped ? L('⚠️ الفأس الحالي لا يستطيع الحفر أعمق — طوّره عند الحداد.') : '';
  for (const o of ORES) $('ore_' + o.id).classList.toggle('on', o.depth <= m.depth);
}

/* ----- النقابة ----- */
function viewGuild() {
  const D = S.dun, g = S.guild, r = rankIdx();
  // Layout: the dungeon across the top; under it the hero (stats + mercenary skills) on one side, the guild on the other.
  const hero = L`<div class="panel"><div class="ph"><h2>🧑 ${S.name}${titleName() ? ` <small class="hero-title">${titleName()}</small>` : ''}</h2><span class="stat">⚔️ مستوى <b id="h_lvl"></b></span></div>
    <div class="kv"><span>❤️ الصحة</span><span id="h_hpt"></span></div><div class="bar hp"><i id="h_hp"></i></div>
    <div class="kv"><span>✨ الخبرة</span><span id="h_xpt"></span></div><div class="bar xp"><i id="h_xp"></i></div>
    <div class="row" id="h_stats"></div>
    <p class="hint">طوّر السيف والدرع عند الحداد. الطعام من مزرعتك يشفيك أثناء القتال (المقفل 🔒 لا يؤكل)، وبين كل أكلة وأكلة ${eatCd()} ثواني.</p>`;
  const dun = L`<div class="panel"><div class="ph"><h2>🕳️ الزنزانة</h2><span class="stat">أنت في الطابق <b>${D.floor}</b> • المفتوح حتى <b>${D.max}</b></span></div>
    ${P('w_ally') ? L('<p class="hint">🛡️ رفيق المعارك يقاتل معك.</p>').replace('🛡️', icon('ally', 32)) : ''}
    <div class="row">
      <button class="btn ${D.active ? 'red' : ''}" data-a="dunToggle">${D.active ? L('🏃 انسحاب') : L('🗡️ دخول الزنزانة')}</button>
      <button class="btn ghost sm" data-a="floor" data-v="-1" ${D.floor <= 1 ? 'disabled' : ''}>${icon('icon-easier', 20)} طابق أسهل</button>
      <button class="btn ghost sm" data-a="floor" data-v="1" ${D.floor >= D.max ? 'disabled' : ''}>${icon('icon-harder', 20)} طابق أصعب</button>
      <button class="btn ghost sm" data-a="floorMax" ${D.floor >= D.max ? 'disabled' : ''}>⏭ الأعلى</button>
      <button class="btn ghost sm" data-a="floorGo">🔢 روح لطابق</button>
      <button class="btn ghost sm" data-a="floorFit" title="${L('أعلى طابق مفتوح تقدر عليه بقوتك الحين')}">⚖️ طابق يناسبك</button>
    </div>
    <div class="row">
      <button class="btn ghost sm" data-a="dunAuto">${D.auto ? '✅' : '⬜'} تقدم تلقائي</button>
      <button class="btn ghost sm" data-a="dunEat">${D.autoEat ? '✅' : '⬜'} أكل تلقائي</button>
      <button class="btn ghost sm" data-a="eatNow" id="eatBtn">🍽️ كُل الآن</button>
    </div>
    <div class="duninfo" id="dunInfo"></div>
    <div class="enemy" id="enemyBox"></div>
  </div>`;
  let h = L`<div class="panel"><div class="ph"><h2>${icon('icon-guild', 28)} نقابة المرتزقة</h2><span class="rank">${RANKS[r][0]}</span></div>
    <div class="kv"><span>نقاط النقابة</span><span id="g_gpt"></span></div><div class="bar gp"><i id="g_gp"></i></div>
    <p class="hint">مهمات الصيد تعمل في الخلفية ونسبة نجاحها تعتمد على قوتك (⚡ <b id="g_pow"></b>). مهمات التوصيل تسلمها فوراً من مخزونك. الخانات: ${g.active.length}/${questSlots()}</p>
    ${guildGen() > 1 ? L`<p class="hint">📈 جوائز الصيد ×${guildGen() >= 100 ? fmt(guildGen()) : Math.round(guildGen() * 10) / 10} لأنك في الجيل ${S.leg.gen}${guildGen() >= GUILD_GEN_CAP ? L(': وصلت الحد الأعلى (×200).') : L(': تكبر مع كل جيل لين ×200.')}</p>` : ''}
    ${P('w_ally') ? L`<p class="hint">🛡️ رفيقك يقبل مهمات الصيد لحاله لما تفضى خانة (اللي نجاحها ${ALLY_MIN * 100}% أو أكثر).</p>`.replace('🛡️', icon('ally', 32)) : ''}
    <h3>المهمات الجارية</h3>`;
  if (!g.active.length) h += L('<p class="hint">لا توجد مهمات جارية.</p>');
  g.active.forEach(q => {
    h += `<div class="quest"><div class="qi"><b>⚔️ ${Lx(q.n)}</b><small class="qline">${qc('', Math.round(q.chance * 100) + '%', L('نجاح'))}${qc('💰', fmt(qGold(q)))}</small><div class="bar"><i id="q_${q.id}"></i></div></div><small id="qt_${q.id}"></small></div>`;
  });
  h += L`<h3>لوحة المهمات</h3>`;
  if (!g.board.length) h += L('<p class="hint">لا توجد مهمات الآن، تأتي مهمة جديدة كل 40 ثانية.</p>');
  g.board.forEach(q => {
    if (q.type === 'deliver') {
      const it = ITEMS[q.item], ok = have(q.item) >= q.qty;
      h += L`<div class="quest"><div class="qi"><b>📦 توصيل ${q.qty} × ${icon(it)} ${it.n}</b><small class="qline">${qc('', fmt(have(q.item)), L('لديك'))}</small>${qRew(qGold(q), qGp(q))}</div>
        <button class="btn sm" data-a="quest" data-v="${q.id}" ${ok ? '' : 'disabled'}>سلّم</button></div>`;
    } else {
      const ch = chanceOf(q), cl = ch >= 0.8 ? 'hi' : ch >= 0.4 ? 'mid' : 'lo';
      h += L`<div class="quest"><div class="qi"><b>⚔️ ${Lx(q.n)}</b><small class="qline">${qc('', fmt(q.req), L('القوة المطلوبة'))}${qc('⏱', ftime(qDur(q)))}</small>${qRew(qGold(q), qGp(q), q.xp)}
        <small>نسبة النجاح: <span class="chance ${cl}">${Math.round(ch * 100)}%</span></small></div>
        <button class="btn sm" data-a="quest" data-v="${q.id}" ${g.active.length >= questSlots() ? 'disabled' : ''}>قبول</button></div>`;
    }
  });
  h += `<div class="row"><button class="btn ghost sm" data-a="refreshBoard" id="g_ref"></button></div></div>`;
  const guild = h, pts = mskPts();
  h = L`<h3>${icon('icon-merc-skills', 24)} مهارات المرتزق <small class="stat">نقاط: <b>${pts}</b></small></h3>
    <p class="hint">تفيد الزنزانة والنقابة بس، وتبدأ من الصفر مع كل جيل. تاخذ نقطة كل مستويين قتال ونقطتين مع كل رتبة نقابة. المستوى رقم ن يكلف ن نقاط.</p>`;
  for (const k of MSK) {
    const l = gsk(k.id), dots = [0, 1, 2, 3, 4].map(i => i < l ? '●' : '○').join('');
    h += L`<div class="quest"><div class="qi"><b>${icon('icon-skill-' + k.ic, 22)} ${k.n} <small>${dots}</small></b><small>${l ? k.d(l) : L('لسا ما طوّرتها')}${l < 5 ? L` ← ${k.d(l + 1)}` : ''}</small></div>
      ${l < 5 ? L`<button class="btn sm" data-a="mskUp" data-v="${k.id}" ${pts < l + 1 ? 'disabled' : ''}>طوّر (${l + 1} نقاط)</button>` : L('<span class="chance hi">الأعلى</span>')}</div>`;
  }
  if (mastOpen()) {
    const m = gsk('mast'), can = Math.floor(pts / MAST_COST), raw = dropRaw();
    const drop = L`فرصة المواد ${pctTxt(Math.min(1, raw))}` + (raw > 1 ? L` • مادة زيادة ${pctTxt(extraCh())}` : '');
    h += L`<div class="quest mast"><div class="qi"><b>${icon('icon-skill-mastery', 22)} إتقان المرتزق <small>مستوى ${m}</small></b>
      <small>بدون حد: كل مستوى بـ ${MAST_COST} نقاط ويعطي +${pctTxt(MAST_STEP)} هجوم ودفاع وفرصة المواد.</small>
      <small>الحين: +${pctTxt(MAST_STEP * m)} هجوم ودفاع • ${drop}</small></div>
      <div class="row"><button class="btn sm" data-a="mastUp" ${can ? '' : 'disabled'}>طوّر (${MAST_COST} نقاط)</button>${can > 1 ? L`<button class="btn ghost sm" data-a="mastUp" data-v="all">طوّر ×${can}</button>` : ''}</div></div>`;
  }
  const heroPanel = (hero + h + '</div>').replace('🧑', icon(S.gender === 'f' ? 'hero-f' : 'hero-m', 48)); // the player's portrait in the title
  return dun + `<div class="two"><div>${heroPanel}</div><div>${guild}</div></div>` + gearPanel() + titlePanel() + petPanel();
}
/* The hero's equipment, laid out like an inventory: helmet and amulet on top, sword, armour and shield in the
   middle, boots below. Tapping a slot opens the smith. Underneath: what the gear adds up to. */
const GEAR_SLOTS = [['helmet', 'h'], ['amulet', 'a'], ['sword', 'w'], ['armor', 'b'], ['shield', 's'], ['boots', 'f']];
function toolIcon(t, size) {
  const l = S.tools[t.id] || 0, lv = l >= 6 ? lgv(t.id) : 0, key = lv && (ART[t.id + '-7'] || PX[t.id + '-7']) ? t.id + '-7' : t.id + '-' + l;
  return ART[key] || PX[key] ? icon(key, size) : `<span class="tool-emoji">${t.e}</span>`;
}
function gearPanel() {
  const slot = ([id, area]) => {
    const t = TOOLS.find(x => x.id === id), l = S.tools[id] || 0, lv = l >= 6 ? lgv(id) : 0, rar = LEG_RAR[lgTier(lv)];
    return `<button class="gear-slot g-${area} ${lv ? 'lgcard ' + rar.c : ''}" data-a="tab" data-v="smith" title="${esc(t.n)}">${toolIcon(t, 56)}
      <b>${lv ? LEG_TOOLS[id] : t.n}</b><small>${lv ? L`+${lv}% • ${rar.n}` : TIER[l]}</small></button>`;
  };
  const rows = GEAR_SLOTS.map(([id]) => { const t = TOOLS.find(x => x.id === id), l = S.tools[id] || 0; return `<div class="kv"><span>${t.n}</span><span>${l ? t.eff(l, l >= 6 ? lf(id) : 1) : L('ما طوّرته بعد')}</span></div>`; }).join('');
  return L`<div class="panel gear"><div class="ph"><h2>${icon('icon-gear', 28)} عدّة ${esc(S.name)}</h2><span class="stat">اضغط أي قطعة عشان تطوّرها عند الحداد</span></div>
    <div class="gear-wrap"><div class="gear-doll">${GEAR_SLOTS.map(slot).join('')}</div>
    <div class="gear-stats"><div class="kv"><span>🗡️ الهجوم</span><b>${fmt(heroAtk())}</b></div><div class="kv"><span>🛡️ الدفاع</span><b>${fmt(heroDef())}</b></div>
      <div class="kv"><span>❤️ الصحة</span><b>${fmt(heroMaxHp())}</b></div><div class="kv"><span>⚡ القوة</span><b>${fmt(heroPower())}</b></div>
      <div class="kv"><span>👢 الضربات بالثانية</span><b>${Math.round(heroSpeed() * 100) / 100}</b></div><div class="kv"><span>🍽️ شفاء الأكل</span><b>+${Math.round(gearPct(AMULET_HEAL, 'amulet') * 100)}%</b></div>
      <h3>من العدّة</h3>${rows}</div></div></div>`;
}
function assess(f) {
  const e = makeEnemy(f), a = heroAtk(), d = heroDef();
  const hd = Math.max(1, a * a / (a + e.def)) * heroSpeed(), ed = Math.max(1, e.atk * e.atk / (e.atk + d)) / 1.25 * leilaGuard();
  const tKill = e.mhp / hd, tDie = heroMaxHp() / ed;
  return { r: tDie / (tKill * (e.boss ? 1 : 5)), s: tDie / tKill };
}
function diffTag(f) {
  const { r, s } = assess(f);
  const food = foodList().length > 0;
  const [t, c] = r >= 1.5 ? [L('سهل 😎'), 'hi'] : r >= 0.8 ? [L('مناسب 👍'), 'hi'] : s >= 1 ? [L('صعب ⚠️ تحتاج طعام'), 'mid']
    : food && s >= 0.35 ? [L('صعب جداً 🔥 تعتمد على الطعام'), 'mid'] : [L('قاتل ☠️ طوّر نفسك أولاً'), 'lo'];
  return `<span class="chance ${c}">${t}</span>`;
}
function dunInfoHtml() {
  const D = S.dun, e0 = makeEnemy(D.floor), need = e0.boss ? 1 : 5, boss = f => f % 10 === 0 ? L(' 👑 زعيم') : '';
  const lt = enemyLoot(D.floor, e0.boss), mats = MONSTER_MATS.filter(m => m.f <= D.floor), top = mats[mats.length - 1];
  const dc = e0.boss ? 1 : dropCh(), pc = v => Math.round(v * 100) + '%';
  let drops = `${icon(ITEMS[top.id])} ${top.n} ${e0.boss ? '×3' : pc(dc * (0.7 + 0.3 / mats.length))}`;
  if (mats.length > 1) drops += L` • مواد أقدم ${pc(dc * 0.3 * (mats.length - 1) / mats.length)}`;
  if (e0.boss) drops += L` • 💎 جوهرة 25%` + (D.floor > 100 ? L(' • 🌟 نجمة إرث') : '');
  let x = L`<div class="kv"><span>🎁 غنائم الوحش</span><span class="qline">${qc('💰', fmt(lt.gold))}${qc('', fmt(lt.xp * xpMult() * (1 + 0.3 * P('w_xp'))), L('خبرة'))}</span></div>
    <p class="hint" style="margin:0 0 6px">ممكن يطيح: ${drops}</p>
    <div class="kv"><span>صعوبة الطابق ${D.floor} (الحالي)${boss(D.floor)}</span>${diffTag(D.floor)}</div>`;
  if (D.floor < D.max) {
    x += L`<div class="kv"><span>صعوبة الطابق ${D.floor + 1}${boss(D.floor + 1)}</span>${diffTag(D.floor + 1)}</div>
      <p class="ok">✅ الطابق ${D.floor + 1} مفتوح لك — اضغط «طابق أصعب ▶» للانتقال إليه الآن.</p>`;
  } else if (D.max >= floorCap() && !deepLocked()) {
    const nr = RANK_FLOOR.findIndex(c => c > D.max);
    x += L`<p class="hint" style="margin:6px 0 0">🔒 الطابق ${D.max + 1} يحتاج رتبة <b>${RANKS[nr][0]}</b> في نقابة المرتزقة. طلّع رتبتك بمهمات الصيد.</p>`;
  } else if (deepLocked()) {
    x += L('<p class="hint" style="margin:6px 0 0">🔒 بعد الطابق 100 تبدأ <b>الأعماق المنسية</b> — تنفتح في الجيل الرابع.</p>');
  } else {
    x += L`<div class="kv"><span>🔒 لفتح الطابق ${D.max + 1}${boss(D.max + 1)}</span><b>${e0.boss ? L('اهزم الزعيم') : L`اهزم ${need} وحوش`} (${D.kills}/${need})</b></div>
      <div class="bar gp"><i style="width:${D.kills / need * 100}%"></i></div>
      <div class="kv"><span>صعوبة الطابق ${D.max + 1}</span>${diffTag(D.max + 1)}</div>`;
  }
  x += `<p class="hint" style="margin:6px 0 0">${D.auto ? (D.retry > 0 ? L`⏳ التقدم التلقائي متوقف مؤقتاً بعد السقوط — يحاول مجدداً بعد ${ftime(D.retry)}` : L('▶️ التقدم التلقائي مفعّل: بعد ما تنهي هذا الطابق تنتقل للتالي بنفسك.')) : L('⏸️ التقدم التلقائي متوقف: ستبقى في هذا الطابق حتى تنتقل يدوياً.')}</p>`;
  if (!D.active) x = L('<p class="hint" style="margin:0 0 6px">اضغط «دخول الزنزانة» لتبدأ القتال.</p>') + x;
  return x;
}
function updGuild() {
  if (!$('h_lvl')) return;
  const h = S.hero, mhp = heroMaxHp(), D = S.dun, g = S.guild, r = rankIdx();
  $('h_lvl').textContent = h.lvl;
  $('h_hp').style.width = (h.hp / mhp * 100) + '%';
  $('h_hpt').textContent = `${fmt(h.hp)} / ${fmt(mhp)}`;
  $('h_xp').style.width = (h.xp / hxpNeed(h.lvl) * 100) + '%';
  $('h_xpt').textContent = `${fmt(h.xp)} / ${fmt(hxpNeed(h.lvl))}`;
  visualText($('h_stats'), L`<span class="stat">🗡️ هجوم ${fmt(heroAtk())}</span><span class="stat">🛡️ دفاع ${fmt(heroDef())}</span><span class="stat">⚡ قوة ${fmt(heroPower())}</span><span class="stat">🍽️ طعام ${fmt(foodList().reduce((a, id) => a + have(id), 0))}</span>`);
  visualText($('dunInfo'), dunInfoHtml());
  const eb = $('enemyBox');
  updateEnemyVisual(eb, D, h, mhp);
  sceneBg(eb, (D.enemy ? D.enemy.boss : D.floor % 10 === 0) ? 'dungeon-cave-boss' : 'dungeon-cave');
  const lo = RANKS[r][1], hi = RANKS[r + 1] ? RANKS[r + 1][1] : null;
  $('g_gp').style.width = (hi ? (g.gp - lo) / (hi - lo) * 100 : 100) + '%';
  $('g_gpt').textContent = hi ? L`${fmt(g.gp)} / ${fmt(hi)} للرتبة ${RANKS[r + 1][0]}` : L`${fmt(g.gp)} — أعلى رتبة!`;
  $('g_pow').textContent = fmt(heroPower());
  const eb2 = $('eatBtn'); if (eb2) visualText(eb2, D.eatCd > 0 ? L`🍽️ ${Math.ceil(D.eatCd)}ث` : L('🍽️ كُل الآن'));
  const rb = $('g_ref');
  if (rb) { rb.disabled = g.refCd > 0 || S.gold < refreshCost(); rb.textContent = g.refCd > 0 ? L`🔄 مهمات جديدة بعد ${Math.ceil(g.refCd)}ث` : L`🔄 مهمات جديدة (${fmt(refreshCost())}💰)`; }
  g.active.forEach(q => {
    const b = $('q_' + q.id); if (!b) return;
    b.style.width = (q.t / q.dur * 100) + '%';
    $('qt_' + q.id).textContent = ftime(q.dur - q.t);
  });
}

/* ----- الحداد ----- */
// A cost shown one requirement per line: picture, name, what you have / what it needs, ✔ or what's missing.
// rows: [[id or 'gold', amount needed], ...]. Any screen that asks for several things can use it.
/* One small box per value, the number isolated (<bdi>), so Arabic text never swaps numbers around
   (it used to show «320 + 41.6K💰» with the gold and the points in each other's place). */
function qc(e, val, label = '') { return `<span class="qc">${e ? e + ' ' : ''}${label ? label + ' ' : ''}<bdi>${val}</bdi></span>`; }
function qRew(gold, gp, xp) {
  return `<small class="qline"><span class="qlab">${L('المكافأة:')}</span>${qc('💰', fmt(gold))}${qc('', gp, L('نقاط'))}${xp ? qc('', fmt(xp), L('خبرة')) : ''}</small>`;
}
// The same for plain text (the event log): a number kept in one piece in Arabic text.
function bi(s) { return '⁨' + s + '⁩'; }
function reqList(rows) {
  const li = ([id, need]) => {
    const gold = id === 'gold', it = !gold && ITEMS[id];
    return `<li data-r="${id}" data-n="${need}"><span class="ri">${gold ? '💰' : icon(it)}</span><span class="rn">${gold ? L('ذهب') : it.n}</span><span class="rq"></span><span class="rs"></span></li>`;
  };
  return `<div class="reqs-h">${L('المتطلبات')}</div><ul class="reqs">${rows.map(li).join('')}</ul>`;
}
// Fills in the have / need numbers; runs on every screen update so they stay current.
function updReqs() {
  document.querySelectorAll('.reqs li[data-r]').forEach(el => {
    const id = el.dataset.r, need = +el.dataset.n, got = id === 'gold' ? S.gold : have(id), ok = got >= need;
    el.className = ok ? 'ok' : 'no';
    el.children[2].innerHTML = `<b>${fmt(got)}</b> / ${fmt(need)}`;
    el.children[3].textContent = ok ? '✔' : L`ينقصك ${fmt(need - got)}`;
  });
}
function viewSmith() {
  let h = L`<div class="panel"><div class="ph"><h2>🔨 ورشة الحداد قاسم</h2><span class="stat">خصم الصداقة ${3 * hearts('smith')}%</span></div>
  <p class="hint">كل تطوير يحتاج ذهباً ومعدناً من المنجم. المعادن مقفلة 🔒 في السوق افتراضياً حتى لا تبيعها بالخطأ.</p><div class="smith-scene" aria-hidden="true">${icon("npc-smith-1",64)}${icon("anvil",64)}${icon("iron",64)}</div>`;
  h += afBox();
  // Two groups: work tools, and the guild's fighting gear (sword and armour; more will join later, marked guild: 1).
  const shown = TOOLS.filter(t => !(t.id === 'rod' && S.leg.gen < 2));
  h += L('<h3>🧰 أدوات العمل</h3>') + '<div class="grid">' + shown.filter(t => !t.guild).map(toolCard).join('') + '</div>';
  h += L('<h3>⚔️ عدة القتال (النقابة)</h3>') + '<div class="grid">' + shown.filter(t => t.guild).map(toolCard).join('') + '</div>';
  return h + '</div>';
}
// The tool's own legendary picture (adamantite one until its legendary art exists).
function afPic(id) { const t = TOOLS.find(x => x.id === id) || {}, k = ART[id + '-7'] || PX[id + '-7'] ? id + '-7' : t.art || id + '-6'; return icon(k, 26); }
// The auto-forge box: buy it, or pick a tool and a target and let it run.
function afBox() {
  let h = L('<div class="lgbox afbox"><b>🤖 الصياغة التلقائية</b>');
  if (!S.leg.afOwn) return h + L`<small>اختر أداة أسطورية والنسبة اللي تبيها، وقاسم يعيد الصياغة بنفسه لين توصل لها أو تخلص الخامات. تُشترى مرة وحدة وتبقى للعائلة كل الأجيال.</small>
    <div class="row">${costBtn('afBuy', '', AF_COST, L`🤖 اشترِ (${fmt(AF_COST)}💰)`)}</div></div>`;
  const j = S.af;
  if (j) return h + L`<div class="kv"><span>${afPic(j.t)} ${LEG_TOOLS[j.t]}</span><span>+${lgv(j.t)}% ← الهدف ${j.goal}%</span></div>
    <div class="kv"><span>المحاولات</span><span>${fmt(j.n)}</span></div>
    <div class="row"><button class="btn red" data-a="afStop">⏹️ أوقف</button></div></div>`;
  const ts = afTools();
  if (!ts.length) return h + L('<small>طوّر أداة إلى أدامانتيت أول عشان تقدر تصيغها.</small></div>');
  if (!ts.some(t => t.id === AF_UI.t)) AF_UI.t = ts[0].id;
  const opts = ts.map(t => `<option value="${t.id}" ${t.id === AF_UI.t ? 'selected' : ''}>${LEG_TOOLS[t.id]}${lgv(t.id) ? ` (+${lgv(t.id)}%)` : ''}</option>`).join('');
  return h + L`<small>كل محاولة بسعر إعادة الصياغة العادي. توقف لحالها إذا وصلت النسبة أو خلصت الخامات.</small>
    <div class="row afrow"><select data-af="t" aria-label="الأداة">${opts}</select>
    <label>الهدف <input class="mk-q" type="number" min="5" max="100" step="1" inputmode="numeric" data-af="goal" value="${esc(AF_UI.goal)}">%</label></div>
    <div class="row"><button class="btn gold" data-a="afStart">▶️ ابدأ</button></div></div>`;
}
function toolCard(t) {
  let h = '';
  {
    const l = S.tools[t.id] || 0, ti = k => { const key = t.art || t.id + '-' + k; return ART[key] || PX[key] ? icon(key, 48) : `<span class="tool-emoji">${t.e}</span>`; };
    const lv = l >= 6 ? lgv(t.id) : 0, rar = LEG_RAR[lgTier(lv)];
    // The legendary picture is <id>-7 once its art exists; until then the adamantite one, in the roll's colour frame.
    const top = lv ? `<span class="lgf ${rar.c}">${ART[t.id + '-7'] || PX[t.id + '-7'] ? icon(t.id + '-7', 48) : ti(6)}</span>` : ti(l);
    h += L`<div class="card ${lv ? 'lgcard ' + rar.c : ''}"><div class="top"><span class="big">${top}</span><div class="meta"><b>${lv ? LEG_TOOLS[t.id] : t.n + ' ' + TIER[l]}</b><small>${lv ? L`<span class="lgv ${rar.c}">+${lv}% قوة • ${rar.n}</span>` : L`المستوى ${l} من 6`}</small></div></div>
      <div class="kv nowrow"><span>✅ الحالي</span><span>${t.eff(l, lv ? lf(t.id) : 1)}</span></div>`;
    if (l < 6) {
      const c = toolCost(l + 1), ok = S.gold >= c.gold && have(c.ore) >= c.qty;
      h += `<div class="tool-compare">${ti(l)}<span aria-hidden="true">${LANG === 'ar' ? '←' : '→'}</span>${ti(l + 1)}</div>`;
      h += L`<div class="kv"><span>⬆️ التالي: ${TIER[l + 1]}</span><span>${t.eff(l + 1)}</span></div>
        ${reqList([['gold', c.gold], [c.ore, c.qty]])}
        <div class="row"><button class="btn gold" data-a="upgrade" data-v="${t.id}" ${ok ? '' : 'disabled'}>🔨 طوّر</button></div>`;
    } else {
      h += L`<div class="lgbox"><b>⚒️ الصياغة الأسطورية: ${LEG_TOOLS[t.id]}</b>
        <small>${lv ? L('إعادة الصياغة بـ10% من السعر، وتعطي نسبة جديدة مكان القديمة.') : L('تصير أداة أسطورية بقوة زيادة من 5% لين 100% على تأثيرها.')} تنعاد للأدامانتيت مع الجيل الجديد.</small>
        <small class="lgodds"><span class="lgv w">⚪ 5–29% (58%)</span> <span class="lgv b">🔵 30–59% (22%)</span> <span class="lgv p">🟣 60–99% (19.5%)</span> <span class="lgv g">🟡 100% (0.5%)</span></small>
        ${reqList(lgCost(t.id))}
        <div class="row"><button class="btn gold" data-a="forge" data-v="${t.id}" ${lgCanPay(t.id) ? '' : 'disabled'}>${lv ? L('⚒️ أعد الصياغة') : L('⚒️ صياغة أسطورية')}</button></div></div>`;
    }
    h += '</div>';
  }
  return h;
}

/* ----- السوق ----- */
function viewMarket() {
  // Every sellable item the player has had shows here, even at zero, so it can be locked before it comes in.
  const ids = Object.keys(ITEMS).filter(id => have(id) > 0 || (S.seen[id] && ITEMS[id].price && CAT_NAMES[ITEMS[id].cat]));
  let total = 0; ids.forEach(id => { if (!S.locked[id]) total += sellPrice(id) * have(id); });
  let h = L`<div class="panel"><div class="ph"><h2>🛒 السوق والمخزن</h2>
    <button class="btn gold" data-a="shipAll">💰 بيع كل غير المقفل (<span id="mk_total">${fmt(total)}</span>💰)</button></div>
    ${dealCrop() ? L`<p class="hint">🧺 تاجر الموسم يشتري ${CROP[dealCrop()].e} ${CROP[dealCrop()].n} بـ ×3 السعر هذا الموسم.</p>` : ''}<p class="hint">🔒 = محمي من البيع الجماعي ومن صندوق الشحن ومن الأكل التلقائي. ${S.bld.bin ? L('📦 صندوق الشحن يبيع غير المقفل كل صباح.') : L('ابنِ صندوق الشحن في القرية ليبيع عنك تلقائياً.')}</p>${owned('bin') ? `<div class="row">${togBtn('bin')}</div>` : ''}`;
  h += oreShop();
  if (!ids.length) return h + L('<p class="hint">المخزن فارغ. ازرع واحصد أولاً!</p></div>');
  for (const cat of Object.keys(CAT_NAMES)) {
    const list = ids.filter(id => ITEMS[id].cat === cat); if (!list.length) continue;
    h += `<h3>${CAT_NAMES[cat]}</h3><div class="inv">`;
    for (const id of list) {
      const it = ITEMS[id];
      h += L`<div class="it"><button class="lock" data-a="lock" data-v="${id}" title="قفل/فتح">${S.locked[id] ? icon('icon-locked', 26) : icon('icon-sellable', 26)}</button><span class="e">${icon(it)}</span>
        <div class="nm"><b>${it.n}</b> × <span id="inv_${id}">${fmt(have(id))}</span><small>${fmt(sellPrice(id))}💰 للواحدة</small></div>
        <input class="mk-q" type="number" min="1" step="1" inputmode="numeric" data-q="${id}" value="${esc(MK_Q[id] || 1)}" aria-label="الكمية"><button class="btn ghost sm" data-a="sellN" data-v="${id}" ${have(id) ? '' : 'disabled'}>بيع</button><button class="btn sm gold" data-a="sellAll" data-v="${id}" ${have(id) ? '' : 'disabled'}>الكل</button></div>`;
    }
    h += '</div>';
  }
  return h + '</div>';
}
/* Ore merchant (a gold sink for late generations): sells mithril and adamantite for the legendary forge.
   Fixed prices, far above what the ores sell for. Shows once the player has found adamantite. */
const ORE_SHOP = { mithril: 2e6, adamant: 5e6 };
function oreShop() {
  if (!S.seen.adamant) return '';
  let h = L`<h3>🧳 تاجر الخامات</h3><p class="hint">يبيع خامات الصياغة الأسطورية بالذهب. غالية، بس توفر عليك الحفر.</p><div class="row">`;
  for (const id in ORE_SHOP) for (const n of [10, 100]) h += costBtn('buyOre', id + ':' + n, ORE_SHOP[id] * n, `${icon(ITEMS[id])} ${ITEMS[id].n} ×${n} (${fmt(ORE_SHOP[id] * n)}💰)`, 'ghost');
  return h + '</div>';
}
// The amount typed in each market row, kept while the market redraws.
const MK_Q = {};
document.addEventListener('input', e => { const d = e.target.dataset || {}; if (d.q) MK_Q[d.q] = e.target.value; if (d.af) AF_UI[d.af] = e.target.value; });
document.addEventListener('change', e => { const d = e.target.dataset || {}; if (d.af) AF_UI[d.af] = e.target.value; });
document.addEventListener('keydown', e => {
  const q = e.key === 'Enter' && e.target.dataset && e.target.dataset.q;
  if (q) { const b = document.querySelector(`[data-a=sellN][data-v="${q}"]`); if (b && !b.disabled) b.click(); }
});
function updMarket() {
  let total = 0;
  for (const id in S.inv) {
    const el = $('inv_' + id); if (el) el.textContent = fmt(have(id));
    if (!S.locked[id]) total += sellPrice(id) * have(id);
  }
  const t = $('mk_total'); if (t) t.textContent = fmt(total);
}

/* ----- القرية ----- */
function viewVillage() {
  let h = (typeof weeklyPanel === 'function' ? weeklyPanel() : '') + L`<div class="panel"><div class="ph"><h2>🏘️ أهل وادي الصدى</h2></div>
  <p class="hint">أهدِ كل شخص ما يحبه مرة واحدة يومياً. كل قلبين تقريباً يمنحك مكافأة دائمة (حتى 10 قلوب). اللي يحبونه يتغير كل موسم، ولو ما أهديت أحد لمدة نص موسم يزعل ويقل حبه (الوقت اللي تكون فيه برا اللعبة ما ينحسب).</p>
  ${P('q_twin') && !(S.spouse && S.friend) ? twinIcon(L('<p class="hint">🌟 توأم الروح ينفتح لما يكون عندك زوج وصديق عمر.</p>')) : ''}${!S.gender ? L`<div class="zonebox"><b>🧑 حدد شخصيتك</b> <small class="hint">عشان يظهر لك خيار الزواج وصداقة العمر مع أهل القرية</small>${genderPick('setGender', null)}</div>` : ''}<div class="grid">`;
  for (const np of NPCS) {
    const st = S.npc[np.id] || { pts: 0, gd: 0 }, hr = Math.floor(st.pts / 100), half = st.pts % 100 >= 50, today = st.gd === dayAbs();
    let hs = '';
    for (let i = 0; i < 10; i++) hs += i < hr ? '❤' : (i === hr && half) ? '<span class="half">❤</span>' : '♡';
    h += L`<div class="card npc-card"><button class="npc-info" data-a="npcInfo" data-v="${np.id}" title="القصة" aria-label="القصة">?</button><div class="top"><span class="big">${ART['npc-' + np.id + '-0'] ? icon('npc-' + np.id + '-' + Math.min(2,Math.floor(hr/4)),96) : `<span class="tool-emoji npc-emoji">${np.e}</span>`}</span><div class="meta"><b>${np.n}</b><small class="npc-role">${np.role}</small>
      <div class="hearts">${hs}</div><small>المكافأة: ${np.perk(hearts(np.id))}${isTwin(np.id) ? twinIcon(L(' (×2.5 🌟)')) : S.spouse === np.id ? L(' (مضاعفة 💍)') : S.friend === np.id ? L(' (مضاعفة 🤝)') : ''}</small></div></div>
      ${seasonLine(np)}<div class="say">«${np.lines[Math.min(2, Math.floor(hr / 4))]}»</div><div class="gifts">`;
    const gf = giftsOf(np), left = giftDaysLeft(np);
    const gl = [[gf.love, L('❤️ يعشقه هالموسم: +1 قلب'), 'gold'], [gf.like, L('💗 يحبه هالموسم: +½ قلب'), 'ghost']];
    for (const [it, lab, cls] of gl) {
      const I = ITEMS[it];
      h += `<button class="btn ${cls} sm" data-a="gift" data-v="${np.id}:${it}" ${today || have(it) < 1 || st.pts >= 1000 ? 'disabled' : ''}>🎁 ${icon(I)} ${I.n} (${fmt(have(it))}) — ${lab}</button>`;
    }
    const kid = KING_GIFT[np.id], K = kid && ITEMS[kid];
    if (K) {
      const done = st.kk === seasonKey();
      h += `<button class="btn royal sm" data-a="kingGift" data-v="${np.id}" ${done || have(kid) < 1 || st.pts >= 1000 ? 'disabled' : ''}>👑 ${icon(K)} ${K.n} (${fmt(have(kid))}) — ${done ? L('أهديته هالموسم') : L('هدية ملكية: +5 قلوب، مرة كل موسم')}</button>`;
    }
    let mar = '';
    if (S.spouse === np.id) mar = L('<p class="okline">💍 شريك حياتك — مكافأته مضاعفة ويساعدك (+10% لكل الإنتاج)</p>');
    else if (S.friend === np.id) mar = np.g === 'f' ? L('<p class="okline">🤝 صديقة عمرك — مكافأتها مضاعفة وتساعدك (+10% لكل الإنتاج)</p>') : L('<p class="okline">🤝 صديق عمرك — مكافأته مضاعفة ويساعدك (+10% لكل الإنتاج)</p>');
    else if (isTwin(np.id)) mar = twinIcon(np.g === 'f' ? L('<p class="okline">🌟 توأم روحك — مكافأتها ×2.5 وحبها ما يقل أبد</p>') : L('<p class="okline">🌟 توأم روحك — مكافأته ×2.5 وحبه ما يقل أبد</p>'));
    else if (twinOpen() && st.pts >= 1000) mar = `<div class="row">${costBtn('soulTwin', np.id, TWIN_COST, twinIcon(L`🌟 توأم الروح (${fmt(TWIN_COST)}💰)`), 'gold')}</div>`;
    else if (canWed(np) && st.pts >= 1000 && !S.spouse) mar = S.leg.gen >= 5 ? `<div class="row">${costBtn('marry', np.id, 50000, L('💍 اطلب الزواج (50,000💰)'), 'red')}</div>` : L('<small class="hint">💍 الزواج ينفتح في الجيل الخامس</small>');
    else if (canBond(np) && st.pts >= 1000 && !S.friend) mar = S.leg.gen >= 5 ? `<div class="row">${costBtn('befriend', np.id, 50000, L('🤝 اطلب صداقة العمر (50,000💰)'), 'gold')}</div>` : L('<small class="hint">🤝 صداقة العمر تنفتح في الجيل الخامس</small>');
    const sad = bonded(np.id) || st.pts <= 0 || donorOn() ? '' : left <= 0 ? L('<small class="hint warnline">💔 زعلان: يقل حبه كل يوم لين تهديه</small>') : left <= 2 ? L`<small class="hint">⏳ يزعل بعد ${left} يوم لو ما أهديته</small>` : '';
    h += `</div>${today ? L('<small class="hint">✔ أهديته اليوم، ارجع بكرة</small>') : ''}${sad}${mar}</div>`;
  }
  h += '</div></div>' + fundPanel();
  h += L`<div class="panel"><div class="ph"><h2>🏗️ المباني والعمال</h2><div class="row" style="margin:0"><button class="btn ghost sm" data-a="allAuto" data-v="off">⏸️ إيقاف كل التلقائي</button><button class="btn ghost sm" data-a="allAuto" data-v="on">🟢 تشغيل الكل</button></div></div><p class="hint">هنا تصبح اللعبة "idle" فعلاً: وظّف من يعمل عنك. تقدر توقف أي عامل مؤقتاً لو تبغى تجرب شي بنفسك.</p><div class="grid">`;
  for (const b of BUILDINGS) {
    const l = S.bld[b.id] || 0, max = b.max || 1, c = bCost(b), done = l >= max, need = b.req && !S.bld[b.req];
    h += `<div class="card"><div class="top"><span class="big">${icon(b.art || 'building-' + b.id,64)}</span><div class="meta"><b>${b.n}</b>${max > 1 ? ` (${l}/${max})` : ''}<small>${b.desc}</small>${b.cover ? L`<small class="hint">يغطي ${Math.round(WORK_COVER[l] * 100)}% من الحقل${l < 5 ? L` ← ${Math.round(WORK_COVER[l + 1] * 100)}%` : ''}</small>` : ''}</div></div>
      <div class="row">${done ? L('<span class="stat">✅ مكتمل</span>') : need ? L`<span class="stat">يتطلب ${BUILDINGS.find(x => x.id === b.req).n}</span>` : costBtn('build', b.id, c, `${l ? L('تطوير') : L('شراء')} (${fmt(c)}💰)`)}${l && TOGGLES[b.id] ? togBtn(b.id) : ''}</div></div>`;
  }
  return h + '</div></div>';
}

// The village fund and the Donor (see donLv). Levels stay with the family; the Donor lasts until the season ends.
function fundPanel() {
  const l = donLv(), c = donCost(l);
  let n = 0, sum = 0; while (n < 200 && sum + donCost(l + n) <= S.gold) { sum += donCost(l + n); n++; }
  return (L`<div class="panel fund"><div class="ph"><h2>🏛️ صندوق القرية</h2><span class="stat">المستوى <b>${l}</b> • +${l}% لكل الإنتاج</span></div>
  <p class="hint">تبرعك يبني القرية للأبد: كل مستوى يعطي +1% سرعة للمزرعة والحظيرة والمنجم والبحيرة، ويبقى مع العائلة في كل الأجيال. ما له حد، وكل مستوى سعره ضعف اللي قبله.</p>
  <div class="row">${costBtn('donate', '1', c, L`🏛️ تبرّع (${fmt(c)}💰) ← +${l + 1}%`)}${n > 1 ? `<button class="btn ghost" data-a="donate" data-v="all">${L`تبرّع ×${n} (${fmt(sum)}💰)`}</button>` : ''}</div>
  <h3>🤝 المتبرع</h3>
  <p class="hint">${donorOn() ? L('✅ أنت المتبرع هالموسم: ما أحد يزعل ولا ينقص حبه لين يخلص الموسم.') : L('ادفع للقرية، وما أحد يزعل ولا ينقص حبه لين يخلص هالموسم، حتى لو ما أهديته.')}</p>
  <div class="row">${donorOn() ? '' : costBtn('donor', '', DONOR_COST, L`🤝 كن المتبرع هالموسم (${fmt(DONOR_COST)}💰)`)}<button class="btn ${S.leg.donorAuto ? 'gold' : 'ghost'} sm" data-a="donorAuto">${S.leg.donorAuto ? '✅' : '⬜'} ${L('تبرّع تلقائي كل موسم')}</button></div>
  ${S.leg.donorAuto ? L('<p class="hint">🔁 كل ما يبدأ موسم جديد يدفع المتبرع عنك تلقائياً، وتبقى القلوب ما تنقص. يبقى شغّال حتى بعد التقاعد.</p>') : ''}</div>`)
    .replaceAll('🏛️', icon('icon-fund', 28)).replaceAll('🤝', icon('icon-donor', 24));
}

/* ----- المزيد ----- */
function viewSettings() {
  return L`<div class="two"><div class="panel"><h2>📖 كيف تلعب</h2><ul class="guide">
    <li>🌱 <b>ازرع</b> البذور واحصدها ثم <b>بعها</b> في السوق. اسقِ الأحواض لتنمو أسرع.</li>
    <li>🏘️ في <b>القرية</b> وظّف عمال حصاد وزراعة وصندوق شحن — بعدها المزرعة تشتغل وأنت غائب.</li>
    <li>🐄 اشترِ <b>حيوانات</b> تنتج دخلاً ثابتاً، ودلّلها لتبقى سعيدة.</li>
    <li>⛏️ احفر في <b>المنجم</b> لتجمع المعادن، ثم طوّر أدواتك عند <b>الحداد</b>.</li>
    <li>⚔️ في <b>النقابة</b> قاتل في الزنزانة طابقاً بعد طابق، وخذ مهمات لترفع رتبتك من F إلى S.</li>
    <li>🎁 أهدِ أهل القرية ما يحبون لتحصل على مكافآت دائمة.</li>
    <li>🌳 لما تكبر، <b>تقاعد</b> من صفحة الإرث: ولدك يبدأ من جديد لكن أقوى بنجوم الإرث وقطع الإرث، وكل جيل يفتح محتوى جديد.</li>
    <li>💤 اللعبة تكمل حتى لو أغلقت الصفحة (حتى ${12 + 6 * P('t_offline')} ساعة) وتحفظ تلقائياً كل 10 ثوانٍ.</li>
  </ul></div>
  <div class="panel"><h2>📊 الإحصائيات</h2><div id="statsBox"></div>
    <h3>💾 الحفظ</h3><div id="saveBox"></div>
    <h3>🧑 شخصيتك</h3>${S.spouse ? L`<p class="hint">${S.gender ? GENDER[S.gender].e + ' ' + GENDER[S.gender].n : ''} — متزوج${gv('', L('ة'))} من ${NPC_BY[S.spouse].n} 💍</p>` : L`${genderPick('setGender', S.gender)}<p class="hint">يحدد من تقدر تتزوج من أهل القرية. ولدك أو بنتك في الجيل القادم تختاره عند التقاعد.</p>`}${langPick()}${litePanel()}${sitePanel()}${typeof tutPanel === 'function' ? tutPanel() : ''}${typeof audioPanel === 'function' ? audioPanel() : ''}${typeof statsPanel === 'function' ? statsPanel() : ''}${typeof cloudPanel === 'function' ? cloudPanel() : ''}</div></div>`;
}
// Save section: with a cloud account the save takes care of itself and the file is tucked away;
// without one, the file buttons are the backup, with a nudge to link an account.
function savePanel() {
  const cloud = typeof CLOUD !== 'undefined' && CLOUD.user;
  const files = `<div class="row"><button class="btn gold" data-a="saveDownload">${L('⬇️ نزّل ملف الحفظ')}</button><button class="btn blue" data-a="saveUpload">${L('⬆️ ارفع ملف حفظ')}</button></div>`;
  const reset = `<div class="row"><button class="btn red sm" data-a="reset">${L('🗑️ بدء من جديد')}</button></div>`;
  if (cloud) return `<p class="hint">${L('✅ حفظك ينحفظ تلقائياً في هذا الجهاز وفي السحابة. ما تحتاج تسوي شي.')}</p>
    <details class="save-more"><summary>${L('نسخة احتياطية يدوية')}</summary>${files}<p class="hint" id="backupAge"></p>${reset}</details>`;
  const linkable = typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.ready && !CLOUD.err;
  return `<p class="hint">${linkable ? L('حفظك في هذا الجهاز بس. اربط حسابك من «☁️ الحساب والحفظ السحابي» تحت عشان ينحفظ في السحابة، أو نزّل ملف احتياطي.') : L('حفظك ينحفظ تلقائياً في هذا الجهاز. نزّل ملف احتياطي عشان ما يضيع لو انمسحت بيانات المتصفح.')}</p>
    ${files}<p class="hint" id="backupAge"></p>${reset}`;
}
function updSettings() {
  const sb = $('saveBox');
  if (sb) { const html = savePanel(); if (sb._html !== html) { sb._html = html; const open = sb.querySelector('details[open]'); sb.innerHTML = pixelHTML(html); if (open) { const d = sb.querySelector('details'); if (d) d.open = true; } } }
  const ba = $('backupAge');
  if (ba) { const t = backupAt(), txt = t ? L`💡 ملف الحفظ يحمي تقدمك لو انمسحت بيانات المتصفح أو غيّرت جهازك. آخر نسخة نزّلتها: قبل ${ftime((Date.now() - t) / 1000)}` : L('💡 ملف الحفظ يحمي تقدمك لو انمسحت بيانات المتصفح أو غيّرت جهازك. ما نزّلت أي نسخة للحين.'); if (ba.textContent !== txt) ba.textContent = txt; }
  const b = $('statsBox'); if (!b) return;
  const st = S.stats;
  const rows = [[L('⏳ وقت اللعب'), ftime(st.play)], [L('💰 مجموع الأرباح'), fmt(st.earned)], [L('🧺 محاصيل محصودة'), fmt(st.harvests)],
    [L('🥚 منتجات حيوانية'), fmt(st.products)], [L('🪨 صخور مكسورة'), fmt(st.blocks)], [L('💀 وحوش مهزومة'), fmt(st.kills)],
    [L('📜 مهمات منجزة'), fmt(st.quests)], [L('🎣 أسماك مصطادة'), fmt(st.fish)], [L('🕳️ أعلى طابق (العائلة)'), bestDun()], [L('⛏️ أعمق منجم (العائلة)'), bestMine()],
    [L('🌳 الجيل الحالي'), S.leg.gen], [L('⭐ مجموع نجوم الإرث'), fmt(S.leg.totalStars)], [L('🏅 الإنجازات'), `${Object.keys(S.leg.ach).length}/${ACH.length}`],
    [L('🧪 حالة الحفظ'), S.leg.mod ? L('معدّل من برّا اللعبة') : L('أصلي ✅')]];
  visualText(b, rows.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join(''));
}

/* ----- البفات الحالية ----- */
let sideTab = 'log', lastBuffs = '';
// A speed card on the buffs panel: the two buckets, each with its own total, then the total of both.
function speedGroup(title, kind, extra = []) {
  const s = speedSrc(kind), part = (name, list) => {
    const act = list.filter(([, b]) => Math.abs(b) > 0.0001);
    return `<div class="bfl bsub"><span>${name}</span><span>×${bucket(list).toFixed(2)}</span></div>` +
      (act.length ? act.map(([n, b]) => `<div class="bfl"><span>${n}</span><span>${pct(1 + b)}</span></div>`).join('') : L('<div class="bfl"><span>لا توجد مكافآت بعد</span></div>'));
  };
  const pen = s.pen.filter(([, f]) => f !== 1);
  return `<div class="bf"><div class="bfh"><b>${title}</b><span class="bft">×${speedMult(kind).toFixed(2)}</span></div>
    ${part(L('🧑‍🌾 هذا الجيل'), s.gen)}${part(L('🌳 العائلة'), s.fam)}
    ${pen.map(([n, f]) => `<div class="bfl"><span>${n}</span><span class="neg">×${f}</span></div>`).join('')}
    ${extra.map(([n, v]) => `<div class="bfl ex"><span>${n}</span><span>${v}</span></div>`).join('')}</div>`;
}
function pct(f) { const v = Math.round((f - 1) * 100); return (v >= 0 ? '+' : '') + v + '%'; }
function buffGroup(title, src, extra = []) {
  const act = src.filter(([, f]) => Math.abs(f - 1) > 0.0001);
  const total = src.reduce((a, [, f]) => a * f, 1);
  return `<div class="bf"><div class="bfh"><b>${title}</b><span class="bft">×${total.toFixed(2)}</span></div>
    ${act.length ? act.map(([n, f]) => `<div class="bfl"><span>${n}</span><span class="${f < 1 ? 'neg' : ''}">${pct(f)}</span></div>`).join('') : L('<div class="bfl"><span>لا توجد مكافآت بعد</span></div>')}
    ${extra.map(([n, v]) => `<div class="bfl ex"><span>${n}</span><span>${v}</span></div>`).join('')}</div>`;
}
function buffsHtml() {
  if (inInd()) return indBuffsHtml(); // the factory shows its own (industry.js)
  const g = buffGroup;
  let h = '';
  h += speedGroup(L('🌱 سرعة نمو المحاصيل'), 'grow',
    [[L('💧 الحوض المسقي'), '×' + waterMult().toFixed(2)], [L('🍂 خارج الموسم'), ghCount() ? L`×0.50 (🏡 بدون عقوبة في ${ghCount()} أحواض)` : '×0.50'],
      [L('🧺 فرصة حصاد مضاعف'), Math.round(S.skills.farm.l + 3 * H('seedbag')) + '%'], ...(P('f_golden') ? [[L('✨ فرصة محصول ذهبي'), P('f_golden') + '%']] : [])]);
  h += speedGroup(L('🐄 سرعة الإنتاج الحيواني'), 'ranch',
    [[L('❤️ السعادة'), L('من ×0.5 إلى ×1.5') + (on('rancher') ? L(' (الراعي يبقيها كاملة)') : '')], ...(P('r_cost') ? [[L('🏷️ سعر الحيوانات'), '-' + 10 * P('r_cost') + '%']] : [])]);
  h += speedGroup(L('⛏️ قوة الحفر'), 'mine',
    [[L('💎 فرصة الجواهر'), '×' + ((1 + 0.5 * P('m_gem')) * (1 + 0.2 * CC('underground'))).toFixed(2)], [L('🪨 أقصى عمق للفأس'), PICK_CAP[S.tools.pick] > 1e8 ? '∞' : PICK_CAP[S.tools.pick]]]);
  if (S.leg.gen >= 2) h += speedGroup(L('🎣 قوة الصيد'), 'fish');
  h += g(L('💰 الذهب من كل المصادر'), [[L`👴 العمدة (${hearts('mayor')} قلوب) — البيع فقط`, 1 + 0.02 * hearts('mayor')], [L('🌳 مساومة'), 1 + 0.1 * P('t_price')], [L('🪙 العملة القديمة'), 1 + 0.05 * H('coin')],
    [L('🙅 مكافأة تحدي بدون عمال'), 1 + 0.1 * CC('noworkers')], [L`🏅 الإنجازات (${Object.keys(S.leg.ach).length})`, achMult()], [L('🌈 بركة الوادي'), bless()], [L('⚠️ تحدي القحط (نشط)'), inCh('poverty') ? 0.5 : 1]]);
  h += g(L('⚔️ الهجوم والصحة'), [[L('🌳 دم المحارب'), 1 + 0.15 * P('w_power')], [L('⚔️ مكافأة تحدي المحارب'), 1 + 0.1 * CC('warrior')], [L('🌈 بركة الوادي'), bless()]],
    [[L('🗡️ الهجوم'), fmt(heroAtk()) + L` (السيف +${fmt(SWORD[S.tools.sword] * lf('sword'))})`], [L('🛡️ الدفاع'), fmt(heroDef()) + L` (الدرع +${fmt(ARMOR_DEF[S.tools.armor] * lf('armor'))})`],
      [L('❤️ الصحة القصوى'), fmt(heroMaxHp()) + (hearts('leila') ? L` (ليلى +${5 * hearts('leila')}%)` : '')], [L('⚡ القوة'), fmt(heroPower())],
      [L('💤 التعافي'), (S.bld.inn ? '6' : '3') + L('% بالثانية خارج القتال')], [L('🍽️ الطعام يشفي'), S.bld.kitchen ? L('×2 (المطبخ)') : '×1']]);
  h += g(L('📜 مكافآت المهمات'), [[L`🤺 رعد (${hearts('raad')} قلوب)`, 1 + 0.04 * hearts('raad')], [L('🌳 سمعة العائلة'), 1 + 0.25 * P('w_quest')], [L('💰 مضاعف الذهب'), goldMult()]],
    [[L('📋 خانات المهمات'), questSlots()], [L('🎖️ رتبتك'), RANKS[rankIdx()][0]]]);
  h += g(L('✨ الخبرة'), [[L('📜 مذكرات الجد'), 1 + 0.1 * H('diary')], [L`🏅 الإنجازات`, achMult()], [L('🌈 بركة الوادي'), bless()]],
    [[L('🌾 إضافي للزراعة'), '+' + 30 * P('f_xp') + '%'], [L('⚔️ إضافي للقتال'), '+' + 30 * P('w_xp') + '%']]);
  h += g(L('⭐ نجوم الإرث'), [[L('🌳 حكمة الأجيال'), 1 + 0.1 * P('t_stars')], [L('📿 قلادة الحظ'), 1 + 0.05 * H('amulet')], [L('💸 مكافأة تحدي القحط'), 1 + 0.1 * CC('poverty')], [L('🌈 بركة الوادي'), bless()]]);
  h += g(L('🏘️ أخرى'), [], [[L('🔨 خصم الحداد'), 3 * hearts('smith') + '%'], [L('😴 أقصى تقدم أثناء الغياب'), (12 + 6 * P('t_offline')) + L(' ساعة')], [L('🐄 سعة الحظيرة'), barnCap() + L(' لكل نوع')]]);
  return h;
}
function renderSide() {
  $('sideLog').classList.toggle('hidden', sideTab !== 'log');
  $('buffs').classList.toggle('hidden', sideTab !== 'buffs');
  document.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.v === sideTab));
  if (sideTab === 'buffs') { const h = buffsHtml(); if (h !== lastBuffs) { lastBuffs = h; $('buffs').innerHTML = pixelHTML(h); } }
}

/* ----- البحيرة ----- */
function viewLake() {
  if (S.leg.gen < 2) return L`<div class="panel"><div class="ph"><h2>🎣 البحيرة</h2></div>
    <p class="hint">🔒 خلف التلال بحيرة صافية ما اقترب منها أحد من زمن جدك... تنفتح في <b>الجيل الثاني</b>. تقاعد من صفحة 🌳 الإرث لتفتحها.</p></div>`;
  const sp = curSpot();
  let h = L`<div class="panel"><div class="ph"><h2>🎣 ${sp.e} ${sp.n}</h2>${skillBar('fish')}</div>
  <p class="hint">ارمِ السنارة لتصطاد، أو وظّف صيادين يصطادون عنك. كل صيدة لها ندرة ووزن: النادرة والأسطورية تعطيك أكثر من سمكة، وكل ما كانت أثقل كانت أغلى. مستوى الصيد يفتح أسماكاً وأماكن جديدة، والسنارة (عند الحداد) تزيد القوة وفرصة النادر. وأحياناً يطلع صندوق كنز 🧰!</p>
  <div class="spots">${SPOTS.map(s => S.skills.fish.l >= s.lvl ? `<button class="btn ${s.id === sp.id ? 'gold' : 'ghost'} sm" data-a="spot" data-v="${s.id}">${s.e} ${s.n}</button>` : L`<button class="btn ghost sm" disabled>🔒 ${s.n} (صيد ${s.lvl})</button>`).join('')}</div>
  <div class="minebox"><button class="digbtn lakebtn" data-a="cast"><span class="bobber-scene">${icon("bobber",48)}</span>اصطد!<small class="hold-hint">اضغط مطوّل ✊</small></button>
  <div class="mineinfo">
    <div class="kv"><span>العضّة</span><span id="lk_t"></span></div><div class="bar"><i id="lk_p"></i></div>
    <div class="kv"><span>آخر صيدة</span><span id="lk_last"></span></div>
    <div class="kv"><span>قوة الرمية</span><span id="lk_pow"></span></div>
    <div class="kv"><span>${icon('worker-fisher',24)} الصيادون: ${S.lake.fishers}</span><span id="lk_rate"></span></div>
    <div class="row">${S.lake.fishers >= VILLAGE_WMAX ? L`<button class="btn" disabled>✅ وصلت الحد (${VILLAGE_WMAX})</button>` : costBtn('hireFisher', undefined, fisherCost(), L`${icon('worker-fisher',24)} وظّف صياد (${fmt(fisherCost())}💰)`)}${owned('fishers') ? togBtn('fishers') : ''}</div>${indLv('boat') ? `<p class="hint">${L`⛵ القارب (مستوى ${indLv('boat')}): الصيادين أرخص ${Math.round(indDisc('boat') * 100)}%`}</p>` : ''}
    <div class="kv"><span>فرصة النادرة / الأسطورية</span><span id="lk_ch"></span></div>
  </div></div>
  <div class="baitbox"><div class="kv"><span>🪱 الطُّعم: <b id="lk_bait"></b> صيدة</span><span class="hint">يضاعف فرصة النادرة والأسطورية</span></div>
    <div class="row">${BAIT.map(id => `<button class="btn ghost sm" data-a="bait" data-v="${id}" ${have(id) >= BAIT_COST ? '' : 'disabled'}>${icon(ITEMS[id], 24)} ${BAIT_COST} ${ITEMS[id].n}</button>`).join('')}
    <button class="btn ${S.lake.autoBait ? 'gold' : 'ghost'} sm" data-a="autoBait">${S.lake.autoBait ? '✅' : '⬜'} ${L('طُعم تلقائي')}</button></div>
    <p class="hint">${L('الطُّعم التلقائي يستخدم المحصول اللي عندك منه أكثر. اقفل 🔒 المحصول في السوق عشان ما ينباع، وخصص له حقول عشان ما يخلص.')}</p></div>
  </div>`;
  const list = [...FISH.filter(f => f.spot === sp.id), ...KINGS.filter(k => k.spot === sp.id)];
  h += L`<div class="panel"><div class="ph"><h2>📖 ألبوم الأسماك</h2><span class="stat">${albumDone()}/${albumTotal()} • +${Math.round((fishMult() - 1) * 100)}% سعر السمك</span></div>
  <p class="hint">ألبوم العائلة ما يضيع مع الأجيال. اصطد كل سمكة بندراتها الثلاث (عادية ونادرة وأسطورية) وتاخذ +4% سعر السمك للأبد، وكل ملك تصطاده يعطيك +10%.</p><div class="ores album">`;
  for (const f of list) {
    const bits = albumBits(f.id), seen = bits > 0, open = f.lvl <= S.skills.fish.l;
    const dots = f.king ? `<span class="rdot r2 ${bits ? 'on' : ''}"></span>` : [0, 1, 2].map(r => `<span class="rdot r${r} ${bits & (1 << r) ? 'on' : ''}" title="${RARITY[r].n}"></span>`).join('');
    h += `<div class="ore ${seen ? 'on' : ''} ${f.king ? 'king' : ''}">${seen ? icon(f) : '<span class="unknown">❓</span>'} <b>${seen || open ? f.n : '???'}</b><div class="rdots">${dots}</div>
      <small>${open ? L`صيد ${f.lvl} • ${fmt(sellPrice(f.id))}💰` : L`🔒 صيد ${f.lvl}`}</small><small id="rec_${f.id}"></small></div>`;
  }
  return h + '</div></div>';
}
function updLake() {
  if (!$('lk_p')) return;
  sceneBg(document.querySelector('#view .minebox'), 'fish-' + curSpot().id);
  $('lk_p').style.width = (S.lake.prog / biteNeed() * 100) + '%';
  $('lk_t').textContent = `${fmt(S.lake.prog)} / ${fmt(biteNeed())}`;
  const l = S.lake.last;
  const lastCatch = $('lk_last');
  if (lastCatch._fishCount !== undefined && S.stats.fish > lastCatch._fishCount) {
    const r = l === 'treasure' ? 0 : S.lake.lastR || 0;
    floatVisual(document.querySelector('.lakebtn'), (r ? RARITY[r].n + ' ' : '') + '+' + (l === 'treasure' ? 1 : S.lake.lastN || 1) + ' ' + icon(l === 'treasure' ? 'chest' : l,24), r ? 'golden-float' : '');
    burstVisual(document.querySelector('.lakebtn'));
  }
  lastCatch._fishCount = S.stats.fish;
  const R = RARITY[S.lake.lastR || 0];
  visualText(lastCatch, !l ? '—' : l === 'treasure' ? L('🧰 صندوق كنز') : `${icon(ITEMS[l])} ${ITEMS[l].n} • ${R.n} • ${S.lake.lastKg} ${L('كغ')}${S.lake.lastN > 1 ? ` (×${S.lake.lastN})` : ''}`);
  if (S.lake.recFx) { S.lake.recFx = 0; floatVisual(document.querySelector('.lakebtn'), L('🏆 رقم قياسي!'), 'golden-float'); }
  $('lk_bait').textContent = fmt(S.lake.bait || 0);
  const ch = `<span class="rdot r1 on"></span> ${Math.round(rareChance() * 100)}% <span class="rdot r2 on"></span> ${(legChance() * 100).toFixed(1)}%`;
  if ($('lk_ch')._h !== ch) { $('lk_ch')._h = ch; $('lk_ch').innerHTML = ch; }
  const rec = S.leg.fishRec || {};
  for (const id in rec) { const el = $('rec_' + id); if (el) { const t = L`🏆 أثقل: ${rec[id]} كغ`; if (el.textContent !== t) el.textContent = t; } }
  $('lk_pow').textContent = fishPower().toFixed(1);
  $('lk_rate').textContent = L`${fisherRate().toFixed(1)} / ث`;
}

/* ----- الإرث ----- */
function viewLegacy() {
  const LG = S.leg, ch = S.gen.ch && CHALLENGES.find(c => c.id === S.gen.ch);
  let h = L`<div class="panel"><div class="ph legacy-heading"><h2>${icon("legacy-tree",56)} إرث العائلة — الجيل ${LG.gen}</h2><span class="stat starchip">${icon("legacy-crown",24)} ${fmt(LG.stars)} نجمة إرث</span></div>
  <p class="hint">لما تكبر مزرعتك تقدر تتقاعد وتسلّمها لولدك. الجيل الجديد يبدأ من الصفر لكن أقوى: نجوم الإرث تشتري مهارات دائمة، وقطع الإرث تنتقل في العائلة للأبد، وأهل القرية يتذكرون عائلتك.</p>
  <div class="two"><div>
    <div class="kv"><span>💰 ذهب هذا الجيل</span><span id="lg_e"></span></div><div class="bar gp"><i id="lg_eb"></i></div>
    <div class="kv"><span>🕳️ أعلى طابق في هذا الجيل</span><span id="lg_d"></span></div><div class="bar xp"><i id="lg_db"></i></div>
    <p class="hint">شرط التقاعد في هذا الجيل: كسب ${fmt(goldGoal())} ذهب <b>و</b> الوصول للطابق ${dunGoal()}، الاثنين مع بعض. الشرط يكبر مع كل جيل بعد الثالث. النجوم تزيد كل ما كسبت ذهب أكثر ونزلت أعمق في الزنزانة والمنجم.</p>
  </div><div class="retirebox"><div class="bigstar">${icon("legacy-crown",72)}<span class="legacy-gain-value">+<span id="lg_g"></span></span></div><small class="hint">نجوم لو تقاعدت الآن</small><small class="hint" id="lg_cap"></small>
    <button class="btn gold" data-a="retire" id="lg_btn">🌅 التقاعد وتسليم المزرعة</button><small class="hint" id="lg_why"></small></div></div>
  ${ch ? L`<div class="chbox"><b>${icon(ch)} تحدي هذا الجيل: ${ch.n}</b> — ${ch.rule}<div class="kv"><span>🎯 ${goalText(ch)}</span><span id="lg_chp"></span></div><div class="bar gp"><i id="lg_chb"></i></div></div>` : ''}
  </div>`;
  h += indLegacyCard();
  h += L`<div class="panel"><h2>🗺️ ما تفتحه الأجيال</h2><div class="road">${ROADMAP.map(([g, t]) => L`<div class="rstep ${LG.gen >= g ? 'done' : ''}"><b>${LG.gen >= g ? '✅' : '🔒'} الجيل ${g}</b><span>${t}</span></div>`).join('')}</div></div>`;
  h += L`<div class="panel"><div class="ph"><h2>${icon("legacy-tree",32)} شجرة الإرث</h2><span class="stat starchip">${icon("legacy-crown",24)} ${fmt(LG.stars)}</span></div><p class="hint">ابدأ من أول مهارة في كل فرع: كل 3 مستويات تفتح لك فرع جديد، ولما تصرف ${KS_NEED} مستويات في فرع تنفتح مهارته الخاصة ⭐. المهارات المعلّمة بـ 🌱 تطبق من بداية الجيل القادم، إلا لو اشتريتها في أول يومين من الجيل فتطبق عليك فوراً. الباقي يشتغل فوراً دائماً.</p>
  <div class="row"><button class="btn ghost sm" data-a="respec" ${S.gen.respec || !perkSpent() ? 'disabled' : ''}>↺ إعادة توزيع النقاط</button><small class="hint">${S.gen.respec ? L('استخدمتها في هذا الجيل') : L('مجانية، مرة وحدة كل جيل')}</small></div>`;
  for (const [b, bn] of Object.entries(BRANCHES)) {
    const list = PERKS.filter(x => x.b === b), lv = branchLv(b), ks = list.filter(x => x.ks); // the family branch has two
    h += L`<div class="ptree"><div class="ptree-head"><h3>${bn}</h3><span class="stat">${lv} مستوى</span></div>`;
    const tiers = [];
    for (const p of list.filter(x => !x.ks)) (tiers[perkTier(p)] = tiers[perkTier(p)] || []).push(p);
    tiers.push(ks);
    tiers.forEach((row, i) => {
      if (i) h += '<div class="plink"></div>';
      h += '<div class="ptier">' + row.map(perkCard).join('') + '</div>';
    });
    h += '</div>';
  }
  h += '</div>';
  const heirs = HEIRLOOMS.filter(x => H(x.id));
  h += L`<div class="panel"><h2>🏺 قطع الإرث</h2><p class="hint">كل ما تتقاعد تختار قطعة إرث جديدة أو تطوّر قطعة عندك. القطع ما تضيع أبداً وتنتقل من جيل لجيل.</p>
  ${heirs.length ? `<div class="grid heir-cabinet">${heirs.map(x => `<div class="card"><div class="top"><span class="big">${icon('heir-' + x.id,48)}</span><div class="meta"><b>${x.n}</b> (${H(x.id)}/${x.max})<small>${x.eff(H(x.id))}</small></div></div></div>`).join('')}</div>` : L('<p class="hint">ما عندك قطع إرث بعد. أول تقاعد يعطيك أول قطعة.</p>')}</div>`;
  h += L`<div class="panel"><h2>🏆 تحديات الأجيال</h2><p class="hint">${LG.gen < 5 ? L('🔒 تنفتح لما توصل الجيل الخامس. ') : ''}تختار التحدي عند التقاعد ويكون شرط على الجيل الجديد كامل. كل تحدي له مستويات لا نهائية: كل ما نجحته يصعب، ومكافأته تتراكم للأبد.</p>
  <div class="grid">${CHALLENGES.map(c => L`<div class="card ${LG.gen < 5 ? 'locked' : ''}"><div class="top"><span class="big">${icon('challenge-' + c.id,48)}</span><div class="meta"><b>${c.n}</b> — نجحته ${CC(c.id)} مرة
    <small>${c.rule}</small><small>🎯 القادم: ${goalText(c)}</small><small>🎁 الحالي: ${CC(c.id) ? c.rew(CC(c.id)) : L('لا شيء بعد')} • كل نجاح ${c.rew(1)}</small></div></div></div>`).join('')}</div></div>`;
  const got = ACH.filter(a => LG.ach[a.id]).length;
  h += L`<div class="panel"><div class="ph"><h2>🏅 الإنجازات</h2><span class="stat">${got}/${ACH.length} • +${got}% ذهب وخبرة</span></div>
  <div class="achs">${ACH.map(a => `<div class="ach ${LG.ach[a.id] ? 'got' : ''}"><span>${icon('ach-' + a.id,48)}</span><b>${a.n}</b><small>${a.d}</small></div>`).join('')}</div></div>`;
  if (LG.history.length) h += L`<div class="panel"><h2>👪 شجرة العائلة</h2>${LG.history.slice().reverse().map(x => L`<div class="kv"><span>الجيل ${x.gen}: <b>${esc(x.name)}</b></span><span>💰 ${fmt(x.earned)} • 🕳️ ${x.dun} • ${icon("legacy-crown",24)} +${x.stars}</span></div>`).join('')}</div>`;
  return h;
}
function perkCard(p) {
  const LG = S.leg, l = P(p.id), maxed = l >= p.max, c = perkCost(p, l), why = perkLock(p);
  const art = ART['perk-' + p.id] ? icon('perk-' + p.id, 48) : `<span class="ks-mark">${p.e}</span>`;
  return `<div class="card perk ${l ? 'has' : ''} ${why ? 'locked' : ''} ${p.ks ? 'ks' : ''}"><div class="top"><span class="big">${art}</span><div class="meta">${p.ks ? L('<small class="ks-tag">⭐ مهارة خاصة</small>') : ''}<b>${p.n}</b> ${p.ks ? '' : p.max === Infinity ? `(${l})` : `(${l}/${p.max})`}${p.start ? ' 🌱' : ''}
    <small>${p.ks ? p.eff(1) : l ? p.eff(l) : L('ما تعلمتها بعد')}</small>${p.start && !maxed ? `<small class="start-note ${startNow() ? 'now' : ''}">${startNow() ? L('🌱 لو تشتريها الحين تطبق عليك فوراً') : L('🌱 تطبق من بداية الجيل القادم')}</small>` : ''}${!maxed && !p.ks ? L`<small>التالي: ${p.eff(l + 1)}</small>` : ''}</div></div>
    <div class="row">${maxed ? L('<span class="stat">✨ مكتملة</span>') : why ? `<span class="stat">🔒 ${why}</span>` : `<button class="btn gold sm" data-a="buyPerk" data-v="${p.id}" ${LG.stars >= c ? '' : 'disabled'}>${icon("legacy-crown",24)} ${fmt(c)}</button>`}</div></div>`;
}
function updLegacy() {
  if (!$('lg_e')) return;
  const g = S.gen;
  const gg = goldGoal(), dg = dunGoal();
  $('lg_e').textContent = `${fmt(g.earned)} / ${fmt(gg)}`; $('lg_eb').style.width = Math.min(100, g.earned / gg * 100) + '%';
  $('lg_d').textContent = `${S.dun.max} / ${dg}`; $('lg_db').style.width = Math.min(100, S.dun.max / dg * 100) + '%';
  $('lg_g').textContent = fmt(starsGain());
  const capT = L`⭐ الحد لهذا الجيل: ${starCap()} نجمة (المنجم لين ${MINE_STAR_CAP})` + (P('t_stars') ? L` • 🌳 حكمة الأجيال +${10 * P('t_stars')}% على ${starCapBase()}` : '');
  if ($('lg_cap').textContent !== capT) $('lg_cap').textContent = capT;
  const can = canRetire(); $('lg_btn').disabled = !can; $('lg_why').textContent = can ? '' : L('ما حققت شرط التقاعد بعد');
  const cb = $('lg_chb');
  if (cb) {
    const c = CHALLENGES.find(x => x.id === S.gen.ch), pr = S.gen.chDone ? 1 : Math.min(1, chValue(c) / chGoal(c));
    cb.style.width = pr * 100 + '%';
    visualText($('lg_chp'), S.gen.chDone ? L('✅ أنجزته!') : `${fmt(chValue(c))} / ${fmt(chGoal(c))}`);
  }
}

function litePanel() {
  return L`<h3>🪶 الوضع الخفيف</h3><p class="hint">للجوال والأجيال العالية: يوقف المؤثرات والحركات، ويخفف رسائل السجل (المحاصيل الذهبية والصيد الأسطوري وكنوز الصيد، والمستويات إلا كل 10)، ويحدّث الشاشة أبطأ. اللعب نفسه ما يتغير، والإعداد لهذا الجهاز بس.</p>
  <div class="row"><button class="btn ${LITE ? '' : 'ghost'} sm" data-a="liteToggle">${LITE ? '✅' : '⬜'} الوضع الخفيف</button></div>`;
}
A.liteToggle = () => { setLite(!LITE); lastSig = ''; logDirty = true; toast(LITE ? L('🪶 الوضع الخفيف شغّال') : L('✨ رجعت المؤثرات')); };
const VIEWS = {
  farm: [viewFarm, updFarm, () => [S.off, S.leg.gen, zoneMode, S.bld.zoning, S.farm.plots.length, S.farm.seed, Math.min(S.skills.farm.l, 30), S.tools.can, S.season, S.weather, S.bld.harvester, S.bld.planter, S.bld.sprinkler, S.bld.greenhouse, hearts('mayor')]],
  barn: [viewBarn, updBarn, () => [S.off, Math.min(S.skills.ranch.l, 30), barnCap(), S.bld.rancher, ...ANIMALS.map(a => S.barn.n[a.id] || 0), S.barn.q, houseCount(), S.barn.focus, BREEDABLE.map(id => ['p', 'g'].map(to => breedBlock(ANIMALS.find(x => x.id === id), to)))]],
  mine: [viewMine, updMine, () => [S.off, S.mine.miners, S.tools.pick, lgv('pick'), ORES.filter(o => o.depth <= S.mine.max).length]],
  guild: [viewGuild, updGuild, () => {
    const D = S.dun, g = S.guild;
    return [D.active, D.resting, D.auto, D.autoEat, D.floor, D.max, rankIdx(), questSlots(), g.sk, mskPts(), S.tools, S.tlg, S.hero.lvl, floorCap(), eatCd(), g.active.map(q => q.id), g.board.map(q => q.id + (q.type === 'deliver' ? (have(q.item) >= q.qty) : Math.round(chanceOf(q) * 100))), S.leg.saddle && [S.leg.saddle.on, saddleLv(S.leg.saddle.on), Math.floor(((S.leg.pets[S.leg.saddle.on] || {}).sx || 0) / Math.max(1, hxpNeed(saddleLv(S.leg.saddle.on) + 1)) * 20)], S.gold >= SADDLE_COST, S.leg.titles && [S.leg.titles.cur, titleActive().join(), S.leg.titles.show, Object.keys(S.leg.titles.have || {}).length, Math.floor((S.leg.titles.xp || 0) / 1000)]];
  }],
  smith: [viewSmith, updReqs, () => [S.leg.afOwn, S.af && [S.af.t, S.af.n], S.gold >= AF_COST, S.tools, S.tlg, TOOLS.map(t => lgCanPay(t.id)), have('mithril'), have('adamant'), S.leg.gen, hearts('smith'), TOOLS.map(t => { const l = S.tools[t.id] + 1; if (l > 6) return 0; const c = toolCost(l); return S.gold >= c.gold && have(c.ore) >= c.qty; })]],
  market: [viewMarket, updMarket, () => [S.off, dealCrop(), Object.keys(S.inv).sort(), Object.keys(S.locked).sort(), S.bld.bin, hearts('mayor')]],
  village: [viewVillage, () => { if (typeof wkUpd === 'function') wkUpd(); }, () => [typeof wkSig === 'function' ? wkSig() : 0, dayAbs(), S.bld, S.npc, S.off, S.spouse, S.friend, S.twins, P('q_twin'), S.gender, S.leg.gen, donLv(), donorOn(), S.leg.donorAuto, Math.floor(Math.log2(Math.max(1, S.gold / DON_BASE))), NPCS.map(n => { const g = giftsOf(n); return [have(g.love) > 0, have(g.like) > 0, have(KING_GIFT[n.id]) > 0, (S.npc[n.id] || {}).kk === seasonKey()]; })]],
  lake: [viewLake, updLake, () => [S.off, S.lake.fishers, Math.min(S.skills.fish.l, 30), S.tools.rod, S.leg.gen, S.lake.spot, S.lake.autoBait, albumDone(), BAIT.map(id => have(id) >= BAIT_COST)]],
  legacy: [viewLegacy, updLegacy, () => { const LG = S.leg; return [LG.stars, LG.perks, S.gen.respec, startNow(), LG.heir, LG.ch, Object.keys(LG.ach).length, LG.gen, S.gen.ch, S.gen.chDone, LG.history.length, dunGoal()]; }],
  settings: [viewSettings, updSettings, () => [S.gender, S.spouse, typeof cloudSig === 'function' ? cloudSig() : 0]],
};

Object.assign(VIEWS, IND_VIEWS); Object.assign(A, IND_ACTIONS); // Industrial Age (industry.js, loaded before this file)
function render(force) {
  if (!S) return;
  const [view, upd, sig] = VIEWS[tab];
  const s = tab + JSON.stringify(sig());
  // Don't rebuild the page under an open dropdown or the auto-forge target box (it would close/clear it).
  const fe = document.activeElement, busy = !force && fe && $('view').contains(fe) && (fe.tagName === 'SELECT' || fe.dataset.af);
  if (!busy && (force || s !== lastSig)) {
    lastSig = s;
    $('view').dataset.view = tab;
    $('view').innerHTML = pageSceneMarkup(tab) + pixelHTML(view());
    renderTabs();
  }
  upd();
  for (const k of Object.keys(SKILL_N)) {
    const l = $('sk_' + k + '_l'); if (!l) continue;
    const sk = S.skills[k];
    l.textContent = sk.l; $('sk_' + k + '_b').style.width = (sk.x / xpNeed(sk.l) * 100) + '%';
    $('sk_' + k + '_t').textContent = `${fmt(sk.x)}/${fmt(xpNeed(sk.l))}`;
  }
  document.querySelectorAll('[data-cost]').forEach(b => { b.disabled = S.gold < +b.dataset.cost; });
  renderHeader();
  renderSide();
  if (logDirty && Date.now() - logDrawT > (LITE ? 2000 : 700)) { // many messages a second at high generations: redraw the list at most this often
    logDirty = false; logDrawT = Date.now();
    $('log').innerHTML = pixelHTML((inInd() ? indLogs : logs).map(l => `<li class="${l.type}"><small>${l.t}</small>${logVisualHTML(l.msg)}</li>`).join(''));
  }
}
let lastBadge = -1;
function renderHeader() {
  $('hGold').textContent = fmt(S.gold);
  $('hName').textContent = S.name || '...';
  visualText($('hDate'), L`${seasonMarkup(S.season)} ${SEASONS[S.season].n} • اليوم ${S.day}`);
  visualText($('hWeather'), `${WEATHER[S.weather].e} ${WEATHER[S.weather].n}`);
  visualText($('hClock'), '🕒 ' + clockStr());
  visualText($('hGen'), L`${icon("legacy-tree",24)} الجيل ${S.leg.gen}`);
  const hc = $('hCh'), cc = S.gen.ch && CHALLENGES.find(x => x.id === S.gen.ch);
  hc.classList.toggle('hidden', !cc);
  if (cc) visualText(hc, `${icon('challenge-' + cc.id)} ${cc.n}: ${S.gen.chDone ? L('✅ أنجزته') : Math.floor(Math.min(1, chValue(cc) / chGoal(cc)) * 100) + '%'}`);
  renderSky();
  const ready = S.farm.plots.filter((p, i) => isReady(p) && !covers('harvester', i)).length + (canRetire() ? 1000 : 0);
  checkUnlocks();
  if (ready !== lastBadge || Object.keys(tabAlerts()).join() + unlSig() + worldSig() !== tabAlertSig) { lastBadge = ready; renderTabs(); }
}

/* ---------------- السماء: الشمس والقمر ---------------- */
const SKY = [[0, '#0f1533', '#2a2f5c'], [5.6, '#141b3d', '#3b3f72'], [6.7, '#f39a63', '#fbd39a'], [8.5, '#5fb2e3', '#a9dcf0'],
  [16.8, '#5fb2e3', '#a9dcf0'], [18.7, '#b5577a', '#f2a66a'], [20.2, '#141b3d', '#3b3f72'], [27, '#0f1533', '#2a2f5c']];
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
function skyAt(hr) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
    if (hr >= h0 && hr <= h1) { const t = (hr - h0) / (h1 - h0); return [mix(t0, t1, t), mix(b0, b1, t)]; }
  }
  return [SKY[0][1], SKY[0][2]];
}
function placeOrb(el, t) {
  if (t < 0 || t > 1) { el.style.opacity = 0; return; }
  el.style.opacity = 1;
  el.style.right = (3 + t * 94) + '%';
  el.style.top = (82 - Math.sin(Math.PI * t) * 66) + '%';
}
function skyBand(a,b,t) {
  const A=a.match(/\d+/g).map(Number), B=b.match(/\d+/g).map(Number);
  return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`;
}
function renderSky() {
  const hour=6+(S.clock/DAY_LEN)*20;
  const [skyTop,skyBottom]=skyAt(hour);
  updateWorldScene(S,hour,skyTop,skyBottom);
  if(quietMotion.matches)redrawWeather();
}
(function makeStars() {
  let h = '';
  for (let i = 0; i < 45; i++) h += `<i style="right:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 75).toFixed(1)}%;animation-delay:${(Math.random() * 3).toFixed(2)}s"></i>`;
  $('stars').innerHTML = h;
})();

/* ---------------- الوضع الليلي ---------------- */
const THEME_KEY = 'untoldlife_theme';
let theme = 'dark';
try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { /* */ }
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  visualText($('themeBtn'), theme === 'dark' ? L('☀️ واجهة فاتحة') : L('🌙 واجهة داكنة'));
  const lb = $('langBtn');
  if (lb) { lb.textContent = '🌐 ' + langInfo(LANG)[2]; lb.title = 'Language'; }
}
// Website links (site-config.js). Empty when the game runs from a local file.
function siteConfig() { return window.SITE_CONFIG || {}; }
function sitePanel() {
  const C = siteConfig();
  const fb = `<button class="btn gold" data-a="feedback">${L('✍️ أرسل ملاحظاتك')}</button>`; // in-game form, feedback.js
  const home = C.home ? `<a class="btn ghost" href="${C.home}">${L('🏠 كل ألعابنا')}</a>` : '';
  // Support links from tools/site/config.json: "kofi" (Ko-fi page name) and "creators" (creators.sa page).
  const kofi = supportLinks().map(([u, t]) => `<a class="btn kofi" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('');
  const legal = C.home ? `<p class="hint"><a href="${C.home}privacy.html">${L('سياسة الخصوصية')}</a> · <a href="${C.home}about.html">${L('عن الاستديو')}</a> · <a href="${C.home}contact.html">${L('تواصل معنا')}</a></p>` : '';
  return `<h3>${L('💬 ملاحظاتك')}</h3><p class="hint">${L('هذي نسخة تجريبية. أي شيء عجبك أو ضايقك أو خرب، قل لنا.')}</p><div class="row">${fb}${kofi}${home}</div>${legal}`;
}
function initSiteLinks() {
  const fb = $('fbBtn');
  if (fb) { fb.textContent = L('💬 ملاحظاتك'); fb.classList.remove('hidden'); }
  // Support button in the top bar: one link goes straight there; with two it opens a small choice.
  const kf = $('kofiBtn'), links = supportLinks();
  if (kf && links.length) {
    visualText(kf, L('💝 ادعمنا')); kf.classList.remove('hidden');
    if (links.length === 1) kf.href = links[0][0]; else { kf.removeAttribute('href'); kf.removeAttribute('target'); kf.dataset.a = 'support'; }
  }
}
function supportLinks() {
  const C = siteConfig(), out = [];
  if (/^\w+$/.test(C.kofi || '')) out.push(['https://ko-fi.com/' + C.kofi, L('☕ ادعمنا على Ko-fi (بطاقة و PayPal)')]);
  if (/^https:\/\/creators\.sa\/[\w-]+$/.test(C.creators || '')) out.push([C.creators, L('💝 ادعمنا على Creators (الخليج • Apple Pay)')]);
  return out;
}
A.support = () => openModal(L`<h2>💝 ادعم 369Games</h2><p class="hint">دعمك يخلينا نكمل نطوّر اللعبة ونضيف أشياء جديدة. اختر الطريقة اللي تناسبك:</p>`
  + `<div class="support-pick">${supportLinks().map(([u, t]) => `<a class="btn ${u.includes('creators.sa') ? 'creators' : 'kofi'}" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>`
  + `<div class="row"><button class="btn ghost" data-a="closeModal">${L('إغلاق')}</button></div>`);
initSiteLinks();
// Language names always show in their own language (see LANGS in i18n.js).
function langPick() {
  const b = ([id, name]) => `<button class="btn${LANG === id ? '' : ' ghost'}" data-a="lang" data-v="${id}" lang="${id}">${name}</button>`;
  return `<h3>🌐 Language</h3><div class="row lang-pick">${LANGS.map(b).join('')}</div>`;
}
applyTheme();

/* ---------------- النوافذ ---------------- */
function openModal(html) { $('mbox').innerHTML = pixelHTML(html); $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }
let introGender = 'm';
function showIntro() {
  introGender = 'm';
  openModal(L`<h2>🌄 UntoldLife</h2>
  <div class="letter"><p>عزيزي حفيدي،</p>
  <p>إذا وصلتك هذه الرسالة فأنا لم أعد هنا. تركت لك مزرعتي الصغيرة في قرية <b>وادي الصدى</b>.
  الأرض متعبة، والحظيرة فارغة، والمنجم القديم خلف التلة مهجور منذ سنين... ويقولون إن وحوشاً سكنت أعماقه.</p>
  <p>أهل القرية طيبون، ونقابة المرتزقة تبحث دائماً عن أيادٍ قوية. ابدأ بالقليل، واصبر... وستكتب قصتك بنفسك.</p>
  <p style="text-align:end">— جدك</p></div>
  ${langPick()}<label><b>ما اسمك؟</b></label><input id="nameIn" maxlength="20" placeholder="اكتب اسمك هنا">
  <label><b>أنت؟</b></label>${genderPick('introGender', introGender)}
  <div class="intro-go"><button class="btn gold" data-a="start" style="width:100%;font-size:17px">🏡 ادخل القرية</button></div>
  ${(siteConfig().firebase || {}).apiKey && location.protocol !== 'file:' ? L('<button class="btn ghost sm intro-cloud" data-a="introCloud">☁️ لعبت قبل؟ كمّل تقدمك بحساب Google</button>') : ''}`);
  setTimeout(() => { const i = $('nameIn'); if (i) { i.focus(); i.onkeydown = e => { if (e.key === 'Enter') A.start(); }; } }, 50);
}
/* New version notice: an idle game tab can stay open for days, so every 10 minutes (and when the player comes back)
   the page checks whether a newer version is on the site and offers to reload. */
const MY_V = ((document.querySelector('script[src*="game.js?v="]') || {}).src || '').replace(/.*v=(\d+).*/, '$1');
let updAt = 0, updShown = false;
async function checkUpdate() {
  if (!/^\d+$/.test(MY_V) || updShown || document.hidden || location.protocol === 'file:' || Date.now() - updAt < 300000) return;
  updAt = Date.now();
  try {
    const t = await (await fetch(location.pathname + '?fresh=' + Date.now(), { cache: 'no-store' })).text();
    const v = (t.match(/game\.js\?v=(\d+)/) || [])[1];
    if (v && +v > +MY_V) showUpdate();
  } catch (e) { /* offline: try again later */ }
}
function showUpdate() {
  updShown = true;
  const d = document.createElement('div'); d.className = 'updbar'; d.setAttribute('role', 'status');
  d.innerHTML = `<span>${L('✨ نزل تحديث جديد للعبة')}</span><button class="btn gold sm" data-a="reloadNew">${L('🔄 حدّث الحين')}</button>`;
  document.body.appendChild(d);
}
setTimeout(checkUpdate, 60000); setInterval(checkUpdate, 600000);
document.addEventListener('visibilitychange', checkUpdate);
function showOffline(secs, gold, items) {
  const li = Object.entries(items).filter(([, n]) => n > 0).map(([id, n]) => `<li>${icon(ITEMS[id])} ${ITEMS[id].n} +${fmt(n)}</li>`).join('');
  openModal(L`<h2>🌙 أهلاً بعودتك يا ${S.name}!</h2>
  <p>غبت ${ftime(secs)}، والقرية لم تتوقف عن العمل:</p>
  ${gold > 0 ? L`<p>💰 <b>+${fmt(gold)}</b> ذهب</p>` : ''}
  ${li ? `<ul class="gains">${li}</ul>` : L('<p class="hint">لم يتغير الكثير... وظّف عمالاً في القرية ليعملوا وأنت غائب.</p>')}
  <button class="btn" data-a="closeModal" style="width:100%">رائع! 👍</button>`);
}

/* ---------------- الحفظ والحلقة ---------------- */
function deepMerge(def, obj) {
  for (const k in obj) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) deepMerge(def[k], v);
    else def[k] = v;
  }
  return def;
}
/* Save protection. The game runs in the browser, so none of this is unbreakable. The aim: stop casual edits
   (open the save, change a number) and mark a save that was clearly edited. A marked save is never blocked or deleted:
   it keeps working with a "modified" stamp, so a bug can't cost an honest player their farm.
   Format: 'UL2.' + scrambled base64url JSON + '.' + signature. */
const SAVE_MARK = 'untoldlife_sv';            // set once this device has written a protected save
const LEGACY_UNTIL = Date.UTC(2026, 11, 1);   // old readable files and codes still load cleanly until Dec 1 2026
const SAVE_SALT = 'UntoldLife|369|' + 'وادي الصدى';
let loadMod = '';
function sHash(str) {
  let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}
function sScramble(bytes) { let x = 0x9e3779b9; for (let i = 0; i < bytes.length; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; bytes[i] ^= x & 255; } return bytes; }
function sB64(b) { let t = ''; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function sUnb64(t) { const s2 = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(s2.length); for (let i = 0; i < s2.length; i++) b[i] = s2.charCodeAt(i); return b; }
function encodeSave(obj) {
  const json = JSON.stringify(obj);
  return 'UL2.' + sB64(sScramble(new TextEncoder().encode(json))) + '.' + sHash(SAVE_SALT + json);
}
// Reads any save we ever made: protected strings, old readable JSON, old copy-paste codes, and save files.
// Returns { st, fmt, mod } where mod is '' or why the save looks edited.
function readSave(text) {
  text = String(text || '').trim(); if (!text) return null;
  let o = null, fmt = 'json', mod = '';
  try {
    if (text.startsWith('UL2.')) {
      const [, body, sig] = text.split('.');
      const json = new TextDecoder().decode(sScramble(sUnb64(body)));
      o = JSON.parse(json); fmt = 'v2';
      if (sHash(SAVE_SALT + json) !== sig) mod = 'sig';
    } else {
      try { o = JSON.parse(text); } catch (e) { o = JSON.parse(decodeURIComponent(escape(atob(text)))); fmt = 'code'; }
      if (o && o.game === 'UntoldLife' && typeof o.save === 'string') return readSave(o.save);
      if (o && o.game === 'UntoldLife' && o.state) o = o.state;
      if (Date.now() > LEGACY_UNTIL) mod = 'legacy';
    }
  } catch (e) { return null; }
  return o && typeof o === 'object' && o.leg && o.farm && o.started ? { st: o, fmt, mod } : null;
}
// Numbers the game itself can never produce.
function saveOddity(st) {
  const g = st.gen || {}, lg = st.leg || {}, earned = (st.stats && st.stats.earned) || 0;
  if ((st.gold || 0) > (g.earned || 0) * 1.01 + 600000) return 'gold';
  if ((lg.stars || 0) > (lg.totalStars || 0) + 1) return 'stars';
  if ((g.earned || 0) > earned + 1) return 'earned';
  return '';
}
function markMod(reason) {
  if (!reason || !S || !S.leg || S.leg.mod) return;
  S.leg.mod = { r: reason, t: Date.now() };
  log(L('🧪 هذا الحفظ انعدّل من برّا اللعبة. تقدر تكمل عادي، بس مزرعتك صار عليها ختم «معدّلة» للأبد 😉'), 'warn');
}

/* Save to a file: download a backup, upload one back. Old copy-paste codes are accepted too. */
const BACKUP_KEY = 'untoldlife_backup_at';
let pendingSave = null;
function backupAt() { try { return +localStorage.getItem(BACKUP_KEY) || 0; } catch (e) { return 0; } }
function saveDownload() {
  if (!S || !S.started) return;
  save();
  const data = JSON.stringify({ game: 'UntoldLife', format: 2, saved: new Date().toISOString(), save: encodeSave(S) });
  const d = new Date(), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const who = String(S.leg.family || S.name || 'save').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 24);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = `UntoldLife-${who}-G${S.leg.gen}-${day}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  try { localStorage.setItem(BACKUP_KEY, String(Date.now())); } catch (e) { /* */ }
  toast(L('⬇️ نزل ملف الحفظ، احتفظ فيه في مكان آمن'));
}
function parseSave(text) { const i = readSave(text); return i ? i.st : null; }
function saveUpload() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,.txt,application/json,text/plain';
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (f.size > 5e6) return toast(L('❌ هذا ما هو ملف حفظ'));
    const r = new FileReader();
    r.onload = () => {
      const info = readSave(r.result);
      if (!info) return toast(L('❌ هذا ما هو ملف حفظ'));
      const st = info.st; pendingSave = info;
      openModal(L`<h2>⬆️ ارفع ملف حفظ</h2><div class="kv"><span>👤 الاسم</span><span>${esc(st.name || '')}</span></div><div class="kv"><span>🌳 الجيل</span><span>${(st.leg && st.leg.gen) || 1}</span></div><div class="kv"><span>💰 الذهب</span><span>${fmt(st.gold || 0)}</span></div>
      <p class="hint">⚠️ هذا الحفظ بياخذ مكان تقدمك الحالي. لو تبي ترجع له، نزّل ملف حفظك الحالي أول.</p>
      <div class="row"><button class="btn gold" data-a="saveLoadGo">✅ استبدل وكمّل من هذا الحفظ</button><button class="btn ghost" data-a="saveDownload">⬇️ نزّل حفظي الحالي أول</button><button class="btn ghost" data-a="closeModal">إلغاء</button></div>`);
    };
    r.readAsText(f);
  };
  inp.click();
}
function saveLoadGo() {
  if (!pendingSave) return;
  const info = pendingSave;
  try { S = migrate(info.st); } catch (e) { pendingSave = null; return toast(L('❌ هذا ما هو ملف حفظ')); }
  pendingSave = null; S.last = Date.now(); logs = []; indLogs = []; logDirty = true; lastSig = '';
  closeModal(); log(L`⬆️ رجعت لحفظ ${esc(S.name)} — الجيل ${S.leg.gen}`, 'season'); toast(L('✅ تم تحميل الحفظ'));
  markMod(info.mod || saveOddity(S)); save();
}
// Rude names: a short list of clear words, in Arabic and English. It can't catch everything:
// the developer's ban list (weekly.js, mod/v) is the sure way.
const BAD_SUB = ['fuck', 'shit', 'bitch', 'cunt', 'pussy', 'nigg', 'fagg', 'whore', 'slut', 'porn', '\u0634\u0631\u0645\u0648\u0637', '\u0642\u062d\u0628', '\u0645\u0646\u064a\u0648\u0643', '\u0645\u062a\u0646\u0627\u0643', '\u0643\u0633\u0627\u0645\u0643', '\u0643\u0633\u0645\u0643', '\u0643\u0633\u062e\u062a\u0643', '\u0632\u0628\u0631\u064a', '\u0646\u064a\u0627\u0643'];
const BAD_WORD = ['dick', 'cock', 'sex', 'ass', '\u0643\u0633', '\u0643\u0633\u0643', '\u0632\u0628', '\u0632\u0628\u064a', '\u0637\u064a\u0632', '\u0646\u064a\u0643', '\u062e\u0648\u0644', '\u0639\u0631\u0635', '\u0632\u0642', '\u0639\u0627\u0647\u0631', '\u0639\u0627\u0647\u0631\u0647', '\u0634\u0627\u0630', '\u0644\u0648\u0637\u064a', '\u062f\u064a\u0648\u062b'];
function nameNorm(s) { return String(s || '').toLowerCase().replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, '\u0627').replace(/ى/g, '\u064a').replace(/ة/g, '\u0647'); }
function badName(s) {
  // Repeated Arabic letters count once («شرمووط»); English keeps them (ass, nigg).
  const n = nameNorm(s).replace(/([؀-ۿ])\1+/g, '$1'), flat = n.replace(/[^\p{L}]/gu, '');
  return BAD_SUB.some(w => flat.includes(w)) || n.split(/[^\p{L}]+/u).some(t => BAD_WORD.includes(t));
}
let saveBlocked = false; // set while another save is being written in (move.js)
function save() { if (saveBlocked || !S || !S.started) return; try { localStorage.setItem(SAVE_KEY, encodeSave(S)); localStorage.setItem(SAVE_MARK, '1'); } catch (e) { /* التخزين غير متاح */ } }
function migrate(o) {
  const st = deepMerge(newState(), o);
  if (!o.gen) { st.gen.earned = (o.stats && o.stats.earned) || 0; st.gen.days = Math.max(0, dayAbsOf(st) - 1); }
  if (!st.leg.family) st.leg.family = st.name;
  if (!o.wv) { for (const k of ['harvester', 'planter', 'sprinkler']) if (st.bld[k]) st.bld[k] = 5; st.wv = 1; }
  if (o.hero && !o.hero.xc) { // saves from before the new xp curve: same total xp, re-levelled on the new curve
    const h = st.hero; let x = h.xp || 0;
    for (let l = 1; l < h.lvl; l++) x += Math.floor(50 * Math.pow(l, 2.2));
    h.lvl = 1; while (x >= hxpNeed(h.lvl)) { x -= hxpNeed(h.lvl); h.lvl++; }
    h.xp = x; h.xc = 1;
  }
  // 1.7.4: «Tool legacy» now passes legendary tools on as adamantite. The forge rolls of the last generation weren't kept,
  // so this generation's tools that dropped from adamantite to mithril go back to adamantite, once.
  if (!st.leg.tlFix) {
    const pt = st.gen.prevTools;
    if (pt && (st.leg.perks || {}).q_tools) for (const t in st.tools) if (pt[t] >= 6 && st.tools[t] === 5) st.tools[t] = 6;
    st.leg.tlFix = 1;
  }
  // 1.10.5: contract gold (1.10 to 1.10.4) wasn't counted as earned, so holding it looked like an edited save
  // (gold above everything earned) and the save got the "edited" stamp. Count it now and take the wrong stamp off.
  if (!st.leg.kFix) {
    if (st.leg.ind && st.gen && st.stats) {
      st.gen.earned = Math.max(st.gen.earned || 0, st.gold || 0); st.stats.earned = Math.max(st.stats.earned || 0, st.gen.earned);
      if (st.leg.mod && st.leg.mod.r === 'gold') delete st.leg.mod;
    }
    st.leg.kFix = 1;
  }
  // 1.10.6: in 1.10.5 delivered contracts paid no blueprints (and weren't counted); a one-time 15 📐 to make up for it.
  if (st.leg.ind && !st.leg.bpGift) { const r = st.leg.ind.r || (st.leg.ind.r = {}); r.bp = (r.bp || 0) + 15; st.leg.bpGift = 1; }
  if (!st.gender && st.spouse && NPC_BY[st.spouse]) st.gender = NPC_BY[st.spouse].g === 'f' ? 'm' : 'f';
  // 1.5.1: only one soul twin. Saves from 1.4.2 with more keep the first one and get the others' price back.
  const tw = Object.keys(st.twins || {});
  if (tw.length > 1) { st.twins = { [tw[0]]: 1 }; st.gold += TWIN_COST * (tw.length - 1); }
  for (const n of NPCS) {
    const x = st.npc[n.id] || (st.npc[n.id] = { pts: 0, gd: 0 });
    x.pts = Math.max(x.pts || 0, 250); // تاريخ الجد: الحب يبدأ من الربع
  }
  return st;
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
    const info = readSave(raw); if (!info) return null;
    const st = migrate(info.st);
    // This device's own readable save from before the update is fine, unless it already wrote a protected one.
    let mod = info.mod === 'legacy' ? '' : info.mod;
    if (info.fmt !== 'v2' && localStorage.getItem(SAVE_MARK)) mod = 'plain';
    loadMod = mod || saveOddity(st);
    return st;
  } catch (e) { return null; }
}
function runOffline(secs) {
  secs = Math.min(secs, offlineCap());
  const g0 = S.gold, inv0 = { ...S.inv };
  // Long absences (or a browser that put the tab to sleep) used to replay every second and freeze the page for a while.
  // Bigger steps give the same results (checked: within ~2% over an hour) in a fraction of the time.
  offline = true; simulate(secs, Math.min(10, Math.max(1, secs / 1800))); offline = false;
  const items = {};
  for (const id in S.inv) items[id] = S.inv[id] - (inv0[id] || 0);
  log(L`🌙 مرّ ${ftime(secs)} وأنت غائب`, 'season');
  if (S.started) showOffline(secs, S.gold - g0, items);
  lastSig = '';
}
function frame() {
  if (!S.started) { S.last = Date.now(); return; }
  const now = Date.now(), dt = (now - S.last) / 1000;
  S.last = now;
  if (dt <= 0) return;
  if (dt > 30) runOffline(dt); else simulate(dt);
}

S = load() || newState();
const loadedLast = S.last || 0; // when this device last saved (cloud.js compares it with the cloud copy)
markMod(loadMod);
// Away from the keyboard: no click, tap, key or scroll for a while. Cloud and leaderboard traffic slows down then
// (Firebase's free plan has a daily read and write limit for everyone together).
let lastInput = Date.now();
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, { capture: true, passive: true }));
function playerIdle(ms = 300000) { return Date.now() - lastInput > ms; }
// Only one tab saves. The tab opened or shown last takes over; an older tab stops saving and reloads when used again,
// so it can't write its older progress over the newer one.
const TAB_ID = Math.random().toString(36).slice(2), OWNER_KEY = 'untoldlife_tab';
let tabStale = false;
function tabClaim() { try { localStorage.setItem(OWNER_KEY, TAB_ID); } catch (e) { /* */ } }
window.addEventListener('storage', e => { if (e.key === OWNER_KEY && e.newValue && e.newValue !== TAB_ID) { tabStale = true; saveBlocked = true; } });
const tabBack = () => { if (tabStale) location.reload(); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (tabStale) tabBack(); else tabClaim(); } });
document.addEventListener('pointerdown', tabBack, true);
tabClaim();
if (!S.started) showIntro();
else {
  log(L`🏡 مرحباً بعودتك إلى وادي الصدى يا ${S.name}`);
  fillBoard();
}
render(true);
frame();
setInterval(frame, 100);
let renderN = 0;
setInterval(() => { if (LITE && renderN++ % 3) return; render(false); }, 200); // light mode: every 0.6 s
setInterval(save, 10000);
setInterval(checkAch, 1000);
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
