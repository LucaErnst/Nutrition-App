# Handoff – Serious Nutrition

Stand: 12.10.2026, Launch-Tag. Diese Datei ist die Übergabe an die nächste Sitzung. Wer hier anfängt, soll
ohne Rückfragen weiterarbeiten können.

**So wird sie benutzt:** In einer neuen Sitzung sagen: *„Lies handoff.md und mach dort weiter, wo
wir aufgehört haben."* Vor dem Ende einer Sitzung diese Datei aktualisieren, sonst ist sie nach
zwei Tagen Fiktion.

---

## 1. Ziel

Serious Nutrition 1.1 am **12.10.2026** live bringen und über TikTok Downloads erzeugen. Die App
ist gratis, Pro ist ein Einmalkauf (CHF 15 im Launch, ab 01.02.2027 CHF 25). Absender ist Luca als
Calisthenics-Coach in Basel; die App ist der Beweis, nicht der Star.

Technisch: lokal-zuerst, kein Konto, keine Werbung, keine Daten, die das Gerät verlassen. Jede
Entscheidung misst sich daran.

---

## 2. Aktueller Stand

**App Store**
- **1.0** ist seit 23.09.2026 live.
- **1.1 (Build 22) ist live** seit 12.10.2026, 11:00 (geprüft 13:20: „Ready for Distribution",
  Store-Seite CH zeigt 1.1, 1 Bewertung, 5.0). Store zeigt unter „Sprachen" nur Englisch, Fix für
  1.2 in `docs/RELEASE-1.2.md` A2.
- In-App-Kauf `pro_lifetime` (Non-Consumable, Apple-ID 6814513884) ist **freigegeben**, Preis
  CHF 15. Eine geplante globale Preisänderung auf **CHF 25 ab 01.02.2027** liegt bestätigt für
  175 Länder in App Store Connect.
- Store-Seite: Beschreibung, Release-Notes, Werbetext und sechs Screenshots je Sprache sind neu
  und eingereicht. Deutsche Keywords sind die alten (passend), englische wurden korrigiert.

**Code**
- Version 1.1.0, iOS-Build 22. 131 Unit-Tests und 34 e2e-Tests grün, Lint sauber.
- Alles gepusht (12.10.). Vor jedem weiteren Push fragen – die Web-Version unter
  `lucaernst.github.io/Nutrition-App/` aktualisiert sich daraus.

**Daten**
- 6'906 Grundnahrungsmittel in der App, davon 495 aus der Schweizer Nährwertdatenbank
  (Zustimmung des BLV vom 30.09.2026, siehe `docs/BLV-ANFRAGE.md`), der Rest aus dem
  Bundeslebensmittelschlüssel 4.0.

**Marketing**
- TikTok @seriousnutritiontracker, praktisch bei null. Fertig geschnitten: 11 Launch-Clips
  (`marketing/launch/final/`, unter 10 MB in `final/upload/`) und 6 Karussell-Videos
  (`marketing/instagram/tiktok/`). Noch nicht gedreht: Clips 11, 12, 13, D „Gestern kopieren".
- **Instagram @seriousnutrition.app** (neu, 11.10.): Profil eingerichtet (Bild, Name, Bio, Business,
  Kategorie App Page). Plan mit allen Captions in `marketing/instagram/APP-ACCOUNT.md`, von Luca
  freigegeben: 11 Reels + 6 Karussells, 12. bis 25.10. **Alle 17 Posts geplant** in der Meta Business Suite
  (11.10.), Vorgehen in `APP-ACCOUNT.md`. Bio-Link gesetzt (12.10.).
- App-Store-Keywords geprüft (10.10.): Einstellungen korrekt (English U.S.), schwache Platzierung
  liegt an 0 Bewertungen. Neuer Keyword-Vorschlag steht in `docs/RELEASE-1.2.md`.

---

## 3. Dateien, die gerade zählen

