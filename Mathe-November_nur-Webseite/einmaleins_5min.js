'use strict';
// Eigenständiger, komplett lokaler Einmaleins-Lernflug: 20 Richtige ohne Zeitdruck.
// Dieses Modul erweitert die bestehende App, ohne Fach-/Lernmix-Logik zu ersetzen.
const TIMES_STORAGE = 'mathe-november-sternenflug-v1';
const TIMES_BASE_QUESTIONS = 20; // Ziel sind genau 20 richtig gelöste Aufgaben, ohne Frist.
const TIMES_ROWS = [3,4,5,6,7,8,9,10,11];
// Im Profi-Raketentest werden exakt 16 schwierigere und vier Basisaufgaben
// RICHTIG gelöst. Fehler verändern die 80/20-Verteilung nicht.
const TIMES_FOCUS_GOALS = Object.freeze({focus:16,basics:4});
const TIMES_FOCUS_ROWS = [5,6,7,8,9,10];
const TIMES_BASICS_ROWS = [3,4];
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
  if(value!=='focus' && value!=='all' && !TIMES_ROWS.includes(Number(value)))throw Error('Ungültige Auswahl');
  timesRow=value;
  for(const b of timesEl('times-rows').querySelectorAll('button')) {
    const active=b.dataset.timesRow===value;
    b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));
  }
  const note=timesEl('times-focus-note');
  if(note){
    note.textContent=value==='focus'
      ?'🔥 Profi-Raketentest: 16 richtige Aufgaben aus 5×5 bis 10×10 und vier aus der 3er-/4er-Reihe – ohne Zeitlimit.'
      :value==='all'?'🌈 Freier Mix: alle Reihen 3 bis 11 wie bisher.':'🧠 Einzeltraining: die ausgewählte Reihe wie bisher.';
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
  if(rowSelection==='focus') {
    if(!['both','mul','div'].includes(mode))throw Error('Ungültige Rechenart');
    const collect=(rows,factors,count,bucket)=>{
      // Keine Wiederholungen derselben Zahlenkombination in einem 20er-Grunddeck.
      const coverage=Math.floor(count/rows.length);
      // Jede Schwierigkeit/Reihe kommt in jeder Runde garantiert mehrfach vor.
      const guaranteed=rows.flatMap(row=>timesShuffle(factors).slice(0,coverage).map(factor=>({row,factor})));
      const seen=new Set(guaranteed.map(t=>`${t.row}:${t.factor}`));
      const remaining=timesShuffle(rows.flatMap(row=>factors.map(factor=>({row,factor})))
        .filter(t=>!seen.has(`${t.row}:${t.factor}`)));
      const pairs=timesShuffle([...guaranteed,...remaining.slice(0,count-guaranteed.length)]);
      if(pairs.length<count)throw Error('Zu kleiner Aufgabenpool');
      const ops=mode==='both'
        ?timesShuffle([...Array(count/2).fill('mul'),...Array(count/2).fill('div')])
        :Array(count).fill(mode);
      return pairs.slice(0,count).map((pair,i)=>{
        const op=ops[i],key=`${op}:${pair.row}:${pair.factor}`;
        return {...pair,op,key,revision:0,focusBucket:bucket,difficulty:stats.facts[key]?.errors||0};
      });
    };
    return timesShuffle([
      ...collect(TIMES_FOCUS_ROWS,[5,6,7,8,9,10],TIMES_FOCUS_GOALS.focus,'focus'),
      ...collect(TIMES_BASICS_ROWS,[1,2,3,4,5,6,7,8,9,10],TIMES_FOCUS_GOALS.basics,'basics')
    ]);
  }
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
  // Blitztraining: Immer eine reine Rechnung, niemals eine Sachaufgabe.
  // Profi-Auswahl bleibt unverändert: 16 Fakten aus 5×5..10×10, 4 Basisfakten.
  const {row,factor,op,revision}=task;
  if(!TIMES_ROWS.includes(row) || !Number.isInteger(factor)||factor<1||factor>10)throw Error('Ungültiger Einmaleinsfakt');
  const product=row*factor;
  let question='',answer,explanation,hint,kind='';
  if(op==='mul') {
    answer=product;
    question=`${row} × ${factor} = ?`;
    kind='✖️ Mal-Aufgabe';
    explanation=`${row} × ${factor} = ${product}`;
    hint=`Denke an die ${row}er-Reihe.`;
  } else if(op==='div') {
    // Auch die 11er-Reihe darf nur durch Zahlen bis einschließlich 10 teilen.
    const divisor=(row===11 || factor===10 || ((factor!==1 && revision%2===0) && Math.random()<0.45))?factor:row;
    answer=product/divisor;
    question=`${product} : ${divisor} = ?`;
    kind='➗ Geteilt-Aufgabe';
    explanation=`${product} : ${divisor} = ${answer}`;
    hint=`Denke an ${divisor} × ${answer} = ${product}.`;
  } else throw Error('Ungültige Rechenart');
  if(!Number.isInteger(answer) || answer<1 || answer>110 || product>110)throw Error('Ungültiges Rechenergebnis');
  const candidates=[answer];
  const add=n=>{if(Number.isInteger(n)&&n>=0&&n<=110&&!candidates.includes(n))candidates.push(n);};
  for(const offset of timesShuffle([10,-10,20,-20,row,-row,1,-1,2,-2,3,-3,4,-4,5,-5,9,-9,11,-11])) {
    add(answer+offset); if(candidates.length>=8)break;
  }
  for(let n=0;candidates.length<8&&n<=110;n++)add(n);
  if(candidates.length!==8)throw Error('Nicht acht eindeutige Antworten');
  return {...task,question,context:'',answer,explanation,hint,kind,options:timesShuffle(candidates)};
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
    focusSolved:{focus:0,basics:0},
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
  const focusProgress=timesEl('times-focus-progress');
  if(focusProgress){focusProgress.classList.toggle('hidden',timesRow!=='focus');
    focusProgress.textContent='🔥 Profi 0/16 · 🌱 Basis 0/4';}
  timesNextQuestion();
}
function timesNextQuestion() {
  const g=timesGame;
  if(!g || !g.active)return;
  if(g.correct>=TIMES_BASE_QUESTIONS) {timesFinish('done');return;}
  // Fehler erzeugen zusätzliche Fragen, doch die 16/4-Verteilung zählt
  // ausschließlich RICHTIG gelöste Aufgaben. Ein erfüllter Bereich wird gesperrt.
  let card;
  if(g.rowSelection==='focus') {
    const needed=t=>t && TIMES_FOCUS_GOALS[t.focusBucket] > g.focusSolved[t.focusBucket];
    const due=g.reviewQueue.findIndex(t=>needed(t) && t.due<=g.answered);
    if(due!==-1)card=g.reviewQueue.splice(due,1)[0];
    else {
      let next=g.deck.findIndex(needed);
      if(next<0){
        g.deck=timesBuildDeck('focus',g.mode,timesReadStats()).filter(needed);
        next=g.deck.findIndex(needed);
      }
      if(next>=0)card=g.deck.splice(next,1)[0];
      else {
        // Bei unerfülltem Ziel bleibt eine vorgemerkte Fehleraufgabe möglich.
        const review=g.reviewQueue.findIndex(needed);
        if(review>=0)card=g.reviewQueue.splice(review,1)[0];
      }
    }
  } else {
    if(!g.deck.length && !g.reviewQueue.length)g.deck=timesBuildDeck(g.rowSelection,g.mode,timesReadStats());
    const due=g.reviewQueue.findIndex(t=>t.due<=g.answered);
    if(due!==-1)card=g.reviewQueue.splice(due,1)[0];
    else if(g.deck.length)card=g.deck.shift();
    else card=g.reviewQueue.shift();
  }
  if(!card)throw Error('Kein offener Einmaleins-Aufgabenbereich vorhanden');
  g.current=timesMakeQuestion(card);
  g.hintUsed=false;g.locked=false;
  const phase=g.correct<7?'🌍 Aufwärmplanet':g.correct<14?'🪐 Sternennebel':'🌟 Finale: Galaxie der Profis';
  const zone=g.rowSelection==='focus'?(card.focusBucket==='focus'?'🔥 Profi-Zone 5×5 bis 10×10':'🌱 Basis-Zone 3er-/4er-Reihe'):phase;
  timesEl('times-phase').textContent=(card.revision>0?'🔁 Rückflug: noch einmal üben! · ':'')+zone;
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
    if(g.rowSelection==='focus') {
      if(!Object.hasOwn(TIMES_FOCUS_GOALS,q.focusBucket) ||
         g.focusSolved[q.focusBucket]>=TIMES_FOCUS_GOALS[q.focusBucket])throw Error('Fokus-Ziel bereits erreicht');
      g.focusSolved[q.focusBucket]++;
    }
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
  const focusProgress=timesEl('times-focus-progress');
  if(focusProgress && g.rowSelection==='focus')
    focusProgress.textContent=`🔥 Profi ${g.focusSolved.focus}/16 · 🌱 Basis ${g.focusSolved.basics}/4`;
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
  timesEl('times-result-next').textContent=g.rowSelection==='focus' && reason==='done'
    ?`🔥 Profi 16/16 · 🌱 Basis 4/4 richtig! ${g.wrong?`${g.wrong} Fehlversuche wurden beim Üben berücksichtigt.`:'Alles beim ersten Versuch richtig!'}`
    :g.wrong
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
  for(const val of ['focus','all',...TIMES_ROWS.map(String)]) {
    const button=document.createElement('button');button.type='button';button.className='times-pick';
    button.dataset.timesRow=val;
    button.textContent=val==='focus'?'🔥 Profi-Raketentest 80/20':val==='all'?'🌈 Alle 3–11':`${val}er`;
    button.addEventListener('click',()=>timesSelectRow(val));rows.append(button);
  }
  for(const button of timesEl('times-modes').querySelectorAll('button')) {
    button.addEventListener('click',()=>timesSelectMode(button.dataset.timesMode));
  }
  timesSelectRow('focus');timesSelectMode('both');
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
