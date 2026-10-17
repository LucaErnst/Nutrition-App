# Planung: Version 1.4

Angelegt am 17.10.2026. Noch kein Termin. 1.3 (iOS-27-Look) geht zuerst raus.

Herkunft: Vorschläge „Widgets noch Apple-ähnlicher“ vom 17.10.2026. Luca hat die Punkte 1, 3 und 8
für 1.3 gewählt (getönter/durchsichtiger Home-Bildschirm, animierte Zahlen, Tippen springt an die
richtige Stelle). Alles hier ist für 1.4 vorgemerkt.

---

## A. Widgets und iOS-Systemfunktionen

### A1. Wasser im Kontrollzentrum und auf der Aktionstaste (iOS 18+)
- „+250 ml Wasser“ (bzw. +8 fl oz) als **Control** (`ControlWidget`, `ControlWidgetButton`) mit
  demselben `AddWaterIntent` wie im Widget.
- Platzierbar im Kontrollzentrum, auf dem Sperrbildschirm (statt Taschenlampe/Kamera) und auf der
  **Aktionstaste**.
- Zweite Variante mit +500 ml. Menge folgt dem Einheitensystem (Snapshot `waterSteps`).
- Pro-Funktion wie die Widgets? Entscheiden.
- Store: neuer Screenshot oder Erwähnung in „Neu in dieser Version“, Review-Notiz (keine neuen Daten).

### A2. Grosses Widget (`systemLarge`)
- Ring mit kcal, Makro-Balken (Protein, Fett, KH), Wasser mit beiden Knöpfen.
- Mahlzeiten des Tages als Zeilen (Name, kcal) – Snapshot muss dafür um `meals` wachsen
  (`src/lib/widgets.ts` → `buildSnapshot`, Swift `Snapshot.swift`).
- Darunter die sieben Tage der Woche als kleine farbige Balken (violett < 90 %, grün 90–105 %,
  rot > 105 %), wie in der Wochenansicht.
- Grösse des JSON im App-Group-Speicher im Blick behalten (heute < 1 KB).

### A3. Widget konfigurierbar (Hauptwert wählen)
- `AppIntentConfiguration` statt `StaticConfiguration`: „Widget bearbeiten“ → Hauptwert Kalorien,
  Protein oder Wasser.
- Achtung: Wechsel der Konfigurationsart kann bestehende Widgets beim Update entfernen – testen,
  sonst eigenes neues Widget-Kind anlegen und das alte behalten.

### A4. Sperrbildschirm geschützt (optional)
- `.privacySensitive()` auf Zahlen: ausgeblendet, solange das iPhone gesperrt ist.
- Als Einstellung unter Mehr → Widgets (Standard aus), weil viele die Zahl gerade sehen wollen.

### A5. Smart Stack
- `TimelineEntryRelevance` um die Essenszeiten (Erinnerungszeiten aus den Einstellungen nutzen)
  und abends, wenn noch viel offen ist.

### A6. Weitere Ideen (nicht entschieden)
- Apple Watch: Komplikation mit Ring (eigenes Target, grösserer Aufwand).
- StandBy-Darstellung prüfen (Querformat beim Laden): grosse Zahl, wenig Text.

## B. Aus 1.3 offen geblieben
- Paywall-Sheet: nach unten ziehen zum Schliessen (heute nur ×).
- Lebensmittel-Liste unter „Lebensmittel“ voll im Listen-Stil (Zeilen wie unter „Mehr“).
- Store-Bilder und Header ohne Preis-, Gratis- oder Abo-Hinweise (siehe `docs/RELEASE-1.3.md` F).

## C. Vor dem Release
- [ ] Version 1.4 in `package.json` und `project.pbxproj` (4 Stellen, App und SeriousWidgets)
- [ ] Screenshots: neues Widget/Control zeigen, falls gebaut
- [ ] Review-Notizen: neue Systemfunktionen erwähnen
- [ ] Tests grün, TestFlight, Luca testet auf dem iPhone
