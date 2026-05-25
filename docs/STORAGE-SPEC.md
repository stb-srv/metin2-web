# Web-Lager — Technische Spezifikation

> Diese Datei beantwortet offene Fragen aus Prompt 9 und erweitert die Anforderungen.
> Agent: Lies diese Datei VOR der Implementierung von Prompt 9 + 10.

---

## 1. Session & Account-Mapping

### Antwort: Ja, die Annahme ist korrekt.

Das Session-Objekt enthält nach NextAuth-Login die `accountId` als Integer:

```ts
// Wie NextAuth session.user aussehen MUSS:
interface SessionUser {
  id: string          // cuid aus users Tabelle (CMS)
  email: string
  name: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  accountId: number   // INT — Metin2 Account ID aus gameDb
}
```

### Implementierung in NextAuth (`apps/web/app/api/auth/[...nextauth]/route.ts`):

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accountId = user.accountId  // beim Login setzen
      token.role = user.role
    }
    return token
  },
  async session({ session, token }) {
    session.user.accountId = token.accountId as number
    session.user.role = token.role as string
    return session
  }
}
```

### Login-Flow (authorize callback):
1. User gibt Accountname + Passwort ein
2. Passwort-Prüfung gegen `gameDb.account` Tabelle (MD5 oder SHA256 je nach Source)
3. Account-ID aus `gameDb.account.id` auslesen
4. User in `cmsDb.users` anlegen/aktualisieren mit `accountId`
5. `accountId` in JWT Token speichern

### In API-Routes verwenden:
```ts
const session = await getServerSession(authOptions)
if (!session?.user?.accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const accountId = session.user.accountId  // bereits Int, KEIN parseInt nötig
```

---

## 2. Drag & Drop Verhalten: SWAP

### Antwort: Items SWAPPEN die Position.

Nicht blockieren — zwei Items die auf denselben Slot gezogen werden, tauschen ihre Plätze.

```
Vorher:  Slot 5 = Schwert,  Slot 12 = Helm
Drag Schwert auf Slot 12:
Nachher: Slot 5 = Helm,     Slot 12 = Schwert
```

### API-Verhalten für PATCH /api/modules/web-storage/slots:

```ts
// Request Body:
{ draggedItemId: string, targetSlot: number }

// Logik:
// 1. draggedItem laden + ownership prüfen
// 2. Prüfen ob targetSlot belegt:
//    - Frei: einfach verschieben
//    - Belegt: beide Items in einer Transaktion swappen
// 3. Transaktion in cmsDb (beide Updates atomar!)

await cmsDb.$transaction([
  cmsDb.webStorageItem.update({
    where: { id: draggedItem.id },
    data: { slot: targetSlot }
  }),
  // nur wenn targetSlot belegt:
  cmsDb.webStorageItem.update({
    where: { id: occupyingItem.id },
    data: { slot: draggedItem.slot }
  })
])
```

---

## 3. Slot- und Item-Limits

| Parameter | Wert | Wo gespeichert |
|---|---|---|
| Max Items pro Account | **1000** | `WebStorage.maxSlots = 1000` |
| Slot-Grid Darstellung | 10 × 100 Zeilen | Virtualisiert (nur sichtbare Zeilen rendern!) |
| Trash max Items | **128** | Geprüft beim Löschen |
| Trash Aufbewahrung | **7 Tage** | Cron-Job löscht abgelaufene |

### Grid-Virtualisierung (WICHTIG bei 1000 Slots):
1000 DOM-Elemente gleichzeitig rendern ist zu langsam.
Nutze `@tanstack/react-virtual` für virtualisiertes Scrollen:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
// Nur die sichtbaren Slots werden gerendert
// Rest ist virtuell im Speicher
```

---

## 4. Trash-System (Papierkorb)

### Prisma Schema Erweiterung:

```prisma
model WebStorageTrash {
  id           String      @id @default(cuid())
  storageId    String
  storage      WebStorage  @relation(fields: [storageId], references: [id])
  templateId   String
  template     ItemTemplate @relation(fields: [templateId], references: [id])
  count        Int         @default(1)
  enchants     Json?
  originalSlot Int         // Slot aus dem das Item gelöscht wurde
  deletedAt    DateTime    @default(now())
  expiresAt    DateTime    // deletedAt + 7 Tage

  @@index([storageId])
  @@index([expiresAt])   // Für Cron-Job
}

// WebStorage Model: Relation ergänzen
model WebStorage {
  // ... bestehende Felder ...
  trashItems   WebStorageTrash[]
}
```

### Lösch-Flow:

```
Spieler klickt "Löschen" auf Item
        ↓
Confirm-Dialog: "Item wird in den Papierkorb verschoben (7 Tage)"
        ↓
API: DELETE /api/modules/web-storage/items/[id]
        ↓
1. Trash-Count prüfen: >=128? → Fehler "Papierkorb voll — erst leeren"
2. Transaktion:
   a. WebStorageItem löschen
   b. WebStorageTrash anlegen:
      { ...itemDaten, originalSlot, expiresAt: now + 7 Tage }
3. Erfolg → Item im UI verschwindet aus Lager, erscheint im Papierkorb
```

### Wiederherstellen-Flow:

```
Spieler klickt "Wiederherstellen" im Papierkorb
        ↓
API: POST /api/modules/web-storage/trash/[id]/restore
        ↓
1. expiresAt prüfen — abgelaufen? → Fehler
2. Freien Slot finden (originalSlot bevorzugt, sonst ersten freien)
3. Transaktion:
   a. WebStorageTrash löschen
   b. WebStorageItem mit gefundenem Slot anlegen
4. Erfolg
```

### Endgültig löschen:

```
API: DELETE /api/modules/web-storage/trash/[id]
→ WebStorageTrash Eintrag permanent löschen
→ Confirm-Dialog: "Endgültig löschen? Nicht rückgängig machbar!"
```

### Cron-Job für automatisches Bereinigen (alle 6 Stunden):

```ts
// apps/web/app/api/cron/cleanup-trash/route.ts
// Wird per Vercel Cron / Systemd Timer / crontab aufgerufen

export async function GET(request: Request) {
  // Sicherheit: Nur interne Aufrufe (CRON_SECRET Header)
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deleted = await cmsDb.webStorageTrash.deleteMany({
    where: { expiresAt: { lte: new Date() } }
  })

  return NextResponse.json({ deleted: deleted.count })
}
```

Crontab auf dem Server:
```bash
# Alle 6 Stunden Papierkorb bereinigen
0 */6 * * * curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup-trash
```

---

## 5. Papierkorb-UI Spezifikation

### Tab-Navigation im Web-Lager Modul:
```
[ Lager (847/1000) ] [ Papierkorb (23/128) ]
```

### Papierkorb-Ansicht:
- Gleiche Grid-Darstellung wie Lager (aber ausgegraut/sepia)
- Item-Tooltip zeigt zusätzlich: "Wird gelöscht in X Tagen, Y Stunden"
- Ablaufende Items (< 24h) → roter Rahmen + Warnung
- Buttons pro Item: "Wiederherstellen" (grün) | "Endgültig löschen" (rot)
- Button oben: "Papierkorb leeren" (löscht alles endgültig, Confirm-Dialog)
- Wenn Papierkorb voll (128/128): Warnbanner oben in danger-Farbe

### Kapazitäts-Anzeige:
```tsx
// Lager
<CapacityBar current={847} max={1000} color="primary" />
// Grün bis 80%, Gelb bis 95%, Rot ab 95%

// Papierkorb  
<CapacityBar current={23} max={128} color="danger" />
```

---

## 6. Vollständige API-Route Übersicht Web-Lager

```
GET  /api/modules/web-storage              → Lager laden
PATCH /api/modules/web-storage/slots       → Slot swap/move
DELETE /api/modules/web-storage/items/[id] → In Papierkorb verschieben

GET  /api/modules/web-storage/trash        → Papierkorb laden
POST /api/modules/web-storage/trash/[id]/restore → Wiederherstellen
DELETE /api/modules/web-storage/trash/[id]        → Endgültig löschen
DELETE /api/modules/web-storage/trash             → Papierkorb leeren

POST /api/storage/transfer                 → Ins Ingame-Lager senden
GET  /api/storage/transfer/history         → Transfer-Verlauf

GET  /api/cron/cleanup-trash               → Cron (intern, CRON_SECRET)
```
