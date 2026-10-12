# Push aufs iPhone bei Käufen und Downloads

Angelegt am 12.10.2026. **Gebaut und deployt am 12.10.2026.** Eigenes Projekt neben der App:
`~/Downloads/serious-nutrition-push/` (eigenes Git, Anleitung im README). Die App selbst ändert sich
nicht: kein Build, keine Review.

## Stand 12.10.2026: läuft

- Worker: `https://serious-nutrition-push.serious-nutrition-push.workers.dev/apple`
  (Cloudflare-Konto beseriouscalisthenics@gmail.com, Gratis-Plan). Vendor Number 94868361.
- Kette getestet mit Apples Test-Notification: Apple → RevenueCat (Production- und Sandbox-URL in
  App Store Connect) → Forwarding-URL in RevenueCat → Worker (Signatur geprüft) → Telegram. ✅
- Tagesbericht gegen echte Berichte geprüft (11.9.–10.10.: 6 Downloads, alle Typ `1`). Apple setzt
  „Parent Identifier“ bei Downloads auf ein Leerzeichen, darum wird nach Produkttyp gezählt.
  Um 08:07 Zürich ist der neueste Bericht von vorgestern (Pacific Time); der Push nennt das Datum.
- Secrets: `ASC_PRIVATE_KEY`, `VENDOR_NUMBER`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  (`NTFY_TOPIC`/`NTFY_TOKEN` sind Überbleibsel, ungenutzt).
- **ntfy.sh verworfen:** Gratis-Limit (250/Tag) gilt pro IP, auch mit Konto; Cloudflare-IPs sind
  geteilt und ausgeschöpft (429 „daily message quota reached“), Verbindungen hängen zeitweise.
- **Testkauf in TestFlight löst keine Meldung aus:** Das Sandbox-Konto hat `pro_lifetime` schon am
  24.09. gekauft, ein erneuter Kauf stellt nur wieder her. Test stattdessen:
  `npm run test:notification -- ~/Downloads/SubscriptionKey_86T3ZCT49W.p8` (In-App-Purchase-Key).
- Ein echter Kauf ist noch nicht durchgelaufen; die Kauf-Nachricht ist per Unit-Test abgedeckt.

## Bausteine

| Teil | Wie |
|---|---|
| Server | Cloudflare Worker (gratis), ein Worker für beides |
| Push aufs iPhone | Telegram-Bot @seriousnutrition_push_bot (ntfy.sh verworfen, siehe unten) |
| Kauf-Meldung | App Store Server Notifications V2 an `POST /apple`. Signatur (JWS, x5c-Kette bis Apple Root CA G3) im Worker prüfen, dann nur Land, Preis, Zeit, Typ an ntfy |
| Tagesbericht | Cron-Trigger im Worker, ca. 08:07. App Store Connect API, Sales Report DAILY, Vortag. JWT ES256 mit dem `.p8`-Schlüssel |

## Zugangsdaten

- API-Zugang ist freigeschaltet (geprüft 12.10.2026).
- **Key ID:** `2UC7ZGV8FL` (Team Key, Rolle Sales)
- **Issuer ID:** `9af284dd-62f4-40bf-8bb1-790a9f181a91`
- Vendor Number: steht in App Store Connect unter „Payments and Financial Reports". Wird für den Sales
  Report gebraucht. Noch eintragen.
- **Die `.p8`-Datei bleibt bei Luca.** Er trägt sie selbst als Worker-Secret ein
  (`wrangler secret put ASC_PRIVATE_KEY`). Nie ins Repo, nie in den Chat.

## Was Luca selbst machen muss

- Cloudflare-Konto anlegen (falls keins da) und `npx wrangler login` bestätigen
- Nach dem Deploy `<Worker-URL>/apple` in RevenueCat als Forwarding-URL eintragen (nicht direkt in
  App Store Connect, sonst verliert RevenueCat die Meldungen)

## Vorher prüfen

- App Privacy „Data Not Collected": Kauf-Meldungen kommen von Apple an Lucas Server, nicht aus der App.
  Der Worker speichert nichts und gibt keine Kennungen weiter. Vor dem Scharfschalten trotzdem gegen
  Apples Richtlinien für Datenschutz-Labels prüfen.
- Testen mit „Request a Test Notification" der App Store Server API, bevor die echte URL eingetragen wird.
