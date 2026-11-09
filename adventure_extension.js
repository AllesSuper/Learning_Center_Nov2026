'use strict';
// v6: Offline-Weltreise, freundliches Lernhaustier, Boss-Finale und 1/3/7-Tage-Schatzkarten.
// Rein lokale DOM-/localStorage-Funktionen, keine externen Dienste oder Abhaengigkeiten.
const ADVENTURE_REGIONS = [
  {id:'europa',name:'Europa',icon:'🏰',intro:'Über bunte Städte und hohe Berge geht die Reise!',codes:'de fr it nl at pl be ua ie se ch dk fi lu ee gb es pt gr tr no cz sk hr si hu ro bg is cy mt mc sm va li ad rs ba me mk al md by lt lv gi fo im je gg'},
  {id:'asien',name:'Asien',icon:'🐼',intro:'Die Reise führt an Bergen, Tempeln und weiten Landschaften vorbei!',codes:'jp cn in kr th id my sg vn ph pk bd lk np il sa ae qa ir iq jo lb ge am az kz uz mn tw hk af bh bt bn kh kp kw kg la mv mm om ps sy tj tl tm ye mo'},
  {id:'afrika',name:'Afrika',icon:'🦁',intro:'Hier gibt es viele unterschiedliche Landschaften und Tiere zu entdecken!',codes:'za eg ma tn dz ng ke et gh sn cm ci tz ug zw zm ao na bw bj bf bi cv cf td km cg cd dj gq er sz ga gm gn gw ls lr ly mg mw ml mr mu mz ne rw st sc sl so ss sd tg eh re yt'},
  {id:'amerika',name:'Amerika',icon:'🦜',intro:'Von Norden bis Süden warten viele Flaggen auf dich!',codes:'us ca mx br ar cl pe co ve uy py bo ec cr pa cu do jm ht bs ag bb bz dm gd gt hn ni kn lc vc sv tt gy sr aw ai bm vg ky cw gp mq ms pr tc vi pm gl'},
  {id:'ozeanien',name:'Ozeanien',icon:'🐨',intro:'Auf zu kleinen und großen Inseln im Pazifik!',codes:'au nz fj ki mh fm nr pw pg ws sb to tv vu gu nc pf as ck nu wf'},
  {id:'weitere',name:'Überraschungswelt',icon:'🧭',intro:'Eine Entdeckerreise zu ganz besonderen Orten!',codes:''}
].map(region=>({...region,ids:new Set(region.codes.split(' ').filter(Boolean))}));
const PET_TYPES={fox:{emoji:'🦊',name:'Fips, der Fuchs'},dragon:{emoji:'🐉',name:'Funkel, der Drache'}};
const PET_GIFTS=[{at:5,emoji:'🎒',name:'Entdecker-Rucksack'},{at:15,emoji:'🎩',name:'Zauberhut'},
  {at:30,emoji:'🧣',name:'Abenteuer-Umhang'},{at:60,emoji:'🪄',name:'Zauberstab'},
  {at:100,emoji:'👑',name:'Sternenkrone'}];
