# Handoff – Serious Nutrition

Stand: 17.10.2026, Abend. 1.1 ist live. **1.2 (Build 27) wurde abgelehnt und ist korrigiert, wartet auf
Lucas „Resubmit“.** **1.3 (iOS-27-Look) liegt als Build 35 in TestFlight**, auf Branch `release-1.3`.
Diese Datei ist die Übergabe an die nächste Sitzung. Wer hier anfängt, soll ohne Rückfragen
weiterarbeiten können.

**So wird sie benutzt:** In einer neuen Sitzung sagen: *„Lies handoff.md und mach dort weiter, wo
wir aufgehört haben."* Vor dem Ende einer Sitzung diese Datei aktualisieren, sonst ist sie nach
zwei Tagen Fiktion.

---

## 1. Ziel

Serious Nutrition 1.1 ist live; jetzt 1.2 durch die Prüfung bringen, 1.3 (neuer Look) fertig testen
und über TikTok/Instagram Downloads erzeugen. Die App ist gratis, Pro ist ein Einmalkauf (CHF 15 im
Launch, ab 01.02.2027 CHF 25). Absender ist Luca als Calisthenics-Coach in Basel; die App ist der
Beweis, nicht der Star.

Technisch: lokal-zuerst, kein Konto, keine Werbung, keine Daten, die das Gerät verlassen. Jede
Entscheidung misst sich daran.

---

## 2. Aktueller Stand

### App Store
- **1.1 (Build 22) live** seit 12.10.2026. In-App-Kauf `pro_lifetime` CHF 15, Preisänderung auf
  **CHF 25 ab 01.02.2027** geplant. Pro für Nutzer von vor 1.1 geschenkt.
