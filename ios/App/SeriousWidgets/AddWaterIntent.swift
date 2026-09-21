import AppIntents
import WidgetKit

/// +250 ml direkt aus dem Widget (iOS 17+). Schreibt in den App-Group-Speicher; die App übernimmt
/// den Eintrag beim nächsten Start/Vordergrund in ihre Datenbank.
@available(iOS 17.0, *)
struct AddWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Add water"
    static var description = IntentDescription("Logs 250 ml of water in Serious Nutrition.")

    @Parameter(title: "Millilitres", default: 250)
    var ml: Int

    init() {}
    init(ml: Int) { self.ml = ml }

    func perform() async throws -> some IntentResult {
        Snapshot.addPendingWater(ml)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
