'use strict';
/* First-time tips: the first time a player opens a big system, a short card explains it.
   Uses the same card look as the new-player guide (tutorial.js) and waits until that guide is finished.
   Seen tips are kept in S.leg.tips, so they carry across generations and never repeat. */
const TIPS = {
  barn: { t: L('🐄 الحظيرة'), x: L('اشترِ حيوانات تنتج لك منتجات تبيعها، ودلّلها عشان تبقى سعيدة لأن الحيوان الحزين ينتج أبطأ. لما يرتفع مستوى الرعي ينفتح «بيت التهجين»، وتطلع لك حيوانات ممتازة وذهبية تنتج أكثر.') },
  mine: { t: L('⛏️ المنجم'), x: L('اضغط «احفر!» عشان تكسّر الصخور وتجمع المعادن، أو وظّف عمال يحفرون عنك. كل 5 صخور في أعمق طابق تنزلك طابق، والمعادن الأعمق أغلى. طوّر الفأس عند الحداد عشان تنزل أعمق.') },
  guild: { t: L('⚔️ النقابة'), x: L('ادخل الزنزانة وقاتل طابق بعد طابق، والقتال تلقائي. الأكل من مزرعتك يشفيك وقت القتال. ومن لوحة المهمات خذ مهمات ترفع رتبتك وتعطيك ذهب.') },
  lake: { t: L('🎣 البحيرة'), x: L('اضغط «اصطد!» عشان تصطاد، وبِع السمك أو أهده لأهل القرية. وظّف صيادين يصطادون عنك، وطوّر السنارة عند الحداد.') },
  smith: { t: L('🔨 الحداد'), x: L('هنا تطوّر أدواتك بالذهب ومعادن المنجم. كل أداة تقوّي شغلها: المعزقة للنمو، والمرشة للسقي، والفأس للحفر، والسيف والدرع للقتال، والسنارة للصيد.') },
  village: { t: L('🏘️ القرية'), x: L('ابنِ مباني تشتغل عنك، مثل الحصاد والزراعة التلقائية وصندوق الشحن. وأهدِ أهل القرية اللي يحبونه عشان ترتفع قلوبهم وتاخذ مكافآت دائمة، ومن الجيل الخامس تقدر تتزوج.') },
  market: { t: L('🛒 السوق'), x: L('بِع محاصيلك ومنتجاتك هنا. اضغط القفل 🔒 على أي غرض عشان ما ينباع بالبيع الجماعي ولا ينأكل وقت القتال.') },
  legacy: { t: L('🌳 الإرث'), x: L('لما تحقق شرط التقاعد، تسلّم المزرعة لولدك أو بنتك. الجيل الجديد يبدأ من الصفر لكن أقوى: نجوم الإرث تشتري مهارات دائمة من الشجرة، وكل جيل يفتح محتوى جديد.') },
  // The factory's later systems (1.21.3): one card the first time each tab is opened. The first-factory guide (tutorial.js)
  // covers fields, furnaces, the town hall, rails, the workshop and contracts, so those have none.
  dmine: { t: L('⛏️ المنجم العميق'), x: L('ركّب حفّارات تشتغل لحالها، واختر لكل وحدة خام واحد: فحم لمخزن المصنع، أو نحاس أو حديد أو فضة لمخزون القرية. طوّرها عشان تزيد من 2 إلى 30 خام بالثانية. لو خلص عليك الفحم أو الحديد، هنا الحل.') },
  util: { t: L('🎛️ الخدمات'), x: L('ابنِ شركة الكهرباء والمياه ومكتب الضرايب وطوّرهم. كل وحدة تجيب ذهب كل ثانية بدون ما تسوي شي، وتبقى معك بعد تجديد المصنع.') },
  pat: { t: L('🔬 الاختراعات'), x: L('لما يصير مبنى البلدة مستوى 10، جدّد المصنع: يرجع من الصفر وتاخذ براءات اختراع. اصرفها في الخريطة تحت على اختراعات تبقى للأبد. ابدأ بـ«الخدمات العامة»، وكل اختراع يفتح اللي تحته.') },
  train: { t: L('🚂 القطار الأول'), x: L('هذا مشروع اللعبة الأخير: خمس مراحل، وكل وحدة تبي ذهب ومواد كثيرة. تقدمك فيه ما ينعاد مع التجديد. المرحلة الثانية تفتح الميناء والمحاجر، والخامسة تختم اللعبة.') },
  port: { t: L('⚓ الميناء'), x: L('ابنِ الميناء، وبعدها اختر رحلة وحمّل السفينة من مخزنك. الرحلة تاخذ ساعات حقيقية وتكمل واللعبة مقفلة. لما ترجع السفينة استلم ذهبها وبضاعتها الأجنبية، واصرف البضاعة في المتجر تحت على تطويرات للأبد.') },
  quarry: { t: L('🟡 المحاجر انفتحت'), x: L('المحطة الكبرى فتحت لك المحاجر. وظّف عمال في محجر الرمل، واشترِ فرن زجاج وفرن فولاذ من المراجل، وبعدها طاولات النوافذ والعوارض والمحرك البخاري من الورشة. باقي مراحل القطار ورحلة القارة الجديدة يطلبونها.') },
  retire: { t: L('🌅 تقدر تتقاعد!'), x: L('حققت شرط التقاعد. روح لصفحة «الإرث» وشوف كم نجمة إرث بتاخذ. كل ما كسبت أكثر قبل التقاعد، تاخذ نجوم أكثر.'), go: 'legacy' },
};

