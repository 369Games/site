'use strict';
/* Patch notes: the "📜 v…" chip in the top bar opens the list of updates, newest first.
   A glowing dot shows until the player opens the latest one. Add each new update at the TOP of PATCH_NOTES,
   wrap every text in L(), and translate it like any other game text (see MODEL_HANDOFF.md, "اللغات"). */
const PATCH_NOTES = [
  { v: '1.2.1', date: '2026-11-02', big: false, title: L('المنجم والسحابة'), items: [
    L('⛏️ أزرار جديدة في المنجم تنقلك مباشرة لطابق كل معدن، مع «الأعلى» و«الأعمق».'),
    L('☁️ شارة في الشريط العلوي توضح إذا حفظك محفوظ في السحابة أو لا.'),
    L('☁️ الحفظ السحابي صار يترفع كل 30 ثانية، ويكمل تلقائياً من الحفظ الأبعد تقدماً.'),
    L('📧 رسالة الدخول بالبريد صارت توصلك بلغتك.'),
  ] },
  { v: '1.2', date: '2026-11-02', big: true, title: L('الحسابات والحفظ السحابي'), items: [
    L('☁️ حساب اختياري: ادخل بـ Google أو برابط على بريدك، وتقدمك ينحفظ في السحابة وتكمل من أي جهاز.'),
    L('💾 تقدر تنزّل حفظك كملف وترفعه في أي وقت.'),
    L('🔒 الحفظ صار محمي، والحفظ اللي ينعدّل من برّا اللعبة ينختم «معدّل».'),
    L('🌐 عنواننا الجديد 369games.net، واللي يلعب على الرابط القديم ينقل حفظه بضغطة.'),
  ] },
  { v: '1.1', date: '2026-11-02', big: true, title: L('الإرث والموسيقى'), items: [
    L('🌳 شجرة الإرث صارت شجرة حقيقية، ولكل فرع مهارة خاصة تنفتح بعد 10 مستويات.'),
    L('↺ تقدر تعيد توزيع نقاط الإرث مجاناً مرة كل جيل.'),
    L('🌱 مهارات بداية الجيل اللي تشتريها في أول يومين من الجيل تطبق عليك فوراً.'),
    L('🎵 موسيقى لكل موسم وللزنزانة، وأصوات لكل حركة.'),
    L('✨ المحصول الذهبي صار يلمع في الحقل وفي سجل الأحداث.'),
  ] },
  { v: '1.0', date: '2026-11-01', big: true, title: L('الإطلاق التجريبي'), items: [
    L('🎉 أول نسخة تجريبية من UntoldLife على موقعنا.'),
    L('🌍 ست لغات: العربية والإنجليزية والإسبانية والبرتغالية والروسية والصينية.'),
    L('📖 دليل للاعب الجديد خطوة بخطوة.'),
    L('💬 نموذج ملاحظات داخل اللعبة.'),
  ] },
];
const GAME_VERSION = PATCH_NOTES[0].v;
const NOTES_KEY = 'untoldlife_notes_seen';

function notesSeen() { try { return localStorage.getItem(NOTES_KEY) || ''; } catch (e) { return GAME_VERSION; } }
function notesDate(d) {
  const loc = { ar: 'ar', zh: 'zh-CN', pt: 'pt-BR' }[LANG] || LANG;
  try { return new Date(d + 'T12:00:00').toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory', numberingSystem: 'latn' }); }
  catch (e) { return d; }
}
function notesChip() {
  const c = document.getElementById('notesBtn'); if (!c) return;
  const fresh = notesSeen() !== GAME_VERSION;
  const txt = '📜 v' + GAME_VERSION;
  if (c.textContent !== txt) c.textContent = txt;
  c.classList.toggle('new', fresh);
  c.title = L('ملاحظات التحديث');
}
A.notes = () => {
  try { localStorage.setItem(NOTES_KEY, GAME_VERSION); } catch (e) { /* */ }
  notesChip();
  openModal(`<h2>${L('📜 ملاحظات التحديث')}</h2><div class="notes">${PATCH_NOTES.map(n => `
    <article class="note ${n.big ? 'big' : ''}"><div class="note-icon">${n.big ? '🚀' : '🛠️'}</div><div class="note-body">
      <small class="note-kind">${n.big ? L('تحديث كبير') : L('تحديث صغير')} • v${n.v}</small>
      <h3>${n.title}</h3><small class="note-date">${notesDate(n.date)}</small>
      <ul>${n.items.map(i => `<li>${i}</li>`).join('')}</ul></div></article>`).join('')}</div>
    <div class="row"><button class="btn gold" data-a="closeModal">${L('تمام')}</button></div>`);
};
notesChip();
