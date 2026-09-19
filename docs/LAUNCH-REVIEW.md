# Launch-Review: Ernährungs-Tracker

Stand: 19.09.2026, Version 0.2.0. Ziel dieser Analyse: Funktionsprüfung des Durchstichs und die
Änderungen, die nötig sind, um die App als „echte App“ zu betreiben – für dich allein oder für
andere Nutzer.

## 1. Funktionsprüfung

### Automatisierte Tests (neu, `npm test`)

22 Unit-Tests für die gesamte Rechenlogik, laufen in CI vor jedem Deploy:

| Modul | Geprüft |
|---|---|
| `nutrition.ts` | Umrechnung g/ml/Stück → Makros, Stückgewicht-Fallback, Summen |
| `goals.ts` | KH-Restberechnung, Phasenauswahl nach Datum/Überlappung, Statusgrenzen |
| `week.ts` | Wochenschnitt nur über erfasste Tage, gewichtetes Wochenziel, Fazit-Texte |
| `weight.ts` | 7-Tage-Fenster-Trend mit Lücken, Δ-Berechnung |
| `date.ts` | Wochenstart (Mo), Monats-/Jahreswechsel |

### Manuell geprüft (Browser, Mobile-Viewport, Live-URL)

Alle Akzeptanzkriterien der Spec:

1. Tag anlegen, Posten je Mahlzeit eintragen, Menge ändern, löschen ✓
2. Barcode → Open Food Facts → Posten mit umgerechneten Nährwerten ✓ (Kamera nur am Gerät prüfbar)
3. Tagesbilanz live ✓
4. Wochenbilanz mit Abgleich gegen gewichtetes Wochenziel ✓
5. Gewicht + Trendlinie ✓

### Behobene Punkte aus dieser Review

- Tastatur öffnete sich beim Öffnen des Dialogs und verdeckte das Feld → kein Auto-Fokus mehr.
- `window.prompt()` für Vorlagen-Namen ist in iOS-Home-Bildschirm-Apps unzuverlässig → Inline-Formular.
- Kohlenhydrate-Balken kannte keinen „erreicht“-Zustand; Fett-Bereich zeigte „noch X g“ statt „im Zielbereich“.
- OFF-Anfrage ohne Timeout konnte endlos „Suche…“ zeigen → 10 s Timeout mit Meldung.
- Kein Fehler-Fallback: ein Render-Fehler hätte eine leere Seite hinterlassen → ErrorBoundary mit „Neu laden“.
- Initialer Download 1,2 MB → 380 KB durch Lazy-Loading von Scanner (ZXing) und Chart (Recharts).

### Bekannte Einschränkungen (bewusst so gelassen)

| Thema | Verhalten | Einschätzung |
|---|---|---|
| Kamera-Freigabe iOS | Home-Bildschirm-App fragt je nach iOS-Version bei jedem Start | WebKit-Limit; nur nativ (Capacitor) sicher lösbar |
| Daten nur lokal | Kein Sync, Backup manuell | Für einen Nutzer ok; Risiko bei Geräteverlust |
| Laufender Tag im Wochenschnitt | zählt mit, Hinweis im Fazit | Alternative: ausschliessen bis Tagesende |
| `confirm()`-Dialoge beim Löschen | Systemdialog | Funktioniert, wirkt aber nicht „app-like“ |

## 2. Empfehlungen für einen echten Launch

Nach Priorität. „Pflicht“ = ohne das würde ich es nicht als App bezeichnen; „Empfohlen“ = deutlicher
Qualitätsgewinn; „Optional“ = nice-to-have.

### A. Pflicht, wenn nur du sie nutzt – umgesetzt in 0.3.0

1. **Datensicherheit** ✓ Backup-Erinnerung im Tagebuch (ohne Backup bzw. älter als 14 Tage, „Später“ = 3 Tage
   Pause), Zeitpunkt des letzten Backups unter „Mehr → Backup“. Offen: automatischer Export nach iCloud Drive
   (nur nativ möglich) oder Cloud-Sync (siehe B2).
2. **Update-Hinweis** ✓ Banner „Neue Version verfügbar – Neu laden“; die App prüft stündlich auf Updates.
3. **Fehler-Reporting** ✓ lokal: Laufzeitfehler, unbehandelte Promises und React-Abstürze landen in
   „Mehr → Diagnose“ (max. 20, teilbar per Share-Sheet). Offen: externer Dienst (Sentry) – braucht ein Konto
   und einen DSN; Anbindung ist in `src/lib/errorLog.ts` an einer Stelle möglich.

### B. Pflicht, wenn andere sie nutzen sollen (Coaching-Klienten, App Store)

1. **Native Hülle mit Capacitor** → App Store / TestFlight. Gewinn: Kamera-Freigabe wird einmalig
   gespeichert, native Barcode-Erkennung (ML Kit) ist deutlich schneller und robuster als ZXing im Browser,
   Haptik, App-Icon/Splash, Push (z.B. „Gewicht eintragen“). Aufwand: 1–2 Tage plus Apple-Developer-Konto
   (99 $/Jahr). Der Web-Code bleibt zu 100 % identisch.
