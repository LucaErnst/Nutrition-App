# Launch 1.3 – Posts, Storys, Reels

Erzeugt am 17.10.2026 aus Build 34 (Demo-Daten, Englisch, dunkel). Termin der Launch-Woche folgt
dem Store-Release von 1.3 (Phase 2 in `marketing/CONTENT-PLAN-1.3.md`). Kein Preis im Feed.

**Neu erzeugen:**
```
node marketing/demo-data.mjs
CLIPS_URL=http://localhost:5180/ node marketing/instagram/shots-1.3.mjs   # App-Aufnahmen n-*.png
SET=1.3 node marketing/instagram/build.mjs                               # → marketing/instagram/out-1.3/
CLIPS_URL=http://localhost:5180/ node marketing/clips-1.3.mjs             # → marketing/clips/1.3-*.mp4
```
Die Reels liegen nur lokal (`marketing/clips/` ist in `.gitignore`).

## Vorschlag Launch-Woche (Tag 1 = Tag, an dem 1.3 im Store ist)

| Tag | Zeit | Was | Datei |
|---|---|---|---|
| 1 | 11:30 | Story „Same app. New look.“ + **Link-Sticker** zum App Store | `out-1.3/story-s7-new-look.png` |
| 1 | 18:30 | Reel „Same app. New look.“ | `clips/1.3-tour.mp4` |
| 2 | 11:30 | Karussell G „New look“ (7) | `out-1.3/carousel-g-new-look-*.png` |
| 2 | 18:30 | Reel Ring | `clips/1.3-ring.mp4` |
| 3 | 18:00 | Story „Swipe“ | `out-1.3/story-s8-swipe.png` |
| 3 | 18:30 | Reel Swipe | `clips/1.3-swipe.mp4` |
| 4 | 18:00 | Story „Your foods. Right there.“ + Link-Sticker | `out-1.3/story-s9-recent.png` |
| 5 | 18:30 | Reel Trainingstag/Ruhetag | `clips/1.3-daytype.mp4` |
| 6 | 11:30 | Karussell H „Green. Violet. Red.“ (6) | `out-1.3/carousel-h-week-colours-*.png` |
| 6 | 18:00 | Story Umfrage „Ring or numbers?“ (**Umfrage-Sticker**: Ring / Numbers) | `out-1.3/story-s10-poll.png` |
| 7 | 18:30 | Reel Woche in Farben | `clips/1.3-week.mp4` |

Talking-Head-Clips 9 und 12 aus dem Content-Plan kommen dazu, sobald Drehtag A gefilmt ist.

## Captions

**Reel – Same app. New look.**
Serious Nutrition 1.3 is here. Same app, rebuilt to feel like your iPhone: a ring that fills up, swipe to delete, settings like iOS.

Update in the App Store.

#calorietracker #macros #iosapp #calisthenics #fitnessapp

**Karussell G – New look**
1.3 is out. Everything you knew is still there – it just feels like it belongs on your iPhone now.

Which one do you like most? 1–6 in the comments.

#calorietracker #macros #nutrition #calisthenics #fitnessapp

**Reel – Ring**
Red when the day starts. Green when you hit your target. One look, you know where you stand.

#calories #macros #nutritiontips #calisthenics #fitnessapp

**Reel – Swipe**
Logged the wrong thing? Swipe it away. Changed your mind? Undo. Tracking should never cost you more than a second.

#calorietracker #mealprep #macros #fitnesshabits #calisthenics

**Reel – Training day / rest day**
Training day: more carbs. Rest day: less. Protein stays. One tap and the whole day adjusts.

#trainingday #restday #macros #leanbulk #calisthenics

**Karussell H – Green. Violet. Red.**
Your week in one look. Green is on target, violet is below, red is above – and one red day ruins nothing.

Save this for your next cut.

#calories #cut #leanbulk #nutritiontips #calisthenics

**Reel – Week in colours**
Green, violet, red. The week counts, not the day.

#calories #bulk #cut #fitnesstips #calisthenics

**Pin-Kommentar (Luca setzt ihn nach dem Posten):** What should 1.4 bring? I read every answer.
