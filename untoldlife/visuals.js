'use strict';
/* Presentation only: no state mutation, save fields, gameplay timers or random calls. */
function icon(value, size = 24, variant = '') {
  const obj = typeof value === 'object' ? value : null;
  const seasonIndex = obj ? SEASONS.indexOf(obj) : -1;
  if (seasonIndex >= 0) return seasonMarkup(seasonIndex,size);
  const candidate = (obj ? obj.id : value) + variant;
  let key = PX[candidate] || ART[candidate] || SIMPLE_ICONS[candidate] || UI_PATHS[candidate] ? candidate : PX_EMOJI[obj ? obj.e : value];
  if (obj && !obj.id && obj.mhp && obj.e) {
    const index=(obj.boss?BOSSES:MONSTERS).findIndex(m=>m[1]===obj.e);
    if(index>=0)key=(obj.boss?'boss-':'monster-')+index;
  }
  const drawn = artMarkup(key,size,obj ? obj.n || '' : '');
  if(drawn)return drawn;
  const sprite = PX[key];
  if (!sprite) return obj ? (obj.e || '') : String(value || '');
  const label = obj ? (obj.n || '') : '';
  size = Math.max(sprite.size, Math.round(size / sprite.size) * sprite.size);
  return `<img class="px${sprite.size===32?' px32':''}" src="assets/${sprite.file}" ${imageTagAttributes("assets/"+sprite.file,key)} data-fallback-emoji="${fallbackEmojiForKey(key)}" width="${size}" height="${size}" alt="${label.replace(/[&<>"']/g, '')}" draggable="false">`;
}
const goldIcon = document.querySelector('.chip.gold > img');
if(goldIcon)goldIcon.outerHTML=artMarkup('coin',32,L('ذهب'));
const PX_RE = new RegExp(Object.keys(PX_EMOJI).sort((a,b) => b.length-a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'), 'gu');
function pixelHTML(html) {
  // Replace text only; IDs, player input, attributes, event hooks and save data stay intact.
  return String(html).replace(/(^|>)([^<]+)/g, (_, start, text) => start + text.replace(PX_RE, e => icon(PX_EMOJI[e])));
}
function visualText(el, html) {
  if (!el || el._visualHTML === html) return;
  el._visualHTML = html;
  el.innerHTML = pixelHTML(html);
}
let logIconPattern=null, logIconMap=null;
function logVisualHTML(msg) {
  if(!logIconPattern) {
    logIconMap=new Map();
    const add=(x,key)=>logIconMap.set(x.e+' '+x.n,icon(key || x)+' '+x.n);
    SEASONS.forEach((s,index)=>add(s,SEASON_ART_KEYS[index]));
    Object.values(ITEMS).forEach(x=>add(x));
    BUILDINGS.forEach(x=>add(x,x.art||'building-'+x.id));
    PERKS.forEach(x=>add(x,'perk-'+x.id));
    ACH.forEach(x=>add(x,'ach-'+x.id));
    MONSTERS.forEach(([n,e],i)=>add({n,e},'monster-'+i));
    BOSSES.forEach(([n,e],i)=>add({n,e},'boss-'+i));
    logIconPattern=new RegExp([...logIconMap.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gu');
  }
  return String(msg).replace(logIconPattern,s=>logIconMap.get(s));
}
const quietMotion = matchMedia('(prefers-reduced-motion: reduce)');
function floatVisual(el, html, type = '') {
  if (!el || quietMotion.matches || document.hidden) return;
  const layer = document.getElementById('effects');
  if (!layer || layer.childElementCount >= 30) return;
  const rect = el.getBoundingClientRect();
  const f = document.createElement('span');
  f.className = 'float-vfx ' + type;
  f.style.left = Math.round(rect.left + rect.width / 2) + 'px';
  f.style.top = Math.round(rect.top + rect.height / 2) + 'px';
  f.innerHTML = pixelHTML(html);
  layer.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}
function burstVisual(el, type = '') {
  if (!el || quietMotion.matches || document.hidden) return;
  const layer = document.getElementById('effects');
  const box = el.getBoundingClientRect();
  for (let i=0; i<8 && layer.childElementCount<30; i++) {
    const dot = document.createElement('i');
    dot.className = 'particle-vfx ' + type;
    dot.style.cssText = `left:${Math.round(box.left+box.width/2)}px;top:${Math.round(box.top+box.height/2)}px;--dx:${(i-3.5)*17}px;--dy:${-26-(i%3)*18}px;--p:${['#e7c67e','#91b38a','#b692bc','#d68b75'][i%4]}`;
    layer.appendChild(dot); setTimeout(()=>dot.remove(),800);
  }
}
function eventVisual(msg, type) {
  if (quietMotion.matches) return;
  if (type === 'gold') floatVisual(document.getElementById('hGold'), '✦ ' + (msg.match(/\+[\d,.]+[KMBT]?/) || [''])[0] + ' ' + icon('coin'), 'gold-float');
  if (type === 'good' && /إنجاز جديد|New achievement|Nuevo logro|Nova conquista|Новое достижение|新成就/.test(msg)) burstVisual(document.getElementById('hGen'));
  if (/مستوى|ارتقيت|\blevel\b|nivel|nível|уровень|级/i.test(msg)) {
    const v = document.getElementById('view');
    v.animate([{filter:'brightness(1)'},{filter:'brightness(1.2)'},{filter:'brightness(1)'}],{duration:700});
  }
}

function updateEnemyVisual(box, dungeon, hero, maxHp) {
  if (!dungeon.active) {box.className='enemy';visualText(box, L('<p class="hint">أنت خارج الزنزانة. صحتك تتعافى ببطء.</p>'));return;}
  if (dungeon.resting) {box.className='enemy';visualText(box, L`<div class="em">${icon('village',96)}</div><p class="hint">ترتاح وتستعيد صحتك... (${ftime((maxHp-hero.hp)/regenRate())})</p>`);return;}
  const enemy=dungeon.enemy;
  if (!enemy) return;
  const key=enemy.n+'|'+enemy.mhp+'|'+dungeon.floor;
  if (box.dataset.enemy!==key || !box.querySelector('.enemy-hp-text')) {
    box.dataset.enemy=key;box._visualHTML=null;
    box.className='enemy'+(enemy.boss?' boss':'');
    // Names and stats use the same enemy state and formulas as the original view.
    box.innerHTML=pixelHTML(L`<div class="em">${icon(enemy,enemy.boss?128:96)}</div><b>${enemy.boss?L('👑 الزعيم: '):''}${enemy.n}</b>
      <div class="kv"><span>الصحة</span><span class="enemy-hp-text"></span></div><div class="bar hp"><i class="enemy-hp-bar"></i></div>
      <div class="row" style="justify-content:center"><span class="stat">🗡️ ${fmt(enemy.atk)}</span><span class="stat">🛡️ ${fmt(enemy.def)}</span><span class="stat enemy-kills"></span></div><small class="hint enemy-retry"></small>`);
    box._enemyHP=enemy.hp;
  }
  if(enemy.hp<box._enemyHP) {
    floatVisual(box,'−'+fmt(box._enemyHP-enemy.hp));
    if(!quietMotion.matches)box.querySelector('.em').animate([{filter:'brightness(2.2) sepia(.4)'},{filter:'none'}],{duration:220,easing:'steps(2)'});
  }
  box._enemyHP=enemy.hp;
  box.querySelector('.enemy-hp-text').textContent=`${fmt(Math.max(0,enemy.hp))} / ${fmt(enemy.mhp)}`;
  box.querySelector('.enemy-hp-bar').style.width=Math.max(0,enemy.hp)/enemy.mhp*100+'%';
  visualText(box.querySelector('.enemy-kills'),`💀 ${dungeon.kills}/${enemy.boss?1:5}`);
  visualText(box.querySelector('.enemy-retry'),dungeon.auto && dungeon.retry>0 ? L`⏳ محاولة التقدم مجدداً بعد ${ftime(dungeon.retry)}`:'');
}

// Atmospheric overlays follow the original clock/weather without touching gameplay.
(function livingSky(){
  const canvas=document.getElementById('weatherCanvas'),ctx=canvas.getContext('2d');
  const sky=document.querySelector('.sky');let w=0,h=0,last=0;
  function resize(){w=Math.ceil(sky.clientWidth/2);h=Math.ceil(sky.clientHeight/2);canvas.width=w;canvas.height=h;draw(performance.now());}
  function draw(now){
    if(typeof S==='undefined'||!S||!w)return;
    const t=quietMotion.matches?0:now/1000,hr=6+S.clock/DAY_LEN*20,night=hr>20||hr<7;
    ctx.clearRect(0,0,w,h);
    const rain=S.weather==='rain',snow=S.weather==='snow',cloud=S.weather==='cloudy';
    if(cloud||rain){ctx.fillStyle=rain?'#1d374a27':'#b3c2bc13';ctx.fillRect(0,0,w,h);}
    const firefly=night&&S.season===1;
    const count=rain?60:snow?40:firefly?14:S.season===0||S.season===2?8:0;
    for(let i=0;i<count;i++){
      const y=((i*31+t*(rain?68:snow?8:3))%(h+12))-6;
      const x=((i*73-t*(rain?26:2)+Math.sin(i+t*.7)*5)%w+w)%w;
      ctx.fillStyle=rain?'#c6e4ec88':snow?'#f9f5dfbd':firefly?'#e7e7ac':S.season===2?'#d9a96888':'#e7b9c888';
      if(firefly){ctx.globalAlpha=.25+Math.abs(Math.sin(t+i))*.7;ctx.fillRect(Math.round(x),Math.round(h*.5+y*.5),1,1);ctx.globalAlpha=1;}
      else if(rain){ctx.fillRect(Math.round(x),Math.round(y),1,5);ctx.fillRect(Math.round(x-1),Math.round(y+4),1,3);}
      else ctx.fillRect(Math.round(x),Math.round(y),1+(i%3===0?1:0),1);
    }
  }
  function loop(now){if(!document.hidden&&now-last>48){draw(now);last=now;}if(!quietMotion.matches)requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(sky);
  quietMotion.addEventListener('change',()=>{draw(performance.now());if(!quietMotion.matches)requestAnimationFrame(loop);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw(performance.now());});
  globalThis.redrawWeather=()=>draw(performance.now());requestAnimationFrame(loop);
})();

// Golden harvest: a gold flash over the plot, sparks and the gold amount rising.
function goldenVisual(i, g) {
  const el = document.getElementById('plot' + i), layer = document.getElementById('effects');
  if (!el || !layer || document.hidden) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'golden-flash';
  f.style.cssText = `left:${Math.round(r.left)}px;top:${Math.round(r.top)}px;width:${Math.round(r.width)}px;height:${Math.round(r.height)}px`;
  f.innerHTML = '<span>✨</span>';
  layer.appendChild(f); setTimeout(() => f.remove(), 1700);
  if (quietMotion.matches) return;
  for (let k = 0; k < 14 && layer.childElementCount < 40; k++) {
    const d = document.createElement('i'), a = k / 14 * Math.PI * 2, dist = 30 + (k % 3) * 16;
    d.className = 'particle-vfx golden-spark';
    d.style.cssText = `left:${Math.round(r.left + r.width / 2)}px;top:${Math.round(r.top + r.height / 2)}px;--dx:${Math.round(Math.cos(a) * dist)}px;--dy:${Math.round(Math.sin(a) * dist - 18)}px;--p:${k % 2 ? '#ffd76a' : '#fff3c4'}`;
    layer.appendChild(d); setTimeout(() => d.remove(), 900);
  }
  floatVisual(el, '✨ +' + fmt(g) + ' ' + icon('coin', 24), 'golden-float');
}

// A fishing king: a big gold card, like a successful breeding.
function fishVisual(f, kg) {
  let box = document.getElementById('breedFx'); if (box) box.remove();
  box = document.createElement('div'); box.id = 'breedFx'; box.className = 'breed-fx win';
  box.innerHTML = `<div class="bfx-card"><div class="bfx-pair">${icon(f, 96)}</div><b>👑 ${f.n}!</b><small>${kg} ${L('كغ')}</small></div>`;
  box.addEventListener('click', () => box.remove());
  document.body.appendChild(box); setTimeout(() => box.isConnected && box.remove(), 3500);
}

// Breeding: the two animals shake for a moment, then the result opens like a card pack.
function breedVisual(a, to, win) {
  let box = document.getElementById('breedFx');
  if (box) box.remove();
  box = document.createElement('div');
  box.id = 'breedFx';
  box.className = 'breed-fx' + (to === 'g' ? ' to-g' : '');
  const from = to === 'g' ? a.id + '-p' : a.id, res = a.id + '-' + to, G = GRADE[to];
  box.innerHTML = `<div class="bfx-card"><div class="bfx-pair">${icon(from, 64)}${icon(from, 64)}</div><b class="bfx-q">🧬</b></div>`;
  box.addEventListener('click', () => box.remove());
  document.body.appendChild(box);
  const wait = quietMotion.matches ? 150 : 1100;
  setTimeout(() => {
    if (!box.isConnected) return;
    box.classList.add(win ? 'win' : 'lose');
    box.querySelector('.bfx-card').innerHTML = win
      ? `<div class="bfx-pair">${icon(res, 72)}${icon(res, 72)}</div><b>${L('✨ نجح!')}</b><small>${a.n} ${G.n} ×2 ${gradeBadge(to)}</small>`
      : `<div class="bfx-pair">${icon(from, 64)}${icon(from, 64)}</div><b>${L('💀 فشل')}</b><small>${P('r_twin') ? L('حيواناتك سالمة') : L`خسرت ${a.n} ×2`}</small>`;
  }, wait);
  setTimeout(() => box.isConnected && box.remove(), wait + (win ? 2600 : 1700));
}
