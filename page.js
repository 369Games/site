'use strict';
// Text pages: Arabic for Arabic players, English for everyone else (by the browser's language until the player chooses). The language choice is shared with the games.
(function () {
  const KEY = 'untoldlife_lang';
  const WORDS = { ar: { other: 'English', privacy: 'سياسة الخصوصية', about: 'من نحن', contact: 'تواصل معنا', guide: 'دليل اللعبة', games: 'ألعابنا' }, en: { other: 'العربية', privacy: 'Privacy policy', about: 'About', contact: 'Contact', guide: 'Game guide', games: 'Games' } };
  // The player's own choice if there is one, else the browser's language: Arabic if it is anywhere in its list, English otherwise.
  let lang = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).some(l => /^ar/i.test(l)) ? 'ar' : 'en';
  try { const v = localStorage.getItem(KEY); if (v) lang = v === 'ar' ? 'ar' : 'en'; } catch (e) { /* storage off */ }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('ar').hidden = lang !== 'ar';
    document.getElementById('en').hidden = lang === 'ar';
    document.getElementById('langBtn').textContent = '🌐 ' + WORDS[lang].other;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = WORDS[lang][el.dataset.t]; });
    document.querySelectorAll('[data-g]').forEach(el => { el.href = lang === 'ar' ? 'guide/ar/index.html' : 'guide/index.html'; });
  }
  document.getElementById('langBtn').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage off */ }
    apply();
  });
  apply();
})();
