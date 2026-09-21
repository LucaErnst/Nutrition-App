# Marketing-Werkzeuge

- `CONTENT-PLAN.md` – 14-Tage-Plan für TikTok mit Hooks, Skripten, B-Roll, Captions.
- `demo-data.mjs` – erzeugt `demo-backup.json` (35 Tage realistische Beispieldaten, Aufbauphase).
- `clips.mjs` – nimmt App-Clips (9:16, 1080×1920) in der laufenden Preview auf und rendert Hook/Abspann.

```bash
npm run build && npx vite preview --port 4173 &
node marketing/demo-data.mjs
node marketing/clips.mjs        # → marketing/clips/*.mp4
```

Die Clips sind B-Roll: reine App-Aufnahmen ohne Ton. Text-Overlays werden als transparente PNGs
gerendert (ffmpeg hier ohne drawtext) und per `overlay` eingeblendet.
