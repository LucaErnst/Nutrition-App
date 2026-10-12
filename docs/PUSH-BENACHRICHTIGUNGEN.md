# Push aufs iPhone bei Käufen und Downloads

Angelegt am 12.10.2026. Noch nicht gebaut. Eigenes kleines Projekt neben der App, z. B.
`~/Downloads/serious-nutrition-push/`. Die App selbst ändert sich nicht: kein Build, keine Review.

## Ziel

1. **Pro-Kauf in Echtzeit:** „Pro gekauft · CHF 15 · Schweiz", Sekunden nach dem Kauf.
2. **Tagesbericht jeden Morgen:** „Gestern: 23 Downloads, 2× Pro, CHF 30".

## Bausteine

| Teil | Wie |
|---|---|
| Server | Cloudflare Worker (gratis), ein Worker für beides |
| Push aufs iPhone | ntfy (App gratis), Topic mit zufälligem, langem Namen |
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
- ntfy-App aufs iPhone, Topic abonnieren
- Secrets setzen: `ASC_PRIVATE_KEY`, `NTFY_TOPIC`
- Nach dem Deploy die Worker-URL in App Store Connect eintragen: App-Informationen →
  App Store Server Notifications → Production Server URL (Version 2)

## Vorher prüfen

- App Privacy „Data Not Collected": Kauf-Meldungen kommen von Apple an Lucas Server, nicht aus der App.
  Der Worker speichert nichts und gibt keine Kennungen weiter. Vor dem Scharfschalten trotzdem gegen
  Apples Richtlinien für Datenschutz-Labels prüfen.
- Testen mit „Request a Test Notification" der App Store Server API, bevor die echte URL eingetragen wird.