| Datei | Wofür |
|---|---|
| `docs/RELEASE-1.1.md` | Die Launch-Checkliste. Abschnitte 1–3 erledigt, 4 und 5 offen. **Zuerst hier nachschauen.** |
| `docs/RELEASE-1.2.md` | Planung 1.2 (USDA-Daten, bekannte Fehler) und Liste aller Stellen, die danach wieder stimmen müssen |
| `docs/PUSH-BENACHRICHTIGUNGEN.md` | Plan für Kauf-Push und Tagesbericht, Key ID und Issuer ID |
| `store/LISTING.md` | Alle Store-Texte, Stand = eingereicht. Zeichenzahlen stehen dabei. |
| `store/creative/{de,en}/` | Header (3840 × 1646) und Suchbild (2880 × 1920), von Apple freigegeben, Zuordnung offen |
| `store/screenshots.mjs` | Erzeugt Screenshots und Creative Assets in einem Lauf (`npm run screenshots`) |
| `marketing/Drehtag-TikTok.docx` | 14 Drehbücher in Drehreihenfolge plus Kalender |
| `marketing/LAUNCH-1.1.md` | Launch-Plan, Preislogik, Kanäle |
| `docs/BLV-ANFRAGE.md` | Zusage des BLV, Datenumfang, fertige Antwortmail |
| `tools/add-swiss-foods.mjs` | Schweizer Daten einspielen, wiederholbar |
| `src/db/seed.ts` | Seed, Sprachabgleich, `dropRetiredReference` – empfindlich, siehe Punkt 5 |
| `src/lib/openfoodfacts.ts` | Produktsuche, zwei Wege (nativ / Web) |

---

## 4. Was zuletzt gebaut wurde

Alles für 1.1, in der Reihenfolge der Entstehung:

- Einheiten: Gramm/Kilogramm, Milliliter bis Liter, Unzen und Flüssigunzen US/UK, Pfund, Stone,
  Fuss/Zoll – **auch Wasser**, gespeichert bleiben immer Milliliter.
- 6'411 Grundnahrungsmittel aus dem BLS, später 495 Schweizer Einträge dazu; Namen folgen der
  App-Sprache über den Schlüssel.
- Lebensmittel-Listen zeigen ohne Suchbegriff nur **eigene** Lebensmittel. Vorher hingen 6'400
  fremde Einträge im DOM (83'556 Knoten, erster Tastendruck 495 ms; jetzt 46 ms).
- Produktsuche läuft 600 ms nach dem letzten Tastendruck **von selbst**, sucht **weltweit**, und
  im Reiter „Datenbank" liegt dieselbe Suche – ein Treffer öffnet dort das Formular.
- US-Suchbegriffe finden britische Namen (zucchini → courgette, ground beef → beef mince).
- Store-Texte und -Bilder neu, dunkel, mit Schweizer Argument.
- Preisplan, Einreichung, Drehbücher, Creative Assets.

---

## 5. Sackgassen – bitte nicht wiederholen

**App Store Connect**
- `form_input` auf die Beschreibungs- und Keyword-Felder **verwirft die Werte stillschweigend**.
  Der Tool-Rückgabewert behauptet Erfolg, das Feld bleibt alt. Richtig: hineinklicken, `cmd+a`,
  dann tippen. Danach über die Zeichenzähler prüfen.
- Die Seite ist zu gross für `find` (Accessibility-Baum sprengt das Token-Limit). Mit
  Koordinaten aus einem frischen Screenshot arbeiten.
- Vorsicht beim Sprachumschalter: daneben liegt „remove this version from review". Einmal
  aufgegangen, mit „Not Now" abgebrochen.

**Seed und Daten**
- `dropRetiredReference` auf Einträge **ohne** `ref_key` auszuweiten löscht die absichtliche
  Startliste aus `SEED` (Magerquark, Haferflocken …) – elf e2e-Tests wurden rot. Zurückgenommen.
  Die 17 Einträge folgen einem Sprachwechsel nicht; das ist bekannt und für 1.2 vorgemerkt.
- XLSX werden ohne `xlsx`-Paket gelesen: entpacken und `sheet1.xml` parsen. **Leere Zellen stehen
  als `<c .../>`** – wer die überliest, schiebt alle Werte eine Spalte nach links und liest
  Kalorien als Quellenangabe.

**Aufnahme-Daten**
- In `store/screenshots.mjs` müssen die Demo-Lebensmittel `source: 'manual'` tragen. Standen sie
  auf `'reference'`, zeigte Bild 2 genau einen Eintrag, seit die Suche nur eigene zeigt.

**Werkzeuge auf diesem Mac**
- **Kein LibreOffice, kein pandoc, kein pdftoppm.** Word-Dateien lassen sich nicht rendern; prüfen
  nur über die entpackte `document.xml`.
- `scripts/office/soffice.py` des docx-Skills bricht mit dem System-Python 3.9
  (`ignore_cleanup_errors`).
- `npm install docx` ist im Scratchpad nötig, das Paket ist nicht global da.
- Vor `vite preview` den Port freiräumen (`lsof -ti:4173` bzw. `:4174`), sonst zeigt ein alter
  Server alte Stände.

---

## 6. Nächste Schritte

1. ~~Prüfen, dass 1.1 live ist~~ (erledigt 12.10., 13:20). Offen: Kauf einmal mit echtem Konto testen und auf einem Gerät prüfen, das die
   App vor 1.1 hatte – dort muss Pro geschenkt sein.
2. **Creative Assets:** alle vier am 13.10. von Apple **freigegeben** (Approved). Zuordnen unter
   Version 1.1 → Produktseite → „Header and Search Results", je Sprache (Sprachumschalter oben
   rechts): Header und Suchbild über „Browse Assets" wählen, dann „Publish". Ohne Nummer = deutsch,
   „(21)"/„(22)" = englisch. **Publish klickt Luca selbst** – der Auto-Modus blockiert ihn für Claude
   (wie schon beim Einreichen). Stand 13.10.: **Header Englisch veröffentlicht.** Offen: Suchbild
   Englisch, Header und Suchbild Deutsch.
