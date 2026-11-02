/* Stable source identities; assets/cutouts.js maps them to individual PNG files. */
const ART_SHEETS={items:{file:'art/items.png',cols:8,rows:8},world:{file:'art/world.png',cols:8,rows:4},portraits:{file:'art/characters.png',cols:5,rows:3}};
const ART={};
['turnip','garlic','potato','strawberry','broccoli','cucumber','tomato','corn','bellpepper','watermelon','mushroom','eggplant','apple','pumpkin','grape','carrot','onion','sweetpotato','pepper','chestnut','saffron','dates','mango','pineapple','chicken','cow','sheep','bee','egg','milk','wool','honey','copper','iron','silver','gold_ore','mithril','adamant','gem','chest','sardine','shrimp','crab','tropical','puffer','squid','octopus','shark','hoe','can','pick','sword','armor','rod','coin','heart','sprout','seedbag','basket','scroll','anvil','gear','tree','village'].forEach((id,i)=>ART[id]={sheet:'items',index:i});
for(let i=0;i<14;i++)ART['monster-'+i]={sheet:'world',index:i};
for(let i=0;i<7;i++)ART['boss-'+i]={sheet:'world',index:14+i};
Object.entries({bin:21,barn:22,inn:23,kitchen:24,greenhouse:25,sprinkler:26,zoning:27,harvester:28,planter:29,rancher:30,merc:31}).forEach(([id,index])=>ART['building-'+id]={sheet:'world',index});
['mayor','noura','smith','leila','raad'].forEach((id,col)=>{for(let mood=0;mood<3;mood++)ART[`npc-${id}-${mood}`]={sheet:'portraits',index:mood*5+col};});
Object.entries({barn:'building-barn',market:'building-bin',leaf:'sprout',heart:'heart'}).forEach(([id,key])=>{if(id!==key)ART[id]=ART[key];});
/* Dedicated pass-2 materials, heirlooms, perks, challenges, tools and workers
   are registered in assets/pass2-art.js instead of unrelated-image aliases. */
/* Dedicated breeding sprites: no tint flag; loaded before game.js fallback aliases. */
["egg_g","milk_g","wool_g","chicken-p","chicken-g","cow-p","cow-g","sheep-p","sheep-g"].forEach((id,index)=>{ART[id]={sheet:'breeding',index};});
