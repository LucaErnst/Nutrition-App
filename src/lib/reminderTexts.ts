/**
 * Erinnerungstexte im be_s3rious-Ton: 64 Textvarianten pro Anlass und Sprache,
 * dazu rotierende Titel. Die Rotation zeigt jede Variante genau einmal, bevor
 * sich etwas wiederholt. {n} = Platzhalter (z.B. offenes Protein in g).
 */
import type { Language } from '../i18n';

export type ReminderKind = 'breakfast' | 'lunch' | 'dinner' | 'water' | 'weigh' | 'weekly' | 'protein';

export interface Msg {
  title: string;
  body: string;
}

const lines = (s: string) => s.trim().split('\n').map((l) => l.trim()).filter(Boolean);

// ---------------------------------------------------------------- Deutsch
const deTitles: Record<ReminderKind, string[]> = {
  breakfast: lines(`Frühstück?|Guten Morgen|Frühstück tracken|Start in den Tag|Frühstück offen|Morgenroutine|Erster Eintrag|Kurz und ehrlich`.replace(/\|/g, '\n')),
  lunch: lines(`Mittagessen|Halbzeit|Mittag im Tagebuch?|Zwischenstand|Mahlzeit zwei|Dranbleiben|Mittag|Kein Nachrechnen am Abend`.replace(/\|/g, '\n')),
  dinner: lines(`Tag abschliessen|Abendessen|Bilanz ziehen|Feierabend-Check|Letzte Mahlzeit|Tagebuch zumachen|Abend|Noch ein Eintrag`.replace(/\|/g, '\n')),
  water: lines(`Trink was|Wasser|Durst ist zu spät|Kleine Pause|Flüssigkeit|Hydration-Check|Nachschub|Trinken nicht vergessen`.replace(/\|/g, '\n')),
  weigh: lines(`Auf die Waage|Morgengewicht|Datenpunkt|Waage|Messen statt raten|Trend füttern|Check-in|Morgens`.replace(/\|/g, '\n')),
  weekly: lines(`Wochenrückblick|Sonntag|Bilanz der Woche|Woche geschafft|Rückblick|Neue Woche|Wochenfazit|Ehrlicher Blick`.replace(/\|/g, '\n')),
  protein: lines(`Protein offen|Noch {n} g Protein|Protein-Lücke|Protein-Ziel|Zielgerade|Abend-Protein|Der Rest ist Protein|Nicht vergessen`.replace(/\|/g, '\n')),
};

