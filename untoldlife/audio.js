'use strict';
/* Sound for UntoldLife (and future 369Games games): synthesized sound effects plus a small
   composer that plays one fixed theme per season, a softer night mix and a dungeon theme.
   Everything is made with the Web Audio API, so it works offline and from file://.
   Real recordings can replace any theme: list them in assets/music/tracks.js (MUSIC_FILES). */
const AUDIO_KEY = 'untoldlife_audio';
const AU = {
  ctx: null, master: null, music: null, sfx: null, night: null, reverb: null,
  set: { music: 0.55, sfx: 0.7, muted: false },
  song: null, songId: '', loopStart: 0, events: [], idx: 0, cycle: 0, timer: 0,
  file: null, fileId: '', last: {},
};
try { Object.assign(AU.set, JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}')); } catch (e) {}
function auSave() { try { localStorage.setItem(AUDIO_KEY, JSON.stringify(AU.set)); } catch (e) {} }

/* ---------- engine ---------- */
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const ctx = AU.ctx = new C();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  AU.master = ctx.createGain(); AU.master.connect(comp); comp.connect(ctx.destination);
  AU.night = ctx.createBiquadFilter(); AU.night.type = 'lowpass'; AU.night.frequency.value = 18000; AU.night.connect(AU.master);
  AU.music = ctx.createGain(); AU.music.connect(AU.night);
  AU.sfx = ctx.createGain(); AU.sfx.connect(AU.master);
  // Warm room reverb from a generated impulse.
  AU.reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.6, imp = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  AU.reverb.buffer = imp;
  const wet = ctx.createGain(); wet.gain.value = 0.32; AU.reverb.connect(wet); wet.connect(AU.night);
  const send = ctx.createGain(); send.gain.value = 0.4; AU.music.connect(send); send.connect(AU.reverb);
  auApplyVolumes();
  AU.timer = setInterval(auTick, 200);
  auTick();
}
function auApplyVolumes() {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime, m = AU.set.muted ? 0 : 1;
  AU.master.gain.setTargetAtTime(m, t, 0.05);
  AU.music.gain.setTargetAtTime(AU.set.music * 0.5, t, 0.1);
  AU.sfx.gain.setTargetAtTime(AU.set.sfx * 0.6, t, 0.05);
  if (AU.file) AU.file.volume = AU.set.muted ? 0 : AU.set.music * 0.6;
}
// Browsers only allow sound after the player interacts with the page.
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, auInit, { capture: true, passive: true }));

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function env(g, t, a, peak, dec, sus, rel, end) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(peak * sus, 0.0002), t + a + dec);
  g.gain.setValueAtTime(Math.max(peak * sus, 0.0002), end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
}
function osc(type, freq, t, stop, dest, detune = 0) {
  const o = AU.ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
  o.connect(dest); o.start(t); o.stop(stop); return o;
}
function noiseBuf() {
  if (AU.noise) return AU.noise;
  const b = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (AU.noise = b);
}

