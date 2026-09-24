#!/bin/bash
# Rendert die echten Widget-Ansichten im iOS-Simulator, ohne die App zu installieren.
#
# Warum der Umweg: Der Barcode-Scanner (Google ML Kit) liefert keine arm64-Variante für den
# Simulator, darum erzwingt CocoaPods dort x86_64 – das läuft auf Apple Silicon nicht. Die
# Widget-Quellen hängen an keinem Pod und lassen sich einzeln in eine winzige Hülle
# kompilieren. Angezeigt werden die Platzhalterwerte aus Snapshot.placeholder.
#
# Voraussetzung: ein gebooteter Simulator, z.B. xcrun simctl boot "iPhone 18 Pro"
# Aufruf: tools/widget-preview.sh
set -e

PROJ="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$PROJ/ios/App/SeriousWidgets"
W="${TMPDIR:-/tmp}/serious-widget-preview"
BUNDLE="$W/WidgetPreview.app"
mkdir -p "$W/src" "$BUNDLE"

# Widget-Quellen unverändert übernehmen, nur den @main-Einstiegspunkt entfernen –
# die Vorschau bringt ihren eigenen mit.
python3 - "$SRC/SeriousWidgets.swift" "$W/src/SeriousWidgets.swift" <<'PY'
import sys
s = open(sys.argv[1], encoding='utf-8').read()
open(sys.argv[2], 'w', encoding='utf-8').write(s[:s.index('@main')] + '// @main für die Vorschau entfernt\n')
PY
cp "$SRC/Snapshot.swift" "$SRC/AddWaterIntent.swift" "$W/src/"
cp "$PROJ/ios/App/App/SharedStore.swift" "$W/src/"
cp "$PROJ/tools/WidgetPreviewApp.swift" "$W/src/"

cat > "$BUNDLE/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>WidgetPreview</string>
<key>CFBundleIdentifier</key><string>ch.beserious.widgetpreview</string>
<key>CFBundleName</key><string>WidgetPreview</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSRequiresIPhoneOS</key><true/>
<key>UILaunchScreen</key><dict/>
<key>UIRequiredDeviceCapabilities</key><array><string>arm64</string></array>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string></array>
</dict></plist>
PLIST

xcrun -sdk iphonesimulator swiftc -target arm64-apple-ios17.0-simulator \
  -o "$BUNDLE/WidgetPreview" \
  "$W/src/WidgetPreviewApp.swift" "$W/src/SeriousWidgets.swift" \
  "$W/src/Snapshot.swift" "$W/src/AddWaterIntent.swift" "$W/src/SharedStore.swift"

xcrun actool "$SRC/Assets.xcassets" --compile "$BUNDLE" --platform iphonesimulator \
  --minimum-deployment-target 17.0 --output-format human-readable-text > /dev/null

xcrun simctl terminate booted ch.beserious.widgetpreview 2>/dev/null || true
xcrun simctl install booted "$BUNDLE"
xcrun simctl launch booted ch.beserious.widgetpreview