- **1.2 (Build 27):** am 16./17.10. in App Store Connect angelegt und von Luca eingereicht
  (17.10., 07:23). **Am 17.10. abgelehnt, Guideline 2.3.7:** Screenshot 1 sagte „No subscription.
  Free to use. Pro once“ / „Ohne Abo. Gratis nutzbar“ – Apple zählt auch „gratis“ und „ohne Abo“
  als Preisangabe. **Behoben:** Bild 1 heisst jetzt „Calories & macros. At a glance.“ / „Kalorien &
  Makros. Auf einen Blick.“, für iPhone (6,7") und iPhone Duo (innen) je DE/EN hochgeladen, altes
  Bild aus der Version entfernt, Reihenfolge per API geprüft. **Offen: Luca klickt „Resubmit to
  App Review“.** Freigabe steht auf **manuell** – nach Apples OK drückt Luca „Release“.
  Eingetragen und zurückgelesen: Beschreibung, „Neu in dieser Version“, Werbetext (neu, war leer),
  Keywords EN, Review-Notizen (gekürzter Gesamttext 3'250 Zeichen, Limit 4'000), Build 27.
- **Restrisiko Preisangabe:** Header und Suchbild sagen noch „No subscription. Free.“; die eigenen
  Produktseiten **TikTok** und **Instagram** (beide freigegeben) zeigen noch das alte Bild 1. Mit 1.3
  ersetzen. Alte `01-diary`-Bilder in der Asset Library erst löschen, wenn 1.2 live ist und die
  Produktseiten umgestellt sind (Luca löscht).
- Bild 7 (offline) und der Duo-Satz sind seit 1.2 zugeordnet.

### Code
- **`main`:** 1.2.0 Build 27 plus zwei lokale Commits (Screenshot-Fix 1.2, Planung 1.3).
  **Nicht gepusht** – vor jedem Push fragen (die Web-Version deployt von dort).
- **`release-1.3`** (7 Commits über `main`, **nicht gepusht**): 1.3.0, iOS-Builds 28–34 in TestFlight,
  aktuell **Build 34**. Inhalt (Details in `docs/RELEASE-1.3.md`):
  - neues Stylesheet `src/ios.css` über `index.css` (Farben, Karten, Segmente mit gleitender
    Markierung, iOS-Schalter, Wasserzeichen-Logo, Ränder)
  - Tab-Leiste Liquid Glass mit gleitender Markierung (`App.tsx`, `.nav-thumb`), grosse Titel
  - Tagebuch: Kalorienring rot→grün (`Ring.tsx`), Makro-Balken, Aktivkalorien/Schritte kurz,
    Trainingstag/Ruhetag (schwarze Kapsel, grün/violett), Wasser oben, Wochenbudget als Karte,
    Mahlzeiten mit rundem +, Einträge per Wischen löschen mit Rückgängig (`SwipeRow.tsx`).
    Wischen zwischen Tagen wurde auf Lucas Wunsch wieder entfernt (nur Pfeile).
  - Eintragen: leere Suche zeigt **Favoriten** und **Zuletzt hinzugefügt** (`useRecentFoods`,
    `useFavoriteFoods`); **„Stück“ bei jedem Lebensmittel**, ohne Stückgewicht fragt die App einmal
    nach Gramm pro Stück und speichert es (`PieceWeight.tsx`).
  - Woche: Wochenschnitt als Ring, Fazit als Dropdown, Tage mit „Mo / 12/10“, T/R-Kapsel, Balken
    violett < 90 %, grün 90–105 %, rot > 105 %, nur kcal.
  - Gewicht: Speichern unter den Feldern, Werte zentriert, Einträge per Wischen löschen.
  - Mehr: wie iOS-Einstellungen – Pro-Karte (schlank, Goldrand), Phasen, Trainingstage, dann
    Gruppen Einstellungen / Daten / Rechtliches mit Symbol, Wert und Pfeil; Antippen öffnet eine
    Unterseite („‹ Mehr“, vom linken Rand wischen, Tipp auf „Mehr“ unten führt zurück, Liste behält
    die Scrollposition). Unterseiten nutzen `SettingsPageContext` in `CollapsibleCard.tsx`.
  - Paywall als Sheet von unten, goldene Kaufknöpfe.
  - Inhalt scrollt hinter Uhrzeit/Notch durch; `html` trägt die Hintergrundfarbe (keine weisse
    Kante beim Herunterziehen).
  - **Widgets** (`ios/App/SeriousWidgets/SeriousWidgets.swift`): Kalorienring mit Farbverlauf,
    Protein-/Wasserbalken, blaue Wasser-Knöpfe, Hintergrund fast schwarz durchscheinend, getönter/
    klarer Home-Bildschirm unterstützt (`widgetAccentable`), Zahlen zählen hoch (`numericText`),
    Tipp auf Ring → Tagebuch, auf Wasser → `seriousnutrition://water` (App springt zur Wasserzeile,
    `native.ts` `appUrlOpen` → Event `sn-deeplink` → `App.tsx`).
- **163 Unit-Tests und 48 e2e-Tests** grün (neu: `e2e/more-pages.spec.ts`; Löschen per Wischgeste
  im Diary-Test; Fazit wird vor der Prüfung aufgeklappt; Duo-Tests messen `.day-pane`).
- Nicht committet und **nicht von Claude**: Lucas Änderungen an `marketing/launch-broll.mjs`,
  `marketing/launch/compose.mjs`, `marketing/instagram/APP-ACCOUNT.md`, Ordner
  `marketing/launch/talking/`. Nicht mit-committen ohne Rückfrage.

### Daten (ab 1.2)
- 6'906 Grundnahrungsmittel (BLS + 495 Schweiz), 6'304 USDA nur Englisch, **288'776 Markenprodukte**
  aus Open Food Facts mitgeliefert (`public/data/off-products.tsv.gz`, vor jedem Release mit
  `tools/build-off-products.mjs` neu erzeugen). Stückgewichte für 47 Lebensmittel.

### Marketing
- Instagram @seriousnutrition.app: Plan bis 01.11. in der Meta Business Suite
  (`marketing/instagram/APP-ACCOUNT.md`). TikTok praktisch bei null, Website-Link erst ab 1'000 Followern.
- **Neuer Content-Plan 02.11.2026–31.01.2027:** `marketing/CONTENT-PLAN-1.3.md` (5 Phasen, 25 Clips,
  8 Karussells, 3 Drehtage, Store-Video, Idee In-App-Event „January Reset“ bis ~17.12. einreichen).
- Entwurf des neuen Looks zum Anklicken: `docs/design/ios27-entwurf.html`,
  online https://claude.ai/code/artifact/372532dc-452a-46b9-8971-34788f4f0981 (Pro/Free umschaltbar, `#free`).

---

## 3. Dateien, die gerade zählen

| Datei | Wofür |
|---|---|
| `docs/RELEASE-1.2.md` | 1.2: B3 erledigt bis auf Resubmit; Ablehnung und Fix dokumentiert |
| `docs/RELEASE-1.3.md` | **1.3: alle Design-Entscheide (A–D), Free-Version, F = was im Store/Marketing neu muss** |
| `docs/RELEASE-1.4.md` | **1.4: Akte** – Wasser im Kontrollzentrum/Aktionstaste, grosses Widget, konfigurierbar, Sperrbildschirm geschützt, Smart Stack, Offenes aus 1.3 |
| `docs/APP-REVIEW-NOTES.md` | Review-Notizen; unten der 1.2-Gesamttext |
| `store/LISTING.md` | Store-Texte inkl. Werbetext ab 1.2 |
| `store/screenshots.mjs` | Screenshots; Bild 1 ohne Preis (Kommentar zur Ablehnung) |
| `src/ios.css` | Der ganze 1.3-Look |
| `marketing/CONTENT-PLAN-1.3.md` | Content bis 31.01.2027 |

---

## 4. Was zuletzt passiert ist (16.–17.10.)

- iOS-27-Entwurf mit Luca in vielen Runden abgestimmt, gespeichert, Free-Ansicht mit Paywall.
- 1.2 in App Store Connect angelegt und befüllt (per iris-API, siehe Punkt 5), eingereicht,
  abgelehnt (2.3.7), Bild 1 ersetzt.
- 1.3 gebaut und als Builds 28–34 hochgeladen; jede Runde nach Lucas Rückmeldung vom iPhone.
- Akte 1.4 angelegt, Content-Plan bis Ende Januar.

---

## 5. Sackgassen – bitte nicht wiederholen

**App Store Connect**
- **Einreichen und Veröffentlichen klickt Luca selbst.** Vorbereiten geht, den letzten Klick nicht.
- Die Anmeldung in Chrome läuft ab (`authResult=FAILED`). Claude meldet sich nicht an – Luca bitten.
- **Team springt:** ASC wechselte mehrmals selbst zwischen „LUCA BERNARD ERNST“ und „Endureps AG“
  (Luca hat beide Teams). Vor jeder Aktion oben rechts das Team prüfen. App-ID: `6814075860`.
- **Metadaten per API statt Formular:** Im Tab mit ASC `fetch('/iris/v1/…', {credentials:'include'})`.
  PATCH auf `appStoreVersionLocalizations/{id}` (description, whatsNew, keywords, promotionalText),
  `appStoreReviewDetails/{id}` (notes), `appStoreVersions/{id}/relationships/build`. Antwortet oft
  mit 500 oder hängt: **mit AbortController (20 s) und 3–4 Wiederholungen**, danach zurücklesen.
  Externe Fetches (GitHub raw) blockiert die CSP – Texte direkt ins Skript.
- `form_input` auf Beschreibungs-/Keyword-Felder verwirft Werte stillschweigend.
- **Screenshots zuordnen:** „View All Sizes in Media Manager“. Die Asset-Auswahl ist virtualisiert;
  `find`-Refs zeigen auf falsche Kacheln. Kachel per JS mit `scrollIntoView` suchen, Mittelpunkt
  messen, dann **echter** Klick auf die Koordinate (`innerWidth` = Screenshot-Frame). Reihenfolge
  danach per API prüfen (`appStoreVersionLocalizations/{id}/appScreenshotSets?include=appScreenshots`),
  umsortieren mit PATCH `appScreenshotSets/{id}/relationships/appScreenshots`, alte mit DELETE
  `appScreenshots/{id}` aus der Version nehmen.
- Datei-Upload: `HTMLInputElement.prototype.click` abfangen, dann `file_upload` auf das Input.
- **Keine Preis-, Gratis- oder Abo-Hinweise** in Screenshots, Headern, Videos (Ablehnung 17.10.).
- Review-Notizen max. 4'000 Zeichen. Werbetext einer neuen Version startet leer.

**1.3-Bau**
- Vorschau mit Daten: `node marketing/demo-data.mjs`, Datei als `public/__demo.json` kopieren (in
  `.git/info/exclude`), im Browser `restoreBackup` per `import('/src/lib/backup.ts')`.
  **Vor jedem Build löschen**, sonst landet sie in der App.
- `marketing/demo-backup.json` ist nicht im Repo (Generator überschreibt sie).
- `useEffect(() => window.scrollTo(0, 0), …)` ohne geschweifte Klammern liess „Mehr“ abstürzen
  („destroy is not a function“). Effekte immer mit `{ … }`.
- Zurück-Wischen auf iOS: Pointer-Events brechen beim kleinsten senkrechten Scrollen ab, Mitziehen
  der Seite schob die ganze Ansicht leer zur Seite. Jetzt Touch-Events, Auslösen beim Loslassen.
- `package-lock.json` nicht per Suchen/Ersetzen auf die App-Version setzen – das trifft fremde Pakete
  (Wurzel steht dort ohnehin auf 0.17.0).
- Widgets: `widgetAccentedRenderingMode` gibt es nur auf `Image` nach `.resizable()`.
- Kompilieren ohne Signatur: `xcodebuild … -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO`.

**Seed, Daten, Screenshots** – wie bisher:
- `dropRetiredReference` nicht auf Einträge ohne `ref_key` ausweiten (Startliste weg).
- Nach `restoreBackup` → `refreshReferenceAfterRestore`.
- `npm run screenshots` erzeugt **alle** Bilder neu; nur gewollte committen, Rest zurücksetzen.
- Demo-Lebensmittel in `store/screenshots.mjs` müssen `source: 'manual'` tragen.

**Werkzeuge auf diesem Mac**
- Kein LibreOffice, pandoc, pdftoppm. Bauen und Hochladen gibt Claude an den Haiku-Agenten
  `executer` (Befehle unten), danach `ARCHIVE/EXPORT SUCCEEDED` und `CFBundleVersion` im Archiv prüfen.
- Playwright-Projekt `us` läuft nur `imperial.spec.ts`.

---

## 6. Nächste Schritte

1. **1.2 neu einreichen** (Luca: abgelehnte Einreichung → „Resubmit to App Review“). Nach Freigabe
   „Release“ drücken (manuelle Freigabe).
2. **1.3 testen** (Build 35, Zurückwischen wie iOS mit Liste darunter): Zurück-Wischen unter Mehr, Notch-Bereich, Pro-Karte, Widgets im
   getönten Modus, Tippen aufs Widget (Ring/Wasser), Stück-Abfrage. Rückmeldungen in `docs/RELEASE-1.3.md`.
   Offene Frage an Luca: was genau „Widgets funktionieren nicht“ hiess (Text im Widget? Mehr →
   Diagnose → „Widgets:“).
3. **Wenn 1.3 steht:** Store-Bilder neu nach `docs/RELEASE-1.3.md` F (iPhone, Duo, Header, Suchbild,
   beide eigenen Produktseiten, ohne Preis), „Neu in dieser Version“, Review-Notizen, Branch
   `release-1.3` nach `main`, **vor dem Push fragen**, 1.3 einreichen (nach 1.2).
4. **Content:** Drehtag A sobald 1.3 steht (`marketing/CONTENT-PLAN-1.3.md`). Instagram-Plan endet 01.11.
5. **Kauftest** mit Lucas echtem Apple-Konto (nur Luca). Impressum/Rechtstexte auf beserious.ch (Luca).
6. **31.01.2027:** Werbetext zurücksetzen (nennt den Einführungspreis). 01.02. Preis CHF 25.

**Offene Entscheidungen von Luca**
- Balkengrenzen Woche (90–105 %) – so lassen oder strenger?
- In-App-Event „January Reset“ ja/nein (einreichen bis ~17.12.).
- EUR 34.99 in DE/AT ab Februar; Ebook-Bündel über Offer Codes.

---

## Befehle

```
npm test                                  # 163 Unit-Tests
npx playwright test                       # 48 e2e, Projekte "mobile" (de-CH) und "us" (en-US)
npx playwright test e2e/X.spec.ts --project=mobile -g "Name"   # einzelner Test
npm run build                             # tsc + vite
npm run screenshots                       # Screenshots und Creative Assets, beide Sprachen
LANG=en_US.UTF-8 npx cap sync ios
```

Archiv und Upload stehen in `docs/NATIVE.md`; Build-Nummer `CURRENT_PROJECT_VERSION` an **vier**
Stellen in `ios/App/App.xcodeproj/project.pbxproj` hochzählen (App und SeriousWidgets), sonst lehnt
App Store Connect ab. Nächste freie Build-Nummer: **36**.
