'use strict';
// Additive Lernwelten für Klasse 2 – benutzt die bisherigen Missions- und Fortschrittsfunktionen.
const SUBJECT_NAMES = {math:'Mathe',german:'Deutsch',english:'Englisch',flags:'Flaggen'};
const SUBJECT_ICONS = {math:'🔢',german:'📚',english:'🐯',flags:'🌍'};

function newSkill() {
  return {level:1,streak:0,atLevel:0,attempts:0,hints:0,misses:0,mastered:0,recent:[]};
}
function safeSkill(raw,subject) {
  const result=newSkill();
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return result;
  const max=MAX_LEVEL[subject];
  for(const key of ['streak','atLevel','attempts','hints','misses','mastered']) {
    if(Number.isSafeInteger(raw[key]) && raw[key]>=0) result[key]=Math.min(100000,raw[key]);
  }
  if(Number.isSafeInteger(raw.level)) result.level=Math.max(1,Math.min(max,raw.level));
  if(Array.isArray(raw.recent)) result.recent=raw.recent.slice(-8).filter(x=>x===0||x===1);
  return result;
}
function flagAsset(country) { return `./flags/${country.id}.svg`; }
function copyTask(task) {return {...task,options:shuffle(task.options)};}

function makeMathLevelTasksLegacy(level) {
  if(level>=7) return makeMathTasks(); // Frühere schwierige Aufgaben als Entdecker-Bonus erhalten.
  const max=[0,20,30,50,100,100,100][level];
  const a=int(2,Math.max(4,Math.floor(max*.55)));
  const b=int(1,Math.min(max-a,Math.max(4,Math.floor(max*.45))));
  const minuend=int(Math.ceil(max*.55),max);
  const sub=int(1,Math.max(2,Math.floor(minuend*.6)));
  const first=int(2,Math.max(3,Math.floor(max*.7)));
  
  const storyA=int(2,Math.max(4,Math.floor(max*.3)));
  const storyB=int(2,Math.max(4,Math.floor(max*.25)));
  const tasks=[
    {label:'Zahlen-Rakete',context:'',question:`Was ergibt ${a} + ${b}?`,answer:String(a+b),options:numericChoices(a+b,level<3?1:5),hint:'Starte bei der ersten Zahl und zähle weiter.',explanation:`${a} + ${b} = ${a+b}.`},
    {label:'Zahlen-Rakete',context:'',question:`Was ergibt ${minuend} − ${sub}?`,answer:String(minuend-sub),options:numericChoices(minuend-sub,level<3?1:5),hint:'Zähle von der größeren Zahl in kleinen Schritten zurück.',explanation:`${minuend} − ${sub} = ${minuend-sub}.`},
    {label:'Zahlendetektiv',context:'',question:`Welche Zahl kommt direkt nach ${first}?`,answer:String(first+1),options:numericChoices(first+1,1),hint:'Die gesuchte Zahl ist genau um eins größer als die erste Zahl.',explanation:`Auf ${first} folgt ${first+1}.`},
    {label:'Tiergeschichte',context:`Im Wald spielen ${storyA} Füchse. ${storyB} Füchse kommen dazu.`,question:'Wie viele Füchse spielen jetzt zusammen?',answer:String(storyA+storyB),options:numericChoices(storyA+storyB,1),hint:'Wenn Tiere dazukommen, kannst du die Zahlen addieren.',explanation:`${storyA} + ${storyB} = ${storyA+storyB} Füchse.`},
    {label:'Zehner-Zauber',context:'Zähle in Zehnerschritten.',question:`Wie viel sind ${int(2,6)} Zehner?`,answer:'',options:[],hint:'Ein Zehner ist ein Bündel aus zehn Einern.',explanation:''}
  ];
  // Die letzte Aufgabe wird separat erzeugt, damit die Zahlen in Frage und Lösung identisch sind.
  const tens=int(1,Math.min(9,Math.floor(max/10)));
  tasks[4]={label:'Zehner-Zauber',context:'Zähle die Zehner-Bündel.',question:`Wie viel sind ${tens} Zehner?`,answer:String(tens*10),options:numericChoices(tens*10,10),hint:'Ein Zehner ist ein Bündel aus zehn Einern.',explanation:`${tens} Zehner sind ${tens*10} Einer.`};
  if(level>=4) {
    const factor=shuffle([2,5,10])[0], times=int(2,level>=6?10:5), product=factor*times;
    tasks[4]={label:'Einmaleins-Start',context:`Stell dir ${times} Gruppen mit je ${factor} Sternen vor.`,question:`Wie viel ergibt ${times} × ${factor}?`,answer:String(product),options:numericChoices(product,factor),hint:`Addiere die ${factor} immer wieder.`,explanation:`${times} × ${factor} = ${product}.`};
  }
  if(level>=5) {
    const factor=shuffle([2,5,10])[0], times=int(2,10);
    tasks[2]={label:'Teilen macht Spaß',context:`${factor*times} Murmeln werden gerecht auf ${factor} Kinder verteilt.`,question:'Wie viele Murmeln bekommt jedes Kind?',answer:String(times),options:numericChoices(times,1),hint:'Überlege, welche Malaufgabe dazu passt.',explanation:`${factor*times} ÷ ${factor} = ${times}.`};
  }
  if(level>=6) {
    const a6=int(35,80), b6=int(11,Math.min(100-a6,20));
    tasks[3]={label:'Knobel-Brücke',context:'Denk an den nächsten Zehner.',question:`Was ergibt ${a6} + ${b6}?`,answer:String(a6+b6),options:numericChoices(a6+b6,5),hint:'Rechne erst bis zum nächsten Zehner und dann weiter.',explanation:`${a6} + ${b6} = ${a6+b6}.`};
  }
  return shuffle(tasks);
}
// Version 4: Mathe nach Themen und Reihen. Der alte Generator bleibt als
// makeMathLevelTasksLegacy zur Nachvollziehbarkeit vollständig erhalten.
// Die aktuellen Aufgaben verwenden die von Eltern gewünschten Grenzen.
function weightedMathRow(level) {
  const roll=Math.random();
  if(roll<0.012) return 1;
  if(roll<0.034) return 2;
  if(roll<0.084 && level>=3) return 10;
  if(roll<0.136 && level>=4) return 11;
  const weights=level<=2?[6,6,6,5,4,3,4]:[5,5,5,5,5,5,5];
  let choice=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let index=0;index<weights.length;index++) {
    choice-=weights[index];
    if(choice<0)return index+3;
  }
  return 9;
}
function mathFactor(level) {
  if(Math.random()<0.055) return 2;
  return int(3,[0,6,7,8,9,10,10,10][Math.max(1,Math.min(7,level))]);
}
function createMathSkillTask(kind,level,fixedRow=null) {
  const lv=Math.max(1,Math.min(7,level));
  let a,b,answer,label,hint,context='',reviewKey;
  if(kind==='mul'||kind==='div') {
    a=fixedRow===null?weightedMathRow(lv):fixedRow;
    if(!Number.isSafeInteger(a)||a<1||a>11)throw new Error('Ungueltige Einmaleinsreihe');
    b=mathFactor(lv); // Maximal 10, also höchstens 11 × 10 = 110.
    if(kind==='mul') {
      answer=a*b;label=`${a}er-Reihe · Mal`;
      context=`Denke an ${b} Gruppen mit jeweils ${a} Dingen.`;
      hint='Du kannst in gleich großen Schritten zählen oder an eine bekannte Malaufgabe denken.';
      reviewKey=`mul:${a}`;
    } else {
      answer=b;label=`${a}er-Reihe · Geteilt`;
      context=`${a*b} Dinge werden in Gruppen mit je ${a} Dingen aufgeteilt.`;
      hint='Welche passende Malaufgabe hilft dir beim Teilen?';
      reviewKey=`div:${a}`;
    }
  } else if(kind==='add100') {
    a=int(lv<=2?12:24,lv<=2?52:78);
    b=int(lv<=2?9:12,Math.min(100-a,lv<=2?42:59));
    answer=a+b;label='Plus bis 100';
    hint='Teile die Zahlen in Zehner und Einer. Rechne in kleinen Schritten.';
    reviewKey='add:100';
  } else if(kind==='sub100') {
    a=int(lv<=2?36:50,100);
    b=int(lv<=2?9:12,a-(lv<=2?11:8));
    answer=a-b;label='Minus bis 100';
    hint='Rechne erst die Zehner und dann die Einer zurück.';
    reviewKey='sub:100';
  } else if(kind==='hundredPlus') {
    a=100*int(1,8);
    b=100*int(1,10-a/100);
    answer=a+b;label='Hunderter-Plus';
    hint='Rechne mit den Hunderter-Zahlen wie mit kleinen Zahlen.';
    reviewKey='add:hundreds';
  } else if(kind==='hundredMinus') {
    a=100*int(3,10);
    b=100*int(1,a/100-1);
    answer=a-b;label='Hunderter-Minus';
    hint='Ziehe erst die Hunderter ab. Die Anzahl der Nullen bleibt gleich.';
    reviewKey='sub:hundreds';
  } else throw new Error('Unbekannte Matheaufgabe');
  const operation=kind==='mul'?'×':kind==='div'?'÷':kind==='add100'||kind==='hundredPlus'?'+':'−';
  const left=kind==='div'?a*b:a;
  const right=kind==='div'?a:b;
  const expression=`${left} ${operation} ${right}`;
  // Nur die Ergebniszahl ist in der Antwort enthalten, nicht der Lösungsweg.
  return {label,context,question:`Was ergibt ${expression}?`,answer:String(answer),
    options:numericChoices(answer,kind.startsWith('hundred')?100:kind==='mul'?Math.max(2,a):kind==='div'?1:5),
    hint,explanation:`${expression} = ${answer}.`,reviewKey,
    mathKind:kind,operandA:left,operandB:right,mathRow:kind==='mul'||kind==='div'?a:null};
}
function makeMathLevelTasks(level) {
  // Jede 5er-Mission deckt beide Einmaleins-Arten, Plus, Minus und Hunderter ab.
  return shuffle([
    createMathSkillTask('mul',level),
    createMathSkillTask('div',level),
    createMathSkillTask('add100',level),
    createMathSkillTask('sub100',level),
    createMathSkillTask(Math.random()<0.5?'hundredPlus':'hundredMinus',level)
  ]);
}
function makeGermanLevelTasks(level) {
  if(level>=5) {
    const originals=makeGermanTasks().filter(q=>q.label!=='Lesedetektive');
    return shuffle([...shuffle(GERMAN_BONUS).slice(0,2).map(copyTask),...originals]);
  }
  if(level>=4) return makeGermanTasks(); // Ursprüngliche Texte und Wortarten bleiben erreichbar.
  const pool=GERMAN_EASY.filter(q=>q.level<=level);
  const reading=shuffle(pool.filter(q=>q.label==='Lesespaß')).slice(0,2);
  const other=shuffle(pool.filter(q=>q.label!=='Lesespaß')).slice(0,3);
  return shuffle([...reading,...other]).map(copyTask);
}
function makeEnglishTasks(level) {
  const pool=ENGLISH_WORDS.filter(x=>x.from<=level);
  const fresh=shuffle(pool.filter(x=>x.from===level));
  const review=shuffle(pool.filter(x=>x.from<level));
  const selected=(level===1?fresh:[...fresh.slice(0,3),...review.slice(0,2)]);
  const chosen=shuffle([...selected,...shuffle(pool)]).filter((x,i,arr)=>arr.findIndex(y=>x.en===y.en)===i).slice(0,5);
  return chosen.map((word,i)=>{
    const fromSame=shuffle(ENGLISH_WORDS.filter(x=>x.group===word.group && x.en!==word.en));
    const picture=i%2===0 && word.group!=='phrases';
    const alternatives=fromSame.slice(0,3);
    if(picture) {
      return {label:'Wörter-Safari',context:'Schau auf das Bild und suche das englische Wort.',visualEmoji:word.emoji,
        question:word.group==='animals'?'Wie heißt dieses Tier auf Englisch?':word.group==='colors'?'Wie heißt diese Farbe auf Englisch?':'Wie heißt das auf Englisch?',
        answer:word.en,options:multipleChoice(word.en,alternatives.map(x=>x.en)),
        hint:'Sieh dir das Bild in Ruhe an und denke an Wörter, die du schon gehört hast.',
        explanation:`${word.emoji} ${word.de} heißt auf Englisch „${word.en}“.`,postAnswerSpeak:word.en};
    }
    return {label:'Englisch-Detektive',context:'Höre dir das englische Wort mit dem Lautsprecher an.',
      question:`Was bedeutet „${word.en}“ auf Deutsch?`,answer:word.de,
      options:multipleChoice(word.de,alternatives.map(x=>x.de)),
      hint:'Tippe auf „Wort hören“ und lausche der Aussprache.',
      explanation:`„${word.en}“ bedeutet „${word.de}“.`,speakText:word.en,speechLang:'en-GB',postAnswerSpeak:word.en};
  });
}
function makeFlagTasks(level) {
  const pool=FLAG_COUNTRIES.filter(x=>x.from<=level);
  const fresh=shuffle(pool.filter(x=>x.from===level));
  const review=shuffle(pool.filter(x=>x.from<level));
  const chosen=shuffle(level===1?fresh:[...fresh.slice(0,3),...review.slice(0,5),...fresh.slice(3)]).slice(0,5);
  return chosen.map((country,i)=>{
    const others=shuffle(pool.filter(x=>x.name!==country.name)).slice(0,3);
    const choices=multipleChoice(country.name,others.map(x=>x.name));
    const reverse=level>=4 && i%2===0;
    return {label:reverse?'Flaggen-Finder':'Flaggen-Detektiv',context:'Erkennst du die Länder an ihren Flaggen?',
      visualFlag:reverse?null:flagAsset(country),optionFlags:reverse?Object.fromEntries([country,...others].map(x=>[x.name,flagAsset(x)])):null,
      question:reverse?`Welche Flagge gehört zu ${country.name}?`:'Zu welchem Land gehört diese Flagge?',answer:country.name,
      options:choices,hint:'Achte auf Farben, Streifen und die Richtung der Streifen.',explanation:`Das ist die Flagge von ${country.name}.`};
  });
}
function makeSubjectTasks(subject,level) {
  if(subject==='math') return makeMathLevelTasks(level);
  if(subject==='german') return makeGermanLevelTasks(level);
  if(subject==='english') return makeEnglishTasks(level);
  if(subject==='flags') return makeFlagTasks(level);
  throw new Error('Unbekannte Lernwelt');
}
function updateSkill(subject,misses,hintUsed) {
  const skill=progress.skills[subject];
  const perfect=misses===0 && !hintUsed;
  skill.atLevel++;skill.attempts++;skill.misses+=misses;
  if(hintUsed) skill.hints++;
  if(perfect) skill.mastered++;
  skill.streak=perfect?skill.streak+1:0;
  skill.recent.push(perfect?1:0);
  skill.recent=skill.recent.slice(-8);
  const lastSix=skill.recent.slice(-6);
  if(skill.streak>=4 && skill.atLevel>=4 && skill.level<MAX_LEVEL[subject]) {
    skill.level++;skill.streak=0;skill.atLevel=0;skill.recent=[];
    return 'up';
  }
  if(lastSix.length===6 && lastSix.reduce((a,b)=>a+b,0)<=1 && skill.atLevel>=6 && skill.level>1) {
    skill.level--;skill.streak=0;skill.atLevel=0;skill.recent=[];
    return 'down';
  }
  return null;
}
function refreshFutureTasks() {
  if(!session) return;
  const remaining=TASKS_PER_MISSION-session.index-1;
  if(remaining>0) session.tasks.splice(session.index+1,remaining,
    ...makeSubjectTasks(session.subject,progress.skills[session.subject].level).slice(0,remaining));
}
function renderSkillProgress() {
  for(const subject of SUBJECTS) {
    const skill=progress.skills[subject];
    const levelEl=document.getElementById(`level-${subject}`);
    if(levelEl) levelEl.textContent=`Stufe ${skill.level} von ${MAX_LEVEL[subject]}`;
    const fill=document.getElementById(`level-fill-${subject}`);
    if(fill) fill.style.width=`${Math.min(100,100*skill.streak/4)}%`;
    const stat=document.getElementById(`skill-${subject}`);
    if(stat) stat.textContent=`Stufe ${skill.level} · ${skill.mastered} selbstständig gelöst`;
  }
  const memoryEl=document.getElementById('stat-memory');
  if(memoryEl) memoryEl.textContent=progress.memoryWins;
}

