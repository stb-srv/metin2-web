# Prompts 10–13 — Metin2 Web CMS

Diese Datei enthält die vollständigen Agent-Prompts für Phase 3 des Projekts.
Immer zuerst `AGENT.md` lesen bevor ein Prompt ausgeführt wird.

---

## Prompt 10 — Login + Registrierung (mit Ingame-Account + Löschcode)

```
Lies zuerst AGENT.md, docs/STORAGE-SPEC.md und packages/db/prisma/schema.prisma
aus https://github.com/stb-srv/metin2-web

Aufgabe: Implementiere Login und Registrierung komplett.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEXTAUTH KONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Datei: apps/web/app/api/auth/[...nextauth]/route.ts

- Credentials Provider (Login: Account-Name + Passwort)
- authorize() Ablauf:
  1. Suche User in cmsDb.user (WHERE email = credentials.email)
  2. Prüfe bcrypt.compare(credentials.password, user.password)
  3. Gib { id, email, name, role, accountId } zurück
- JWT Callback: accountId + role in Token schreiben
- Session Callback: accountId + role aus Token in session.user schreiben
- Pages: signIn: '/login', error: '/login'

Datei: apps/web/types/next-auth.d.ts
  declare module 'next-auth' {
    interface Session {
      user: { id: string; email: string; name: string; role: string; accountId: number }
    }
    interface JWT {
      role: string; accountId: number
    }
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. REGISTRIERUNG API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Datei: apps/web/app/api/auth/register/route.ts

POST Body (Zod validieren):
{
  accountName: string  // 4-16 Zeichen, nur a-z A-Z 0-9 _
  email: string        // valide E-Mail
  password: string     // min 8 Zeichen, 1 Zahl, 1 Großbuchstabe
  passwordConfirm: string
  deleteCode: string   // genau 7 Ziffern (0-9)
  deleteCodeConfirm: string
}

Ablauf in einer TRANSAKTION:
  Schritt 1 — Duplikat-Prüfung:
    - cmsDb.user.findFirst({ where: { email } }) → 409 "E-Mail bereits vergeben"
    - gameDb.$queryRaw`SELECT id FROM account WHERE login = ${accountName}`
      → 409 "Account-Name bereits vergeben"

  Schritt 2 — Ingame-Account anlegen (gameDb, RAW SQL):
    INSERT INTO account (login, password, social_id, email, status, availDt, mPointMeth)
    VALUES (
      ${accountName},
      SHA2(${password}, 256),   -- Metin2 nutzt SHA256 für Passwörter
      ${deleteCode},             -- social_id = Löschcode (Plaintext, Metin2-Kompatibilität)
      ${email},
      'OK',
      NOW(),
      0
    )
    Danach: SELECT LAST_INSERT_ID() as id → gameAccountId speichern

  Schritt 3 — CMS User anlegen:
    cmsDb.user.create({
      data: {
        email,
        name: accountName,
        password: await bcrypt.hash(password, 12),
        accountId: gameAccountId,
        role: 'USER'
      }
    })

  Schritt 4 — Web-Lager anlegen:
    cmsDb.webStorage.create({
      data: { accountId: gameAccountId, maxSlots: 1000 }
    })

Response bei Erfolg: 201 { message: "Account erfolgreich erstellt" }

WICHTIG: gameDb ist READ ONLY laut AGENT.md — AUSNAHME:
Der account INSERT ist explizit erlaubt für Registrierung.
Schreibe einen Kommentar: // WRITE EXCEPTION: account creation approved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. LOGIN SEITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Datei: apps/web/app/(public)/login/page.tsx

- Kein Layout-Wrapper nötig — eigene zentrierte Seite
- Dark-Fantasy Styling mit Tailwind + CSS-Variablen aus globals.css
- Formular: E-Mail + Passwort + "Anmelden" Button
- Link zu /register
- Bei Fehler: roter Error-Banner
- Bei Erfolg: redirect('/dashboard')
- "use client" + signIn() aus next-auth/react
- Loading-State beim Submit (Button disabled + Spinner)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. REGISTRIERUNGS-SEITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Datei: apps/web/app/(public)/register/page.tsx

- Gleiches Dark-Fantasy Styling wie Login
- Felder: Account-Name, E-Mail, Passwort, Passwort bestätigen,
          Löschcode (7 Ziffern), Löschcode bestätigen
- Hinweis unter Account-Name: "Dieser Name wird dein Ingame-Loginname"
- Hinweis unter Löschcode: "7-stelliger Code zum Löschen von Items und Charakteren"
- Löschcode Felder: type="password", nur Ziffern (onKeyDown), maxLength={7}
- Live-Validierung (Zod im Frontend):
  - Passwort-Stärke-Anzeige (schwach/mittel/stark als farbige Bar)
  - Löschcode: genau 7 Ziffern
  - Löschcode-Bestätigung: muss identisch sein
- Bei Erfolg: Auto-Login via signIn() + redirect('/dashboard')
- "use client" + fetch('/api/auth/register')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ROUTE PROTECTION (Middleware)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Datei: apps/web/middleware.ts

import { withAuth } from 'next-auth/middleware'
export default withAuth({ pages: { signIn: '/login' } })
export const config = {
  matcher: ['/dashboard/:path*', '/storage/:path*', '/itemshop/:path*', '/admin/:path*']
}

Admin-Guard zusätzlich in Admin-Layouts:
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. PASSWORT-HASHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ingame-DB (account.password): SHA2(password, 256) — SQL direkt
CMS-DB (user.password):       bcrypt.hash(password, 12)
Löschcode (account.social_id): Plaintext — Metin2-Kompatibilität

Beim Login: NUR bcrypt-Passwort des CMS-Users prüfen.

Halte dich STRIKT an AGENT.md.
Nutze cmsDb.$transaction() für alle schreibenden Operationen.
```

