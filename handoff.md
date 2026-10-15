# Handoff – Serious Nutrition

Stand: 15.10.2026, Nachmittag. 1.1 ist live, **1.2 (Build 27) liegt in TestFlight**. Diese Datei ist die Übergabe an die nächste
Sitzung. Wer hier anfängt, soll ohne Rückfragen weiterarbeiten können.

**So wird sie benutzt:** In einer neuen Sitzung sagen: *„Lies handoff.md und mach dort weiter, wo
wir aufgehört haben."* Vor dem Ende einer Sitzung diese Datei aktualisieren, sonst ist sie nach
zwei Tagen Fiktion.

---

## 1. Ziel

Serious Nutrition 1.1 ist live; jetzt über TikTok und Instagram Downloads erzeugen und 1.2 planen.
Die App ist gratis, Pro ist ein Einmalkauf (CHF 15 im Launch, ab 01.02.2027 CHF 25). Absender ist
Luca als Calisthenics-Coach in Basel; die App ist der Beweis, nicht der Star.

Technisch: lokal-zuerst, kein Konto, keine Werbung, keine Daten, die das Gerät verlassen. Jede
Entscheidung misst sich daran.

---

## 2. Aktueller Stand

**App Store**
- **1.1 (Build 22) ist live** seit 12.10.2026, 11:00. Store-Seite CH zeigt 1.1, 1 Bewertung (5.0).
  Store zeigt unter „Sprachen" nur Englisch – Fix für 1.2 in `docs/RELEASE-1.2.md` A2.
- In-App-Kauf `pro_lifetime` (Apple-ID 6814513884) freigegeben, CHF 15. Preisänderung auf
  **CHF 25 ab 01.02.2027** für 175 Länder geplant.