/* ---------- instruments ---------- */
const INST = {
  musicbox(m, t, d, v, out) {
    const g = AU.ctx.createGain(); g.connect(out);
    env(g, t, 0.004, v, 1.2, 0.0005, 0.1, t + 1.25);
    osc('sine', mtof(m), t, t + 1.5, g); const g2 = AU.ctx.createGain(); g2.gain.value = 0.28; g2.connect(g); osc('sine', mtof(m) * 2, t, t + 1.5, g2);
    const g3 = AU.ctx.createGain(); g3.gain.value = 0.06; g3.connect(g); osc('sine', mtof(m) * 4.01, t, t + 0.6, g3);
  },
  flute(m, t, d, v, out) {
    const g = AU.ctx.createGain(); g.connect(out);
    env(g, t, 0.06, v * 0.8, 0.15, 0.75, 0.25, t + d);
    const o = osc('triangle', mtof(m), t, t + d + 0.4, g);
    const lfo = AU.ctx.createOscillator(), lg = AU.ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 0;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(6, t + Math.min(0.35, d)); lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + d + 0.4);
    const g2 = AU.ctx.createGain(); g2.gain.value = 0.25; g2.connect(g); osc('sine', mtof(m) / 2, t, t + d + 0.4, g2);
  },
  pluck(m, t, d, v, out) {
    const f = AU.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.3); f.connect(out);
    const g = AU.ctx.createGain(); g.connect(f); env(g, t, 0.004, v, 0.28, 0.001, 0.05, t + 0.3);
    osc('square', mtof(m), t, t + 0.4, g);
  },
  bell(m, t, d, v, out) {
    v *= 0.5; // bells ring long and stack up, so they play softer
    const g = AU.ctx.createGain(); g.connect(out); env(g, t, 0.003, v, 2.4, 0.0005, 0.1, t + 2.4);
    osc('sine', mtof(m), t, t + 2.6, g); const g2 = AU.ctx.createGain(); g2.gain.value = 0.2; g2.connect(g); osc('sine', mtof(m) * 2.76, t, t + 1.2, g2);
  },
  bass(m, t, d, v, out) {
    const g = AU.ctx.createGain(); g.connect(out); env(g, t, 0.01, v, 0.25, 0.55, 0.2, t + d);
    osc('triangle', mtof(m), t, t + d + 0.3, g);
  },
  pad(m, t, d, v, out) {
    const f = AU.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 950; f.connect(out);
    const g = AU.ctx.createGain(); g.connect(f); env(g, t, Math.min(1.1, d * 0.4), v, 0.3, 0.8, 1.2, t + d);
    osc('sawtooth', mtof(m), t, t + d + 1.4, g, -7); osc('sawtooth', mtof(m), t, t + d + 1.4, g, 7);
  },
  hat(m, t, d, v, out) {
    const s = AU.ctx.createBufferSource(); s.buffer = noiseBuf();
    const f = AU.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = AU.ctx.createGain(); s.connect(f); f.connect(g); g.connect(out); env(g, t, 0.002, v, 0.05, 0.001, 0.02, t + 0.06);
    s.start(t); s.stop(t + 0.1);
  },
  kick(m, t, d, v, out) {
    const g = AU.ctx.createGain(); g.connect(out); env(g, t, 0.003, v, 0.22, 0.001, 0.05, t + 0.24);
    const o = osc('sine', 120, t, t + 0.3, g); o.frequency.exponentialRampToValueAtTime(45, t + 0.2);
  },
};

