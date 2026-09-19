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

`assets/icon.svg` ist die Quelle. Neu erzeugen:
```bash
npx @capacitor/assets generate --iconBackgroundColor '#2563eb' --iconBackgroundColorDark '#0f1115' --splashBackgroundColor '#2563eb' --splashBackgroundColorDark '#0f1115'
rm -rf icons public/manifest.webmanifest   # PWA-Dateien kommen von vite-plugin-pwa
```

## Berechtigungen

- iOS: `NSCameraUsageDescription` in `ios/App/App/Info.plist` (zweisprachig).
- Android: `CAMERA` in `android/app/src/main/AndroidManifest.xml`; ML-Kit-Scanner-Modul wird bei Bedarf
  von Google Play nachgeladen.

## Offen (siehe STORE-LAUNCH.md)

Onboarding, automatisches Cloud-Backup, In-App-Kauf (RevenueCat), Rechtstexte, Store-Einträge.
