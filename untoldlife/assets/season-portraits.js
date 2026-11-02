/* Independent commissioned UI artwork. Presentation aliases only; save IDs stay intact. */
const SEASON_ART_KEYS=['season-spring','season-summer','season-autumn','season-winter'];
['spring','summer','autumn','winter'].forEach((id,index)=>{
 ART[SEASON_ART_KEYS[index]]={sheet:'seasons',index};
 ART_CUTOUTS[`seasons:${index}`]=`art/seasons/${id}.png`;
});
['spring','autumn','winter'].forEach(id=>{ART[id]=ART[`season-${id}`];});
['neutral','friendly','joyful'].forEach((mood,index)=>{
 ART_CUTOUTS[`portraits:${index*5}`]=`art/portraits/mayor-${mood}.png`;
});