const TIPS_VILLAGE = ['barn', 'mine', 'guild', 'lake', 'smith', 'village', 'market', 'legacy', 'retire'];
function tipSeen() {
  if (!S.leg.tips) {
    S.leg.tips = {};
    // Players who already finished a generation know these systems: no tips for them.
    if (S.leg.gen >= 2) for (const k of TIPS_VILLAGE) S.leg.tips[k] = 1; // the factory's tips still show: those systems are new to everyone
  }
  return S.leg.tips;
}
function tipBox() {
  let box = document.getElementById('tipBox');
  if (!box) { box = document.createElement('div'); box.id = 'tipBox'; box.className = 'tut-box tip-box hidden'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  return box;
}
let tipNow = '';
function tipCheck() {
  const box = tipBox();
  const busy = typeof S === 'undefined' || !S || !S.started || (typeof tutActive === 'function' && tutActive()) || !$('modal').classList.contains('hidden');
  if (busy) { box.classList.add('hidden'); return; }
  const seen = tipSeen();
  let id = '';
  if (!seen.retire && typeof canRetire === 'function' && canRetire()) id = 'retire';
  else if (TIPS[tab] && !seen[tab]) id = tab;
  else if (!seen.quarry && typeof inInd === 'function' && inInd() && indQOpen() && ['fields', 'furn', 'ws'].includes(tab)) id = 'quarry'; // the quarries live inside three older tabs
  if (!id) { box.classList.add('hidden'); tipNow = ''; return; }
  if (tipNow !== id) {
    tipNow = id;
    const tp = TIPS[id];
    const go = tp.go ? `<button class="btn gold sm" data-a="tipGo" data-v="${id}">${L('🌳 روح للإرث')}</button>` : '';
    box.innerHTML = `<div class="tut-head"><b>${tp.t}</b><small class="tut-count">${L('💡 أول مرة')}</small></div><p>${tp.x}</p><div class="row">${go}<button class="btn ${go ? 'ghost' : 'gold'} sm" data-a="tipOk" data-v="${id}">${L('فهمت ✓')}</button></div>`;
    box.innerHTML = pixelHTML(box.innerHTML);
  }
  box.classList.remove('hidden');
}
A.tipOk = v => { tipSeen()[v] = 1; tipNow = ''; tipCheck(); };
A.tipGo = v => { tipSeen()[v] = 1; tipNow = ''; A.tab(TIPS[v].go); tipCheck(); };
setInterval(tipCheck, 500);