/* ---------- composer ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
// Each theme is fixed (same seed every time), so players learn and remember it.
const SONGS = {
  spring: { bpm: 84, beats: 4, key: 60, scale: 'major', seed: 11, lead: ['flute', 'musicbox'], arp: 'musicbox', drums: 'hat',
    A: [1, 5, 6, 4, 1, 5, 4, 5], B: [6, 4, 1, 5, 6, 4, 2, 5] },
  summer: { bpm: 96, beats: 4, key: 62, scale: 'major', seed: 23, lead: ['flute', 'pluck'], arp: 'pluck', drums: 'kick',
    A: [1, 4, 5, 4, 1, 4, 5, 1], B: [4, 5, 3, 6, 4, 5, 1, 1] },
  autumn: { bpm: 76, beats: 3, key: 57, scale: 'major', seed: 37, lead: ['musicbox', 'flute'], arp: 'musicbox', drums: '',
    A: [6, 4, 1, 5, 6, 4, 5, 5], B: [4, 5, 3, 6, 2, 5, 1, 1] },
  winter: { bpm: 66, beats: 3, key: 64, scale: 'minor', seed: 41, lead: ['bell', 'musicbox'], arp: 'bell', drums: '',
    A: [1, 6, 3, 7, 1, 6, 4, 5], B: [6, 7, 1, 1, 4, 5, 1, 1] },
  dungeon: { bpm: 104, beats: 4, key: 50, scale: 'minor', seed: 53, lead: ['pluck', 'flute'], arp: 'pluck', drums: 'kick',
    A: [1, 6, 3, 7, 1, 6, 4, 5], B: [4, 5, 1, 1, 6, 7, 1, 5] },
};
function chordOf(S, deg) {
  const sc = SCALE[S.scale], i = deg - 1;
  return [0, 2, 4].map(k => S.key + sc[(i + k) % 7] + 12 * Math.floor((i + k) / 7));
}
function scaleNotes(S, lo, hi) {
  const out = [], sc = SCALE[S.scale];
  for (let o = -2; o < 4; o++) for (const s of sc) { const n = S.key + s + 12 * o; if (n >= lo && n <= hi) out.push(n); }
  return out;
}
const RHY = { 4: [[2, 2, 2, 2], [3, 1, 2, 2], [2, 1, 1, 4], [4, 2, 2], [1, 1, 2, 2, 2], [2, 2, 4], [3, 1, 4]], 3: [[2, 2, 2], [3, 1, 2], [4, 2], [2, 1, 1, 2], [1, 1, 2, 2]] };
const END = { 4: [[2, 6], [4, 4]], 3: [[2, 4], [6]] };
function melody(S, prog, r, motif) {
  const notes = scaleNotes(S, S.key + 7, S.key + 26), ev = [];
  let prev = S.key + 16, made = [];
  prog.forEach((deg, bar) => {
    const chord = chordOf(S, deg).flatMap(n => [n, n + 12, n + 24]);
    const last = bar === 3 || bar === 7;
    let rh = last ? END[S.beats][Math.floor(r() * 2)] : motif && motif[bar % 4] && bar >= 4 && bar < 6 ? motif[bar % 4].rh : RHY[S.beats][Math.floor(r() * RHY[S.beats].length)];
    if (bar < 2) made[bar] = { rh };
    let pos = 0;
    rh.forEach((len, i) => {
      const strong = pos % 2 === 0 || i === 0;
      // Each 4-bar phrase rises then falls (an arch), which makes a melody singable.
      const p = ((bar % 4) + pos / (S.beats * 2)) / 4;
      const goal = S.key + 14 + Math.round(9 * Math.sin(Math.PI * p));
      const dir = goal > prev ? 1 : goal < prev ? -1 : (r() < 0.5 ? 1 : -1);
      let n;
      if (last && i === rh.length - 1) {
        // Phrase endings settle on a chord tone near the goal.
        n = chord.filter(x => x >= S.key + 7 && x <= S.key + 26).reduce((a, b) => Math.abs(b - goal) < Math.abs(a - goal) ? b : a);
      } else if (strong) {
        const want = prev + dir * (2 + Math.floor(r() * 3));
        const cands = chord.filter(x => x >= S.key + 7 && x <= S.key + 26 && (x !== prev || r() < 0.12));
        n = cands.reduce((a, b) => Math.abs(b - want) < Math.abs(a - want) ? b : a);
      } else {
        const j = Math.max(0, notes.indexOf(prev) >= 0 ? notes.indexOf(prev) : notes.findIndex(x => x >= prev));
        const d = (r() < 0.75 ? dir : -dir) * (r() < 0.7 ? 1 : 2);
        n = notes[Math.max(0, Math.min(notes.length - 1, j + d))];
      }
      if (r() < 0.08 && !last && i > 0) { pos += len; return; } // a breath
      ev.push({ b: bar * S.beats + pos / 2, d: len / 2, m: n });
      prev = n; pos += len;
    });
  });
  return { ev, motif: made };
}
function compose(id) {
  const S = SONGS[id], r = rng(S.seed), ev = [], beats = S.beats;
  const a1 = melody(S, S.A, r), a2 = melody(S, S.A, r, a1.motif), b = melody(S, S.B, r);
  // Form: A A' B A, then a quiet breather with only harmony.
  const parts = [[S.A, a1.ev, 0], [S.A, a2.ev, 0], [S.B, b.ev, 1], [S.A, a1.ev, 0], [S.A.slice(0, 4), null, 0]];
  let off = 0;
  parts.forEach(([prog, mel, sec]) => {
    prog.forEach((deg, bar) => {
      const t0 = off + bar * beats, ch = chordOf(S, deg);
      ev.push({ i: 'pad', b: t0, d: beats, m: ch[0], v: 0.05 }, { i: 'pad', b: t0, d: beats, m: ch[1], v: 0.04 }, { i: 'pad', b: t0, d: beats, m: ch[2], v: 0.04 });
      ev.push({ i: 'bass', b: t0, d: beats === 3 ? 2.5 : 1.8, m: ch[0] - 12, v: 0.22 });
      if (beats === 4) ev.push({ i: 'bass', b: t0 + 2, d: 1.8, m: ch[2] - 12, v: 0.16 });
      const arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1]];
      for (let k = 0; k < beats * 2; k++) ev.push({ i: S.arp, b: t0 + k / 2, d: 0.5, m: arp[k % arp.length] + (S.arp === 'bell' ? 12 : 0), v: mel ? 0.045 : 0.07, arp: 1 });
      if (S.drums && mel) for (let k = 0; k < beats; k++) {
        ev.push({ i: 'hat', b: t0 + k + 0.5, d: 0.1, v: 0.03 });
        if (S.drums === 'kick' && k % 2 === 0) ev.push({ i: 'kick', b: t0 + k, d: 0.2, v: 0.12 });
      }
    });
    if (mel) mel.forEach(n => ev.push({ i: sec ? S.lead[1] : S.lead[0], b: off + n.b, d: n.d, m: n.m, v: 0.13 }));
    off += prog.length * beats;
  });
  ev.sort((x, y) => x.b - y.b);
  return { id, bpm: S.bpm, len: off, ev };
}

/* ---------- playback ---------- */
function auWantedSong() {
  if (typeof S === 'undefined' || !S || !S.started) return (window.MUSIC_FILES || {}).theme ? 'theme' : 'spring';
  if (S.dun && S.dun.active && typeof tab !== 'undefined' && tab === 'guild') return 'dungeon';
  return ['spring', 'summer', 'autumn', 'winter'][S.season] || 'spring';
}
function auIsNight() { const top = document.getElementById('top'); return !!top && top.dataset.phase === 'night'; }
function auFileFor(id) { const F = window.MUSIC_FILES || {}; return F[id] ? 'assets/music/' + F[id] : ''; }

