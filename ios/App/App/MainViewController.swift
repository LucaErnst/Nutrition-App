import UIKit
import Capacitor

/// Registriert die lokalen Plugins der App (Capacitor kennt nur Pods automatisch).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(HealthBridgePlugin())
        bridge?.registerPluginInstance(ReviewBridgePlugin())
        bridge?.registerPluginInstance(AppearanceBridgePlugin())
    }
}

/// Setzt den Hintergrund hinter der WebView auf die Farbe der App. Nötig, weil das Scan-Plugin
/// (ML Kit) ihn bei jedem Scan fest auf Weiss stellt – oben am Rand schimmerte dann Weiss durch,
/// sobald man über den Anfang hinaus zog.
@objc(AppearanceBridgePlugin)
public class AppearanceBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppearanceBridgePlugin"
    public let jsName = "AppearanceBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setBackground", returnType: CAPPluginReturnPromise),
    ]

    @objc func setBackground(_ call: CAPPluginCall) {
        let r = call.getDouble("r", 0) / 255
        let g = call.getDouble("g", 0) / 255
        let b = call.getDouble("b", 0) / 255
        DispatchQueue.main.async {
            let color = UIColor(red: r, green: g, blue: b, alpha: 1)
            if let webView = self.webView {
                webView.isOpaque = true
                webView.backgroundColor = color
                webView.scrollView.backgroundColor = color
                webView.superview?.backgroundColor = color
            }
            call.resolve()
        }
    }
}