const deBodies: Record<ReminderKind, string[]> = {
  breakfast: lines(`
Gegessen? Dann rein damit. Ohne Daten kein Fortschritt.
Erster Eintrag des Tages. 20 Sekunden, dann ist die Basis gelegt.
Was auf dem Teller war, gehört ins Tagebuch. Jetzt, solange du es noch weisst.
Quark, Hafer, Eier – egal was. Eintragen, weitermachen.
Der Tag hat begonnen, dein Tagebuch noch nicht. Ändern wir das.
Zähneputzen, Kaffee, Frühstück eintragen. In der Reihenfolge.
Frühstück rein. Kein Schätzen am Abend, jetzt stimmt es noch.
Kleine Handlung, grosse Wirkung über die Woche. Frühstück tracken.
Wer morgens trackt, muss abends nicht raten.
Das Frühstück ist die einfachste Mahlzeit zum Eintragen. Also los.
Ein Scan, eine Vorlage, fertig. Dein Frühstück wartet im Tagebuch.
Erst eintragen, dann der zweite Kaffee.
Frühstück gegessen, Frühstück getrackt. So einfach ist Disziplin.
Der Tag ist lang. Der Eintrag ist kurz.
Standard-Frühstück? Vorlage antippen, erledigt.
Nichts gegessen? Auch das ist eine Info. Kein Eintrag ist keine.
Dein Wochenschnitt beginnt mit diesem Frühstück.
Bevor der Tag dich einholt: Frühstück eintragen.
Morgens ist der Kopf klar. Nutze das für den ersten Eintrag.
Frühstück tracken heisst, den Tag unter Kontrolle zu haben. Nicht umgekehrt.
Kein Frühstück ist auch ein Frühstück. Aber ein getracktes ist besser.
Ein Eintrag am Morgen erspart drei Fragen am Abend.
Hafer und Quark sind schon in der Datenbank. Nur noch antippen.
Frühstück eintragen: die kleinste Gewohnheit mit dem grössten Hebel.
Dein Protein-Ziel fängt beim Frühstück an, nicht beim Abendessen.
Vorlage nutzen, Menge prüfen, speichern. Drei Tipps.
Heute Trainingstag? Dann zählt das Frühstück doppelt. Eintragen.
Erster Eintrag, dann Ruhe bis zum Mittag.
Der Tag fängt gut an, wenn er im Tagebuch anfängt.
Eintragen, bevor du es vergisst. Das Gedächtnis ist keine Datenbank.
Frühstück ist Routine. Tracken auch.
Ein sauberes Tagebuch beginnt um diese Zeit.
Du weisst genau, was du gegessen hast. Noch. Nutze das.
Nicht perfekt, aber vollständig. Frühstück rein.
Ohne Frühstückseintrag fehlt dem Tag das Fundament.
Kurz reinschauen, eintragen, weiter. Der Rest des Tages gehört dir.
Der Scanner ist bereit. Verpackung, Klick, fertig.
Was heute Morgen drin war, will ins Tagebuch.
Erster Eintrag, erster kleiner Sieg des Tages.
Frühstück tracken, dann weisst du mittags schon, wo du stehst.
Gewohnheiten schlagen Motivation. Heute: Frühstück eintragen.
Der Eintrag dauert kürzer als der Kaffee.
Heute schon getrackt? Wenn nicht: jetzt.
Frühstück rein – und der Tag hat eine Richtung.
Nicht denken, eintragen. Denken kannst du am Sonntag beim Rückblick.
Dein Körper hat gegessen. Dein Tagebuch noch nicht.
Frühstück eintragen ist keine Pflicht. Es ist ein Vorteil.
Ein Tipp auf die Vorlage, und der Morgen ist erledigt.
Erst Daten, dann Meinung. Frühstück tracken.
Zwanzig Sekunden für einen Eintrag, der die ganze Woche trägt.
Frühstück offen im Tagebuch. Schliessen wir das ab.
Der Morgen ist der beste Zeitpunkt für ehrliche Zahlen.
Heute zählt jede Mahlzeit. Fang mit der ersten an.
Frühstück eintragen – das Tagebuch will vollständig sein.
Vollständige Tage machen aussagekräftige Wochen. Erster Schritt: jetzt.
Ein getracktes Frühstück ist ein halb geplanter Tag.
Eintragen, während der Kaffee zieht.
Dein Frühstück ist Teil des Plans. Trage es ein.
Morgens tracken, abends entspannt.
Frühstück ins Tagebuch. Kein grosser Akt, grosse Wirkung.
Das Tagebuch wartet auf den ersten Eintrag. Lass es nicht warten.
Frühstück gegessen? Ins Tagebuch damit, dann ist es abgehakt.
Erster Eintrag des Tages. Kleiner Schritt, klare Linie.
Frühstück rein. Der Rest des Tages baut darauf auf.
`),
  lunch: lines(`
Tracken dauert 20 Sekunden und bringt eine Woche Klarheit.
Mittagessen eintragen – dann weisst du, was am Abend noch geht.
Scan oder Suche, drei Tipps. Danach ist Ruhe bis zum Abend.
Mittagessen jetzt eintragen, solange die Portion noch frisch im Kopf ist.
Protein-Check: Wie viel ist schon drin? Eintragen und nachsehen.
Mittagessen rein und schauen, wo der Tag steht. Fakten statt Gefühl.
Reis, Huhn, Gemüse – was auch immer. Ins Tagebuch damit.
Die Woche gewinnt man mittags, nicht am Sonntag.
Mittag eingetragen? Dann ist die Hälfte des Tages sauber.
Halbzeit. Kurzer Blick auf die Bilanz, dann geht es weiter.
Was war auf dem Teller? Eintragen, bevor der Nachmittag es verwischt.
Mittagessen tracken – jetzt ist die Menge noch ehrlich.
Ein Eintrag mittags spart Rechnerei am Abend.
Das Mittagessen entscheidet, wie der Abend aussieht. Eintragen.
Kantine, Take-away, selbst gekocht – alles zählt. Alles rein.
Mittag rein, dann weisst du, wie viel Spielraum bleibt.
Zwischenstand prüfen. Dafür muss das Mittagessen drin sein.
Tracken, nicht schätzen. Mittagessen jetzt.
Der Nachmittag läuft besser mit einem sauberen Tagebuch.
Mittagessen ins Tagebuch – dein Abend dankt dir.
Wer mittags trackt, hat abends Optionen.
Drei Tipps: Suche, Menge, hinzufügen. Erledigt.
Mittagspause ist Tracking-Pause. Kurz, aber wichtig.
Mittag rein und schauen, ob das Protein auf Kurs ist.
Halbzeitbilanz. Ohne Mittagessen im Tagebuch gibt es keine.
Eintragen, bevor die Erinnerung an die Portion schrumpft.
Mittagessen getrackt heisst: Abendessen planbar.
Der Tag ist halb rum. Das Tagebuch sollte es auch sein.
Kurz rein, kurz raus. Mittagessen eintragen.
Zahlen statt Bauchgefühl. Das Mittagessen liefert beides.
Heute schon Protein? Das Mittagessen zeigt es.
Mittag eintragen – der zweite Pfeiler des Tages.
Kein Tag ohne Mittagseintrag. Das ist die Regel.
Mittagessen ins Tagebuch, dann Kopf frei für den Nachmittag.
Vorlage vom letzten Mal? Kopieren, anpassen, fertig.
Portion ehrlich schätzen, eintragen, weitermachen.
Der Scanner nimmt dir die Arbeit ab. Verpackung, Klick.
Mittag rein. Dein Wochenbudget will wissen, wo du stehst.
Eintragen, bevor das nächste Meeting alles überlagert.
Mittagessen tracken – zwanzig Sekunden Ehrlichkeit.
Ein getracktes Mittagessen macht den Abend berechenbar.
Was du jetzt einträgst, musst du abends nicht rekonstruieren.
Mittagessen rein. Trainingstag oder nicht, die Zahl zählt.
Halbzeit-Check: Kalorien, Protein, Wasser. Eintragen und lesen.
Mittagessen eintragen ist der Unterschied zwischen Plan und Zufall.
Nicht später. Jetzt. Mittagessen.
Heute mittags gegessen? Klar. Getrackt? Jetzt.
Der Eintrag ist kürzer als die Wartezeit auf den Kaffee.
Mittagessen rein – dann stimmt der Tagesstand.
Mahlzeit zwei ins Tagebuch. Zwei von fünf, gute Quote.
Eintragen, solange es noch frisch ist. Im Kopf und auf dem Teller.
Mittagessen tracken, dann ist der Nachmittag frei.
Ein Blick aufs Mittagessen, ein Blick auf die Ziele. Eintragen.
Wer mittags weiss, wo er steht, isst abends besser.
Mittagessen ins Tagebuch. Das Wochenfazit wird es dir danken.
Rein damit. Der Nachmittag ist für anderes da.
Mittag rein, Protein prüfen, weiter.
Die Woche lebt von vollständigen Tagen. Mittag ist der zweite Baustein.
Zwanzig Sekunden Aufwand für einen Abend ohne Rätselraten.
Mittagessen tracken. Kurzer Griff zum Handy, grosser Effekt.
Was auf dem Teller war, gehört ins Tagebuch. Auch mittags.
Mittag rein. Dann weisst du genau, was noch fehlt.
Eintragen, dann entspannt in den Nachmittag.
Mittagessen ins Tagebuch – Routine, die sich auszahlt.
`),
  dinner: lines(`
Abendessen rein, dann weisst du, wo du stehst.
Letzter Eintrag, dann ist der Tag sauber. Morgen fängst du bei null an.
Abendessen eintragen und die Tagesbilanz anschauen. Ehrlich, nicht streng.
Abendessen tracken – die Woche zählt jeden Tag, auch den heutigen.
Was war auf dem Teller? Eintragen, Tag schliessen, abschalten.
Kalorien, Protein, fertig. Zwei Minuten, dann ist der Tag im Kasten.
Rein damit. Kein Tag ohne vollständige Daten – das ist der Deal.
Abendessen eintragen. Dann weisst du morgen, was heute war.
Der Tag ist fast durch. Ein Eintrag noch, dann ist er komplett.
Abendessen rein und die Bilanz lesen. Das ist der Moment der Wahrheit.
Letzte Mahlzeit ins Tagebuch. Dann ist Feierabend, auch fürs Tracking.
Tag abschliessen heisst: Abendessen eintragen. Sonst bleibt er offen.
Kein Tag endet ohne Abendessen im Tagebuch.
Abendessen tracken, Bilanz prüfen, zufrieden schlafen.
Der letzte Eintrag ist der wichtigste. Er macht den Tag vollständig.
Abendessen rein. Dann siehst du, ob das Protein gereicht hat.
Zwei Minuten, dann ist der Tag geschlossen.
Eintragen, solange die Portion noch vor dir steht.
Abendessen ins Tagebuch. Dein Wochenschnitt braucht diesen Tag.
Die Bilanz gibt es nur mit Abendessen. Also rein damit.
Tag beenden wie begonnen: mit einem Eintrag.
Abendessen tracken. Dann kannst du das Handy weglegen.
Letzter Eintrag, letzter Blick, gute Nacht.
Was heute Abend drin war, will ins Tagebuch.
Abendessen rein – morgen startest du mit einem sauberen Tag.
Vollständiger Tag oder Lücke? Deine Entscheidung. Abendessen eintragen.
Die Woche besteht aus abgeschlossenen Tagen. Schliess diesen ab.
Abendessen ins Tagebuch. Ehrlichkeit kostet zwei Minuten.
Rein damit, dann weisst du, ob heute gepasst hat.
Abendessen eintragen. Der Tag hat es verdient, komplett zu sein.
Letzter Punkt auf der Liste: Abendessen tracken.
Feierabend beginnt nach dem letzten Eintrag.
Abendessen rein, Wochenbudget prüfen, abschalten.
Tag zu, Zahlen klar. Abendessen eintragen.
Der Eintrag dauert kürzer als der Abwasch.
Abendessen ins Tagebuch – dann ist heute erledigt.
Nicht schätzen, eintragen. Jetzt stimmt es noch.
Abendessen tracken, dann Tagesbilanz lesen. Vielleicht gefällt sie dir.
Rein damit. Ein Tag ohne Ende ist ein halber Tag.
Abendessen eintragen – dein Sonntag-Rückblick will vollständige Daten.
Der Tag geht zu Ende. Das Tagebuch sollte es auch.
Letzter Eintrag, dann hast du deine Ruhe.
Abendessen rein. Zwei Minuten, die den Tag zählen lassen.
Was du jetzt einträgst, ist morgen ein sauberer Datenpunkt.
Abendessen ins Tagebuch. Dann weisst du, wie viel Protein gereicht hat.
Vollständig ist besser als perfekt. Abendessen eintragen.
Tag abschliessen. Abendessen rein, Bilanz lesen, fertig.
Abendessen tracken – der Schlusspunkt des Tages.
Rein damit. Dann kannst du ehrlich sagen: heute getrackt.
Abendessen eintragen, bevor der Abend es vergessen lässt.
Der Tag ist gelaufen. Jetzt noch in Zahlen fassen.
Abendessen ins Tagebuch. Dein Trend braucht vollständige Tage.
Letzte Mahlzeit, letzter Eintrag, sauberer Tag.
Abendessen rein. Wer abschliesst, kann morgen neu starten.
Eintragen, dann Bilanz. Vielleicht ist heute ein guter Tag geworden.
Abendessen tracken. Das Tagebuch will den ganzen Tag, nicht die Hälfte.
Zwei Minuten für einen vollständigen Tag. Lohnt sich.
Abendessen rein, Tag zu, Kopf frei.
Kein offener Tag im Tagebuch. Abendessen eintragen.
Der letzte Eintrag entscheidet, ob die Bilanz stimmt.
Abendessen ins Tagebuch, dann ist Feierabend.
Tag komplett machen. Abendessen eintragen.
Rein damit. Morgen früh dankst du dir dafür.
Abendessen tracken – kurz, ehrlich, erledigt.
`),
  water: lines(`
Dein Körper ist kein Kaktus.
Ein Glas jetzt. Dein Training morgen sagt danke.
Trinken, bevor der Durst kommt. +500 ml, ein Tipp.
Aufstehen, Wasser holen, weitermachen. Zählt trotzdem.
Muskeln bestehen zu 75 % aus Wasser. Nachfüllen.
Wo stehst du beim Wasserziel? Nachsehen, nachlegen.
Kaffee zählt nicht. Wasser zählt.
Glas leer? Auffüllen und eintragen. Zwei Sekunden.
Kopfschmerz am Nachmittag? Oft nur Durst. Trink was.
Ein grosses Glas jetzt spart dir die Müdigkeit später.
Wasser ist das billigste Supplement. Nimm es.
Flasche neben dir? Dann weisst du, was zu tun ist.
Trinken ist keine Aufgabe. Es ist ein Reflex, den du trainierst.
+250 ml. Jetzt. Dann weiter.
Hydriert trainiert es sich besser. Punkt.
Dein Wasserziel wartet. Ein Glas näher.
Durst ist ein Alarm, kein Hinweis. Vorher trinken.
Wasser statt Wunder. Trink was.
Halbzeit beim Wasser? Prüf es im Tagebuch.
Ein Glas Wasser ist die einfachste Entscheidung des Tages.
Nachfüllen. Dein Kopf arbeitet besser mit Wasser.
Trinken und eintragen. Beides dauert Sekunden.
Wasser rein. Dein Stoffwechsel läuft nicht auf Trockenheit.
Klein und stetig. Ein Glas jetzt, eins in zwei Stunden.
Deine Zellen wollen Wasser, nicht Ausreden.
Griff zur Flasche. Jetzt.
Ein halber Liter jetzt bringt dich auf Kurs.
Trink was. Dein Fokus hängt daran.
Wasserziel im Blick? Nachlegen, wenn nötig.
Einfachste Gewohnheit der Welt: Glas füllen, trinken, eintragen.
Ohne Wasser kein Pump. Trink.
Flüssigkeit rein, Kopf klar.
Ein Glas Wasser pro Erinnerung. Das ist der Deal.
Trinken ist Training für Faule. Mach mit.
Dein Wasserstand ist niedriger, als du denkst. Nachfüllen.
Wasser vor dem nächsten Kaffee. Regel.
Trinkpause. Zwanzig Sekunden, dann weiter.
Nachschub für die Muskeln. Wasser.
Der Körper meldet Durst spät. Sei schneller.
Ein Glas jetzt, eines beim nächsten Mal. So kommt das Ziel.
Trink was. Ausreden gibt es beim Wasser nicht.
Wasser rein, Leistung rauf.
Halbvoll oder halbleer – auffüllen.
Dein Wasserziel ist kein Vorschlag. Trink.
Zwischen zwei Aufgaben passt immer ein Glas.
Trinken, eintragen, weitermachen. Routine.
Wasser ist Teil der Ernährung. Trage es wie eine Mahlzeit ein.
Ein Schluck reicht nicht. Ein Glas schon.
Durst kommt schleichend. Wasser kommt aus dem Hahn.
Nachfüllen. Dein Abendtraining fängt jetzt an.
Wasserziel heute: erreichbar. Wenn du jetzt trinkst.
Trink was. Es gibt keinen Grund, es nicht zu tun.
Glas, Flasche, egal. Hauptsache Wasser, jetzt.
Ein Liter bis zum Abend? Fang mit diesem Glas an.
Dein Körper trainiert, arbeitet, regeneriert. Alles mit Wasser.
Trinkerinnerung Nummer eins von wenigen. Nutze sie.
Wasser rein. Danach weiterlesen.
Ein Glas Wasser ist immer die richtige Antwort.
Kein Kaktus, kein Kamel. Trink regelmässig.
Nachlegen. Das Wasserziel erreicht sich nicht allein.
Trink was. Klingt banal, wirkt enorm.
Wasser zwischen den Mahlzeiten. Jetzt ist so ein Moment.
Flasche greifen, Glas leeren, eintragen. Fertig.
Zwei Sekunden für +500 ml. Kein Aufwand, echter Effekt.
`),
  weigh: lines(`
Nicht bewerten, nur messen.
Nüchtern, vor dem Kaffee. Eintragen, vergessen, weitermachen.
Ein Gewicht sagt nichts. Dreissig sagen alles. Heute einer davon.
Kurz drauf, Zahl eintragen. Der Trend erledigt den Rest.
Wiegen dauert zehn Sekunden. Die Zahl ist nur eine Zahl.
Gewicht eintragen – der 7-Tage-Schnitt braucht heute deinen Wert.
Waage, Zahl, Tagebuch. Keine Emotion nötig.
Gewicht rein. Schwankungen sind normal, Lücken nicht.
Der Trend ist die Wahrheit. Heute ein Punkt dazu.
Wiegen ist Messen, nicht Urteilen.
Zahl ablesen, eintragen, Tag beginnen.
Die Waage lügt nicht. Sie schwankt nur. Der Trend glättet das.
Ein Wert pro Morgen. Mehr braucht die Kurve nicht.
Draufstehen, ablesen, weitermachen. Kein Drama.
Gewicht ins Tagebuch. Die Linie will Futter.
Heute wiegen, in 30 Tagen verstehen.
Schwerer als gestern? Egal. Der Schnitt zählt.
Wiegen ist ein Datenpunkt, keine Bewertung deiner Woche.
Zehn Sekunden für die wichtigste Kurve deiner Phase.
Der Trend erkennt, was ein Tag nicht zeigen kann. Füttere ihn.
Gewicht eintragen. Dann Frühstück. Dann der Tag.
Morgens, nüchtern, gleiche Bedingungen. Das macht den Trend brauchbar.
Waage drauf, Zahl rein. Nichts weiter.
Ein Gewicht ist eine Momentaufnahme. Der Trend ist die Geschichte.
Gewicht eintragen – dein Aufbau will gemessen werden.
Nicht die Zahl, die Richtung zählt. Heute einen Punkt dazu.
Wiegen ist kein Test. Es ist Buchführung.
Gewicht rein und vergessen. Der Sonntag zeigt den Trend.
Waage, dann Wasser, dann Frühstück. In der Reihenfolge.
Heute nicht wiegen heisst: eine Lücke in der Kurve.
Der Morgenwert ist der ehrlichste. Nimm ihn.
Gewicht eintragen, ohne es zu kommentieren. Das kann die App.
Draufstehen. Die Zahl ist Information, sonst nichts.
Kein Gewicht ohne Tagebuch. Eintragen.
Der 7-Tage-Schnitt schützt dich vor Tageslaunen. Gib ihm Daten.
Wiegen wie Zähneputzen. Kurz, täglich, unaufgeregt.
Gewicht rein. Der Trend zeigt, ob der Plan wirkt.
Eine Zahl pro Tag. Das reicht, wenn sie jeden Tag kommt.
Waage drauf – auch wenn gestern viel war. Gerade dann.
Der Wert von heute ist morgen ein Teil des Schnitts.
Gewicht eintragen. Klein, regelmässig, wirksam.
Nüchtern wiegen, Zahl eintragen, fertig für heute.
Der Trend braucht Konstanz, nicht Perfektion. Heute einen Punkt.
Morgen-Check: Gewicht ins Tagebuch.
Wiegen ist Teil des Plans. Der Plan wirkt nur mit Daten.
Kurz auf die Waage. Der Rest passiert automatisch.
Gewicht rein, Kurve lesen, weitermachen.
Nicht jeden Tag gleich – deshalb jeden Tag messen.
Zahl ablesen, eintragen, keine Interpretation. Das kommt am Sonntag.
Waage wartet. Zehn Sekunden.
Gewicht eintragen – der Aufbau zeigt sich in der Kurve.
Ein Punkt mehr, ein klarerer Trend.
Draufstehen, ablesen, eintragen. Keine Meinung nötig.
Gewicht ins Tagebuch. Das ist alles für heute Morgen.
Wiegen gehört dazu. Ohne Wertung, mit Konsequenz.
Die Kurve lebt von morgens. Jetzt.
Gewicht rein. Der Trend ist dein Coach, nicht die Tageszahl.
Wiegen, eintragen, Frühstück. Fertig.
Heute ein Wert. In vier Wochen eine Aussage.
Waage drauf. Deine Phase will gemessen werden.
Gewicht eintragen – kurz, nüchtern, täglich.
Zahl ins Tagebuch. Kommentar unnötig.
Ein Morgen ohne Gewicht ist ein Loch in der Kurve. Schliess es.
Waage drauf, Zahl rein, Kaffee. Mehr braucht der Morgen nicht.
`),
  weekly: lines(`
Deine Woche ist da. Ehrlich hinschauen, dann weiter.
Wochenschnitt, Protein, Budget – ein Blick, dann Plan für die neue Woche.
Was lief, was nicht? Das Fazit steht im Tagebuch. Lesen lohnt sich.
Sieben Tage Daten. Schau dir den Schnitt an, nicht den einen Ausreisser.
Kalorien im Rahmen? Protein erreicht? Die Woche sagt es dir.
Erst der Rückblick, dann die Ziele prüfen. Trainingstage stimmen noch?
Zwei Minuten Lesen, sieben Tage Wirkung.
Die Woche ist durch. Was du misst, kannst du ändern.
Wochenfazit lesen, eine Sache für nächste Woche ableiten. Nur eine.
Schnitt anschauen. Der Schnitt ist ehrlicher als jeder einzelne Tag.
Rückblick: Wo hat das Protein gefehlt? Dort ansetzen.
Die Woche in Zahlen. Kein Urteil, eine Standortbestimmung.
Wochenbudget aufgegangen? Nachsehen, verstehen, weiter.
Sonntag ist Analysetag. Zwei Minuten, dann ist es erledigt.
Gewichtstrend der Woche prüfen. Richtung stimmt?
Die Woche ist vorbei. Das Fazit nicht. Lies es.
Sieben Tage, ein Schnitt, eine Erkenntnis. Hol sie dir.
Rückblick lesen, Phase prüfen, nächste Woche planen.
Was diese Woche gut war, nächste Woche wiederholen. Das Fazit zeigt es.
Wochenrückblick: Fakten statt Gefühl. Dafür trackst du.
Ehrlich hinschauen ist der Unterschied zwischen Tracken und Sammeln.
Die Woche ist im Kasten. Ein Blick auf Kalorien, Protein, Wasser.
Fazit lesen. Dann eine Anpassung, nicht fünf.
Der Schnitt sagt, wie es lief. Der einzelne Tag lügt gern.
Woche geschafft. Zahlen anschauen, Schlüsse ziehen, abhaken.
Rückblick, dann Ausblick. Trainingstage für nächste Woche stimmen?
Sieben Tage ehrlich getrackt? Dann ist das Fazit dein Lohn.
Wochenschnitt prüfen. Wenn er stimmt, stimmt der Plan.
Der Sonntagsblick ist der wichtigste der Woche. Nimm ihn.
Wochenfazit: kurz, sachlich, hilfreich. Lies es.
Die Woche bewertet man am Schnitt. Nicht am Samstag.
Rückblick lesen, dann Ziele unter „Mehr“ prüfen.
Was das Fazit sagt, gilt. Nicht das Bauchgefühl.
Sieben Tage Daten sind sieben Tage Klarheit. Nutze sie.
Woche vorbei. Bilanz lesen, eine Sache mitnehmen.
Wochenbudget, Protein, Gewicht – drei Blicke, ein Bild.
Der Rückblick zeigt Muster. Muster kann man ändern.
Sonntag: Woche schliessen, Woche planen.
Das Fazit ist da. Zwei Minuten, dann weisst du, wo du stehst.
Wochenschnitt statt Tagesstimmung. Lies die Zahlen.
Rückblick lesen ist Teil des Trainings. Der Teil ohne Schweiss.
Die Woche ist erfasst. Jetzt verstehen, was sie sagt.
Fazit lesen, dann Phase prüfen: Noch Aufbau? Noch passend?
Sieben Tage, ein ehrlicher Blick. Dann neu starten.
Wochenrückblick: Der Moment, in dem Tracken sich auszahlt.
Woche geschlossen. Was war stark, was war schwach? Steht drin.
Der Schnitt ist deine Wahrheit. Schau ihn dir an.
Rückblick, Erkenntnis, nächste Woche. In dieser Reihenfolge.
Zahlen der Woche lesen. Dann ist Sonntag.
Fazit lesen, Trainingstage setzen, Woche planen.
Wochenbilanz: Nicht perfekt sein, sondern wissen.
Sieben Tage im Tagebuch. Das Fazit fasst sie zusammen.
Rückblick jetzt, dann ist die Woche wirklich vorbei.
Die Woche in zwei Minuten. Lies das Fazit.
Wochenschnitt prüfen – und stolz sein, wenn er passt.
Woche vorbei. Ehrlich sein ist jetzt am einfachsten.
Fazit ansehen. Der Plan für nächste Woche steht zwischen den Zeilen.
Rückblick: Was wiederholst du, was lässt du?
Sieben Tage Arbeit, zwei Minuten Auswertung. Fair.
Die Woche ist erledigt. Der Blick zurück macht die nächste besser.
Wochenfazit lesen. Dann weisst du, ob der Kurs stimmt.
Woche gemessen. Jetzt verstehen.
Rückblick lesen, durchatmen, weitermachen.
Der ehrlichste Moment der Woche: das Fazit. Lies es.
`),
  protein: lines(`
Noch {n} g Protein offen. Skyr, Quark, Eier – deine Wahl.
Noch {n} g bis zum Ziel. Abendessen entsprechend planen.
{n} g fehlen noch. Ein Shake oder 200 g Quark schliessen die Lücke.
Noch {n} g Protein. Heute schaffbar, morgen egal.
{n} g Protein stehen noch aus. Das Abendessen entscheidet.
Noch {n} g. Fisch, Huhn, Hüttenkäse – such dir was aus.
{n} g offen. Wer aufbaut, isst jetzt eiweissreich.
Noch {n} g Protein. Kein Drama, nur eine Portion.
{n} g bis zum Protein-Ziel. Das ist eine Hähnchenbrust.
Noch {n} g. Quark mit Beeren erledigt das nebenbei.
Protein-Stand: {n} g fehlen. Abendessen ist die Antwort.
{n} g offen. Muskeln fragen nicht, sie brauchen.
Noch {n} g Protein bis zum Tagesziel. Machbar.
{n} g fehlen. Ein Skyr und die Sache ist erledigt.
Heute noch {n} g Protein. Rindfleisch, Eier oder ein Shake.
Noch {n} g. Das Abendessen kann das leisten.
{n} g Protein offen. Dein Aufbau will die Zahl voll sehen.
Noch {n} g bis zum Ziel. Kein Grund zur Panik, Grund zum Essen.
{n} g fehlen heute noch. Plan das Abendessen darum herum.
Protein-Check: {n} g offen. Zeit für Quark.
Noch {n} g Protein. Ein Glas Protein-Milch ist ein Anfang.
{n} g bis zum Ziel. Heute Abend schliessen.
Noch {n} g. Thunfisch, Eier, Hüttenkäse – schnell und einfach.
{n} g Protein offen. Abendessen eiweissreich, Rest egal.
Noch {n} g bis zum Tagesziel. Das ist machbar, wenn du es jetzt planst.
{n} g fehlen. Kleine Lücke, klare Lösung.
Noch {n} g Protein heute. Dein Körper wartet drauf.
{n} g offen. Nicht vergessen, nicht verschieben.
Noch {n} g. Magerquark ist dein Freund.
{n} g Protein bis zum Ziel. Dinner mit Fokus.
Noch {n} g offen. Wer jetzt plant, isst nachher richtig.
{n} g fehlen. Ein Shake nach dem Training passt.
Protein heute: {n} g offen. Abendessen regelt das.
Noch {n} g. Eine Portion Fleisch oder Fisch, fertig.
{n} g Protein bis zum Ziel. Das Abendessen hat Platz dafür.
Noch {n} g. Skyr im Kühlschrank? Dann ist es einfach.
{n} g offen. Muskelaufbau ist Bilanz, nicht Zufall.
Noch {n} g Protein. Setz das Abendessen entsprechend.
{n} g fehlen noch. Du weisst, was zu tun ist.
Noch {n} g bis zum Protein-Ziel. Klein genug, um es zu schaffen.
{n} g Protein offen. Quark, Eier, Huhn – pick one.
Noch {n} g. Der Tag ist nicht vorbei.
{n} g fehlen. Das ist eine Mahlzeit, kein Problem.
Noch {n} g Protein bis zum Ziel. Jetzt einplanen.
{n} g offen. Abendessen heisst heute: Protein zuerst.
Noch {n} g. Dein Wochenfazit wird es dir danken.
{n} g Protein fehlen. Hüttenkäse und fertig.
Noch {n} g bis zum Tagesziel. Ein Teller genügt.
{n} g offen. Zeit, das Abendessen zu bauen.
Noch {n} g Protein. Der Abend ist lang genug.
{n} g fehlen. Nicht viel, aber wichtig.
Noch {n} g bis zum Ziel. Eier braten dauert fünf Minuten.
{n} g Protein offen. Wer aufbaut, schliesst diese Lücke.
Noch {n} g. Shake, Skyr oder Fleisch – Hauptsache jetzt.
{n} g fehlen bis zum Protein-Ziel. Abendessen entscheidet.
Noch {n} g Protein heute. Ein klarer Auftrag.
{n} g offen. Nicht dramatisch, aber offen.
Noch {n} g bis zum Ziel. Planen, essen, abhaken.
{n} g Protein fehlen. Der Abend kann das.
Noch {n} g. Dein Körper baut, wenn du lieferst.
{n} g offen. Abendessen mit Protein-Fokus, dann passt der Tag.
Noch {n} g Protein bis zum Ziel. Du bist fast da.
{n} g fehlen. Quark, Beeren, Löffel. Erledigt.
Noch {n} g Protein. Ein Teller Huhn mit Reis, und der Tag passt.
`),
};