function auTick() {
  const ctx = AU.ctx; if (!ctx) return;
  const want = auWantedSong();
  // Night: a softer, darker mix.
  AU.night.frequency.setTargetAtTime(auIsNight() ? 1400 : 18000, ctx.currentTime, 1.5);
  if (want !== AU.songId) auSwitch(want);
  if (AU.file || !AU.song) return;
  const spb = 60 / AU.song.bpm, ahead = ctx.currentTime + 1.6;
  for (;;) {
    if (AU.idx >= AU.song.ev.length) { AU.idx = 0; AU.cycle++; AU.loopStart += AU.song.len * spb; }
    const e = AU.song.ev[AU.idx], t = AU.loopStart + e.b * spb;
    if (t > ahead) break;
    AU.idx++;
    if (t < ctx.currentTime - 0.05) continue;
    // Small changes each time round so the loop never feels identical.
    let inst = e.i, m = e.m;
    if (AU.cycle % 2 === 1 && SONGS[AU.song.id].lead.includes(inst) && !e.arp) inst = SONGS[AU.song.id].lead[(SONGS[AU.song.id].lead.indexOf(inst) + 1) % 2];
    if (AU.cycle % 3 === 2 && e.arp) continue;
    INST[inst](m, t, e.d * spb, e.v, AU.music);
  }
}
function auSwitch(id) {
  const ctx = AU.ctx, t = ctx.currentTime;
  AU.songId = id;
  if (AU.file) { const old = AU.file; AU.file = null; let v = old.volume; const f = setInterval(() => { if (AU.file === old) return clearInterval(f); v = Math.max(0, v - 0.05); old.volume = v; if (!v) { old.pause(); clearInterval(f); } }, 80); }
  const src = auFileFor(id);
  if (src) {
    // A recorded track replaces the generated theme. Each track is kept, so it resumes where it stopped.
    AU.files = AU.files || {};
    const a = AU.files[id] || (AU.files[id] = new Audio(src));
    a.loop = true; a.volume = 0; AU.file = a; AU.song = null;
    a.play().catch(() => {});
    let v = 0; const target = () => AU.set.muted ? 0 : AU.set.music * 0.6;
    const f = setInterval(() => { if (AU.file !== a) return clearInterval(f); v = Math.min(target(), v + 0.03); a.volume = v; if (v >= target()) clearInterval(f); }, 80);
    a.onerror = () => { if (AU.file === a) { AU.file = null; auStartSong(id, t); } };
    return;
  }
  auStartSong(id, t);
}
function auStartSong(id, t) {
  AU.music.gain.cancelScheduledValues(t);
  AU.music.gain.setValueAtTime(0.0001, t);
  AU.music.gain.linearRampToValueAtTime(AU.set.music * 0.5, t + 2.5);
  if (!SONGS[id]) id = 'spring'; // e.g. the title theme exists only as a recording
  AU.song = AU.cache && AU.cache[id] || ((AU.cache = AU.cache || {})[id] = compose(id));
  AU.loopStart = t + 0.3; AU.idx = 0; AU.cycle = 0;
}

