'use strict';
// Klasse 3: additive Aufgabenvarianz, lokale Wiederholungsvermeidung.
// Bestehende Flaggen, Spielstände, Belohnungen und Fehlerkartei bleiben erhalten.
const VARIETY_VERSION='variety-20261115';
const VARIETY_STORAGE='lernabenteuer-variety-v9';
const VARIETY_HISTORY=(()=>{
  try {const v=JSON.parse(localStorage.getItem(VARIETY_STORAGE)||'{}');return v&&typeof v==='object'?v:{};}
  catch(_){return {};}
})();
function varietyChoose(pool,group,id){
  if(!pool.length)throw Error('Leerer Aufgabenpool: '+group);
  const seen=Array.isArray(VARIETY_HISTORY[group])?VARIETY_HISTORY[group]:[];
  const order=shuffle(pool).sort((a,b)=>seen.indexOf(id(a))-seen.indexOf(id(b)));
  const chosen=order[0],key=id(chosen);
  VARIETY_HISTORY[group]=[...seen.filter(x=>x!==key),key].slice(-250);
  try{localStorage.setItem(VARIETY_STORAGE,JSON.stringify(VARIETY_HISTORY));}catch(_){}
  return chosen;
}
function varietyTask(label,context,question,answer,wrong,reviewKey,hint,extra={}){
  const options=shuffle([String(answer),...wrong.map(String)]);
  if(options.length!==4||new Set(options).size!==4)throw Error('Unklare Auswahl: '+reviewKey);
  return {label,context,question,answer:String(answer),options,hint,
    explanation:'Richtig: '+answer+'.',reviewKey,...extra};
}
// 44 eigenständige kurze Sach- und Lesegeschichten für die 3. Klasse.
// id | Lesetext | Frage | richtige Antwort | 3 geprüfte falsche Antworten | Stufe
const VARIETY_READINGS=[
['regen','Auf dem Weg zum Sportplatz beginnt es zu regnen. Die Kinder stellen sich unter das Dach der Turnhalle. Erst als die Wolken weiterziehen, spielen sie weiter.','Warum bleiben die Rucksäcke trocken?','Sie stehen unter dem Dach','Sie liegen im Wasser','Die Sonne trocknet sie sofort','Alle sind im Bus',1],
['igel','Amira beobachtet im Herbst einen Igel zwischen den Blättern. Sie lässt das Tier in Ruhe und erzählt später ihrer Familie davon.','Wie verhält sich Amira?','Sie stört den Igel nicht','Sie nimmt ihn in die Schule','Sie jagt ihn fort','Sie setzt ihn ins Wasser',1],
['brief','Ein Brief wurde falsch eingeworfen. Auf dem Umschlag steht Hausnummer zwölf, aber Noah wohnt in Hausnummer zehn. Er bringt ihn zum richtigen Haus.','Woran erkennt Noah die Verwechslung?','An der Hausnummer','An seinen Schuhen','Am Wetter','An der Größe der Briefmarke',1],
['rad','Vor der Fahrradtour bemerkt Lotte, dass der Reifen kaum Luft hat. Gemeinsam mit ihrem Vater pumpt sie ihn auf. Dann startet die Tour.','Was macht Lotte vor der Tour?','Sie pumpt den Reifen auf','Sie kauft ein neues Fahrrad','Sie läuft zur Schule','Sie verkauft den Helm',1],
['samen','Die Klasse sät Kresse in zwei Schalen. Eine steht am Fenster, die andere im dunklen Schrank. Beide bekommen gleich viel Wasser.','Was unterscheidet die Schalen?','Der Standort mit oder ohne Licht','Die Samenart','Die Wassermenge','Die Menge Erde',2],
['uhr','Die Bücherei öffnet um neun Uhr. Finn kommt zehn Minuten früher an, liest den Aushang und wartet vor der Tür.','Wann kommt Finn an?','Um 8:50 Uhr','Um 9:10 Uhr','Um 10 Uhr','Um 8:10 Uhr',2],
['buehne','Emilia übt ein Gedicht für das Schulfest. Sie spricht langsam und macht an Satzzeichen kurze Pausen. Bei der Aufführung klappt es gut.','Welche Methode hilft beim Vortrag?','Langsam sprechen und Pausen machen','So schnell wie möglich sprechen','Den Text rückwärts lesen','Die ganze Zeit schweigen',2],
['baecker','Beim Bäcker steht ein Schild: Vollkornbrot gibt es heute ab elf Uhr. Ben kommt schon um zehn, möchte aber genau dieses Brot. Er kommt später zurück.','Warum kehrt Ben zurück?','Das Brot gibt es erst ab elf Uhr','Er hat seine Schuhe vergessen','Der Laden hat Ferien','Er möchte keine Brötchen',1],
['see','Am See beobachtet Lea Enten. Sie findet eine leere Dose im Gras und wirft sie in den Abfallbehälter. Danach setzt sie sich auf eine Bank.','Was hilft der Natur?','Die Dose richtig entsorgen','Die Enten anschreien','Im Gras herumtrampeln','Den See verlassen',1],
['kompass','Auf der Karte liegt ein See östlich vom Parkplatz. Die Gruppe folgt dem Weg nach Osten und sieht bald das Wasser zwischen den Bäumen.','In welche Richtung wandert die Gruppe?','Osten','Westen','Norden','Süden',2],
['foto','Joris nimmt an einem Naturfotowettbewerb teil. Seine Lehrerin erklärt, dass das Tier auf dem Bild gut erkennbar sein soll. Er wählt ein scharfes Foto eines Marienkäfers.','Warum wählt Joris dieses Foto?','Das Tier ist deutlich zu erkennen','Es ist das älteste Bild','Das Foto ist ganz dunkel','Die Kamera ist besonders neu',2],
['katze','Die Nachbarn verreisen drei Tage lang. Sam gibt ihrer Katze jeden Morgen frisches Wasser und Futter. Anschließend kontrolliert er, ob alles in Ordnung ist.','Welche Verantwortung übernimmt Sam?','Er versorgt die Katze','Er renoviert die Wohnung','Er kauft ein Haustier','Er schreibt eine Zeitung',1],
['stadtplan','Mats vergleicht zwei Wege zur Schwimmhalle. Der kürzere führt über eine viel befahrene Straße ohne Ampel. Er wählt den längeren Weg mit Fußgängerüberweg.','Warum nimmt Mats den längeren Weg?','Er kann dort sicherer überqueren','Er möchte sich verlaufen','Er hat keine Uhr','Er möchte nicht schwimmen',2],
['licht','Auf dem Heimweg wird es früh dunkel. Aylin schaltet das Vorder- und Rücklicht ihres Fahrrads ein. Andere Verkehrsteilnehmer sehen sie dadurch besser.','Wozu dient das Fahrradlicht?','Damit andere Aylin besser sehen','Damit das Rad schneller fährt','Damit Reifen nicht platzen','Damit sie Musik hören kann',1],
['frost','Nach einer Nacht mit Frost ist die Pfütze auf dem Schulhof gefroren. Am Nachmittag scheint die Sonne und das Eis taut langsam.','Was passiert beim Tauen?','Das Eis wird zu Wasser','Das Eis wird zu Sand','Das Eis wird zu Holz','Das Eis wird zu Stein',2],
['trommel','Julia soll in der Musikstunde trommeln. Sie spielt zuerst einen Schlag zu früh. Beim zweiten Versuch hört sie genauer zu und passt sich der Gruppe an.','Wie verbessert Julia sich?','Sie achtet stärker auf den Rhythmus','Sie trommelt noch schneller','Sie verlässt die Gruppe','Sie versteckt das Instrument',2],
['rucksack','Ole packt für den Ausflug Trinkflasche, Pausenbrot und Regenjacke ein. Den schweren Fußball lässt er zu Hause, weil er ihn nicht braucht.','Warum nimmt Ole den Fußball nicht mit?','Er benötigt ihn nicht','Er hat ihn verloren','Er darf nichts essen','Der Ball ist kaputt',1],
['sachbuch','Kaya sucht in der Bibliothek ein Buch über Planeten. Sie findet mehrere Sachbücher und vergleicht ihre Inhaltsverzeichnisse. Erst dann entscheidet sie sich.','Was hilft Kaya bei der Auswahl?','Das Inhaltsverzeichnis','Das Gewicht der Bücher','Der Preis der Bücher','Die Farbe des Regals',3],
['schatten','Paul zeichnet mittags den Schatten eines Baums mit Kreide nach. Zwei Stunden später sieht er, dass der Schatten anders liegt.','Was hat Paul entdeckt?','Der Schatten hat seine Lage verändert','Der Baum ist verschwunden','Die Kreide ist blau geworden','Der Boden ist höher geworden',3],
['notruf','Im Sachunterricht sprechen die Kinder darüber, wie man bei einem Notfall Hilfe holt. Sie üben, die Nummer 112 zu nennen und ruhig die wichtigen Informationen mitzuteilen.','Wofür braucht man die Nummer 112?','Um im Notfall Hilfe zu rufen','Um Bücher zu bestellen','Um die Uhrzeit zu erfahren','Um einen Film zu schauen',2],
['waldweg','Eine Gruppe wandert im Wald. An einer Kreuzung liest Tessa den Wegweiser und vergleicht die Richtung mit ihrer Karte. Erst dann gehen alle weiter.','Was tut Tessa an der Kreuzung?','Sie prüft die Richtung','Sie wirft die Karte weg','Sie versteckt den Wegweiser','Sie läuft ohne Überlegen weiter',2],
['reparatur','Ein Knopf an Davids Jacke ist locker. Seine Oma zeigt ihm, wie man den Knopf wieder annähen kann. So kann David die Jacke weiter tragen.','Was lernt David?','Manche Dinge kann man reparieren','Kaputte Jacken müssen immer weg','Knöpfe kann man nicht annähen','Nur neue Kleidung ist brauchbar',1],
['wetter','Am Samstag werden starke Windböen erwartet. Die Familie verschiebt deshalb ihre Fahrradtour und besucht stattdessen ein Museum.','Warum wird die Radtour verschoben?','Es soll sehr windig werden','Die Fahrräder sind verkauft','Das Museum ist geschlossen','Die Familie möchte wandern',2],
['fund','Nach dem Sport findet Jana eine fremde Mütze. Sie bringt sie zum Fundregal. Dort kann der Besitzer die Mütze am nächsten Tag abholen.','Warum nutzt Jana das Fundregal?','Damit der Besitzer die Mütze wiederfindet','Damit jemand die Mütze kauft','Damit die Mütze nass wird','Damit die Mütze verschwindet',1],
['bach','Nach starkem Regen fließt der Bach schneller als gewöhnlich. Emil und seine Gruppe bleiben auf dem Weg und halten Abstand zum steilen Ufer.','Wie verhalten sie sich am Bach?','Sie halten sicheren Abstand','Sie springen ins Wasser','Sie klettern über das Geländer','Sie laufen durch den Bach',2],
['falte','In der Werkstunde bauen Kinder eine Papierbrücke. Die erste knickt ein. Die zweite mit mehrfach gefalteten Papierstreifen hält mehr Gewicht.','Was macht die zweite Brücke stabiler?','Die gefalteten Streifen','Das nasse Papier','Die Farbe der Tische','Die größere Schere',3],
['sternwarte','Beim Ausflug zur Sternwarte schauen Kinder durch ein Teleskop. Eine Mitarbeiterin erklärt, dass manche Sterne sehr weit entfernt sind.','Welches Gerät benutzen die Kinder?','Ein Teleskop','Ein Mikroskop','Ein Thermometer','Ein Kompass',2],
['wochenplan','Im Wochenplan steht: Montag lesen, Mittwoch Samen säen, Freitag das Klassenzimmer schmücken. Mia erledigt zuerst ihre Leseaufgabe.','Was steht danach als Nächstes im Plan?','Samen säen','Das Zimmer schmücken','Bücher kaufen','Nach Hause fahren',2],
['spuren','Timo sieht im frisch gefallenen Schnee Pfotenabdrücke. Sie führen bis zu einer Hecke. Die Nachbarin erzählt, dass dort nachts Kaninchen zu sehen sind.','Wohin führen die Spuren?','Zu einer Hecke','Zur Bushaltestelle','In die Turnhalle','Auf ein Hausdach',1],
['bauernhof','Die Klasse besucht einen Bauernhof. Die Kinder dürfen Ziegen füttern, aber nur mit dem Futter, das die Bäuerin vorbereitet hat.','Warum benutzen sie dieses Futter?','Es ist für die Tiere geeignet','Ziegen essen nur Schokolade','Die Kinder brauchen es selbst','Das Futter gehört in den Müll',2],
['schwimmen','Ein Schild sagt: Das tiefe Becken ist nur für sichere Schwimmer. Nela lernt noch schwimmen und bleibt mit ihrer Begleitperson im flachen Becken.','Warum bleibt Nela im flachen Becken?','Das ist für sie sicherer','Das Wasser ist immer wärmer','Es gibt keine Bademeister','Das Becken ist größer',1],
['museum','Im Heimatmuseum betrachtet Toni alte Fotos seiner Stadt. Wo heute eine breite Straße verläuft, sieht man auf dem Foto eine Wiese.','Was erkennt Toni?','Orte verändern sich im Laufe der Zeit','Die Straße ist älter als die Wiese','Fotos zeigen immer die Zukunft','Eine Wiese kann nie bebaut werden',3],
['jahresring','Lilli betrachtet die Schnittfläche eines gefällten Baums. Sie entdeckt viele Ringe. Ihr Vater erklärt, dass Jahresringe Hinweise auf das Alter eines Baums geben.','Was verraten die Ringe?','Hinweise auf das Alter','Die Farbe der Blüten','Die Länge der Wurzeln','Den Namen des Försters',3],
['flohmarkt','Die Klasse organisiert einen Flohmarkt. Jedes Kind versieht seine Dinge mit Preisen. Von den Einnahmen soll neues Spielmaterial gekauft werden.','Wofür wird das Geld gebraucht?','Für Spielmaterial','Für ein privates Handy','Für eine Autobahn','Für eine neue Bushaltestelle',2],
['puppe','Hanna zeichnet die Entwicklung eines Schmetterlings: Ei, Raupe, Puppe und Schmetterling. Sie klebt die Bilder in ihr Forscherheft.','Welche Phase kommt vor dem Schmetterling?','Die Puppe','Das Ei','Eine Blüte','Ein Vogel',3],
['wasserfilter','Die Kinder gießen trübes Wasser durch einen Papierfilter. Größere Teilchen bleiben zurück. Die Lehrerin erklärt, dass das Wasser trotzdem nicht unbedingt trinkbar ist.','Was fängt der Filter auf?','Größere Schmutzteilchen','Alle gelösten Stoffe','Jeden Krankheitserreger','Das Gewicht des Glases',4],
['streit','Zwei Kinder möchten dieselbe Schaufel benutzen. Sie verabreden, dass jeder sie fünf Minuten bekommt. Danach können beide weiterbauen.','Wie lösen sie den Streit?','Sie wechseln sich ab','Sie werfen die Schaufel weg','Sie schubsen sich','Sie gehen wortlos weg',1],
['blueten','Jamal zählt drei Tage lang die geöffneten Blüten: sechs, neun und zwölf. Er schreibt die Zahlen in sein Forscherheft.','Wie verändert sich die Zahl?','Sie steigt täglich um drei','Sie bleibt gleich','Sie wird halbiert','Sie steigt täglich um zehn',3],
['vergleich','Die Klasse untersucht Papier, Holzstäbchen und Stoff. Auf jede Probe legen die Kinder dasselbe Gewicht und prüfen, welche sich am stärksten verbiegt.','Was verändern sie beim Vergleich?','Das Material','Das Gewicht','Die Uhrzeit','Die Anzahl der Kinder',4],
['nachricht','Eine Nachricht verspricht morgen freien Eintritt im Zoo. Elina findet auf der offiziellen Seite keine Bestätigung. Sie fragt nach, bevor sie die Nachricht weiterschickt.','Was macht Elina sinnvoll?','Sie überprüft die Nachricht','Sie teilt alles sofort','Sie erfindet Details','Sie ignoriert die Quelle',4],
['verkehr','Bastian überquert die Straße an der Ampel. Obwohl gerade keine Autos fahren, wartet er auf Grün und schaut noch einmal in beide Richtungen.','Was macht er richtig?','Er wartet und schaut aufmerksam','Er läuft bei Rot','Er schaut nur auf das Handy','Er läuft auf der Fahrbahn',1],
['fledermaus','Ein Sachtext erklärt, dass viele Fledermäuse nachts unterwegs sind und sich mit Echoortung orientieren. Lotta markiert Schlüsselwörter und fasst die Informationen zusammen.','Was hilft Lotta beim Verstehen?','Schlüsselwörter markieren und zusammenfassen','Nur die Überschrift lesen','Den Text nicht beachten','Das Buch weglegen',4],
['schulgarten','Im Schulgarten lockern zwei Kinder die Erde. Zwei weitere setzen Pflanzen ein, während andere Wasser holen. Später tauschen sie die Aufgaben.','Warum tauschen die Kinder die Aufgaben?','Damit alle verschiedene Arbeiten kennenlernen','Damit niemand arbeitet','Weil sie keine Pflanzen haben','Damit der Garten kleiner wird',2],
['zaehne','Beim Zahnarzt lernt Jo, dass regelmäßiges Putzen die Zähne schützt. Zu Hause benutzt er morgens und abends seine Zahnbürste.','Welche Gewohnheit übt Jo?','Regelmäßig Zähne putzen','Nur Süßigkeiten essen','Nie Wasser trinken','Die Zahnbürste verstecken',1],
['vogelhaus','Nika und ihr Opa bauen ein Vogelhaus. Sie messen die Bretter, sägen sie zu und hängen das fertige Haus unter ein Dach.','Warum hängt es unter dem Dach?','Damit es vor Regen geschützt ist','Damit es größer wird','Damit es schaukelt','Damit es im Schatten wächst',1]
];
const VARIETY_SPELL_DATA='Fahrrad:Farrad,Fahrad,Fahrradt;Schmetterling:Schmeterling,Schmetterlin,Schmetterlieng;Frühstück:Früstük,Frühstük,Früstück;freundlich:freuntlich,freundlig,freündlich;plötzlich:plözlich,plötzlig,plötslich;vielleicht:vileicht,viellecht,fielleicht;nämlich:nähmlich,nämlih,nemlich;Spaziergang:Spatziergang,Spazirgang,Spaziergank;Geheimnis:Gehaimnis,Geheimniss,Geheimniß;verstecken:verstekken,versteckken,ferstecken;Schokolade:Schockolade,Schokolahde,Schokolate;Schildkröte:Schiltkröte,Schildkröhte,Schildkröde;Bibliothek:Bibilothek,Biebliohtehk,Bibliotehk;Aquarium:Akuarium,Aquariumm,Aqarium;Schreibtisch:Schreiptisch,Schreibdisch,Schreibtich;Geschwindigkeit:Geschwindikeit,Geschwindigkait,Geschwindichkeit;Schlüssel:Schlüsel,Schlüssell,Schlüßel;Schwimmbad:Schwimbad,Schwimmpad,Schwimmbaht;Rucksack:Ruksack,Rucksak,Ruckssack;Fahrschein:Farschein,Fahrschain,Fahrscheinn;Bewegung:Bewegunk,Bewegungg,Bewegunng;beobachten:beobahchten,beobachtten,beopachten;Wetterbericht:Weterbericht,Wetterberiecht,Wetterberischt;Himmelsrichtung:Himelsrichtung,Himmelsrichtunk,Himmelsrichdung;Taschenlampe:Taschenlammppe,Taschenlammpe,Taschenlambe;Wasserflasche:Wasserflaschee,Waserflasche,Wasserflascha;Klassenzimmer:Klasenzimmer,Klassenzimer,Klassentsimmer;Lieblingsbuch:Liblingsbuch,Lieblingsbuhch,Lieblingsbuchh;Wissenschaft:Wissenschafft,Wisenschaft,Wissenschafdt;Schneemann:Schnemann,Schneemahn,Schneemman;Schneeflocke:Schneflokke,Schneefloke,Schneflocke;Sehenswürdigkeit:Sehenswürdikkeit,Sehenswürdigkait,Sehenswürrdigkeit;spannend:spanend,spannent,schpannend;aufmerksam:aufmercksam,aufmerksamm,auffmerksam;abenteuerlich:abenteurlich,abenteuerlig,abenteuerrlich;vorsichtig:vorsichtich,forsichtig,vorsichtik;Fragezeichen:Fragezeischen,Fragezaichen,Fragezeichenn;Zeichnung:Zeichnunk,Zeihchnung,Zeichnunng;Geschichte:Geschischte,Geschihchte,Geshichte;Wörterbuch:Wörterbuhch,Wörterbuchh,Wörterbuc;Waldspaziergang:Waldspatziergang,Waldspaziergank,Waldspazirgang;Forscherin:Forsscherin,Forcherin,Forscherinn;Tageslicht:Tageslischt,Tagesslicht,Tagezlicht;Glühbirne:Glübirne,Glühbierne,Glühbirn;Bauernhof:Bauernhoff,Baurnhof,Bauernhohf;Eichhörnchen:Eichörnchen,Eichhörncen,Eichhörnchenn;Kartoffel:Kartofel,Kartoffell,Karttoffel;Pflaster:Pflasster,Pflasder,Pflasta;Wirklichkeit:Wirklichkait,Wirklichkeid,Wirklichkheit;überraschend:überaschend,überraschent,überraschendt;Erinnerung:Erinerung,Erinnerunk,Erinnerunng;gewinnen:gewinen,gewinnnen,gewinenn;verschwinden:ferschwinden,verschwindenn,verschwinten;Entdeckung:Entdeckunk,Enddeckung,Entdekkung;Frühling:Früling,Frühlink,Frühlieng;Jahreszeit:Jareszeit,Jahreszait,Jahreszeid;Geschenk:Geschenck,Gesschenk,Geschenkk;Hoffnung:Hofnung,Hoffnunk,Hoffnungg;Vorsicht:Forsicht,Vorsischt,Vorsichdt;interessant:intressant,interesant,interessand;zusammen:zusamen,zusammenn,tsusammen;Abwechslung:Abwechsellung,Abweckslung,Abwechslunk;schwierig:schwierigk,schwirig,schwierigg;Wahrheit:Warheit,Wahrhait,Waheit;gefährlich:gefärlich,gefährlig,gefärhlich;Flugzeug:Fluchzeug,Flugzeuk,Flugzeugg;Treppe:Trepe,Trepppe,Träppe;Doppelgänger:Dopelgänger,Doppelgenger,Doppellgänger;vergessen:fergessen,vergesen,vergessenn;Erlebnis:Erlebniss,Erleebnis,Erlepniss;Begründung:Begründunk,Begrüntung,Begrünndung;Friedhof:Fridhof,Friedhoff,Friethof;Möglichkeit:Möglichkait,Möglichkheit,Möglichkeid;Stofftier:Stoftier,Stofftierh,Stofftiern;Gießkanne:Gieskanne,Gießkane,Gißkanne;Fußballplatz:Fusballplatz,Fußbalplatz,Fußballplaz;Abenteuer:Abenteur,Abentäuer,Abenteuerr;Beispiel:Beischpiel,Beispil,Beispiell;Ergebnis:Ergebniss,Ergeebnis,Ergebnies;Besichtigung:Besichtikung,Besichtigun,Besichdigung;Forschung:Forschunk,Forshung,Forschunng;Hauptstadt:Haubtstadt,Hauptstat,Hauptstadtte;Pfannkuchen:Pfanenkuchen,Pfannkuchenn,Pfankuchen;Handschuh:Hantschuh,Handschuu,Handschuhh;Sonnenblume:Sonenblume,Sonnenbluume,Sonnenblumme;blitzschnell:blizschnell,blitzschnel,blitschnell;unterschiedlich:unterscheidlich,unterschidlich,unterschiedlig;fleißig:fleisig,fleißich,fleissig;endlich:endlig,entlicch,enddlich;seltsam:seltzam,sellsam,seltssam;aufgeregt:aufgerechdt,aufgereckt,aufgeregtg;Glückwunsch:Glückwunsh,Glückwunscht,Glükunsch;Weltreise:Weltreisse,Weltreize,Welltreise;Krokodil:Krokodill,Krokodiel,Krokodilr;Bleistift:Bleischtift,Bleistiefft,Bleistifd;Fantasie:Fantassie,Fantasih,Fantazie;Klassenfahrt:Klassenfart,Klasenfahrt,Klassenfahrd;Bilderrahmen:Bilderramen,Bildderrahmen,Bilderrahmmen;begeistert:begaistert,begeistertt,begeisterdt;Weihnachten:Weinachten,Weihnachtten,Weihnachden;Märchen:Merschen,Märchenn,Märschen;Pflanze:Pflantze,Pflanzze,Pflannze;Gewitter:Gewiter,Gewitterr,Gewitder;Wetter:Weter,Wettar,Wetder;selbstständig:selbststendig,selbststänndig,selbststäntig;Sonnenstrahl:Sonnenstral,Sonnenstraall,Sonenstrahl;Geburtstag:Geburstag,Geburtstak,Geburtsdag;Pausenbrot:Pausenbrod,Pausenbrotte,Pauzenbrot;Mannschaft:Manschaft,Mannschafft,Mannschafdt;Tischtennis:Tischtenis,Tischtännis,Tischtenniss;Gartenzwerg:Gartenwerg,Gartenzwerk,Gartenzerwg;Drachen:Drachnen,Drachenn,Trachen;fabelhaft:fabelhafdt,fabelhafft,vabelhaft;Schwierigkeit:Schwierigkait,Schwierigkeid,Schwierichkeit;Regenbogen:Regenbohgen,Regennbogen,Regenbogn;sorgfältig:sorfältig,sorgfältich,sorgfelttig';
const VARIETY_SPELLS=VARIETY_SPELL_DATA.split(';').map((value,i)=>{
  const parts=value.split(':');return {id:i,correct:parts[0],wrong:parts[1].split(',')};
}).filter(x=>x.wrong.length===3&&new Set([x.correct,...x.wrong]).size===4);
const VARIETY_KNOWLEDGE=[
['Womit misst man die Lufttemperatur?','Mit einem Thermometer','Mit einem Lineal','Mit einem Kompass','Mit einem Zollstock'],
['Wie viele Minuten hat eine Stunde?','60','30','90','100'],
['Wie heißt gefrorenes Wasser?','Eis','Dampf','Erde','Sand'],
['Welche Farbe zeigt eine Fußgängerampel bei Halt?','Rot','Grün','Blau','Orange'],
['Wie spart man beim Zähneputzen Wasser?','Den Hahn zwischendurch schließen','Den Hahn offen lassen','Immer zusätzlich duschen','Wasser auf den Boden laufen lassen'],
['Welche Himmelsrichtung liegt gegenüber von Norden?','Süden','Westen','Osten','Nordosten'],
['Wie viele Monate hat ein Jahr?','12','10','11','13'],
['Wie viele Sekunden hat eine Minute?','60','40','80','100'],
['Was zeigt eine Kartenlegende?','Die Bedeutung der Zeichen','Die Schulnoten','Den Namen des Zeichners','Die Uhrzeit'],
['Welche Energiequelle ist erneuerbar?','Sonnenlicht','Erdöl','Erdgas','Kohle'],
['Was sollte man vor dem Teilen einer Nachricht tun?','Die Quelle überprüfen','Sie sofort teilen','Details dazuerfinden','Nur die Überschrift glauben'],
['Was zeigt die Richtung des Windes an?','Eine Wetterfahne','Eine Lupe','Eine Sanduhr','Ein Lineal'],
['Welches Tier ist ein Säugetier?','Ein Eichhörnchen','Eine Forelle','Eine Amsel','Ein Frosch'],
['Was brauchen viele Pflanzen zum Wachsen?','Licht und Wasser','Nur Plastik','Nur Steine','Nur Sand'],
['Welche Handlung hilft beim Streitschlichten?','Zuhören und Lösungen suchen','Schubsen','Beleidigen','Absichtlich nicht zuhören'],
['Was passiert mit einer Raupe bei der Entwicklung zum Schmetterling?','Sie verpuppt sich','Sie wird zum Fisch','Sie wird zu Stein','Sie wird zum Vogel'],
['Welche Jahreszeit kommt nach dem Frühling?','Sommer','Winter','Herbst','Januar'],
['Wozu dient die Notrufnummer 112?','Hilfe im Notfall holen','Bücher bestellen','Wetterberichte lesen','Schulstunden planen'],
['Welches Organ pumpt Blut durch den Körper?','Das Herz','Die Lunge','Die Nase','Das Ohr'],
['Was ist bei einem Versuch mit mehreren Materialien wichtig?','Möglichst gleiche Testbedingungen','Alle Proben anders belasten','Ergebnisse ohne Prüfung schätzen','Proben heimlich wechseln'],
['Womit kann man Himmelsrichtungen bestimmen?','Mit einem Kompass','Mit einem Radiergummi','Mit einer Waage','Mit einem Pinsel'],
['Welches Verhalten schützt die Umwelt?','Abfall richtig entsorgen','Müll im Wald liegen lassen','Wasser verschwenden','Wilde Tiere stören'],
['Was beschreibt die Windstärke?','Wie kräftig der Wind weht','Wie kalt es gestern war','Wie tief ein See ist','Wie lang ein Schatten ist'],
['Was hilft bei einem Sachtext?','Schlüsselwörter markieren','Nur das Ende lesen','Unbekannte Wörter ignorieren','Den Text nicht lesen']
];
const VARIETY_ENGLISH=[
['Good morning!','Guten Morgen!','Gute Nacht!','Bis bald!','Guten Abend!'],
['Good afternoon!','Guten Tag!','Gute Nacht!','Bis morgen!','Guten Appetit!'],
['Good evening!','Guten Abend!','Guten Morgen!','Gute Reise!','Viel Glück!'],
['See you!','Bis bald!','Guten Appetit!','Gute Nacht!','Viel Glück!'],
['What is your name?','Wie heißt du?','Wie alt bist du?','Wo wohnst du?','Was isst du?'],
['How old are you?','Wie alt bist du?','Wie heißt du?','Was magst du?','Wo ist dein Buch?'],
['I am nine.','Ich bin neun.','Ich habe neun Bücher.','Es ist neun Uhr.','Ich sehe eine Neun.'],
['I like dogs.','Ich mag Hunde.','Ich sehe Hunde.','Ich habe Hunde.','Ich suche Hunde.'],
['I like cats.','Ich mag Katzen.','Ich habe Katzen.','Ich male Katzen.','Ich höre Katzen.'],
['This is my pencil.','Das ist mein Bleistift.','Das ist mein Lineal.','Das ist mein Buch.','Das ist mein Stuhl.'],
['This is my book.','Das ist mein Buch.','Das ist mein Tisch.','Das ist mein Bild.','Das ist mein Ball.'],
['The dog is black.','Der Hund ist schwarz.','Die Katze ist schwarz.','Der Hund ist braun.','Der Hund ist klein.'],
['The cat is white.','Die Katze ist weiß.','Die Katze ist grau.','Der Hund ist weiß.','Die Katze ist braun.'],
['Please sit down.','Bitte setz dich hin.','Bitte steh auf.','Bitte komm herein.','Bitte hör zu.'],
['Stand up, please.','Steh bitte auf.','Setz dich bitte hin.','Komm bitte morgen.','Lies bitte vor.'],
['Open your book.','Öffne dein Buch.','Schließe dein Buch.','Zeig dein Heft.','Male ein Bild.'],
['Close the door.','Schließe die Tür.','Öffne das Fenster.','Schließe das Buch.','Hol deine Tasche.'],
['Thank you very much.','Vielen Dank.','Guten Abend.','Bis bald.','Gute Nacht.'],
['I am happy.','Ich bin glücklich.','Ich bin müde.','Ich bin traurig.','Ich bin hungrig.'],
['I am tired.','Ich bin müde.','Ich bin hungrig.','Ich bin glücklich.','Ich bin durstig.'],
['I am hungry.','Ich habe Hunger.','Ich habe Durst.','Mir ist kalt.','Mir ist warm.'],
['It is sunny.','Es ist sonnig.','Es regnet.','Es schneit.','Es ist windig.'],
['It is raining.','Es regnet.','Es schneit.','Es ist sonnig.','Es ist trocken.'],
['It is snowing.','Es schneit.','Es regnet.','Es ist warm.','Es ist windig.'],
['Today is Monday.','Heute ist Montag.','Heute ist Dienstag.','Heute ist Sonntag.','Heute ist Freitag.'],
['I can jump.','Ich kann springen.','Ich kann fliegen.','Ich kann malen.','Ich kann lesen.'],
['I can swim.','Ich kann schwimmen.','Ich kann laufen.','Ich kann lesen.','Ich kann springen.'],
['This is my brother.','Das ist mein Bruder.','Das ist meine Schwester.','Das ist mein Vater.','Das ist meine Oma.'],
['This is my sister.','Das ist meine Schwester.','Das ist meine Mutter.','Das ist mein Bruder.','Das ist meine Freundin.'],
['Where is the ball?','Wo ist der Ball?','Wo ist das Buch?','Wem gehört der Ball?','Wo ist das Auto?'],
['How are you?','Wie geht es dir?','Wo wohnst du?','Wie heißt du?','Wie spät ist es?'],
['My name is Leo.','Ich heiße Leo.','Mein Bruder heißt Leo.','Ich sehe Leo.','Leo ist mein Hund.'],
['I have two books.','Ich habe zwei Bücher.','Ich habe drei Bücher.','Ich lese zwei Seiten.','Ich suche ein Buch.'],
['Can I help you?','Kann ich dir helfen?','Wie geht es dir?','Wo wohnst du?','Kannst du schwimmen?']
];
function varietyReading(row){return varietyTask('📖 Lesegeschichte','Lies aufmerksam: '+row[1],row[2],row[3],row.slice(4,7),'v9:read:'+row[0],'Suche den wichtigen Satz im Text.',{storyId:row[0]});}
function varietySpelling(row){return varietyTask('✍️ Welches Wort ist richtig?','Drei Wörter enthalten einen Schreibfehler.','Welches Wort ist richtig geschrieben?',row.correct,row.wrong,'v9:spell:'+row.id,'Denke an den Wortstamm und an doppelte Mitlaute.');}
function varietyKnowledge(row){return varietyTask('🔍 Sachwissen','Natur, Alltag, Verkehr, Medien und Orientierung.',row[0],row[1],row.slice(2,5),'v9:know:'+VARIETY_KNOWLEDGE.indexOf(row),'Erinnere dich an deine Beobachtungen im Alltag.');}
function varietyPhrase(row){return varietyTask('🇬🇧 Englisch im ersten Lernjahr','Höre dir den Satz an.','Was bedeutet „'+row[0]+'“?',row[1],row.slice(2,5),'v9:english:'+VARIETY_ENGLISH.indexOf(row),'Achte auf die Wörter, die du schon kennst.',{speakText:row[0],speechLang:'en-GB',postAnswerSpeak:row[0]});}
function varietyWord(){
  const pool=ENGLISH_WORDS.filter(w=>w.from<=Math.max(2,progress.skills.english.level));
  const word=varietyChoose(pool,'englishWords',w=>w.en);
  const others=shuffle(pool.filter(w=>w.en!==word.en&&w.de!==word.de));
  const alike=shuffle(others.filter(w=>w.group===word.group));
  for(const w of others)if(alike.length<3&&!alike.some(x=>x.en===w.en))alike.push(w);
  const wrong=alike.slice(0,3);
  return varietyTask('🐾 Englische Wörter','Tiere, Farben, Schulsachen und Alltagswörter.',
    'Was bedeutet „'+word.en+'“?',word.de,wrong.map(x=>x.de),'v9:word:'+word.en,
    'Höre das Wort an und überlege, wo es im Alltag vorkommt.',
    {speakText:word.en,speechLang:'en-GB',postAnswerSpeak:word.en,visualEmoji:word.emoji});
}
function varietyGermanOne(kind,level){
  if(kind==='read'){
    const pool=VARIETY_READINGS.filter(r=>r[7]<=Math.max(3,Math.min(4,level+1)));
    return varietyReading(varietyChoose(pool,'readings',r=>r[0]));
  }
  if(kind==='spell'){
    const lengthLimit=level<=1?9:level===2?12:level===3?14:30;
    const pool=VARIETY_SPELLS.filter(r=>r.correct.length<=lengthLimit);
    return varietySpelling(varietyChoose(pool,'spellings',r=>r.id));
  }
  return varietyKnowledge(varietyChoose(VARIETY_KNOWLEDGE,'knowledge',r=>VARIETY_KNOWLEDGE.indexOf(r)));
}
// 20er-Lernmix behält die bisherigen 5 Deutsch- und 5 Englisch-Fragen bei.
makeGermanLevelTasks=function(level){return shuffle(['read','read','spell','spell','know'].map(k=>varietyGermanOne(k,level)));};
makeEnglishTasks=function(level){
  const phraseLimit=level<=1?12:level===2?22:VARIETY_ENGLISH.length;
  const simplePhrases=VARIETY_ENGLISH.slice(0,phraseLimit);
  return shuffle([varietyPhrase(varietyChoose(simplePhrases,'phrases',r=>VARIETY_ENGLISH.indexOf(r))),
    varietyPhrase(varietyChoose(simplePhrases,'phrases',r=>VARIETY_ENGLISH.indexOf(r))),
    varietyWord(),varietyWord(),varietyWord()]);
};
function varietyEight(answer,max){
  const o=[answer],add=n=>{if(Number.isInteger(n)&&n>=0&&n<=max&&!o.includes(n))o.push(n);};
  // Mehrere falsche Optionen besitzen dieselbe Einerstelle.
  for(const d of shuffle([10,-10,20,-20,30,-30,40,-40,50,-50,100,-100])){
    add(answer+d);if(o.length>=4)break;
  }
  for(const d of shuffle([1,-1,2,-2,3,-3,4,-4,5,-5,9,-9,11,-11,15,-15,25,-25,60,-60])){
    add(answer+d);if(o.length>=8)break;
  }
  for(let x=0;o.length<8&&x<=max;x++)add(x);
  if(o.length!==8)throw Error('Die Mathefrage braucht acht Antworten.');
  return shuffle(o.map(String));
}
function varietyMath(kind,level,fixedRow=null){
 const l=Math.max(1,Math.min(7,level));
 let answer,a,b,row=null,context='',question='',hint='Rechne in kleinen Schritten und kontrolliere das Ergebnis.';
 if(['mul','div','mulstory','divstory'].includes(kind)){
   const pool=l<=2?[3,4,5,6,7,8,9]:[3,4,5,6,7,8,9,10,11,12];
   row=fixedRow||shuffle([...pool,...pool,...pool,1,2])[0];
   b=int(l<=2?3:2,10);
   a=row*b;
   if(kind==='mul'){question='Was ergibt '+row+' × '+b+'?';answer=a;}
   if(kind==='div'){question='Was ergibt '+a+' ÷ '+row+'?';answer=b;}
   if(kind==='mulstory'){
     const pairs=shuffle([['Schachteln','Karten'],['Körben','Äpfel'],['Kisten','Bälle'],['Tüten','Murmeln'],['Reihen','Stühle'],['Regalen','Bücher'],['Beuteln','Knöpfe']]);
     context='In '+b+' '+pairs[0][0]+' liegen jeweils '+row+' '+pairs[0][1]+'.';
     question='Wie viele '+pairs[0][1]+' sind es insgesamt?';answer=a;
   }
   if(kind==='divstory'){
     const items=shuffle(['Karten','Murmeln','Sticker','Knöpfe','Bälle'])[0];
     context=a+' '+items+' werden gleichmäßig auf '+row+' Kinder verteilt.';
     question='Wie viele '+items+' bekommt jedes Kind?';answer=b;
   }
 }else if(['add','sub','addstory','substory'].includes(kind)){
   const max=l<=2?250:l<=4?600:1000;
   a=int(40,max-100);b=int(15,Math.min(90,max-a));
   if(kind==='add'){answer=a+b;question='Was ergibt '+a+' + '+b+'?';}
   if(kind==='sub'){answer=a;question='Was ergibt '+(a+b)+' − '+b+'?';}
   if(kind==='addstory'){answer=a+b;context='Ein Verein sammelt '+a+' Sticker. Weitere '+b+' kommen dazu.';question='Wie viele Sticker hat er nun?';}
   if(kind==='substory'){answer=a;context='In einer Bücherei stehen '+(a+b)+' Bücher. '+b+' werden ausgeliehen.';question='Wie viele Bücher bleiben im Regal?';}
 }else if(kind==='twostep'){
   a=int(3,12);b=int(3,10);const removed=int(1,Math.max(1,Math.floor(a*b/2)));
   context='Auf '+a+' Tischen liegen jeweils '+b+' Karten. '+removed+' Karten werden weggenommen.';
   question='Wie viele Karten bleiben insgesamt?';answer=a*b-removed;
 }else if(kind==='pattern'){
   b=shuffle([10,15,20,25,30,40,50])[0];
   a=b*int(2,Math.floor((1000-4*b)/b));
   context='Zahlenfolge: '+a+', '+(a+b)+', '+(a+2*b)+', ?';
   question='Welche Zahl kommt als Nächstes?';answer=a+3*b;
 }else throw Error('Unbekannte Matheaufgabe '+kind);
 if(!Number.isInteger(answer)||answer<0||answer>1000)throw Error('Ergebnis außerhalb des Zahlenraums');
 return {label:'🔢 Mathe · Stufe '+l,context,question,answer:String(answer),options:varietyEight(answer,120<=answer?1000:120),
   hint,explanation:'Ergebnis: '+answer+'.',reviewKey:'v9:math:'+kind+(row?':'+row:''),
   mathKind:kind,mathRow:row,studyLevel:l};
}
makeMathLevelTasks=function(level){return shuffle([
  varietyMath('mul',level),varietyMath('div',level),
  varietyMath(shuffle(['mulstory','divstory','twostep'])[0],level),
  varietyMath(shuffle(['add','sub'])[0],level),
  varietyMath(shuffle(['addstory','substory','pattern'])[0],level)
]);};
const varietyPreviousReview=makeReviewTask;
makeReviewTask=function(entry){
 if(!entry.key.startsWith('v9:'))return varietyPreviousReview(entry);
 if(progress.skills[entry.subject]?.level<entry.level)return null;
 const p=entry.key.split(':');let t=null;
 if(entry.subject==='german'){
   if(p[1]==='read'){const r=VARIETY_READINGS.find(r=>r[0]===p[2]);if(r)t=varietyReading(r);}
   else if(p[1]==='spell'){const r=VARIETY_SPELLS.find(r=>String(r.id)===p[2]);if(r)t=varietySpelling(r);}
   else if(p[1]==='know'&&VARIETY_KNOWLEDGE[+p[2]])t=varietyKnowledge(VARIETY_KNOWLEDGE[+p[2]]);
 }else if(entry.subject==='english'){
   if(p[1]==='english'&&VARIETY_ENGLISH[+p[2]])t=varietyPhrase(VARIETY_ENGLISH[+p[2]]);
   else if(p[1]==='word'){
     const w=ENGLISH_WORDS.find(w=>w.en===p[2]);if(w)t=englishReviewTask(w);
   }
 }else if(entry.subject==='math'){
   t=varietyMath(p[2],entry.level,p[3]?Number(p[3]):null);
 }
 return t?{...t,subject:entry.subject,studyLevel:entry.level,reviewTask:true,reviewKey:entry.key}:null;
};
const varietyPreviousReplacement=makeFreshMixedReplacement;
makeFreshMixedReplacement=function(currentSession,slot){
 const old=currentSession.tasks[slot],subject=old.subject;
 if(subject==='flags')return varietyPreviousReplacement(currentSession,slot);
 const level=progress.skills[subject].level;
 for(let attempt=0;attempt<180;attempt++){
   let task;
   if(subject==='german')task=varietyGermanOne(shuffle(['read','read','spell','spell','know'])[0],level);
   else if(subject==='english')task=Math.random()<0.5?varietyPhrase(varietyChoose(VARIETY_ENGLISH,'phrases',r=>VARIETY_ENGLISH.indexOf(r))):varietyWord();
   else task=varietyMath(old.mathKind||'mul',level);
   task={...task,subject,studyLevel:level,reviewTask:false,timerSeconds:old.timerSeconds};
   if(mixedTaskAllowed(currentSession,task,slot))return task;
 }
 return varietyPreviousReplacement(currentSession,slot);
};