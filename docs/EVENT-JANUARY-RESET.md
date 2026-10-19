# In-App-Event „January Reset“

Entschieden 19.10.2026 (Luca: „ja mach das event“). Ein Anlass, keine neue Funktion: im Januar drei
Wochen konsequent tracken. Erscheint als Karte auf der Produktseite, in der Suche und eventuell auf
„Heute“. Kostenlos.

**Einreichen bis ~17.12.2026** (Apple prüft wie eine Version). Anlegen und Befüllen kann Claude,
**Einreichen klickt Luca.** Kein Preis, kein „gratis“, kein „ohne Abo“ – weder im Text noch im Bild
(Ablehnung 1.2, Guideline 2.3.7).

## Eckdaten (App Store Connect → App → In-App-Events)

| Feld | Wert |
|---|---|
| Referenzname (intern) | January Reset 2027 |
| Badge | Challenge |
| Zweck | Für alle Nutzer geeignet (neue und bestehende) |
| Priorität | Normal |
| Veröffentlichung (sichtbar ab) | 18.12.2026 |
| Start | 01.01.2027, 00:00 (Ortszeit) |
| Ende | 21.01.2027, 23:59 (Ortszeit) |
| Länder | alle, in denen die App erhältlich ist |
| Deep Link | keiner (App öffnet im Tagebuch) |

## Texte

Grenzen: Name 30, Kurzbeschreibung 50, lange Beschreibung 120 Zeichen.

**Englisch (Hauptsprache)**
- Name: `January Reset: Track 21 Days` (28)
- Kurz: `Three weeks of honest tracking. Starts Jan 1.` (45)
- Lang: `Log every meal for 21 days and watch your weekly average settle. No account, your diary stays on your phone.` (108)

**Deutsch**
- Name: `Januar-Reset: 21 Tage tracken` (29)
- Kurz: `Drei Wochen ehrlich tracken. Start am 1. Januar.` (48)
- Lang: `21 Tage jede Mahlzeit eintragen und sehen, wie sich dein Wochenschnitt einpendelt. Kein Konto, alles bleibt lokal.` (113)

## Bilder

`node store/event-january-reset.mjs` → `store/event-january-reset/{en,de}/`
- `card.png` 1920 × 1080 (Eventkarte)
- `details.png` 1080 × 1920 (Detailseite)

Ohne Text, weil Apple Name und Kurzbeschreibung selbst darüberlegt: 21 Punkte (14 grün = mitten
in der Challenge) und das Tagebuch aus den Store-Bildern 1.3. **Erst nach Freigabe von 1.3
einreichen**, damit die Bilder den Look zeigen, den Nutzer auch bekommen. Ändert sich das Store-Bild
`01-diary.png`, Bilder neu erzeugen.

## Begleitend (Content-Plan 1.3)

Phase Januar in `marketing/CONTENT-PLAN-1.3.md`: Clips und Story „21 Tage“ auf den Event-Start
legen, Link-Sticker auf die Produktseite.

## Ablauf

1. [ ] Luca liest Texte und Bilder (dieses Dokument)
2. [ ] 1.3 ist live
3. [ ] Event in App Store Connect anlegen, Texte und Bilder DE/EN eintragen (Claude)
4. [ ] Einreichen bis 17.12. (Luca)
5. [ ] Nach Freigabe: Veröffentlichung 18.12. prüfen
