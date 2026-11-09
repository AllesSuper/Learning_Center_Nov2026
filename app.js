'use strict';

// Lernabenteuer v1 – bewusst ohne externe Bibliotheken oder API-Aufrufe.
// Kinderbezogene Daten bleiben ausschließlich im lokalen Browser.
const STORAGE_KEY = 'lernabenteuer-progress-v1';
const DAILY_TARGET = 5;
const TASKS_PER_MISSION = 5;
const SUBJECTS = ['math','german','english','flags'];
const MAX_LEVEL = {math:7,german:5,english:4,flags:4};

function todayLocal() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
function emptyProgress() {
  return { stars: 0, answered: 0, sessions: 0, day: todayLocal(), todayAnswered: 0, lastSubject: 'german', memoryWins: 0, reviewBank: [], timeBank: 0, timeStreak: 0, timersEnabled: true, skills: Object.fromEntries(SUBJECTS.map(subject=>[subject,newSkill()])), passport:{seen:[],completed:[]},pet:{type:null,xp:0},bossTickets:0,bossWins:0,treasureCards:[] };
}
function loadProgress() {
  const defaults = emptyProgress();
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const safe = {...defaults};
    for (const key of ['stars','answered','sessions','todayAnswered','timeBank','timeStreak']) {
      if (Number.isSafeInteger(p[key]) && p[key] >= 0) safe[key] = p[key];
    }
    if (p.day === defaults.day) safe.day = p.day;
    else safe.todayAnswered = 0;
    if (SUBJECTS.includes(p.lastSubject)) safe.lastSubject = p.lastSubject;
    safe.timeStreak=Math.min(2,safe.timeStreak);
    safe.timeBank=Math.min(100000,safe.timeBank);
    if (p.timersEnabled===false) safe.timersEnabled=false;
    if(Number.isSafeInteger(p.memoryWins) && p.memoryWins >= 0) safe.memoryWins = p.memoryWins;
    safe.reviewBank=safeReviewBank(p.reviewBank);
    for(const subject of SUBJECTS) safe.skills[subject]=safeSkill(p.skills?.[subject],subject);
    if(typeof safeAdventureState==='function')safeAdventureState(safe,p);
    return safe;
  } catch (_) { return defaults; }
}
let progress = loadProgress();
let session = null;

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* private mode: session-only */ }
  renderProgress();
}
function element(id) { return document.getElementById(id); }
function shuffle(items) {
  const arr = [...items];
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function int(min,max) { return min + Math.floor(Math.random()*(max-min+1)); }

function multipleChoice(answer, alternatives) {
  const values = [answer, ...alternatives.filter(x => x !== answer)];
  const unique = [...new Set(values.map(String))];
  if (unique.length < 4) throw new Error('Zu wenige Antwortmöglichkeiten');
  return shuffle(unique.slice(0,4));
}
function numericChoices(answer, step=1) {
  const deltas = shuffle([step,-step,step*2,-step*2,step*3,-step*3,step*4,-step*4,5,-5,10,-10,1,-1]);
  const options = [answer];
  for(const delta of deltas) {
    const candidate = answer+delta;
    if(candidate >= 0 && !options.includes(candidate)) options.push(candidate);
    if(options.length === 4) break;
  }
  return shuffle(options.map(String));
}
function makeMathTasks() {
  const a = int(80,480), b=int(35,390);
  const x=int(180,900), y=int(30,x-15);
  const f=int(2,10), g=int(2,10);
  const divisor=int(2,10), quotient=int(3,10);
  const books=int(3,8), boxes=int(3,9);
  const tasks=[
    {label:'Plus-Rechnen',context:'',question:`Wie viel ist ${a} + ${b}?`,answer:String(a+b),options:numericChoices(a+b,10),hint:'Addiere zuerst die Hunderter, dann Zehner und Einer.',explanation:`${a} + ${b} = ${a+b}. Gut gerechnet!`},
    {label:'Minus-Rechnen',context:'',question:`Wie viel ist ${x} − ${y}?`,answer:String(x-y),options:numericChoices(x-y,10),hint:'Du kannst die Zahl in Hunderter, Zehner und Einer zerlegen.',explanation:`${x} − ${y} = ${x-y}. Klasse!`},
    {label:'Einmaleins',context:'',question:`Wie viel ist ${f} × ${g}?`,answer:String(f*g),options:numericChoices(f*g,Math.max(2,f)),hint:`Zähle ${g} Mal die Zahl ${f}.`,explanation:`${f} × ${g} = ${f*g}. Weiter so!`},
    {label:'Geteilt-Rechnen',context:'',question:`Wie viel ist ${divisor*quotient} ÷ ${divisor}?`,answer:String(quotient),options:numericChoices(quotient,1),hint:`Welche Zahl mal ${divisor} ergibt ${divisor*quotient}?`,explanation:`${divisor*quotient} ÷ ${divisor} = ${quotient}. Richtig!`},
    {label:'Knobelgeschichte',context:`In einer Bücherkiste liegen ${boxes} Stapel. In jedem Stapel sind ${books} Bücher.`,question:'Wie viele Bücher sind das insgesamt?',answer:String(books*boxes),options:numericChoices(books*boxes,boxes),hint:`Rechne ${boxes} × ${books}.`,explanation:`${boxes} × ${books} = ${books*boxes} Bücher. Super gelöst!`}
  ];
  return shuffle(tasks);
}

const germanBank = [
 {label:'Lesedetektive',context:'Mira entdeckt am Bach einen kleinen Frosch. Er sitzt auf einem warmen Stein. Als ein Schmetterling vorbeifliegt, springt der Frosch ins Wasser.',question:'Wo saß der Frosch zuerst?',answer:'Auf einem Stein',options:['Auf einem Stein','Unter einem Baum','Auf einer Blume','In einer Höhle'],hint:'Lies den zweiten Satz noch einmal.',explanation:'Im zweiten Satz steht, dass der Frosch auf einem warmen Stein sitzt.'},
 {label:'Lesedetektive',context:'Tariq möchte für seine Oma einen Kuchen backen. Zuerst holt er Mehl und Eier aus der Küche. Dann rührt er den Teig. Am Ende stellt er den Kuchen in den Ofen.',question:'Was macht Tariq direkt vor dem Backen?',answer:'Er rührt den Teig.',options:['Er rührt den Teig.','Er isst ein Stück Kuchen.','Er deckt den Tisch.','Er gießt Blumen.'],hint:'Achte auf das Wort „Dann“ in der Geschichte.',explanation:'Vor dem Ofen rührt Tariq den Teig.'},
 {label:'Wortarten',context:'Nomen bezeichnen zum Beispiel Dinge, Menschen, Tiere oder Gefühle.',question:'Welches Wort ist ein Nomen?',answer:'Abenteuer',options:['Abenteuer','laufen','mutig','schnell'],hint:'Welches Wort kannst du mit „das“ benutzen?',explanation:'„Das Abenteuer“ ist ein Nomen und wird großgeschrieben.'},
 {label:'Wortarten',context:'Verben sagen dir, was jemand tut oder was geschieht.',question:'Welches Wort ist ein Verb?',answer:'springen',options:['springen','der Ball','fröhlich','die Sonne'],hint:'Was kann man tun?',explanation:'„Springen“ bezeichnet eine Tätigkeit und ist ein Verb.'},
 {label:'Wortarten',context:'Adjektive beschreiben, wie etwas ist.',question:'Welches Wort ist ein Adjektiv?',answer:'leuchtend',options:['leuchtend','der Stern','fliegen','der Himmel'],hint:'Wie könnte ein Stern aussehen?',explanation:'„Leuchtend“ beschreibt eine Eigenschaft.'},
 {label:'Satzzeichen',context:'Eine Frage endet mit einem besonderen Zeichen.',question:'Welcher Satz ist richtig geschrieben?',answer:'Wo ist mein Buch?',options:['Wo ist mein Buch?','Wo ist mein Buch.','Wo ist mein Buch!','Wo ist mein Buch,'],hint:'Welches Satzzeichen steht am Ende einer Frage?',explanation:'Eine Frage endet mit einem Fragezeichen.'},
 {label:'Rechtschreibung',context:'Am Satzanfang schreibt man das erste Wort groß.',question:'Welcher Satz ist richtig?',answer:'Heute spielen wir draußen.',options:['Heute spielen wir draußen.','heute spielen wir draußen.','Heute Spielen Wir Draußen.','Heute spielen wir Draußen.'],hint:'Den Satzanfang schreiben wir groß. „draußen“ bleibt klein.',explanation:'„Heute“ ist am Satzanfang groß, die übrigen Wörter stehen hier klein.'},
 {label:'Sinnverstehen',context:'Lina zieht ihre Regenjacke an. Draußen hängen dunkle Wolken am Himmel und der Wind pfeift.',question:'Welches Wetter erwartet Lina vermutlich?',answer:'Regen und Wind',options:['Regen und Wind','Sonnenschein','Schnee und Frost','Große Hitze'],hint:'Denke an die Jacke und die Wolken.',explanation:'Regenjacke, dunkle Wolken und Wind lassen Regen und Wind vermuten.'},
 {label:'Wörter entdecken',context:'Manche Wörter haben eine ähnliche Bedeutung.',question:'Welches Wort bedeutet ungefähr dasselbe wie „fröhlich“?',answer:'glücklich',options:['glücklich','traurig','müde','langsam'],hint:'Wie fühlst du dich, wenn du dich freust?',explanation:'„Fröhlich“ und „glücklich“ haben eine ähnliche Bedeutung.'},
 {label:'Wörter entdecken',context:'Das Gegenteil beschreibt einen starken Unterschied.',question:'Was ist das Gegenteil von „leise“?',answer:'laut',options:['laut','ruhig','sanft','still'],hint:'Denke an einen lauten Trommelschlag.',explanation:'Das Gegenteil von „leise“ ist „laut“.'}
];
function makeGermanTasks() {
  // Jede Mission enthält mindestens zwei kurze Lesetexte.
  const reading = germanBank.filter(q => q.label === 'Lesedetektive');
  const other = shuffle(germanBank.filter(q => q.label !== 'Lesedetektive')).slice(0,3);
  return shuffle([...reading,...other]).map(q => ({...q,options:shuffle(q.options)}));
}
function renderProgress() {
  if(progress.day !== todayLocal()) {progress.day=todayLocal();progress.todayAnswered=0;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch(_) {}}
  element('stars-header').textContent=progress.stars;
  element('goal-label').textContent=`${Math.min(progress.todayAnswered,DAILY_TARGET)} / ${DAILY_TARGET}`;
  element('goal-fill').style.width=`${Math.min(100,progress.todayAnswered/DAILY_TARGET*100)}%`;
  element('stat-stars').textContent=progress.stars;
  element('stat-answered').textContent=progress.answered;
  element('stat-sessions').textContent=progress.sessions;
  const reviewStat=element('stat-reviews');
  if(reviewStat) reviewStat.textContent=progress.reviewBank.length;
  renderSkillProgress();
  renderReviewList();
  updateTimeControls();
  if(typeof renderAdventureProgress==='function')renderAdventureProgress();
}
function showView(name) {
  if(typeof activeMiniQuest!=='undefined' && activeMiniQuest && activeMiniQuest.mode!==name && typeof cancelMiniQuest==='function')cancelMiniQuest();
  if(name!=='play'){stopQuestionTimer();cancelAutoAdvance();}
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
  ['home','play','end','progress','memory','expedition','boss','treasure'].forEach(view=>element(`view-${view}`).classList.toggle('hidden',view!==name));
  document.querySelectorAll('.nav-button').forEach(btn=>{
    const active = btn.dataset.view === name || (name === 'play' && session && btn.dataset.view === session.subject);
    btn.classList.toggle('active',active);
    if(active) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
  });
  window.scrollTo({top:0,behavior:'instant'});
}
function startSession(subject) {
  session = {subject,tasks:markTimedTasks(makeSubjectTasks(subject,progress.skills[subject].level),subject),index:0,misses:0,earned:0,answeredThisTask:false,hintUsed:false,levelChange:null};
  progress.lastSubject=subject;saveProgress();
  showView('play');renderTask();
}
function renderTask() {
  cancelAutoAdvance();stopQuestionTimer();
  const task=session.tasks[session.index];
  const realSubject=task.subject || session.subject;
  const isMixed=session.mode==='mixed';
  session.misses=0;session.answeredThisTask=false;session.hintUsed=false;
  element('mission-count').textContent=isMixed
    ? `Aufgabe ${session.index+1} von ${MIXED_LENGTH} · ${mixedSolvedCount(session)} geschafft`
    : `Aufgabe ${session.index+1} von ${TASKS_PER_MISSION}`;
  element('mission-fill').style.width=isMixed
    ? `${mixedSolvedCount(session)/MIXED_LENGTH*100}%`
    : `${session.index/TASKS_PER_MISSION*100}%`;
  element('mission-kind').textContent=isMixed
    ? `🎲 LERNMIX · ${SUBJECT_ICONS[realSubject]} ${SUBJECT_NAMES[realSubject].toUpperCase()}`
    : `${SUBJECT_ICONS[session.subject]} ${SUBJECT_NAMES[session.subject].toUpperCase()}-MISSION`;
  element('mission-title').textContent=task.label;
  element('mission-question').textContent=task.question;
  element('mission-context').textContent=task.context;
  element('mission-context').classList.toggle('hidden',!task.context);
  element('current-level').textContent=`Stufe ${progress.skills[realSubject].level} · ${SUBJECT_NAMES[realSubject]}`;
  const mixedNote=element('mixed-note');
  if(mixedNote) {
    mixedNote.classList.toggle('hidden',!isMixed);
    if(isMixed) mixedNote.textContent=`🎯 20 Aufgaben aus 4 Welten · ${session.rewinds} Rücksprünge · Schon richtig gelöste Fragen werden durch neue ersetzt.`;
  }
  element('level-up-notice').classList.add('hidden');
  element('celebration').classList.add('hidden');
  element('read-button').textContent=task.speakText?'🔊 Wort hören':'🔊 Vorlesen';
  const visual=element('question-visual');visual.replaceChildren();
  if(task.visualFlag) {
    const picture=document.createElement('img');picture.src=task.visualFlag;
    picture.alt='Errate das Land dieser Flagge';picture.className='big-flag';
    picture.addEventListener('error',()=>{
      picture.classList.add('hidden');
      const warning=document.createElement('span');
      warning.textContent='⚠️ Flaggenbild fehlt – bitte die Webseite aktualisieren.';
      warning.className='flag-image-warning';visual.append(warning);
    });
    visual.append(picture);
  } else if(task.visualEmoji) {
    const symbol=document.createElement('span');symbol.className=task.subject==='flags'?'big-emoji big-flag-emoji':'big-emoji';symbol.textContent=task.visualEmoji;visual.append(symbol);
  }
  visual.classList.toggle('hidden',!task.visualFlag&&!task.visualEmoji);
  element('hint-text').textContent=`💡 ${task.hint}`;
  element('hint-text').classList.add('hidden');
  element('answer-feedback').className='feedback hidden';
  element('answer-feedback').textContent='';
  element('next-button').classList.add('hidden');
  const optionContainer=element('answer-options');
  optionContainer.replaceChildren();
  for (const choice of task.options) {
    const btn=document.createElement('button');
    btn.type='button';btn.className='answer-option';
    if(task.optionFlags?.[choice]){
      const picture=document.createElement('img');picture.src=task.optionFlags[choice];
      picture.alt=`Flagge von ${choice}`;picture.className='option-flag';
      picture.addEventListener('error',()=>{
        picture.classList.add('hidden');
        const warning=document.createElement('span');warning.className='flag-image-warning';
        warning.textContent='⚠️ Bild fehlt';btn.append(warning);
      });
      const caption=document.createElement('span');caption.textContent=choice;caption.className='sr-only';
      btn.append(picture,caption);btn.setAttribute('aria-label',`Flagge von ${choice}`);
    } else if(task.optionEmoji?.[choice]){
      const symbol=document.createElement('span');symbol.className='option-flag-emoji';symbol.textContent=task.optionEmoji[choice];
      btn.append(symbol);btn.setAttribute('aria-label',`Flagge von ${choice}`);
    } else btn.textContent=choice;
    btn.addEventListener('click',()=>selectAnswer(btn,choice));
    optionContainer.appendChild(btn);
  }
  startQuestionTimer(task);
}
function selectAnswer(button,choice) {
  if(!session || session.answeredThisTask) return;
  const task=session.tasks[session.index];
  const feedback=element('answer-feedback');
  feedback.classList.remove('hidden','good','try');
  if(session.mode==='mixed') {
    if(choice===task.answer) mixedCorrectAnswer(button,task,feedback);
    else mixedWrongAnswer(button,task,feedback);
    return;
  }
  if(choice===task.answer) {
    stopQuestionTimer();registerCorrectAnswer();
    button.classList.add('correct');
    session.answeredThisTask=true;
    const earned=session.misses===0&&!session.hintUsed?2:1;
    session.earned+=earned;
    progress.stars+=earned;progress.answered++;progress.todayAnswered++;
    if(typeof rewardLearningWin==='function')rewardLearningWin(task,session.subject,true);
    const change=updateSkill(session.subject,session.misses,session.hintUsed);
    recordLearningSuccess(task,session.subject,session.misses===0&&!session.hintUsed);
    if(change) {
      session.levelChange=change;refreshFutureTasks();
      const notice=element('level-up-notice');
      notice.textContent=change==='up'?'🌟 Super! Neue Lernstufe freigeschaltet!':'💪 Wir üben noch ein bisschen zusammen.';
      notice.classList.remove('hidden');
    }
    element('celebration').classList.remove('hidden');
    saveProgress();
    feedback.classList.add('good');
    feedback.textContent=`🎉 Richtig! ${task.explanation} +${earned} ${earned===1?'Stern':'Sterne'}`;
    for(const option of element('answer-options').children) option.disabled=true;
    element('next-button').textContent=session.index===TASKS_PER_MISSION-1?'Mission abschließen 🎉':'Weiter zur nächsten Aufgabe →';
    element('next-button').classList.add('hidden');
    scheduleAutoAdvance();
    element('mission-fill').style.width=`${(session.index+1)/TASKS_PER_MISSION*100}%`;
  } else {
    stopQuestionTimer();registerWrongAnswer();
    button.classList.add('incorrect');button.disabled=true;
    session.misses++;
    if(session.misses===1) { recordLearningMistake(task,session.subject);saveProgress(); }
    feedback.classList.add('try');
    feedback.textContent=session.misses===1?'Fast! Probier es noch einmal. Du schaffst das!':'Guter Versuch! Schau dir den Tipp an und probiere es erneut.';
    if(session.misses>=2) {element('hint-text').classList.remove('hidden');session.hintUsed=true;}
  }
}
function completeSession() {
  if(!session || session.completed)return;
  session.completed=true; // Genau eine Abschlusswertung und Boss-Einladung pro Runde.
  if(session?.mode==='mixed') {
    progress.sessions++;
    if(typeof completeMixedAdventure==='function')completeMixedAdventure();
    saveProgress();
    element('end-copy').textContent=`🎲 Du hast alle 20 Aufgaben aus Mathe, Deutsch, Englisch und Flaggen geschafft! ${session.rewinds} Rücksprünge haben dir beim Üben geholfen. ${progress.reviewBank.length} Themen sind noch für spätere Wiederholungen vorgemerkt.`;
    element('end-stars').textContent=`⭐ +${session.earned} Sterne`;
    showView('end');return;
  }
  progress.sessions++;saveProgress();
  element('end-copy').textContent=`Du hast ${TASKS_PER_MISSION} Aufgaben geschafft! In ${SUBJECT_NAMES[session.subject]} bist du auf Stufe ${progress.skills[session.subject].level}. Auf zur nächsten Entdeckungsreise!`;
  element('end-stars').textContent=`⭐ +${session.earned} Sterne`;
  showView('end');
}
function speakQuestion() {
  if(!('speechSynthesis' in window)) {
    const feedback=element('answer-feedback');feedback.textContent='Die Vorlesefunktion wird von diesem Browser nicht unterstützt.';feedback.className='feedback try';return;
  }
  const task=session.tasks[session.index];
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(task.speakText || `${task.context || ''}. ${task.question}`);
  utterance.lang=task.speechLang||'de-DE';utterance.rate=.85;utterance.pitch=1;
  window.speechSynthesis.speak(utterance);
}
function resetProgress() {
  if(window.confirm('Wirklich alle Sterne und Erfolge auf diesem Gerät löschen?')) {
    progress=emptyProgress();saveProgress();showView('progress');
  }
}

document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{
  if(SUBJECTS.includes(btn.dataset.view)) startSession(btn.dataset.view);
  else if(btn.dataset.view==='memory') startMemoryGame();
  else if(btn.dataset.view==='mixed') beginMixedSession();
  else showView(btn.dataset.view);
}));
element('quick-start').addEventListener('click',beginMixedSession); // Standard: 20er-Lernmix.
element('mixed-start').addEventListener('click',beginMixedSession);
element('back-button').addEventListener('click',()=>showView('home'));
element('hint-button').addEventListener('click',()=>{
  if(session && !session.answeredThisTask) {
    session.hintUsed=true;
    if(session.mode==='mixed') session.hadHint[session.index]=true;
  }
  element('hint-text').classList.remove('hidden');
});
element('read-button').addEventListener('click',speakQuestion);
element('time-button').addEventListener('click',spendTimeBonus);
element('timer-toggle').addEventListener('change',event=>{progress.timersEnabled=event.target.checked;saveProgress();});
element('next-button').addEventListener('click',()=>{
  if(!session || !session.answeredThisTask) return;
  if(session.mode==='mixed') { advanceMixedSession();return; }
  session.index++;
  if(session.index>=TASKS_PER_MISSION) completeSession();else renderTask();
});
element('repeat-button').addEventListener('click',()=>session?.mode==='mixed'?beginMixedSession():startSession(session.subject));
element('home-button').addEventListener('click',()=>showView('home'));
element('reset-progress').addEventListener('click',resetProgress);
element('memory-back').addEventListener('click',()=>showView('home'));
element('memory-next').addEventListener('click',startMemoryGame);
if(typeof attachAdventureListeners==='function')attachAdventureListeners();
// Die App startet standardmäßig direkt mit dem Lernmix; die anderen Lernwelten bleiben über die Navigation erreichbar.
renderProgress();beginMixedSession();
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
