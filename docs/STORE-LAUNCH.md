# Store-Launch: Serious Nutrition

Stand: 19.09.2026 (App-Version 0.8.1). Plan für die Veröffentlichung im App Store und bei Google Play.

## 1. Name: „Serious Nutrition“

**Bewertung: guter Name, mit einer Pflichtprüfung.**

Für den Namen spricht:
- Passt zur bestehenden Marke (be_s3rious) – Wiedererkennung über Kanal, Coaching und App.
- Englisch, international verständlich, gut aussprechbar, zwei Wörter, keine Sonderzeichen.
- Positionierung stimmt: „ernsthaft“ statt Lifestyle – Athleten, Wettkampfvorbereitung, Coaching.
- App Store (CH/US): kein Treffer für „Serious Nutrition“ (Stand 19.09.2026); die Konkurrenz heisst
  Lifesum, Lose It!, Foodnoms, Fooducate – kein Namenskonflikt.

Zu prüfen, bevor Geld in Marke/Assets fliesst:
- **Markenregister:** In den USA existiert die Supplement-Marke „Serious Nutrition Solutions“ (SNS), ausserdem
  „Serious Mass“ (Optimum Nutrition). Beides Nahrungsergänzung, nicht Software – aber Klasse 9/42 (Apps)
  sollte in Swissreg, EUIPO und USPTO gegengeprüft werden. Kostenlos, 30 Minuten.
- **Store-Untertitel** nutzen, damit die Suche greift: „Serious Nutrition – Calorie & Macro Tracker“.
- **Domain/Handle:** seriousnutrition.app o.ä. und Social-Handles reservieren.
- **Bundle-ID** festlegen (z.B. `ch.beserious.nutrition`) – lässt sich später nicht ändern.

Kleines Risiko: Der Name ist beschreibend; ein Markenschutz ist schwerer als bei einem Kunstwort.
Für den Launch ist das unkritisch, für den Schutz gegen Nachahmer ein Wort-Bild-Marke (Logo) sinnvoll.

## 2. Preismodell

**Empfehlung: Freemium + einmaliger „Pro“-Kauf. Abo erst mit Cloud/Coach-Funktionen.**

| | Einmalzahlung | Abo |
|---|---|---|
| Passt zu | App ohne laufende Kosten (heute: alles lokal) | Sync, Accounts, Coach-Ansicht, laufende Datenpflege |
| Store-Abgabe | 15 % (Small Business Program bis 1 Mio. $/Jahr) | 30 % im 1. Jahr, danach 15 % |
| Nutzersicht | „Kein Abo“ ist ein Verkaufsargument in einer abo-müden Kategorie | Höherer Lebenszeitwert, aber Kündigungsdruck; Paywalls auf Basisfunktionen kosten Bewertungen |
| Aufwand | Ein Produkt, Kauf wiederherstellen | Trial, Preisstufen, Kündigungs-Flows, Grace Periods |

Schnitt:
- **Free:** Tagebuch, Barcode-Scan, Textsuche, Wasser, Ziele/Phasen, Wochenübersicht mit Fazit.
- **Pro (einmalig, ca. CHF 15–25):** Wochenbudget, Vorlagen und Kopieren, Portionsgrössen und
  Schnellwahl, Gewichtstrend, Backup/Export, Apple Health/Health Connect (sobald nativ).
- **Coach (Abo, später):** Cloud-Sync über Geräte, Coach sieht Wochen und Gewicht seiner Athleten,
  Kommentare. Alternativ B2B: Coach zahlt pro Athlet, Athleten nutzen die App kostenlos.

Regel: Nie etwas hinter die Paywall legen, was der Nutzer in den ersten fünf Minuten braucht.

## 3. Was fehlt – Checkliste

### A. Technik
- [x] **Capacitor-Hülle** (0.9.0) – iOS + Android, ML-Kit-Scanner, Share/Filesystem, Haptics, StatusBar,
      SplashScreen, Zurück-Taste. Siehe `docs/NATIVE.md`. Offen: erster Build braucht Xcode/Android Studio auf dem Mac.
- [x] **Bundle-ID `ch.beserious.nutrition`, Icons, Splash** für beide Plattformen erzeugt (`assets/`).
- [x] **Onboarding** (0.10.0): Sprache → Körperdaten (Mifflin-St Jeor, Aktivität, Phase, Trainingstage) →
      editierbarer Zielvorschlag → legt Phase, Gewicht, Trainingstage und Wasserziel an. Überspringbar.
