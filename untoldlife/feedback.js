'use strict';
/* In-game feedback form (shared by all 369Games games).
   The player sees our own translated form; answers are posted in the background to one hidden
   Google Form (Arabic) whose responses land in a Google Sheet. */
const FEEDBACK_FORM = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSfzkOSf8KS4dCqzq9lZUVhm1T92s6HHrswcEQPJcqcRlFJVzQ/formResponse',
  game: 'UntoldLife',
  fields: {
    game: 'entry.1488109333', msg: 'entry.811493987', type: 'entry.1469569060', rating: 'entry.1777701863',
    lang: 'entry.92734138', device: 'entry.1906478866', progress: 'entry.1370472954', version: 'entry.1646639200',
  },
};
// The value saved in the sheet is the Arabic name; the button shows the player's language.
const FB_TYPES = [
  { id: 'idea', sheet: 'اقتراح', label: L('💡 اقتراح') },
  { id: 'bug', sheet: 'خطأ', label: L('🐞 خطأ') },
  { id: 'opinion', sheet: 'رأي', label: L('💬 رأي') },
];
let fbState = { type: 'opinion', rating: 0 }, fbLastSent = 0;

function fbDevice() {
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'other';
  return `${mobile} • ${browser} • ${screen.width}x${screen.height}`;
}
function fbProgress() {
  const hours = (S.stats.play || 0) / 3600;
  return `gen ${S.leg.gen} • ${hours.toFixed(1)}h • farm ${S.skills.farm.l} • ranch ${S.skills.ranch.l} • mine ${S.skills.mine.l} • gold ${fmt(S.gold)}`;
}
function fbVersion() {
  const s = document.querySelector('script[src*="game.js"]');
  const m = s && s.src.match(/[?&]v=([^&]+)/);
  return m ? 'v' + m[1] : 'local';
}

function fbForm() {
  const types = FB_TYPES.map(t => `<button type="button" class="btn sm ${fbState.type === t.id ? '' : 'ghost'}" data-a="fbType" data-v="${t.id}">${t.label}</button>`).join('');
  let stars = '';
  for (let i = 1; i <= 10; i++) stars += `<button type="button" class="fb-rate ${i <= fbState.rating ? 'on' : ''}" data-a="fbRate" data-v="${i}" aria-label="${i}">${i}</button>`;
  return `<h2>${L('💬 ملاحظاتك')}</h2>
  <p class="hint">${L('ملاحظتك تروح لفريق 369Games مباشرة. لا تكتب معلومات شخصية.')}</p>
  <label><b>${L('وش نوع ملاحظتك؟')}</b></label><div class="row fb-types">${types}</div>
  <label><b>${L('كم تقيّم اللعبة؟')}</b></label><div class="fb-rates">${stars}</div>
  <textarea id="fbText" class="fb-text" maxlength="2000" rows="5" placeholder="${L('اكتب ملاحظتك هنا...')}"></textarea>
  <p class="hint fb-err" id="fbErr"></p>
  <div class="row"><button class="btn gold" data-a="fbSend" id="fbSendBtn">${L('📨 أرسل')}</button><button class="btn ghost" data-a="closeBox">${L('إلغاء')}</button></div>`;
}
function fbOpen() {
  const keep = $('fbText') ? $('fbText').value : '';
  openModal(fbForm());
  const t = $('fbText'); if (t) { t.value = keep; t.focus(); }
}

async function fbSend() {
  const text = ($('fbText').value || '').trim(), err = $('fbErr');
  if (!text && !fbState.rating) { err.textContent = L('اكتب ملاحظة أو اختر تقييم أول.'); return; }
  if (Date.now() - fbLastSent < 30000) { err.textContent = L('انتظر شوي قبل ما ترسل مرة ثانية.'); return; }
  const F = FEEDBACK_FORM.fields, type = FB_TYPES.find(t => t.id === fbState.type) || FB_TYPES[2];
  const body = new URLSearchParams();
  body.set(F.game, FEEDBACK_FORM.game);
  body.set(F.msg, text);
  body.set(F.type, type.sheet);
  body.set(F.rating, fbState.rating ? fbState.rating + '/10' : '');
  body.set(F.lang, LANG);
  body.set(F.device, fbDevice());
  body.set(F.progress, fbProgress());
  body.set(F.version, fbVersion());
  const btn = $('fbSendBtn'); if (btn) btn.disabled = true;
  try {
    // Google Forms does not allow reading the reply from another site, so a sent request counts as success.
    await fetch(FEEDBACK_FORM.action, { method: 'POST', mode: 'no-cors', body });
    fbLastSent = Date.now();
    fbState = { type: 'opinion', rating: 0 };
    closeModal();
    toast(L('✅ وصلت ملاحظتك، شكراً!'));
  } catch (e) {
    err.textContent = L('❌ ما قدرنا نرسل. تأكد من الإنترنت وجرب مرة ثانية.');
    if (btn) btn.disabled = false;
  }
}

A.feedback = () => fbOpen();
A.fbType = v => { fbState.type = v; fbOpen(); };
A.fbRate = v => { fbState.rating = +v; fbOpen(); };
A.fbSend = () => { fbSend(); };
