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
  { id: 'bee', n: L('خلية نحل'), e: '🐝', cost: 20000, prod: 'honey', time: 240, lvl: 8 },
];
[['egg', L('بيض'), '🥚', 25], ['milk', L('حليب'), '🥛', 120], ['wool', L('صوف'), '🧶', 350], ['honey', L('عسل'), '🍯', 1500]]
  .forEach(([id, n, e, price]) => addItem(id, { n, e, price, cat: 'animal' }));
// Golden animals give golden products worth 5x the base price.
[['egg_g', L('بيضة ذهبية'), 125], ['milk_g', L('حليب ذهبي'), 600], ['wool_g', L('صوف ذهبي'), 1750]]
  .forEach(([id, n, price]) => addItem(id, { n, e: '🌟', price, cat: 'animal', golden: true }));
// Until dedicated art exists, golden products reuse the base art with a gold tint.
if (typeof ART !== 'undefined') ['egg', 'milk', 'wool'].forEach(b => { if (!ART[b + '_g'] && ART[b]) ART[b + '_g'] = { ...ART[b], tint: true }; });
const BREEDABLE = ['chicken', 'cow', 'sheep'];
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

const FISH = [
  { id: 'sardine', n: L('سردين'), e: '🐟', price: 18, lvl: 1 },
  { id: 'shrimp', n: L('روبيان'), e: '🦐', price: 30, lvl: 1 },
  { id: 'crab', n: L('سلطعون'), e: '🦀', price: 60, lvl: 3 },
  { id: 'tropical', n: L('سمك ملوّن'), e: '🐠', price: 110, lvl: 5 },
  { id: 'puffer', n: L('سمك منتفخ'), e: '🐡', price: 200, lvl: 7 },
  { id: 'squid', n: L('حبّار'), e: '🦑', price: 380, lvl: 10 },
  { id: 'octopus', n: L('أخطبوط'), e: '🐙', price: 700, lvl: 13 },
  { id: 'shark', n: L('قرش'), e: '🦈', price: 1500, lvl: 16 },
];
FISH.forEach(f => addItem(f.id, { n: f.n, e: f.e, price: f.price, cat: 'fish' }));

const MONSTERS = [
  [L('سلايم'), '🟢'], [L('جرذ عملاق'), '🐀'], [L('خفاش الكهف'), '🦇'], [L('عنكبوت سام'), '🕷️'], [L('هيكل عظمي'), '💀'],
  [L('ذئب بري'), '🐺'], [L('عقرب الرمال'), '🦂'], [L('غول الكهوف'), '👹'], [L('شبح هائم'), '👻'], [L('أفعى عملاقة'), '🐍'],
  [L('غولم صخري'), '🗿'], [L('ساحر مظلم'), '🧙'], [L('شيطان ناري'), '😈'], [L('تنين صغير'), '🐲'],
];
const BOSSES = [
  [L('ملك السلايم'), '👑'], [L('أم العناكب'), '🕸️'], [L('الفارس الميت'), '⚔️'], [L('ألفا الذئاب'), '🌕'],
  [L('ملك الأشباح'), '☠️'], [L('حارس الأطلال'), '🏛️'], [L('التنين الأحمر'), '🐉'],
];
const EPITHET = ['', L('المتوحش'), L('الأسطوري'), L('الإلهي')];

const SWORD = [0, 5, 14, 30, 60, 120, 240];
const ARMOR_DEF = [0, 3, 9, 20, 40, 80, 160];
const ARMOR_HP = [0, 30, 80, 160, 320, 640, 1200];

const TOOLS = [
  { id: 'hoe', n: L('المعزقة'), e: '🌾', eff: l => L`+${l * 20}% سرعة نمو المحاصيل` },
  { id: 'can', n: L('المرشة'), e: '🚿', eff: l => L`السقي يسرّع النمو ×${(2 + 0.25 * l).toFixed(2)}${l >= 1 ? L(' • زر "سقي الكل"') : ''}` },
  { id: 'pick', n: L('الفأس'), e: '⛏️', eff: l => L`قوة حفر ×${(1 + 0.6 * l).toFixed(1)} • أقصى عمق ${PICK_CAP[l] > 1e8 ? '∞' : PICK_CAP[l]}` },
  { id: 'sword', n: L('السيف'), e: '🗡️', eff: l => L`+${SWORD[l]} هجوم` },
  { id: 'armor', n: L('الدرع'), e: '🛡️', eff: l => L`+${ARMOR_DEF[l]} دفاع • +${ARMOR_HP[l]} صحة` },
  { id: 'rod', n: L('السنارة'), e: '🎣', eff: l => L`قوة الصيد ×${(1 + 0.5 * l).toFixed(1)} • أسماك نادرة أكثر` },
];

const BUILDINGS = [
  { id: 'harvester', n: L('عامل حصاد'), e: '🧑‍🌾', desc: L('يحصد المحاصيل الجاهزة تلقائياً'), cost: 300 },
  { id: 'bin', n: L('صندوق الشحن'), e: '📦', desc: L('يبيع كل الأغراض غير المقفلة نهاية كل يوم'), cost: 600 },
  { id: 'planter', n: L('عامل زراعة'), e: '👨‍🌾', desc: L('يعيد زراعة الأحواض الفارغة بالبذرة المختارة'), cost: 1500, req: 'harvester' },
  { id: 'zoning', n: L('تخصيص الحقول'), e: '🎯', desc: L('خصص لكل حوض محصولاً ثابتاً يعيد عامل الزراعة زراعته'), cost: 5000, req: 'planter' },
  { id: 'barn', n: L('توسعة الحظيرة'), e: '🏚️', desc: L('+5 سعة لكل نوع حيوان'), cost: 1200, mult: 3, max: 6 },
  { id: 'merc', n: L('رفيق مرتزق'), e: '🧝', desc: L('+1 مهمة متزامنة في النقابة'), cost: 2000, mult: 5, max: 3 },
  { id: 'inn', n: L('النُزل'), e: '🛏️', desc: L('مضاعفة سرعة استعادة الصحة'), cost: 2500 },
  { id: 'rancher', n: L('راعي'), e: '🤠', desc: L('يعتني بالحيوانات ويبقي سعادتها كاملة'), cost: 6000 },
  { id: 'kitchen', n: L('المطبخ'), e: '🍳', desc: L('الطعام يشفي ضعف الكمية في المعارك'), cost: 8000 },
  { id: 'sprinkler', n: L('رشاشات ماء'), e: '💦', desc: L('تسقي كل الأحواض تلقائياً'), cost: 15000 },
  { id: 'greenhouse', n: L('بيت محمي'), e: '🏡', desc: L('كل المحاصيل تنمو بسرعة كاملة في أي موسم'), cost: 80000 },
];

