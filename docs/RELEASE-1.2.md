# Checkliste: Version 1.2

Angelegt am 10.10.2026, vor dem Launch von 1.1. Noch kein Termin.

Diese Liste hat zwei Teile: **was in 1.2 neu kommt** und **was danach wieder stimmen muss**. Der
zweite Teil ist der wichtigere. Beschreibung, Screenshots, Keywords und „Neu in dieser Version"
lassen sich nur mit einer neuen Version ändern. Was hier vergessen geht, steht bis 1.3 falsch im
Store (siehe Tabelle in `docs/RELEASE-1.1.md`).

---

## A. Was in 1.2 kommt

**Stand 15.10.2026, 13:30:** A1–A6 gebaut, dazu **mitgelieferte Open-Food-Facts-Produkte**
(neu, Wunsch Luca nach Test von Build 23). **1.2 (Build 24) in TestFlight.** Tests: 160 Unit, 43 e2e.
Teil B erledigt bis auf das, was nur in App Store Connect geht (B3, Einreichung).

Build 23 → 24, nach Lucas Test:
- „Ei" fand das Ei nicht (Eiswein, Eierlikör standen oben): Rangfolge in `src/lib/foodRank.ts`
  jetzt ganzes Wort > Wortende > Wortanfang > Wortmitte (deutsche Komposita).
- Schritte waren nur im Wochenfazit: jetzt auch im Tagebuch unter den Aktivkalorien.
- Open Food Facts lud oft langsam: **288'776 Produkte mitgeliefert** (`public/data/off-products.tsv.gz`,
  8,2 MB, ODbL), erzeugt mit `tools/build-off-products.mjs` aus dem OFF-Export. Auswahl weltweit:
  200'000 meistgescannte + 5'000 meistgescannte je Land. Scan und Suche schauen zuerst dort,
  online nur noch von selbst bei weniger als 5 Treffern. **Vor jedem Release neu erzeugen.**
- A1 USDA: 6'304 Einträge in `src/db/reference/usda.json` (eigene Datei, Schlüssel `usda:`),
  erzeugt mit `tools/add-usda-foods.mjs`. Dabei Fehler gefunden: Anlegen und Sprachabgleich liefen
  gleichzeitig und legten USDA doppelt an – jetzt nacheinander (`serialized` in `src/db/seed.ts`).

Was beim Bauen anders wurde als geplant:
- A6: Die Untergrenze (Grundumsatz) greift mit DGE-Faktoren praktisch nie (1,4 × 0,85 = 1,19 ×
  Grundumsatz). Sie bleibt als Sicherheitsnetz; der Test prüft sie über viele Kombinationen.
- A5: Stückgewichte stammen aus **USDA SR Legacy** (`food_portion`, CC0), 47 Einträge in
  `src/db/pieceWeights.ts`, je mit FDC-ID. Brot fehlt bewusst (Scheibe ≠ Stück, eigene Einheit nötig).
  Die USDA-Quelle muss mit A1 ohnehin in `more.about` und die Store-Texte (B2).
- A4: Hinweis-Zustand liegt im localStorage (Gerätezustand, nicht im Backup), nicht in den Settings.
  Hinweise erscheinen nacheinander: Tagestyp erst nach dem ersten Eintrag.
- A3: Schritte nur nativ; ohne Health keine Zeile im Fazit. Nutzer mit Health aus 1.1 werden beim
  ersten Start einmal nach Schritten gefragt.

### A1. USDA FoodData Central – amerikanische Grundnahrungsmittel

