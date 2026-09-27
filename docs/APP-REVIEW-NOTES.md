# App Review – Antwort auf Guideline 2.1 (Information Needed), 21.09.2026

Text, der als Antwort im Resolution Center gesendet und in die Review-Notizen übernommen wurde.

---

Thank you for reviewing Serious Nutrition. Attached is a screen recording (3:20) captured on an iPhone 15 Pro Max running the current iOS, from app launch through the typical flow: onboarding, adding a food via search, barcode scanning (including the camera permission prompt), water tracking, week overview, weight log, food database, settings (language, reminders, backup export/import).

1. SCREEN RECORDING – see attachment. The app has no accounts, no registration, no login and no account deletion (there is nothing to delete server-side; all data lives in the app's local storage and is removed by deleting the app). There is no user-generated content shared with other users, and no paid content in this version.

2. PURPOSE AND TARGET AUDIENCE – Serious Nutrition is a calorie and macronutrient diary for people who train with a goal (muscle gain, fat loss, maintenance), built by a calisthenics coach for his athletes. It solves the problem that generic trackers focus on a single daily calorie number: here targets differ between training and rest days, protein is a minimum, fat is a range, and the week is treated as a budget so one day over target does not break the plan. The value is fast logging (barcode, templates, quick portions), a weekly view with a plain-language summary, and a 7-day weight trend – with no account, no ads and no data leaving the device.

3. SETUP AND MAIN FEATURES – No login or sample files are needed.
   - First launch: onboarding asks for body data and suggests targets; "Skip" is available and targets can be set later under More → Phases.
   - Diary tab: tap "+ Add" on a meal → Search (built-in foods, favorites), Scan (barcode), Templates, or Manual (enter values). Amounts are adjusted with a stepper or quick-portion chips. Water is logged with +250 / +500 ml.
   - Week tab: weekly average, weekly budget, conclusion, per-day bars.
   - Weight tab: enter a weight; chart with 7-day moving average.
   - Foods tab: your own food database (edit, favorite, portions).
   - More tab: language (English/German), water goal, reminders (local notifications, optional), phases/targets, backup export/import (JSON file via the share sheet), legal links.
   - To test the scanner, any retail product barcode works (e.g. a supermarket item). Unknown barcodes show a "not found" message with a manual-entry fallback.

4. EXTERNAL SERVICES – One: Open Food Facts (openfoodfacts.org), a public, non-commercial product database, queried over HTTPS only when the user scans a barcode or searches online. No authentication, payment, analytics, advertising, AI or crash-reporting services are used. There is no backend of our own.

5. REGIONAL DIFFERENCES – None. The app functions identically in all regions. The only locale-dependent behaviour is number/date formatting and the UI language (English default, German optional).

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL – The app is not a medical device and gives no medical advice (stated in the description); it is a diary/calculator. Product data from Open Food Facts is licensed under the Open Database License (ODbL) and is attributed in the app and in the App Store description ("Product data © Open Food Facts contributors (ODbL)"). No other third-party material is included.

Developer: Luca Ernst, Basel, Switzerland – beseriouscalisthenics@gmail.com

---

# Ergänzung für Version 1.1

Diese Punkte in die Review-Notizen der Version 1.1 übernehmen. Was sich gegenüber 1.0 geändert hat,
steht zuerst – in 1.0 hiess es „no paid content in this version", und das gilt nicht mehr.

IN-APP PURCHASE – This version submits one non-consumable in-app purchase, "Serious Nutrition Pro"
(`pro_lifetime`, CHF 15.00). It is a one-time unlock, not a subscription, and there is no trial.
Purchasing requires no account: the receipt is validated through StoreKit (via RevenueCat) and the
unlock is stored on the device. "Restore purchases" is on the paywall and under More → Serious
Nutrition Pro. Free features remain free: diary, barcode scanning, search, water, targets and phases,
week overview with the weekly budget, reminders, and backup export/import – a user's own data is never
behind the purchase. Pro unlocks templates, portion sizes, the weight chart, widgets and Apple Health.
To reach the paywall without buying: More → Serious Nutrition Pro, or tap any locked feature, e.g.
Diary → a meal's "…" menu → "Save as template".

EARLY ADOPTERS – Users who already had the app before this update keep all Pro features for free. On
first launch after the update the app checks for existing local data (settings, targets, diary
entries, weights, own foods) and grants the unlock. A reviewer installing the app fresh will
therefore see the paywall, which is the intended behaviour.

OFFLINE FOOD TABLE – 1.1 bundles about 6,400 basic foods (names plus energy, protein, fat and
carbohydrates per 100 g) inside the app, so search works without a network connection. Source: the
German Nutrient Database (Bundeslebensmittelschlüssel 4.0) published by the Max Rubner-Institut under
CC BY 4.0. Attribution is shown in the app under More and in the App Store description. This is
bundled data, not a service – no request is made to obtain it.

LANGUAGE – The app now starts in the device language (English or German) instead of defaulting to
English; the food names in the bundled table follow that language. It can still be changed under
More → Language.

EXTERNAL SERVICES – Unchanged: Open Food Facts (openfoodfacts.org) over HTTPS for barcode lookups and
online product search, plus Apple's StoreKit for the purchase. No accounts, no analytics, no ads, no
backend of our own.
