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
const TUT_COUNT = TUT_STEPS.filter(s => !s.final).length;

function tutInit() {
  // Players who already know the game skip the guide.
  if (!S.tut) S.tut = { step: 0, done: !!S.started && (S.stats.harvests > 20 || S.leg.gen > 1) };
}
function tutActive() { tutInit(); return S.started && !S.tut.done; }

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

let tutShown = -1;
function tutRender() {
  const box = tutBox();
  tutSel = ''; tutTarget = null;
  if (!tutActive() || !$('modal').classList.contains('hidden')) { box.classList.add('hidden'); return; }
  let st = TUT_STEPS[S.tut.step];
  if (!st) { S.tut.done = true; box.classList.add('hidden'); return; }
  if (!st.final && st.done()) {
    S.tut.step++; st = TUT_STEPS[S.tut.step];
    if (st && st.start) st.start();
    if (typeof sfx === 'function') sfx('good');
  }
  if (!st) { S.tut.done = true; box.classList.add('hidden'); return; }
  if (tutShown !== S.tut.step) {
    tutShown = S.tut.step;
    const count = st.final ? '' : `<small class="tut-count">${S.tut.step + 1} / ${TUT_COUNT}</small>`;
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
  const key = S.tut.step + ':' + tab;
  if (tutTarget && tutScrolled !== key) {
    tutScrolled = key;
    const r = tutTarget.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 160) tutTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
let tutScrolled = '';

A.tutDone = () => { tutInit(); S.tut.done = true; tutRender(); };
A.tutRestart = () => { S.tut = { step: 0, done: false }; tutShown = -1; A.tab('farm'); tutRender(); };
setInterval(tutRender, 400);
requestAnimationFrame(tutFollow);
