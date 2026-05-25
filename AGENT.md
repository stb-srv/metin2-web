# AGENT.md — Regeln für KI-Agenten

> **Dieses Dokument MUSS vor jeder Aufgabe gelesen werden.**
> Es definiert verbindliche Regeln für alle KI-Agenten die an diesem Projekt arbeiten.
> Abweichungen sind nur mit expliziter Genehmigung des Projektinhabers erlaubt.

---

## 1. Projekt-Kontext

- **Projekt:** Metin2 Web CMS — Modulares CMS für Metin2 Private Server
- **Repo:** `https://github.com/stb-srv/metin2-web`
- **Vollständige Architektur:** Siehe `ARCHITECTURE.md`
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, MySQL, NextAuth.js

---

## 2. Absolute Verbote ❌

- ❌ **Niemals** Farben hardcoden — immer `var(--color-primary)` etc. verwenden
- ❌ **Niemals** auf `gameDb` schreiben (INSERT/UPDATE/DELETE) — nur SELECT erlaubt
- ❌ **Niemals** `.env` committen oder Passwörter in Code schreiben
- ❌ **Niemals** Module ohne Error Boundary einbinden
- ❌ **Niemals** direkt `import { PrismaClient }` — immer `cmsDb` aus `lib/cms-db.ts` oder `gameDb` aus `lib/game-db.ts` verwenden
- ❌ **Niemals** `any` in TypeScript verwenden ohne Kommentar-Begründung
- ❌ **Niemals** `console.log` in Production-Code — nur `console.error` für echte Fehler
- ❌ **Niemals** neue npm-Packages hinzufügen ohne Kommentar warum
- ❌ **Niemals** bestehende Datenbankstruktur ändern ohne Migration
- ❌ **Niemals** Admin-Routes ohne NextAuth Session-Guard implementieren

---

## 3. Pflicht-Regeln ✅

### Styling
- ✅ Alle Farben über CSS-Variablen: `var(--color-primary)`, `var(--color-bg)`, `var(--color-surface)`, `var(--color-surface-2)`, `var(--color-accent)`, `var(--color-border)`, `var(--color-text)`, `var(--color-text-muted)`, `var(--color-glow)`
- ✅ Tailwind-Config muss `var(--color-*)` als Farben registrieren
- ✅ Fonts: `font-display` für Überschriften (Cinzel), `font-body` für Text (Inter)
- ✅ Dark Fantasy Stil: Glowing Borders, hexagonale Item-Icons, dramatische Schatten
- ✅ Responsive: Mobile-first, Breakpoints `sm`, `md`, `lg`, `xl`

### Module
- ✅ Jedes Modul liegt unter `apps/web/modules/<modul-id>/`
- ✅ Jedes Modul hat: `index.tsx`, `module.config.ts`, mind. 1 Komponente
- ✅ Jedes Modul wird in `<ModuleErrorBoundary>` + `<Suspense>` gewrappt
- ✅ Module-Config aus DB laden (enabled/disabled Flag respektieren)
- ✅ API-Route pro Modul: `app/api/modules/<modul-id>/route.ts`

### TypeScript
- ✅ Strikte Typen überall — kein implizites `any`
- ✅ Interfaces für Props, Types für Daten
- ✅ Zod für API-Input-Validierung

### Datenbank
- ✅ Immer `cmsDb` aus `lib/cms-db.ts` für CMS-Daten
- ✅ Immer `gameDb` aus `lib/game-db.ts` für Spielerdaten (read-only!)
- ✅ Schema-Änderungen immer via Prisma Migration
- ✅ Neue Tabellen/Felder im `packages/db/prisma/schema.prisma` ergänzen

### Sicherheit
- ✅ Alle Admin-Routes: `getServerSession()` Check am Anfang
- ✅ API-Input immer mit Zod validieren
- ✅ SQL-Injection unmöglich durch Prisma (kein raw SQL ohne Not)
- ✅ CORS nur für eigene Domain konfigurieren

### Code-Qualität
- ✅ Komponenten unter 150 Zeilen halten — bei mehr aufteilen
- ✅ Wiederverwendbare UI-Komponenten in `components/ui/`
- ✅ Page-spezifische Komponenten im jeweiligen Modul
- ✅ Loading-States für alle async Operationen
- ✅ Error-States für alle async Operationen