const MAX_TREASURE_CARDS=80;
function defaultAdventureState() {
  return {passport:{seen:[],completed:[]},pet:{type:null,xp:0},bossTickets:0,bossWins:0,treasureCards:[]};
}
function adventureBound(n,max=100000){return Number.isSafeInteger(n)?Math.max(0,Math.min(max,n)):0;}
function safeAdventureState(destination,stored) {
  const p=stored?.passport||{};
  const validIds=new Set(FLAG_COUNTRIES.map(x=>x.id));
  destination.passport={seen:[...new Set(Array.isArray(p.seen)?p.seen.filter(x=>typeof x==='string'&&validIds.has(x)):[])].slice(0,FLAG_COUNTRIES.length),
    completed:[...new Set(Array.isArray(p.completed)?p.completed.filter(x=>ADVENTURE_REGIONS.some(r=>r.id===x)):[])].slice(0,ADVENTURE_REGIONS.length)};
  destination.pet={type:Object.prototype.hasOwnProperty.call(PET_TYPES,stored?.pet?.type)?stored.pet.type:null,
    xp:adventureBound(stored?.pet?.xp)};
  destination.bossTickets=adventureBound(stored?.bossTickets,999);
  destination.bossWins=adventureBound(stored?.bossWins);
  const cards=Array.isArray(stored?.treasureCards)?stored.treasureCards:[];
  const seen=new Set();destination.treasureCards=[];
  for(const card of cards.slice(-MAX_TREASURE_CARDS*2)) {
    if(!card || !SUBJECTS.includes(card.subject) || typeof card.key!=='string' ||
       !card.key || card.key.length>220 || !/^\d{4}-\d\d-\d\d$/.test(card.due))continue;
    const signature=`${card.subject}|${card.key}`;
    if(seen.has(signature))continue;
    seen.add(signature);
    destination.treasureCards.push({subject:card.subject,key:card.key,
      level:Math.max(1,Math.min(MAX_LEVEL[card.subject],adventureBound(card.level,7)||1)),
      stage:Math.min(2,adventureBound(card.stage,2)),due:card.due});
  }
  destination.treasureCards=destination.treasureCards.slice(-MAX_TREASURE_CARDS);
}
function adventureDatePlus(days) {
  const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);
  const pad=x=>String(x).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function regionOfFlag(id) {return ADVENTURE_REGIONS.find(r=>r.id!=='weitere'&&r.ids.has(id)) || ADVENTURE_REGIONS[ADVENTURE_REGIONS.length-1];}