// ---------------------------------------------------------------- English
const enTitles: Record<ReminderKind, string[]> = {
  breakfast: lines(`Breakfast?|Good morning|Log breakfast|Start the day|Breakfast open|Morning routine|First entry|Short and honest`.replace(/\|/g, '\n')),
  lunch: lines(`Lunch|Halftime|Lunch in the diary?|Halfway mark|Meal two|Stay on it|Midday|No recalculating tonight`.replace(/\|/g, '\n')),
  dinner: lines(`Close the day|Dinner|Draw the line|Evening check|Last meal|Shut the diary|Evening|One more entry`.replace(/\|/g, '\n')),
  water: lines(`Drink up|Water|Thirst is late|Small break|Fluids|Hydration check|Refill|Don’t forget to drink`.replace(/\|/g, '\n')),
  weigh: lines(`Step on the scale|Morning weight|Data point|Scale|Measure, don’t guess|Feed the trend|Check-in|Mornings`.replace(/\|/g, '\n')),
  weekly: lines(`Weekly review|Sunday|The week in numbers|Week done|Review|New week|Weekly summary|Honest look`.replace(/\|/g, '\n')),
  protein: lines(`Protein open|{n} g protein to go|Protein gap|Protein target|Home stretch|Evening protein|The rest is protein|Don’t forget`.replace(/\|/g, '\n')),
};