- **Quelle:** USDA FoodData Central, Teil **SR Legacy** (~7'800 Grundnahrungsmittel).
  Gemeinfrei (CC0); eine Namensnennung ist nicht vorgeschrieben, wird aber empfohlen.
  Download: https://fdc.nal.usda.gov/download-datasets (CSV).
- **Warum:** TikTok bringt voraussichtlich englischsprachige Nutzer. Der BLS führt britische
  Namen und deutsche Rezepturen; US-Nutzer suchen „cheddar cheese, sharp" oder „turkey breast,
  deli".
- **Werkzeug:** neues Skript `tools/add-usda-foods.mjs`, aufgebaut wie `tools/add-swiss-foods.mjs`
  (wiederholbar, schreibt in `src/db/reference/`).
- **Schlüssel:** `ref_key` mit eigenem Präfix (z. B. `usda:171077`), damit er nie mit BLS- oder
  Schweizer Codes kollidiert. `dropRetiredReference` in `src/db/seed.ts` **nicht** anfassen
  (Sackgasse aus 1.1, siehe `handoff.md` Punkt 5).
- **Dubletten:** Was der BLS schon hat (Milch, Ei, Haferflocken), nicht doppelt übernehmen, sonst
  verdoppelt sich die Suche. Wie beim Schweizer Skript über einen Namensvergleich filtern.
- **Bundle-Grösse:** vorher und nachher messen (`npm run build`, Grösse von `dist/`). Die
  Referenztabellen werden mit der App ausgeliefert.
- **Performance:** erster Tastendruck in der Suche nachmessen (Stand 1.1: 46 ms). Liegt er
  deutlich höher, ist das ein Hindernis.
- **Tests:** Unit-Test fürs Einlesen (leere Zellen, Kommas in Namen in der CSV), e2e-Test im Projekt
  `us`: „cheddar" findet einen USDA-Eintrag.

**Entschieden (10.10.2026) – Sprache:** USDA-Einträge erscheinen **nur in englischer
App-Sprache**. USDA hat nur englische Namen; in der deutschen Suche stünden sie sonst neben den
deutschen. Folgen für den Bau:
- Beim Wechsel auf Deutsch werden die USDA-Einträge ausgeblendet, beim Wechsel auf Englisch wieder
  eingeblendet. Der Sprachabgleich in `src/db/seed.ts` muss das abdecken.
- **Ausnahme:** Hat ein Nutzer einen USDA-Eintrag schon geloggt, zum Favoriten gemacht oder
  bearbeitet, bleibt er sichtbar. Das Tagebuch ist ohnehin sicher, weil Einträge die Nährwerte
  als Kopie speichern.
- e2e-Test im Projekt `mobile` (de-CH): „cheddar" findet **keinen** USDA-Eintrag.

### A2. Bekannte Fehler aus 1.1

- [x] Die 17 Startlebensmittel aus `SEED` (Magerquark, Haferflocken …) folgen keinem
      Sprachwechsel. Lösung über einen eigenen Schlüssel für diese Einträge, **nicht** über
      `dropRetiredReference` (siehe `handoff.md` Punkt 5).
- [x] Veralteter Kommentar in `src/db/types.ts:72`: spricht von der „USDA-Tabelle", gemeint ist
      seit Build 17 der BLS. Wird mit A1 wieder teilweise richtig, dann sauber formulieren.
- [x] Store-Seite zeigt unter „Sprachen" nur **Englisch** (gesehen am 12.10.2026 auf der Live-Seite
      von 1.1). Apple liest die Sprachen aus den `.lproj`-Ordnern im Bundle, nicht aus
      `CFBundleLocalizations`. Im Projekt gibt es nur `Base.lproj`, `knownRegions` kennt nur `en`.
      Lösung: in Xcode Deutsch als Lokalisierung hinzufügen und eine `de.lproj/InfoPlist.strings`
      (z. B. mit `CFBundleDisplayName`) ins Ziel „App" legen. Danach im `.ipa` prüfen, dass
      `de.lproj` drin ist.

- [x] Backup wiederherstellen löschte die mitgelieferten Grundnahrungsmittel, wenn das Backup
      sie nicht enthielt (Backups aus 1.0), und der Vermerk im localStorage verhinderte das
      Nachladen. Gefunden am 14.10.2026 beim Erzeugen von Screenshot 7. Behoben in
      `src/db/seed.ts` (`refreshReferenceAfterRestore`), aufgerufen in `restoreBackup`; e2e-Test in
      `e2e/week-weight-backup.spec.ts`. **Geht erst mit dem nächsten Build raus** (Web sofort mit Push).

- [x] Schalter „App als Free-Nutzer ansehen" unter Mehr → Pro war im Store-Build für alle Early
      Adopter sichtbar (gemeldet von Luca am 12.10.2026). Keine Lücke, aber verwirrend, und in der
      Free-Ansicht wäre ein zweiter Kauf möglich. Behoben in `src/components/ProSection.tsx`: nur noch
      in Entwicklungs-Builds (`import.meta.env.DEV`). **Geht erst mit dem nächsten Build raus.**

### A3. Schritte aus Apple Health (entschieden 13.10.2026)

Schritte **lesen**, nicht selbst zählen: Health kennt sie schon, inklusive Apple Watch, und
rechnet Doppelzählungen heraus. Kein eigener Zähler über CoreMotion.

