# Themes

Jedes Theme ist ein Ordner mit einer `theme.json`.

## Eigenes Theme erstellen

1. Neuen Ordner anlegen: `themes/mein-theme/`
2. `theme.json` nach folgendem Schema erstellen:

```json
{
  "id": "mein-theme",
  "name": "Mein Theme",
  "description": "Beschreibung",
  "author": "DeinName",
  "version": "1.0.0",
  "colors": {
    "--color-primary": "#c8a84b",
    "--color-bg": "#0d0f1a",
    "--color-surface": "#1a1d2e",
    "--color-surface-2": "#252840",
    "--color-accent": "#2a6dd9",
    "--color-danger": "#e05a3a",
    "--color-success": "#4caf50",
    "--color-warning": "#f59e0b",
    "--color-text": "#e8dcc8",
    "--color-text-muted": "#8b7d6b",
    "--color-border": "rgba(200,168,75,0.25)",
    "--color-glow": "rgba(200,168,75,0.15)"
  },
  "fonts": {
    "--font-display": "'Cinzel', serif",
    "--font-body": "'Inter', sans-serif"
  },
  "borderRadius": {
    "--radius-sm": "4px",
    "--radius-md": "8px",
    "--radius-lg": "12px"
  }
}
```

3. Im Admin-Panel unter **Themes** aktivieren — oder direkt über das Upload-Formular importieren.

## Pflicht-Variablen

Alle CSS-Variablen oben müssen gesetzt sein — sonst greift kein Fallback und das Design bricht.

## Tipps

- Nutze https://coolors.co für Farbpaletten
- Google Fonts für `--font-display`: Cinzel, MedievalSharp, IM Fell English
- `--color-glow` ist der Box-Shadow-Glow-Effekt auf Cards
