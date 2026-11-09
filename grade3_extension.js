'use strict';
// Klasse 3 – zusätzliche Lerninhalte. Originalgeneratoren und Spielstände bleiben erhalten.
const G3_VERSION='grade3-20261109';
function g3Options(answer,max){
  const picks=[answer],put=n=>{if(Number.isInteger(n)&&n>=0&&n<=max&&!picks.includes(n))picks.push(n)};
  for(const n of shuffle(Array.from({length:Math.floor(max/10)+1},(_,i)=>i*10+answer%10))){
    if(Math.abs(n-answer)<=200)put(n);if(picks.length>=4)break;
  }
  for(const d of shuffle([10,-10,100,-100,1,-1,20,-20,50,-50,9,-9,11,-11,90,-90,2,-2])){
    put(answer+d);if(picks.length>=8)break;
  }
  for(let i=0;picks.length<8&&i<=max;i++)put(i);
  return shuffle(picks.slice(0,8).map(String));
}
function g3Math(kind,level){
  const lv=Math.min(7,Math.max(1,level));
  let a,b,result,label,context='',question,hint,explanation;
  if(kind==='add1000'){
    a=lv<=2?10*int(12,65):int(140,760);
    b=lv<=2?10*int(3,Math.min(25,Math.floor((1000-a)/10))):int(45,Math.min(290,1000-a));
    result=a+b;label='Plus bis 1.000';question='Was ergibt '+a+' + '+b+'?';
    hint='Zerlege beide Zahlen in Hunderter, Zehner und Einer.';
    explanation=a+' + '+b+' = '+result+'.';
  }else if(kind==='sub1000'){
    a=lv<=2?10*int(30,95):int(360,999);
    b=lv<=2?10*int(4,Math.floor(a/10)-9):int(75,a-70);
    result=a-b;label='Minus bis 1.000';question='Was ergibt '+a+' − '+b+'?';
    hint='Ziehe erst die Hunderter, dann Zehner und Einer ab.';
    explanation=a+' − '+b+' = '+result+'.';
  }else if(kind==='place1000'){
    a=int(2,9);b=int(1,9);const ones=lv<=2?0:int(1,9);
    result=a*100+b*10+ones;label='Stellenwert-Detektiv';
    context='Eine Zahl hat '+a+' Hunderter, '+b+' Zehner und '+ones+' Einer.';
    question='Welche Zahl ist gemeint?';hint='Hunderter zählen 100, Zehner zählen 10.';
    explanation='Die Zahl lautet '+result+'.';
  }else if(kind==='pattern1000'){
    b=shuffle(lv<=2?[10,20,50,100]:[15,25,40,50,75,100])[0];
    a=b*int(2,Math.floor((1000-b*4)/b));
    result=a+b*3;label='Zahlenmuster';context='Zahlenfolge: '+a+', '+(a+b)+', '+(a+b*2)+', ?';
    question='Welche Zahl setzt die Reihe fort?';
    hint='Berechne den Abstand zwischen zwei Zahlen.';
    explanation='Die Reihe wächst immer um '+b+'. Die nächste Zahl ist '+result+'.';
  }else if(kind==='story1000'){
    a=int(3,9);b=int(3,10);result=a*b;
    label='Einmaleins im Alltag';context='In '+a+' Schachteln liegen je '+b+' Karten.';
    question='Wie viele Karten sind das zusammen?';
    hint='Bei gleich großen Gruppen hilft die Malrechnung.';
    explanation=a+' × '+b+' = '+result+' Karten.';
  }else throw Error('Unbekanntes Klasse-3-Thema');
  return {label,context,question,answer:String(result),options:g3Options(result,kind==='story1000'?110:1000),
    hint,explanation,reviewKey:'g3:math:'+kind,mathKind:kind,operandA:a,operandB:b};
}
const g3OldMathTask=createMathSkillTask;
createMathSkillTask=function(kind,level,row){
  return ['add1000','sub1000','place1000','pattern1000','story1000'].includes(kind)?g3Math(kind,level):g3OldMathTask(kind,level,row);
};
makeMathLevelTasks=function(level){
  return shuffle([createMathSkillTask('mul',level),createMathSkillTask('div',level),
    g3Math('add1000',level),g3Math('sub1000',level),
    g3Math(shuffle(['place1000','pattern1000','story1000'])[0],level)]);
};
// Lesetexte und Sprache für die dritte Klasse. Jeder Datensatz hat eine einzige eindeutige Lösung.
const G3_DE_ROWS=[
['haus',1,'Lesedetektive','Nika baut mit ihrem Opa ein Vogelhaus. Sie messen zuerst die Holzbretter. Später hängen sie das Haus geschützt unter das Dach.','Warum hängt das Vogelhaus unter dem Dach?','Damit es vor Regen geschützt ist',['Damit es schneller wächst','Damit es besser schaukelt','Damit es bunt wird'],'Lies den letzten Satz.'],
['museum',1,'Lesedetektive','Die Klasse besucht das Naturmuseum. Auf dem Plan steht: Fossilien sind im zweiten Stock, Steine im ersten. Die Kinder möchten zuerst Fossilien sehen.','Wohin geht die Klasse zuerst?','In den zweiten Stock',['In den ersten Stock','In den Garten','In den Keller'],'Vergleiche den Museumsplan mit dem Wunsch der Kinder.'],
['bus',1,'Lesedetektive','Der Schulbus fährt sonst um 7:30 Uhr. Heute beginnt der Unterricht eine halbe Stunde später. Deshalb fährt auch der Bus erst um 8:00 Uhr.','Warum fährt der Bus später?','Weil der Unterricht später beginnt',['Weil der Bus kaputt ist','Weil heute Ferien sind','Weil die Straße gesperrt ist'],'Im Text steht der Grund direkt vor dem Wort deshalb.'],
['pflanze',2,'Lesedetektive','Milo gießt die Bohnenpflanze jeden Abend. Heute regnet es stark. Als er die Erde prüft, merkt er, dass sie noch feucht ist, und stellt die Gießkanne zurück.','Warum gießt Milo heute nicht?','Die Erde ist noch nass',['Die Pflanze ist verschwunden','Die Gießkanne ist kaputt','Er hat kein Wasser mehr'],'Überlege, was Regen mit der Erde macht.'],
['buecherei',2,'Lesedetektive','Lena hat ein Buch für zwei Wochen ausgeliehen. Nach zehn Tagen ist sie fertig. Sie bringt es schon jetzt zurück, damit andere es lesen können.','Was zeigt Lenas Verhalten?','Sie denkt an andere',['Sie mag keine Bücher','Sie hat das Buch verloren','Sie musste eine Strafe zahlen'],'Warum gibt sie das Buch früher zurück?'],
['spuren',3,'Lesedetektive','Robin entdeckt zwei Reihen Pfotenabdrücke im Schnee. Die Spuren führen zur Gartenmauer. Daneben liegt ein umgestürzter Futternapf.','Was deutet auf einen Tierbesuch hin?','Die Spuren und der Napf',['Der blaue Himmel','Die Küchentür','Das warme Zimmer'],'Verbinde zwei Hinweise aus dem Text.'],
['schulgarten',3,'Lesedetektive','Sechs Kinder arbeiten im Schulgarten. Zwei lockern die Erde, zwei setzen Pflanzen und zwei holen Wasser. Später tauschen sie die Aufgaben, damit alle Neues lernen.','Warum wechseln die Kinder die Aufgaben?','Damit alle verschiedene Arbeiten lernen',['Damit niemand arbeitet','Weil die Erde trocken ist','Weil die Schule schließt'],'Achte auf den letzten Teilsatz.'],
['spendenlauf',4,'Lesedetektive','Die Klasse veranstaltet einen Spendenlauf. Für jede gelaufene Runde gibt es eine kleine Spende. Am Ende geht das gesammelte Geld an ein Tierheim.','Welche Überschrift passt am besten?','Kinder laufen für Tiere',['Ein neues Klassenzimmer','Der große Fußballpreis','Ein Ausflug zum See'],'Suche die wichtigste Aussage des ganzen Textes.'],
['kunst',5,'Lesedetektive','Im Rathaus stellen Kinder Bilder aus wiederverwendeten Verpackungen aus. Unter jedem Bild erklärt ein Schild, welche Materialien benutzt wurden und warum man sie nicht wegwerfen muss.','Welche Idee vermittelt die Ausstellung?','Aus Altem kann Neues entstehen',['Nur neue Dinge sind schön','Bilder dürfen nicht aufgehängt werden','Verpackungen gehören ins Meer'],'Achte auf die Wiederverwendung der Materialien.'],
['plural',1,'Wörterwerkstatt','Das Wort Rucksack steht hier in der Einzahl.','Wie lautet die Mehrzahl von Rucksack?','Rucksäcke',['Rucksacke','Rucksacks','Ruckssäcke'],'Sprich die Mehrzahl und achte auf den Umlaut.'],
['verb',1,'Wortarten','Satz: Die Kinder sammeln Kastanien.','Welches Wort ist das Verb?','sammeln',['Kinder','Kastanien','die'],'Was tun die Kinder?'],
['adjektiv',1,'Wortarten','Satz: Ein mutiger Igel überquert den Weg.','Welches Wort ist ein Adjektiv?','mutiger',['Igel','Weg','überquert'],'Welches Wort beschreibt den Igel?'],
['alphabet',1,'Wörterbuch','Wörter stehen im Wörterbuch alphabetisch.','Welches Wort steht zuerst?','Birne',['Blume','Brot','Bus'],'Vergleiche den zweiten Buchstaben.'],
['freund',1,'Rechtschreibung','Achte auf die richtige Schreibweise.','Welches Wort ist richtig geschrieben?','Freundschaft',['Froindschaft','Fräundschaft','Freuntschaft'],'Denke an das Wort Freund.'],
['ging',2,'Zeitformen','Vergangene Erlebnisse kann man in der Vergangenheit erzählen.','Wie heißt die Vergangenheit (Präteritum) von gehen?','ging',['geht','gehen','gehe'],'Erinnere dich an eine Erzählung über gestern.'],
['gespielt',2,'Zeitformen','Vergangenes lässt sich mit hat oder ist ausdrücken.','Welcher Satz steht im Perfekt?','Mia hat gespielt.',['Mia spielt.','Mia spielte.','Mia wird spielen.'],'Suche nach hat und einem Partizip.'],
['hoeher',2,'Adjektive','Eigenschaften können wir vergleichen.','Wie steigert man hoch?','höher',['hocher','hochst','höhest'],'Vergleiche zwei unterschiedlich hohe Türme.'],
['rennen',2,'Rechtschreibung','Kurze betonte Vokale stehen häufig vor doppelten Mitlauten.','Wie schreibt man das Wort richtig?','rennen',['renen','reenen','rennn'],'Sprich das kurze e.'],
['familie',2,'Wortfamilien','Verwandte Wörter haben einen gemeinsamen Stamm.','Welches Wort gehört zur Wortfamilie fahren?','Fahrzeug',['Faden','Farbe','Ferne'],'Welche Wortteile und Bedeutungen gehören zusammen?'],
['subjekt',3,'Satzglieder','Am Morgen füttert Ben seinen Hund.','Wer füttert den Hund?','Ben',['Morgen','Hund','füttert'],'Frage Wer oder was?'],
['praedikat',3,'Satzglieder','Das Eichhörnchen versteckt seine Nüsse.','Welches Wort ist das Prädikat?','versteckt',['Eichhörnchen','Nüsse','seine'],'Suche das Tätigkeitswort im Satz.'],
['regenbogen',3,'Wortbildung','Ein zusammengesetztes Nomen besteht aus mehreren Wörtern.','Woraus setzt sich Regenbogen zusammen?','Regen und Bogen',['Regen und Baum','Regal und Bogen','Riegel und Boden'],'Teile das lange Wort in sinnvolle Bestandteile.'],
['rede',4,'Zeichensetzung','Luca ruft: „Wir haben gewonnen!“','Was steht vor der wörtlichen Rede?','Ein Doppelpunkt',['Ein Punkt','Ein Fragezeichen','Ein Komma'],'Schau direkt hinter ruft.'],
['spielen',4,'Rechtschreibung','Beim langen i hilft oft ie.','Welches Wort ist richtig geschrieben?','spielen',['spilen','schpielen','spielenn'],'Achte auf die erste Silbe.'],
['gegensatz',5,'Textverständnis','Die Kinder wollten draußen spielen, doch plötzlich begann es zu hageln. Sie blieben im Zimmer.','Welches Wort zeigt den Gegensatz?','doch',['plötzlich','spielen','Zimmer'],'Wo ändert sich der ursprüngliche Plan?']
];
function g3GermanTask(row){
  return {label:row[2],context:row[3],question:row[4],answer:row[5],
    options:[row[5],...row[6]],hint:row[7],explanation:row[5]+' – das ist die passende Lösung.',
    reviewKey:'g3:de:'+row[0],g3Level:row[1]};
}
const G3_DE=G3_DE_ROWS.map(g3GermanTask);
makeGermanLevelTasks=function(level){
  const pool=G3_DE.filter(x=>x.g3Level<=level);
  const text=shuffle(pool.filter(x=>x.label==='Lesedetektive')).slice(0,2);
  const other=shuffle(pool.filter(x=>x.label!=='Lesedetektive')).slice(0,3);
  return shuffle([...text,...other].map(copyTask));
};
// Klasse-3-Englisch: kurze Alltagsdialoge und passende Schulsachen.
ENGLISH_WORDS.push(
{en:'teacher',de:'Lehrerin oder Lehrer',emoji:'👩‍🏫',group:'school',from:1},
{en:'pencil',de:'Bleistift',emoji:'✏️',group:'school',from:1},
{en:'desk',de:'Schreibtisch',emoji:'🪑',group:'school',from:1},
{en:'bag',de:'Tasche',emoji:'🎒',group:'school',from:1},
{en:'ruler',de:'Lineal',emoji:'📏',group:'school',from:2},
{en:'mother',de:'Mutter',emoji:'👩',group:'family',from:1},
{en:'father',de:'Vater',emoji:'👨',group:'family',from:1},
{en:'sister',de:'Schwester',emoji:'👧',group:'family',from:2},
{en:'brother',de:'Bruder',emoji:'👦',group:'family',from:2},
{en:'bread',de:'Brot',emoji:'🍞',group:'food',from:2},
{en:'cheese',de:'Käse',emoji:'🧀',group:'food',from:2},
{en:'milk',de:'Milch',emoji:'🥛',group:'food',from:2},
{en:'banana',de:'Banane',emoji:'🍌',group:'food',from:2},
{en:'rain',de:'Regen',emoji:'🌧️',group:'weather',from:3},
{en:'snow',de:'Schnee',emoji:'❄️',group:'weather',from:3},
{en:'wind',de:'Wind',emoji:'💨',group:'weather',from:3},
{en:'cloud',de:'Wolke',emoji:'☁️',group:'weather',from:3});
const G3_EN=[
['name',1,'What is your name?','Wie heißt du?',['Wo wohnst du?','Wie alt bist du?','Was magst du?']],
['hello',1,'How are you?','Wie geht es dir?',['Wie heißt du?','Wie spät ist es?','Wo ist die Schule?']],
['thanks',1,'Thank you!','Danke!',['Guten Abend!','Auf Wiedersehen!','Bitte leise!']],
['morning',1,'Good morning!','Guten Morgen!',['Gute Nacht!','Bis morgen!','Guten Appetit!']],
['introduce',2,'My name is Mia.','Ich heiße Mia.',['Ich suche Mia.','Ich sehe Mia.','Ich spiele mit Mia.']],
['book',2,'This is my book.','Das ist mein Buch.',['Das ist mein Ball.','Ich lese ein Buch.','Das Buch ist blau.']],
['please',2,'Please sit down.','Bitte setz dich hin.',['Bitte steh auf.','Bitte schau her.','Bitte komm herein.']],
['red',3,'The ball is red.','Der Ball ist rot.',['Der Ball ist blau.','Der Ball ist groß.','Der Ball ist rund.']],
['cat',3,'I like cats.','Ich mag Katzen.',['Ich habe eine Katze.','Ich suche Katzen.','Ich male Katzen.']],
['dog',3,'I have a dog.','Ich habe einen Hund.',['Ich sehe einen Hund.','Ich mag Hunde.','Ich suche einen Hund.']],
['rain',4,'It is raining.','Es regnet.',['Es schneit.','Es ist sonnig.','Es ist windig.']],
['hungry',4,'I am hungry.','Ich habe Hunger.',['Ich bin müde.','Ich bin durstig.','Ich bin glücklich.']]
];
function g3EnglishTask(row){
 return {label:'Englisch im Alltag',context:'Höre den Satz und wähle die richtige Bedeutung.',
 question:'Was bedeutet „'+row[2]+'“?',answer:row[3],options:shuffle([row[3],...row[4]]),
 hint:'Höre dir den Satz an und achte auf bekannte Wörter.',explanation:'„'+row[2]+'“ bedeutet „'+row[3]+'“. ',
 speakText:row[2],speechLang:'en-GB',postAnswerSpeak:row[2],reviewKey:'g3:en:'+row[0]};
}
const g3OldEnglish=makeEnglishTasks;
makeEnglishTasks=function(level){
 const words=g3OldEnglish(level).slice(0,3);
 const dialogs=shuffle(G3_EN.filter(x=>x[1]<=level)).slice(0,2);
 return shuffle([...words,...dialogs.map(g3EnglishTask)]);
};
// Fehlerkarten aus dem neuen Lernniveau wiederholen echte oder ähnliche Aufgaben.
const g3OldReview=makeReviewTask;
makeReviewTask=function(entry){
 // Keine zu schweren Fehlerkarten erzwingen, falls ein Lernniveau gesunken ist.
 if(progress.skills[entry.subject]?.level<entry.level)return null;
 const old=g3OldReview(entry);if(old)return old;
 let task=null;
 if(entry.subject==='math'&&entry.key.startsWith('g3:math:')){
   const kind=entry.key.slice(8);
   if(['add1000','sub1000','place1000','pattern1000','story1000'].includes(kind))task=g3Math(kind,entry.level);
 }else if(entry.subject==='german'&&entry.key.startsWith('g3:de:')){
   const t=G3_DE.find(x=>x.reviewKey===entry.key);
   task=t?copyTask(t):entry.key==='g3:de:reading-spur'?g3FreshReading():null;
 }else if(entry.subject==='english'&&entry.key.startsWith('g3:en:')){
   const row=G3_EN.find(x=>'g3:en:'+x[0]===entry.key);if(row)task=g3EnglishTask(row);
 }
 return task?{...task,subject:entry.subject,studyLevel:entry.level,reviewTask:true,reviewKey:entry.key}:null;
};
function g3FreshReading(){
 const names=shuffle(['Mia','Ben','Lina','Nora','Finn','Tom','Mara','Jonas']);
 const places=shuffle([['im Schulgarten','Pflanzen','gießen'],['in der Bücherei','Bücher','sortieren'],['im Tierheim','Futternäpfe','reinigen']]);
 const p=places[0];
 return {label:'Lesedetektive',context:names[0]+' und '+names[1]+' helfen '+p[0]+'. Sie möchten '+p[1]+' '+p[2]+'. Als Material fehlt, fragen sie eine erwachsene Person um Hilfe. Danach arbeiten sie gemeinsam weiter.',
 question:'Was machen die Kinder, als etwas fehlt?',answer:'Sie fragen eine erwachsene Person.',
 options:shuffle(['Sie fragen eine erwachsene Person.','Sie gehen sofort nach Hause.','Sie verstecken das Material.','Sie geben alles auf.']),
 hint:'Lies den dritten Satz aufmerksam.',explanation:'Sie holen sich Hilfe und arbeiten weiter.',reviewKey:'g3:de:reading-spur'};
}
newGermanReadingTask=g3FreshReading;
const g3OldFresh=makeFreshMixedReplacement;
makeFreshMixedReplacement=function(state,slot){
 const old=state.tasks[slot];if(old.subject!=='german')return g3OldFresh(state,slot);
 const level=progress.skills.german.level;
 const normalize=t=>({...copyTask(t),subject:'german',studyLevel:level,reviewTask:false,timerSeconds:old.timerSeconds});
 for(let trial=0;trial<100;trial++){
   for(const candidate of [...shuffle(G3_DE.filter(t=>t.g3Level<=level)),g3FreshReading()]){
     const t=normalize(candidate);if(mixedTaskAllowed(state,t,slot))return t;
   }
 }
 return g3OldFresh(state,slot);
};