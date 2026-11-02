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
  retire: { t: L('🌅 تقدر تتقاعد!'), x: L('حققت شرط التقاعد. روح لصفحة «الإرث» وشوف كم نجمة إرث بتاخذ. كل ما كسبت أكثر قبل التقاعد، تاخذ نجوم أكثر.'), go: 'legacy' },
};

function tipSeen() {
  if (!S.leg.tips) {
    S.leg.tips = {};
    // Players who already finished a generation know these systems: no tips for them.
    if (S.leg.gen >= 2) for (const k in TIPS) S.leg.tips[k] = 1;
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
