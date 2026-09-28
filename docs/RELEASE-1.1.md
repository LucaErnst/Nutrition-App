# Checkliste: Version 1.1 veröffentlichen

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

## 1. Vor dem Hochladen (mache ich)

- [ ] `npm test` und `npm run e2e` grün, `npm run build` ohne Fehler
- [ ] `package.json` auf `1.1.0` (steht sonst unter „Mehr" eine andere Zahl als im Store) – erledigt
- [ ] Screenshots neu erzeugen, falls sich seit Build 18 etwas am Aussehen geändert hat:
      `npm run screenshots` → `store/screenshots/{de,en}`, je sechs Bilder, 1290×2796
- [ ] Web-Version pushen (aktuell 22 Commits lokal): aktualisiert Rechtstexte und die Android-Web-App
      auf https://lucaernst.github.io/Nutrition-App/ – die Links im Store zeigen dorthin
- [ ] Archiv bauen und hochladen (`docs/NATIVE.md`), Build-Nummer hochzählen
- [ ] Commit mit der finalen Build-Nummer

## 2. In App Store Connect (Version 1.1 anlegen)

- [ ] „+ Version or Platform" → **1.1**
- [ ] **Beschreibung DE und EN ersetzen** ← das hier wird am leichtesten vergessen
- [ ] **„Neu in dieser Version" DE und EN** einfügen
- [ ] **Screenshots ersetzen**, beide Sprachen, sechs Bilder je Sprache
- [ ] Keywords aktualisieren (`nutrition` raus, `offline` rein – die alte Zeile war über dem Limit)
- [ ] Werbetext aktualisieren
- [ ] Untertitel prüfen (unverändert)
- [ ] Build auswählen (der zuletzt hochgeladene)
- [ ] **In-App-Kauf `pro_lifetime` mit der Version einreichen** – im Abschnitt „In-App Purchases and
      Subscriptions" der Version hinzufügen. Er liegt als „Item Ready to Submit" bereit. Ohne diesen
      Schritt geht die Version durch und der Kauf bleibt liegen: Käufer sehen dann „Store nicht
      erreichbar".
- [ ] Review-Notizen aus `docs/APP-REVIEW-NOTES.md` (Abschnitt 1.1) einsetzen – in 1.0 stand dort
      „no paid content in this version", das stimmt jetzt nicht mehr
- [ ] App Privacy prüfen: weiterhin „Data Not Collected"
- [ ] Export-Compliance: nur HTTPS, `ITSAppUsesNonExemptEncryption = false` ist gesetzt
- [ ] Altersfreigabe unverändert (4+)
- [ ] **Freigabe auf „manuell" stellen** („Manually release this version"). Sonst geht die Version in
      der Nacht nach der Freigabe live, und der Launch-Tag aus `marketing/LAUNCH-1.1.md` passt nicht
      mehr dazu.
- [ ] Einreichen

## 3. Preis setzen – nach Apples Freigabe, vor der Veröffentlichung

Der Kauf geht mit **CHF 15.00** in die Review; während der Review nichts am Preis ändern.
Regulär ist **CHF 25.00**, die 15 sind der Einführungspreis. Weil die Version manuell
freigegeben wird, gibt es dafür ein ruhiges Zeitfenster zwischen Apples Freigabe und deinem
Launch-Tag.

- [ ] In App Store Connect → In-App-Käufe → `pro_lifetime` → **Basispreis auf CHF 25.00**
- [ ] **Geplante Preisänderung** anlegen: CHF 15.00, Start = Launch-Tag, **Ende = 30.11.2026**.
      Danach stellt Apple von selbst auf 25 zurück – so kann die Erhöhung nicht vergessen gehen.
      (Falls sich kein Enddatum setzen lässt: Termin am 30.11. im Kalender, Preis von Hand.)
- [ ] Verschiebt sich der Launch auf November, das Enddatum auf den 31.12.2026 legen –
      die Launch-Phase soll rund sechs Wochen dauern, nicht zwei
- [ ] Preisänderungen brauchen **keine neue Version und keine Review**
- [ ] Nichts im Code oder in der Beschreibung anpassen: die Paywall zeigt den Preis direkt
      aus dem Store, die Store-Texte nennen bewusst keine Zahl
- [ ] Am 30.11. den Werbetext zurücksetzen (er nennt den Einführungspreis, siehe
      `store/LISTING.md`) – der Werbetext ist jederzeit änderbar, ohne neue Version

## 4. Nach der Freigabe durch Apple

- [ ] Version manuell freigeben – am gewählten Launch-Tag, morgens
- [ ] Store-Seite in beiden Sprachen anschauen: Screenshots, Beschreibung, Preis des Kaufs
- [ ] Kauf einmal mit einem echten Konto testen (Sandbox verhält sich anders als der Live-Store)
      und dabei prüfen, dass die Paywall den Einführungspreis zeigt. Das Geld geht wirklich weg;
      über „Probleme melden" liesse es sich zurückholen.
- [ ] Auf einem Gerät prüfen, das die App vor 1.1 hatte: Pro muss geschenkt sein
      (Mehr → Serious Nutrition Pro zeigt die goldene Karte)
- [ ] Marketing-Tag starten (`marketing/LAUNCH-1.1.md`): TikTok, Instagram, Bio-Link auf die Store-Seite
- [ ] Bewertungs-Abfrage im Auge behalten – sie erscheint erst im Live-Store, nie in TestFlight

## 5. Offen, aber kein Hindernis für 1.1

- Wasserziel ist für US/UK-Nutzer weiter nur in ml/l einstellbar (der Rest der App rechnet um)
- BLV-Anfrage für die Schweizer Nährwertdatenbank liegt fertig in `docs/BLV-ANFRAGE.md` – seit der
  BLS-Tabelle nicht mehr nötig, aber Schweizer Werte wären ein schönes Extra für 1.2
- Android: Play Console braucht 12 Tester über 14 Tage, bevor dort etwas veröffentlicht werden kann