/* ---------- sound effects ---------- */
const SFX = {
  click: () => blip('triangle', 880, 0.03, 0.05),
  tab: () => blip('sine', 660, 0.04, 0.06),
  plant: () => { thud(180, 0.12); later(0.05, () => blip('sine', 520, 0.08, 0.08)); },
  water: () => { swish(0.25, 1800, 0.09); later(0.06, () => blip('sine', 1200, 0.05, 0.05)); },
  harvest: () => [0, 4, 7].forEach((s, i) => later(i * 0.06, () => blip('triangle', mtof(76 + s), 0.12, 0.09))),
  coin: () => { blip('square', 1320, 0.06, 0.05); later(0.07, () => blip('square', 1760, 0.12, 0.05)); },
  buy: () => [0, 7].forEach((s, i) => later(i * 0.08, () => blip('triangle', mtof(72 + s), 0.15, 0.08))),
  dig: () => { thud(110, 0.18); swish(0.08, 3000, 0.05); },
  break: () => { thud(70, 0.25); swish(0.18, 1200, 0.1); },
  cast: () => swish(0.35, 900, 0.07),
  catch: () => { swish(0.2, 2000, 0.07); later(0.1, () => [0, 5, 9].forEach((s, i) => later(i * 0.05, () => blip('sine', mtof(79 + s), 0.1, 0.08)))); },
  anvil: () => { [1, 2.76, 5.4].forEach(r => blip('sine', 520 * r, 0.6, 0.06 / r)); },
  gift: () => [0, 4, 7, 12].forEach((s, i) => later(i * 0.07, () => blip('sine', mtof(79 + s), 0.25, 0.07))),
  pet: () => [0, 3].forEach((s, i) => later(i * 0.09, () => blip('sine', mtof(84 + s), 0.12, 0.05))),
  good: () => [0, 4, 7, 12].forEach((s, i) => later(i * 0.08, () => blip('triangle', mtof(72 + s), 0.3, 0.08))),
  fanfare: () => [[0, 0], [4, .12], [7, .24], [12, .36], [7, .5], [12, .62]].forEach(([s, d]) => later(d, () => blip('triangle', mtof(67 + s), 0.32, 0.09))),
  levelup: () => [0, 4, 7, 11, 12].forEach((s, i) => later(i * 0.06, () => blip('square', mtof(72 + s), 0.18, 0.045))),
  bad: () => { blip('triangle', 220, 0.3, 0.08); later(0.12, () => blip('triangle', 196, 0.4, 0.08)); },
  error: () => blip('square', 160, 0.12, 0.04),
};
function later(s, fn) { setTimeout(fn, s * 1000); }
function blip(type, freq, dur, vol) {
  const ctx = AU.ctx, t = ctx.currentTime, g = ctx.createGain(); g.connect(AU.sfx);
  env(g, t, 0.005, vol, dur * 0.6, 0.3, dur * 0.5, t + dur * 0.6);
  osc(type, freq, t, t + dur * 1.3, g);
}
function thud(freq, dur) {
  const ctx = AU.ctx, t = ctx.currentTime, g = ctx.createGain(); g.connect(AU.sfx);
  env(g, t, 0.003, 0.25, dur, 0.001, 0.05, t + dur);
  const o = osc('sine', freq * 1.8, t, t + dur + 0.1, g); o.frequency.exponentialRampToValueAtTime(freq, t + dur * 0.8);
}
function swish(dur, freq, vol) {
  const ctx = AU.ctx, t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf();
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq * 0.4, t + dur); f.Q.value = 1.2;
  const g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(AU.sfx); env(g, t, 0.02, vol, dur * 0.5, 0.4, dur * 0.4, t + dur * 0.6);
  s.start(t); s.stop(t + dur + 0.1);
}
function sfx(name) {
  if (!AU.ctx || AU.set.muted || !SFX[name]) return;
  const now = performance.now(); if (now - (AU.last[name] || 0) < 90) return;
  AU.last[name] = now;
  try { SFX[name](); } catch (e) {}
}

