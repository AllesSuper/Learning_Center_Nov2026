'use strict';
// Additive Version 5: optionale Zeitfragen, 10-Sekunden-Time-Bank, Auto-Weiter.
// Keine Netzwerkverbindung, keine Drittanbieter-Bibliotheken, keine Cookies.
let questionClock=null;
let autoAdvanceHandle=null;

function cancelAutoAdvance() {
  if(autoAdvanceHandle!==null)clearTimeout(autoAdvanceHandle);
  autoAdvanceHandle=null;
}
function registerCorrectAnswer() {
  progress.timeStreak=(progress.timeStreak||0)+1;
  if(progress.timeStreak>=3) {
    progress.timeStreak=0;
    progress.timeBank=(progress.timeBank||0)+10;
    const reward=document.getElementById('time-reward');
    if(reward){reward.textContent='⏳ +10 Sekunden gewonnen!';reward.classList.remove('hidden');}
  }
  updateTimeControls();
}
function registerWrongAnswer() {
  progress.timeStreak=0;
  updateTimeControls();
}
function updateTimeControls() {
  const bank=document.getElementById('time-bank');
  const streak=document.getElementById('time-streak');
  const purchase=document.getElementById('time-button');
  const setting=document.getElementById('timer-toggle');
  if(bank)bank.textContent=`${progress.timeBank||0} s`;
  if(streak)streak.textContent=`${progress.timeStreak||0} / 3`;
  if(purchase)purchase.disabled=!questionClock?.active || (progress.timeBank||0)<10 || !session || session.answeredThisTask;
  if(setting)setting.checked=progress.timersEnabled!==false;
}
function markTimedTasks(tasks,subject='mixed') {
  if(progress.timersEnabled===false)return tasks;
  const eligible=shuffle(tasks.map((task,i)=>({task,i})).filter(({task})=>
    !['Lesespaß','Lesedetektive','Neue Lesespur'].includes(task.label)));
  const count=Math.min(eligible.length,tasks.length>=20?5:1);
  for(const {task} of eligible.slice(0,count)) {
    const name=task.subject||subject;
    task.timerSeconds=name==='math'?32:name==='german'?35:name==='english'?24:25;
  }
  return tasks;
}
function stopQuestionTimer(hide=true) {
  if(questionClock?.timerId!==null && questionClock?.timerId!==undefined)clearInterval(questionClock.timerId);
  questionClock=null;
  if(hide)document.getElementById('time-question-panel')?.classList.add('hidden');
  updateTimeControls();
}
function renderClock() {
  if(!questionClock)return;
  const seconds=Math.max(0,Math.ceil(questionClock.msLeft/1000));
  const display=document.getElementById('time-left');
  if(display)display.textContent=`${seconds} s`;
  const bar=document.getElementById('time-fill');
  if(bar)bar.style.width=`${100*Math.max(0,questionClock.msLeft)/questionClock.startMs}%`;
  document.getElementById('time-question-panel')?.classList.toggle('time-warning',seconds<=8);
  updateTimeControls();
}
function tickQuestionClock() {
  if(!questionClock?.active)return;
  if(document.hidden){questionClock.paused=true;questionClock.lastTick=Date.now();return;}
  if(questionClock.paused){questionClock.paused=false;questionClock.lastTick=Date.now();return;}
  const now=Date.now();
  questionClock.msLeft=Math.max(0,questionClock.msLeft-(now-questionClock.lastTick));
  questionClock.lastTick=now;
  renderClock();
  if(questionClock.msLeft<=0) {
    stopQuestionTimer(false);
    onQuestionTimeout();
  }
}
function startQuestionTimer(task) {
  stopQuestionTimer();
  document.getElementById('time-reward')?.classList.add('hidden');
  if(!task.timerSeconds || progress.timersEnabled===false)return;
  const total=task.timerSeconds*1000;
  questionClock={active:true,msLeft:total,startMs:total,lastTick:Date.now(),paused:false,timerId:null};
  document.getElementById('time-question-panel')?.classList.remove('hidden','time-warning');
  renderClock();
  questionClock.timerId=setInterval(tickQuestionClock,200);
}
function spendTimeBonus() {
  if(!questionClock?.active || progress.timeBank<10 || session?.answeredThisTask)return;
  progress.timeBank-=10;
  questionClock.msLeft+=10000;
  questionClock.startMs+=10000;
  questionClock.lastTick=Date.now();
  renderClock();saveProgress();
}
function onQuestionTimeout() {
  if(!session || session.answeredThisTask || element('view-play').classList.contains('hidden'))return;
  const task=session.tasks[session.index];
  const feedback=element('answer-feedback');feedback.className='feedback try';
  if(session.mode==='mixed') {
    mixedWrongAnswer(null,task,feedback,true);
  } else {
    if(session.misses===0)recordLearningMistake(task,session.subject);
    session.misses++;session.hintUsed=true;
    registerWrongAnswer();saveProgress();
    element('hint-text').classList.remove('hidden');
    feedback.textContent='⏰ Zeit abgelaufen. Kein Problem! Du kannst diese Frage jetzt ganz ohne Timer lösen.';
  }
}
function scheduleAutoAdvance() {
  cancelAutoAdvance();
  const active=session,at=session?.index;
  autoAdvanceHandle=setTimeout(()=>{
    autoAdvanceHandle=null;
    if(session!==active || session?.index!==at || !session.answeredThisTask ||
      element('view-play').classList.contains('hidden'))return;
    if(session.mode==='mixed')advanceMixedSession();
    else {session.index++;if(session.index>=TASKS_PER_MISSION)completeSession();else renderTask();}
  },650);
}
document.addEventListener('visibilitychange',()=>{
  if(questionClock){questionClock.paused=document.hidden;questionClock.lastTick=Date.now();}
});
