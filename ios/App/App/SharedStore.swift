import Foundation

/// Gemeinsamer Speicher von App und Widget (App Group). Wird in beiden Targets kompiliert.
enum SharedStore {
    static let appGroup = "group.ch.beserious.nutrition"
    static let snapshotKey = "widgetSnapshot"
    static let pendingWaterKey = "pendingWater"
    static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }
}