let memoryGame=null;
function startMemoryGame() {
  const level=progress.skills.flags.level;
  const pairCount=level>=3?6:4;
  const pool=FLAG_COUNTRIES.filter(x=>x.from<=level);
  const countries=shuffle(pool).slice(0,pairCount);
  const cards=shuffle(countries.flatMap(country=>[
    {id:country.id,type:'flag',country}, {id:country.id,type:'name',country}
  ]));
  memoryGame={cards,revealed:[],matched:new Set(),locked:false,mistakes:0,earned:false};
  element('memory-info').textContent=`Finde ${pairCount} passende Paare aus Flagge und Land.`;
  element('memory-result').textContent='';
  element('memory-next').classList.add('hidden');
  element('memory-fill').style.width='0%';
  const board=element('memory-board');board.replaceChildren();
  cards.forEach((card,index)=>{
    const tile=document.createElement('button');tile.type='button';tile.className='memory-tile';
    tile.setAttribute('aria-label',`Verdeckte Karte ${index+1}`);
    tile.textContent='❔';tile.addEventListener('click',()=>pickMemoryCard(index));
    board.append(tile);
  });
  showView('memory');
}
function memoryFace(index,visible) {
  if(!memoryGame) return;
  const tile=element('memory-board').children[index], card=memoryGame.cards[index];
  tile.replaceChildren();tile.classList.toggle('revealed',visible);
  if(!visible){tile.textContent='❔';tile.setAttribute('aria-label',`Verdeckte Karte ${index+1}`);return;}
  if(card.type==='flag') {
    const image=document.createElement('img');image.src=flagAsset(card.country);
    image.alt=`Flagge von ${card.country.name}`;image.className='memory-flag';tile.append(image);
  } else {const text=document.createElement('strong');text.textContent=card.country.name;tile.append(text);}
  tile.setAttribute('aria-label',card.type==='flag'?`Flagge von ${card.country.name}`:card.country.name);
}
function pickMemoryCard(index) {
  const game=memoryGame;
  if(!game || game.locked || game.matched.has(index)||game.revealed.includes(index)) return;
  game.revealed.push(index);memoryFace(index,true);
  if(game.revealed.length!==2)return;
  const [a,b]=game.revealed;const first=game.cards[a],second=game.cards[b];
  if(first.id===second.id && first.type!==second.type) {
    game.matched.add(a);game.matched.add(b);game.revealed=[];
    element('memory-board').children[a].classList.add('matched');
    element('memory-board').children[b].classList.add('matched');
    const pairCount=game.cards.length/2;
    const found=game.matched.size/2;
    element('memory-info').textContent=`🎉 ${found} von ${pairCount} Paaren gefunden!`;
    element('memory-fill').style.width=`${100*found/pairCount}%`;
    if(found===pairCount && !game.earned) {
      game.earned=true;
      progress.stars+=3;progress.sessions++;progress.memoryWins++;
      progress.answered+=pairCount;progress.todayAnswered+=pairCount;
      saveProgress();
      element('memory-result').textContent='Großartig! Alle Flaggen gefunden. ⭐ +3 Sterne';
      element('memory-next').classList.remove('hidden');
    }
  } else {
    game.mistakes++;game.locked=true;
    element('memory-info').textContent='Schau genau: Welche Flagge gehört zu welchem Namen?';
    setTimeout(()=>{
      if(memoryGame!==game) return;
      for(const id of [a,b]) memoryFace(id,false);
      game.revealed=[];game.locked=false;
    },1000);
  }
}
