# Planung: Version 1.3

Angelegt am 16.10.2026. Noch kein Termin. 1.2 geht zuerst raus.

**Schwerpunkt: Look im Stil von iOS 27.** Gleiche Funktionen wie Build 27 (1.2), neue Darstellung
nach Apples Mustern. Luca hat den Entwurf am 16.10.2026 abgenommen.

- Entwurf zum Anklicken: `docs/design/ios27-entwurf.html` (im Browser öffnen, eine Datei, keine
  Abhängigkeiten ausser Google Fonts). Online: https://claude.ai/code/artifact/372532dc-452a-46b9-8971-34788f4f0981
- Der Entwurf ist eine Attrappe mit Beispieldaten. Massgebend für das Verhalten bleibt der Code
  von 1.2; der Entwurf legt nur Aussehen und Bewegung fest.

---

## A. Grundsätze

1. **Keine Funktion fällt weg.** Alles aus Build 27 bleibt an seinem Platz (Tageswechsel, Wasser,
   Mahlzeiten aufklappen, gestern kopieren, Vorlagen, Wochenbudget, Phasen, Backup, CSV …).
2. **Farben:** Hinzufügen und alle Aktionen bleiben **blau** wie heute (`--accent` #2563eb, dunkel
   #3b82f6). Gold nur für Marke und Pro (Pro-Karte, Logo).
3. **Keine Zeilenumbrüche in Listenzeilen.** Lange Namen enden mit „…“ (wie bei Apple), voller Name
   beim Antippen. Untertitel so kurz, dass sie auf eine Zeile passen.
4. **Jeder Knopf gibt beim Drücken nach** (kurz kleiner, federt zurück); ganze Listenzeilen nur leicht
   und werden kurz dunkler.
5. Hell und dunkel gleich sorgfältig. Grautöne kräftiger als iOS-Standard (Hintergrund #e4e4ea,
   graue Flächen 22 % statt 14 %).

## B. Bausteine

- **Tab-Leiste: Liquid Glass.** Schwebende Glaskapsel unten, deutlich durchsichtig, feine Lichtkante.
  Die Markierung ist eine eigene Glaskapsel, die beim Wechsel zum neuen Tab **gleitet** und leicht
  nachfedert (streckt sich kurz wie ein Tropfen). Tabs sind so breit wie ihr Wort, die Markierung
  misst die Breite bei jedem Wechsel (wichtig für „Lebensmittel“ und andere Sprachen).
- **Grosse Titel**, die beim Scrollen in eine Glas-Navigationsleiste übergehen.
- **Gruppierte Listen** mit runden Karten (Radius 26), Haarlinien ab 16 px.
- **Sheets** mit Griff oben, × zum Schliessen, nach unten ziehen schliesst; Hintergrund weicht
  leicht zurück.
- **Wischen nach links zum Löschen wie bei Apple:** kurz wischen zeigt „Löschen“, über die halbe
  Breite löscht direkt (Zeile gleitet raus, Lücke schliesst sich). Danach Meldung mit
  **Rückgängig** (4 s). Gilt für Einträge im Tagebuch und unter Gewicht. Senkrecht scrollen bleibt
  frei; Wischen auf einem Eintrag löscht, ausserhalb wechselt es den Tag.
- **BS-Logo als Wasserzeichen** (`public/splash-logo.png`) mittig, fest, 86 % Bildschirmbreite,
  hell 6 %, dunkel 3,5 % Deckkraft; über dem Inhalt, unter Tab-Leiste und Sheets, nicht antippbar.

## C. Bildschirme

**Tagebuch**
- Tag wechseln per Pfeil, Tipp aufs Datum (Datumsauswahl) und **neu: seitlich wischen**.
- Tageskarte: **Kalorienring färbt sich nach Anteil am Ziel** (wenig rot → ½ orange → ¾ gelbgrün →
  100 % grün; darüber bleibt grün). Rechts Protein, Fett, KH. Unten „noch … kcal“, rechts
  **Aktivkalorien und Schritte untereinander** (Apple Health). Keine Health-Zeile mehr unter dem Wasser.
- **Trainingstag/Ruhetag:** schwarze Kapsel (dunkel: #3a3a3c), gewählter Text samt Symbol farbig:
  Trainingstag **grün** mit Blitz, Ruhetag **violett** mit Mond; nicht gewählt grau. Wechsel
  passt Ring, „noch … kcal“ und KH-Ziel sofort an, Ring pulsiert kurz.
- **Wasser oben** unter dem Tagestyp (−, +250, +500).
- Wochenbudget kompakt.
- **Mahlzeiten als Dropdown** wie heute: zu zeigt Anzahl Posten und Makros auf einer Zeile, + rechts.
  Offen: Einträge (Menge antippen ändert), „Als Vorlage speichern“. Leer: „Von gestern kopieren“.

**Eintragen (Sheet)**: Suchen / Scannen / Vorlagen / Manuell als Segment, Suchfeld fest oben,
Treffer getrennt nach eigenen, Grundnahrungsmitteln, Produkten in der App, danach Menge mit
Stepper, Schnellwahl, kcal-Vorschau, Hinzufügen.

**Woche**
- Wochen wechseln (Pfeile).
- **Wochenschnitt als Ring** (Ø kcal vom Ziel, gleiche Farbregel) plus Balken für Protein, Fett,
  KH, Wasser – füllt die Karte ganz.
- Wochenbudget-Karte.
- **Fazit als Dropdown**, zu mit Zusammenfassung „● 1 erreicht · ● 3 Hinweise · ● 1 Info“.
- **Tage-Liste:** Wochentag mit Datum klein darunter („Mo“ / „13/10“), heute blau; T/R in
  schwarzer Kapsel (T grün, R violett); Balken; rechts nur die eingetragenen kcal („–“ wenn leer).
  **Balkenfarbe:** unter 90 % des Tagesziels violett, 90–105 % grün, über 105 % rot. Kleine
  Legende darunter. Tag antippen öffnet ihn im Tagebuch. Grenzen 90–105 % von Luca am 19.10.2026
  bestätigt (bleiben so).

**Gewicht**
- Eintragen: Datum und kg nebeneinander, **„Speichern“ als breiter Knopf darunter**.
- Verlauf: Segment 30 T / 90 T / 1 Jahr / Alles; Aktuell, Trend, Δ 7 Tage **zentriert**; Diagramm.
- Einträge mit Health-Markierung, löschen per Wischen.

**Lebensmittel**: grosser Titel, **ein** „+ Neu“ oben rechts in der Leiste, Suchfeld, eigene
Lebensmittel mit Favoritenstern; bei Suche zusätzlich Grundnahrungsmittel, Produkte in der App,
„bei Open Food Facts suchen“. Ohne „100 g ·“ in jeder Zeile (steht in der Fusszeile).

**Mehr**
- Pro-Karte mit **App-Logo** (`icon-192.png`), **dezentem Goldrand** (Verlauf hell- bis dunkelgold)
  und leichtem Goldschimmer; Schriftzug läuft ins Gold aus.
- Phasen, Auswertung, Bedarf berechnen, Standard-Trainingstage, Apple Health (Schalter),
  Erinnerungen, Wasser, Einheiten, Sprache, Hinweise, Backup, CSV, Diagnose, Rechtliches.

## D. Free-Version (ohne Pro)

Im Entwurf oben links umschaltbar (Mit Pro / Ohne Pro); direkt als Free öffnen mit `#free` am Link. Gesperrt ist dasselbe wie in 1.2 (`src/components/Paywall.tsx`):
Apple Health, Phasen-Auswertung, Widgets, Vorlagen und „gestern kopieren“, Portionsgrössen, das
Gewichtstrend-Diagramm, CSV-Export. Gesperrte Stellen tragen das goldene **PRO**-Abzeichen,
Antippen öffnet die Paywall als Sheet.

- **Tagebuch:** „Von gestern kopieren“ und „Als Vorlage speichern“ mit PRO → Paywall. Keine
  Aktivkalorien/Schritte (Health aus), dort steht die Phase.
- **Eintragen:** Reiter „Vorlagen“ öffnet die Paywall, der Reiter bleibt auf dem bisherigen.
- **Woche:** Fazit ohne Schritte-Zeile.
- **Gewicht:** statt Diagramm schraffierte Fläche mit PRO und „Das 7-Tage-Trend-Diagramm ist Teil
  von Pro.“; Aktuell/Trend/Δ bleiben; keine Health-Markierung an Einträgen.
- **Mehr:** oben Verkaufskarte (Logo, „Einmal zahlen. Für immer behalten.“, Text aus
  `pro.sectionHint`, goldener Knopf „Pro holen · CHF 15.00“). Auswertung, Apple Health (Schalter aus)
  und CSV mit PRO → Paywall.
- **Paywall-Sheet:** grosses Logo mit Goldschein, Titel, Tagline, 7 Vorteile mit goldenen Haken,
  „bleibt gratis“-Satz, goldener Kaufknopf, „Einmalkauf. Kein Abo.“, Kauf wiederherstellen,
  Nutzungsbedingungen/Datenschutz. Griff + × + nach unten ziehen schliesst.
- Preis im Entwurf: Einführungspreis CHF 15.00 (bis 31.01.2027, danach CHF 25.00); in der App kommt
  er aus dem Store.
- Neue Form „Portionsgrössen“ im Lebensmittel-Formular (PRO) ist im Entwurf nicht gezeichnet.

## E. Offen

- Umsetzung planen: welche Teile als eigene Komponenten (Tab-Leiste, Sheet, Swipe-Zeile, Ring).
- Neue Screenshots für Store (iPhone und Duo) nach dem Umbau.
- e2e-Tests anpassen (Selektoren der neuen Tab-Leiste, Wischen).

## F. Alles, was nach dem Umbau neu muss (Termin Sa 17.10.2026 ab 18:00)

Ziel: Alles, was bisher veröffentlicht ist, zeigt danach den neuen Look. **Wichtig:** Store-Bilder
müssen die echte App zeigen (App Review Guideline 2.3.3), nicht den Entwurf. Reihenfolge deshalb:
1.3 bauen → in TestFlight prüfen → Bilder aus der gebauten App erzeugen → mit 1.3 einreichen.
Screenshots lassen sich nur zusammen mit einer neuen Version tauschen.

### F1. Reihenfolge und Abhängigkeiten
1. **1.2 eingereicht und freigegeben** (läuft, Stand 16.10.).
2. **1.3 bauen** (Teile A–D), Tests grün, TestFlight. Erst danach sind echte Bilder möglich.
3. **Bilder erzeugen** mit `npm run screenshots` (alle Sätze) – `store/screenshots.mjs` muss die neuen
   Selektoren kennen (Tab-Leiste, Sheet, Wasser oben). Demo-Lebensmittel bleiben `source: 'manual'`.
4. **Asset Library** hochladen, freigeben lassen, Version 1.3 zuordnen, einreichen.

### F0. Widgets (Wunsch Luca 17.10.)
- [x] Home-Widgets im neuen Look: Kalorienring mit Farbverlauf (rot → grün), Wasser-Knöpfe blau,
      Hintergrund fast schwarz durchscheinend (Build 30–31).
- [x] Getönter und durchsichtiger Home-Bildschirm (Ring, Balken, Zahlen `widgetAccentable`, Logo
      entsättigt), Zahlen zählen beim Aktualisieren hoch (`numericText`), Tippen: Ring → Tagebuch,
      Wasser → Wasserzeile (`seriousnutrition://water`, App springt hin und hebt sie hervor). Build 33.
- Weitere Widget-Ideen: `docs/RELEASE-1.4.md`.

### F2. App Store – Bilder (alles in DE und EN)
**Stand 17.10.2026:** Alle Bilder aus Build 34 neu erzeugt (`node store/screenshots.mjs iphone duo-outer duo-inner`,
im Repo, noch **nicht** in App Store Connect hochgeladen): iPhone 7 je DE/EN, Duo aussen/innen je 7,
Header und Suchbild ohne „No subscription/Free“ („Built for training.“ / „Fürs Training gebaut.“).
Deutsche Bilder zeigen das Datum jetzt im Schweizer Format (Browser je Sprache).
Hochladen erst, wenn Luca 1.3 auf dem iPhone abgenommen hat; dann auch beide eigenen Produktseiten.
- [ ] iPhone 6,9"/6,7" (1290×2796): 7 Bilder `store/screenshots/{de,en}` inkl. `07-offline`. Texte prüfen
      („Calories & macros. No subscription.“ usw.) – passen sie zum neuen Look?
- [ ] iPhone Duo aussen (`duo-outer`, 1398×2034) und innen (`duo-inner`, 2007×2853), je 7 Bilder.
      Ab April 2027 verlangt Apple Duo-Screenshots, gebaut mit dem iOS-27.1-SDK.
- [ ] **Header** und **Suchbild** (`store/creative/{de,en}/header.png`, `search.png`) – zeigen das alte UI.
      Text „No subscription. Free.“ raus (Guideline 2.3.7, Ablehnung 1.2 am 17.10.2026).
- [ ] **Keine Preis-, Gratis- oder Abo-Hinweise** in Screenshots, Headern oder Videos – nur in der Beschreibung.
- [ ] **Eigene Produktseiten** TikTok und Instagram (Custom Product Pages): haben eigene Bilder, mit
      neuen ersetzen und neu einreichen. Links in den Bios bleiben gleich.
- [ ] App-Vorschau-Video: gibt es bisher nicht. Mit 1.3 sinnvoll (bis 30 s, echte Bildschirmaufnahme,
      kein Logo-Intro); siehe `marketing/CONTENT-PLAN-1.3.md` „Store-Video“.
- [ ] Widgets: wenn das Aussehen mitzieht, Widget-Bild in den Screenshots tauschen.

### F3. App Store – Texte
- [x] Entwurf „Neu in dieser Version“ 1.3 DE/EN in `store/LISTING.md`, Review-Notizen-Entwurf in
      `docs/APP-REVIEW-NOTES.md` (3'233 Zeichen). Ursprüngliche Stichworte: neuer Look, Wischen zum Löschen mit
      Rückgängig, farbiger Kalorienring, Wochenschnitt als Ring, Balkenfarben in der Woche.
- [ ] Beschreibung: ein Satz zum Look nur, wenn er Nutzen beschreibt (z.B. „Swipe between days“).
- [ ] **Werbetext** nennt den Einführungspreis bis 31. Januar → spätestens 31.01.2027 zurücksetzen.
      Am **01.02.2027** springt der Preis auf CHF 25; kein Preis in Beschreibung oder „Neu in …“.
- [ ] Review-Notizen 1.3: Paywall-Wege haben sich verschoben (PRO-Abzeichen, Verkaufskarte unter
      Mehr); Wischgesten erwähnen. Limit 4000 Zeichen (1.2-Text hat 3250).
- [ ] Keywords: nach 4 Wochen 1.2 die Suchbegriffe in App Analytics prüfen, dann erst ändern.

### F4. Ausserhalb des App Store
- [x] **Launch-Inhalte 1.3 erzeugt (17.10.2026):** 2 Karussells, 4 Storys, 5 App-Reels – Plan, Dateien
      und Captions in `marketing/instagram/POSTING-1.3.md`. Talking-Head-Clips folgen nach Drehtag A.
- [ ] Web-Version (GitHub Pages) bekommt den Look automatisch mit dem Push – vorher Luca fragen.
- [ ] Marketing-Seite `https://lucaernst.github.io/Nutrition-App/` und beserious.ch: alte Screenshots?
- [ ] Instagram: Karussells und Storys nutzen alte App-Bilder (`marketing/instagram/shots.mjs`) –
      für neue Posts neu erzeugen; alte Posts bleiben stehen.
- [ ] TikTok/Instagram-Profilbild bleibt (App-Icon unverändert).
- [ ] Hinweise (Tips) in der App: zeigen sie auf Stellen, die sich verschoben haben?
- [ ] e2e-Tests und `store/screenshots.mjs` an neue Selektoren anpassen.

### F5. Vorher klären
- Termin für 1.3 (Bauzeit realistisch 1–2 Wochen inkl. Test auf Lucas iPhone).
- Soll 1.3 vor Weihnachten live sein? Dann Einreichung spätestens ~10.12., weil Reviews um die
  Feiertage oft länger dauern.

## G. Build 37 (19.10.2026)
- Lebensmittel als iOS-Liste: Stern links, Name mit Makros, kcal und Pfeil; Antippen öffnet das
  Bearbeiten, nach links wischen löscht (Rückfrage vor der Animation, `SwipeRow confirm`).
- Paywall-Sheet: am Griff oder Kopf nach unten ziehen schliesst (kurz zieht zurück).

## H. Build 38 (19.10.2026)
- Zurückwischen unter „Mehr“ neu gebaut (Lucas Video): Unterseite als eigene Ebene über der echten
  Liste, deckt bis ganz oben; am Ende kein Ruckler mehr (Bild nach der Animation pixelgleich geprüft).

## I. Lucas Rückmeldung 19.10.2026

- Balkengrenzen Woche (90–105 %): bleiben so.
- Widgets: sehen gut aus, keine offene Frage mehr.
- Build 38 getestet: Zurückwischen unter Mehr sauber, Lebensmittel-Liste gut, Stück-Abfrage geht.
- Paywall nicht prüfbar: Luca ist Early Adopter (Pro geschenkt), der Schalter „Als Free ansehen“
  in `ProSection.tsx` erscheint nur im Dev-Build (`import.meta.env.DEV`), also nicht in TestFlight.
  Luca nimmt die Paywall aus dem Entwurf ab; kein versteckter Free-Schalter für TestFlight.- Notch, Pro-Karte, Widget-Tipp: gut.

## J. Build 39 (19.10.2026)

- Tipp auf den offenen Tab gleitet sanft nach ganz oben (alle Tabs). Unter Mehr: Ist eine
  Unterseite heruntergescrollt, gleitet erst sie nach oben; steht sie oben, führt der nächste Tipp
  zurück zur Liste (an die alte Stelle). Wie in iOS. Tests in `e2e/more-pages.spec.ts`.

## K. Build 40 (19.10.2026)

- Weisser Schimmer am oberen Rand (Lucas Fund: tritt nach dem Scannen auf). Ursache: Das Plugin
  `@capacitor-mlkit/barcode-scanning` stellt bei jedem Scan den Hintergrund der WebView fest auf
  Weiss (`showWebViewBackground`) und nie zurück. Behoben mit `AppearanceBridgePlugin`
  (`MainViewController.swift`) und `syncNativeBackground()` in `native.ts`: nach jedem Scan, beim
  Start und beim Wechsel Hell/Dunkel bekommt der Hintergrund die Farbe von `html`.
