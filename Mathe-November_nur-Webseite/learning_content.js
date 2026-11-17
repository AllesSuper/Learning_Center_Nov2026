'use strict';
// Eigene, offline nutzbare Lerninhalte – keine externen Medien oder Modelle.
// Englisch bewusst sehr einfach: Grundwortschatz für den spielerischen Einstieg.
const ENGLISH_WORDS = [
  {en:'cat',de:'Katze',emoji:'🐱',group:'animals',from:1},
  {en:'dog',de:'Hund',emoji:'🐶',group:'animals',from:1},
  {en:'bird',de:'Vogel',emoji:'🐦',group:'animals',from:1},
  {en:'fish',de:'Fisch',emoji:'🐟',group:'animals',from:1},
  {en:'horse',de:'Pferd',emoji:'🐴',group:'animals',from:1},
  {en:'cow',de:'Kuh',emoji:'🐮',group:'animals',from:1},
  {en:'pig',de:'Schwein',emoji:'🐷',group:'animals',from:1},
  {en:'rabbit',de:'Kaninchen',emoji:'🐰',group:'animals',from:1},
  {en:'lion',de:'Löwe',emoji:'🦁',group:'animals',from:1},
  {en:'mouse',de:'Maus',emoji:'🐭',group:'animals',from:1},
  {en:'red',de:'Rot',emoji:'🟥',group:'colors',from:2},
  {en:'blue',de:'Blau',emoji:'🟦',group:'colors',from:2},
  {en:'green',de:'Grün',emoji:'🟩',group:'colors',from:2},
  {en:'yellow',de:'Gelb',emoji:'🟨',group:'colors',from:2},
  {en:'black',de:'Schwarz',emoji:'⬛',group:'colors',from:2},
  {en:'white',de:'Weiß',emoji:'⬜',group:'colors',from:2},
  {en:'orange',de:'Orange',emoji:'🟧',group:'colors',from:2},
  {en:'purple',de:'Lila',emoji:'🟪',group:'colors',from:2},
  {en:'one',de:'Eins',emoji:'1️⃣',group:'numbers',from:3},
  {en:'two',de:'Zwei',emoji:'2️⃣',group:'numbers',from:3},
  {en:'three',de:'Drei',emoji:'3️⃣',group:'numbers',from:3},
  {en:'four',de:'Vier',emoji:'4️⃣',group:'numbers',from:3},
  {en:'five',de:'Fünf',emoji:'5️⃣',group:'numbers',from:3},
  {en:'six',de:'Sechs',emoji:'6️⃣',group:'numbers',from:3},
  {en:'seven',de:'Sieben',emoji:'7️⃣',group:'numbers',from:3},
  {en:'eight',de:'Acht',emoji:'8️⃣',group:'numbers',from:3},
  {en:'apple',de:'Apfel',emoji:'🍎',group:'things',from:3},
  {en:'book',de:'Buch',emoji:'📖',group:'things',from:3},
  {en:'ball',de:'Ball',emoji:'⚽',group:'things',from:3},
  {en:'sun',de:'Sonne',emoji:'☀️',group:'things',from:3},
  {en:'moon',de:'Mond',emoji:'🌙',group:'things',from:3},
  {en:'water',de:'Wasser',emoji:'💧',group:'things',from:3},
  {en:'house',de:'Haus',emoji:'🏠',group:'things',from:3},
  {en:'tree',de:'Baum',emoji:'🌳',group:'things',from:3},
  {en:'hello',de:'Hallo',emoji:'👋',group:'phrases',from:4},
  {en:'goodbye',de:'Auf Wiedersehen',emoji:'👋',group:'phrases',from:4},
  {en:'thank you',de:'Danke',emoji:'🙏',group:'phrases',from:4},
  {en:'please',de:'Bitte',emoji:'🙂',group:'phrases',from:4},
  {en:'good morning',de:'Guten Morgen',emoji:'🌅',group:'phrases',from:4},
  {en:'good night',de:'Gute Nacht',emoji:'🌃',group:'phrases',from:4}
];
// Datei-Assets der Flaggen sind selbst erstellte SVG-Grafiken.
const FLAG_COUNTRIES = [
  {name:'Deutschland',id:'de',from:1},
  {name:'Frankreich',id:'fr',from:1},
  {name:'Italien',id:'it',from:1},
  {name:'Niederlande',id:'nl',from:1},
  {name:'Österreich',id:'at',from:1},
  {name:'Polen',id:'pl',from:1},
  {name:'Belgien',id:'be',from:2},
  {name:'Ukraine',id:'ua',from:2},
  {name:'Irland',id:'ie',from:2},
  {name:'Japan',id:'jp',from:2},
  {name:'Schweden',id:'se',from:3},
  {name:'Schweiz',id:'ch',from:3},
  {name:'Dänemark',id:'dk',from:3},
  {name:'Finnland',id:'fi',from:3},
  {name:'Luxemburg',id:'lu',from:3},
  {name:'Estland',id:'ee',from:3}
];
// Pro Schwierigkeitsgrad 2 Lesefragen + 3 spielerische Sprachaufgaben.
const GERMAN_EASY = [
  {level:1,label:'Lesespaß',context:'Mia hat einen roten Ball. Sie wirft ihn zu Ben. Ben fängt den Ball.',question:'Was hat Mia?',answer:'Einen Ball',options:['Einen Ball','Ein Buch','Ein Fahrrad','Einen Drachen'],hint:'Lies den ersten Satz noch einmal.',explanation:'Im ersten Satz steht, dass Mia einen Ball hat.'},
  {level:1,label:'Lesespaß',context:'Der Hund Bello liegt im Garten. Er hört einen Vogel und spitzt die Ohren.',question:'Wo liegt Bello?',answer:'Im Garten',options:['Im Garten','Im Auto','Im Bett','Im Wald'],hint:'Schau auf den ersten Satz.',explanation:'Bello liegt im Garten.'},
  {level:1,label:'Lesespaß',context:'Leo malt einen Stern. Danach klebt er ihn an das Fenster.',question:'Was malt Leo?',answer:'Einen Stern',options:['Einen Stern','Ein Haus','Ein Boot','Einen Baum'],hint:'Achte auf das Wort nach „einen“.',explanation:'Leo malt einen Stern.'},
  {level:1,label:'Silbenklatschen',context:'Sprich „Sonne“ und klatsche die Silben.',question:'Wie viele Silben hat „Son-ne“?',answer:'2',options:['1','2','3','4'],hint:'Sprich langsam: Son – ne.',explanation:'„Sonne“ hat zwei Silben: Son-ne.'},
  {level:1,label:'Silbenklatschen',context:'Sprich „Banane“ in Silben.',question:'Wie viele Silben hat „Ba-na-ne“?',answer:'3',options:['1','2','3','4'],hint:'Klatsche bei jedem Wortstück einmal.',explanation:'„Banane“ hat drei Silben: Ba-na-ne.'},
  {level:1,label:'Wörter-Zauber',context:'Ein Tier macht „miau“.',question:'Welches Wort ist richtig geschrieben?',answer:'Katze',options:['Katze','Kaze','Katse','Katte'],hint:'Höre in der Mitte auf den Laut „tz“.',explanation:'„Katze“ schreibt man mit tz.'},
  {level:1,label:'Wörter-Zauber',context:'Ein Hund kann laut ...',question:'Welches Wort ist richtig geschrieben?',answer:'bellen',options:['bellen','belen','belln','bälen'],hint:'Das Wort hat zwei gleiche Buchstaben in der Mitte.',explanation:'„bellen“ schreibt man mit zwei l.'},
  {level:1,label:'Groß oder klein?',context:'Ein Nomen ist der Name für etwas, z. B. ein Tier.',question:'Welches Wort ist richtig geschrieben?',answer:'Hund',options:['Hund','hund','HUNDd','hunD'],hint:'Tiernamen schreibt man als Nomen groß.',explanation:'„Hund“ ist ein Nomen und beginnt mit H.'},
  {level:2,label:'Lesespaß',context:'Lara hat zwei Äpfel. Einen isst sie selbst. Den anderen gibt sie ihrem Bruder.',question:'Wem gibt Lara einen Apfel?',answer:'Ihrem Bruder',options:['Ihrem Bruder','Ihrer Oma','Ihrer Freundin','Ihrer Lehrerin'],hint:'Lies den letzten Satz.',explanation:'Den zweiten Apfel gibt Lara ihrem Bruder.'},
  {level:2,label:'Lesespaß',context:'Auf dem Schulweg sieht Finn eine Pfütze. Er springt darüber. Seine Schuhe bleiben trocken.',question:'Warum bleiben Finns Schuhe trocken?',answer:'Er springt über die Pfütze.',options:['Er springt über die Pfütze.','Er trägt Gummistiefel.','Es regnet nicht.','Er läuft nach Hause.'],hint:'Was macht Finn mit der Pfütze?',explanation:'Finn springt über die Pfütze statt hineinzutreten.'},
  {level:2,label:'Satzzeichen',context:'Jemand möchte wissen, wo du wohnst.',question:'Welcher Satz endet richtig?',answer:'Wo wohnst du?',options:['Wo wohnst du?','Wo wohnst du.','Wo wohnst du!','Wo wohnst du,'],hint:'Denk an das Satzzeichen für eine Frage.',explanation:'Fragen enden mit einem Fragezeichen.'},
  {level:2,label:'Wörter-Zauber',context:'Ein Tier mit langen Ohren.',question:'Welches Wort ist richtig geschrieben?',answer:'Hase',options:['Hase','Hahse','Hasse','Hässe'],hint:'Sprich das a lang.',explanation:'„Hase“ schreibt man mit einem a und nur einem s.'},
  {level:2,label:'Nomen-Detektiv',context:'Zu Nomen passen der, die oder das.',question:'Welches Wort ist ein Nomen?',answer:'Blume',options:['Blume','blühen','bunt','schnell'],hint:'Überlege, bei welchem Wort „die“ passt.',explanation:'„Die Blume“ ist ein Nomen.'},
  {level:3,label:'Lesespaß',context:'Im Park findet Mila einen Schlüssel. Sie bringt ihn zum Fundbüro. Am nächsten Tag holt ein Mann seinen Schlüssel dort ab.',question:'Wohin bringt Mila den Schlüssel?',answer:'Zum Fundbüro',options:['Zum Fundbüro','In die Schule','Zum Bäcker','Nach Hause'],hint:'Wo gibt man gefundene Dinge ab?',explanation:'Mila bringt den Schlüssel zum Fundbüro.'},
  {level:3,label:'Lesespaß',context:'Tom baut eine Burg aus Sand. Ein großer Windstoß zerstört eine Mauer. Tom holt Wasser, damit der Sand besser hält.',question:'Warum holt Tom Wasser?',answer:'Damit die Burg besser hält.',options:['Damit die Burg besser hält.','Damit er trinken kann.','Damit er schwimmen kann.','Damit der Sand trocknet.'],hint:'Achte auf „damit“ im letzten Satz.',explanation:'Feuchter Sand hält besser zusammen.'},
  {level:3,label:'Wortarten',context:'Ein Verb zeigt, was jemand tut.',question:'Welches Wort ist ein Verb?',answer:'rennen',options:['rennen','der Weg','laut','das Rad'],hint:'Was kannst du selbst tun?',explanation:'„Rennen“ nennt eine Tätigkeit.'},
  {level:3,label:'Wortarten',context:'Wörter wie „fröhlich“ beschreiben Dinge und Gefühle.',question:'Welches Wort ist ein Adjektiv?',answer:'leise',options:['leise','der Hund','schlafen','der Stuhl'],hint:'Welches Wort beschreibt, wie etwas ist?',explanation:'„Leise“ beschreibt, wie etwas klingt.'},
  {level:3,label:'Wörter entdecken',context:'Gegenteile haben unterschiedliche Bedeutungen.',question:'Was ist das Gegenteil von „kalt“?',answer:'warm',options:['warm','kühl','frostig','eisig'],hint:'Denk an eine heiße Tasse Kakao.',explanation:'„Warm“ ist das Gegenteil von „kalt“.'}
];

