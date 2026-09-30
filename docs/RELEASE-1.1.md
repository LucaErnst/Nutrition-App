# Checkliste: Version 1.1 veröffentlichen

**Eingereicht am 30.09.2026** – Version 1.1 (Build 22) und der In-App-Kauf `pro_lifetime`
zusammen in einer Einreichung, Status „Waiting for Review". **Freigabetermin: Montag,
12.10.2026, 11:00 CEST**, automatisch nach Apples Freigabe. Einführungspreis CHF 15.00 vom 12.10.2026 bis 31.01.2027, danach CHF 25.00 –
der Januar ist der stärkste Monat für Ernährungs-Apps und soll zum tiefen Preis laufen.

Diese Liste existiert, damit beim Go nichts vergessen geht. Vieles davon lässt sich **nur zusammen
mit einer neuen Version** ändern (Beschreibung, Screenshots, „Neu in dieser Version") – wird es
vergessen, steht es bis zur 1.2 falsch im Store.

Alle Texte liegen fertig in `store/LISTING.md`. Reihenfolge unten ist die Reihenfolge am Tag X.

## Was nur mit einer neuen Version geht (darum zuerst)

| Feld | Ohne neue Version änderbar? |
|---|---|
| Beschreibung DE/EN | nein |
| Screenshots | nein |
| „Neu in dieser Version" | nein (gehört zur Version) |
| Name, Untertitel | nein |
| Keywords | nein |
| Werbetext (Promotional Text) | **ja**, jederzeit |
| Preis, Verfügbarkeit | ja |

## 1. Vor dem Hochladen (erledigt)

- [x] `npm test` und `npm run e2e` grün, `npm run build` ohne Fehler
- [x] `package.json` auf `1.1.0` (steht sonst unter „Mehr" eine andere Zahl als im Store) – erledigt
- [x] Screenshots neu erzeugen, falls sich seit Build 18 etwas am Aussehen geändert hat:
      `npm run screenshots` → `store/screenshots/{de,en}`, je sechs Bilder, 1290×2796
- [x] Web-Version pushen (aktuell 22 Commits lokal): aktualisiert Rechtstexte und die Android-Web-App
      auf https://lucaernst.github.io/Nutrition-App/ – die Links im Store zeigen dorthin
- [x] Archiv bauen und hochladen (`docs/NATIVE.md`), Build-Nummer hochzählen
- [x] Commit mit der finalen Build-Nummer

## 2. In App Store Connect (erledigt am 30.09.2026)

- [x] „+ Version or Platform" → **1.1**
- [x] **Beschreibung DE und EN ersetzen** ← das hier wird am leichtesten vergessen
- [x] **„Neu in dieser Version" DE und EN** einfügen
- [x] **Screenshots ersetzen**, beide Sprachen, sechs Bilder je Sprache
- [x] Keywords aktualisieren (`nutrition` raus, `offline` rein – die alte Zeile war über dem Limit)
- [x] Werbetext aktualisieren
- [x] Untertitel prüfen (unverändert)
- [x] Build auswählen (der zuletzt hochgeladene)
- [x] **In-App-Kauf `pro_lifetime` mit der Version einreichen** – im Abschnitt „In-App Purchases and
      Subscriptions" der Version hinzufügen. Er liegt als „Item Ready to Submit" bereit. Ohne diesen
      Schritt geht die Version durch und der Kauf bleibt liegen: Käufer sehen dann „Store nicht
      erreichbar".
- [x] Review-Notizen aus `docs/APP-REVIEW-NOTES.md` (Abschnitt 1.1) einsetzen – in 1.0 stand dort
      „no paid content in this version", das stimmt jetzt nicht mehr
- [x] App Privacy prüfen: weiterhin „Data Not Collected"
- [x] Export-Compliance: nur HTTPS, `ITSAppUsesNonExemptEncryption = false` ist gesetzt
- [x] Altersfreigabe unverändert (4+)
- [x] **Freigabe terminieren:** „Automatically release this version after App Review, **no earlier
      than**" → **12.10.2026**, morgens. Das Datum lässt sich bis zum Auslösen jederzeit ändern.
      Ohne diese Einstellung geht die Version in der Nacht nach Apples Freigabe live.
- [x] Einreichen

## 3. Preis setzen – nach Apples Freigabe, vor der Veröffentlichung

Der Kauf geht mit **CHF 15.00** in die Review; während der Review nichts am Preis ändern.
Regulär ist **CHF 25.00**, die 15 sind der Einführungspreis. Zwischen Apples Freigabe und dem
12.10.2026 bleibt dafür ein ruhiges Zeitfenster.

- [ ] In App Store Connect → In-App-Käufe → `pro_lifetime` → **Basispreis auf CHF 25.00**
- [ ] **Geplante Preisänderung** anlegen: CHF 15.00, Start = **12.10.2026**, **Ende = 31.01.2027**.
      Danach stellt Apple von selbst auf 25 zurück – so kann die Erhöhung nicht vergessen gehen.
      (Falls sich kein Enddatum setzen lässt: Termin am 31.01.2027 im Kalender, Preis von Hand.)
- [ ] Preisänderungen brauchen **keine neue Version und keine Review**
- [ ] Nichts im Code oder in der Beschreibung anpassen: die Paywall zeigt den Preis direkt
      aus dem Store, die Store-Texte nennen bewusst keine Zahl
- [ ] Am 31.01.2027 den Werbetext zurücksetzen (er nennt den Einführungspreis, siehe
      `store/LISTING.md`) – der Werbetext ist jederzeit änderbar, ohne neue Version

## 4. Nach der Freigabe durch Apple

- [ ] Am 12.10.2026 prüfen, dass die Version tatsächlich live gegangen ist
- [ ] Store-Seite in beiden Sprachen anschauen: Screenshots, Beschreibung, Preis des Kaufs
- [ ] Kauf einmal mit einem echten Konto testen (Sandbox verhält sich anders als der Live-Store)
      und dabei prüfen, dass die Paywall den Einführungspreis zeigt. Das Geld geht wirklich weg;
      über „Probleme melden" liesse es sich zurückholen.
- [ ] Auf einem Gerät prüfen, das die App vor 1.1 hatte: Pro muss geschenkt sein
      (Mehr → Serious Nutrition Pro zeigt die goldene Karte)
- [ ] Marketing-Tag starten (`marketing/LAUNCH-1.1.md`): TikTok, Instagram, Bio-Link auf die Store-Seite
- [ ] Bewertungs-Abfrage im Auge behalten – sie erscheint erst im Live-Store, nie in TestFlight

## 5. Offen, aber kein Hindernis für 1.1

- BLV-Anfrage für die Schweizer Nährwertdatenbank liegt fertig in `docs/BLV-ANFRAGE.md` – seit der
  BLS-Tabelle nicht mehr nötig, aber Schweizer Werte wären ein schönes Extra für 1.2
- Android: Play Console braucht 12 Tester über 14 Tage, bevor dort etwas veröffentlicht werden kann