---

## Prompt 11 — Dashboard mit Live-Stats

```
Lies zuerst AGENT.md aus https://github.com/stb-srv/metin2-web

Aufgabe: Dashboard-Seite mit echten Live-Daten aus der Datenbank.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SERVER STATUS WIDGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- GET /api/modules/server-status → cmsDb.serverStatus.findMany()
- Zeige je Channel: Name, Online/Offline Badge, Spieleranzahl, Load-Bar
- Auto-Refresh alle 60 Sekunden
- Pulse-Animation bei Online (grüner Dot)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. LIVE-STATS LEISTE (wie shiva.international)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/modules/stats → gameDb queries (READ ONLY):
  - Gesamte Accounts: SELECT COUNT(*) FROM account
  - Online Spieler:   SELECT COUNT(*) FROM player WHERE logoff_time = 0
  - Gilden gesamt:    SELECT COUNT(*) FROM guild
  - Höchste Stufe:    SELECT MAX(level) FROM player

Frontend: 4 Stat-Kärtchen mit animierten Zählern (count-up Animation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. NEWS WIDGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/modules/news?limit=3 → cmsDb.news.findMany (published, pinned zuerst)
Zeige: Kategorie-Badge (UPDATE/EVENT/NEWS/MAINTENANCE), Titel, Datum, Excerpt
Link zu /news für alle News

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. TOP-RANKING PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/modules/rankings/top5 → gameDb query (READ ONLY):
  SELECT p.name, p.level, p.job, a.login as account_name
  FROM player p JOIN account a ON p.account_id = a.id
  ORDER BY p.level DESC, p.exp DESC
  LIMIT 5

Zeige: Platz-Nummer, Klassen-Icon (job 0-7), Name, Level
Link zu /rankings für vollständige Liste

Halte dich STRIKT an AGENT.md.
```

---

## Prompt 12 — Rankings + Charakterseite

