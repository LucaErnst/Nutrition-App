import Foundation
import Capacitor
import WidgetKit

/// Brücke zwischen Web-App und Widget-Extension über den App-Group-Speicher.
/// - setSnapshot: Tagesstand als JSON ablegen und Widgets neu zeichnen lassen
/// - takePendingWater: Wasser, das im Widget per Button eingetragen wurde, abholen und löschen
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takePendingWater", returnType: CAPPluginReturnPromise),
    ]

    @objc func setSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let store = SharedStore.defaults else {
            call.reject("no json or app group")
            return
        }
        store.set(json, forKey: SharedStore.snapshotKey)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }

    @objc func takePendingWater(_ call: CAPPluginCall) {
        guard let store = SharedStore.defaults else {
            call.resolve(["items": []])
            return
        }
        let items = store.array(forKey: SharedStore.pendingWaterKey) as? [[String: Any]] ?? []
        store.removeObject(forKey: SharedStore.pendingWaterKey)
        call.resolve(["items": items])
    }
}
