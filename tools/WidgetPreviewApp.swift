import SwiftUI

/// Zeigt die echten Widget-Ansichten in Originalgrösse. Die ganze App lässt sich im Simulator
/// nicht installieren (ML Kit liefert keine arm64-Simulator-Variante), die Widget-Quellen aber
/// schon – hier laufen sie unverändert, nur mit den Platzhalterwerten.
struct PreviewRoot: View {
    let entry = Entry(date: Date(), snap: .placeholder, hasData: true)
    var body: some View {
        VStack(spacing: 18) {
            Text("Medium").font(.caption).foregroundStyle(.white.opacity(0.5))
            MediumView(e: entry)
                .padding(16)
                .frame(width: 338, height: 158)
                .background(Brand.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            Text("Small").font(.caption).foregroundStyle(.white.opacity(0.5))
            SmallView(e: entry)
                .padding(16)
                .frame(width: 158, height: 158)
                .background(Brand.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
    }
}

@main
struct PreviewApp: App {
    var body: some Scene {
        WindowGroup { PreviewRoot().preferredColorScheme(.dark) }
    }
}
