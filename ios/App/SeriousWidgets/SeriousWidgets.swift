import SwiftUI
import WidgetKit

// MARK: - Timeline

struct Entry: TimelineEntry {
    let date: Date
    let snap: Snapshot
    let hasData: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), snap: .placeholder, hasData: true) }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(current())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let entry = current()
        // Um Mitternacht neu rendern (Tageswerte auf null), sonst spätestens alle 30 min –
        // die App stösst nach jeder Änderung selbst ein Update an.
        let cal = Calendar.current
        let midnight = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: Date())!)
        let next = min(midnight, Date().addingTimeInterval(30 * 60))
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func current() -> Entry {
        if let s = Snapshot.load() { return Entry(date: Date(), snap: s, hasData: true) }
        return Entry(date: Date(), snap: .placeholder, hasData: false)
    }
}

// MARK: - Farben

enum Brand {
    static let bg = Color(red: 0x0f / 255, green: 0x11 / 255, blue: 0x15 / 255)
    static let card = Color(red: 0x1a / 255, green: 0x1d / 255, blue: 0x24 / 255)
    static let gold = Color(red: 0xe6 / 255, green: 0xc4 / 255, blue: 0x6a / 255)
    static let kcal = Color(red: 0x8b / 255, green: 0x5c / 255, blue: 0xf6 / 255)
    static let protein = Color(red: 0x3b / 255, green: 0x82 / 255, blue: 0xf6 / 255)
    static let water = Color(red: 0x38 / 255, green: 0xbd / 255, blue: 0xf8 / 255)
    static let text = Color.white
    static let text2 = Color.white.opacity(0.62)
    static let track = Color.white.opacity(0.12)
}

// MARK: - Bausteine

struct Bar: View {
    let progress: Double
    let color: Color
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Brand.track)
                Capsule().fill(color).frame(width: max(6, g.size.width * progress))
            }
        }
        .frame(height: 6)
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    let progress: Double
    let color: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label).font(.system(size: 11, weight: .medium)).foregroundStyle(Brand.text2)
                Spacer()
                Text(value).font(.system(size: 11, weight: .semibold)).foregroundStyle(Brand.text).monospacedDigit()
            }
            Bar(progress: progress, color: color)
        }
    }
}

struct NoDataView: View {
    let de: Bool
    var body: some View {
        VStack(spacing: 6) {
            Text("BS").font(.system(size: 22, weight: .bold)).foregroundStyle(Brand.gold)
            Text(L.t(de, "Open the app once", "App einmal öffnen")).font(.system(size: 11)).foregroundStyle(Brand.text2)
        }
    }
}

// MARK: - Home: klein

struct SmallView: View {
    let e: Entry
    var s: Snapshot { e.snap }
    var de: Bool { s.isGerman }
    var body: some View {
        if !e.hasData { NoDataView(de: de) } else {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(fmtInt(s.kcalLeft ?? s.kcal, de: de)).font(.system(size: 26, weight: .bold)).foregroundStyle(Brand.text).monospacedDigit()
                    Text(s.kcalTarget == nil ? "kcal" : L.t(de, "kcal left", "kcal übrig")).font(.system(size: 11, weight: .medium)).foregroundStyle(Brand.text2)
                }
                Bar(progress: s.kcalProgress, color: Brand.kcal)
                MetricRow(label: L.t(de, "Protein", "Protein"),
                          value: s.proteinTarget.map { "\(s.protein) / \($0) g" } ?? "\(s.protein) g",
                          progress: s.proteinProgress, color: Brand.protein)
                MetricRow(label: L.t(de, "Water", "Wasser"),
                          value: String(format: "%.2g / %.2g l", Double(s.waterMl) / 1000, Double(s.waterGoalMl) / 1000),
                          progress: s.waterProgress, color: Brand.water)
            }
        }
    }
}

// MARK: - Home: mittel (mit Wasser-Button)

struct MediumView: View {
    let e: Entry
    var s: Snapshot { e.snap }
    var de: Bool { s.isGerman }
    var body: some View {
        if !e.hasData { NoDataView(de: de) } else {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(fmtInt(s.kcalLeft ?? s.kcal, de: de)).font(.system(size: 28, weight: .bold)).foregroundStyle(Brand.text).monospacedDigit()
                        Text(s.kcalTarget == nil ? "kcal" : L.t(de, "kcal left", "kcal übrig")).font(.system(size: 11, weight: .medium)).foregroundStyle(Brand.text2)
                    }
                    Bar(progress: s.kcalProgress, color: Brand.kcal)
                    MetricRow(label: "Protein", value: s.proteinTarget.map { "\(s.protein) / \($0) g" } ?? "\(s.protein) g",
                              progress: s.proteinProgress, color: Brand.protein)
                    if let left = s.weekLeftToday, let days = s.weekDaysLeft {
                        Text(L.t(de, "Week: \(fmtInt(left, de: de)) kcal today · \(days) d left", "Woche: heute \(fmtInt(left, de: de)) kcal · \(days) T übrig"))
                            .font(.system(size: 10)).foregroundStyle(Brand.text2).lineLimit(1)
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    MetricRow(label: L.t(de, "Water", "Wasser"),
                              value: String(format: "%.2g / %.2g l", Double(s.waterMl) / 1000, Double(s.waterGoalMl) / 1000),
                              progress: s.waterProgress, color: Brand.water)
                    if #available(iOS 17.0, *) {
                        HStack(spacing: 6) {
                            WaterButton(ml: 250, de: de)
                            WaterButton(ml: 500, de: de)
                        }
                    }
                    Spacer(minLength: 0)
                    HStack(spacing: 4) {
                        Text("BS").font(.system(size: 11, weight: .bold)).foregroundStyle(Brand.gold)
                        Text("Serious Nutrition").font(.system(size: 10, weight: .medium)).foregroundStyle(Brand.text2)
                    }
                }
                .frame(width: 118)
            }
        }
    }
}