/* ---------- hooks: player clicks and big events ---------- */
let auBefore = null;
const auSnap = () => ({
  gold: S.gold, harvests: S.stats.harvests, blocks: S.stats.blocks, fish: S.stats.fish,
  planted: S.farm.plots.filter(p => p.c).length, wet: S.farm.plots.filter(p => p.w).length,
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  auBefore = b && !b.disabled && typeof S !== 'undefined' && S ? auSnap() : null;
}, true);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || !auBefore) return;
  const a = b.dataset.a, B = auBefore, N = auSnap(); auBefore = null;
  if (N.harvests > B.harvests) return sfx('harvest');
  if (N.planted > B.planted) return sfx('plant');
  if (N.wet > B.wet) return sfx('water');
  if (a === 'dig') return sfx(N.blocks > B.blocks ? 'break' : 'dig');
  if (a === 'cast') return sfx(N.fish > B.fish ? 'catch' : 'cast');
  if (['sell1', 'sellAll', 'shipAll'].includes(a)) return sfx(N.gold > B.gold ? 'coin' : 'error');
  if (a === 'upgrade' && N.gold < B.gold) return sfx('anvil');
  if (a === 'gift') return sfx('gift');
  if (a === 'pet') return sfx('pet');
  if (N.gold < B.gold) return sfx('buy');
  if (a === 'tab') return sfx('tab');
  if (a === 'muteToggle') return;
  sfx('click');
});
// Big moments come through the event log.
if (typeof log === 'function') {
  const baseLog = log;
  log = function (msg, type) {
    baseLog.apply(this, arguments);
    if (typeof offline !== 'undefined' && offline) return;
    if (type === 'season') sfx('fanfare');
    else if (type === 'golden') sfx('gift');
    else if (type === 'good') sfx(/⭐|⚔️/.test(msg) ? 'levelup' : 'good');
    else if (type === 'bad') sfx('bad');
    else if (/^⭐/.test(msg)) sfx('levelup');
  };
}

/* ---------- controls ---------- */
function audioPanel() {
  const pct = v => Math.round(v * 100);
  return `<h3>${L('🔊 الصوت')}</h3>
  <div class="kv au-row"><label for="auMusic">${L('🎵 الموسيقى')}</label><input type="range" id="auMusic" min="0" max="100" value="${pct(AU.set.music)}"></div>
  <div class="kv au-row"><label for="auSfx">${L('🔔 المؤثرات')}</label><input type="range" id="auSfx" min="0" max="100" value="${pct(AU.set.sfx)}"></div>
  <div class="row"><button class="btn ghost" data-a="muteToggle">${AU.set.muted ? L('🔊 شغّل الصوت') : L('🔇 كتم الصوت')}</button></div>`;
}
function auUpdateButton() {
  const b = document.getElementById('muteBtn'); if (!b) return;
  b.textContent = AU.set.muted ? '🔇' : '🔊';
  b.title = AU.set.muted ? L('🔊 شغّل الصوت') : L('🔇 كتم الصوت');
}
document.addEventListener('input', e => {
  if (e.target.id === 'auMusic') { AU.set.music = e.target.value / 100; auApplyVolumes(); auSave(); }
  if (e.target.id === 'auSfx') { AU.set.sfx = e.target.value / 100; auApplyVolumes(); auSave(); }
});
document.addEventListener('change', e => { if (e.target.id === 'auSfx') sfx('coin'); });
A.muteToggle = () => {
  AU.set.muted = !AU.set.muted; auSave(); auApplyVolumes(); auUpdateButton();
  if (typeof lastSig !== 'undefined') lastSig = '';
};
auUpdateButton();
