import Foundation

/// Spiegel von WidgetSnapshot in src/lib/widgets.ts
struct Snapshot: Codable {
    var date: String
    var lang: String
    var kcal: Int
    var kcalTarget: Int?
    var protein: Int
    var proteinTarget: Int?
    var waterMl: Int
    var waterGoalMl: Int
    var weekLeftToday: Int?
    var weekDaysLeft: Int?
    var weekOnTrack: Bool?
    var updatedAt: Double

    static let placeholder = Snapshot(date: "", lang: "en", kcal: 1497, kcalTarget: 2700, protein: 112, proteinTarget: 160,
                                      waterMl: 1750, waterGoalMl: 3000, weekLeftToday: 1203, weekDaysLeft: 3, weekOnTrack: true, updatedAt: 0)

    var kcalLeft: Int? { kcalTarget.map { max(0, $0 - kcal) } }
    var proteinLeft: Int? { proteinTarget.map { max(0, $0 - protein) } }
    var kcalProgress: Double { guard let t = kcalTarget, t > 0 else { return 0 }; return min(1, Double(kcal) / Double(t)) }
    var proteinProgress: Double { guard let t = proteinTarget, t > 0 else { return 0 }; return min(1, Double(protein) / Double(t)) }
    var waterProgress: Double { waterGoalMl > 0 ? min(1, Double(waterMl) / Double(waterGoalMl)) : 0 }
    var isGerman: Bool { lang == "de" }

    static func todayISO() -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    /// Liest den Stand der App und rechnet Wasser dazu, das im Widget eingetragen, aber von der
    /// App noch nicht übernommen wurde. Ein Stand von gestern wird für heute auf null gesetzt
    /// (Ziele bleiben), damit das Widget morgens nicht die Werte von gestern zeigt.
    static func load() -> Snapshot? {
        guard let store = SharedStore.defaults, let json = store.string(forKey: SharedStore.snapshotKey),
              let data = json.data(using: .utf8), var snap = try? JSONDecoder().decode(Snapshot.self, from: data) else { return nil }
        let today = todayISO()
        if snap.date != today {
            snap.date = today
            snap.kcal = 0
            snap.protein = 0
            snap.waterMl = 0
            snap.weekLeftToday = nil
            snap.weekDaysLeft = nil
            snap.weekOnTrack = nil
        }
        let pending = store.array(forKey: SharedStore.pendingWaterKey) as? [[String: Any]] ?? []
        for p in pending {
            guard let ml = p["ml"] as? Int, let at = p["at"] as? Double else { continue }
            let d = Date(timeIntervalSince1970: at / 1000)
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX")
            if f.string(from: d) == today { snap.waterMl += ml }
        }
        return snap
    }

    /// Wasser aus dem Widget-Button vormerken (die App holt es beim nächsten Öffnen ab).
    static func addPendingWater(_ ml: Int) {
        guard let store = SharedStore.defaults else { return }
        var items = store.array(forKey: SharedStore.pendingWaterKey) as? [[String: Any]] ?? []
        items.append(["ml": ml, "at": Date().timeIntervalSince1970 * 1000])
        store.set(items, forKey: SharedStore.pendingWaterKey)
    }
}

/// Zweisprachige Texte, Sprache folgt der App-Einstellung im Snapshot.
enum L {
    static func t(_ de: Bool, _ en: String, _ deText: String) -> String { de ? deText : en }
}

func fmtInt(_ n: Int, de: Bool) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.groupingSeparator = de ? "’" : ","
    f.usesGroupingSeparator = true
    return f.string(from: NSNumber(value: n)) ?? String(n)
}