const NPCS = [
  { id: 'mayor', g: 'm', n: L('أبو سالم'), role: L('عمدة وادي الصدى'), story: L('يدير القرية منذ ثلاثين سنة، وكان أقرب أصدقاء جدك. يعرف كل بيت وكل حكاية في الوادي، ويفرح كلما رأى السوق عامراً. أهدِه العسل وسيحدثك عن الأيام القديمة.'), e: '👴', love: 'honey', like: 'milk', perk: h => L`+${2 * h}% سعر البيع`,
    lines: [L('أهلاً بك في وادي الصدى! جدك كان رجلاً طيباً.'), L('المزرعة بدأت تعود للحياة بفضلك يا بني.'), L('أنت فخر القرية كلها!')] },
  { id: 'noura', g: 'f', n: L('نورة'), role: L('مزارعة القرية'), story: L('كبرت بين الحقول وتعرف موعد كل بذرة. كانت تساعد جدك في المزرعة لما تعب، وتتمنى أن ترى أرضه خضراء من جديد. اليقطين أحب شيء عندها.'), e: '👩‍🌾', love: 'pumpkin', like: 'turnip', perk: h => L`+${3 * h}% سرعة نمو`,
    lines: [L('الأرض تحب من يسقيها كل يوم.'), L('محاصيلك صارت أجمل من محاصيلي!'), L('لو احتجت أي نصيحة في الزراعة أنا موجودة دائماً.')] },
  { id: 'smith', g: 'm', n: L('قاسم'), role: L('حداد القرية'), story: L('ورث الورشة عن أبيه، ويقول إن لكل معدن صوتاً. قليل الكلام لكنه لا يرد أحداً، وإذا أحضرت له فضة نسي تعبه وابتسم.'), e: '🧔', love: 'silver', like: 'copper', perk: h => L`-${3 * h}% تكلفة الحداد`,
    lines: [L('هممم... أحضر لي معدناً جيداً وسأصنع لك العجب.'), L('يدك قوية، تصلح للفأس والسيف.'), L('أنت أفضل زبون عندي، خصم خاص لك!')] },
  { id: 'leila', g: 'f', n: L('ليلى'), role: L('طبيبة القرية'), story: L('رجعت إلى الوادي بعد سنوات من الدراسة في المدينة، وفتحت عيادة صغيرة قرب الساحة. تعالج المرتزقة العائدين من الزنزانة، وتقول إن الفراولة أفضل دواء للقلب.'), e: '👩‍⚕️', love: 'strawberry', like: 'egg', perk: h => L`+${5 * h}% صحة قصوى`,
    lines: [L('انتبه لنفسك في الزنزانة، الجروح هناك عميقة.'), L('كُل جيداً قبل القتال، الطعام دواء.'), L('أشعر بالأمان حين أعرف أنك بخير.')] },
  { id: 'raad', g: 'm', n: L('رعد'), role: L('قائد نقابة المرتزقة'), story: L('جاب الأراضي البعيدة مرتزقاً قبل أن يستقر في الوادي ويؤسس النقابة. صارم مع المبتدئين لأنه فقد رفاقاً في الأعماق، لكنه يحترم من يثبت نفسه. يجمع أنياب الوحوش تذكاراً من معاركه.'), e: '🤺', love: 'fang', like: 'gel', perk: h => L`+${4 * h}% مكافآت المهمات`,
    lines: [L('مرتزق جديد؟ أثبت نفسك أولاً.'), L('سمعت عن انتصاراتك، أحسنت.'), L('أنت أسطورة النقابة الآن!')] },
];
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
  { id: 't_stars', req: ['t_offline', 2], b: 'trade', n: L('حكمة الأجيال'), e: '🌟', max: 10, cost: 4, mult: 1.7, eff: l => L`+${10 * l}% نجوم الإرث` },
  { id: 'q_workers', req: ['q_hearts', 3], b: 'family', n: L('العمال يتذكرونك'), e: '🧑‍🌾', max: 3, cost: 3, mult: 2.5, start: 1,
    eff: l => ['—', L('تبدأ مع عامل الحصاد وعامل الزراعة'), L('الحصاد والزراعة + صندوق الشحن والرشاشات'), L('كل ما سبق + الراعي وتخصيص الحقول')][l] },
  { id: 'q_hearts', b: 'family', n: L('سمعة الجد'), e: '💞', max: 5, cost: 2, mult: 1.7, start: 1, eff: l => L`أهل القرية يبدؤون من ${2.5 + l} قلوب` },
  { id: 'q_heirs', req: ['q_hearts', 3], b: 'family', n: L('خزانة العائلة'), e: '🗝️', max: 2, cost: 5, mult: 3, eff: l => L`${3 + l} خيارات لقطع الإرث عند التقاعد` },
  { id: 'q_bless', req: ['q_workers', 2], b: 'family', n: L('بركة الوادي'), e: '🌈', max: Infinity, cost: 10, mult: 1.35, eff: l => L`+${5 * l}% لكل شيء (بلا حد)` },
  // Special skills: one per branch, unlocked after spending KS_NEED levels in that branch.
  { id: 'f_seeds', ks: 1, b: 'farm', n: L('بذور خالدة'), e: '♾️', max: 1, cost: 25, mult: 1, eff: () => L('الزراعة ما تكلف بذور أبداً') },
  { id: 'r_twin', ks: 1, b: 'ranch', n: L('مربّي خبير'), e: '🧬', max: 1, cost: 25, mult: 1, eff: () => L('لو فشل التهجين ما تخسر حيواناتك') },
  { id: 'm_tnt', ks: 1, b: 'mine', n: L('ديناميت'), e: '🧨', max: 1, cost: 25, mult: 1, eff: () => L('كل طابق تكمله في المنجم ينزلك طابقين') },
  { id: 'w_ally', ks: 1, b: 'war', n: L('رفيق المعارك'), e: '🛡️', max: 1, cost: 25, mult: 1, eff: () => L('رفيق يقاتل معك بنصف قوتك، وينقذك من السقوط مرة كل 5 دقائق') },
  { id: 't_deal', ks: 1, b: 'trade', n: L('تاجر الموسم'), e: '🧺', max: 1, cost: 25, mult: 1, eff: () => L('كل موسم يجيك تاجر يشتري محصول من محاصيل الموسم بـ ×3 السعر') },
  { id: 'q_tools', ks: 1, b: 'family', n: L('إرث الأدوات'), e: '🧰', max: 1, cost: 25, mult: 1, start: 1, eff: () => L('أدواتك تنتقل للجيل الجديد بدرجة أقل بدل ما ترجع للصفر') },
];
const HEIRLOOMS = [
  { id: 'sword', n: L('سيف الجد'), e: '🗡️', max: 6, eff: l => L`تبدأ كل جيل بسيف ${TIER[l]}` },
  { id: 'armor', n: L('درع الأب'), e: '🛡️', max: 6, eff: l => L`تبدأ كل جيل بدرع ${TIER[l]}` },
  { id: 'hoe', n: L('معزقة الأجداد'), e: '🌾', max: 6, eff: l => L`تبدأ كل جيل بمعزقة ${TIER[l]}` },
  { id: 'can', n: L('المرشة الذهبية'), e: '🚿', max: 6, eff: l => L`تبدأ كل جيل بمرشة ${TIER[l]}` },
  { id: 'pick', n: L('فأس العائلة'), e: '⛏️', max: 6, eff: l => L`تبدأ كل جيل بفأس ${TIER[l]}` },
  { id: 'rod', n: L('سنارة الجد'), e: '🎣', max: 6, eff: l => L`تبدأ كل جيل بسنارة ${TIER[l]}` },
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
  [5, L('💍 الزواج من أهل القرية + 🏆 تحديات الأجيال اللانهائية')],
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
function canWed(np) { return np.id !== 'mayor' && !!S.gender && np.g !== S.gender; }
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
    tools: { hoe: 0, can: 0, pick: 0, sword: 0, armor: 0, rod: 0 },
    lake: { prog: 0, fishers: 0, last: null },
    hero: { lvl: 1, xp: 0, hp: 60 },
    dun: { active: false, floor: 1, max: 1, kills: 0, enemy: null, auto: true, autoEat: true, resting: false, ht: 0, et: 0, retry: 0 },
    guild: { gp: 0, board: [], active: [], boardT: 0, qid: 0 },
    bld: {}, off: {}, spouse: null, gender: null,
    npc: Object.fromEntries(NPCS.map(n => [n.id, { pts: 250, gd: 0 }])),
    stats: { earned: 0, harvests: 0, products: 0, blocks: 0, kills: 0, quests: 0, play: 0, fish: 0 },
    gen: { earned: 0, days: 0, ch: null, chDone: false },
    leg: { gen: 1, family: '', stars: 0, totalStars: 0, perks: {}, heir: {}, ch: {}, ach: {}, best: { dun: 0, mine: 0 }, history: [], married: 0 },
    last: Date.now(),
  };
}

let S = null;
let tab = 'farm';
let lastSig = '';
let offline = false;
let logs = [];
let logDirty = true;
let zoneMode = false;
function owned(id) { return id === 'miners' ? S.mine.miners > 0 : id === 'fishers' ? S.lake.fishers > 0 : !!S.bld[id]; }

/* ----- مضاعفات الإرث ----- */
const P = id => S.leg.perks[id] || 0;
const H = id => S.leg.heir[id] || 0;
const CC = id => S.leg.ch[id] || 0;
const inCh = id => S.gen.ch === id;
function bless() { return 1 + 0.05 * P('q_bless'); }
function achMult() { return 1 + 0.01 * Object.keys(S.leg.ach).length; }
function goldMult() { return (1 + 0.1 * P('t_price')) * (1 + 0.05 * H('coin')) * (1 + 0.1 * CC('noworkers')) * achMult() * bless() * (inCh('poverty') ? 0.5 : 1); }
function prodMult() { return (1 + 0.1 * CC('slow')) * (S.spouse ? 1.1 : 1) * (inCh('slow') ? 0.5 : 1) * bless(); }
function xpMult() { return (1 + 0.1 * H('diary')) * achMult() * bless(); }
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
function log(msg, type = '') {
  if (offline) return;
  logs.unshift({ t: clockStr(), msg, type });
  if (logs.length > 80) logs.pop();
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
function hearts(id) { return Math.floor(((S.npc[id] || {}).pts || 0) / 100) + (S.spouse === id ? 10 : 0); }
function sellPrice(id) { return Math.round(ITEMS[id].price * (1 + 0.02 * hearts('mayor')) * goldMult() * (id === dealCrop() ? 3 : 1)); }
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
  while (s.x >= xpNeed(s.l)) { s.x -= xpNeed(s.l); s.l++; log(L`⭐ ارتفع مستوى ${SKILL_N[k]} إلى ${s.l}!`, 'good'); }
}