@available(iOS 17.0, *)
struct WaterButton: View {
    let ml: Int
    let de: Bool
    var body: some View {
        Button(intent: AddWaterIntent(ml: ml)) {
            Text("+\(ml)")
                .font(.system(size: 12, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
                .background(Brand.water.opacity(0.18))
                .foregroundStyle(Brand.water)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Sperrbildschirm

struct CircularView: View {
    let e: Entry
    var s: Snapshot { e.snap }
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Gauge(value: s.kcalProgress) {
                Text("kcal")
            } currentValueLabel: {
                Text(compact(s.kcalLeft ?? s.kcal)).font(.system(size: 13, weight: .bold)).monospacedDigit()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        }
    }
    func compact(_ n: Int) -> String { n >= 10000 ? "\(n / 1000)k" : n >= 1000 ? String(format: "%.1fk", Double(n) / 1000) : "\(n)" }
}

struct RectangularView: View {
    let e: Entry
    var s: Snapshot { e.snap }
    var de: Bool { s.isGerman }
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Text("BS").font(.system(size: 11, weight: .bold))
                Text("Serious Nutrition").font(.system(size: 11, weight: .semibold))
            }
            .widgetAccentable()
            Text("\(fmtInt(s.kcalLeft ?? s.kcal, de: de)) " + (s.kcalTarget == nil ? "kcal" : L.t(de, "kcal left", "kcal übrig")))
                .font(.system(size: 14, weight: .bold)).monospacedDigit()
            Text(s.proteinLeft.map { "\($0) g " + L.t(de, "protein left", "Protein übrig") } ?? "\(s.protein) g Protein")
                .font(.system(size: 11)).foregroundStyle(.secondary)
            Gauge(value: s.kcalProgress) { EmptyView() }.gaugeStyle(.accessoryLinearCapacity)
        }
    }
}

struct InlineView: View {
    let e: Entry
    var s: Snapshot { e.snap }
    var de: Bool { s.isGerman }
    var body: some View {
        Text("BS " + fmtInt(s.kcalLeft ?? s.kcal, de: de) + " " + (s.kcalTarget == nil ? "kcal" : L.t(de, "kcal left", "kcal übrig")) + (s.proteinLeft.map { " · \($0) g P" } ?? ""))
    }
}

// MARK: - Widgets

struct TodayWidget: Widget {
    let kind = "TodayWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            FamilySwitch(entry: entry)
                .modifier(HomeBackground())
                .widgetURL(URL(string: "seriousnutrition://diary"))
        }
        .configurationDisplayName("Today")
        .description("Calories, protein and water left today.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

struct HomeBackground: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(Brand.bg, for: .widget)
        } else {
            content.background(Brand.bg)
        }
    }
}

/// Wählt die Ansicht nach Widget-Grösse (Environment ist nur in Views verfügbar).
struct FamilySwitch: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        Group {
            switch family {
            case .systemMedium: MediumView(e: entry)
            default: SmallView(e: entry)
            }
        }
        .padding(14)
    }
}

struct LockWidget: Widget {
    let kind = "LockWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LockSwitch(entry: entry)
                .widgetURL(URL(string: "seriousnutrition://diary"))
        }
        .configurationDisplayName("Calories left")
        .description("Calories and protein left today, on the Lock Screen.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct LockSwitch: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        Group {
            if !entry.hasData {
                switch family {
                case .accessoryCircular: ZStack { AccessoryWidgetBackground(); Text("BS").font(.system(size: 14, weight: .bold)) }
                case .accessoryRectangular: Text(L.t(entry.snap.isGerman, "Open Serious Nutrition once", "Serious Nutrition einmal öffnen")).font(.system(size: 12))
                default: Text("BS · " + L.t(entry.snap.isGerman, "open the app", "App öffnen"))
                }
            } else {
                switch family {
                case .accessoryCircular: CircularView(e: entry)
                case .accessoryRectangular: RectangularView(e: entry)
                default: InlineView(e: entry)
                }
            }
        }
        .modifier(AccessoryBackground())
    }
}

struct AccessoryBackground: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(for: .widget) { Color.clear }
        } else {
            content
        }
    }
}

@main
struct SeriousWidgetsBundle: WidgetBundle {
    var body: some Widget {
        TodayWidget()
        LockWidget()
    }
}