```
Lies zuerst AGENT.md aus https://github.com/stb-srv/metin2-web

Aufgabe: Vollständige Rankings-Seite + öffentliche Charakterseite.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. RANKINGS API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/modules/rankings?type=level|pvp|guild&page=1&limit=50

Level-Ranking:
  SELECT p.id, p.name, p.level, p.job, p.empire,
         g.name as guild_name, a.login
  FROM player p
  JOIN account a ON p.account_id = a.id
  LEFT JOIN guild g ON p.guild_id = g.id
  ORDER BY p.level DESC, p.exp DESC
  LIMIT ? OFFSET ?

Gilde-Ranking:
  SELECT g.id, g.name, g.level, g.exp,
         COUNT(gm.pid) as member_count
  FROM guild g
  LEFT JOIN guild_member gm ON g.id = gm.guild_id
  GROUP BY g.id
  ORDER BY g.level DESC, g.exp DESC
  LIMIT ? OFFSET ?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. RANKINGS SEITE (apps/web/app/(public)/rankings/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Tab-Navigation: Level | PvP | Gilden
- Top 3 hervorgehoben (Gold/Silber/Bronze Badges)
- Klassen-Icon mapping (job 0-7 → Krieger/Assassine/Sura/Schamane)
- Imperium-Farbe (1=Rot, 2=Gelb, 3=Blau)
- Paginierung (50 pro Seite)
- Klick auf Charakter-Name → /character/[name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CHARAKTER-SEITE (apps/web/app/(public)/character/[name]/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/modules/character/[name]:
  SELECT p.*, g.name as guild_name
  FROM player p
  LEFT JOIN guild g ON p.guild_id = g.id
  WHERE p.name = ?

Anzeige:
- Charakter-Name, Klasse, Level, Imperium
- Gilde (falls vorhanden, Link zur Gilden-Seite)
- Stats: HP, MP, Angriff, Verteidigung, Geschwindigkeit
- Einloggt zuletzt / Status (online/offline)
- Server-Rang (Platz in Level-Ranking)

Halte dich STRIKT an AGENT.md.
```

---

## Prompt 13 — Design-Overhaul (Dark Fantasy Theme)

```
Lies zuerst AGENT.md und apps/web/app/globals.css
aus https://github.com/stb-srv/metin2-web

Aufgabe: Komplettes Design-Overhaul im Dark-Fantasy Stil.
Referenz: https://shiva.international

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN-VORGABEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Farbpalette (CSS-Variablen in globals.css):
  --color-bg:        #0a0b0f  (tiefstes Schwarz)
  --color-surface:   #111318  (dunkle Kartenfläche)
  --color-border:    #2a2d3a  (subtile Umrandung)
  --color-primary:   #c8a84b  (Metin2-Gold)
  --color-glow:      rgba(200,168,75,0.15) (Gold-Glow)
  --color-text:      #e8dcc8  (warmes Creme)
  --color-muted:     #7a7060  (gedämpftes Braun)
  --color-rare:      #4a9eff  (Blau für Rare)
  --color-epic:      #b24bff  (Lila für Epic)
  --color-legendary: #ff8c00  (Orange für Legendary)

Typographie:
  --font-display: 'Cinzel', serif  (Metin2-typische Schrift)
  --font-body:    'Crimson Text', serif
  Google Fonts: ?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600

Komponenten:
1. Topbar: Logo links, Navigation Mitte, Account/Login rechts
   - Aktive Seite: Gold-Unterstrich + leichter Glow
   - Transparent mit Blur-Backdrop, Gold-Bottom-Border

2. Hero-Section (nur Startseite):
   - Vollbild-Hintergrundbild (Metin2-Artwork, dunkel geölt)
   - Zentrierter Server-Name in Cinzel, Gold
   - Live-Stats Leiste darunter (Accounts | Online | Gilden | Max Level)
   - Einloggen + Registrieren CTA-Buttons in Gold

3. Karten-Komponente:
   - Hintergrund: --color-surface
   - Border: 1px solid --color-border
   - Box-Shadow: 0 0 20px var(--color-glow)
   - Hover: Glow intensiver, Border Gold

4. Navigation-Sidebar (für eingeloggte User):
   - Links: Dashboard, Rankings, Item Shop, Web-Lager, Profil
   - Aktiver Link: Gold, linker Balken
   - Icons: Lucide-React

5. Legendary Item Glow:
   @keyframes legendary-glow {
     0%, 100% { box-shadow: 0 0 8px var(--color-legendary); }
     50%       { box-shadow: 0 0 24px var(--color-legendary), 0 0 48px rgba(255,140,0,0.3); }
   }

Halte dich STRIKT an AGENT.md.
Nur CSS/Tailwind-Änderungen — keine Logik anfassen.
```

---

## Hinweise für alle Prompts

- **Immer `AGENT.md` zuerst lesen** bevor ein Prompt ausgeführt wird
- **Reihenfolge einhalten**: 10 → 11 → 12 → 13
- **gameDb ist READ ONLY** — Ausnahme nur in Prompt 10 (account INSERT)
- **Passwortänderung später**: Muss beide DBs updaten (SHA256 + bcrypt)
- **Löschcode** (social_id): Plaintext, niemals hashen — Metin2-Kompatibilität
