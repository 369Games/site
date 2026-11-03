'use strict';
/* Moving from the old web address. Browsers keep each site's save separately, so a player on the old address
   would lose their progress on the new one. The old address (tools/site/old-redirect.html) packs its save into
   the link's #hash (compressed; the hash never reaches any server) and sends the player here.
   On load, a #move= hash is unpacked and checked, then loaded with no question when there is no save here
   or when it is further along (generation, then play time). The save it replaces is kept in untoldlife_save_prev.
   Runs only when SITE_CONFIG.moveFrom is set (the live site). */
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

  // ---- new site: receive ----
  if (C.moveFrom && location.hash.startsWith('#move=')) moveReceive();
})();
function moveReceive() {
  {
    const packed = location.hash.slice(6);
    history.replaceState(null, '', location.pathname + location.search);
    moveUnpack(packed).then(d => {
      const info = d && typeof d[SAVE_KEY] === 'string' ? readSave(d[SAVE_KEY]) : null;
      const st = info && info.st;
      if (st && st.leg && !st.leg.mod && (info.mod === 'sig' || info.mod === 'legacy')) st.leg.mod = { r: info.mod, t: Date.now() };
      if (!st) return toast(L('❌ هذا ما هو ملف حفظ'));
      const mine = (() => { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch (x) { return null; } })();
      const gen = x => (x.leg && x.leg.gen) || 1, play = x => (x.stats && x.stats.play) || 0;
      if (mine && ((gen(st) - gen(mine)) || (play(st) - play(mine))) <= 0) return; // the save here is already as far along
      if (mine) { try { localStorage.setItem('untoldlife_save_prev', localStorage.getItem(SAVE_KEY)); } catch (x) { /* */ } }
      saveBlocked = true;
      try {
        localStorage.setItem(SAVE_KEY, encodeSave(moveClean(st)));
        for (const k of MOVE_KEYS) if (k !== SAVE_KEY && typeof d[k] === 'string' && !localStorage.getItem(k)) localStorage.setItem(k, d[k]);
      } catch (x) { saveBlocked = false; return; }
      location.reload();
    }).catch(() => toast(L('❌ هذا ما هو ملف حفظ')));
  }
}
