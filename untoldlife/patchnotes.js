'use strict';
/* Patch notes: the "📜 v…" chip in the top bar opens the list of updates, newest first.
   A glowing dot shows until the player opens the latest one. Add each new update at the TOP of PATCH_NOTES,
   wrap every text in L(), and translate it like any other game text (see MODEL_HANDOFF.md, "اللغات"). */
const PATCH_NOTES = [
  { v: '1.4', date: '2026-11-03', big: true, title: L('التهجين صار قمار 🎰'), items: [
    L('🎰 حط حيوانين من نفس الدرجة وجرّب حظك: النتيجة تطلع فوراً! لو نجحت يصيرون الاثنين ممتازين أو ذهبيين، ولو فشلت تخسرهم.'),
    L('🎲 فرصة الممتاز 20% والذهبي 5%، وبعد كل محاولة البيت يرتاح 5 دقايق.'),
    L('🏠 تقدر تبني لين 5 بيوت تهجين عشان تجرب أكثر.'),
    L('🧬 التهجين صار يفتح من رعي 5 للممتاز ورعي 10 للذهبي.'),
  ] },
  { v: '1.3.1', date: '2026-11-03', big: false, title: L('توازن الأجيال'), items: [
    L('🌳 شرط التقاعد صار يكبر مع كل جيل بعد الثالث، عشان كل جيل يحس إنه رحلة جديدة مو دقايق.'),
    L('⭐ كل ما كبر الشرط كسبت ذهب أكثر، فنجوم الإرث تزيد معه.'),
    L('🗺️ «ذاكرة المعارك» ما عادت تحقق شرط الزنزانة لحالها: لازم تنزل 15 طابق على الأقل من مكان بدايتك، ونجوم الزنزانة تنحسب من الطوابق اللي نزلتها بنفسك.'),
  ] },
  { v: '1.3', date: '2026-11-02', big: true, title: L('ثبّت اللعبة على جوالك'), items: [
    L('📱 تقدر تضيف اللعبة لشاشتك الرئيسية وتفتحها مثل التطبيق، بأيقونتها وبدون شريط المتصفح.'),
    L('✈️ اللعبة تفتح حتى بدون إنترنت بعد أول زيارة.'),
    L('💡 أول مرة تفتح المنجم أو الحظيرة أو الزنزانة أو غيرها، يطلع لك شرح قصير عنها.'),
  ] },
  { v: '1.2.4', date: '2026-11-02', big: false, title: L('حد للضغطات'), items: [
    L('🤖 زر الحفر والصيد صار له حد مثل سرعة يد الإنسان، فالضغط الآلي ما يعطي أكثر من اللاعب العادي.'),
    L('😮‍💨 لو الضغطات منتظمة مرة كأنها آلة، شخصيتك تتعب وتبطّأ شوي.'),
  ] },
  { v: '1.2.3', date: '2026-11-02', big: false, title: L('اللعبة صارت أخف وأسرع'), items: [
    L('⚡ حجم تحميل اللعبة صار أقل من النص: الصور صارت أخف بنفس الجودة.'),
    L('⚡ اللعبة تحمّل لغتك بس بدل كل اللغات، والحفظ السحابي ما يتحمّل إلا لو حسابك مربوط.'),
  ] },
  { v: '1.2.2', date: '2026-11-02', big: false, title: L('قسم الحفظ أبسط'), items: [
    L('💾 قسم الحفظ صار أبسط: لو حسابك مربوط بالسحابة ما تحتاج تسوي شي، والنسخة اليدوية صارت تحت «نسخة احتياطية يدوية».'),
    L('📜 ملاحظات التحديث صارت في الشريط العلوي جنب شارة السحابة.'),
  ] },
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
