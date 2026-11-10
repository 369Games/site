'use strict';
/* New-player guide: a small coach card that walks through plant → water → harvest → sell → hire,
   and highlights the button to press. Progress is saved in S.tut. */
const TUT_STEPS = [
  { tab: 'farm', target: '[data-a="plantAll"], .plot.empty',
    text: L('🌱 ابدأ بالزراعة: اضغط على حوض فارغ، أو على «زراعة الكل» عشان تزرع كل الأحواض مرة وحدة.'),
    done: () => S.farm.plots.some(p => p.c) || S.stats.harvests > 0 },
  { tab: 'farm', target: '.plot.growing:not(.wet)',
    text: L('💧 اسقِ زرعك: اضغط على الحوض اللي ينمو، أو على «سقي الكل». الماء يضاعف سرعة النمو.'),
    // Also done when nothing is left to water (crops ripened while away).
    done: () => S.farm.plots.some(p => p.w) || S.stats.harvests > 0 || !S.farm.plots.some(p => p.c && !isReady(p)) },
  { tab: 'farm', target: '[data-a="harvestAll"], .plot.ready',
    text: L('🧺 انتظر شوي... لما يلمع المحصول يكون جاهز. اضغط عليه أو على «حصاد الكل».'),
    done: () => S.stats.harvests > 0 },
  { tab: 'market', target: '[data-a="shipAll"]', start: () => { S.tut.base = S.stats.earned; },
    text: L('🛒 روح للسوق وبِع محصولك عشان تكسب ذهب. زر «بيع كل غير المقفل» يبيع كل شيء مرة وحدة.'),
    done: () => S.stats.earned > (S.tut.base ?? Infinity) },
  { tab: 'village', target: '[data-a="build"][data-v="harvester"]',
    text: L('🏘️ في القرية وظّف «عامل حصاد» بـ 300 ذهب. يحصد عنك تلقائياً، حتى وأنت مسكّر اللعبة.'),
    done: () => (S.bld.harvester || 0) > 0 },
  { final: true,
    text: L('🎉 ممتاز! مزرعتك صارت تشتغل لحالها. كمّل: وظّف عامل زراعة وصندوق شحن، واشترِ حيوانات من الحظيرة، واحفر في المنجم، وطوّر أدواتك عند الحداد.') },
];
// The factory has its own short guide, shown while you're in the Industrial Age (progress in S.leg.ind.tut).
const IND_TUT = [
  { tab: 'fields', target: '[data-a="indHire"]',
    text: L('🗻 أهلاً في المصنع! الحقول تجمع الطين والحجر والخشب لحالها. وظّف عامل، وكل عامل جديد يروح للحقل اللي فيه أقل عمال.'),
    done: () => ind().hired > 0 },
  { tab: 'furn', target: '[data-a="indFurn"][data-v="coal"]',
    text: L('🏭 المراجل تحوّل الخام لمواد. اشترِ أول فرن فحم: الفحم وقود أغلب الوصفات.'),
    done: () => indFu('coal').n > 0 },
  { tab: 'city', target: '[data-a="indHall"]',
    text: L('🏤 مبنى البلدة هو المبنى الرئيسي: ما فيه مبنى ولا حقل يطلع فوق مستواه. طوّره لمستوى 1.'),
    done: () => indHall() > 0 },
  { tab: 'city', target: '[data-a="indBld"][data-v="rails"]',
    text: L('🛤️ ابنِ سكة الحديد: كل مستوى يرخّص عمال المنجم في القرية. والقارب نفس الشي للصيادين.'),
    done: () => indLv('rails') > 0 },
  { tab: 'ws', target: '[data-a="indFurn"][data-v="plank"]',
    text: L('🔧 الورشة تسوي المنتجات: اشترِ طاولة ألواح خشب. المنتجات تحتاجها العقود والمهندس.'),
    done: () => indFu('plank').n > 0 },
  { tab: 'city', target: '[data-a="indK"]',
    text: L('📜 التجار في المدينة يطلبون أشياء تسويها. سلّم أول عقد وخذ ذهب ومخططات 📐 للمهندس.'),
    done: () => (ind().kd || 0) > 0 },
  { final: true,
    text: L('🎉 مصنعك يشتغل! كمّل: وسّع المخزن، وطوّر عند المهندس، وكبّر مبنى البلدة. ولما يصير قصر تقدر تجدّد المصنع وتاخذ براءات اختراع 🎫.') },
];
// Which guide is on: the factory's while you're in it, else the village's.
function tutCtx() {
  if (typeof inInd === 'function' && inInd()) {
    const I = ind();
    if (!I.tut) I.tut = { step: 0, done: indHall() > 0 || (I.kd || 0) > 0 }; // a factory already under way skips it
    return { steps: IND_TUT, st: I.tut, home: 'fields', key: 'ind' };
  }
  tutInit(); return { steps: TUT_STEPS, st: S.tut, home: 'farm', key: 'v' };
}