- [x] **Backup automatisch** (0.10.0, nativ): täglich in den Dokumente-Ordner (Dateien-App → „Serious Nutrition
      Backups“, 7 Stände), wird vom iCloud-/Google-Geräte-Backup mitgesichert; zusätzlich sichern beide Systeme
      die App-Daten selbst (iOS App-Container, Android Auto Backup). Offen: echter Cloud-Sync über Geräte (B2).
- [ ] **Käufe**: RevenueCat (`@revenuecat/purchases-capacitor`), Produkt `pro_lifetime`, Paywall-Screen,
      „Käufe wiederherstellen“, Entitlement-Prüfung im Code (Feature-Flags).
- [ ] **Absturz-Reporting** (Sentry) und datensparsame Nutzungsstatistik, Opt-in.
- [ ] **iPad**: Layout prüfen oder Ziel auf iPhone beschränken.
- [ ] **Play-Store-Anforderungen**: aktuelles Target-API-Level, 64-Bit, App Bundle (.aab).

### B. Konten
- [ ] Apple Developer Program (99 $/Jahr; Freigabe dauert 1–2 Tage).
- [ ] Google Play Console (25 $ einmalig). **Neue private Konten: geschlossener Test mit 12 Testern über
      14 Tage vor der Veröffentlichung** – früh starten.
- [ ] RevenueCat-Konto, Produkte in App Store Connect und Play Console anlegen.

### C. Recht
- [ ] Datenschutzerklärung (öffentliche URL, DE + EN). Heute wahr: keine Datenerhebung, alles lokal,
      OFF-Abfragen nur mit Barcode/Suchbegriff. Mit Sync ändert sich das.
- [ ] Nutzungsbedingungen, Impressum (CH).
- [ ] Apple „App Privacy“ und Google „Data safety“ ausfüllen.
- [ ] Keine medizinischen Aussagen; Gewicht/Ernährung als Tracking, nicht als Therapie beschreiben.
- [ ] Open-Food-Facts-Nennung (ODbL) – vorhanden, im Store-Text erwähnen.
- [ ] Export-Compliance: nur HTTPS → befreit (in App Store Connect angeben).

### D. Store-Einträge
- [ ] Name, Untertitel, Keywords, Beschreibung (DE/EN), Kategorie „Gesundheit & Fitness“.
- [ ] Screenshots: iPhone 6,7" und 6,5"; Android Phone; je 5–6 Bilder mit kurzen Titeln.
- [ ] Support-URL, Marketing-URL, Alterseinstufung (4+ / Everyone).
- [ ] Testkonto/Anleitung für den Review (nicht nötig, solange kein Login).

### E. Qualität vor Launch
- [ ] TestFlight-Beta mit 10–20 Personen (Coaching-Klienten), 2 Wochen.
- [ ] Android Closed Testing parallel (Pflicht, siehe oben).
- [ ] E2E-Tests bleiben grün (laufen in CI); manueller Check der nativen Teile (Scanner, Share, Kauf).

## 4. Reihenfolge – womit starten

Die Kalenderzeit wird von Freigaben und Testpflichten bestimmt, nicht vom Code. Deshalb zuerst das, was wartet:

1. **Sofort (1 Stunde, blockt alles andere):** Markencheck „Serious Nutrition“, Bundle-ID festlegen,
   Apple Developer Program und Google Play Console beantragen, Domain/Handles sichern.
2. **Woche 1 – Capacitor (B1):** native Hülle, ML-Kit-Scanner, Share/Files, Icons/Splash. Ergebnis:
   erste TestFlight-Version auf deinem iPhone. Löst nebenbei das Kamera-Prompt-Problem.
3. **Woche 1–2 – Android Closed Testing starten:** sobald die Hülle läuft, 12 Tester einladen, damit die
   14 Tage laufen, während der Rest entsteht.
4. **Woche 2 – Onboarding + Cloud-Backup.** Ohne das gibt es Support-Anfragen beim ersten Handywechsel.
5. **Woche 3 – Pro-Kauf mit RevenueCat, Paywall, Feature-Flags.**
6. **Woche 3 – Rechtstexte, Store-Einträge, Screenshots.** Datenschutz kann parallel von einer Vorlage
   (z.B. iubenda, Datenschutz-Generator) ausgehen.
7. **Woche 4 – TestFlight-Beta, Feedback einarbeiten, Review einreichen.** Apple-Review 1–3 Tage,
   Ablehnungen sind normal (meist Datenschutz-Angaben oder Screenshots).

Aufwand gesamt: rund 10–12 Arbeitstage Entwicklung plus 3–4 Wochen Kalenderzeit.

Die PWA bleibt parallel online: kostenlose Web-Version ohne Store-Abgabe, Einstieg für Interessierte
und Fallback, falls ein Store-Review hängt.
