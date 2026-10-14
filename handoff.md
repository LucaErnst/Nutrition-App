# Handoff – Serious Nutrition

Stand: 14.10.2026, zwei Tage nach dem Launch von 1.1. Diese Datei ist die Übergabe an die nächste
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
- Version 1.1.0, iOS-Build 22. 131 Unit-Tests und **35** e2e-Tests grün, Lint ohne Fehler (nur
  alte Warnungen).
- Alles gepusht (14.10.), Web-Version unter `lucaernst.github.io/Nutrition-App/` aktuell. Vor jedem
  Push fragen.
- **Seit dem Store-Build behoben, geht erst mit dem nächsten iOS-Build raus** (Web schon live):
  - Backup wiederherstellen löschte die mitgelieferten Grundnahrungsmittel, wenn das Backup sie
    nicht enthielt (Backups aus 1.0). Jetzt `refreshReferenceAfterRestore` in `src/db/seed.ts`,
    aufgerufen in `restoreBackup`.
  - Schalter „App als Free-Nutzer ansehen" nur noch in Entwicklungs-Builds.
- Nicht committet und **nicht von Claude**: Lucas Änderungen an `marketing/launch-broll.mjs`,
  `marketing/launch/compose.mjs`, `marketing/instagram/APP-ACCOUNT.md`, Ordner
  `marketing/launch/talking/`. Nicht mit-committen ohne Rückfrage.

**Daten**
- 6'906 Grundnahrungsmittel in der App, davon 495 aus der Schweizer Nährwertdatenbank
  (Zustimmung des BLV vom 30.09.2026, siehe `docs/BLV-ANFRAGE.md`), der Rest aus dem
  Bundeslebensmittelschlüssel 4.0.

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
5. **1.2 bauen** nach `docs/RELEASE-1.2.md`:
   - A1 USDA-Daten für US-Nutzer, nur in englischer App-Sprache
   - A2 bekannte Fehler, u. a. Store-Sprache Deutsch fehlt (`de.lproj`)
   - A3 Schritte aus Apple Health, nur als Erklärung im Wochenfazit, **kein Schrittziel**
   - A4 Hinweise beim ersten Kontakt statt Einführungstour
   - A5 Stückzahl für Grundnahrungsmittel („Ei 3 Stk."), gratis
   - A6 Bedarfsrechner jederzeit unter Mehr, realistischer: Alltag und Training getrennt,
     Untergrenze Grundumsatz, Protein bei BMI > 30 auf Referenzgewicht, Herleitung als Tabelle
   - Mit 1.2 ein In-App-Event „Major Update" erwägen.
6. **31.01.2027:** Werbetext zurücksetzen, er nennt den Einführungspreis.

**Offene Entscheidungen von Luca**
- Ab Februar kostet Pro in Deutschland/Österreich **EUR 34.99** (Apples Umrechnung von CHF 25).
  Falls zu hoch: bis Ende Januar über „Custom Price Change" einzeln senken.
- Ebook (`beserious.ch/nutrition-guide`, CHF 15) und Pro kosten dasselbe. Vorschlag: Bündel über
  **Offer Codes**. Noch nicht entschieden.
- Ebook-Drehbücher: vier Proben geschrieben, voller Satz wartet auf die Kapitelübersicht.

---

## Befehle

```
npm test                                  # 131 Unit-Tests
npx playwright test                       # 35 e2e, Projekte "mobile" (de-CH) und "us" (en-US)
npx playwright test e2e/X.spec.ts --project=mobile -g "Name"   # einzelner Test
npm run build                             # tsc + vite
npm run screenshots                       # Screenshots 1–7 und Creative Assets, beide Sprachen
LANG=en_US.UTF-8 npx cap sync ios
```

Archiv und Upload stehen in `docs/NATIVE.md`; Build-Nummer in beiden Zielen hochzählen, sonst
lehnt App Store Connect ab.
