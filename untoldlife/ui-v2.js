'use strict';
/* Interface presentation only. All economic and game actions stay in game.js. */
const UI_PATHS={
 farm:'M12 21v-9m0 4C5 16 3 12 3 6c6 0 9 3 9 8m0-3c0-5 4-8 9-8 0 6-3 10-9 10',
 barn:'m3 10 9-7 9 7v11H3V10Zm6 11v-7h6v7M7 9h10',
 mine:'m4 20 9-10m-5-5c5-3 9-1 12 3l1 4-5-4-5 1-3-4Z',
 lake:'M5 21 16 3l3 2M16 3v11c0 5 5 5 5 1v-3M3 20h7',
 guild:'m4 3 12 12m4 6-4-4m-2-1 4-4m-7-2 8-7 2 2-7 8M3 20l4-4m-5 1 5 5',
 smith:'M3 8h18l-4 5h-4v5h5v3H6v-3h5v-5H7L3 8Zm2-3h10',
 market:'M3 4h2l3 12h11l2-8H6m3 13h.01M18 21h.01',
 village:'m2 11 5-4 5 4v10H2V11Zm10-4 5-4 5 4v14H12M6 21v-5h3v5m7-11h2m-2 4h2',
 legacy:'M12 22v-7M6 15h12c6 0 4-8 0-8 0-7-12-7-12 0-4 0-6 8 0 8Z',
 settings:'M10 3h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3l-2-2 2-4 3 1 3-1 1-3Z M12 9a4 4 0 1 0 .01 0',
 water:'M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Zm-4 13c0 2 1 3 3 3',
 sun:'M12 8a4 4 0 1 0 .01 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
 moon:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
 clock:'M12 3a9 9 0 1 0 .01 0M12 7v6l4 2',
 coin:'M12 3a9 9 0 1 0 .01 0M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12',
 lock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2',
 unlock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0m-3 9v2',
 scroll:'M5 3h14v15c0 4-6 4-6 0v-2H3c0 4 4 5 7 5h7M5 3v13M8 7h7m-7 4h7',
 sparkle:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Zm7 0v4m-2-2h4',
 heart:'M12 21 3 12C-2 5 7 0 12 7c5-7 14-2 9 5l-9 9Z',
 cloud:'M7 18h11a4 4 0 0 0 0-8 6 6 0 0 0-12-1 5 5 0 0 0 1 9Z',
 rain:'M6 15h12a4 4 0 0 0 0-8 6 6 0 0 0-12 0 4 4 0 0 0 0 8Zm2 3-1 4m6-4-1 4m6-4-1 4',
 snow:'M12 2v20M3 7l18 10M3 17 21 7m-12-2 3 3 3-3m-6 14 3-3 3 3',
 basket:'M3 9h18l-3 12H6L3 9Zm3 0 4-7m8 7-4-7m-5 11 1 7m4-7-1 7',
 seedbag:'M7 3h10l-2 4c8 8 9 15-3 15S1 15 9 7L7 3Zm2 4h6m-3 12v-5m0 2c-4 0-4-3-4-3 3 0 4 1 4 3m0-2c0-2 2-3 4-3 0 3-2 4-4 4',
 arrow:'m14 6-6 6 6 6M8 12h13',
 plus:'M12 4v16M4 12h16',
 check:'m5 12 4 4L20 5',
 close:'m5 5 14 14M5 19 19 5',
 help:'M12 3a9 9 0 1 0 .01 0M9 9a3 3 0 1 1 5 2c-2 1-2 1-2 3m0 3h.01'
};
function glyph(name,label=''){
  const path=UI_PATHS[name]||UI_PATHS.sparkle;
  return `<span class="ui-icon" data-icon-id="${name}" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}><svg viewBox="0 0 24 24"><path d="${path}"></path></svg></span>`;
}
const SIMPLE_ICONS={water:'water',sun:'sun',moon:'moon',clock:'clock',lock:'lock',unlock:'unlock',scroll:'scroll',sparkle:'sparkle',star:'sparkle',crown:'sparkle',cloud:'cloud',rain:'rain',snow:'snow','heart-empty':'heart',gear:'settings'};
function artMarkup(key,size,label='',illustrated=false){
  if(typeof key!=='string')return '';
  const logicalKey=key;
  if(!illustrated && SIMPLE_ICONS[key])return glyph(SIMPLE_ICONS[key],label);
  if(!illustrated && UI_PATHS[key]&&!ART[key])return glyph(key,label);
  const tier=key.match(/^(hoe|can|pick|sword|armor|rod)-(\d)$/);
  let nativeTier=false;
  if(tier){const level=+tier[2],drawnLevel=[6,4,2,0].find(t=>t<=level);const candidate=tier[1]+'-'+drawnLevel;if(ART[candidate]){key=candidate;nativeTier=level===drawnLevel;}else key=tier[1];}
  const crop=key.match(/^(.+)-(seed|sprout|leaf)$/);
  let stage='';
  if(crop){stage=crop[2];key=stage==='sprout'?'sprout':crop[1];}
  const medal=typeof ACHIEVEMENT_ART!=='undefined'?ACHIEVEMENT_ART[key]:null;
  if(key.startsWith('ach-')&&!medal)key=/^(ach-har)/.test(key)?'basket':/^(ach-blk|ach-min)/.test(key)?'pick':/^(ach-kil|ach-dun)/.test(key)?'sword':/^(ach-pro)/.test(key)?'egg':/^(ach-fsh)/.test(key)?'rod':/^(ach-love|ach-marry)/.test(key)?'heart':/^(ach-gen)/.test(key)?'tree':'coin';
  const asset=ART[key];if(!asset)return '';
  const file=ART_CUTOUTS[`${asset.sheet}:${asset.index}`];
  if(!file)return '';
  const classes=['px','rich-icon','isolated-icon',asset.sheet==='portraits'||key.startsWith('npc-')?'portrait-art':'',asset.tint?'golden-art':'',asset.sheet==='seasons'?'season-art':'',asset.sheet==='legacy'?(asset.index===0?'legacy-crown-art':'legacy-tree-art'):'',tier?(nativeTier?'tool-native':'tier-'+tier[2]):'',stage?'stage-'+stage:'',medal?'medal-motif':'',['chicken','cow','sheep','bee'].includes(key)?'animal-art':''].filter(Boolean).join(' ');
  const safe=String(label).replace(/[&<>"']/g,'');
  const img=`<img class="${classes}" src="assets/${file}" ${imageTagAttributes('assets/'+file,logicalKey)} data-fallback-emoji="${fallbackEmojiForKey(logicalKey)}" width="${size}" height="${size}" alt="${safe}" draggable="false" style="--icon-size:${size}px">`;
  return medal?`<span class="achievement-medal metal-${medal.metal}" data-medal-category="${medal.category}" data-medal-metal="${medal.metal}" style="--medal-size:${size}px">${img}</span>`:img;
}
function pageSceneMarkup(page){
 const key='scene-'+page,asset=ART[key];if(!asset)return '';
 const file=ART_CUTOUTS[`${asset.sheet}:${asset.index}`];
 return `<div class="page-scene" aria-hidden="true"><img class="page-scene-art" src="assets/${file}" ${imageTagAttributes('assets/'+file,key)} width="1600" height="220" alt="" decoding="async"></div>`;
}
let shelfSeason=null;
function seasonMarkup(index,size=28){return artMarkup(SEASON_ART_KEYS[index],size,SEASONS[index].n,true);}
function seasonChooser(){
  const names=[L('الربيع'),L('الصيف'),L('الخريف'),L('الشتاء'),L('نادرة')];
  const selected=shelfSeason===null?S.season:shelfSeason;
  return L`<div class="seed-heading"><h3>اختر البذرة</h3><small>محاصيل لكل موسم</small></div><div class="season-picker" aria-label="موسم البذور">${names.map((n,i)=>`<button type="button" data-shelf="${i}" aria-pressed="${i===selected}" class="${i===selected?'active':''} ${i===S.season?'now':''}">${i<4?seasonMarkup(i,28):glyph('sparkle')}${n}</button>`).join('')}</div>`;
}
function chooseShelf(season){
  shelfSeason=season;
  document.querySelectorAll('.srow[data-season]').forEach(el=>el.classList.toggle('shown',+el.dataset.season===season));
  document.querySelectorAll('[data-shelf]').forEach(el=>{const selected=+el.dataset.shelf===season;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',selected);});
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-shelf]');if(button)chooseShelf(+button.dataset.shelf);});
Object.assign(PX_EMOJI,{'➕':'plus','✅':'check','❌':'close','⚠️':'help','🟢':'check','💡':'help','❓':'help','📊':'settings','🌱':'farm'});
const NAV_ART={farm:'sprout',barn:'cow',mine:'pick',lake:'rod',guild:'sword',smith:'anvil',market:'chest',village:'village',legacy:'legacy-tree',settings:'gear'};
function tabsMarkup(list,badges,current){
 return list.map(([id,label])=>`<button data-a="tab" data-v="${id}" class="${current===id?'on':''}" aria-current="${current===id?'page':'false'}"><span class="nav-emblem nav-${id}" aria-hidden="true">${artMarkup(NAV_ART[id],40,'',true)}</span><span>${label.replace(/^\S+\s/,'')}</span>${badges[id]?`<span class="badge">${typeof badges[id]==='number'?badges[id]:'✦'}</span>`:''}</button>`).join('');
}