// Etwas längere Leseabenteuer erst nach mehreren sicher gemeisterten Stufen.
const GERMAN_BONUS = [
  {label:'Lesedetektive',context:'Nora pflanzt im Frühling drei Sonnenblumensamen in ihren Garten. Jeden Abend gießt sie die Erde. Nach vielen Tagen wachsen kleine grüne Blätter. Im Sommer blühen die Pflanzen gelb.',question:'Warum gießt Nora die Erde?',answer:'Damit die Pflanzen wachsen.',options:['Damit die Pflanzen wachsen.','Damit es im Garten kälter wird.','Damit die Samen verschwinden.','Damit der Boden zu Stein wird.'],hint:'Überlege, was eine Pflanze zum Wachsen braucht.',explanation:'Pflanzen brauchen unter anderem Wasser zum Wachsen.'},
  {label:'Lesedetektive',context:'Jona möchte seinen Freund Amir überraschen. Er faltet ein Papierboot und schreibt einen Gruß darauf. Dann legt er es vor Amirs Haustür. Als Amir das Boot findet, muss er lächeln.',question:'Was zeigt, dass sich Amir freut?',answer:'Er lächelt.',options:['Er lächelt.','Er läuft weg.','Er versteckt das Boot.','Er macht die Tür zu.'],hint:'Achte auf die letzte Handlung in der Geschichte.',explanation:'Amirs Lächeln zeigt, dass er sich freut.'},
  {label:'Lesedetektive',context:'Im Tierheim wartet ein kleiner Hund auf ein neues Zuhause. Eines Tages besucht ihn eine Familie. Sie geht mit ihm spazieren und spielt mit ihm. Am nächsten Tag holt die Familie ihn ab.',question:'Was passiert am nächsten Tag?',answer:'Die Familie holt den Hund ab.',options:['Die Familie holt den Hund ab.','Der Hund zieht in den Wald.','Das Tierheim schließt.','Der Hund fährt alleine weg.'],hint:'Lies den letzten Satz noch einmal.',explanation:'Am nächsten Tag holt die Familie den Hund aus dem Tierheim.'}
];