/* ---------------- المزرعة ---------------- */
function cropUnlocked(c) { return S.skills.farm.l >= c.lvl && (c.season !== 4 || S.leg.gen >= 3); }
function waterMult() { return 2 + 0.25 * S.tools.can; }
function growMult(c) {
  let m = (1 + 0.2 * S.tools.hoe) * (1 + 0.02 * (S.skills.farm.l - 1)) * (1 + 0.03 * hearts('noura'))
    * (1 + 0.25 * P('f_grow')) * (1 + 0.15 * CC('winter')) * prodMult();
  if (c.season !== S.season && c.season !== 4 && !on('greenhouse')) m *= 0.5;
  return m;
}
function plotSpeed(p) { return growMult(CROP[p.c]) * (p.w ? waterMult() : 1); }
function autoWet() { return S.weather === 'rain' || on('sprinkler'); }
function isReady(p) { return p.c && p.p >= CROP[p.c].grow; }
function plotCrop(p) {
  const a = on('zoning') && p.a && CROP[p.a];
  return a && cropUnlocked(a) ? a : CROP[S.farm.seed];
}
function seedCost(c) { return P('f_seeds') ? 0 : c.seed; }
function plant(i) {
  const p = S.farm.plots[i]; if (p.c || noFarm()) return false;
  const c = plotCrop(p);
  if (!c || !cropUnlocked(c) || S.gold < seedCost(c)) return false;
  S.gold -= seedCost(c); p.c = c.id; p.p = 0; p.w = autoWet();
  return true;
}
function harvest(i) {
  const p = S.farm.plots[i]; if (!isReady(p)) return false;
  const c = CROP[p.c];
  const n = Math.random() < 0.01 * S.skills.farm.l + 0.03 * H('seedbag') ? 2 : 1;
  give(c.id, n);
  if (Math.random() < 0.01 * P('f_golden')) {
    const g = sellPrice(c.id) * 10; addGold(g);
    log(L`✨ محصول ذهبي! ${c.e} ${c.n} يلمع ذهب: +${fmt(g)}💰 (×10 سعره)`, 'golden');
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
  const wet = autoWet();
  S.farm.plots.forEach((p, i) => {
    if (p.c) {
      if (wet) p.w = true;
      const c = CROP[p.c];
      if (p.p < c.grow) p.p = Math.min(c.grow, p.p + dt * plotSpeed(p));
    }
    if (on('harvester') && isReady(p)) harvest(i);
    if (on('planter') && !p.c) plant(i);
  });
}

/* ---------------- الحظيرة ---------------- */
function barnCap() { return 5 + 5 * (S.bld.barn || 0); }
function animalCost(a) { return Math.round(a.cost * Math.pow(1.25, S.barn.n[a.id] || 0) * (1 - 0.1 * P('r_cost'))); }
function animalSpeed(a) { return (0.5 + (S.barn.h[a.id] ?? 100) / 100) * (1 + 0.02 * (S.skills.ranch.l - 1)) * (1 + 0.2 * P('r_speed')) * prodMult(); }
function grades(id) { const q = S.barn.q[id] || { p: 0, g: 0 }, n = S.barn.n[id] || 0; return { n0: Math.max(0, n - (q.p || 0) - (q.g || 0)), p: q.p || 0, g: q.g || 0 }; }
/* Breeding: put two animals of the same grade in a house and the result comes at once.
   Success: both become the next grade. Failure: both animals are gone (unless the «Expert breeder» perk).
   Then that house rests a few minutes. «Breeding tools» from the market shorten the rest and raise the chances. */
const HOUSE_MAX = 5;
const BREED_LV = [
  { rest: 300, p: 0.20, g: 0.05 },
  { rest: 240, p: 0.25, g: 0.08, cost: 25000 },
  { rest: 120, p: 0.33, g: 0.12, cost: 300000 },
];
function breedLv() { return BREED_LV[Math.min(BREED_LV.length - 1, S.barn.lab || 0)]; }
function breedChance(to) { return breedLv()[to]; }
function breedFrom(to) { return to === 'p' ? 'n0' : 'p'; }
function houseRest() { return breedLv().rest; }
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
function tickBreed(dt) {
  const cd = S.barn.cd || (S.barn.cd = []);
  for (let i = 0; i < cd.length; i++) if (cd[i] > 0) cd[i] = Math.max(0, cd[i] - dt);
  // Breeding started before the gamble update finishes right away with the chance it had.
  for (const k of ['br', 'br2']) {
    const B = S.barn[k]; if (!B) continue;
    S.barn[k] = null;
    const a = ANIMALS.find(x => x.id === B.a), G = GRADE[B.to];
    if (!a || !G || grades(B.a)[breedFrom(B.to)] < 1 || Math.random() >= (B.chance || 0)) continue;
    const q = S.barn.q[B.a] || (S.barn.q[B.a] = { p: 0, g: 0 });
    if (B.to === 'g') q.p = (q.p || 0) - 1;
    q[B.to] = (q[B.to] || 0) + 1;
    log(L`🧬 نجح التهجين! صار عندك ${a.n} ${G.n} ${G.e}`, 'season');
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
    log(L`🧬 نجح التهجين! صار عندك ${a.n} ${G.n} ×2 ${G.e}`, 'golden');
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
function mineMult() { return (1 + 0.6 * S.tools.pick) * (1 + 0.05 * (S.skills.mine.l - 1)) * (1 + 0.3 * P('m_power')) * (1 + 0.2 * CC('underground')) * prodMult(); }
function hardness() { const d = S.mine.depth; return 4 + d * 0.8 + d * d * 0.01; }
function minerCost() { return Math.round(250 * Math.pow(1.45, S.mine.miners)); }
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
  if (Math.random() < (0.004 + d * 0.0001) * (1 + 0.5 * P('m_gem')) * (1 + 0.2 * CC('underground'))) { give('gem'); log(L('💎 عثرت على جوهرة نادرة!'), 'good'); }
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
function heroMaxHp() { return Math.floor((60 + 20 * (S.hero.lvl - 1) + ARMOR_HP[S.tools.armor]) * (1 + 0.05 * hearts('leila')) * warMult()); }
function heroAtk() { return (6 + 3 * (S.hero.lvl - 1) + SWORD[S.tools.sword]) * warMult(); }
function heroDef() { return 1 + (S.hero.lvl - 1) + ARMOR_DEF[S.tools.armor]; }
function heroPower() { return Math.round(heroAtk() * 2 + heroDef() * 2 + heroMaxHp() / 5); }
function hxpNeed(l) { return Math.floor(50 * Math.pow(l, 2.2)); }
function heroXp(x) {
  const h = S.hero; h.xp += x * xpMult() * (1 + 0.3 * P('w_xp'));
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
function regenRate() { return heroMaxHp() * 0.03 * (S.bld.inn ? 2 : 1); }
function healOf(id) { return (ITEMS[id].price * 1.5 + 10) * (S.bld.kitchen ? 2 : 1); }
function foodList() {
  const cats = noFarm() ? ['crop', 'animal', 'fish', 'monster'] : ['crop', 'animal', 'fish'];
  return Object.keys(S.inv).filter(id => cats.includes(ITEMS[id].cat) && !S.locked[id])
    .sort((a, b) => ITEMS[a].price - ITEMS[b].price);
}
function eat() {
  const f = foodList()[0]; if (!f) return false;
  take(f); S.hero.hp = Math.min(heroMaxHp(), S.hero.hp + healOf(f));
  return true;
}
function killEnemy() {
  const D = S.dun, e = D.enemy, f = D.floor;
  addGold(Math.round((3 + 2 * f + 0.15 * f * f) * (e.boss ? 5 : 1) * goldMult()));
  if (e.boss && f > 100) { S.leg.stars += 1; S.leg.totalStars += 1; log(L('🌟 زعيم من الأعماق المنسية أعطاك نجمة إرث!'), 'season'); }
  heroXp((4 + 1.5 * f + 0.1 * f * f) * (e.boss ? 4 : 1));
  S.stats.kills++;
  const mats = MONSTER_MATS.filter(m => m.f <= f);
  const mat = Math.random() < 0.7 ? mats[mats.length - 1] : pick(mats);
  if (e.boss || Math.random() < 0.35) give(mat.id, e.boss ? 3 : 1);
  if (e.boss && Math.random() < 0.25) give('gem');
  if (e.boss) log(L`🏆 هزمت الزعيم ${e.e} ${e.n}!`, 'good');
  D.kills++;
  if (D.kills >= (e.boss ? 1 : 5)) {
    D.kills = 0;
    if (D.floor === D.max && !deepLocked()) { D.max++; if (f % 5 === 0 || e.boss) log(L`🗝️ فتحت الطابق ${D.max} في الزنزانة`); }
    if (D.auto && !(D.retry > 0)) D.floor = Math.min(D.max, D.floor + 1);
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
  if (!D.active || D.resting) {
    h.hp = Math.min(mhp, h.hp + regenRate() * dt);
    if (D.active && D.resting && h.hp >= mhp) { D.resting = false; log(L('💪 تعافيت تماماً وعدت للزنزانة')); }
    return;
  }
  if (!D.enemy) D.enemy = makeEnemy(D.floor);
  if (D.autoEat) { let g = 0; while (h.hp < mhp * 0.4 && g++ < 20 && eat()); }
  h.hp = Math.min(mhp, h.hp + mhp * 0.005 * dt); // تعافٍ بسيط أثناء القتال
  D.ht += dt; D.et += dt;
  while (D.ht >= 1) {
    D.ht -= 1;
    D.enemy.hp -= dmg(heroAtk(), D.enemy.def);
    if (D.enemy.hp <= 0) killEnemy();
    if (P('w_ally')) { D.enemy.hp -= dmg(heroAtk() * 0.5, D.enemy.def); if (D.enemy.hp <= 0) killEnemy(); }
  }
  while (D.et >= 1.25) {
    D.et -= 1.25;
    h.hp -= dmg(D.enemy.atk, heroDef());
    if (h.hp <= 0 && P('w_ally') && !(D.allyT > 0)) { h.hp = mhp * 0.3; D.allyT = 300; log(L('🛡️ رفيقك وقف قدامك وأنقذك من السقوط!'), 'good'); }
    if (h.hp <= 0) { heroDie(); return; }
  }
}

/* ---------------- النقابة والمهمات ---------------- */
function rankIdx() { let r = 0; RANKS.forEach((x, i) => { if (S.guild.gp >= x[1]) r = i; }); return r; }
function questSlots() { return 1 + (S.bld.merc || 0); }
function questMult() { return (1 + 0.04 * hearts('raad')) * (1 + 0.25 * P('w_quest')) * goldMult(); }
function chanceOf(q) { return clamp(Math.pow(heroPower() / q.req, 2), 0.05, 1); }
function genQuest() {
  const r = rankIdx(), g = S.guild; g.qid++;
  const del = Object.keys(S.seen).filter(id => ['crop', 'animal', 'monster'].includes(ITEMS[id].cat) && !ITEMS[id].golden);
  if (del.length && Math.random() < 0.45) {
    const id = pick(del), it = ITEMS[id];
    const qty = Math.max(1, Math.round(R(3, 10) * (1 + r * 0.4) * Math.pow(60 / it.price, 0.35)));
    return { id: g.qid, type: 'deliver', item: id, qty, gold: Math.round(it.price * qty * 1.7), gp: 2 + r * 2, exp: 480 };
  }
  const dur = pick([45, 90, 180, 360, 600]);
  const req = Math.round(25 * Math.pow(2, r) * R(0.6, 1.4) * (0.8 + dur / 1200));
  return {
    id: g.qid, type: 'hunt', n: pick(HUNT_NAMES), dur, req,
    gold: Math.round(req * dur / 25 * (1 + r * 0.3)), gp: Math.max(1, Math.round((3 + r * 3) * dur / 180)),
    xp: Math.round(req * dur / 90), exp: 480,
  };
}
function fillBoard() { while (S.guild.board.length < 4) S.guild.board.push(genQuest()); }
function tickGuild(dt) {
  const g = S.guild;
  for (const q of [...g.active]) {
    q.t += dt;
    if (q.t >= q.dur) {
      g.active.splice(g.active.indexOf(q), 1);
      if (Math.random() < q.chance) {
        const m = questMult();
        addGold(Math.round(q.gold * m)); g.gp += q.gp; heroXp(q.xp); S.stats.quests++;
        log(L`✅ نجحت مهمة «${Lx(q.n)}»: +${fmt(q.gold * m)}💰 +${q.gp} نقاط نقابة`, 'good');
      } else log(L`❌ فشلت مهمة «${Lx(q.n)}»... حاول عندما تصبح أقوى`, 'bad');
    }
  }
  for (const q of [...g.board]) { q.exp = (q.exp ?? 480) - dt; if (q.exp <= 0) g.board.splice(g.board.indexOf(q), 1); }
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
  }
  if (inCh('winter')) S.season = 3;
  const r = Math.random();
  S.weather = S.season === 3 ? (r < 0.3 ? 'snow' : r < 0.6 ? 'cloudy' : 'sunny') : (r < 0.22 ? 'rain' : r < 0.45 ? 'cloudy' : 'sunny');
  if (on('bin')) shipAll(true);
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
  checkChallenge();
}

/* ---------------- البحيرة ---------------- */
function fishPower() { return (1 + 0.5 * S.tools.rod) * (1 + 0.03 * (S.skills.fish.l - 1)) * (1 + 0.3 * P('m_power')) * prodMult(); }
function biteNeed() { return 6 + S.skills.fish.l * 0.5; }
function fisherCost() { return Math.round(400 * Math.pow(1.45, S.lake.fishers)); }
function fisherRate() { return S.lake.fishers * 0.35 * fishPower(); }
function fish(amount) {
  S.lake.prog += amount;
  let g = 0;
  while (S.lake.prog >= biteNeed() && g++ < 500) { S.lake.prog -= biteNeed(); catchFish(); }
}
function catchFish() {
  if (Math.random() < 0.01) {
    const g = Math.round(300 * S.skills.fish.l * goldMult()); addGold(g);
    S.lake.last = 'treasure'; log(L`🧰 اصطدت صندوق كنز! +${fmt(g)}💰`, 'gold'); return;
  }
  const av = FISH.filter(f => f.lvl <= S.skills.fish.l);
  const ws = av.map((f, i) => Math.pow(0.62, i) * Math.pow(1 + 0.15 * S.tools.rod, i));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), f = av[0];
  for (let i = 0; i < av.length; i++) { r -= ws[i]; if (r <= 0) { f = av[i]; break; } }
  give(f.id); S.stats.fish++; S.lake.last = f.id;
  addXp('fish', f.price / 6);
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
function goldGoal() { const g = Math.max(0, S.leg.gen - 3); if (!g) return 1e6; const v = 1e6 * Math.pow(1.85, g), d = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / d) * d; }
// The dungeon goal also sits at least 15 floors above where this generation started (the «Battle memory» perk starts you deep).
function dunGoal() { return Math.max(30 + 3 * Math.max(0, S.leg.gen - 3), (S.gen.dun0 || 1) + 15); }
function canRetire() { return S.gen.earned >= goldGoal() || S.dun.max >= dunGoal(); }
// Dungeon stars only count floors climbed this generation, not the free start floor.
function starsBase() { return 3 * Math.sqrt(S.gen.earned / 1e6) + Math.max(0, S.dun.max - Math.max(10, S.gen.dun0 || 1)) / 3 + Math.max(0, S.mine.max - 20) / 10; }
function starsGain() { return Math.floor(starsBase() * starMult()); }
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
    for (const k of add) S.bld[k] = S.bld[k] || 1;
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
  for (const t of ['hoe', 'can', 'pick', 'sword', 'armor', 'rod']) S.tools[t] = Math.min(6, Math.max(H(t), P('q_tools') && oldTools ? (oldTools[t] || 0) - 1 : 0));
  if (!noFarm()) {
    if (P('r_start')) { S.barn.n.chicken = 2 * P('r_start'); S.barn.h.chicken = 100; }
    if (H('cow')) { S.barn.n.cow = H('cow'); S.barn.h.cow = 100; }
  }
  if (!nw) {
    S.mine.miners = 2 * P('m_miners');
    const q = P('q_workers');
    if (q >= 1) { S.bld.harvester = 1; S.bld.planter = 1; }
    if (q >= 2) { S.bld.bin = 1; S.bld.sprinkler = 1; }
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
  const keep = { leg: LG, stats: S.stats, locked: S.locked }, oldTools = { ...S.tools };
  const nm = (RS.name || '').trim().slice(0, 24) || childName();
  S = newState(); Object.assign(S, keep);
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
    4: L('🕳️ انفتحت <b>الأعماق المنسية</b>: الزنزانة تكمل بعد الطابق 100!'), 5: L('💍 صار <b>الزواج</b> متاح، و<b>تحديات الأجيال</b> تنفتح عند تقاعدك القادم!') }[g] || '';
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
function simulate(total) {
  while (total > 0) { const st = Math.min(1, total); tick(st); total -= st; }
}

/* ---------------- الأوامر ---------------- */
const A = {
  tab: v => { tab = v; lastSig = ''; const y = $('wrap').getBoundingClientRect().top + scrollY - $('tabs').offsetHeight - 16; if (scrollY > y) scrollTo(0, Math.max(0, y)); },
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
  buyLab: () => {
    const nx = BREED_LV[(S.barn.lab || 0) + 1]; if (!nx || S.gold < nx.cost || S.skills.ranch.l < GRADE.p.lvl) return;
    S.gold -= nx.cost; S.barn.lab = (S.barn.lab || 0) + 1;
    log(L`🧬 طوّرت أدوات التهجين للمستوى ${S.barn.lab + 1}`, 'season');
  },
  pet: v => { S.barn.h[v] = Math.min(100, (S.barn.h[v] ?? 100) + 25); toast(L('❤️ الحيوانات سعيدة')); },
  dig: () => { dig(mineMult()); },
  cast: () => { fish(fishPower()); },
  hireFisher: () => { if (inCh('noworkers')) return toast(L('🚫 ممنوع في تحدي بدون عمال')); const c = fisherCost(); if (S.gold < c) return; S.gold -= c; S.lake.fishers++; log(L`🎣 وظّفت صياداً (${S.lake.fishers})`); },
  hireMiner: () => { if (inCh('noworkers')) return toast(L('🚫 ممنوع في تحدي بدون عمال')); const c = minerCost(); if (S.gold < c) return; S.gold -= c; S.mine.miners++; log(L`👷 وظّفت عامل منجم (${S.mine.miners})`); },
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
  dunEat: () => { S.dun.autoEat = !S.dun.autoEat; },
  floor: v => { const D = S.dun; const f = clamp(D.floor + (+v), 1, D.max); if (f !== D.floor) { D.floor = f; D.kills = 0; D.enemy = null; } },
  floorMax: () => { S.dun.floor = S.dun.max; S.dun.kills = 0; S.dun.enemy = null; },
  eatNow: () => { if (!eat()) toast(L('ما عندك طعام غير مقفل')); },
  quest: v => {
    const g = S.guild, i = g.board.findIndex(q => q.id === +v); if (i < 0) return;
    const q = g.board[i];
    if (q.type === 'deliver') {
      if (!take(q.item, q.qty)) return toast(L('ما عندك الكمية المطلوبة'));
      const m = questMult(); addGold(Math.round(q.gold * m)); g.gp += q.gp; S.stats.quests++;
      log(L`📬 سلّمت ${q.qty} ${ITEMS[q.item].e} ${ITEMS[q.item].n}: +${fmt(q.gold * m)}💰 +${q.gp} نقاط`, 'good');
    } else {
      if (g.active.length >= questSlots()) return toast(L('كل الخانات مشغولة'));
      g.active.push({ ...q, t: 0, chance: chanceOf(q) });
      log(L`📜 بدأت مهمة «${Lx(q.n)}»`);
    }
    g.board.splice(i, 1); g.boardT = 0;
  },
  refreshBoard: () => {
    const c = refreshCost(); if (S.gold < c) return;
    S.gold -= c; S.guild.board = []; fillBoard();
  },
  upgrade: v => {
    const l = S.tools[v] + 1; if (l > 6) return;
    const c = toolCost(l);
    if (S.gold < c.gold || have(c.ore) < c.qty) return;
    S.gold -= c.gold; take(c.ore, c.qty); S.tools[v] = l;
    const t = TOOLS.find(x => x.id === v);
    log(L`🔨 الحداد قاسم طوّر ${t.n} إلى ${TIER[l]}!`, 'good');
  },
  sell1: v => { sellItem(v, 1); },
  sellAll: v => { const g = sellItem(v, have(v)); if (g) toast(`+${fmt(g)}💰`); },
  shipAll: () => { const g = shipAll(false); if (!g) toast(L('لا يوجد ما يُباع (أو كله مقفل)')); },
  lock: v => { if (S.locked[v]) delete S.locked[v]; else S.locked[v] = 1; },
  gift: v => {
    const [nid, item] = v.split(':'); const np = NPC_BY[nid];
    const st = S.npc[nid] || (S.npc[nid] = { pts: 0, gd: 0 });
    if (st.gd === dayAbs() || st.pts >= 1000 || ![np.love, np.like].includes(item) || !take(item)) return;
    const before = hearts(nid), loved = item === np.love;
    st.pts = Math.min(1000, st.pts + (loved ? 100 : 50)); st.gd = dayAbs();
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
    openModal(`<div class="npc-story">${icon('npc-' + v + '-' + Math.min(2, Math.floor(hr / 4)), 112)}<div><h2>${np.n}</h2><small class="hint">${np.role}</small></div></div><p class="npc-story-text">${np.story}</p><div class="row"><button class="btn ghost" data-a="closeBox">✖</button></div>`);
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
  setGender: v => { if (S.spouse || !GENDER[v]) return; S.gender = v; lastSig = ''; toast(L`${GENDER[v].e} تم تحديد شخصيتك: ${GENDER[v].n}`); },
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
    localStorage.removeItem(SAVE_KEY); S = newState(); logs = []; logDirty = true; lastSig = ''; showIntro();
  },
  start: () => {
    const nm = ($('nameIn').value || '').trim() || L('المزارع');
    S.name = nm.slice(0, 20); S.leg.family = S.name; S.gender = introGender; S.started = true; S.last = Date.now();
    fillBoard(); closeModal();
    log(L`🏡 ${gv(L('وصل'), L('وصلت'))} ${S.name} إلى قرية وادي الصدى. حياة جديدة تبدأ!`, 'season');
    log(L('💡 ابدأ بزراعة اللفت، ثم بِع المحصول من السوق.'));
    save();
  },
  closeModal: () => closeModal(),
  side: v => { sideTab = v; lastBuffs = ''; renderSide(); },
};
function toolCost(l) {
  const disc = 1 - 0.03 * hearts('smith');
  return { gold: Math.round(500 * Math.pow(6, l - 1) * disc), ore: ORES[l - 1].id, qty: Math.round((10 + 10 * l) * disc) };
}
function bCost(b) { return Math.round(b.cost * Math.pow(b.mult || 1, S.bld[b.id] || 0)); }
function refreshCost() { return 25 * Math.pow(rankIdx() + 1, 2); }

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
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const fn = A[b.dataset.a]; if (!fn) return;
  if (WORK_ACTIONS[b.dataset.a] && !workClickOk(e)) return;
  const earnedBefore = S.gold, harvestsBefore = S.stats.harvests;
  const selectedPlot = b.dataset.a === 'plot' ? S.farm.plots[+b.dataset.v] : null;
  const harvested = b.dataset.a === 'harvestAll' ? S.farm.plots.filter(isReady).slice(0,6).map(p=>p.c) : selectedPlot && isReady(selectedPlot) ? [selectedPlot.c] : [];
  fn(b.dataset.v, b);
  if (['dig','cast'].includes(b.dataset.a)) { burstVisual(b); floatVisual(b, b.dataset.a === 'cast' ? icon('water',24) : icon('copper',24)); }
  if (S.stats.harvests > harvestsBefore) harvested.forEach(c=>floatVisual(b, '+1 ' + icon(c,24)));
  if (['sell1','sellAll','shipAll'].includes(b.dataset.a) && S.gold > earnedBefore) { floatVisual($('hGold'), '+' + fmt(S.gold-earnedBefore) + ' ' + icon('coin',24)); burstVisual($('hGold')); }
  render(true);
});

/* ---------------- الواجهة ---------------- */
const TABS = [
  ['farm', L('🌱 المزرعة')], ['barn', L('🐄 الحظيرة')], ['mine', L('⛏️ المنجم')], ['lake', L('🎣 البحيرة')], ['guild', L('⚔️ النقابة')],
  ['smith', L('🔨 الحداد')], ['market', L('🛒 السوق')], ['village', L('🏘️ القرية')], ['legacy', L('🌳 الإرث')], ['settings', L('⚙️ المزيد')],
];
function renderTabs() {
  const ready = S.farm.plots.filter(isReady).length;
  const badge = { farm: !on('harvester') && ready ? ready : 0, legacy: canRetire() ? '⭐' : 0 };
  $('tabs').innerHTML = tabsMarkup(TABS,badge,tab);
}
function skillBar(k) {
  return `<div class="skill"><span>${SKILL_N[k]} <b id="sk_${k}_l"></b></span><div class="bar xp"><i id="sk_${k}_b"></i></div><small id="sk_${k}_t"></small></div>`;
}
function costBtn(a, v, cost, label, cls = 'gold', extraDisabled = false) {
  return `<button class="btn ${cls}" data-a="${a}" ${v !== undefined ? `data-v="${v}"` : ''} ${extraDisabled ? 'disabled' : `data-cost="${cost}"`}>${label}</button>`;
}

/* ----- المزرعة ----- */
function viewFarm() {
  const s = SEASONS[S.season], gh = on('greenhouse');
  let h = L`<div class="panel"><div class="ph"><h2>🌱 المزرعة</h2>${skillBar('farm')}</div>
  <details class="farm-help"><summary>${glyph("help")} إرشادات الزراعة وموسم ${s.n}</summary><p class="hint">${icon(s)} نحن في موسم <b>${s.n}</b>: محاصيل الموسم تنمو بسرعة كاملة وغيرها بنصف السرعة${gh ? L(' — البيت المحمي يلغي ذلك ✅') : ''}.
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
    const full = si === S.season || gh || si === 4;
    const SL = si < 4 ? SEASONS[si] : { e: '🌟', n: L('نادرة') };
    const sub = si === 4 ? (S.leg.gen >= 3 ? L('كل المواسم ✔') : L('🔒 الجيل 3')) : si === S.season ? L('الموسم الحالي ✔') : gh ? L('البيت المحمي ✔') : L('نصف السرعة');
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
      if (n && BREEDABLE.includes(a.id)) { const g = grades(a.id); h += L`<div class="grades"><span class="g-norm">${icon(a,40)}<b>عادي</b><em>×${g.n0}</em></span><span class="g-prem">${icon(a.id+'-p',40)}${gradeBadge('p')}<b>ممتاز</b><em>×${g.p}</em></span><span class="g-gold">${icon(a.id+'-g',40)}${gradeBadge('g')}<b>ذهبي</b><em>×${g.g}</em></span></div>`; }
      if (n) h += L`<div class="kv"><span>الإنتاج</span><span id="an_tt_${a.id}"></span></div><div class="bar"><i id="an_t_${a.id}"></i></div>
        <div class="kv"><span>السعادة</span><span id="an_hh_${a.id}"></span></div><div class="bar joy"><i id="an_h_${a.id}"></i></div>`;
      h += `<div class="row">${costBtn('buyAnimal', a.id, c, L`شراء (${fmt(c)}💰)`, 'gold', n >= barnCap())}
        ${n && !on('rancher') ? L`<button class="btn ghost" data-a="pet" data-v="${a.id}">🤲 دلّل</button>` : ''}</div>`;
    }
    h += '</div>';
  }
  return h + '</div></div>' + breedPanel();
}
function breedPanel() {
  const lvlOk = S.skills.ranch.l >= GRADE.p.lvl;
  let h = L`<div class="panel"><div class="ph"><h2>🧬 بيت التهجين</h2></div>
  <p class="hint">حط حيوانين من نفس الدرجة وهجّنهم! لو نجح التهجين يصيرون الاثنين درجة أعلى، ولو فشل <b>تخسرهم الاثنين</b>. بعد كل محاولة البيت يرتاح ${ftime(houseRest())}، وكل ما عندك بيوت أكثر تقدر تهجّن أكثر. طوّر «أدوات التهجين» من السوق عشان ترتفع النسبة ويقل الانتظار.
  <b>الممتاز ${gradeBadge('p')}</b> ينتج ضعف الإنتاج. <b>الذهبي ${gradeBadge('g')}</b> ينتج ضعف الإنتاج من منتج ذهبي سعره ×5. الدرجات تبدأ من جديد مع كل جيل.</p>`;
  if (!lvlOk) return h + L`<p class="hint">🔒 يتطلب مستوى رعي ${GRADE.p.lvl}</p></div>`;
  h += '<div class="houses">';
  for (let i = 0; i < houseCount(); i++) h += `<span class="house" id="hs${i}"></span>`;
  h += '</div>';
  if (houseCount() < HOUSE_MAX) h += `<div class="row">${costBtn('buyHouse', '', houseCost(), L`🏠 بيت تهجين جديد (${houseCount() + 1}/${HOUSE_MAX}) — ${fmt(houseCost())}💰`)}</div>`;
  h += '<div class="grid">';
  let any = false;
  for (const id of BREEDABLE) {
    const a = ANIMALS.find(x => x.id === id); if (S.skills.ranch.l < a.lvl || !(S.barn.n[id] || 0)) continue;
    any = true;
    h += `<div class="card"><div class="top"><span class="big">${icon(a,48)}</span><div class="meta"><b>${a.n}</b></div></div>`;
    for (const to of ['p', 'g']) {
      const G = GRADE[to], why = breedBlock(a, to);
      h += L`<div class="kv grade-line g-${to}"><span>${gradeBadge(to)} ${G.n} ×2</span><span>نسبة النجاح ${Math.round(breedChance(to) * 100)}%</span></div>
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
  <div class="minebox"><button class="digbtn" data-a="dig"><span class="dig-scene">${icon("rock",64)}${icon("pick-" + S.tools.pick,48)}</span>احفر!</button>
  <div class="mineinfo">
    <div class="depth">الطابق <span id="m_depth"></span> <small style="font-size:14px;color:var(--muted)">/ الأعمق <span id="m_max"></span></small></div>
    <div class="kv"><span>صلابة الصخرة</span><span id="m_hard"></span></div><div class="bar"><i id="m_prog"></i></div>
    <div class="kv"><span>التقدم نحو الطابق التالي</span><span id="m_blocks"></span></div>
    <div class="kv"><span>قوة الضربة</span><span id="m_click"></span></div>
    <div class="kv"><span>${icon('worker-miner',24)} العمال: ${S.mine.miners}</span><span id="m_rate"></span></div>
    <div class="row">${costBtn('hireMiner', undefined, minerCost(), L`${icon('worker-miner',24)} وظّف عامل (${fmt(minerCost())}💰)`)}${owned('miners') ? togBtn('miners') : ''}</div>
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
function updMine() {
  const m = S.mine; if (!$('m_depth')) return;
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
  let h = L`<div class="two"><div>
  <div class="panel"><div class="ph"><h2>🧑 ${S.name}</h2><span class="stat">⚔️ مستوى <b id="h_lvl"></b></span></div>
    <div class="kv"><span>❤️ الصحة</span><span id="h_hpt"></span></div><div class="bar hp"><i id="h_hp"></i></div>
    <div class="kv"><span>✨ الخبرة</span><span id="h_xpt"></span></div><div class="bar xp"><i id="h_xp"></i></div>
    <div class="row" id="h_stats"></div>
    <p class="hint">طوّر السيف والدرع عند الحداد. الطعام من مزرعتك يشفيك أثناء القتال (المقفل 🔒 لا يؤكل).</p>
  </div>
  <div class="panel"><div class="ph"><h2>🕳️ الزنزانة</h2><span class="stat">أنت في الطابق <b>${D.floor}</b> • المفتوح حتى <b>${D.max}</b></span></div>
    ${P('w_ally') ? L('<p class="hint">🛡️ رفيق المعارك يقاتل معك.</p>') : ''}
    <div class="row">
      <button class="btn ${D.active ? 'red' : ''}" data-a="dunToggle">${D.active ? L('🏃 انسحاب') : L('🗡️ دخول الزنزانة')}</button>
      <button class="btn ghost sm" data-a="floor" data-v="-1" ${D.floor <= 1 ? 'disabled' : ''}>◀ طابق أسهل</button>
      <button class="btn ghost sm" data-a="floor" data-v="1" ${D.floor >= D.max ? 'disabled' : ''}>طابق أصعب ▶</button>
      <button class="btn ghost sm" data-a="floorMax" ${D.floor >= D.max ? 'disabled' : ''}>⏭ الأعلى</button>
    </div>
    <div class="row">
      <button class="btn ghost sm" data-a="dunAuto">${D.auto ? '✅' : '⬜'} تقدم تلقائي</button>
      <button class="btn ghost sm" data-a="dunEat">${D.autoEat ? '✅' : '⬜'} أكل تلقائي</button>
      <button class="btn ghost sm" data-a="eatNow">🍽️ كُل الآن</button>
    </div>
    <div class="duninfo" id="dunInfo"></div>
    <div class="enemy" id="enemyBox"></div>
  </div></div><div>
  <div class="panel"><div class="ph"><h2>📜 نقابة المرتزقة</h2><span class="rank">${RANKS[r][0]}</span></div>
    <div class="kv"><span>نقاط النقابة</span><span id="g_gpt"></span></div><div class="bar gp"><i id="g_gp"></i></div>
    <p class="hint">مهمات الصيد تعمل في الخلفية ونسبة نجاحها تعتمد على قوتك (⚡ <b id="g_pow"></b>). مهمات التوصيل تسلمها فوراً من مخزونك. الخانات: ${g.active.length}/${questSlots()}</p>
    <h3>المهمات الجارية</h3>`;
  if (!g.active.length) h += L('<p class="hint">لا توجد مهمات جارية.</p>');
  g.active.forEach(q => {
    h += L`<div class="quest"><div class="qi"><b>⚔️ ${Lx(q.n)}</b><small>نسبة النجاح ${Math.round(q.chance * 100)}% • ${fmt(q.gold * questMult())}💰</small><div class="bar"><i id="q_${q.id}"></i></div></div><small id="qt_${q.id}"></small></div>`;
  });
  h += L`<h3>لوحة المهمات</h3>`;
  if (!g.board.length) h += L('<p class="hint">لا توجد مهمات الآن، تأتي مهمة جديدة كل 40 ثانية.</p>');
  g.board.forEach(q => {
    if (q.type === 'deliver') {
      const it = ITEMS[q.item], ok = have(q.item) >= q.qty;
      h += L`<div class="quest"><div class="qi"><b>📦 توصيل ${q.qty} × ${icon(it)} ${it.n}</b><small>لديك ${fmt(have(q.item))} • المكافأة ${fmt(q.gold * questMult())}💰 + ${q.gp} نقاط</small></div>
        <button class="btn sm" data-a="quest" data-v="${q.id}" ${ok ? '' : 'disabled'}>سلّم</button></div>`;
    } else {
      const ch = chanceOf(q), cl = ch >= 0.8 ? 'hi' : ch >= 0.4 ? 'mid' : 'lo';
      h += L`<div class="quest"><div class="qi"><b>⚔️ ${Lx(q.n)}</b><small>القوة المطلوبة ${fmt(q.req)} • ⏱ ${ftime(q.dur)} • ${fmt(q.gold * questMult())}💰 + ${q.gp} نقاط + ${fmt(q.xp)} خبرة</small>
        <small>نسبة النجاح: <span class="chance ${cl}">${Math.round(ch * 100)}%</span></small></div>
        <button class="btn sm" data-a="quest" data-v="${q.id}" ${g.active.length >= questSlots() ? 'disabled' : ''}>قبول</button></div>`;
    }
  });
  h += `<div class="row">${costBtn('refreshBoard', undefined, refreshCost(), L`🔄 مهمات جديدة (${fmt(refreshCost())}💰)`, 'ghost sm')}</div></div></div></div>`;
  return h;
}
function assess(f) {
  const e = makeEnemy(f), a = heroAtk(), d = heroDef();
  const hd = Math.max(1, a * a / (a + e.def)), ed = Math.max(1, e.atk * e.atk / (e.atk + d)) / 1.25;
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
  let x = L`<div class="kv"><span>صعوبة الطابق ${D.floor} (الحالي)${boss(D.floor)}</span>${diffTag(D.floor)}</div>`;
  if (D.floor < D.max) {
    x += L`<div class="kv"><span>صعوبة الطابق ${D.floor + 1}${boss(D.floor + 1)}</span>${diffTag(D.floor + 1)}</div>
      <p class="ok">✅ الطابق ${D.floor + 1} مفتوح لك — اضغط «طابق أصعب ▶» للانتقال إليه الآن.</p>`;
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
  const lo = RANKS[r][1], hi = RANKS[r + 1] ? RANKS[r + 1][1] : null;
  $('g_gp').style.width = (hi ? (g.gp - lo) / (hi - lo) * 100 : 100) + '%';
  $('g_gpt').textContent = hi ? L`${fmt(g.gp)} / ${fmt(hi)} للرتبة ${RANKS[r + 1][0]}` : L`${fmt(g.gp)} — أعلى رتبة!`;
  $('g_pow').textContent = fmt(heroPower());
  g.active.forEach(q => {
    const b = $('q_' + q.id); if (!b) return;
    b.style.width = (q.t / q.dur * 100) + '%';
    $('qt_' + q.id).textContent = ftime(q.dur - q.t);
  });
}

/* ----- الحداد ----- */
function viewSmith() {
  let h = L`<div class="panel"><div class="ph"><h2>🔨 ورشة الحداد قاسم</h2><span class="stat">خصم الصداقة ${3 * hearts('smith')}%</span></div>
  <p class="hint">كل تطوير يحتاج ذهباً ومعدناً من المنجم. المعادن مقفلة 🔒 في السوق افتراضياً حتى لا تبيعها بالخطأ.</p><div class="smith-scene" aria-hidden="true">${icon("npc-smith-1",64)}${icon("anvil",64)}${icon("iron",64)}</div><div class="grid">`;
  for (const t of TOOLS) {
    if (t.id === 'rod' && S.leg.gen < 2) continue;
    const l = S.tools[t.id];
    h += L`<div class="card"><div class="top"><span class="big">${icon(t.id + '-' + l,48)}</span><div class="meta"><b>${t.n} ${TIER[l]}</b><small>المستوى ${l} من 6</small></div></div>
      <div class="kv nowrow"><span>✅ الحالي</span><span>${t.eff(l)}</span></div>`;
    if (l < 6) {
      const c = toolCost(l + 1), o = ITEMS[c.ore], ok = S.gold >= c.gold && have(c.ore) >= c.qty;
      h += `<div class="tool-compare">${icon(t.id + '-' + l,48)}<span aria-hidden="true">←</span>${icon(t.id + '-' + (l+1),48)}</div>`;
      h += L`<div class="kv"><span>⬆️ التالي: ${TIER[l + 1]}</span><span>${t.eff(l + 1)}</span></div>
        <div class="kv"><span>التكلفة</span><span>${fmt(c.gold)}💰 + ${c.qty} ${icon(o)} (لديك ${fmt(have(c.ore))})</span></div>
        <div class="row"><button class="btn gold" data-a="upgrade" data-v="${t.id}" ${ok ? '' : 'disabled'}>🔨 طوّر</button></div>`;
    } else h += L('<p class="hint">✨ وصل لأعلى مستوى!</p>');
    h += '</div>';
  }
  return h + '</div></div>';
}

/* ----- السوق ----- */
// Market upgrade for the breeding houses: 3 levels, each with a shorter rest and better chances.
function labPanel() {
  if (S.skills.ranch.l < GRADE.p.lvl) return '';
  const lv = S.barn.lab || 0, cur = breedLv(), nx = BREED_LV[lv + 1];
  const line = x => L`⏳ ${ftime(x.rest)} • ${gradeBadge('p')} ${Math.round(x.p * 100)}% • ${gradeBadge('g')} ${Math.round(x.g * 100)}%`;
  return L`<div class="panel"><div class="ph"><h2>🧬 أدوات التهجين</h2><span class="stat">المستوى ${lv + 1}/${BREED_LV.length}</span></div>
    <p class="hint">تطوير لبيوت التهجين: يقلل وقت راحة البيت ويرفع نسبة النجاح. يرجع للمستوى الأول مع كل جيل.</p>
    <div class="kv"><span>الحالي</span><span>${line(cur)}</span></div>
    ${nx ? L`<div class="kv"><span>التالي</span><span>${line(nx)}</span></div><div class="row">${costBtn('buyLab', '', nx.cost, L`🧬 طوّر (${fmt(nx.cost)}💰)`)}</div>` : L('<p class="hint">✨ وصلت لأعلى مستوى</p>')}</div>`;
}
function viewMarket() {
  const ids = Object.keys(S.inv).filter(id => have(id) > 0);
  let total = 0; ids.forEach(id => { if (!S.locked[id]) total += sellPrice(id) * have(id); });
  let h = L`<div class="panel"><div class="ph"><h2>🛒 السوق والمخزن</h2>
    <button class="btn gold" data-a="shipAll">💰 بيع كل غير المقفل (<span id="mk_total">${fmt(total)}</span>💰)</button></div>
    ${dealCrop() ? L`<p class="hint">🧺 تاجر الموسم يشتري ${CROP[dealCrop()].e} ${CROP[dealCrop()].n} بـ ×3 السعر هذا الموسم.</p>` : ''}<p class="hint">🔒 = محمي من البيع الجماعي ومن صندوق الشحن ومن الأكل التلقائي. ${S.bld.bin ? L('📦 صندوق الشحن يبيع غير المقفل كل صباح.') : L('ابنِ صندوق الشحن في القرية ليبيع عنك تلقائياً.')}</p>${owned('bin') ? `<div class="row">${togBtn('bin')}</div>` : ''}`;
  if (!ids.length) return h + L('<p class="hint">المخزن فارغ. ازرع واحصد أولاً!</p></div>') + labPanel();
  for (const cat of Object.keys(CAT_NAMES)) {
    const list = ids.filter(id => ITEMS[id].cat === cat); if (!list.length) continue;
    h += `<h3>${CAT_NAMES[cat]}</h3><div class="inv">`;
    for (const id of list) {
      const it = ITEMS[id];
      h += L`<div class="it"><button class="lock" data-a="lock" data-v="${id}" title="قفل/فتح">${S.locked[id] ? '🔒' : '🔓'}</button><span class="e">${icon(it)}</span>
        <div class="nm"><b>${it.n}</b> × <span id="inv_${id}">${fmt(have(id))}</span><small>${fmt(sellPrice(id))}💰 للواحدة</small></div>
        <button class="btn ghost sm" data-a="sell1" data-v="${id}">بيع 1</button><button class="btn sm gold" data-a="sellAll" data-v="${id}">الكل</button></div>`;
    }
    h += '</div>';
  }
  return h + '</div>' + labPanel();
}
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
  let h = L`<div class="panel"><div class="ph"><h2>🏘️ أهل وادي الصدى</h2></div>
  <p class="hint">أهدِ كل شخص ما يحبه مرة واحدة يومياً. كل قلبين تقريباً يمنحك مكافأة دائمة (حتى 10 قلوب).</p>
  ${!S.gender ? L`<div class="zonebox"><b>🧑 حدد شخصيتك</b> <small class="hint">عشان يظهر لك خيار الزواج من أهل القرية المناسبين</small>${genderPick('setGender', null)}</div>` : ''}<div class="grid">`;
  for (const np of NPCS) {
    const st = S.npc[np.id] || { pts: 0, gd: 0 }, hr = Math.floor(st.pts / 100), half = st.pts % 100 >= 50, today = st.gd === dayAbs();
    let hs = '';
    for (let i = 0; i < 10; i++) hs += i < hr ? '❤' : (i === hr && half) ? '<span class="half">❤</span>' : '♡';
    h += L`<div class="card npc-card"><button class="npc-info" data-a="npcInfo" data-v="${np.id}" title="القصة" aria-label="القصة">?</button><div class="top"><span class="big">${icon('npc-' + np.id + '-' + Math.min(2,Math.floor(hr/4)),96)}</span><div class="meta"><b>${np.n}</b><small class="npc-role">${np.role}</small>
      <div class="hearts">${hs}</div><small>المكافأة: ${np.perk(hearts(np.id))}${S.spouse === np.id ? L(' (مضاعفة 💍)') : ''}</small></div></div>
      <div class="say">«${np.lines[Math.min(2, Math.floor(hr / 4))]}»</div><div class="gifts">`;
    for (const [it, lab, cls] of [[np.love, L('❤️ يعشقه: +1 قلب'), 'gold'], [np.like, L('💗 يحبه: +½ قلب'), 'ghost']]) {
      const I = ITEMS[it];
      h += `<button class="btn ${cls} sm" data-a="gift" data-v="${np.id}:${it}" ${today || have(it) < 1 || st.pts >= 1000 ? 'disabled' : ''}>🎁 ${icon(I)} ${I.n} (${fmt(have(it))}) — ${lab}</button>`;
    }
    let mar = '';
    if (S.spouse === np.id) mar = L('<p class="okline">💍 شريك حياتك — مكافأته مضاعفة ويساعدك (+10% لكل الإنتاج)</p>');
    else if (canWed(np) && st.pts >= 1000 && !S.spouse) mar = S.leg.gen >= 5 ? `<div class="row">${costBtn('marry', np.id, 50000, L('💍 اطلب الزواج (50,000💰)'), 'red')}</div>` : L('<small class="hint">💍 الزواج ينفتح في الجيل الخامس</small>');
    h += `</div>${today ? L('<small class="hint">✔ أهديته اليوم، ارجع بكرة</small>') : ''}${mar}</div>`;
  }
  h += L`</div></div><div class="panel"><div class="ph"><h2>🏗️ المباني والعمال</h2><div class="row" style="margin:0"><button class="btn ghost sm" data-a="allAuto" data-v="off">⏸️ إيقاف كل التلقائي</button><button class="btn ghost sm" data-a="allAuto" data-v="on">🟢 تشغيل الكل</button></div></div><p class="hint">هنا تصبح اللعبة "idle" فعلاً: وظّف من يعمل عنك. تقدر توقف أي عامل مؤقتاً لو تبغى تجرب شي بنفسك.</p><div class="grid">`;
  for (const b of BUILDINGS) {
    const l = S.bld[b.id] || 0, max = b.max || 1, c = bCost(b), done = l >= max, need = b.req && !S.bld[b.req];
    h += `<div class="card"><div class="top"><span class="big">${icon('building-' + b.id,64)}</span><div class="meta"><b>${b.n}</b>${max > 1 ? ` (${l}/${max})` : ''}<small>${b.desc}</small></div></div>
      <div class="row">${done ? L('<span class="stat">✅ مكتمل</span>') : need ? L`<span class="stat">يتطلب ${BUILDINGS.find(x => x.id === b.req).n}</span>` : costBtn('build', b.id, c, `${l ? L('تطوير') : L('شراء')} (${fmt(c)}💰)`)}${l && TOGGLES[b.id] ? togBtn(b.id) : ''}</div></div>`;
  }
  return h + '</div></div>';
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
    <h3>🧑 شخصيتك</h3>${S.spouse ? L`<p class="hint">${S.gender ? GENDER[S.gender].e + ' ' + GENDER[S.gender].n : ''} — متزوج${gv('', L('ة'))} من ${NPC_BY[S.spouse].n} 💍</p>` : L`${genderPick('setGender', S.gender)}<p class="hint">يحدد من تقدر تتزوج من أهل القرية. ولدك أو بنتك في الجيل القادم تختاره عند التقاعد.</p>`}${langPick()}${sitePanel()}${typeof tutPanel === 'function' ? tutPanel() : ''}${typeof audioPanel === 'function' ? audioPanel() : ''}${typeof statsPanel === 'function' ? statsPanel() : ''}${typeof cloudPanel === 'function' ? cloudPanel() : ''}</div></div>`;
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
function prodSources() {
  return [[L('💍 الزواج'), S.spouse ? 1.1 : 1], [L('🌈 بركة الوادي'), bless()], [L('🐌 مكافأة تحدي الزمن البطيء'), 1 + 0.1 * CC('slow')], [L('⚠️ تحدي الزمن البطيء (نشط)'), inCh('slow') ? 0.5 : 1]];
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
  const g = buffGroup, prod = prodSources();
  let h = '';
  h += g(L('🌱 سرعة نمو المحاصيل'), [[L`🌾 المعزقة ${TIER[S.tools.hoe]}`, 1 + 0.2 * S.tools.hoe], [L`📈 مستوى الزراعة ${S.skills.farm.l}`, 1 + 0.02 * (S.skills.farm.l - 1)],
    [L`👩‍🌾 نورة (${hearts('noura')} قلوب)`, 1 + 0.03 * hearts('noura')], [L('🌳 تربة خصبة'), 1 + 0.25 * P('f_grow')], [L('❄️ مكافأة تحدي الشتاء'), 1 + 0.15 * CC('winter')], ...prod],
    [[L('💧 الحوض المسقي'), '×' + waterMult().toFixed(2)], [L('🍂 خارج الموسم'), on('greenhouse') ? L('بدون عقوبة 🏡') : '×0.50'],
      [L('🧺 فرصة حصاد مضاعف'), Math.round(S.skills.farm.l + 3 * H('seedbag')) + '%'], ...(P('f_golden') ? [[L('✨ فرصة محصول ذهبي'), P('f_golden') + '%']] : [])]);
  h += g(L('🐄 سرعة الإنتاج الحيواني'), [[L`📈 مستوى الرعي ${S.skills.ranch.l}`, 1 + 0.02 * (S.skills.ranch.l - 1)], [L('🌳 حيوانات سعيدة'), 1 + 0.2 * P('r_speed')], ...prod],
    [[L('❤️ السعادة'), L('من ×0.5 إلى ×1.5') + (on('rancher') ? L(' (الراعي يبقيها كاملة)') : '')], ...(P('r_cost') ? [[L('🏷️ سعر الحيوانات'), '-' + 10 * P('r_cost') + '%']] : [])]);
  h += g(L('⛏️ قوة الحفر'), [[L`⛏️ الفأس ${TIER[S.tools.pick]}`, 1 + 0.6 * S.tools.pick], [L`📈 مستوى التعدين ${S.skills.mine.l}`, 1 + 0.05 * (S.skills.mine.l - 1)],
    [L('🌳 سواعد قوية'), 1 + 0.3 * P('m_power')], [L('🕳️ مكافأة تحدي تحت الأرض'), 1 + 0.2 * CC('underground')], ...prod],
    [[L('💎 فرصة الجواهر'), '×' + ((1 + 0.5 * P('m_gem')) * (1 + 0.2 * CC('underground'))).toFixed(2)], [L('🪨 أقصى عمق للفأس'), PICK_CAP[S.tools.pick] > 1e8 ? '∞' : PICK_CAP[S.tools.pick]]]);
  if (S.leg.gen >= 2) h += g(L('🎣 قوة الصيد'), [[L`🎣 السنارة ${TIER[S.tools.rod]}`, 1 + 0.5 * S.tools.rod], [L`📈 مستوى الصيد ${S.skills.fish.l}`, 1 + 0.03 * (S.skills.fish.l - 1)], [L('🌳 سواعد قوية'), 1 + 0.3 * P('m_power')], ...prod]);
  h += g(L('💰 الذهب من كل المصادر'), [[L`👴 العمدة (${hearts('mayor')} قلوب) — البيع فقط`, 1 + 0.02 * hearts('mayor')], [L('🌳 مساومة'), 1 + 0.1 * P('t_price')], [L('🪙 العملة القديمة'), 1 + 0.05 * H('coin')],
    [L('🙅 مكافأة تحدي بدون عمال'), 1 + 0.1 * CC('noworkers')], [L`🏅 الإنجازات (${Object.keys(S.leg.ach).length})`, achMult()], [L('🌈 بركة الوادي'), bless()], [L('⚠️ تحدي القحط (نشط)'), inCh('poverty') ? 0.5 : 1]]);
  h += g(L('⚔️ الهجوم والصحة'), [[L('🌳 دم المحارب'), 1 + 0.15 * P('w_power')], [L('⚔️ مكافأة تحدي المحارب'), 1 + 0.1 * CC('warrior')], [L('🌈 بركة الوادي'), bless()]],
    [[L('🗡️ الهجوم'), fmt(heroAtk()) + L` (السيف +${SWORD[S.tools.sword]})`], [L('🛡️ الدفاع'), fmt(heroDef()) + L` (الدرع +${ARMOR_DEF[S.tools.armor]})`],
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
  let h = L`<div class="panel"><div class="ph"><h2>🎣 بحيرة الوادي</h2>${skillBar('fish')}</div>
  <p class="hint">ارمِ السنارة لتصطاد، أو وظّف صيادين يصطادون عنك. مستوى الصيد يفتح أسماكاً أندر، والسنارة (عند الحداد) تزيد القوة وفرصة النادر. السمك يُباع ويؤكل في المعارك، وأحياناً يطلع صندوق كنز 🧰!</p>
  <div class="minebox"><button class="digbtn lakebtn" data-a="cast"><span class="bobber-scene">${icon("bobber",48)}</span>اصطد!</button>
  <div class="mineinfo">
    <div class="kv"><span>الطُّعم</span><span id="lk_t"></span></div><div class="bar"><i id="lk_p"></i></div>
    <div class="kv"><span>آخر صيدة</span><span id="lk_last"></span></div>
    <div class="kv"><span>قوة الرمية</span><span id="lk_pow"></span></div>
    <div class="kv"><span>${icon('worker-fisher',24)} الصيادون: ${S.lake.fishers}</span><span id="lk_rate"></span></div>
    <div class="row">${costBtn('hireFisher', undefined, fisherCost(), L`${icon('worker-fisher',24)} وظّف صياد (${fmt(fisherCost())}💰)`)}${owned('fishers') ? togBtn('fishers') : ''}</div>
  </div></div><h3>الأسماك</h3><div class="ores">`;
  for (const f of FISH) h += L`<div class="ore ${f.lvl <= S.skills.fish.l ? 'on' : ''}">${icon(f)} <b>${f.n}</b><br><small>صيد ${f.lvl} • ${fmt(sellPrice(f.id))}💰</small></div>`;
  return h + '</div></div>';
}
function updLake() {
  if (!$('lk_p')) return;
  $('lk_p').style.width = (S.lake.prog / biteNeed() * 100) + '%';
  $('lk_t').textContent = `${fmt(S.lake.prog)} / ${fmt(biteNeed())}`;
  const l = S.lake.last;
  const lastCatch = $('lk_last');
  if (lastCatch._fishCount !== undefined && S.stats.fish > lastCatch._fishCount) { floatVisual(document.querySelector('.lakebtn'), '+1 ' + icon(l === 'treasure' ? 'chest' : l,24)); burstVisual(document.querySelector('.lakebtn')); }
  lastCatch._fishCount = S.stats.fish;
  visualText(lastCatch, !l ? '—' : l === 'treasure' ? L('🧰 صندوق كنز') : `${icon(ITEMS[l])} ${ITEMS[l].n}`);
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
    <p class="hint">شرط التقاعد في هذا الجيل: كسب ${fmt(goldGoal())} ذهب <b>أو</b> الوصول للطابق ${dunGoal()}. الشرط يكبر مع كل جيل بعد الثالث. النجوم تزيد كل ما كسبت ذهب أكثر ونزلت أعمق في الزنزانة والمنجم.</p>
  </div><div class="retirebox"><div class="bigstar">${icon("legacy-crown",72)}<span class="legacy-gain-value">+<span id="lg_g"></span></span></div><small class="hint">نجوم لو تقاعدت الآن</small>
    <button class="btn gold" data-a="retire" id="lg_btn">🌅 التقاعد وتسليم المزرعة</button><small class="hint" id="lg_why"></small></div></div>
  ${ch ? L`<div class="chbox"><b>${icon(ch)} تحدي هذا الجيل: ${ch.n}</b> — ${ch.rule}<div class="kv"><span>🎯 ${goalText(ch)}</span><span id="lg_chp"></span></div><div class="bar gp"><i id="lg_chb"></i></div></div>` : ''}
  </div>`;
  h += L`<div class="panel"><h2>🗺️ ما تفتحه الأجيال</h2><div class="road">${ROADMAP.map(([g, t]) => L`<div class="rstep ${LG.gen >= g ? 'done' : ''}"><b>${LG.gen >= g ? '✅' : '🔒'} الجيل ${g}</b><span>${t}</span></div>`).join('')}</div></div>`;
  h += L`<div class="panel"><div class="ph"><h2>${icon("legacy-tree",32)} شجرة الإرث</h2><span class="stat starchip">${icon("legacy-crown",24)} ${fmt(LG.stars)}</span></div><p class="hint">ابدأ من أول مهارة في كل فرع: كل 3 مستويات تفتح لك فرع جديد، ولما تصرف ${KS_NEED} مستويات في فرع تنفتح مهارته الخاصة ⭐. المهارات المعلّمة بـ 🌱 تطبق من بداية الجيل القادم، إلا لو اشتريتها في أول يومين من الجيل فتطبق عليك فوراً. الباقي يشتغل فوراً دائماً.</p>
  <div class="row"><button class="btn ghost sm" data-a="respec" ${S.gen.respec || !perkSpent() ? 'disabled' : ''}>↺ إعادة توزيع النقاط</button><small class="hint">${S.gen.respec ? L('استخدمتها في هذا الجيل') : L('مجانية، مرة وحدة كل جيل')}</small></div>`;
  for (const [b, bn] of Object.entries(BRANCHES)) {
    const list = PERKS.filter(x => x.b === b), lv = branchLv(b), ks = list.find(x => x.ks);
    h += L`<div class="ptree"><div class="ptree-head"><h3>${bn}</h3><span class="stat">${lv} مستوى</span></div>`;
    const tiers = [];
    for (const p of list.filter(x => !x.ks)) (tiers[perkTier(p)] = tiers[perkTier(p)] || []).push(p);
    tiers.push([ks]);
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
  const art = p.ks ? `<span class="ks-mark">${p.e}</span>` : icon('perk-' + p.id, 48);
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
  const can = canRetire(); $('lg_btn').disabled = !can; $('lg_why').textContent = can ? '' : L('ما حققت شرط التقاعد بعد');
  const cb = $('lg_chb');
  if (cb) {
    const c = CHALLENGES.find(x => x.id === S.gen.ch), pr = S.gen.chDone ? 1 : Math.min(1, chValue(c) / chGoal(c));
    cb.style.width = pr * 100 + '%';
    $('lg_chp').textContent = S.gen.chDone ? L('✅ أنجزته!') : `${fmt(chValue(c))} / ${fmt(chGoal(c))}`;
  }
}

const VIEWS = {
  farm: [viewFarm, updFarm, () => [S.off, S.leg.gen, zoneMode, S.bld.zoning, S.farm.plots.length, S.farm.seed, S.skills.farm.l, S.tools.can, S.season, S.weather, S.bld.harvester, S.bld.planter, S.bld.sprinkler, S.bld.greenhouse, hearts('mayor')]],
  barn: [viewBarn, updBarn, () => [S.off, S.skills.ranch.l, barnCap(), S.bld.rancher, ...ANIMALS.map(a => S.barn.n[a.id] || 0), S.barn.q, houseCount(), BREEDABLE.map(id => ['p', 'g'].map(to => breedBlock(ANIMALS.find(x => x.id === id), to)))]],
  mine: [viewMine, updMine, () => [S.off, S.mine.miners, S.tools.pick, ORES.filter(o => o.depth <= S.mine.max).length]],
  guild: [viewGuild, updGuild, () => {
    const D = S.dun, g = S.guild;
    return [D.active, D.resting, D.auto, D.autoEat, D.floor, D.max, rankIdx(), questSlots(), g.active.map(q => q.id), g.board.map(q => q.id + (q.type === 'deliver' ? (have(q.item) >= q.qty) : Math.round(chanceOf(q) * 100)))];
  }],
  smith: [viewSmith, () => {}, () => [S.tools, S.leg.gen, hearts('smith'), TOOLS.map(t => { const l = S.tools[t.id] + 1; if (l > 6) return 0; const c = toolCost(l); return S.gold >= c.gold && have(c.ore) >= c.qty; })]],
  market: [viewMarket, updMarket, () => [S.off, dealCrop(), S.barn.lab, S.skills.ranch.l >= GRADE.p.lvl, Object.keys(S.inv).sort(), Object.keys(S.locked).sort(), S.bld.bin, hearts('mayor')]],
  village: [viewVillage, () => {}, () => [dayAbs(), S.bld, S.npc, S.off, S.spouse, S.gender, S.leg.gen, NPCS.map(n => [have(n.love) > 0, have(n.like) > 0])]],
  lake: [viewLake, updLake, () => [S.off, S.lake.fishers, S.skills.fish.l, S.tools.rod, S.leg.gen]],
  legacy: [viewLegacy, updLegacy, () => { const LG = S.leg; return [LG.stars, LG.perks, S.gen.respec, startNow(), LG.heir, LG.ch, Object.keys(LG.ach).length, LG.gen, S.gen.ch, S.gen.chDone, LG.history.length, dunGoal()]; }],
  settings: [viewSettings, updSettings, () => [S.gender, S.spouse, typeof cloudSig === 'function' ? cloudSig() : 0]],
};

function render(force) {
  if (!S) return;
  const [view, upd, sig] = VIEWS[tab];
  const s = tab + JSON.stringify(sig());
  if (force || s !== lastSig) {
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
  if (logDirty) {
    logDirty = false;
    $('log').innerHTML = pixelHTML(logs.map(l => `<li class="${l.type}"><small>${l.t}</small>${logVisualHTML(l.msg)}</li>`).join(''));
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
  const ready = (on('harvester') ? 0 : S.farm.plots.filter(isReady).length) + (canRetire() ? 1000 : 0);
  if (ready !== lastBadge) { lastBadge = ready; renderTabs(); }
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
  const legal = C.home ? `<p class="hint"><a href="${C.home}privacy.html">${L('سياسة الخصوصية')}</a> · <a href="${C.home}about.html">${L('عن الاستديو')}</a></p>` : '';
  return `<h3>${L('💬 ملاحظاتك')}</h3><p class="hint">${L('هذي نسخة تجريبية. أي شيء عجبك أو ضايقك أو خرب، قل لنا.')}</p><div class="row">${fb}${home}</div>${legal}`;
}
function initSiteLinks() {
  const fb = $('fbBtn');
  if (fb) { fb.textContent = L('💬 ملاحظاتك'); fb.classList.remove('hidden'); }
}
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
  <button class="btn gold" data-a="start" style="width:100%;font-size:17px">🏡 ادخل القرية</button>`);
  setTimeout(() => { const i = $('nameIn'); if (i) { i.focus(); i.onkeydown = e => { if (e.key === 'Enter') A.start(); }; } }, 50);
}
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
  pendingSave = null; S.last = Date.now(); logs = []; logDirty = true; lastSig = '';
  closeModal(); log(L`⬆️ رجعت لحفظ ${esc(S.name)} — الجيل ${S.leg.gen}`, 'season'); toast(L('✅ تم تحميل الحفظ'));
  markMod(info.mod || saveOddity(S)); save();
}
let saveBlocked = false; // set while another save is being written in (move.js)
function save() { if (saveBlocked || !S || !S.started) return; try { localStorage.setItem(SAVE_KEY, encodeSave(S)); localStorage.setItem(SAVE_MARK, '1'); } catch (e) { /* التخزين غير متاح */ } }
function migrate(o) {
  const st = deepMerge(newState(), o);
  if (!o.gen) { st.gen.earned = (o.stats && o.stats.earned) || 0; st.gen.days = Math.max(0, dayAbsOf(st) - 1); }
  if (!st.leg.family) st.leg.family = st.name;
  if (!st.gender && st.spouse && NPC_BY[st.spouse]) st.gender = NPC_BY[st.spouse].g === 'f' ? 'm' : 'f';
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
  offline = true; simulate(secs); offline = false;
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
markMod(loadMod);
if (!S.started) showIntro();
else {
  log(L`🏡 مرحباً بعودتك إلى وادي الصدى يا ${S.name}`);
  fillBoard();
}
render(true);
frame();
setInterval(frame, 100);
setInterval(() => render(false), 200);
setInterval(save, 10000);
setInterval(checkAch, 1000);
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