- Pro auf einem Gerät, das die App vor 1.1 hatte: **geschenkt, geprüft von Luca am 12.10.**
- **Header und Suchbild** in Deutsch und Englisch auf der Produktseite zugeordnet und live (13.10.).
- **Eingereicht, wartet auf Apple** (geprüft 14.10.):
  - Eigene Produktseiten **TikTok** und **Instagram** (Custom Product Pages, Status „In Review").
    Kopie der 1.1-Seite, nur zum Messen, welcher Kanal Downloads bringt.
  - **Screenshot 7** `07-offline-de.png` / `07-offline-en.png` in der Asset Library („Waiting for
    Review").

**Code**
- Version **1.2.0, iOS-Build 27**, am 15.10. hochgeladen (TestFlight). 25: Suche als eine Liste, Rangfolge erstes Wort. 26: Titel und × bleiben oben. 27: Eintragen-Dialog als iOS-Sheet (Griff, Titel, Reiter, Suchfeld fest; nach unten ziehen schliesst).
  Neu in 24: **288'776 Open-Food-Facts-Produkte mitgeliefert** (Scan/Suche offline, weltweite
  Auswahl), **USDA** (6'304, nur Englisch), Suche „Ei" → Ei, Schritte im Tagebuch.
  Aus Build 23, A2–A6 aus `docs/RELEASE-1.2.md`: Startliste folgt dem Sprachwechsel, Deutsch im
  Bundle (`de.lproj`), Schritte aus Health im Wochenfazit, Hinweise beim ersten Kontakt, Stückzahl
  für 47 Grundnahrungsmittel, Bedarfsrechner unter Mehr mit Herleitung (DGE-PAL).
- **160 Unit-Tests und 43 e2e-Tests** grün, Lint ohne Fehler (nur Warnungen).
- 1.2 ist **nicht** zur Prüfung eingereicht und hat in App Store Connect noch keine Version.
- **Screenshots (15.10.):** Bild 7 (offline) von Apple freigegeben. **iPhone Duo:** 28 Bilder
  (aussen 1398×2034, innen 2007×2853, je 7 × DE/EN) in `store/screenshots/{de,en}/duo-{outer,inner}/`,
  erzeugt mit `npm run screenshots -- duo-outer duo-inner`, in der Asset Library als `duo-<display>-<lang>-*.png`
  hochgeladen und eingereicht (Prüfung bis 48 h). **Zuordnen geht erst mit Version 1.2:** Bei der
  live-Version 1.1 sind die Screenshot-Felder gesperrt. Beim Anlegen von 1.2: iPhone-Satz um Bild 7
  ergänzen, Duo-Satz zuordnen (Reiter „iPhone Duo").
- Asset Library, Einreichen: „Add for Review" öffnet ein Menü → „Draft iOS Submission" wählen →
  Seitenfenster mit × schliessen; am Ende „Draft Submissions" → „Submit for Review". Klicks per
  Skript zählen nicht, nur echte Klicks.
- **Rechtliches (15.10.):** Datenschutzerklärung um Apple Health, RevenueCat (USA, SCC) und Kauf-
  Benachrichtigung ergänzt (online). App-Store-Datenschutz von „Keine Daten" auf „Käufe – Kaufverlauf,
  nicht verknüpft" geändert (RevenueCat verlangt das). Bausteine für beserious.ch im Claude-Dokument
  „Serious Nutrition – Rechtstexte für die Webseite" (https://claude.ai/code/artifact/aefafcc2-4b73-46d9-8cc3-cfb26707d3e5).
  Offen nur: Impressum auf beserious.ch prüfen, Bausteine dort einfügen (Luca).
- Alles gepusht (14.10.), Web-Version unter `lucaernst.github.io/Nutrition-App/` aktuell. Vor jedem
  Push fragen.
- Seit dem 1.1-Store-Build behoben, **in Build 23 enthalten** (Web schon live):
  - Backup wiederherstellen löschte die mitgelieferten Grundnahrungsmittel, wenn das Backup sie
    nicht enthielt (Backups aus 1.0). Jetzt `refreshReferenceAfterRestore` in `src/db/seed.ts`,
    aufgerufen in `restoreBackup`.
  - Schalter „App als Free-Nutzer ansehen" nur noch in Entwicklungs-Builds.
- Nicht committet und **nicht von Claude**: Lucas Änderungen an `marketing/launch-broll.mjs`,
  `marketing/launch/compose.mjs`, `marketing/instagram/APP-ACCOUNT.md`, Ordner
  `marketing/launch/talking/`. Nicht mit-committen ohne Rückfrage.

**Daten** (ab 1.2)
- 6'906 Grundnahrungsmittel in beiden Sprachen (6'411 BLS + 495 Schweiz, BLV-Zustimmung
  30.09.2026, `docs/BLV-ANFRAGE.md`), plus **6'304 USDA** nur in englischer App-Sprache.
- **288'776 Markenprodukte** aus Open Food Facts mitgeliefert (ODbL), `public/data/off-products.tsv.gz`.
  Vor jedem Release mit `tools/build-off-products.mjs` neu erzeugen (Export ~1,3 GB).
- Stückgewichte für 47 Lebensmittel aus USDA SR Legacy (`src/db/pieceWeights.ts`).

**Marketing**
- TikTok @seriousnutritiontracker, praktisch bei null. Fertig: 11 Launch-Clips
  (`marketing/launch/final/`, unter 10 MB in `final/upload/`) und 6 Karussell-Videos
  (`marketing/instagram/tiktok/`). Noch nicht gedreht: Clips 11, 12, 13, D „Gestern kopieren".
- TikTok-Website-Link geht erst ab **1'000 Followern**; ein Unternehmenskonto ging nicht (Luca
  fehlen die Firmendaten). Bis dahin Instagram im TikTok-Profil verknüpfen (nur in der App).
  Login vermutlich über Google mit `beseriouscalisthenics@gmail.com` – nicht sicher, Luca prüft
  in der App unter Kontoinformationen.
- **Instagram @seriousnutrition.app:** 11 Reels + 6 Karussells vom 12. bis 25.10. in der Meta
  Business Suite geplant, Captions in `marketing/instagram/APP-ACCOUNT.md`. Bio-Link gesetzt.

---

## 3. Dateien, die gerade zählen

| Datei | Wofür |
|---|---|
| `docs/RELEASE-1.1.md` | Launch-Checkliste. Offen nur noch: Kauftest mit echtem Konto, Bewertungs-Abfrage beobachten |
| `docs/RELEASE-1.2.md` | **Planung 1.2**, A1–A7 und Teil B (alle Stellen mit Zahlen/Quellen) |
| `docs/PUSH-BENACHRICHTIGUNGEN.md` | Kauf-Push und Tagesbericht über Telegram, läuft |
| `store/LISTING.md` | Alle Store-Texte, Stand = eingereicht |
| `store/screenshots.mjs` | Screenshots 1–7 und Creative Assets (`npm run screenshots`) |
| `store/screenshots/{de,en}/07-offline.png` | Neuer Screenshot 7, eingereicht |
| `marketing/Drehtag-TikTok.docx` | 14 Drehbücher in Drehreihenfolge plus Kalender |
| `marketing/LAUNCH-1.1.md` | Launch-Plan, Preislogik, Kanäle |
| `src/db/seed.ts` | Seed, Sprachabgleich, Nachladen nach Backup – empfindlich, siehe Punkt 5 |
| `src/lib/onboarding.ts` | Bedarfsrechner (Mifflin-St Jeor), wird in 1.2 erweitert (A6) |

---

## 4. Was zuletzt passiert ist (12.–14.10.)

- 1.1 live geprüft, Store-Seite in DE geprüft.
- Header und Suchbilder hochgeladen, von Apple freigegeben, in beiden Sprachen zugeordnet.
- Apples „App Store asset best practices" gelesen: Bilder halten die Regeln ein (keine Preise,
  URLs, ©, Auszeichnungen). Daraus umgesetzt: eigene Produktseiten pro Kanal und Screenshot 7.
