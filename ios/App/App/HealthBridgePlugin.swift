import Foundation
import Capacitor
import HealthKit

/// Apple Health: Nährwerte, Wasser und Gewicht schreiben; Gewicht und Aktivkalorien lesen.
/// Nährwerte werden pro Tag als Summe abgelegt (Samples der App für den Tag ersetzen).
@objc(HealthBridgePlugin)
public class HealthBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthBridgePlugin"
    public let jsName = "HealthBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeNutrition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeWater", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeWeight", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWeights", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readActiveEnergy", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    private var energy: HKQuantityType { HKQuantityType(.dietaryEnergyConsumed) }
    private var protein: HKQuantityType { HKQuantityType(.dietaryProtein) }
    private var fat: HKQuantityType { HKQuantityType(.dietaryFatTotal) }
    private var carbs: HKQuantityType { HKQuantityType(.dietaryCarbohydrates) }
    private var water: HKQuantityType { HKQuantityType(.dietaryWater) }
    private var mass: HKQuantityType { HKQuantityType(.bodyMass) }
    private var active: HKQuantityType { HKQuantityType(.activeEnergyBurned) }

    private static let day: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private func dayRange(_ iso: String) -> (Date, Date)? {
        guard let start = Self.day.date(from: iso) else { return nil }
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        return (start, end)
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["granted": false]); return }
        let write: Set<HKSampleType> = [energy, protein, fat, carbs, water, mass]
        let read: Set<HKObjectType> = [mass, active]
        store.requestAuthorization(toShare: write, read: read) { ok, err in
            if let err = err { call.reject(err.localizedDescription); return }
            // Schreibrecht ist abfragbar, Leserecht aus Datenschutzgründen nicht – wir melden das Schreibrecht.
            let granted = ok && self.store.authorizationStatus(for: self.mass) == .sharingAuthorized
            call.resolve(["granted": granted])
        }
    }

    /// Ersetzt die Tages-Summen der App (kcal, P, F, KH) für ein Datum.
    @objc func writeNutrition(_ call: CAPPluginCall) {
        guard let date = call.getString("date"), let (start, end) = dayRange(date) else { call.reject("date"); return }
        let values: [(HKQuantityType, HKUnit, Double)] = [
            (energy, .kilocalorie(), call.getDouble("kcal") ?? 0),
            (protein, .gram(), call.getDouble("protein") ?? 0),
            (fat, .gram(), call.getDouble("fat") ?? 0),
            (carbs, .gram(), call.getDouble("carbs") ?? 0),
        ]
        let group = DispatchGroup()
        var failure: Error?
        for (type, unit, value) in values {
            group.enter()
            deleteOwn(type: type, start: start, end: end) { [weak self] in
                guard let self = self, value > 0 else { group.leave(); return }
                // Sample in die Tagesmitte legen, damit es in Health eindeutig zum Tag gehört
                let at = start.addingTimeInterval(12 * 3600)
                let sample = HKQuantitySample(type: type, quantity: HKQuantity(unit: unit, doubleValue: value), start: at, end: at,
                                              metadata: [HKMetadataKeySyncIdentifier: "sn-\(type.identifier)-\(date)", HKMetadataKeySyncVersion: Int(Date().timeIntervalSince1970)])
                self.store.save(sample) { _, err in
                    if let err = err { failure = err }
                    group.leave()
                }
            }
        }
        group.notify(queue: .main) {
            if let f = failure { call.reject(f.localizedDescription) } else { call.resolve() }
        }
    }

    @objc func writeWater(_ call: CAPPluginCall) {
        guard let date = call.getString("date"), let (start, end) = dayRange(date) else { call.reject("date"); return }
        let ml = call.getDouble("ml") ?? 0
        deleteOwn(type: water, start: start, end: end) { [weak self] in
            guard let self = self, ml > 0 else { call.resolve(); return }
            let at = start.addingTimeInterval(12 * 3600)
            let sample = HKQuantitySample(type: self.water, quantity: HKQuantity(unit: .literUnit(with: .milli), doubleValue: ml), start: at, end: at,
                                          metadata: [HKMetadataKeySyncIdentifier: "sn-water-\(date)", HKMetadataKeySyncVersion: Int(Date().timeIntervalSince1970)])
            self.store.save(sample) { _, err in
                if let err = err { call.reject(err.localizedDescription) } else { call.resolve() }
            }
        }
    }

    @objc func writeWeight(_ call: CAPPluginCall) {
        guard let date = call.getString("date"), let (start, end) = dayRange(date), let kg = call.getDouble("kg") else { call.reject("args"); return }
        deleteOwn(type: mass, start: start, end: end) { [weak self] in
            guard let self = self else { return }
            let at = start.addingTimeInterval(8 * 3600)
            let sample = HKQuantitySample(type: self.mass, quantity: HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: kg), start: at, end: at,
                                          metadata: [HKMetadataKeySyncIdentifier: "sn-mass-\(date)", HKMetadataKeySyncVersion: Int(Date().timeIntervalSince1970)])
            self.store.save(sample) { _, err in
                if let err = err { call.reject(err.localizedDescription) } else { call.resolve() }
            }
        }
    }

    /// Gewichte anderer Quellen (Waage, Health-App) der letzten N Tage – pro Tag der letzte Wert.
    @objc func readWeights(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 90
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -days, to: Calendar.current.startOfDay(for: end))!
        let pred = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let q = HKSampleQuery(sampleType: mass, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, err in
            if let err = err { call.reject(err.localizedDescription); return }
            var byDay: [String: Double] = [:]
            for s in (samples as? [HKQuantitySample]) ?? [] {
                if s.sourceRevision.source.bundleIdentifier == Bundle.main.bundleIdentifier { continue }
                byDay[Self.day.string(from: s.startDate)] = s.quantity.doubleValue(for: .gramUnit(with: .kilo))
            }
            let items = byDay.keys.sorted().map { ["date": $0, "kg": byDay[$0]!] }
            call.resolve(["items": items])
        }
        store.execute(q)
    }

    /// Aktivkalorien (Apple Watch u.a.) für ein Datum, Summe.
    @objc func readActiveEnergy(_ call: CAPPluginCall) {
        guard let date = call.getString("date"), let (start, end) = dayRange(date) else { call.reject("date"); return }
        let pred = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let q = HKStatisticsQuery(quantityType: active, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, err in
            if let err = err { call.reject(err.localizedDescription); return }
            let kcal = stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
            call.resolve(["kcal": kcal])
        }
        store.execute(q)
    }

    /// Löscht die Samples, die diese App für den Zeitraum geschrieben hat.
    private func deleteOwn(type: HKQuantityType, start: Date, end: Date, done: @escaping () -> Void) {
        let range = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let own = HKQuery.predicateForObjects(from: HKSource.default())
        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [range, own])
        store.deleteObjects(of: type, predicate: pred) { _, _, _ in done() }
    }
}
