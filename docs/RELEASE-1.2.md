# Checkliste: Version 1.2

Angelegt am 10.10.2026, vor dem Launch von 1.1. Noch kein Termin.

Diese Liste hat zwei Teile: **was in 1.2 neu kommt** und **was danach wieder stimmen muss**. Der
zweite Teil ist der wichtigere. Beschreibung, Screenshots, Keywords und „Neu in dieser Version"
lassen sich nur mit einer neuen Version ändern. Was hier vergessen geht, steht bis 1.3 falsch im
Store (siehe Tabelle in `docs/RELEASE-1.1.md`).

---

## A. Was in 1.2 kommt

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

- [ ] Die 17 Startlebensmittel aus `SEED` (Magerquark, Haferflocken …) folgen keinem
      Sprachwechsel. Lösung über einen eigenen Schlüssel für diese Einträge, **nicht** über
      `dropRetiredReference` (siehe `handoff.md` Punkt 5).
- [ ] Veralteter Kommentar in `src/db/types.ts:72`: spricht von der „USDA-Tabelle", gemeint ist
      seit Build 17 der BLS. Wird mit A1 wieder teilweise richtig, dann sauber formulieren.
- [ ] Store-Seite zeigt unter „Sprachen" nur **Englisch** (gesehen am 12.10.2026 auf der Live-Seite
      von 1.1). Apple liest die Sprachen aus den `.lproj`-Ordnern im Bundle, nicht aus
      `CFBundleLocalizations`. Im Projekt gibt es nur `Base.lproj`, `knownRegions` kennt nur `en`.
      Lösung: in Xcode Deutsch als Lokalisierung hinzufügen und eine `de.lproj/InfoPlist.strings`
      (z. B. mit `CFBundleDisplayName`) ins Ziel „App" legen. Danach im `.ipa` prüfen, dass
      `de.lproj` drin ist.

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

### A4. Weitere Ideen (noch nicht entschieden)

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

- [ ] `package.json` → `1.2.0` (erscheint unter „Mehr")
- [ ] `ios/App/App.xcodeproj/project.pbxproj`: `MARKETING_VERSION = 1.2` – **vier Stellen**
      (App und SeriousWidgets, je Debug und Release)
- [ ] gleiche Datei: `CURRENT_PROJECT_VERSION` hochzählen (heute 22) – ebenfalls **vier Stellen**,
      alle gleich, sonst lehnt App Store Connect ab (`docs/NATIVE.md`)
- [ ] `src/lib/__tests__/review.test.ts` nutzt `1.1.0` als Testwert – prüfen, ob die
      Bewertungsabfrage an die Version gekoppelt ist. Wenn ja, muss der Test zur neuen Version
      passen.

### B2. Anzahl Lebensmittel und Datenquellen (betrifft A1)

Heute: 6'906 Einträge = 6'411 BLS + 495 Schweiz.

- [ ] `src/i18n/de.ts:359` und `src/i18n/en.ts:375` – `more.about`, Quellenangabe unter „Mehr":
      USDA FoodData Central ergänzen
- [ ] `store/LISTING.md:72` (EN) und `:113` (DE) – Quellenzeile in der Beschreibung
- [ ] `store/LISTING.md:121` (EN) und `:137` (DE) – Aufzählung „Built-in food table": US-Einträge
      erwähnen
- [ ] `docs/APP-REVIEW-NOTES.md:52` ff. – „about 6,900 basic foods", zwei Quellen → neue Zahl, drei
      Quellen. Neuen Abschnitt **1.2** anlegen, den von 1.1 nicht überschreiben.
- [ ] `src/db/seed.ts:63` – Kommentar nennt nur den BLS
- [ ] `public/legal/terms-de.html:25` und `terms-en.html:25` – nennen nur Open Food Facts als
      Quelle. Mitgelieferte Tabellen (BLS, Schweiz, USDA) ergänzen.
- [ ] `public/legal/privacy-*.html` – **bleibt unverändert**, solange USDA mitgeliefert wird und
      keine Anfrage an die USDA-API geht. Wenn doch eine API dazukommt: neuer Empfänger in der
      Tabelle, und App Privacy neu prüfen.
- [ ] `marketing/instagram/build.mjs:87` – nennt „495 Swiss foods". Bleibt richtig, solange die
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
      Demo-Lebensmittel in `store/screenshots.mjs` müssen `source: 'manual'` bleiben.
- [ ] Review-Notizen: Abschnitt 1.2 aus `docs/APP-REVIEW-NOTES.md`
- [ ] App Privacy: weiterhin „Data Not Collected" (siehe B2, Datenschutz)
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