function tutInit() {
  // Players who already know the game skip the guide.
  if (!S.tut) S.tut = { step: 0, done: !!S.started && (S.stats.harvests > 20 || S.leg.gen > 1) };
}
function tutActive() { return S.started && !tutCtx().st.done; }

function tutPanel() {
  return `<h3>${L('📖 دليل اللاعب')}</h3><div class="row"><button class="btn ghost" data-a="tutRestart">${L('↺ أعد تشغيل الدليل')}</button></div>`;
}

function tutBox() {
  let box = document.getElementById('tutBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'tutBox';
    box.className = 'tut-box hidden';
    box.setAttribute('role', 'status');
    document.body.appendChild(box);
  }
  return box;
}

// A floating ring drawn over the target. The game redraws plots every frame, so a class on the
// element itself would be wiped; the ring follows the element's position instead.
let tutTarget = null, tutSel = '';
function tutRing() {
  let r = document.getElementById('tutRing');
  if (!r) { r = document.createElement('div'); r.id = 'tutRing'; r.className = 'tut-ring hidden'; r.setAttribute('aria-hidden', 'true'); document.body.appendChild(r); }
  return r;
}
function tutFind() {
  if (!tutSel) return null;
  for (const s of tutSel.split(',')) { const el = document.querySelector(s.trim()); if (el) return el; }
  return null;
}
function tutFollow() {
  const r = tutRing();
  if (tutSel && (!tutTarget || !tutTarget.isConnected)) tutTarget = tutFind();
  const rect = tutTarget && tutSel ? tutTarget.getBoundingClientRect() : null;
  if (!rect || !rect.width) { r.classList.add('hidden'); }
  else {
    r.style.left = (rect.left - 6) + 'px'; r.style.top = (rect.top - 6) + 'px';
    r.style.width = (rect.width + 12) + 'px'; r.style.height = (rect.height + 12) + 'px';
    r.classList.remove('hidden');
  }
  requestAnimationFrame(tutFollow);
}

let tutShown = '';
function tutRender() {
  const box = tutBox();
  tutSel = ''; tutTarget = null;
  if (!tutActive() || !$('modal').classList.contains('hidden')) { box.classList.add('hidden'); return; }
  const C = tutCtx(), T = C.st;
  let st = C.steps[T.step];
  if (!st) { T.done = true; box.classList.add('hidden'); return; }
  if (!st.final && st.done()) {
    T.step++; st = C.steps[T.step];
    if (st && st.start) st.start();
    if (typeof sfx === 'function') sfx('good');
  }
  if (!st) { T.done = true; box.classList.add('hidden'); return; }
  if (tutShown !== C.key + T.step) {
    tutShown = C.key + T.step;
    const count = st.final ? '' : `<small class="tut-count">${T.step + 1} / ${C.steps.filter(x => !x.final).length}</small>`;
    const btn = st.final
      ? `<button class="btn gold sm" data-a="tutDone">${L('يلا نلعب! 🚀')}</button>`
      : `<button class="btn ghost sm" data-a="tutDone">${L('تخطّي الدليل')}</button>`;
    box.innerHTML = `<div class="tut-head"><b>${L('📖 دليل اللاعب')}</b>${count}</div><p>${st.text}</p><div class="row">${btn}</div>`;
  }
  box.classList.remove('hidden');
  if (st.final) return;
  // Point at the place to go: the tab first, then the button on that page.
  tutSel = tab === st.tab ? st.target : `#tabs [data-v="${st.tab}"]`;
  tutTarget = tutFind();
  // Bring the target into view once per step and page, if it is off screen.
  const key = C.key + T.step + ':' + tab;
  if (tutTarget && tutScrolled !== key) {
    tutScrolled = key;
    const r = tutTarget.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 160) tutTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
let tutScrolled = '';

A.tutDone = () => { tutCtx().st.done = true; tutRender(); };
A.tutRestart = () => {
  const C = tutCtx(); C.st.step = 0; C.st.done = false; tutShown = ''; A.tab(C.home); tutRender();
};
setInterval(tutRender, 400);
requestAnimationFrame(tutFollow);
