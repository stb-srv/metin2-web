# Metin2 Web CMS — Architektur-Übersicht

> Modulares CMS für Metin2 Private Server mit Dark-Fantasy-Design, Theme-System und isolierten Modulen.

---

## Tech-Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR/SSG, Modularität, API-Routes |
| Styling | Tailwind CSS + CSS Variables | Theme-System einfach umsetzbar |
| Components | shadcn/ui | Unstyled, vollständig anpassbar |
| Datenbank | MySQL/MariaDB | Kompatibel mit Metin2-Infra |
| ORM | Prisma | Migrations, Type-Safety, zwei DB-Clients |
| Auth | NextAuth.js | Sessions, Admin-Panel |
| Module | Dynamic Imports + Error Boundaries | Crash-Isolation pro Modul |

---

## Ordner-Struktur

```
metin2-web/
├── apps/
│   └── web/                        # Next.js Frontend
│       ├── app/
│       │   ├── (public)/           # Öffentliche Seiten
│       │   │   ├── rankings/
│       │   │   ├── news/
│       │   │   ├── itemshop/
│       │   │   └── community/
│       │   ├── (admin)/            # Admin/CMS Panel
│       │   │   ├── dashboard/
│       │   │   ├── modules/
│       │   │   ├── themes/
│       │   │   └── settings/
│       │   └── api/
│       │       ├── modules/        # Modul-spezifische API-Routes
│       │       └── admin/
│       ├── components/
│       │   ├── core/               # Layout, Nav, Footer, ErrorBoundary
│       │   └── ui/                 # shadcn Basis-Komponenten
│       ├── modules/                # Isolierte Feature-Module
│       │   ├── rankings/
│       │   │   ├── index.tsx
│       │   │   ├── module.config.ts
│       │   │   └── components/
│       │   ├── itemshop/
│       │   ├── news/
│       │   ├── server-status/
│       │   └── community/
│       ├── themes/                 # Theme-Definitionen
│       │   ├── metin2-dark/
│       │   │   └── theme.json
│       │   ├── metin2-fire/
│       │   │   └── theme.json
│       │   └── README.md
│       └── lib/
│           ├── module-loader.ts    # Dynamisches Laden + Fallbacks
│           ├── theme-engine.ts     # Theme-Switcher
│           ├── cms-db.ts           # Prisma CMS-Client
│           └── game-db.ts          # Prisma Game-DB (read-only)
├── packages/
│   └── db/
│       ├── prisma/
│       │   └── schema.prisma
│       └── migrations/
├── scripts/
│   └── install.sh                  # Automatisches Setup-Script
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Datenbank-Architektur

```
┌─────────────────────────────────┐
│         Dein PServer            │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │ Metin2   │  │ metin2_cms  │  │
│  │ Game DB  │  │ (CMS DB)    │  │
│  │          │  │             │  │
│  │ READ     │  │ READ+WRITE  │  │
│  │ ONLY     │  │             │  │
│  └──────────┘  └─────────────┘  │
│       ↑               ↑         │
│  Rankings,       CMS-Content,   │
│  Spielerdaten    Module, Themes, │
│                  User, Settings  │
└─────────────────────────────────┘
```

### Zwei Prisma-Clients

- **`cms-db.ts`** → `metin2_cms` — Volle Rechte (CMS-Inhalte, Module, Themes, User)
- **`game-db.ts`** → `metin2` — Nur SELECT (Rankings, Spielerdaten für Anzeige)

Der `cms_user` wird **beim Install automatisch angelegt** mit:
- `ALL PRIVILEGES ON metin2_cms.*`
- `SELECT ON metin2.*`
- Kein Remote-Zugriff (`localhost` only)

---

## Modul-System

Jedes Modul ist vollständig isoliert:

```ts
// module.config.ts
export const moduleConfig = {
  id: 'rankings',
  name: 'Player Rankings',
  enabled: true,
  version: '1.0.0',
  fallback: 'Modul vorübergehend nicht verfügbar',
}
```

- Module werden per `React.lazy` + `Suspense` geladen
- Jedes Modul ist in eine **Error Boundary** gewrappt
- Module können im Admin-Panel **live aktiviert/deaktiviert** werden (DB-Flag)
- Ein Modul-Absturz bringt **nie** die Gesamtseite zum Fallen

---

## Theme-System

Themes bestehen aus einer `theme.json` mit CSS-Variablen:

```json
{
  "id": "metin2-dark",
  "name": "Metin2 Dark",
  "colors": {
    "--color-primary": "#c8a84b",
    "--color-bg": "#0d0f1a",
    "--color-surface": "#1a1d2e",
    "--color-accent": "#2a6dd9",
    "--color-danger": "#e05a3a",
    "--color-success": "#4caf50",
    "--color-border": "rgba(200,168,75,0.3)"
  },
  "fonts": {
    "--font-display": "'Cinzel', serif",
    "--font-body": "'Inter', sans-serif"
  }
}
```

- Themes werden in `themes/` als Ordner abgelegt
- Eigene Themes: JSON-Upload im Admin-Panel → sofort aktiv
- Theme-Auswahl wird in DB + localStorage gespeichert
- **Keine hardgecodeten Farben** in Komponenten — immer `var(--color-primary)` etc.

---

## Initiale Module

| Modul | Beschreibung | API-Route |
|---|---|---|
| `server-status` | CH1/CH2/CH3 Status, Uptime, Events | `/api/modules/server-status` |
| `rankings` | Spieler-Rankings nach Level, PvP etc. | `/api/modules/rankings` |
| `itemshop` | Item-Shop mit Kategorien und Kauf | `/api/modules/itemshop` |
| `news` | News/Announcements vom Admin | `/api/modules/news` |
| `community` | Forum-Übersicht / Community-Links | `/api/modules/community` |

---

## Installation

```bash
# 1. Repo klonen
git clone https://github.com/stb-srv/metin2-web.git
cd metin2-web

# 2. .env konfigurieren
cp .env.example .env
nano .env

# 3. Install-Script ausführen (legt DBs, User, Tabellen automatisch an)
bash scripts/install.sh

# 4. Dependencies installieren
npm install

# 5. Dev-Server starten
npm run dev
```

---

## Eigenes Theme erstellen

1. Ordner unter `themes/mein-theme/` anlegen
2. `theme.json` nach obigem Schema erstellen
3. Im Admin-Panel unter **Themes** → **Theme importieren** hochladen
4. Alternativ: direkt im Admin-Panel im Theme-Editor erstellen und exportieren

---

## Sicherheits-Grundregeln

- DB-User `cms_user` hat **kein** Remote-Zugriff
- Game-DB ist **read-only** — CMS kann nie Spielerdaten überschreiben
- Admin-Panel hinter NextAuth.js Session-Guard
- Alle API-Routes validieren Input mit `zod`
- `.env` niemals committen (`.gitignore` bereits gesetzt)
