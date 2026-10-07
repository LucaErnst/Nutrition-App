# Handoff – Serious Nutrition

Stand: 07.10.2026. Diese Datei ist die Übergabe an die nächste Sitzung. Wer hier anfängt, soll
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
- **1.1 (Build 22)** wurde am 30.09. eingereicht, hat die Prüfung bestanden und steht auf
  „Pending Developer Release". Freigabe läuft **automatisch am 12.10.2026, 11:00 CEST**.
- In-App-Kauf `pro_lifetime` (Non-Consumable, Apple-ID 6814513884) ist **freigegeben**, Preis
  CHF 15. Eine geplante globale Preisänderung auf **CHF 25 ab 01.02.2027** liegt bestätigt für
  175 Länder in App Store Connect.
- Store-Seite: Beschreibung, Release-Notes, Werbetext und sechs Screenshots je Sprache sind neu
  und eingereicht. Deutsche Keywords sind die alten (passend), englische wurden korrigiert.

**Code**
- Version 1.1.0, iOS-Build 22. 131 Unit-Tests und 34 e2e-Tests grün, Lint sauber.
- **42 Commits liegen lokal und sind nicht gepusht.** Luca wollte zuerst testen; seither nie
  freigegeben. Vor einem Push fragen – die Web-Version unter
  `lucaernst.github.io/Nutrition-App/` aktualisiert sich daraus.

**Daten**
- 6'906 Grundnahrungsmittel in der App, davon 495 aus der Schweizer Nährwertdatenbank
  (Zustimmung des BLV vom 30.09.2026, siehe `docs/BLV-ANFRAGE.md`), der Rest aus dem
  Bundeslebensmittelschlüssel 4.0.

**Marketing**
- TikTok @seriousnutritiontracker, praktisch bei null. 14 Drehbücher liegen bereit, noch nichts
  gedreht. Posting-Kalender vom 12. bis 25.10. steht.

---

## 3. Dateien, die gerade zählen

| Datei | Wofür |
|---|---|
| `docs/RELEASE-1.1.md` | Die Launch-Checkliste. Abschnitte 1–3 erledigt, 4 und 5 offen. **Zuerst hier nachschauen.** |
| `store/LISTING.md` | Alle Store-Texte, Stand = eingereicht. Zeichenzahlen stehen dabei. |
| `store/creative/{de,en}/` | Header (3840 × 1646) und Suchbild (2880 × 1920), erzeugt, **nicht hochgeladen** |
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

1. **12.10., morgens:** prüfen, dass 1.1 wirklich live ist (Status wechselt auf „Ready for
   Distribution"). Danach Kauf einmal mit echtem Konto testen und auf einem Gerät prüfen, das die
   App vor 1.1 hatte – dort muss Pro geschenkt sein.
2. **Nach dem Launch:** Creative Assets hochladen (Asset Library → „Upload Creative Assets"),
   Apple prüft sie, dann unter „Header and Search Results" zuordnen. Vorher nicht, solange die
   Version auf Freigabe wartet.
3. **Web-Version pushen** – 42 Commits warten. Vorher fragen.
4. **TikTok:** Clips nach `marketing/Drehtag-TikTok.docx` drehen, Bio-Link auf die Store-Seite,
   Instagram verknüpfen, Metricool neu verbinden.
5. **31.01.2027:** Werbetext zurücksetzen, er nennt den Einführungspreis.

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