---

## 4. Ordnerstruktur-Regeln

```
# Neue öffentliche Seite:
app/(public)/<seite>/page.tsx

# Neue Admin-Seite:
app/(admin)/<seite>/page.tsx

# Neue API-Route:
app/api/<ressource>/route.ts

# Neues Modul:
modules/<modul-id>/
  index.tsx              ← Export-Entry
  module.config.ts       ← Modul-Metadaten
  components/            ← Modul-spezifische Komponenten

# Neue wiederverwendbare UI-Komponente:
components/ui/<komponente>.tsx

# Neues Theme:
themes/<theme-id>/theme.json
```

---

## 5. Naming Conventions

| Was | Convention | Beispiel |
|---|---|---|
| React Komponente | PascalCase | `ServerStatusCard` |
| Hooks | camelCase + use | `useTheme`, `useModules` |
| Utils / Lib | camelCase | `themeEngine`, `moduleLoader` |
| API Routes | kebab-case Ordner | `api/modules/server-status/` |
| CSS Klassen | kebab-case | `module-error`, `status-card` |
| Datenbank Felder | camelCase (Prisma) | `createdAt`, `isDefault` |
| Env Variablen | SCREAMING_SNAKE_CASE | `CMS_DATABASE_URL` |

---

## 6. Design-System Referenz

### Farb-Variablen (immer verwenden!)

```css
--color-primary      /* Gold #c8a84b — Hauptakzent, Überschriften */
--color-bg           /* Dunkelblau #0d0f1a — Seitenhintergrund */
--color-surface      /* #1a1d2e — Cards, Panels */
--color-surface-2    /* #252840 — Nested Cards, Inputs */
--color-accent       /* Blau #2a6dd9 — Links, Buttons, Status */
--color-danger       /* Rot #e05a3a — Fehler, Löschen */
--color-success      /* Grün #4caf50 — Online, Erfolg */
--color-warning      /* Orange #f59e0b — Medium-Load, Warnung */
--color-text         /* Creme #e8dcc8 — Haupttext */
--color-text-muted   /* #8b7d6b — Sekundärtext, Labels */
--color-border       /* Gold 25% Opacity — Rahmen */
--color-glow         /* Gold 15% Opacity — Box-Shadow Glow */
```

### Tailwind-Config (muss in `tailwind.config.ts` stehen)

```ts
colors: {
  primary: 'var(--color-primary)',
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  'surface-2': 'var(--color-surface-2)',
  accent: 'var(--color-accent)',
  danger: 'var(--color-danger)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
}
```

### Wichtige CSS-Patterns (als Tailwind-Klassen oder className)

```tsx
// Card mit Glow-Border
<div className="bg-surface border border-border rounded-lg shadow-[0_0_20px_var(--color-glow)]">

// Gold-Überschrift
<h2 className="font-display text-primary tracking-widest uppercase">

// Status-Indikator online
<span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]">

// Hexagonale Icon-Wrapper
<div className="hex-icon">  {/* Eigene CSS-Klasse für clip-path */}
```

### Hexagon CSS (in globals.css definieren)

```css
.hex-icon {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
}
```

---

## 7. Prompt-Checkliste für Agenten

Vor jeder Implementierung prüfen:
- [ ] Habe ich `AGENT.md` gelesen?
- [ ] Verwende ich nur CSS-Variablen für Farben?
- [ ] Ist das Modul in Error Boundary gewrappt?
- [ ] Habe ich Zod-Validierung in API-Routes?
- [ ] Haben Admin-Routes einen Session-Guard?
- [ ] Sind Loading- und Error-States implementiert?
- [ ] Ist der Code TypeScript-konform (kein any)?
- [ ] Habe ich keine neuen Farben/Werte hardcoded?

---

## 8. Wichtige Dateipfade (Referenz)

```
apps/web/lib/cms-db.ts          ← CMS Prisma Client
apps/web/lib/game-db.ts         ← Game Prisma Client (READ ONLY)
apps/web/lib/theme-engine.ts    ← Theme CSS-Variablen Engine
apps/web/lib/module-loader.ts   ← ModuleErrorBoundary Klasse
packages/db/prisma/schema.prisma ← Datenbank Schema
.env.example                    ← Alle Env-Variablen
ARCHITECTURE.md                 ← Vollständige Architektur-Doku
```