- Screenshot 7: Rösti-Suche ohne Netz, zeigt die eingebaute Tabelle. Dabei den Backup-Fehler
  gefunden und mit e2e-Test behoben.
- 1.2 geplant: Schritte aus Health, Hinweise statt Tour, Stückzahl, Bedarfsrechner (siehe Punkt 6).

---

## 5. Sackgassen – bitte nicht wiederholen

**App Store Connect**
- **Einreichen und Veröffentlichen klickt Luca selbst.** Der Auto-Modus blockiert für Claude
  „Add for Review", „Publish" und teils schon das Umschalten der Reiter auf der Produktseite.
  Vorbereiten (hochladen, auswählen, Entwurf anlegen) geht; den letzten Klick Luca überlassen.
- Die Anmeldung in Chrome läuft nach einiger Zeit ab (`authResult=FAILED`). Claude meldet sich
  nicht selbst an – Luca bitten, sich in Chrome neu anzumelden.
- Datei-Upload in der Asset Library: Der Dateidialog ist versteckt. Vor dem Klick auf „Upload …"
  `HTMLInputElement.prototype.click` abfangen, dann `file_upload` auf das gefangene Input. Gleich
  benannte Dateien vorher umbenennen (z. B. `-de` / `-en`), sonst zählt Apple „(21)", „(22)" hoch.
- Bei „Copy Existing Product Page" greift `form_input` mit dem Anzeigetext manchmal nicht; dann
  mit dem `value` (UUID) der Option setzen.
- `form_input` auf Beschreibungs- und Keyword-Felder **verwirft die Werte stillschweigend**.
  Richtig: hineinklicken, `cmd+a`, tippen, Zeichenzähler prüfen.
- Die Versionsseite ist zu gross für `find`; mit Koordinaten aus frischem Screenshot arbeiten.
- Vorsicht beim Sprachumschalter: daneben liegt „remove this version from review".

**Seed und Daten**
- `dropRetiredReference` auf Einträge **ohne** `ref_key` auszuweiten löscht die Startliste aus
  `SEED` – elf e2e-Tests wurden rot. Zurückgenommen.
- Nach `restoreBackup` stimmen die localStorage-Vermerke (`nutrition-tracker:reference`,
  `…:reference-lang`) nicht mehr mit der Datenbank überein. Deshalb `refreshReferenceAfterRestore`.
- XLSX ohne `xlsx`-Paket lesen: **leere Zellen stehen als `<c .../>`**, sonst verschieben sich Spalten.

**Screenshots**
- Demo-Lebensmittel in `store/screenshots.mjs` müssen `source: 'manual'` tragen.
- `npm run screenshots` erzeugt **alle** Bilder neu; 1–6 und die Header ändern sich dabei nur
  durchs Datum. Nur die gewollten Bilder committen, Rest mit `git checkout --` zurücksetzen –
  die freigegebenen Bilder im Store sind die alten.

**1.2-Bau**
- USDA SR Legacy liegt **nicht** im Repo; heruntergeladen am 15.10. ins Scratchpad
  (`fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip`, 6 MB). Für A1
  erneut laden (Luca hat den Download freigegeben).
- `tsc -b` prüft auch die Testdateien: kein `node:fs` in Tests (keine Node-Typen), JSON über
  `loadReference` laden.
- `tools/ExportOptions.plist` lädt direkt hoch und behält kein `.ipa`; die Build-Nummer in
  TestFlight nachsehen.

**Werkzeuge auf diesem Mac**
- **Kein LibreOffice, kein pandoc, kein pdftoppm.** Word nur über die entpackte `document.xml` prüfen.
- Was Luca über die geteilte Zwischenablage schickt (`…/shared-pasteboard/…rtfd`), ist für Claude
  gesperrt. Inhalt per `pbpaste` oder über `NSPasteboard` lesen; meist steht nur der Titel drin.
