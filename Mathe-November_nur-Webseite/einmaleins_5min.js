'use strict';
// Eigenständiger, komplett lokaler Einmaleins-Lernflug: 20 Richtige ohne Zeitdruck.
// Dieses Modul erweitert die bestehende App, ohne Fach-/Lernmix-Logik zu ersetzen.
const TIMES_STORAGE = 'mathe-november-sternenflug-v1';
const TIMES_BASE_QUESTIONS = 20; // Ziel sind genau 20 richtig gelöste Aufgaben, ohne Frist.
const TIMES_ROWS = [3,4,5,6,7,8,9,10,11];
let timesRow = 'all';
let timesMode = 'both';
let timesSoundOn = false;
let timesGame = null;
let timesLastBest = null;

function timesEl(id) { return document.getElementById(id); }
function timesShuffle(items) {
  const arr = [...items];
  for(let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function timesReadStats() {
  try {
    const p=JSON.parse(localStorage.getItem(TIMES_STORAGE)||'{}');
    if(!p || typeof p!=='object' || Array.isArray(p))return {rounds:0,bests:{},facts:{}};
    return {
      rounds:Number.isSafeInteger(p.rounds)?Math.min(9999,Math.max(0,p.rounds)):0,
      bests:p.bests && typeof p.bests==='object' && !Array.isArray(p.bests)?p.bests:{},
      facts:p.facts && typeof p.facts==='object' && !Array.isArray(p.facts)?p.facts:{}
    };
  } catch(_) { return {rounds:0,bests:{},facts:{}}; }
}
function timesWriteStats(p) {
  try{localStorage.setItem(TIMES_STORAGE,JSON.stringify(p));}catch(_) { /* privater Modus */ }
}
function timesClearProgress() {
  try{localStorage.removeItem(TIMES_STORAGE);}catch(_){}
  timesLastBest=null;
  timesUpdateBest();
}
function timesBestKey() {return `${timesRow}:${timesMode}`;}
function timesUpdateBest() {
  const data=timesReadStats();
  const best=data.bests[timesBestKey()];
  const el=timesEl('times-personal-best');
  if(el)el.textContent=best && Number.isInteger(best.correct)
    ? `🏆 Bisherige Bestleistung: ${best.correct} richtig · ${best.accuracy}%`
    : '🌟 Dein erster Rekord wartet!';
}
function timesSelectRow(value) {
  timesRow=value;
  for(const b of timesEl('times-rows').querySelectorAll('button')) {
    const active=b.dataset.timesRow===value;
    b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));
  }
  timesUpdateBest();
}
function timesSelectMode(value) {
  timesMode=value;
  for(const b of timesEl('times-modes').querySelectorAll('button')) {
    const active=b.dataset.timesMode===value;
    b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));
  }
  timesUpdateBest();
}
function timesBuildDeck(rowSelection,mode,stats=timesReadStats()) {
  const rows=rowSelection==='all'?TIMES_ROWS:[Number(rowSelection)];
  if(rows.some(row=>!TIMES_ROWS.includes(row)) || !['both','mul','div'].includes(mode))throw Error('Ungültige Übungsauswahl');
  // Jede gewählte Reihe wird bei „Mix“ mindestens einmal für Mal und Geteilt gezeigt.
  const pairTypes=timesShuffle(rows.flatMap(row=>(mode==='both'?['mul','div']:[mode]).map(op=>({row,op}))));
  const factPacks=new Map();
  const deck=[];
  for(let i=0;i<TIMES_BASE_QUESTIONS;i++) {
    const pair=pairTypes[i%pairTypes.length];
    const id=`${pair.row}:${pair.op}`;
    if(!factPacks.has(id))factPacks.set(id,timesShuffle([1,2,3,4,5,6,7,8,9,10]));
    let factors=factPacks.get(id);
    if(!factors.length) {factors=timesShuffle([1,2,3,4,5,6,7,8,9,10]);factPacks.set(id,factors);}
    const factor=factors.pop();
    const key=`${pair.op}:${pair.row}:${factor}`;
    const difficulty=stats.facts[key]?.errors||0;
    deck.push({...pair,factor,key,revision:0,difficulty});
  }
  // Schwierige Fakten früher wiedersehen; nur leicht gewichtet, Reihen bleiben vielfältig.
  const shuffled=timesShuffle(deck);
  for(let i=0;i<shuffled.length-3;i++) {
    if(shuffled[i].difficulty>0 && i>2) {
      const target=Math.max(0,i-2);[shuffled[i],shuffled[target]]=[shuffled[target],shuffled[i]];
    }
  }
  return shuffled;
}
function timesMakeQuestion(task) {
  const {row,factor,op,revision}=task;
  if(!TIMES_ROWS.includes(row) || !Number.isInteger(factor)||factor<1||factor>10)throw Error('Ungültiger Einmaleinsfakt');
  const product=row*factor;
  let question='',context='',answer,explanation,hint,kind='';
  const story=(revision===0 && Math.random()<0.22);
  if(op==='mul') {
    answer=product;
    if(story) {
      context=`🪐 Auf ${factor} Planeten leuchten jeweils ${row} Sterne.`;
      question='Wie viele Sterne leuchten insgesamt?'; kind='🌟 Planetenrätsel';
    } else {
      question=`${row} × ${factor} = ?`;kind='✖️ Mal-Aufgabe';
    }
    explanation=`${row} × ${factor} = ${product}`;
    hint=`Zähle ${factor} Mal in ${row}er-Schritten: ${Array.from({length:Math.min(factor,6)},(_,i)=>row*(i+1)).join(' · ')}${factor>6?' · …':''}`;
  } else if(op==='div') {
    // Beide Richtungen bleiben fuer die Reihen 3 bis 10 erlaubt.
    // Bei der 11er-Reihe wird ausschliesslich durch 1 bis 10 geteilt.
    const divisor=(row===11 || factor===10 || ((factor!==1 && revision%2===0) && Math.random()<0.45))?factor:row;
    answer=product/divisor;
    if(story) {
      context=`🛸 ${product} Kristalle werden gleichmäßig auf ${divisor} Raumschiffe verteilt.`;
      question='Wie viele Kristalle erhält jedes Raumschiff?';kind='💎 Kristall-Verteilung';
    } else {
      question=`${product} : ${divisor} = ?`;kind='➗ Geteilt-Aufgabe';
    }
    explanation=`${product} : ${divisor} = ${answer} (denn ${divisor} × ${answer} = ${product})`;
    hint=`Suche die passende Malaufgabe: ${divisor} × ? = ${product}.`;
  } else throw Error('Ungültige Rechenart');
  const candidates=[answer];
  const add=n=>{if(Number.isInteger(n)&&n>=0&&n<=110&&!candidates.includes(n))candidates.push(n);};
  for(const offset of timesShuffle([10,-10,20,-20,row,-row,1,-1,2,-2,3,-3,4,-4,5,-5,9,-9,11,-11])) {
    add(answer+offset); if(candidates.length>=8)break;
  }
  for(let n=0;candidates.length<8&&n<=110;n++)add(n);
  if(candidates.length!==8)throw Error('Nicht acht eindeutige Antworten');
  return {...task,question,context,answer,explanation,hint,kind,options:timesShuffle(candidates)};
}
function timesPlayTone(correct) {
  if(!timesSoundOn)return;
  try {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    const ctx=timesGame?.audioCtx || new Context();
    if(timesGame)timesGame.audioCtx=ctx;
    if(ctx.state==='suspended')ctx.resume();
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type='sine';oscillator.frequency.value=correct?670:280;
    gain.gain.setValueAtTime(.045,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);
    oscillator.connect(gain);gain.connect(ctx.destination);
    oscillator.start();oscillator.stop(ctx.currentTime+.17);
  } catch (_) { /* Ton ist optional; Mathe läuft immer weiter */ }
}
function timesEndAudio() {
  if(timesGame?.audioCtx) {
    try{timesGame.audioCtx.close();}catch(_){}
    timesGame.audioCtx=null;
  }
}
function timesStart() {
  timesAbandon();
  const stats=timesReadStats();
  timesGame={active:true,
    rowSelection:timesRow,mode:timesMode,deck:timesBuildDeck(timesRow,timesMode,stats),
    reviewQueue:[],answered:0,correct:0,wrong:0,streak:0,maxStreak:0,
    points:0,hintUsed:false,current:null,locked:false,
    audioCtx:null,seenFacts:new Set(),wrongFacts:new Set(),
    recentResults:[],mistakeCounts:new Map(),reviewed:0};
  timesEl('times-setup').classList.add('hidden');
  timesEl('times-results').classList.add('hidden');
  timesEl('times-play').classList.remove('hidden');
  timesEl('times-counter').textContent='Aufgabe 1';
  timesEl('times-points').textContent='⭐ 0 Punkte';
  timesEl('times-streak').textContent='🔥 0 in Folge';
  timesEl('times-rocket').style.left='5%';
  timesEl('times-goal-count').textContent=`0 / ${TIMES_BASE_QUESTIONS}`;
  timesEl('times-meter-fill').style.width='0%';
  timesNextQuestion();
}
function timesNextQuestion() {
  const g=timesGame;
  if(!g || !g.active)return;
  if(g.correct>=TIMES_BASE_QUESTIONS) {timesFinish('done');return;}
  // Nach Fehlern entstehen bei Bedarf weitere Aufgaben: nur 20 Richtige beenden den Flug.
  if(!g.deck.length && !g.reviewQueue.length)g.deck=timesBuildDeck(g.rowSelection,g.mode,timesReadStats());
  let card;
  const due=g.reviewQueue.findIndex(t=>t.due<=g.answered);
  if(due!==-1)card=g.reviewQueue.splice(due,1)[0];
  else if(g.deck.length)card=g.deck.shift();
  else card=g.reviewQueue.shift();
  g.current=timesMakeQuestion(card);
  g.hintUsed=false;g.locked=false;
  const phase=g.correct<7?'🌍 Aufwärmplanet':g.correct<14?'🪐 Sternennebel':'🌟 Finale: Galaxie der Profis';
  timesEl('times-phase').textContent=(card.revision>0?'🔁 Rückflug: noch einmal üben! · ':'')+phase;
  timesEl('times-question-type').textContent=g.current.kind+` · ${card.row}er-Reihe`;
  timesEl('times-question').textContent=g.current.question;
  timesEl('times-context').textContent=g.current.context;
  timesEl('times-context').classList.toggle('hidden',!g.current.context);
  timesEl('times-hint-text').classList.add('hidden');
  timesEl('times-hint-text').textContent='💡 '+g.current.hint;
  timesEl('times-feedback').textContent='';timesEl('times-feedback').className='times-feedback hidden';
  timesEl('times-next').classList.add('hidden');
  timesEl('times-hint').disabled=false;
  timesEl('times-counter').textContent=`🎯 ${g.correct} von ${TIMES_BASE_QUESTIONS} richtig · Aufgabe ${g.answered+1}`;
  const box=timesEl('times-choices');box.replaceChildren();
  g.current.options.forEach((option,index)=>{
    const b=document.createElement('button');b.type='button';b.className='times-option';
    b.textContent=String(option);b.setAttribute('aria-label',`Antwort ${index+1}: ${option}`);
    b.addEventListener('click',()=>timesAnswer(option));box.append(b);
  });
}
function timesAnswer(selected) {
  const g=timesGame;
  if(!g||!g.active||g.locked)return;
  g.locked=true;
  const q=g.current,good=selected===q.answer;
  g.answered++;
  if(good) {
    g.correct++;g.streak++;g.maxStreak=Math.max(g.maxStreak,g.streak);
    g.points+=10;
    if(q.revision>0)g.reviewed++;
    g.wrongFacts.delete(q.key);
  } else {
    g.wrong++;g.streak=0;g.wrongFacts.add(q.key);
    g.mistakeCounts.set(q.key,(g.mistakeCounts.get(q.key)||0)+1);
    if(q.revision<2) {
      // Erst später wiederholen, nicht sofort raten lassen.
      g.reviewQueue.push({...q,revision:q.revision+1,due:g.answered+3});
    }
  }
  g.recentResults.push({key:q.key,correct:good,review:q.revision>0});
  const feedback=timesEl('times-feedback');
  feedback.className='times-feedback '+(good?'good':'try');
  feedback.textContent=good
    ? `🎉 Richtig gerechnet! ${q.explanation}. ${g.streak>=3?`🔥 ${g.streak} Richtige in Folge!`: 'Weiter so!'}`
    : `💡 Die Lösung ist ${q.answer}. ${q.explanation}. Diese Aufgabe üben wir später noch einmal.`;
  for(const option of timesEl('times-choices').children) {
    option.disabled=true;
    if(Number(option.textContent)===q.answer)option.classList.add('correct');
    else if(Number(option.textContent)===selected)option.classList.add('incorrect');
  }
  timesPlayTone(good);
  timesEl('times-hint').disabled=true;
  timesEl('times-points').textContent=`⭐ ${g.points} Punkte`;
  timesEl('times-streak').textContent=`🔥 ${g.streak} in Folge`;
  timesEl('times-rocket').style.left=`${Math.min(88,5+(g.correct/TIMES_BASE_QUESTIONS)*83)}%`;
  timesEl('times-meter-fill').style.width=`${Math.min(100,g.correct/TIMES_BASE_QUESTIONS*100)}%`;
  timesEl('times-goal-count').textContent=`${g.correct} / ${TIMES_BASE_QUESTIONS}`;
  // Kein manueller Weiter-Knopf: richtig = sofort; falsch = Loesung zwei Sekunden.
  timesEl('times-next').classList.add('hidden');
  if(good) {
    timesNextQuestion();
  } else {
    setTimeout(()=>{
      // Bei Abbruch, Neustart oder Wechsel der Ansicht niemals in eine fremde Runde springen.
      if(timesGame!==g || !g.active || !g.locked || g.current!==q ||
         timesEl('times-play').classList.contains('hidden') ||
         timesEl('view-times').classList.contains('hidden'))return;
      timesNextQuestion();
    },2000);
  }
}
function timesSaveRound(g,reason) {
  if(g.answered<1)return 0;
  const stats=timesReadStats();stats.rounds=Math.min(9999,stats.rounds+1);
  const accuracy=Math.round(g.correct/g.answered*100);
  const key=`${g.rowSelection}:${g.mode}`;
  const previous=stats.bests[key];
  const candidate={correct:g.correct,accuracy,points:g.points,answered:g.answered};
  if(!previous || candidate.correct>previous.correct ||
    (candidate.correct===previous.correct && candidate.accuracy>previous.accuracy))stats.bests[key]=candidate;
  for(const result of g.recentResults) {
    const old=stats.facts[result.key]||{};
    stats.facts[result.key]={
      attempts:Math.min(9999,(Number.isInteger(old.attempts)?old.attempts:0)+1),
      errors:Math.min(9999,(Number.isInteger(old.errors)?old.errors:0)+(result.correct?0:1)),
      correct:Math.min(9999,(Number.isInteger(old.correct)?old.correct:0)+(result.correct?1:0))};
  }
  timesWriteStats(stats);
  // Ein paar Sterne für die Haupt-App, statt jeden Klick als Level-Up zu zählen.
  const earned=Math.min(9,Math.floor(g.correct/3));
  progress.stars+=earned; progress.answered+=g.correct;progress.todayAnswered+=g.correct;
  progress.sessions++;
  saveProgress();
  return earned;
}
function timesFinish(reason) {
  const g=timesGame;
  if(!g || !g.active)return;
  g.active=false;timesEndAudio();
  const stars=timesSaveRound(g,reason);
  timesEl('times-play').classList.add('hidden');
  timesEl('times-results').classList.remove('hidden');
  const percent=g.answered?Math.round(g.correct/g.answered*100):0;
  timesEl('times-result-title').textContent=reason==='done'?'🚀 20 Richtige! Geschafft!':g.answered?'🌟 Guter Übungsflug!':'🌟 Bereit für den nächsten Start!';
  timesEl('times-result-icon').textContent=percent>=90?'🏆🚀':'🦊🌟';
  timesEl('times-result-copy').textContent=reason==='stop'
    ? `Du hast den Flug bei ${g.correct} richtigen Antworten beendet. Du kannst jederzeit neu starten!`
    : 'Super! 20 Aufgaben richtig gelöst – ganz ohne Zeitdruck!';
  timesEl('times-result-correct').textContent=String(g.correct);
  timesEl('times-result-accuracy').textContent=`${percent} %`;
  timesEl('times-result-stars').textContent=String(stars);
  timesEl('times-result-next').textContent=g.wrong
    ? `🔁 ${g.wrong} ${g.wrong===1?'Antwort war':'Antworten waren'} noch unsicher. Die schwierigen Reihen werden beim nächsten Flug bevorzugt geübt. Du hast ${g.reviewed} davon bereits richtig wiederholt!`
    : g.answered?`🌟 ${g.correct} Aufgaben richtig! Du kannst morgen ganz in deinem Tempo weiterüben.`
    :'Du kannst jederzeit einen neuen Flug starten.';
  timesGame=null;
  timesUpdateBest();
}
function timesAbandon() {
  if(timesGame) {
    timesEndAudio();timesGame.active=false;timesGame=null;
  }
  // Bei Rückkehr aus einer beendeten Runde wieder die Auswahl anzeigen.
  timesEl('times-play').classList.add('hidden');
  timesEl('times-results').classList.add('hidden');
  timesEl('times-setup').classList.remove('hidden');
}
function timesInit() {
  const rows=timesEl('times-rows');
  for(const val of ['all',...TIMES_ROWS.map(String)]) {
    const button=document.createElement('button');button.type='button';button.className='times-pick';
    button.dataset.timesRow=val;button.textContent=val==='all'?'🌈 Alle 3–11':`${val}er`;
    button.addEventListener('click',()=>timesSelectRow(val));rows.append(button);
  }
  for(const button of timesEl('times-modes').querySelectorAll('button')) {
    button.addEventListener('click',()=>timesSelectMode(button.dataset.timesMode));
  }
  timesSelectRow('all');timesSelectMode('both');
  timesEl('times-start').addEventListener('click',timesStart);
  timesEl('times-next').addEventListener('click',timesNextQuestion);
  timesEl('times-hint').addEventListener('click',()=>{
    if(!timesGame||!timesGame.active||timesGame.locked)return;
    timesGame.hintUsed=true;
    timesEl('times-hint-text').classList.remove('hidden');
  });
  timesEl('times-sound').addEventListener('click',()=>{
    timesSoundOn=!timesSoundOn;
    timesEl('times-sound').textContent=timesSoundOn?'🔊 Ton an':'🔇 Ton aus';
    timesEl('times-sound').setAttribute('aria-pressed',String(timesSoundOn));
  });
  timesEl('times-stop').addEventListener('click',()=>timesFinish('stop'));
  timesEl('times-again').addEventListener('click',()=>{
    timesEl('times-results').classList.add('hidden');timesEl('times-setup').classList.remove('hidden');
  });
  timesEl('times-home').addEventListener('click',()=>showView('home'));
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||!timesGame?.active||timesGame.locked)return;
    const tag=event.target?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    if(/^[1-8]$/.test(event.key)) {
      const choices=timesEl('times-choices').children;
      if(choices[Number(event.key)-1]) {event.preventDefault();choices[Number(event.key)-1].click();}
    }
  });
}
timesInit();
