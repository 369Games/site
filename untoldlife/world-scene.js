'use strict';
/* The world uses the game's clock. Interface theme remains a separate preference. */
const narrowWorld=matchMedia('(max-width:600px)');
function worldNightAt(hour){
  const ramp=(a,b,v)=>Math.max(0,Math.min(1,(v-a)/(b-a)));
  if(hour<8)return 1-ramp(5.6,8,hour);
  return ramp(18.1,20.5,hour);
}
function updateWorldScene(state,hour,skyTop,skyBottom){
  const top=document.getElementById('top'),sky=top.querySelector('.sky');
  const night=worldNightAt(hour);
  const phase=hour<8?'dawn':hour<17.3?'day':hour<20.5?'dusk':'night';
  const names={dawn:L('شروق'),day:L('نهار'),dusk:L('غروب'),night:L('ليل')};
  top.dataset.phase=phase;top.dataset.night=night>.75;
  top.dataset.season=state.season;top.dataset.weather=state.weather;
  labelImageElement(top.querySelector('.brand-season-seal'),'assets/art/seasons/'+['spring','summer','autumn','winter'][state.season]+'.png',SEASON_ART_KEYS[state.season]);
  top.style.setProperty('--night-mix',night.toFixed(4));
  top.style.setProperty('--cloud-light',(1-night*.48).toFixed(3));
  top.style.setProperty('--cloud-opacity',(state.weather==='rain'?.88:1-night*.32).toFixed(3));
  updateWorldClouds(state);
  const dim=state.weather==='rain'?.76:state.weather==='cloudy'?.88:1;
  top.style.setProperty('--terrain-light',String(dim));
  top.style.setProperty('--terrain-season',state.season===2?'sepia(.25) hue-rotate(-18deg)':state.season===3?'saturate(.5) brightness(1.1)':'saturate(1)');
  sky.style.background=`linear-gradient(180deg,${skyTop} 0%,${skyBottom} 90%)`;
  document.getElementById('stars').style.opacity=night;
  function orb(id,progress){
    const el=document.getElementById(id),visible=progress>=0&&progress<=1;
    el.style.opacity=visible?1:0;
    if(visible){el.style.right=(narrowWorld.matches?55+progress*36:8+progress*84)+'%';el.style.top=(53-Math.sin(Math.PI*progress)*39)+'%';}
  }
  orb('sun',(hour-6)/13.6);orb('moon',(hour-19)/7);
  document.getElementById('moon').style.setProperty('--moon-shadow',((state.day%8)/7*22)+'px');
  const badge=document.getElementById('hPhase');
  if(badge)visualText(badge,glyph(phase==='night'?'moon':'sun')+names[phase]);
}
function updateWorldClouds(state){
  const layer=document.getElementById('skyClouds');
  if(!layer||layer.dataset.weather===state.weather)return;
  layer.dataset.weather=state.weather;
  const overcast=['rain','cloudy','snow'].includes(state.weather),count=overcast?7:3;
  const children=[];
  for(let i=0;i<count;i++){
    const variant=state.weather==='rain'?'storm':state.weather==='cloudy'&&i%2===0?'storm':i%3===1?'wispy':'puffy';
    const cloud=document.createElement('img');
    cloud.className='world-cloud cloud-'+variant;cloud.src='assets/art/sky/cloud-'+variant+'.webp';cloud.alt='';cloud.draggable=false;
    labelImageElement(cloud,'assets/art/sky/cloud-'+variant+'.webp');
    const x=overcast?[-8,8,28,43,62,78,93][i]:[3,39,75][i];
    cloud.style.cssText=`--cloud-x:${x}%;--cloud-y:${[0,4,9,1,7,3,11][i]}%;--cloud-scale:${[1,.85,1.1,.9,1.15,.8,1][i]};--cloud-duration:${100+i*19}s;--cloud-delay:-${i*17+9}s`;
    children.push(cloud);
  }
  layer.replaceChildren(...children);
}