2. **Accounts + Sync** (Supabase oder Firebase): Login, Daten pro Nutzer, Multi-Device. Das Datenmodell ist
   dafür vorbereitet (saubere Tabellen, IDs, Migrationsversionen). Aufwand: 3–5 Tage inkl. Konfliktlösung
   (letzter Schreiber gewinnt reicht für diesen Anwendungsfall).
3. **Coach-Ansicht** – als Coach willst du die Wochen deiner Athleten sehen. Das ist mit B2 ein
   überschaubarer Schritt (Freigabe pro Athlet, Read-only-Wochenübersicht).
4. **Datenschutz & Recht** – Datenschutzerklärung (Pflicht im App Store und in der EU/CH bei Gesundheitsdaten),
   Impressum, Hinweis auf Open-Food-Facts-Lizenz (ODbL, Attribution ist bereits in der App).
5. **Onboarding** – Zielwerte-Assistent (Gewicht, Aktivität → Vorschlag), statt leerer Phase.

### C. Empfohlen (Produktqualität)

1. **Nährwert-Snapshot im Eintrag** ✓ (0.4.0) – jeder Eintrag friert Name und Werte pro 100 g ein
   (`MealEntry.snapshot`). Schema v4 befüllt bestehende Einträge, Backup-Import ebenfalls.
   Die Referenzdatenbank ist damit frei editierbar; Änderungen gelten nur für neue Einträge.
2. **Textsuche in Open Food Facts** ✓ (0.4.0) – im Such-Tab „… bei Open Food Facts suchen“, Standard
   auf Schweizer Produkte gefiltert, umschaltbar auf weltweit. Bewusst per Knopf statt beim Tippen:
   das Such-Limit liegt bei ~10 Anfragen/Minute (Client-Drosselung 6 s, 503/429 werden erklärt).
   Hinweis: der neue Suchdienst `search.openfoodfacts.org` sendet keine CORS-Header und ist aus dem
   Browser nicht nutzbar; deshalb der klassische Endpunkt `cgi/search.pl`.
3. **Schnellfunktionen** – „Gestern kopieren“, „Mahlzeit kopieren“, Schnell-Eintrag nur kcal,
   Undo nach Löschen (Snackbar), Favoriten-Stern.
4. **Eingabe-Ergonomie** – Mengen-Stepper (+10 g / −10 g), zuletzt verwendete Menge pro Lebensmittel merken,
   Portionsgrössen pro Lebensmittel (1 EL, 1 Handvoll).
5. **Wochenziel-Modus** – Wochen-kcal als Budget (Trainings-/Ruhetag-Verteilung flexibel), passt zu
   deinem Coaching-Ansatz „Kalorien im Rahmen“ statt jeden Tag exakt.
6. **E2E-Tests** – Playwright für die Kernflüsse (Eintragen, Scannen mit Mock, Backup-Rundlauf),
   damit Änderungen nicht unbemerkt etwas brechen.
7. **Design-Feinschliff** – Icons in der Tab-Leiste, Skeleton-Loader statt „Lade…“, Animationen beim
   Auf-/Zuklappen, Haptik (nativ).

### D. Optional

- Apple Health / HealthKit (Gewicht, Kalorien) – nur nativ.
- Rezepte (mehrere Zutaten → ein Lebensmittel mit Portionen).
- Mikronährstoffe / Ballaststoffe (OFF liefert `fiber_100g`, `sugars_100g`, `salt_100g`).
- Export als CSV/PDF für Coaching-Gespräche.
- Mehrsprachigkeit (i18n) – aktuell hart deutsch.

## 3. Technische Schulden / Hygiene

- **Linting** ist konfiguriert (`oxlint`), läuft aber nicht in CI → in den Workflow aufnehmen.
- **Recharts** ist 350 KB für eine Linie – für Version 2 durch ein leichtes SVG ersetzen (oder lazy lassen).
- `confirm()`/Inline-Formulare vereinheitlichen: ein eigener Bestätigungsdialog.
- Dexie-Schema hat Version 3; Migrationen sind additiv – gut. Bei Snapshot (C1) braucht es eine
  `upgrade()`-Funktion, die bestehende Einträge befüllt.
- Rate-Limit OFF: Produktabfragen 100/min (unkritisch), Suche 10/min (client-seitig gedrosselt).

## 4. Empfohlene Reihenfolge

1. A1–A3 (1 Tag) – Sicherheit für den Alltag.
2. C1 + C2 (2 Tage) – stabile Historie, Textsuche.
3. Entscheidung: PWA behalten oder B1 (Capacitor). Wenn Kamera-Prompt und Store-Präsenz wichtig sind: B1.
4. B2/B3 nur, wenn Klienten die App nutzen sollen.
