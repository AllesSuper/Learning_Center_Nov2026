'use strict';
// Version 4: 20er-Lernreise, frische Aufgaben beim Ruecksprung und Fehlerkartei.
// Keine Server-Aufrufe, keine zusätzlichen Berechtigungen oder Abhängigkeiten.
const MIXED_LENGTH = 20;
const MAX_REVIEW_ITEMS = 80;

function safeReviewBank(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const safe = [];
  for (const x of raw.slice(-MAX_REVIEW_ITEMS * 2)) {
    if (!x || typeof x !== 'object' || !SUBJECTS.includes(x.subject) ||
        typeof x.key !== 'string' || x.key.length > 220 || !x.key ||
        seen.has(`${x.subject}|${x.key}`)) continue;
    seen.add(`${x.subject}|${x.key}`);
    const bounded = (n, min, max, fallback) => Number.isSafeInteger(n) ? Math.max(min,Math.min(max,n)) : fallback;
    safe.push({subject:x.subject, key:x.key,
      level:bounded(x.level,1,MAX_LEVEL[x.subject],1),
      errors:bounded(x.errors,1,10000,1),
      wins:bounded(x.wins,0,1,0)});
  }
  return safe.slice(-MAX_REVIEW_ITEMS);
}
function taskReviewKey(task,subject) {
  if(typeof task.reviewKey==='string' && task.reviewKey) return task.reviewKey;
  if(subject==='math') {
    const op=task.question.includes('−')?'minus':task.question.includes('+')?'plus':task.question.includes('×')?'mal':task.question.includes('÷')?'geteilt':'anderes';
    return `${task.label}|${op}`;
  }
  if(subject==='english') return task.postAnswerSpeak || task.answer;
  if(subject==='flags') return task.answer;
  // Dieselbe Formulierung kann mehrere Wörter testen: Antwort eindeutig mitmerken.
  return `${task.question} :: ${task.answer}`;
}
function taskIdentity(task) {return `${task.subject}|${task.question}|${task.answer}`;}
function reviewEntryFor(task,subject) {
  return {subject, key:taskReviewKey(task,subject), level:task.studyLevel || progress.skills[subject].level};
}
function recordLearningMistake(task,subject) {
  const details=reviewEntryFor(task,subject);
  let entry=progress.reviewBank.find(x=>x.subject===subject && x.key===details.key);
  if(typeof treasureMarkMistake==='function')treasureMarkMistake(task,subject);
  if(entry) {entry.errors=Math.min(10000,entry.errors+1);entry.wins=0;entry.level=details.level;}
  else {
    progress.reviewBank.push({...details,errors:1,wins:0});
    if(progress.reviewBank.length>MAX_REVIEW_ITEMS) progress.reviewBank.shift();
  }
}
function recordLearningSuccess(task,subject,clean) {
  const key=taskReviewKey(task,subject);
  const i=progress.reviewBank.findIndex(x=>x.subject===subject && x.key===key);
  if(i<0 || !clean) return;
  const entry=progress.reviewBank[i];
  entry.wins++;
  // Mindestens zwei getrennte korrekte Begegnungen, um das Thema abzuhaken.
  if(entry.wins>=2) progress.reviewBank.splice(i,1);
}
function englishReviewTask(word) {
  const alternatives=shuffle(ENGLISH_WORDS.filter(x=>x.group===word.group && x.en!==word.en)).slice(0,3);
  if(alternatives.length!==3) return null;
  return {label:'Wiederholungs-Safari',context:'Kennst du dieses Wort noch? Höre es dir an.',
    question:`Was bedeutet „${word.en}“ auf Deutsch?`,answer:word.de,
    options:multipleChoice(word.de,alternatives.map(x=>x.de)),
    hint:'Lass dir das Wort vorlesen. Denke an das passende Bild dazu.',
    explanation:`„${word.en}“ bedeutet „${word.de}“.`,speakText:word.en,
    speechLang:'en-GB',postAnswerSpeak:word.en,visualEmoji:word.emoji};
}
function flagReviewTask(country,level) {
  const pool=FLAG_COUNTRIES.filter(x=>x.from<=Math.max(country.from,level));
  const others=shuffle(pool.filter(x=>x.name!==country.name)).slice(0,3);
  if(others.length<3) return null;
  // Zweite Fragerichtung: erst Land, dann die passende Flagge auswählen.
  return {label:'Flaggen-Wiederholung',context:'Erkennst du die passende Länderflagge?',
    question:`Welche Flagge gehört zu ${country.name}?`,answer:country.name,
    options:multipleChoice(country.name,others.map(x=>x.name)),
    optionFlags:Object.fromEntries([country,...others].filter(x=>flagAsset(x)).map(x=>[x.name,flagAsset(x)])),
    optionEmoji:Object.fromEntries([country,...others].filter(x=>!flagAsset(x)).map(x=>[x.name,flagEmoji(x)])),
    hint:'Vergleiche die Streifen, Farben und ihre Reihenfolge.',
    explanation:`Das ist die Flagge von ${country.name}.`};
}
// Zusätzliche Farbfragen, sobald alle bekannten Länder bereits richtig gelöst sind.
// Damit kann auch nach vielen Rücksprüngen eine wirklich neue Frage erscheinen.
const FLAG_COLORS = {
  de:['Schwarz','Rot','Gelb'],fr:['Blau','Weiß','Rot'],it:['Grün','Weiß','Rot'],
  nl:['Rot','Weiß','Blau'],at:['Rot','Weiß'],pl:['Weiß','Rot'],
  be:['Schwarz','Gelb','Rot'],ua:['Blau','Gelb'],ie:['Grün','Weiß','Orange'],
  jp:['Weiß','Rot'],se:['Blau','Gelb'],ch:['Rot','Weiß'],dk:['Rot','Weiß'],
  fi:['Weiß','Blau'],lu:['Rot','Weiß','Blau'],ee:['Blau','Schwarz','Weiß']
};
function flagColorTask(country,forcedColor=null) {
  const colors=FLAG_COLORS[country.id];
  if(!colors)return null;
  const color=forcedColor||shuffle(colors)[0];
  if(!colors.includes(color))return null;
  const other=shuffle(['Rot','Gelb','Blau','Grün','Weiß','Schwarz','Orange'].filter(x=>!colors.includes(x))).slice(0,3);
  if(other.length<3)return null;
  return {label:'Flaggen-Farben',context:'Schau dir die Flagge genau an.',
    question:`Welche dieser Farben gehört zur Flagge von ${country.name}?`,
    visualFlag:flagAsset(country),answer:color,options:multipleChoice(color,other),
    hint:'Suche die angezeigten Farben auf der Flagge.',
    explanation:`${color} ist eine Farbe der Flagge von ${country.name}.`,
    reviewKey:`flagcolor:${country.id}:${color}`};
}
function makeReviewTask(entry) {
  // Nach einem Stufenrueckgang keine alten, inzwischen zu schweren Themen erzwingen.
  if(progress.skills[entry.subject].level<entry.level) return null;
  const level=Math.max(1,Math.min(progress.skills[entry.subject].level,entry.level));
  let task=null;
  if(entry.subject==='math') {
    // Zuerst exakt dieselbe Rechenart / Einmaleinsreihe mit NEUEN Zahlen.
    let match=entry.key.match(/^(mul|div):(\d{1,2})$/);
    if(match) task=createMathSkillTask(match[1],level,Number(match[2]));
    else {
      const kind={'add:100':'add100','sub:100':'sub100',
        'add:hundreds':'hundredPlus','sub:hundreds':'hundredMinus'}[entry.key];
      if(kind) task=createMathSkillTask(kind,level);
      else {
        // Bestehende v3-Fehlerkarteikarten bleiben verwendbar (kein Datenverlust).
        const legacy=entry.key.split('|').pop();
        const legacyKind={plus:'add100',minus:'sub100',mal:'mul',geteilt:'div'}[legacy];
        if(legacyKind) task=createMathSkillTask(legacyKind,level);
      }
    }
    // Der alte Schlüssel bleibt erhalten, bis das v3-Thema sicher beherrscht wird.
    if(task) task.reviewKey=entry.key;
  } else if(entry.subject==='german') {
    const source=[...GERMAN_EASY,...GERMAN_BONUS,...germanBank].find(q=>
      `${q.question} :: ${q.answer}`===entry.key || q.question===entry.key);
    if(source) task={...copyTask(source),label:'Wiederholungs-Detektiv',
      question:`Schau noch einmal genau hin: ${source.question}`,reviewKey:entry.key};
    else if(entry.key.includes('Wo entdeckt ')) task={...newGermanReadingTask(),label:'Neue Lesespur zur Wiederholung',reviewKey:entry.key};
  } else if(entry.subject==='english') {
    const word=ENGLISH_WORDS.find(x=>x.en===entry.key);
    if(word) task=englishReviewTask(word);
  } else if(entry.subject==='flags') {
    if(entry.key.startsWith('flagcolor:')) {
      const [,id,color]=entry.key.split(':');
      const country=FLAG_COUNTRIES.find(x=>x.id===id);
      if(country) task=flagColorTask(country,color);
    } else {
      const country=FLAG_COUNTRIES.find(x=>x.name===entry.key);
      if(country) task=flagReviewTask(country,level);
    }
  }
  if(task) return {...task,subject:entry.subject,studyLevel:level,reviewTask:true};
  return null;
}
function chooseUniqueReview(entry,existing) {
  const signatures=new Set(existing.map(taskIdentity));
  for(let attempt=0;attempt<12;attempt++) {
    const candidate=makeReviewTask(entry);
    if(!candidate) return null;
    if(!signatures.has(taskIdentity(candidate))) return candidate;
  }
  return null;
}
function buildMixedSessionTasks() {
  const perSubject={};
  for(const subject of SUBJECTS) {
    const level=progress.skills[subject].level;
    const tasks=makeSubjectTasks(subject,level).map(task=>({...task,subject,studyLevel:level}));
    const pending=progress.reviewBank.filter(x=>x.subject===subject).sort((a,b)=>b.errors-a.errors);
    // Bis zu zwei noch nicht gemeisterte Themen pro Fach gezielt aufnehmen.
    let replaced=0;
    for(const review of pending) {
      if(replaced>=2) break;
      const present=tasks.some(t=>taskReviewKey(t,subject)===review.key);
      if(present) continue; // Gleicher Lerngegenstand ist bereits vertreten.
      const candidate=chooseUniqueReview(review,tasks);
      if(!candidate) continue;
      const slot=4-replaced;
      tasks[slot]=candidate;
      replaced++;
    }
    perSubject[subject]=tasks;
  }
  // Fünf abwechslungsreiche Vierer-Runden: pro Fach genau fünf neue Aufgaben.
  const result=[];
  for(let i=0;i<5;i++) {
    for(const subject of shuffle(SUBJECTS)) result.push(perSubject[subject][i]);
  }
  if(result.length!==MIXED_LENGTH || new Set(result.map(taskIdentity)).size!==MIXED_LENGTH)
    throw new Error('Gemischte Mission muss 20 verschiedene Aufgaben haben.');
  return result;
}
function scheduleLaterReview(currentSession,task,atIndex) {
  const subject=task.subject;
  const entry=reviewEntryFor(task,subject);
  const key=entry.key;
  // Zunächst frühestens drei Plätze später, damit der Inhalt zeitversetzt erneut erscheint.
  for(let i=atIndex+3;i<currentSession.tasks.length;i++) {
    const old=currentSession.tasks[i];
    if(old.subject!==subject || currentSession.solved[i] || old.reviewTask ||
        taskReviewKey(old,subject)===key) continue;
    const other=currentSession.tasks.filter((_,idx)=>idx!==i);
    const candidate=chooseUniqueReview(entry,other);
    if(candidate) {candidate.timerSeconds=old.timerSeconds;currentSession.tasks[i]=candidate;currentSession.seenIdentities?.add(taskIdentity(candidate));return true;}
  }
  // Falls es keinen freien Platz gibt, bleibt das Thema für die nächste Runde vorgemerkt.
  return false;
}
function mixedSolvedCount(currentSession) {return currentSession.solved.filter(Boolean).length;}
// Schon richtig beantwortete Aufgaben (und bekannte Vokabeln/Flaggen) dürfen
// beim Rücksprung NICHT erneut vorgelegt werden. Die Fehlaufgabe selbst bleibt.
function mixedLearningTarget(task) {
  if(task.subject==='english'||task.subject==='flags') return `${task.subject}|${taskReviewKey(task,task.subject)}`;
  return taskIdentity(task);
}
function newGermanReadingTask() {
  const people=['Mia','Lina','Ben','Noah','Mira','Tom','Emil','Emma','Finn','Lara'];
  const objects=[['einen Ball','Ball'],['einen Schlüssel','Schlüssel'],['ein Buch','Buch'],
    ['eine Feder','Feder'],['einen Stein','Stein'],['eine Murmel','Murmel'],
    ['einen Brief','Brief'],['ein Blatt','Blatt'],['eine Münze','Münze']];
  const places=['im Garten','im Park','im Wald','auf dem Schulhof','am Bach','auf dem Spielplatz'];
  const who=shuffle(people)[0], item=shuffle(objects)[0], where=shuffle(places)[0];
  const options=shuffle([where,...shuffle(places.filter(x=>x!==where)).slice(0,3)]);
  return {label:'Neue Lesespur',context:`${who} entdeckt ${item[0]} ${where}. ${who} schaut genau hin und erzählt später einem Freund davon.`,
    question:`Wo entdeckt ${who} ${item[0]}?`,answer:where,options,
    hint:'Lies den ersten Satz langsam. Suche den Ort.',
    explanation:`${who} entdeckt ${item[0]} ${where}.`};
}
function mixedTaskAllowed(currentSession,candidate,slot) {
  if(!candidate || !candidate.question || !candidate.answer)return false;
  if(currentSession.seenIdentities.has(taskIdentity(candidate)))return false;
  if(currentSession.correctTargets.has(mixedLearningTarget(candidate)))return false;
  return !currentSession.tasks.some((existing,index)=>index!==slot &&
    (taskIdentity(existing)===taskIdentity(candidate)||
      ((candidate.subject==='english'||candidate.subject==='flags') &&
       mixedLearningTarget(existing)===mixedLearningTarget(candidate))));
}
function makeFreshMixedReplacement(currentSession,slot) {
  const old=currentSession.tasks[slot], subject=old.subject;
  const level=progress.skills[subject].level;
  const normalize=task=>({...task,subject,studyLevel:level,reviewTask:false,timerSeconds:old.timerSeconds});
  // Zunächst Aufgaben des schon bekannten Lernniveaus bevorzugen.
  for(let attempt=0;attempt<90;attempt++) {
    let options;
    if(subject==='math') {
      // Eine passende NEUE Aufgabe derselben Rechenart hält die Fachverteilung stabil.
      const kind=old.mathKind || shuffle(['mul','div','add100','sub100','hundredPlus','hundredMinus'])[0];
      options=[createMathSkillTask(kind,level)];
    } else if(subject==='german') {
      const all=[...GERMAN_EASY.filter(x=>x.level<=level),
        ...(level>=4?[...GERMAN_BONUS,...germanBank]:[])];
      options=shuffle(all).slice(0,5).map(copyTask);
    } else if(subject==='english') {
      options=makeEnglishTasks(level);
    } else {
      options=makeFlagTasks(level);
    }
    for(const possible of options) {
      const task=normalize(possible);
      if(mixedTaskAllowed(currentSession,task,slot))return task;
    }
  }
  // Begrenzte Flaggen-/Englisch-/Lesekarteien bei häufigen Rücksprüngen
  // durch andere bisher NICHT richtig gelöste Inhalte ergänzen.
  if(subject==='english') {
    for(const word of shuffle(ENGLISH_WORDS)) {
      const base=englishReviewTask(word);
      if(!base) continue;
      const task=normalize({...base,label:'Neue Wörter-Safari'});
      if(mixedTaskAllowed(currentSession,task,slot))return task;
    }
  } else if(subject==='flags') {
    for(const country of shuffle(FLAG_COUNTRIES)) {
      const base=flagReviewTask(country,Math.max(level,country.from));
      if(!base)continue;
      const task=normalize({...base,label:'Neue Flaggen-Entdeckung'});
      if(mixedTaskAllowed(currentSession,task,slot))return task;
    }
    for(const country of shuffle(FLAG_COUNTRIES)) {
      for(const color of shuffle(FLAG_COLORS[country.id] || [])) {
        const task=normalize(flagColorTask(country,color));
        if(mixedTaskAllowed(currentSession,task,slot))return task;
      }
    }
  } else if(subject==='german') {
    for(let attempt=0;attempt<800;attempt++) {
      const task=normalize(newGermanReadingTask());
      if(mixedTaskAllowed(currentSession,task,slot))return task;
    }
  } else if(subject==='math') {
    for(let attempt=0;attempt<500;attempt++) {
      const kind=shuffle(['mul','div','add100','sub100','hundredPlus','hundredMinus'])[0];
      const task=normalize(createMathSkillTask(kind,level));
      if(mixedTaskAllowed(currentSession,task,slot))return task;
    }
  }
  // Sehr unwahrscheinliche Erschöpfung: nie eine richtig gelöste Frage neu stellen.
  throw new Error('Keine neue Aufgabe ohne Wiederholung verfügbar. Bitte eine neue Runde starten.');
}
function rewindMixedSession(currentSession) {
  const faultyIndex=currentSession.index;
  const target=currentSession.pendingBacktrack;
  if(target===null)return;
  // Vorherige, schon gelöste Slots werden mit neuen Aufgaben gefüllt.
  // Noch nicht korrekt gelöste Fehleraufgaben bleiben zum gezielten Üben.
  for(let index=target;index<faultyIndex;index++) {
    if(!currentSession.solved[index])continue;
    const replacement=makeFreshMixedReplacement(currentSession,index);
    currentSession.tasks[index]=replacement;
    currentSession.seenIdentities.add(taskIdentity(replacement));
    currentSession.solved[index]=false;
    currentSession.hadMistake[index]=false;
    currentSession.hadHint[index]=false;
    // credited[index] wird ABSICHTLICH nicht zurückgesetzt: keine Doppelsterne.
  }
  currentSession.index=target;
  currentSession.pendingBacktrack=null;
}
function beginMixedSession() {
  session={mode:'mixed',subject:'mixed',tasks:markTimedTasks(buildMixedSessionTasks()),index:0,
    misses:0,earned:0,answeredThisTask:false,hintUsed:false,levelChange:null,
    solved:Array(MIXED_LENGTH).fill(false),credited:Array(MIXED_LENGTH).fill(false),
    hadMistake:Array(MIXED_LENGTH).fill(false),hadHint:Array(MIXED_LENGTH).fill(false),
    rewinds:0,pendingBacktrack:null};
  session.seenIdentities=new Set(session.tasks.map(taskIdentity));
  session.correctTargets=new Set();
  saveProgress();showView('play');renderTask();
}
function mixedWrongAnswer(button,task,feedback,timedOut=false) {
  stopQuestionTimer();registerWrongAnswer();
  if(button)button.classList.add('incorrect');
  session.answeredThisTask=true;
  session.misses++;
  session.hadMistake[session.index]=true;
  session.pendingBacktrack=Math.max(0,session.index-2);
  session.rewinds++;
  recordLearningMistake(task,task.subject);
  scheduleLaterReview(session,task,session.index);
  saveProgress();
  for(const option of element('answer-options').children) option.disabled=true;
  element('hint-text').classList.remove('hidden');
  feedback.classList.add('try');
  feedback.textContent=`${timedOut?'⏰ Zeit abgelaufen!':'💪 Wir lernen daraus!'} ${task.explanation} Wir gehen zwei Schritte zurück: Bereits richtige Fragen werden durch NEUE Aufgaben ersetzt. Diese Frage üben wir später noch einmal.`;
  element('next-button').textContent=session.index>=2?'↩ Zwei Aufgaben zurück':'↩ Noch einmal üben';
  element('next-button').classList.remove('hidden');
}
function mixedCorrectAnswer(button,task,feedback) {
  stopQuestionTimer();registerCorrectAnswer();
  button.classList.add('correct');
  session.answeredThisTask=true;
  const index=session.index;
  const firstSuccess=!session.solved[index];
  if(firstSuccess) {
    session.solved[index]=true;
    const fresh=session.misses===0 && !session.hadMistake[index] &&
      !session.hintUsed && !session.hadHint[index];
    if(!session.credited[index]) {
      const earned=fresh?2:1;
      session.credited[index]=true;
      session.earned+=earned;
      progress.stars+=earned;
      progress.answered++;
      progress.todayAnswered++;
      if(typeof rewardLearningWin==='function')rewardLearningWin(task,task.subject,true);
    }
    // Auch neue Rücksprung-Aufgaben fließen in die Lernstandsschätzung ein.
    const change=updateSkill(task.subject,session.hadMistake[index]?1:session.misses,
      session.hintUsed || session.hadHint[index]);
    if(change) {
      const notice=element('level-up-notice');
      notice.textContent=change==='up'?'🌟 Neue Lernstufe freigeschaltet!':'💪 Wir üben noch etwas zusammen.';
      notice.classList.remove('hidden');
    }
  }
  session.correctTargets.add(mixedLearningTarget(task));
  // Nur früher falsch gelöste Themen werden später gezielt wiederholt.
  recordLearningSuccess(task,task.subject,session.misses===0 && !session.hintUsed);
  saveProgress();
  feedback.classList.add('good');
  feedback.textContent=`🎉 Geschafft! ${task.explanation}${firstSuccess?' ⭐ Weiter so!':' Gut wiederholt!'}`;
  for(const option of element('answer-options').children) option.disabled=true;
  element('next-button').textContent=index===MIXED_LENGTH-1?'Lernreise abschließen 🎉':'Weiter zur nächsten Aufgabe →';
  element('next-button').classList.add('hidden');
  scheduleAutoAdvance();
  element('mission-fill').style.width=`${mixedSolvedCount(session)/MIXED_LENGTH*100}%`;
}
function advanceMixedSession() {
  if(session.pendingBacktrack!==null) rewindMixedSession(session);
  else session.index++;
  if(session.index===MIXED_LENGTH) completeSession();
  else renderTask();
}

function renderReviewList() {
  const list=element('review-list');
  if(!list) return;
  list.replaceChildren();
  if(progress.reviewBank.length===0) {
    const p=document.createElement('p');p.textContent='🌟 Gerade gibt es keine offenen Wiederholungsthemen.';list.append(p);
    return;
  }
  const sorted=[...progress.reviewBank].sort((a,b)=>b.errors-a.errors);
  for(const item of sorted.slice(0,12)) {
    const row=document.createElement('p');row.className='review-line';
    const label=item.subject==='math'?item.key.replace('|',' · '):item.key;
    row.textContent=`${SUBJECT_ICONS[item.subject]} ${SUBJECT_NAMES[item.subject]}: ${label} · ${item.errors} Fehler · ${item.wins}/2 sichere Wiederholungen`;
    list.append(row);
  }
  if(sorted.length>12) {
    const more=document.createElement('p');more.textContent=`… und ${sorted.length-12} weitere vorgemerkte Themen.`;list.append(more);
  }
}