- Vor `vite preview` den Port freiräumen (`lsof -ti:4173` bzw. `:4174`).
- Playwright-Projekt `us` läuft nur `imperial.spec.ts`; alle anderen Tests mit `--project=mobile`.

---

## 6. Nächste Schritte

1. **Kauftest:** Pro einmal mit Lucas echtem Apple-Konto kaufen (nur Luca).
2. **Sobald Apple freigibt** (Produktseiten und Screenshot 7):
   - Links in die Bios setzen statt des normalen Store-Links:
     - TikTok: `https://apps.apple.com/app/id6814075860?ppid=5c0820eb-b801-44fe-b199-7b4033937436`
     - Instagram: `https://apps.apple.com/app/id6814075860?ppid=253c4913-4ce0-4765-ad5e-e3a31c94940c`
   - Screenshot 7 je Sprache als 7. Bild an die Produktseite von 1.1 hängen (Claude bereitet vor,
     Luca klickt veröffentlichen). Danach auch in beide eigenen Produktseiten übernehmen.
   - Downloads je Kanal in App Analytics → Quelle „Custom Product Page" ansehen.
3. **TikTok:** Clips nach `marketing/Drehtag-TikTok.docx` drehen, Instagram im Profil verknüpfen,
   Metricool neu verbinden.
4. **Instagram:** Luca pinnt die Kommentare aus `APP-ACCOUNT.md`. Ab 26.10. neue Posts planen.
   Browser: immer Chrome.
5. **1.2 testen:** Build 24 in TestFlight auf dem iPhone installieren. Prüfen: Store-Version 1.1
   darüber aktualisieren (Daten, Pro bleiben), Health-Abfrage nach Schritten, Wochenfazit mit
   Schritten, „Ei" in Stück, Bedarfsrechner unter Mehr, Hinweise (unter Mehr → Hinweise wieder
   zeigen). Rückmeldungen in `docs/RELEASE-1.2.md`.
6. **1.2 fertig bauen** nach `docs/RELEASE-1.2.md` (A2–A6 erledigt, Stand oben in der Datei):
   - A1 USDA-Daten für US-Nutzer, nur in englischer App-Sprache
   - A2 bekannte Fehler, u. a. Store-Sprache Deutsch fehlt (`de.lproj`)
   - A3 Schritte aus Apple Health, nur als Erklärung im Wochenfazit, **kein Schrittziel**
   - A4 Hinweise beim ersten Kontakt statt Einführungstour
   - A5 Stückzahl für Grundnahrungsmittel („Ei 3 Stk."), gratis
   - A6 Bedarfsrechner jederzeit unter Mehr, realistischer: Alltag und Training getrennt,
     Untergrenze Grundumsatz, Protein bei BMI > 30 auf Referenzgewicht, Herleitung als Tabelle
   - Alles gebaut. Offen nur App Store Connect (B3): Version 1.2 anlegen, Texte aus
     `store/LISTING.md` (Stand 1.2), Keywords, Review-Notizen aus `docs/APP-REVIEW-NOTES.md`,
     Build 24 wählen, einreichen. Felder mit Klick + cmd+a + Tippen füllen.
   - Mit 1.2 ein In-App-Event „Major Update" erwägen.
7. **31.01.2027:** Werbetext zurücksetzen, er nennt den Einführungspreis.

**Offene Entscheidungen von Luca**
- Ab Februar kostet Pro in Deutschland/Österreich **EUR 34.99** (Apples Umrechnung von CHF 25).
  Falls zu hoch: bis Ende Januar über „Custom Price Change" einzeln senken.
- Ebook (`beserious.ch/nutrition-guide`, CHF 15) und Pro kosten dasselbe. Vorschlag: Bündel über
  **Offer Codes**. Noch nicht entschieden.
- Ebook-Drehbücher: vier Proben geschrieben, voller Satz wartet auf die Kapitelübersicht.

---

## Befehle

```
npm test                                  # 160 Unit-Tests
npx playwright test                       # 43 e2e, Projekte "mobile" (de-CH) und "us" (en-US)
npx playwright test e2e/X.spec.ts --project=mobile -g "Name"   # einzelner Test
npm run build                             # tsc + vite
npm run screenshots                       # Screenshots 1–7 und Creative Assets, beide Sprachen
LANG=en_US.UTF-8 npx cap sync ios
```

Archiv und Upload stehen in `docs/NATIVE.md`; Build-Nummer in beiden Zielen hochzählen, sonst
lehnt App Store Connect ab.