- **Leitlinie:** Schritte erklären, sie steuern nicht. Sie verändern **nie** Kalorien- oder
  Makroziele, kein „verdiente Kalorien". Das widerspräche Trend-Zielen und Wochenbudget
  (`docs/COACHING-RULES.md`).
- **Kein Schrittziel.** Luca hat es am 13.10.2026 bewusst weggelassen; erst wieder prüfen, wenn
  Nutzer danach fragen.
- **Native:** `stepCount` (`HKQuantityTypeIdentifier.stepCount`) in `ios/App/App/HealthBridgePlugin.swift`
  zu den Lesetypen; neue Methode für die Tagessumme über einen Zeitraum per
  `HKStatisticsCollectionQuery` mit `.cumulativeSum` (nicht Samples addieren, sonst zählen iPhone
  und Watch doppelt). Bestehende Nutzer werden beim nächsten Öffnen einmal neu gefragt, das ist
  normal.
- **App:** `src/lib/health.ts` um das Lesen erweitern, wie `readActiveEnergy`. Nur mit Pro und
  `health_enabled`, in der Web-Version unsichtbar.
- **Anzeige:** Wochenschnitt der Schritte in der Wochenansicht (`src/lib/week.ts`). Tageswert
  optional in der Tagesübersicht neben der aktiven Energie.
- **Fazit:** Hinweis, wenn der Gewichtstrend stockt **und** die Schritte deutlich unter dem Schnitt
  der vier Wochen davor liegen (Schwelle festlegen, Vorschlag −20 %). Beispiel: „Gewicht stagniert,
  Schritte −25 % gegenüber deinem Schnitt." Texte in `src/i18n/de.ts` und `en.ts`.
- **Datenlücken:** Tage ohne Health-Daten zählen nicht als 0, sonst fällt der Schnitt falsch.
- **Tests:** Unit-Tests für Wochenschnitt und Fazit-Regel (inkl. Lücken), e2e: ohne Health keine
  Schrittanzeige.
