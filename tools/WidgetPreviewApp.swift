import SwiftUI

/// Zeigt die echten Widget-Ansichten in Originalgrösse. Die ganze App lässt sich im Simulator
/// nicht installieren (ML Kit liefert keine arm64-Simulator-Variante), die Widget-Quellen aber
/// schon – hier laufen sie unverändert, nur mit den Platzhalterwerten.
struct PreviewRoot: View {
    let entry = Entry(date: Date(), snap: .placeholder, hasData: true)
    var body: some View {
        VStack(spacing: 18) {
            // Zwei Medium-Grössen: kleine iPhones (329×155) und grosse (364×170).
            // Ein Layout mit festen Abständen sieht nur auf einer der beiden richtig aus.
            Text("Medium · 364×170").font(.caption).foregroundStyle(.white.opacity(0.5))
            MediumView(e: entry)
                .padding(14)
                .frame(width: 364, height: 170)
                .background(Brand.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            Text("Medium · 329×155").font(.caption).foregroundStyle(.white.opacity(0.5))
            MediumView(e: entry)
                .padding(14)
                .frame(width: 329, height: 155)
                .background(Brand.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            Text("Small").font(.caption).foregroundStyle(.white.opacity(0.5))
            SmallView(e: entry)
                .padding(14)
                .frame(width: 170, height: 170)
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