const enBodies: Record<ReminderKind, string[]> = {
  breakfast: lines(`
Eaten? Log it. No data, no progress.
First entry of the day. Twenty seconds and the base is set.
What was on the plate belongs in the diary. Now, while you still know.
Quark, oats, eggs – whatever it was. Log it, move on.
The day has started, your diary hasn’t. Let’s fix that.
Brush teeth, coffee, log breakfast. In that order.
Breakfast in. No guessing tonight – it’s still accurate now.
Small action, big effect over the week. Log breakfast.
Log in the morning, don’t guess at night.
Breakfast is the easiest meal to log. So go.
One scan, one template, done. Your breakfast is waiting in the diary.
Log first, then the second coffee.
Breakfast eaten, breakfast logged. That’s what discipline looks like.
The day is long. The entry is short.
Standard breakfast? Tap the template, done.
Nothing eaten? That’s information too. No entry isn’t.
Your weekly average starts with this breakfast.
Before the day catches up with you: log breakfast.
Mornings are clear-headed. Use that for the first entry.
Logging breakfast means owning the day. Not the other way round.
No breakfast is still a breakfast. A logged one is better.
One entry in the morning saves three questions at night.
Oats and quark are already in your database. Just tap them.
Log breakfast: the smallest habit with the biggest lever.
Your protein target starts at breakfast, not at dinner.
Use the template, check the amount, save. Three taps.
Training day today? Then breakfast counts double. Log it.
First entry, then peace until lunch.
The day starts well when it starts in the diary.
Log it before you forget. Memory is not a database.
Breakfast is routine. So is logging it.
A clean diary starts about now.
You know exactly what you ate. For now. Use that.
Not perfect, but complete. Breakfast in.
Without a breakfast entry the day has no foundation.
Quick look, log it, move on. The rest of the day is yours.
The scanner is ready. Package, tap, done.
What was in the bowl this morning wants into the diary.
First entry, first small win of the day.
Log breakfast and you’ll already know at noon where you stand.
Habits beat motivation. Today: log breakfast.
The entry takes less time than the coffee.
Logged yet today? If not: now.
Breakfast in – and the day has a direction.
Don’t think, log. Thinking is for Sunday’s review.
Your body has eaten. Your diary hasn’t.
Logging breakfast isn’t a chore. It’s an advantage.
One tap on the template and the morning is done.
Data first, opinion later. Log breakfast.
Twenty seconds for an entry that carries the whole week.
Breakfast open in the diary. Let’s close it.
Morning is the best time for honest numbers.
Every meal counts today. Start with the first one.
Log breakfast – the diary wants to be complete.
Complete days make meaningful weeks. Step one: now.
A logged breakfast is a half-planned day.
Log it while the coffee brews.
Your breakfast is part of the plan. Log it.
Log in the morning, relax in the evening.
Breakfast into the diary. No big deal, big effect.
The diary is waiting for the first entry. Don’t keep it waiting.
Breakfast eaten? Into the diary, then it’s ticked off.
First entry of the day. Small step, clear line.
Breakfast in. The rest of the day builds on it.
`),
  lunch: lines(`
Logging takes 20 seconds and buys a week of clarity.
Log lunch – then you know what’s left for tonight.
Scan or search, three taps. Then quiet until dinner.
Log lunch now while the portion is still fresh in your head.
Protein check: how much is in already? Log it and see.
Lunch in, then look where the day stands. Facts, not feelings.
Rice, chicken, veg – whatever. Into the diary.
Weeks are won at noon, not on Sunday.
Lunch logged? Then half the day is clean.
Halftime. Quick look at the balance, then carry on.
What was on the plate? Log it before the afternoon blurs it.
Log lunch – the amount is still honest right now.
One entry at noon saves the maths tonight.
Lunch decides what dinner looks like. Log it.
Canteen, takeaway, home-cooked – it all counts. All of it goes in.
Lunch in, then you know how much room is left.
Check the halfway score. Lunch has to be in for that.
Log, don’t guess. Lunch, now.
The afternoon runs better with a clean diary.
Lunch into the diary – your evening will thank you.
Log at noon and you have options at night.
Three taps: search, amount, add. Done.
Lunch break is logging break. Short, but it matters.
Lunch in, then see if protein is on track.
Halftime score. There isn’t one without lunch in the diary.
Log it before the memory of the portion shrinks.
Lunch logged means dinner plannable.
The day is half done. The diary should be too.
In quick, out quick. Log lunch.
Numbers instead of gut feeling. Lunch gives you both.
Protein today yet? Lunch will tell you.
Log lunch – the second pillar of the day.
No day without a lunch entry. That’s the rule.
Lunch into the diary, then a clear head for the afternoon.
Template from last time? Copy, adjust, done.
Estimate the portion honestly, log it, move on.
The scanner does the work. Package, tap.
Lunch in. Your weekly budget wants to know where you stand.
Log it before the next meeting buries it.
Log lunch – twenty seconds of honesty.
A logged lunch makes the evening predictable.
What you log now, you won’t have to reconstruct tonight.
Lunch in. Training day or not, the number counts.
Halftime check: calories, protein, water. Log and read.
Logging lunch is the difference between a plan and chance.
Not later. Now. Lunch.
Ate lunch? Sure. Logged it? Now.
The entry is shorter than the wait for your coffee.
Lunch in – then the daily score is right.
Meal two into the diary. Two of five, good ratio.
Log it while it’s fresh. In your head and on the plate.
Log lunch, then the afternoon is free.
One look at lunch, one look at the targets. Log it.
Know where you stand at noon, eat better at night.
Lunch into the diary. The weekly summary will thank you.
In it goes. The afternoon is for other things.
Lunch in, protein check, carry on.
The week lives on complete days. Lunch is the second block.
Twenty seconds of effort for an evening without guesswork.
Log lunch. Quick reach for the phone, big effect.
What was on the plate belongs in the diary. At noon too.
Lunch in. Then you know exactly what’s missing.
Log it, then relax into the afternoon.
Lunch into the diary – a routine that pays.
`),
  dinner: lines(`
Log dinner, know where you stand.
Last entry, then the day is clean. Tomorrow starts at zero.
Log dinner and look at the daily summary. Honest, not harsh.
Log dinner – the week counts every day, today included.
What was on the plate? Log it, close the day, switch off.
Calories, protein, done. Two minutes and the day is in the books.
In it goes. No day without complete data – that’s the deal.
Log dinner. Tomorrow you’ll know what today was.
The day is nearly done. One more entry and it’s complete.
Dinner in, then read the summary. That’s the moment of truth.
Last meal into the diary. Then it’s evening, for logging too.
Closing the day means logging dinner. Otherwise it stays open.
No day ends without dinner in the diary.
Log dinner, check the balance, sleep well.
The last entry is the most important one. It completes the day.
Dinner in. Then you’ll see whether the protein was enough.
Two minutes and the day is closed.
Log it while the plate is still in front of you.
Dinner into the diary. Your weekly average needs this day.
There’s no summary without dinner. So in it goes.
End the day the way it started: with an entry.
Log dinner. Then you can put the phone down.
Last entry, last look, good night.
What was on tonight’s plate wants into the diary.
Dinner in – tomorrow you start with a clean day.
Complete day or a gap? Your call. Log dinner.
The week is made of closed days. Close this one.
Dinner into the diary. Honesty costs two minutes.
In it goes, then you know whether today fit.
Log dinner. The day deserves to be complete.
Last item on the list: log dinner.
The evening starts after the last entry.
Dinner in, check the weekly budget, switch off.
Day closed, numbers clear. Log dinner.
The entry takes less time than the dishes.
Dinner into the diary – then today is done.
Don’t estimate, log. It’s still accurate now.
Log dinner, then read the daily summary. You might like it.
In it goes. A day without an end is half a day.
Log dinner – your Sunday review wants complete data.
The day is ending. The diary should be too.
Last entry, then you’re done.
Dinner in. Two minutes that make the day count.
What you log now is a clean data point tomorrow.
Dinner into the diary. Then you know if the protein was enough.
Complete beats perfect. Log dinner.
Close the day. Dinner in, read the summary, done.
Log dinner – the full stop of the day.
In it goes. Then you can honestly say: logged today.
Log dinner before the evening makes you forget.
The day is over. Now put it in numbers.
Dinner into the diary. Your trend needs complete days.
Last meal, last entry, clean day.
Dinner in. Close today, start fresh tomorrow.
Log, then summary. Maybe today turned out fine.
Log dinner. The diary wants the whole day, not half.
Two minutes for a complete day. Worth it.
Dinner in, day closed, head clear.
No open day in the diary. Log dinner.
The last entry decides whether the summary is right.
Dinner into the diary, then it’s evening.
Complete the day. Log dinner.
In it goes. Tomorrow morning you’ll thank yourself.
Log dinner – short, honest, done.
`),
  water: lines(`
You’re not a cactus.
One glass now. Tomorrow’s training says thanks.
Drink before thirst shows up. +500 ml, one tap.
Stand up, get water, carry on. Still counts.
Muscle is about 75 % water. Top up.
Where are you on the water goal? Look, then pour.
Coffee doesn’t count. Water does.
Glass empty? Fill it, log it. Two seconds.
Afternoon headache? Often just thirst. Drink.
A big glass now saves you the slump later.
Water is the cheapest supplement. Take it.
Bottle next to you? Then you know what to do.
Drinking isn’t a task. It’s a reflex you train.
+250 ml. Now. Then carry on.
Hydrated training is better training. Full stop.
Your water goal is waiting. One glass closer.
Thirst is an alarm, not a hint. Drink first.
Water, not miracles. Drink up.
Halfway on water? Check the diary.
A glass of water is the easiest decision of the day.
Top up. Your brain works better on water.
Drink and log. Both take seconds.
Water in. Your metabolism doesn’t run dry.
Small and steady. One glass now, one in two hours.
Your cells want water, not excuses.
Reach for the bottle. Now.
Half a litre now puts you back on track.
Drink up. Your focus depends on it.
Water goal in sight? Top up if needed.
Simplest habit in the world: fill glass, drink, log.
No water, no pump. Drink.
Fluids in, head clear.
One glass per reminder. That’s the deal.
Drinking is training for the lazy. Join in.
Your water level is lower than you think. Refill.
Water before the next coffee. Rule.
Drink break. Twenty seconds, then on you go.
Supplies for the muscles. Water.
The body reports thirst late. Be faster.
One glass now, one next time. That’s how the goal happens.
Drink up. There are no excuses with water.
Water in, performance up.
Half full or half empty – fill it up.
Your water goal isn’t a suggestion. Drink.
There’s always room for a glass between two tasks.
Drink, log, carry on. Routine.
Water is part of nutrition. Log it like a meal.
A sip isn’t enough. A glass is.
Thirst creeps up. Water comes from the tap.
Top up. Tonight’s training starts now.
Water goal today: reachable. If you drink now.
Drink up. There’s no reason not to.
Glass, bottle, whatever. Just water, now.
A litre by tonight? Start with this glass.
Your body trains, works, recovers. All on water.
Drink reminder, one of few. Use it.
Water in. Then keep reading.
A glass of water is always the right answer.
Not a cactus, not a camel. Drink regularly.
Top up. The water goal doesn’t reach itself.
Drink up. Sounds trivial, works wonders.
Water between meals. Now is one of those moments.
Grab the bottle, empty the glass, log it. Done.
Two seconds for +500 ml. No effort, real effect.
`),
  weigh: lines(`
Don’t judge, just measure.
Fasted, before coffee. Log it, forget it, move on.
One weight says nothing. Thirty say everything. Today is one of them.
Hop on, log the number. The trend does the rest.
Weighing takes ten seconds. The number is just a number.
Log your weight – the 7-day average needs today’s value.
Scale, number, diary. No emotion required.
Weight in. Fluctuations are normal, gaps are not.
The trend is the truth. One more point today.
Weighing is measuring, not judging.
Read the number, log it, start the day.
The scale doesn’t lie. It just fluctuates. The trend smooths it.
One value per morning. That’s all the curve needs.
Step on, read, move on. No drama.
Weight into the diary. The line wants feeding.
Weigh today, understand in 30 days.
Heavier than yesterday? Whatever. The average counts.
Weighing is a data point, not a verdict on your week.
Ten seconds for the most important curve of your phase.
The trend sees what a single day can’t. Feed it.
Log weight. Then breakfast. Then the day.
Morning, fasted, same conditions. That’s what makes the trend useful.
Scale on, number in. Nothing more.
A weight is a snapshot. The trend is the story.
Log your weight – your bulk wants to be measured.
Not the number, the direction counts. One more point today.
Weighing isn’t a test. It’s bookkeeping.
Weight in and forget it. Sunday shows the trend.
Scale, then water, then breakfast. In that order.
Not weighing today means a gap in the curve.
The morning value is the most honest one. Take it.
Log weight without commenting on it. The app can do that.
Step on. The number is information, nothing else.
No weight without the diary. Log it.
The 7-day average protects you from daily moods. Give it data.
Weigh like you brush your teeth. Short, daily, unbothered.
Weight in. The trend shows whether the plan works.
One number a day. That’s enough, if it comes every day.
Scale on – even if yesterday was big. Especially then.
Today’s value is part of tomorrow’s average.
Log weight. Small, regular, effective.
Weigh fasted, log the number, done for today.
The trend needs consistency, not perfection. One point today.
Morning check: weight into the diary.
Weighing is part of the plan. The plan only works with data.
Quick step on the scale. The rest happens automatically.
Weight in, read the curve, move on.
Not the same every day – that’s why you measure every day.
Read the number, log it, no interpretation. That comes on Sunday.
The scale is waiting. Ten seconds.
Log your weight – the bulk shows in the curve.
One more point, a clearer trend.
Step on, read, log. No opinion needed.
Weight into the diary. That’s all for this morning.
Weighing is part of it. No judgement, with consistency.
The curve lives on mornings. Now.
Weight in. The trend is your coach, not today’s number.
Weigh, log, breakfast. Done.
One value today. A statement in four weeks.
Scale on. Your phase wants to be measured.
Log weight – short, fasted, daily.
Number into the diary. No comment needed.
A morning without a weight is a hole in the curve. Close it.
Scale on, number in, coffee. That is all the morning needs.
`),
  weekly: lines(`
Your week is in. Look at it honestly, then move on.
Weekly average, protein, budget – one look, then plan the new week.
What worked, what didn’t? The summary is in the diary. Worth reading.
Seven days of data. Look at the average, not the one outlier.
Calories on track? Protein reached? The week will tell you.
Review first, then check your targets. Training days still right?
Two minutes of reading, seven days of effect.
The week is done. What you measure, you can change.
Read the summary, take one thing for next week. Just one.
Look at the average. It’s more honest than any single day.
Review: where was protein missing? Start there.
The week in numbers. No verdict, a position check.
Did the weekly budget add up? Look, understand, move on.
Sunday is analysis day. Two minutes and it’s done.
Check the week’s weight trend. Direction right?
The week is over. The summary isn’t. Read it.
Seven days, one average, one insight. Go get it.
Read the review, check the phase, plan next week.
What was good this week, repeat next week. The summary shows it.
Weekly review: facts instead of feelings. That’s why you log.
Looking honestly is the difference between tracking and collecting.
The week is in the books. One look at calories, protein, water.
Read the summary. Then one adjustment, not five.
The average tells you how it went. Single days like to lie.
Week done. Look at the numbers, draw conclusions, tick it off.
Review, then outlook. Training days for next week still right?
Seven days logged honestly? Then the summary is your reward.
Check the weekly average. If it fits, the plan fits.
The Sunday look is the most important one of the week. Take it.
Weekly summary: short, factual, useful. Read it.
Judge the week by the average. Not by Saturday.
Read the review, then check targets under More.
What the summary says, goes. Not the gut feeling.
Seven days of data are seven days of clarity. Use them.
Week over. Read the balance, take one thing with you.
Weekly budget, protein, weight – three looks, one picture.
The review shows patterns. Patterns can be changed.
Sunday: close the week, plan the week.
The summary is in. Two minutes and you know where you stand.
Weekly average over daily mood. Read the numbers.
Reading the review is part of training. The part without sweat.
The week is logged. Now understand what it says.
Read the summary, then check the phase: still bulking? Still fitting?
Seven days, one honest look. Then start again.
Weekly review: the moment logging pays off.
Week closed. What was strong, what was weak? It’s in there.
The average is your truth. Look at it.
Review, insight, next week. In that order.
Read the week’s numbers. Then it’s Sunday.
Read the summary, set training days, plan the week.
Weekly balance: not about being perfect, about knowing.
Seven days in the diary. The summary sums them up.
Review now, then the week is really over.
The week in two minutes. Read the summary.
Check the weekly average – and be proud if it fits.
Week over. Being honest is easiest right now.
Look at the summary. Next week’s plan is between the lines.
Review: what do you repeat, what do you drop?
Seven days of work, two minutes of analysis. Fair.
The week is done. Looking back makes the next one better.
Read the weekly summary. Then you know if the course is right.
Week measured. Now understand it.
Read the review, breathe, carry on.
The most honest moment of the week: the summary. Read it.
`),
  protein: lines(`
{n} g of protein still open. Skyr, quark, eggs – your call.
{n} g to go. Plan dinner accordingly.
{n} g still missing. A shake or 200 g of quark closes the gap.
{n} g of protein to go. Doable today, irrelevant tomorrow.
{n} g of protein outstanding. Dinner decides.
{n} g left. Fish, chicken, cottage cheese – pick one.
{n} g open. If you’re building, eat protein now.
{n} g of protein to go. No drama, just one portion.
{n} g to the protein target. That’s one chicken breast.
{n} g left. Quark with berries does it on the side.
Protein status: {n} g missing. Dinner is the answer.
{n} g open. Muscles don’t ask, they need.
{n} g of protein to the daily target. Doable.
{n} g missing. One skyr and it’s sorted.
{n} g of protein still today. Beef, eggs or a shake.
{n} g left. Dinner can handle that.
{n} g of protein open. Your bulk wants the number full.
{n} g to the target. No reason to panic, reason to eat.
{n} g missing today. Plan dinner around it.
Protein check: {n} g open. Time for quark.
{n} g of protein to go. A glass of protein milk is a start.
{n} g to the target. Close it tonight.
{n} g left. Tuna, eggs, cottage cheese – quick and easy.
{n} g of protein open. Dinner high in protein, rest doesn’t matter.
{n} g to the daily target. Doable if you plan it now.
{n} g missing. Small gap, clear solution.
{n} g of protein still today. Your body is waiting for it.
{n} g open. Don’t forget, don’t postpone.
{n} g left. Low-fat quark is your friend.
{n} g of protein to the target. Dinner with focus.
{n} g open. Plan now, eat right later.
{n} g missing. A post-workout shake fits.
Protein today: {n} g open. Dinner sorts it.
{n} g left. One portion of meat or fish, done.
{n} g of protein to the target. Dinner has room for it.
{n} g left. Skyr in the fridge? Then it’s easy.
{n} g open. Muscle gain is a balance, not luck.
{n} g of protein to go. Set dinner accordingly.
{n} g still missing. You know what to do.
{n} g to the protein target. Small enough to make it.
{n} g of protein open. Quark, eggs, chicken – pick one.
{n} g left. The day isn’t over.
{n} g missing. That’s one meal, not a problem.
{n} g of protein to the target. Plan it in now.
{n} g open. Dinner tonight means: protein first.
{n} g left. Your weekly summary will thank you.
{n} g of protein missing. Cottage cheese and done.
{n} g to the daily target. One plate is enough.
{n} g open. Time to build dinner.
{n} g of protein left. The evening is long enough.
{n} g missing. Not much, but important.
{n} g to the target. Frying eggs takes five minutes.
{n} g of protein open. If you’re building, close this gap.
{n} g left. Shake, skyr or meat – as long as it’s now.
{n} g missing to the protein target. Dinner decides.
{n} g of protein still today. A clear brief.
{n} g open. Not dramatic, but open.
{n} g to the target. Plan, eat, tick off.
{n} g of protein missing. The evening can do that.
{n} g left. Your body builds when you deliver.
{n} g open. Dinner with a protein focus, then the day fits.
{n} g of protein to the target. You’re almost there.
{n} g missing. Quark, berries, spoon. Done.
{n} g of protein to go. A plate of chicken and rice and the day fits.
`),
};

