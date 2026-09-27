import Foundation
import Capacitor
import StoreKit

/// Bittet das System, die Bewertungs-Abfrage zu zeigen. Ob sie wirklich erscheint, entscheidet
/// iOS: höchstens dreimal pro Jahr und Gerät, und nur wenn Apple es für angebracht hält. Die App
/// darf darum nie behaupten, der Dialog sei gekommen – sie fragt nur an.
@objc(ReviewBridgePlugin)
public class ReviewBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ReviewBridgePlugin"
    public let jsName = "ReviewBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise),
    ]

    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let scene = self.activeScene() else {
                call.reject("no active scene")
                return
            }
            if #available(iOS 16.0, *) {
                AppStore.requestReview(in: scene)
            } else {
                SKStoreReviewController.requestReview(in: scene)
            }
            call.resolve()
        }
    }

    private func activeScene() -> UIWindowScene? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
            ?? UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
    }
}