- **Store:** Danach Beschreibung („Apple Health"-Absatz) und B-Teil prüfen.

### A4. Erste Schritte: Hinweise im Moment statt Tour (entschieden 13.10.2026)

Keine Folien-Tour und keine Spotlight-Tour nach dem Onboarding: Die werden weggetippt, und nach drei
Einrichtungsschritten ist das zu viel. Stattdessen erklärt die App ihre Besonderheiten dort, wo man
sie zum ersten Mal sieht. Das Eintragen selbst braucht keine Erklärung.

- **Leerer erster Tag:** Leerzustand mit Pfeil zum Plus, z. B. „Trag dein erstes Lebensmittel ein,
  auch ohne Internet."
- **Einmalige Hinweise** (je eine Zeile, mit einem Tipp wegklickbar):
  - Tagesübersicht: Trainings- oder Ruhetag umschalten, die Ziele passen sich an.
  - Erster Besuch der Wochenansicht: Wochenbudget, ein Tag über Ziel ist okay.
  - Nach dem dritten Gewichtseintrag: Der 7-Tage-Trend zählt, nicht der Einzelwert.
  - Nach dem ersten wiederholten Frühstück: als Vorlage speichern (Pro; für Free als Hinweis auf
    Pro, nicht als Sperre formulieren).
- **Speichern:** gesehene Hinweise lokal in den Einstellungen (z. B. `tips_seen: string[]` in
  `src/db/types.ts`, neben `onboarding_done`). Unter „Mehr" ein Schalter „Hinweise wieder zeigen".
- **Bestehende Nutzer:** Wer vor 1.2 schon Einträge hat, bekommt die Hinweise **nicht**
  (Leerzustand bleibt). Sonst wirkt das Update wie ein Rückschritt.
- **Ton:** Coach, kurz, kein Ausrufezeichen-Marketing. Texte in `src/i18n/de.ts` und `en.ts`.
- **Tests:** e2e: frischer Start zeigt Leerzustand, Hinweis verschwindet nach Tipp und bleibt nach
  Neuladen weg; Nutzer mit Daten sieht keine Hinweise. Bestehende e2e-Tests dürfen nicht an
  Hinweis-Overlays hängen bleiben (Hinweise in den Test-Fixtures als gesehen markieren).
- **Messen geht nicht** (keine Analytics, Absicht). Wirkung über Rückmeldungen und Bewertungen
  beurteilen.
- **Store:** Screenshots nach dem Bau prüfen, dass kein Hinweis darauf steht
  (`store/screenshots.mjs`: Hinweise als gesehen setzen).

### A5. Stückzahl für Grundnahrungsmittel (Idee Luca, 14.10.2026)

Ziel: „Banane 1 Stk." oder „Eier 3 Stk." eintragen, ohne Gramm zu kennen.

**Stand 1.1:** Stück gibt es schon, aber nur für **eigene** Lebensmittel (`unit_type: 'piece'` mit
`piece_weight_g` in `src/components/FoodItemForm.tsx`). Die 6'900 mitgelieferten Einträge sind alle
`'weight'`. Wer „Ei" sucht, muss Gramm eingeben.

- **Stückgewichte für häufige Lebensmittel** als eigene kleine Tabelle (Schlüssel = `ref_key`),
  z. B. Ei (M) 60 g, Banane 120 g, Apfel 150 g, Scheibe Brot 40 g, Toastscheibe 25 g, Kiwi 75 g.
  Rund 50–100 Einträge reichen für den Alltag. Quelle für jeden Wert notieren (Datentreue,
  `docs/COACHING-RULES.md`), keine geschätzten Werte ohne Beleg.
- **Eingabe:** Bei solchen Einträgen im Mengen-Stepper Umschalter „g | Stk." mit Stück als Vorgabe.
  Gespeichert bleibt wie heute die Menge im Snapshot, damit alte Tage unverändert bleiben.
- **Zahl im Namen anzeigen:** „3 Stk. (180 g)", damit klar ist, womit gerechnet wird.
- **Eigene Korrektur:** Stückgewicht pro Lebensmittel änderbar (ein grosses Ei ist 70 g).
- **Free oder Pro?** Vorschlag: **Free**. Portionsgrössen bleiben Pro; Stück ist so grundlegend,
  dass es ohne Kauf gehen muss, sonst wirkt die App kaputt.
- **Tests:** Unit-Test Umrechnung Stk. ↔ g, e2e: „Ei" suchen, 3 Stk. eintragen, kcal stimmen.

### A6. Bedarfsrechner jederzeit erreichbar (Idee Luca, 14.10.2026)

Ziel: Wer keine Ahnung hat, gibt Grösse, Alter, Geschlecht, Gewicht und Aktivität ein und bekommt
seinen Bedarf.

**Stand 1.1:** Der Rechner ist schon da – aber **nur im Onboarding** (`src/lib/onboarding.ts`,
`bmrMifflin` + `suggestGoals`, Mifflin-St Jeor mit Aktivitätsfaktor). Wer dort „Überspringen" tippt
oder später neu rechnen will (anderes Gewicht, neue Phase), kommt nicht mehr hin.

- **Einstieg:** in Mehr → Ziele/Phase ein Knopf „Bedarf berechnen", dazu bei leerer Phase ein
  Hinweis (passt zu A4). Öffnet denselben Ablauf wie das Onboarding (Körperdaten → Vorschlag),
  Komponente aus `Onboarding.tsx` herauslösen statt kopieren.
- **Ergebnis erklären:** Grundumsatz, Gesamtbedarf und das vorgeschlagene Ziel je Phase (Aufbau,
  Defizit, Erhalt) in einem Satz. Werte sind ein **Startpunkt**; nach 2–3 Wochen zählt der
  Gewichtstrend (Coaching-Regeln). Das gehört sichtbar dazu, sonst wirkt die Zahl wie eine Messung.
- **Übernehmen statt Überschreiben:** Vorschlag zeigen, „Als neue Phase übernehmen" oder
  „Aktuelle Phase anpassen". Nie still bestehende Ziele ändern.
- **Aktuelles Gewicht vorbelegen** aus dem 7-Tage-Schnitt, falls vorhanden.
- **Free.** Ist heute im Onboarding auch gratis.

**Rechnung realistischer machen (entschieden 14.10.2026).** Mifflin-St Jeor mit Geschlecht, Alter,
Grösse und Gewicht bleibt (genaueste Formel ohne Körperfettmessung). Geändert wird in
`src/lib/onboarding.ts`:

1. **Alltag und Training trennen.** Heute steckt beides in `Activity` (4 Stufen, Faktor 1,35–1,8).
   Neu zwei Fragen: *Alltag* (sitzend / gemischt / stehend / körperlich, Faktor auf den Grundumsatz)
   und *Trainingstage pro Woche* (wird schon gefragt, fliesst bisher nur in die Verteilung
   Trainings-/Ruhetag). Training als Zuschlag pro Woche, über die Tage verteilt. Faktoren und
   Zuschlag aus einer Quelle (z. B. FAO/WHO-PAL-Werte) übernehmen und im Code nennen.
2. **Untergrenze:** Kein Tagesziel unter dem Grundumsatz. Greift die Grenze, Hinweis im Ergebnis
   („Langsameres Defizit, dafür haltbar").
3. **Protein bei hohem BMI:** ab BMI > 30 Protein auf ein Referenzgewicht aus der Grösse rechnen
   (z. B. Gewicht bei BMI 25), nicht auf das volle Körpergewicht. Fett ebenso.
4. **Herleitung als Tabelle im Ergebnis:** Grundumsatz → + Alltag → + Training → = Erhaltung →
   ± Phase → Ziel (Trainings- und Ruhetag). Jede Zeile mit kcal, damit sichtbar ist, welche Eingabe
   wie viel ausmacht. Gilt im Onboarding und im Rechner unter Mehr.

- **Bestehende Nutzer:** Ihre Ziele bleiben unberührt; die neue Rechnung greift nur, wenn sie den
  Rechner öffnen.
- **Tests:** `onboarding.test.ts` erweitern: Mann/Frau-Differenz (166 kcal), Alter −5 kcal/Jahr,
  Untergrenze greift bei kleiner Frau im Defizit, Protein bei BMI 35 begrenzt, Summe der Tabelle =
  Ziel. e2e: Rechner aus Mehr öffnen, Werte eingeben, Herleitung sichtbar, als Phase übernehmen.

### A7. Weitere Ideen (noch nicht entschieden)

- **Live Activity / Dynamic Island:** übrige Kalorien und Protein-Ring kompakt in der Insel,
  ausgeklappt alle Makros und Wasser, dazu eine Karte auf dem Sperrbildschirm. Start beim ersten
  Eintrag, Aktualisierung bei jedem Eintrag, kein Server nötig. Erweiterung des Ziels
  `SeriousWidgets` (ActivityKit). Grenzen: höchstens 8 h in der Insel, Insel erst ab iPhone 14 Pro,
  Schalter in der App nötig.

- Hier sammeln, was bis zur Planung von 1.2 dazukommt.

---

## B. Was nach 1.2 wieder stimmen muss

Jede Zeile ist eine Stelle, an der heute eine Zahl, eine Quelle oder eine Version steht.

### B1. Versionsnummern

- [x] `package.json` → `1.2.0` (erscheint unter „Mehr")
- [x] `ios/App/App.xcodeproj/project.pbxproj`: `MARKETING_VERSION = 1.2` – **vier Stellen**
      (App und SeriousWidgets, je Debug und Release)
- [x] gleiche Datei: `CURRENT_PROJECT_VERSION` hochzählen (jetzt 23) – ebenfalls **vier Stellen**,
      alle gleich, sonst lehnt App Store Connect ab (`docs/NATIVE.md`)
- [x] `src/lib/__tests__/review.test.ts` nutzt `1.1.0` als Testwert – prüfen, ob die
      Bewertungsabfrage an die Version gekoppelt ist. Wenn ja, muss der Test zur neuen Version
      passen.

### B2. Anzahl Lebensmittel und Datenquellen (betrifft A1)

Heute: 6'906 Einträge = 6'411 BLS + 495 Schweiz.

- [x] `src/i18n/de.ts:359` und `src/i18n/en.ts:375` – `more.about`, Quellenangabe unter „Mehr":
      USDA FoodData Central ergänzen
- [x] `store/LISTING.md:72` (EN) und `:113` (DE) – Quellenzeile in der Beschreibung
- [x] `store/LISTING.md:121` (EN) und `:137` (DE) – Aufzählung „Built-in food table": US-Einträge
      erwähnen
- [x] `docs/APP-REVIEW-NOTES.md:52` ff. – „about 6,900 basic foods", zwei Quellen → neue Zahl, drei
      Quellen. Neuen Abschnitt **1.2** anlegen, den von 1.1 nicht überschreiben.
- [x] `src/db/seed.ts:63` – Kommentar nennt nur den BLS
- [x] `public/legal/terms-de.html:25` und `terms-en.html:25` – nennen nur Open Food Facts als
      Quelle. Mitgelieferte Tabellen (BLS, Schweiz, USDA) ergänzen.
- [x] `public/legal/privacy-*.html` – angepasst (15.10.): Barcode/Suche gehen nur noch an OFF, wenn das Produkt nicht mitgeliefert ist. Sonst **unverändert**, solange USDA mitgeliefert wird und
      keine Anfrage an die USDA-API geht. Wenn doch eine API dazukommt: neuer Empfänger in der
      Tabelle, und App Privacy neu prüfen.
- [x] `marketing/instagram/build.mjs:87` – nennt „495 Swiss foods". Bleibt richtig, solange die
      Schweizer Daten gleich bleiben.
- [ ] `handoff.md` Abschnitt 2 „Daten"

### B3. App Store Connect (nur mit der Version änderbar)

- [ ] „+ Version or Platform" → 1.2
- [ ] Beschreibung DE und EN aus `store/LISTING.md` ersetzen (B2 vorher erledigen)
- [ ] „Neu in dieser Version" DE und EN neu schreiben
- [ ] Keywords EN ersetzen. Vorschlag vom 10.10.2026 (96 Zeichen):
      `counter,protein,food,diary,barcode,scanner,offline,diet,bulk,cut,water,weight,coach,calisthenics`
      `calorie`, `macro` und `tracker` fallen weg, weil sie schon im Untertitel stehen und Apple
      Name, Untertitel und Keywords zusammen liest. So werden „calorie counter", „food diary" und
      „macro counter" gefunden. Danach in `store/LISTING.md` nachtragen.
      Hintergrund: Eine Mail meldete, die App sei in den USA bei „nutrition" nicht in den Top 200.
      Die Prüfung ergab: Hauptsprache English (U.S.) und Keywords sind korrekt. Es fehlen
      Bewertungen und Downloads, die Einstellungen sind in Ordnung.
- [ ] Screenshots: nur neu erzeugen (`npm run screenshots`), wenn sich das Aussehen geändert hat.
- [ ] **Screenshots zuordnen:** iPhone-Satz um `07-offline` ergänzen (freigegeben), Reiter „iPhone Duo":
      7 Bilder je Sprache aus `duo-inner` (Apple nimmt je Gerät einen Satz; Aussen- und Innenformat
      werden beide angeboten – beide zuordnen, falls die Maske zwei Felder zeigt). Eingereicht am 15.10.2026.
      Demo-Lebensmittel in `store/screenshots.mjs` müssen `source: 'manual'` bleiben.
- [ ] Review-Notizen: Abschnitt 1.2 aus `docs/APP-REVIEW-NOTES.md`
- [x] App Privacy: am 15.10.2026 auf **„Käufe – Kaufverlauf"** geändert (App-Funktionalität + Analyse, nicht verknüpft, kein Tracking), wie RevenueCat es vorschreibt. Gilt sofort, auch für 1.1. Store-Beschreibung 1.2: „no data leaving your phone" → „your diary never leaves your phone".
- [ ] Build auswählen, Freigabe terminieren, einreichen
- [ ] Felder mit Klick + `cmd+a` + Tippen befüllen, **nicht** mit `form_input` (verwirft die Werte,
      siehe `handoff.md` Punkt 5)

### B4. Preis und Werbetext – Termine beachten

- [ ] **31.01.2027:** Werbetext nennt den Einführungspreis und muss zurückgesetzt werden. Geht ohne
      Version. Liegt 1.2 um diesen Termin in der Review, den Werbetext trotzdem rechtzeitig ändern.
- [ ] **01.02.2027:** Preis springt auf CHF 25 (geplant in App Store Connect). Steht in
      „Neu in dieser Version" oder in der Beschreibung ein Preis? Darf nicht.
- [ ] Offene Entscheidung aus 1.1: EUR 34.99 für Deutschland/Österreich, ggf. „Custom Price Change"
      bis Ende Januar.

### B5. Vor dem Hochladen

- [ ] `npm test`, `npx playwright test`, `npm run build` grün; neue Testzahlen in `handoff.md`
      eintragen
- [ ] Web-Version pushen (vorher Luca fragen) – Rechtstexte und Web-App kommen von dort
- [ ] `LANG=en_US.UTF-8 npx cap sync ios`, Archiv und Upload nach `docs/NATIVE.md`
- [ ] Commit mit der finalen Build-Nummer

### B6. Nach der Freigabe

- [ ] Store-Seite in beiden Sprachen anschauen
- [ ] Auf einem Gerät mit 1.1 aktualisieren: eigene Lebensmittel und Tagebuch unverändert,
      Referenztabelle ergänzt statt doppelt, Pro bleibt freigeschaltet
- [ ] In englischer Sprache nach „cheddar" suchen: USDA-Treffer da
- [ ] `handoff.md` und diese Datei abhaken
