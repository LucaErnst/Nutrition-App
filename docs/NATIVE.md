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
