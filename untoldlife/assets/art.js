/* Stable source identities; assets/cutouts.js maps them to individual PNG files. */
const ART_SHEETS={items:{file:'art/items.webp',cols:8,rows:8},world:{file:'art/world.webp',cols:8,rows:4},portraits:{file:'art/characters.webp',cols:5,rows:3}};
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
ART['building-breedlab']={sheet:'breeding',index:9};
/* Shepherd's crook, one picture per tier (assets/art/shepherd-crooks). */
for(let i=0;i<7;i++)ART['crook-'+i]={sheet:'crook',index:i};
/* Worker's gloves, one picture per tier (assets/art/work-gloves). */
for(let i=0;i<7;i++)ART['glove-'+i]={sheet:'glove',index:i};
/* Goats and turkeys with their products and grades (assets/art/goat-turkey). */
['goat','goat-p','goat-g','cheese','cheese_g','turkey','turkey-p','turkey-g','meat','meat_g'].forEach((id,index)=>{ART[id]={sheet:'goatturkey',index};});
/* Camels (مجهم، وضحى، شقحاء) and hashi meat (assets/art/camel-hashi). */
['camel','camel-p','camel-g','hashi','hashi_g'].forEach((id,index)=>{ART[id]={sheet:'camel',index};});
/* Deep ores for selling (assets/art/deep-ores), recoloured from the adamantite crystals. */
['orichalcum','starmetal'].forEach((id,index)=>{ART[id]={sheet:'deepore',index};});
/* Batch 1 of missing art (assets/art/missing-v1): special-skill badges, player and companion portraits, UI icons. */
['ally','hero-f','hero-m','icon-autobreed','icon-donor','icon-dungeon','icon-floorfit','icon-friend','icon-fund','icon-merchant','perk-f_seeds','perk-m_tnt','perk-q_tools','perk-q_twin','perk-r_twin','perk-t_deal','perk-w_ally'].forEach((id,index)=>{ART[id]={sheet:'missing',index};});
/* 1.6 fighting gear, tiers 0–6 and the legendary form 7 (assets/art/combat-gear). */
['helmet','shield','amulet','boots'].forEach((id,p)=>{for(let i=0;i<8;i++)ART[id+'-'+i]={sheet:'gear16',index:p*8+i};});
['pet-egg','pet-griffin-0','pet-griffin-1','pet-griffin-2','pet-dragon-0','pet-dragon-1','pet-dragon-2','pet-unicorn-0','pet-unicorn-1','pet-unicorn-2'].forEach((id,i)=>{ART[id]={sheet:'pets',index:i};});
['hunt','sword','guard','iron','sage','quest','swift','tamer','healer','legend'].forEach((id,i)=>{ART['title-'+id]={sheet:'titles',index:i};});
/* Emoji in text that now has its own picture (the dungeon used to show copper ore). */
Object.assign(PX_EMOJI,{'🕳️':'icon-dungeon','🧳':'icon-merchant','⚖️':'icon-floorfit','🤝':'icon-friend','🫡':'ally'});
/* Salma's portraits: neutral, friendly, joyful (assets/art/salma-portraits). */
for(let i=0;i<3;i++)ART['npc-salma-'+i]={sheet:'salma',index:i};
/* Legendary tools from the forge, tier 7 (assets/art/legendary-tools). */
for(const t of ['hoe','can','pick','sword','armor','rod','glove','crook'])ART[t+'-7']={sheet:'legend',index:t};
/* Fishing v2: river, sea and king fish (assets/art/fishing-v2). */
["trout","crayfish","eel","catfish","sturgeon","tuna","oyster","jelly","swordfish","whaleshark","k_lake","k_river","k_sea"].forEach((id,index)=>{ART[id]={sheet:'fish2',index};});
