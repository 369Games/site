'use strict';
/* Moving to a new web address. Browsers keep each site's save separately, so a player on the old address
   would lose their progress on the new one. This carries the save across in one click, in any browser:
   - old site (SITE_CONFIG.moveTo): a "we moved" banner. Its button opens the new site with the save packed into
     the link's #hash (compressed). The hash never reaches any server.
   - new site (SITE_CONFIG.moveFrom): on load, a #move= hash is unpacked, checked and loaded after the player confirms.
   Locally both settings are empty and nothing runs. */
const MOVE_KEYS = [SAVE_KEY, 'untoldlife_lang', 'untoldlife_audio', 'untoldlife_backup_at'];

function b64url(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64url(t) { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function movePack(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'undefined') return 'r' + b64url(raw);
  const gz = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  return 'z' + b64url(gz);
}
async function moveUnpack(t) {
  const kind = t[0], bytes = unb64url(t.slice(1));
  if (kind === 'r') return JSON.parse(new TextDecoder().decode(bytes));
  if (kind !== 'z' || typeof DecompressionStream === 'undefined') return null;
  return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
// Names come from outside the game here, so strip anything that could be read as HTML.
function moveClean(st) {
  const c = v => typeof v === 'string' ? v.replace(/[<>&"'`]/g, '').slice(0, 24) : v;
  st.name = c(st.name);
  if (st.leg) { st.leg.family = c(st.leg.family); (st.leg.history || []).forEach(h => { h.name = c(h.name); }); }
  return st;
}

(function () {
  const C = siteConfig();

  // ---- old site: banner + send ----
  if (C.moveTo) {
    const to = new URL(C.moveTo, location.href);
    const bar = document.createElement('div');
    bar.className = 'move-bar';
    bar.innerHTML = `<span>${L`🚚 انتقلنا لعنوان جديد: <b>${to.host}</b>`}</span><button class="btn gold sm" id="moveGo">${L('انقل حفظي والعب هناك')}</button>`;
    document.body.prepend(bar);
    document.getElementById('moveGo').onclick = async () => {
      if (typeof save === 'function') save();
      const data = {};
      for (const k of MOVE_KEYS) { try { const v = localStorage.getItem(k); if (v !== null) data[k] = v; } catch (x) { /* */ } }
      const target = new URL('untoldlife/', to).href;
      location.href = data[SAVE_KEY] ? target + '#move=' + await movePack(data) : target;
    };
  }

  // ---- new site: receive ----
  if (C.moveFrom && location.hash.startsWith('#move=')) moveReceive();
})();
function moveReceive() {
  {
    const packed = location.hash.slice(6);
    history.replaceState(null, '', location.pathname + location.search);
    moveUnpack(packed).then(d => {
      const st = d && typeof d[SAVE_KEY] === 'string' ? parseSave(d[SAVE_KEY]) : null;
      if (!st) return toast(L('❌ هذا ما هو ملف حفظ'));
      const mine = (() => { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch (x) { return null; } })();
      const gen = x => (x.leg && x.leg.gen) || 1, nm = x => String(x.name || '').replace(/[<>&"'`]/g, '');
      const ask = mine ? L`عندك حفظ هنا (${nm(mine)}، الجيل ${gen(mine)}). تبي تستبدله بحفظك من الموقع القديم (${nm(st)}، الجيل ${gen(st)})؟`
        : L`تبي تكمل حفظك من الموقع القديم (${nm(st)}، الجيل ${gen(st)})؟`;
      if (!confirm(ask)) return;
      saveBlocked = true;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(moveClean(st)));
        for (const k of MOVE_KEYS) if (k !== SAVE_KEY && typeof d[k] === 'string' && !localStorage.getItem(k)) localStorage.setItem(k, d[k]);
      } catch (x) { saveBlocked = false; return; }
      location.reload();
    }).catch(() => toast(L('❌ هذا ما هو ملف حفظ')));
  }
}