function recognizedInRegion(region) {return progress.passport.seen.filter(id=>regionOfFlag(id).id===region.id);}
function petLevel(xp) {return 1+Math.floor(Math.sqrt(xp/6));}
function addPetXP(amount) {if(!progress.pet.type)return;progress.pet.xp=Math.min(100000,progress.pet.xp+amount);}
function adoptPet(type) {
  if(!Object.prototype.hasOwnProperty.call(PET_TYPES,type))return;
  if(progress.pet.type!==null)return; // Tierwahl bewusst dauerhaft; Zuruecksetzen nur ueber Elternbereich.
  progress.pet.type=type;saveProgress();
}
function rememberFlagWin(task,subject) {
  if(subject!=='flags')return;
  const country=FLAG_COUNTRIES.find(item=>item.name===task.answer);
  if(!country || progress.passport.seen.includes(country.id))return;
  progress.passport.seen.push(country.id);
}
function rewardLearningWin(task,subject,firstCredit=true) {
  if(!firstCredit)return;
  addPetXP(1);
  rememberFlagWin(task,subject);
}
function treasureMarkMistake(task,subject) {
  const {key,level}=reviewEntryFor(task,subject);
  const found=progress.treasureCards.find(t=>t.subject===subject&&t.key===key);
  if(found){found.level=level;found.stage=0;found.due=adventureDatePlus(1);return;}
  progress.treasureCards.push({subject,key,level,stage:0,due:adventureDatePlus(1)});
  if(progress.treasureCards.length>MAX_TREASURE_CARDS)progress.treasureCards.shift();
}
function dueTreasureCards() {return progress.treasureCards.filter(c=>c.due<=todayLocal()).sort((a,b)=>a.due.localeCompare(b.due));}
function treasureAdvance(card,correct) {
  if(!correct){card.stage=0;card.due=adventureDatePlus(1);return false;}
  if(card.stage>=2) {progress.treasureCards=progress.treasureCards.filter(c=>c!==card);return true;}
  card.stage++;
  card.due=adventureDatePlus(card.stage===1?3:7);
  return false;
}
function completeMixedAdventure() {progress.bossTickets=Math.min(999,progress.bossTickets+1);}
function renderAdventureProgress() {
  const count=progress.passport.seen.length;
  for(const id of ['passport-count-home','passport-count-progress']){
    const e=element(id);if(e)e.textContent=`${count} von ${FLAG_COUNTRIES.length} Flaggen entdeckt`;
  }
  const passportStamps=Math.floor(count/5);
  const badge=element('passport-stamps');if(badge)badge.textContent=`${passportStamps} Stempel`; 
  for(const id of ['pet-emoji-home','pet-emoji-progress']){
    const e=element(id);if(e)e.textContent=progress.pet.type?PET_TYPES[progress.pet.type].emoji:'🥚';
  }
  for(const id of ['pet-status-home','pet-status-progress']){
    const e=element(id);if(e)e.textContent=progress.pet.type?
      `${PET_TYPES[progress.pet.type].name} · Stufe ${petLevel(progress.pet.xp)} · ${progress.pet.xp} Erfahrung`:
      'Wähle deinen Lernfreund: Fuchs oder Drache!';
  }
  const choices=element('pet-choices');if(choices)choices.classList.toggle('hidden',!!progress.pet.type);
  const gifts=element('pet-gifts');if(gifts){gifts.replaceChildren();for(const g of PET_GIFTS){
    const el=document.createElement('span');el.className='reward-chip';
    el.textContent=progress.pet.xp>=g.at?`${g.emoji} ${g.name}`:`🔒 ${g.at} XP: ${g.name}`;
    gifts.appendChild(el);
  }}
  const unlock=progress.bossTickets>0;
  for(const id of ['boss-home-button','boss-end-button']){
    const btn=element(id);if(btn){btn.classList.toggle('hidden',!unlock);btn.disabled=!unlock;}
  }
  const boss=element('boss-stat');if(boss)boss.textContent=`${progress.bossWins} Boss-Medaillen · ${progress.bossTickets} offene Einladungen`;
  const num=element('treasure-count');if(num)num.textContent=`${dueTreasureCards().length} Schätze heute bereit`;
  const next=element('treasure-next');if(next){
    const available=dueTreasureCards().length;
    next.textContent=available?`Jetzt ${available} schwierige Themen meistern!`:
      (progress.treasureCards.length?`Nächste Wiederholung: ${[...progress.treasureCards].sort((a,b)=>a.due.localeCompare(b.due))[0].due}`:'Noch keine Fehler-Schatzkarten – weiter so!');
  }
  const regionGrid=element('passport-regions');if(regionGrid){regionGrid.replaceChildren();for(const region of ADVENTURE_REGIONS){
    const ids=recognizedInRegion(region);const finished=progress.passport.completed.includes(region.id);
    const tile=document.createElement('article');tile.className='region-card';
    const title=document.createElement('strong');title.textContent=`${region.icon} ${region.name}`;
    const p=document.createElement('p');p.textContent=`${ids.length} unterschiedliche Flaggen · ${Math.floor(ids.length/5)} Regionsstempel`;
    const action=document.createElement('button');action.className='soft-button';action.type='button';
    action.disabled=ids.length<5;
    action.textContent=ids.length<5?`🔒 Noch ${5-ids.length} Flaggen entdecken`:
      finished?'✅ Reise erneut spielen':'🧭 Minireise starten';
    action.addEventListener('click',()=>beginExpedition(region.id));
    tile.append(title,p,action);regionGrid.append(tile);
  }}
}
function renderAdventureVisual(container,task){
  container.replaceChildren();
  if(task.visualFlag){const image=document.createElement('img');image.src=task.visualFlag;image.className='big-flag';image.alt='Länderflagge';container.append(image)}
  else if(task.visualEmoji){const s=document.createElement('span');s.className='big-emoji big-flag-emoji';s.textContent=task.visualEmoji;container.append(s)}
  container.classList.toggle('hidden',!task.visualFlag&&!task.visualEmoji);
}
function adventureOptionButton(task,answer,handler){
  const b=document.createElement('button');b.type='button';b.className='answer-option';
  if(task.optionFlags?.[answer]){const img=document.createElement('img');img.src=task.optionFlags[answer];img.className='option-flag';img.alt=`Flagge von ${answer}`;b.append(img)}
  else if(task.optionEmoji?.[answer]){const s=document.createElement('span');s.className='option-flag-emoji';s.textContent=task.optionEmoji[answer];b.append(s)}
  else b.textContent=answer;
  b.addEventListener('click',()=>handler(b,answer));return b;
}
function nextMiniQuestTask(state,prefix){
  if(state.index>=state.tasks.length){state.done();return;}
  const task=state.tasks[state.index];state.misses=0;
  element(`${prefix}-step`).textContent=`Frage ${state.index+1} von ${state.tasks.length}`;
  element(`${prefix}-context`).textContent=task.context||'';
  element(`${prefix}-question`).textContent=task.question;
  renderAdventureVisual(element(`${prefix}-visual`),task);
  const options=element(`${prefix}-options`);options.replaceChildren();
  element(`${prefix}-feedback`).textContent='';
  for(const answer of task.options)options.append(adventureOptionButton(task,answer,(button,value)=>{
    if(state.locked)return;
    if(value!==task.answer){state.misses++;button.disabled=true;button.classList.add('incorrect');
      if(state.misses===1 && prefix==='boss' && task.subject){recordLearningMistake(task,task.subject);saveProgress();}
      element(`${prefix}-feedback`).textContent=state.misses>=2?`💡 ${task.hint}`:'💪 Versuch es noch einmal!';
      return;
    }
    state.locked=true;button.classList.add('correct');
    for(const other of options.children)other.disabled=true;
    if(prefix==='treasure'){
      const entry=state.entries[state.index];
      const mastered=treasureAdvance(entry,state.misses===0);
      if(mastered)element('treasure-feedback').textContent='💎 Diese Schatzkarte ist gemeistert!';
      else element('treasure-feedback').textContent=state.misses===0?
        `⭐ Gut gemacht! Nächster Übungstermin: ${entry.due}`:
        '💪 Gut verbessert! Morgen kannst du den Schatz noch einmal entdecken.';
      if(state.misses===0){progress.stars+=1;addPetXP(1);recordLearningSuccess(task,task.subject,true);}
      else recordLearningMistake(task,task.subject);
      progress.answered++;progress.todayAnswered++;
    } else element(`${prefix}-feedback`).textContent=`🌟 Richtig! ${task.explanation}`;
    saveProgress();
    miniQuestAutoHandle=setTimeout(()=>{miniQuestAutoHandle=null;if(activeMiniQuest!==state)return;state.index++;state.locked=false;nextMiniQuestTask(state,prefix)},950);
  }));
}
let activeMiniQuest=null;
let miniQuestAutoHandle=null;
function cancelMiniQuest(){
  if(miniQuestAutoHandle!==null){clearTimeout(miniQuestAutoHandle);miniQuestAutoHandle=null;}
  activeMiniQuest=null;
}
function beginExpedition(regionId){
  cancelMiniQuest();
  const region=ADVENTURE_REGIONS.find(r=>r.id===regionId);
  if(!region || recognizedInRegion(region).length<5)return;
  const ids=shuffle(recognizedInRegion(region)).slice(0,3);
  const all=FLAG_COUNTRIES.filter(c=>regionOfFlag(c.id).id===region.id);
  const tasks=ids.map(id=>{
    const c=FLAG_COUNTRIES.find(x=>x.id===id);
    const other=shuffle(all.filter(x=>x.id!==id)).slice(0,3);
    return {context:region.intro,question:'Welche Flagge passt zu diesem Ländernamen? '+c.name,
      answer:c.name,options:multipleChoice(c.name,other.map(x=>x.name)),
      optionFlags:Object.fromEntries([c,...other].filter(x=>flagAsset(x)).map(x=>[x.name,flagAsset(x)])),
      optionEmoji:Object.fromEntries([c,...other].filter(x=>!flagAsset(x)).map(x=>[x.name,flagEmoji(x)])),
      hint:'Vergleiche die vier Flaggen. Suche die passende.',explanation:`Du bist bei ${c.name} angekommen!`};
  });
  activeMiniQuest={mode:'expedition',index:0,locked:false,tasks,done(){
    const first=!progress.passport.completed.includes(region.id);
    if(first){progress.passport.completed.push(region.id);progress.stars+=3;addPetXP(3)}
    saveProgress();element('expedition-summary').textContent=first?
      '🏅 Region geschafft! +3 Sterne und +3 Haustier-XP':'🏅 Wieder sicher durch diese Region gereist!';
    element('expedition-finish').classList.remove('hidden');
    element('expedition-quiz').classList.add('hidden');
  }};
  element('expedition-name').textContent=`${region.icon} ${region.name}`;
  element('expedition-summary').textContent='';element('expedition-quiz').classList.remove('hidden');
  element('expedition-finish').classList.add('hidden');showView('expedition');nextMiniQuestTask(activeMiniQuest,'expedition');
}
function beginBossChallenge(){
  if(progress.bossTickets<1)return;
  cancelMiniQuest();
  const tasks=shuffle(SUBJECTS.map(subject=>{
    const level=progress.skills[subject].level;
    return {...shuffle(makeSubjectTasks(subject,level))[0],subject};
  }));
  activeMiniQuest={mode:'boss',index:0,locked:false,tasks,done(){
    if(progress.bossTickets<1)return;
    progress.bossTickets--;progress.bossWins++;progress.stars+=5;addPetXP(5);
    saveProgress();element('boss-summary').textContent='🏅 Boss besiegt! +5 Sterne, +5 Haustier-XP und eine neue Medaille.';
    element('boss-finish').classList.remove('hidden');element('boss-quiz').classList.add('hidden');
  }};
  element('boss-summary').textContent='';element('boss-finish').classList.add('hidden');
  element('boss-quiz').classList.remove('hidden');showView('boss');nextMiniQuestTask(activeMiniQuest,'boss');
}
function beginTreasureHunt(){
  cancelMiniQuest();
  // Nur heute faellige Karteikarten, keine bereits richtig geloesten Aufgaben.
  const entries=dueTreasureCards().filter(entry=>makeReviewTask(entry)).slice(0,5);
  if(!entries.length){element('treasure-empty').textContent='Heute gibt es keine fälligen Schatzkarten. Komm später wieder!';
    element('treasure-quiz').classList.add('hidden');showView('treasure');return;}
  const tasks=entries.map(makeReviewTask);
  activeMiniQuest={mode:'treasure',index:0,locked:false,tasks,entries,done(){
    element('treasure-quiz').classList.add('hidden');element('treasure-empty').textContent='🏆 Schatzsuche geschafft! Du hast deine schwierigen Aufgaben mutig geübt.';
  }};
  element('treasure-empty').textContent='';element('treasure-quiz').classList.remove('hidden');
  showView('treasure');nextMiniQuestTask(activeMiniQuest,'treasure');
}
function attachAdventureListeners(){
  element('choose-fox')?.addEventListener('click',()=>adoptPet('fox'));
  element('choose-dragon')?.addEventListener('click',()=>adoptPet('dragon'));
  element('boss-home-button')?.addEventListener('click',beginBossChallenge);
  element('boss-end-button')?.addEventListener('click',beginBossChallenge);
  element('treasure-start')?.addEventListener('click',beginTreasureHunt);
  for(const name of ['boss','expedition','treasure']) {
    element(`${name}-back`)?.addEventListener('click',()=>showView('home'));
    element(`${name}-home`)?.addEventListener('click',()=>showView('home'));
  }
}
