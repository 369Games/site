'use strict';
/* Language layer. Every player-facing Arabic string in the game code is wrapped as L('…') or L`…`.
   Arabic is the source text; lang-<code>.js files (built by tools/i18n_build.py) map it to other languages.
   Switching language saves and reloads. */
const LANG_KEY = 'untoldlife_lang';
// [code, name in its own language, short label]
const LANGS = [
  ['ar', 'العربية', 'ع'],
  ['en', 'English', 'EN'],
  ['es', 'Español', 'ES'],
  ['pt', 'Português', 'PT'],
  ['ru', 'Русский', 'RU'],
  ['zh', '简体中文', '中文'],
];
const LANG_PACKS = window.LANG_PACKS || {};
const LANG = (() => {
  try { const v = localStorage.getItem(LANG_KEY); if (v && LANGS.some(l => l[0] === v) && (v === 'ar' || LANG_PACKS[v])) return v; } catch (e) {}
  return 'ar';
})();
const L_DICT = LANG === 'ar' ? null : LANG_PACKS[LANG];
const L_KEYS = new WeakMap();
const L_MISSING = new Set();

function L(s, ...v) {
  if (typeof s === 'string') {
    if (!L_DICT) return s;
    const t = L_DICT[s];
    if (t === undefined) { L_MISSING.add(s); return s; }
    return t;
  }
  if (!L_DICT) { let o = s[0]; for (let i = 0; i < v.length; i++) o += v[i] + s[i + 1]; return o; }
  let key = L_KEYS.get(s);
  if (key === undefined) { key = s[0]; for (let i = 1; i < s.length; i++) key += '{' + (i - 1) + '}' + s[i]; L_KEYS.set(s, key); }
  const t = L_DICT[key];
  if (t === undefined) { L_MISSING.add(key); let o = s[0]; for (let i = 0; i < v.length; i++) o += v[i] + s[i + 1]; return o; }
  return t.replace(/\{(\d+)\}/g, (m, i) => v[+i]);
}

// Text that was saved in another language (e.g. an active quest name) is shown in the current one.
let L_REVERSE = null;
function Lx(s) {
  if (typeof s !== 'string') return s;
  if (!L_REVERSE) {
    L_REVERSE = {};
    for (const code in LANG_PACKS) { const p = LANG_PACKS[code]; for (const k in p) if (!k.includes('{')) L_REVERSE[p[k]] = k; }
  }
  const ar = L_REVERSE[s] ?? s;
  return L_DICT ? (L_DICT[ar] ?? s) : ar;
}

function langInfo(code) { return LANGS.find(l => l[0] === code) || LANGS[0]; }

function setLang(lang) {
  if (!LANGS.some(l => l[0] === lang)) lang = 'ar';
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  if (typeof save === 'function') { try { save(); } catch (e) {} }
  location.reload();
}

document.documentElement.lang = LANG === 'zh' ? 'zh-Hans' : LANG === 'pt' ? 'pt-BR' : LANG;
document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dataset.lang = LANG;

// Static text in index.html
function translateStatic() {
  if (!L_DICT) return;
  const sub = document.querySelector('#top .sub');
  if (sub && sub.firstChild) sub.firstChild.textContent = L('حياة لم تُروَ بعد — ');
  const coin = document.querySelector('.hud .chip.gold img'); if (coin) coin.alt = L('ذهب');
  const tabs = document.getElementById('tabs'); if (tabs) tabs.setAttribute('aria-label', L('أماكن القرية'));
  const modal = document.getElementById('modal'); if (modal) modal.setAttribute('aria-label', L('رسالة من الوادي'));
  const stabText = { log: L('سجل الأحداث'), buffs: L('البفات الحالية') };
  document.querySelectorAll('.stabs .stab').forEach(b => {
    const t = [...b.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (t && stabText[b.dataset.v]) t.textContent = ' ' + stabText[b.dataset.v];
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', translateStatic); else translateStatic();
