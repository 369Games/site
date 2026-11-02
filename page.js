'use strict';
// Text pages: Arabic for Arabic players, English for everyone else. The language choice is shared with the games.
(function () {
  const KEY = 'untoldlife_lang';
  const WORDS = { ar: { other: 'English', privacy: 'سياسة الخصوصية', about: 'عن الاستديو' }, en: { other: 'العربية', privacy: 'Privacy policy', about: 'About us' } };
  let lang = 'ar';
  try { const v = localStorage.getItem(KEY); if (v) lang = v === 'ar' ? 'ar' : 'en'; } catch (e) { /* storage off */ }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('ar').hidden = lang !== 'ar';
    document.getElementById('en').hidden = lang === 'ar';
    document.getElementById('langBtn').textContent = '🌐 ' + WORDS[lang].other;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = WORDS[lang][el.dataset.t]; });
  }
  document.getElementById('langBtn').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage off */ }
    apply();
  });
  apply();
})();