3. ~~Web-Version pushen~~ – erledigt 12.10., Pages-Deploy erfolgreich.
4. **TikTok:** Clips nach `marketing/Drehtag-TikTok.docx` drehen. Website-Link geht erst ab 1'000
   Followern (Unternehmenskonto ging nicht); bis dahin Instagram im Profil verknüpfen,
   Instagram verknüpfen, Metricool neu verbinden.
5. **31.01.2027:** Werbetext zurücksetzen, er nennt den Einführungspreis.
6. **Instagram @seriousnutrition.app:** 12. bis 25.10. ist geplant. Bio-Link ist gesetzt. Luca
   und pinnt die Kommentare aus `APP-ACCOUNT.md`. Ab 26.10. neue Posts planen. Browser: immer Chrome.
7. **Push aufs iPhone bei Käufen/Downloads:** gebaut und getestet, läuft über Telegram (Worker deployt,
   RevenueCat-Weiterleitung gesetzt). Stand in `docs/PUSH-BENACHRICHTIGUNGEN.md`. Die `.p8`-Datei gibt Luca nie in den Chat.
8. **1.2 planen:** `docs/RELEASE-1.2.md`. Fest vorgemerkt: USDA FoodData Central (SR Legacy, CC0)
   für US-Nutzer, nur in englischer App-Sprache sichtbar (entschieden 10.10.).
   Ausserdem Schritte aus Apple Health lesen, nur als Erklärung im Wochenfazit, ohne Schrittziel
   und ohne Einfluss auf Kalorienziele (entschieden 13.10., A3).
   Und Hinweise beim ersten Kontakt statt einer Einführungstour (entschieden 13.10., A4).

**Offene Entscheidungen von Luca**
- Ab Februar kostet Pro in Deutschland/Österreich **EUR 34.99** (Apples Umrechnung von CHF 25).
  Falls zu hoch: bis Ende Januar über „Custom Price Change" einzeln senken.
- Ebook (`beserious.ch/nutrition-guide`, CHF 15) und Pro kosten dasselbe. Vorschlag war: Ebook
  als Tiefe, App als Einstieg, Bündel über **Offer Codes** (gibt es für In-App-Käufe, bis zu 10
  aktive Angebote). Noch nicht entschieden.
- Ebook-Drehbücher: vier Proben geschrieben, voller Satz wartet auf die Kapitelübersicht.

---

## Befehle

Nicht Teil der Vorlage, aber die nächste Sitzung spart sich das Suchen:

```
npm test                     # 131 Unit-Tests
npx playwright test          # 34 e2e, Projekte "mobile" (de-CH) und "us" (en-US)
npm run build                # tsc + vite
npm run screenshots          # Screenshots und Creative Assets, beide Sprachen
LANG=en_US.UTF-8 npx cap sync ios
```

Archiv und Upload stehen in `docs/NATIVE.md`; Build-Nummer in beiden Zielen hochzählen, sonst
lehnt App Store Connect ab.
