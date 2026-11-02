'use strict';
function fallbackEmojiForKey(key){
 const special={gel:'🧪',bone:'🦴',fang:'🦷',ecto:'✨',ember:'🔥',dscale:'🐉','worker-farm':'👨‍🌾','worker-miner':'👷','worker-fisher':'🎣',rock:'🪨',bobber:'🎣'};
 if(special[key])return special[key];
 const base=key.replace(/^heir-/,'').replace(/-\d$/,'');
 const tools={sword:'🗡️',armor:'🛡️',hoe:'🌾',can:'🚿',pick:'⛏️',rod:'🎣',cow:'🔔',diary:'📗',coin:'🪙',amulet:'📿',ring:'💍',seedbag:'🎒'};
 return tools[base]||Object.entries(PX_EMOJI).find(([,id])=>id===key)?.[0]||(key.startsWith('ach-')?'🏅':key.startsWith('perk-')?'✦':key.startsWith('challenge-')?'🛡️':key.startsWith('npc-')?'👤':'✦');
}
// Capturing error events works with dynamically created images and file://.
document.addEventListener('error',event=>{
 const img=event.target;if(!(img instanceof HTMLImageElement))return;
 const fallback=document.createElement('span');fallback.className='image-emoji-fallback';fallback.setAttribute('role','img');
 fallback.setAttribute('aria-label',img.alt||img.dataset.assetPurpose||'صورة');fallback.textContent=img.dataset.fallbackEmoji||fallbackEmojiForKey(img.dataset.assetKey||'');
 fallback.style.cssText=`width:${img.getAttribute('width')||24}px;height:${img.getAttribute('height')||24}px`;
 fallback.dataset.fallbackFor=img.dataset.assetKey||img.dataset.assetId||'';img.replaceWith(fallback);
},true);
/* Inspect data-asset-* to identify an image. Details live in assets/asset-catalog.json. */
function imageTagAttributes(file,key=''){
 const meta=IMAGE_METADATA[file];
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `data-asset-id="${escape(meta?meta.id:'unregistered')}" data-asset-key="${escape(key||(meta?meta.id:''))}" data-asset-file="${escape(file)}" data-asset-purpose="${escape(meta?meta.purpose:'صورة تحتاج إلى تعريف في سجل الأصول')}"`;
}
function labelImageElement(element,file,key=''){
 if(!element||element.dataset.assetFile===file&&element.dataset.assetKey===(key||(IMAGE_METADATA[file]||{}).id))return;
 const meta=IMAGE_METADATA[file];
 element.dataset.assetId=meta?meta.id:'unregistered';
 element.dataset.assetKey=key||(meta?meta.id:'');
 element.dataset.assetFile=file;
 element.dataset.assetPurpose=meta?meta.purpose:'صورة تحتاج إلى تعريف في سجل الأصول';
}
for(const [selector,file] of [
 ['.world-land-day','assets/art/terrain-day.webp'],['.world-land-night','assets/art/terrain-night.webp'],
 ['#sun','assets/art/sky/sun.webp'],['#moon','assets/art/sky/moon.webp'],
 ['.world-sky-decor','assets/art/sky/horizon-mask.svg'],['.brand-wordmark','assets/art/brand/untoldlife-wordmark.webp']
])labelImageElement(document.querySelector(selector),file);
// Existing static images are labeled before icon() replaces them with current artwork.
document.querySelectorAll('img[src^="assets/"]').forEach(img=>labelImageElement(img,img.getAttribute('src')));
for(const [selector,id,purpose] of [
 ['#weatherCanvas','weather-particles','مطر وثلج ويراعات وبتلات مرسومة بالكود؛ ليست ملف صورة'],
 ['#stars','night-stars','نجوم مرسومة بعناصر CSS حسب وقت اللعبة؛ ليست ملف صورة']
]){const el=document.querySelector(selector);if(el){el.dataset.visualId=id;el.dataset.visualPurpose=purpose;}}
