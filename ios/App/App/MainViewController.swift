import UIKit
import Capacitor

/// Registriert die lokalen Plugins der App (Capacitor kennt nur Pods automatisch).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