export const REMINDER_TEXTS: Record<Language, { titles: Record<ReminderKind, string[]>; bodies: Record<ReminderKind, string[]> }> = {
  de: { titles: deTitles, bodies: deBodies },
  en: { titles: enTitles, bodies: enBodies },
};

/**
 * Wählt Titel und Text so, dass alle Varianten einmal durch sind, bevor sich eine
 * wiederholt. `seq` ist ein fortlaufender Zähler pro Anlass (z.B. Tage seit Epoche);
 * `salt` verschiebt die Reihenfolge pro Nutzer, damit nicht alle dieselbe Sequenz sehen.
 */
export function pickText(lang: Language, kind: ReminderKind, seq: number, salt = 0, params?: Record<string, string | number>): Msg {
  const { titles, bodies } = REMINDER_TEXTS[lang];
  const body = bodies[kind][permutedIndex(seq, bodies[kind].length, salt)];
  const title = titles[kind][permutedIndex(seq, titles[kind].length, salt + 3)];
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => (params && params[k] !== undefined ? String(params[k]) : `{${k}}`));
  return { title: fill(title), body: fill(body) };
}

/** Index einer Permutation über n Elemente: Schritt teilerfremd zu n → jede Position genau einmal pro n. */
export function permutedIndex(seq: number, n: number, salt: number): number {
  const steps: number[] = [];
  for (let s = 1; s < n; s++) if (gcd(s, n) === 1) steps.push(s);
  const step = steps[Math.abs(salt) % steps.length] ?? 1;
  return (((seq * step) % n) + n) % n;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
