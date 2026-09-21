# Native App (Capacitor) – Serious Nutrition

Bundle-ID `ch.beserious.nutrition`, App-Name „Serious Nutrition“. Web-Code und native Hülle teilen sich
den gesamten Quellcode; `capacitor.config.ts` ist die Konfiguration, `ios/` und `android/` die generierten
Projekte (im Repo, ohne Build-Artefakte).

## Was nativ anders läuft

| Funktion | Web (PWA) | Nativ (Capacitor) |
|---|---|---|
| Barcode-Scanner | ZXing im Browser | **ML Kit** (`@capacitor-mlkit/barcode-scanning`), System-Scanansicht, Freigabe wird gespeichert |
| Backup-Export | Web Share / Download | Datei in den Cache, **System-Share-Sheet** (`@capacitor/share` + `filesystem`) |
| Haptik | – | `@capacitor/haptics` (z.B. nach erfolgreichem Scan) |
| Statusleiste/Splash | – | `@capacitor/status-bar`, `@capacitor/splash-screen` |
| Android-Zurück-Taste | – | schliesst Dialoge, sonst App in den Hintergrund |
| Service Worker / Update-Banner | ja | nein (Updates kommen über den Store) |
| Erinnerungen | – | **lokale Mitteilungen** (`@capacitor/local-notifications`): Frühstück/Mittag/Abend, Wasser-Takt, Wiegen, Wochenrückblick, Protein-Rest; max. 3/Tag, 64 Textvarianten je Anlass (`src/lib/reminderTexts.ts`), Planung in `src/lib/reminders.ts`, Terminierung in `src/lib/remindersNative.ts` – wird bei Start, Resume und nach jedem Eintrag neu geplant |

Die Weiche ist `isNative` in `src/lib/native.ts`; alle Plugins werden dynamisch importiert, damit das
Web-Bundle nichts davon lädt.

## Einmalige Einrichtung auf dem Mac

1. **Xcode** aus dem Mac App Store installieren (ca. 12 GB), einmal öffnen und die iOS-Plattform mitinstallieren.
2. Xcode als aktive Entwicklerwerkzeuge setzen:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
3. CocoaPods ist bereits installiert (`brew install cocoapods`). Terminal auf UTF-8:
   ```bash
   echo 'export LANG=en_US.UTF-8' >> ~/.zprofile
   ```
4. Für Android: **Android Studio** installieren (inkl. SDK), beim ersten Start die Standard-SDK-Komponenten wählen.

Mindest-iOS ist **16.0** (ML Kit 8 verlangt es). iOS-Simulator-Runtime bei Bedarf laden:
```bash
xcodebuild -downloadPlatform iOS
```

**Simulator-Einschränkung:** Googles ML Kit liefert für den iOS-Simulator nur x86_64-Binaries; auf Apple-Silicon-Macs
mit Xcode 27 (keine Rosetta-Simulatoren mehr) lässt sich die App deshalb nicht im Simulator starten. Der Build für
echte Geräte (arm64) ist davon nicht betroffen – **auf dem iPhone testen**.

## iOS bauen und auf dem iPhone testen

```bash
npm run ios
```
Das baut die Web-App, synchronisiert sie ins iOS-Projekt (inkl. `pod install`) und öffnet Xcode.
In Xcode: oben das Ziel „App“ → Team wählen (Apple-Developer-Konto) → Gerät auswählen → ▶ Run.
Beim ersten Mal auf dem iPhone: Einstellungen → Allgemein → VPN & Geräteverwaltung → Entwickler vertrauen.

TestFlight: Product → Archive → Distribute App → App Store Connect.

## Android bauen

```bash
npm run android
```
Öffnet Android Studio; dort ▶ Run auf Emulator oder Gerät. Release: Build → Generate Signed Bundle (.aab).

## Nach jeder Code-Änderung

```bash
npm run cap:sync
```
kopiert den neuen Web-Build in beide Projekte. Xcode/Android Studio danach neu bauen.

## Assets

Quelle ist das BS-Logo `assets/brand/bs-logo.png`. `store/brand-assets.mjs` rendert daraus Icon (dunkler Hintergrund,
Variante A), Android-Vorder-/Hintergrund, Splash und PWA-Icons; danach erzeugt @capacitor/assets alle Grössen:
```bash
npm run brand
```

## Berechtigungen

- iOS: `NSCameraUsageDescription` in `ios/App/App/Info.plist` (zweisprachig).
- Android: `CAMERA` in `android/app/src/main/AndroidManifest.xml`; ML-Kit-Scanner-Modul wird bei Bedarf
  von Google Play nachgeladen.

## Offen (siehe STORE-LAUNCH.md)

Onboarding, automatisches Cloud-Backup, In-App-Kauf (RevenueCat), Rechtstexte, Store-Einträge.

## Grosse Displays (iPad, iPhone Duo)

Ab 700 px Breite werden Tagebuch, Woche und Gewicht zweispaltig (`.split-side` / `.split-main`
in `src/index.css`, Abschnitt „Grosse Displays“). Das gilt für das aufgeklappte iPhone Duo im
Querformat (~904 × 640 pt) und für iPads; hochkant (~640 pt) bleibt es einspaltig, zentriert.
Das Aussendisplay (4:3, ~474 × 696 pt) nutzt das Handy-Layout mit Tab-Leiste unten.
Der Wechsel zwischen den Displays ist für die App ein Fenster-Resize; `e2e/duo-layout.spec.ts`
prüft, dass dabei kein horizontales Scrollen entsteht und offene Dialoge bedienbar bleiben.
Alle Ausrichtungen sind in `Info.plist` freigegeben. Der Build ist auf iPhone beschränkt
(`TARGETED_DEVICE_FAMILY = 1`); für einen iPad-Release müsste das auf `1,2` und die
iPad-Screenshots ergänzt werden.

## Widgets (iOS, WidgetKit)

Target `SeriousWidgets` (ios/App/SeriousWidgets, Swift, Deployment-Target 16.0), eingebettet in die App.
Datenfluss: `src/lib/widgets.ts` rechnet nach jeder Datenänderung (über `scheduleReminderSync`) und beim
Start/Vordergrund einen Tagesstand (`WidgetSnapshot`) und schreibt ihn per lokalem Capacitor-Plugin
`WidgetBridge` (ios/App/App/WidgetBridgePlugin.swift, registriert in `MainViewController`) als JSON in
die App Group `group.ch.beserious.nutrition`; danach `WidgetCenter.reloadAllTimelines()`.
Die Extension liest den Stand (`Snapshot.load()`), setzt einen Stand von gestern für heute auf null und
rechnet Wasser dazu, das über den Widget-Button (`AddWaterIntent`, iOS 17) vorgemerkt wurde. Die App
holt diese Einträge mit `takePendingWater` ab (`importPendingWater()` in native.ts) und speichert sie in
der Datenbank.

Widgets: `TodayWidget` (Home klein/mittel; mittel mit +250/+500 ml) und `LockWidget`
(Sperrbildschirm rund/rechteckig/inline). Tippen öffnet die App über `seriousnutrition://diary`.
Das Target wurde mit xcodeproj (Ruby, aus CocoaPods) angelegt; App Group und Entitlements sind in
`App/App.entitlements` bzw. `SeriousWidgets/SeriousWidgets.entitlements`, das automatische Signing
registriert die App Group selbst. Beide Targets müssen dieselbe MARKETING_VERSION/CURRENT_PROJECT_VERSION
haben, sonst lehnt App Store Connect den Upload ab.
