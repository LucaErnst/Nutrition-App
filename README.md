# Nutrition – calorie & macro tracker (Ernährung)

Persönliche Tracking-App (React + Vite + TypeScript, Daten lokal in IndexedDB, PWA). Oberfläche Englisch (Standard) oder Deutsch, umschaltbar unter „More/Mehr“.
Spec: `ernaehrung-app-spec.md`.

## Entwickeln

```bash
npm install
npm run dev          # http://localhost:5173
```

## Auf dem iPhone im WLAN nutzen

```bash
npm run phone        # baut und startet https://<Mac-IP>:5181 (selbstsigniertes Zertifikat)
```

Safari: Zertifikatswarnung bestätigen → Teilen → „Zum Home-Bildschirm“.

## Veröffentlichen (damit die App ohne laufenden Mac funktioniert)

### GitHub Pages (kostenlos, empfohlen)

1. Auf github.com ein neues Repository anlegen (privat oder öffentlich, **ohne** README).
2. Im Projektordner:
   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
3. Im Repository: **Settings → Pages → Source: „GitHub Actions“**.
4. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht bei jedem Push.
   URL: `https://<user>.github.io/<repo>/`

### Netlify / Vercel

Repository verbinden – `netlify.toml` bzw. `vercel.json` enthalten die Build-Einstellungen.
Ohne Unterpfad ist kein `BASE_PATH` nötig.

## Backup

„Mehr → Backup exportieren“ erzeugt eine JSON-Datei mit allen Daten; „Backup importieren“ ersetzt
die Daten auf dem Gerät. Die Daten liegen ausschliesslich lokal im Browser.

## Datenquellen

- Referenzwerte: `src/db/seed.ts` (Startdaten aus der Spec, editierbar in der App)
- Barcode-Abfrage: [Open Food Facts](https://world.openfoodfacts.org) (kostenlos, kein API-Key)
