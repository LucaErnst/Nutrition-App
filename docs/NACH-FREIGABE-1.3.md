# Checkliste nach der Freigabe von 1.3

Erstellt 21.10.2026. **So benutzen:** Sobald Apple 1.3 annimmt, in einer Sitzung sagen:
*„1.3 ist angenommen – arbeite docs/NACH-FREIGABE-1.3.md ab.“* Claude geht die Punkte der Reihe
nach durch, hakt ab und fragt bei allem, was mit 🔒 markiert ist, vorher nach.

Legende: **C** = macht Claude · **L** = macht Luca · 🔒 = nur nach Lucas Ja (Push, Einreichen,
Löschen, Veröffentlichen).

---

## A. Sofort nach der Freigabe (vor dem 23.11.)

- [ ] **C** In App Store Connect prüfen: 1.3 steht auf „Pending Developer Release“ bzw. wartet auf
      den 23.11. 08:00, Build 42, Release-Art „Scheduled“. Falls der Termin weg ist: neu setzen.
- [ ] **C** Branch `release-1.3` in `main` zusammenführen (ohne Lucas Marketing-Dateien
      `marketing/launch-broll.mjs`, `marketing/launch/compose.mjs`, `marketing/instagram/APP-ACCOUNT.md`,
      `marketing/launch/talking/` – die bleiben, wie sie sind).
- [ ] **C** Auf `main`: `npm test`, `npx playwright test`, `npm run build` – alles grün.
- [ ] **C** `main` noch **nicht** pushen: Die Web-Version (GitHub Pages) bekäme den neuen Look sofort.
      Push erst am 23.11. (Teil B), damit Web und App gleichzeitig umstellen.
- [ ] **C** Launch-Inhalte prüfen: Reels `marketing/clips/1.3-*.mp4`, Storys und Karussells in
      `marketing/instagram/out-1.3/` zeigen den Stand von Build 42 (Quellen-Seite ist neu, sonst gleich).
      Bei Abweichung neu erzeugen (Befehle in `marketing/instagram/POSTING-1.3.md`).
- [ ] **L** Drehtag A erledigt? (Plan `marketing/DREHPLAN-1.3.md`, Ziel war Fr 30.10.)

## B. Am Release-Tag (Mo 23.11.)

- [ ] **C** Ab 08:00 prüfen: 1.3 ist im Store live (Status „Ready for Distribution“, Store-Seite
      zeigt Version 1.3, neue Bilder, Header „Built for training.“).
- [ ] 🔒 **C** `main` pushen (vorher fragen), danach Web-Version kurz öffnen und prüfen.
- [ ] **C** Eigene Produktseiten **TikTok** und **Instagram** auf 1.3 umstellen: neue Version der
      Seite anlegen, die 6 alten EN-iPhone-Bilder durch die 1.3-Bilder 01–06 ersetzen
      (`store/screenshots/en/`). 🔒 **L** reicht die Seiten ein.
- [ ] **L** Launch-Woche posten nach `marketing/instagram/POSTING-1.3.md` (Story 11:30 mit
      Link-Sticker, Reel 18:30 usw.).
- [ ] **C** Handoff auf „1.3 live“ setzen und committen.

## C. In der Woche danach (bis ca. 30.11.)

- [ ] 🔒 **L** Nach Freigabe der Produktseiten: alte `01-diary`-Bilder (mit „No subscription“) in der
      Asset Library löschen. Claude zeigt vorher, welche es sind.
- [ ] **C** Produktdaten neu erzeugen: `node tools/build-off-products.mjs` → neue
      `public/data/off-products.tsv.gz` (Stand 1.2 vom 15.10.). Für den nächsten Build, nicht für 1.3.
- [ ] **C** Pakete aktualisieren, auf eigenem Branch `deps-nach-1.3`:
  - zuerst nur kleine Updates (vite, react, react-dom, @capacitor/*, @revenuecat/purchases-capacitor,
    vitest, @playwright/test, oxlint) → Tests, Build, iOS-Simulator-Build
  - grosse Sprünge (TypeScript 7, vite-plugin-pwa 2, @types/node) einzeln und nur, wenn die Tests
    grün bleiben; sonst als Punkt in `docs/RELEASE-1.4.md`
  - `npm audit` erneut: `uuid` über `@capacitor/cli` (nur Build-Werkzeug) – mit dem Capacitor-Update
    meist erledigt
- [ ] **C** Wackeligen Test `e2e/units.spec.ts:31` („Gramm und Kilogramm“) ansehen und stabil machen.
- [ ] **C** Die 28 alten Lint-Warnungen durchgehen, einfache beheben.
- [ ] **C** Archiv aufräumen: alte Scratch-Archive (`App-3x.xcarchive`) sind nur temporär, nichts im Repo.

## D. Termine danach

| Wann | Wer | Was |
|---|---|---|
| bis Fr 04.12. | L | Drehtag B (Feiertage) |
| ab 1.3 live, bis **Do 17.12.** | C, 🔒 L | In-App-Event „January Reset“ anlegen: Texte und Bilder aus `docs/EVENT-JANUARY-RESET.md` (`store/event-january-reset/`), sichtbar ab 18.12., Start 01.01., Ende 21.01. Luca reicht ein. |
| ~21.12. (4 Wochen nach 1.3) | C | Keywords und Suchbegriffe in App Analytics prüfen, erst dann Keywords ändern |
| bis Mo 28.12. | L | Drehtag C (Januar) |
| bis Fr 29.01.2027 | C, 🔒 L | Preis ab 01.02.: CHF 25, **Deutschland und Österreich EUR 34.99** (eigener Preis). Luca klickt. |
| **So 31.01.2027** | C | Werbetext DE/EN zurücksetzen – er nennt den Einführungspreis (geht ohne neue Version) |
| sobald Xcode 27.1 final | C | `docs/RELEASE-1.4.md` A7: Duo im Simulator, Widgets, Build mit 27.1-SDK |

## E. Regeln, die dabei gelten

- Kein Preis, kein „gratis“, kein „ohne Abo“ in Bildern, Headern, Videos, Produktseiten (Ablehnung 1.2).
- Jede neue Zahl oder Empfehlung in der App braucht eine Quelle in `src/lib/sources.ts` (Ablehnung 1.3).
- Einreichen, Veröffentlichen, Löschen und Pushen macht oder bestätigt Luca.
- Nach jedem Schritt Handoff aktualisieren.
