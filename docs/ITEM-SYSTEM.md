# Item-System & Web-Lager Architektur

## Übersicht

Das Item-System besteht aus drei Kernbereichen:

1. **Item-Verwaltung** — Items im Web erstellen, bearbeiten, löschen
2. **Web-Lager** — Großes persistentes Lager für Spieler im Web
3. **Transfer-System** — Items vom Web-Lager ins Ingame-Itemshop-Lager schicken

---

## Datenbank-Architektur

### CMS-DB (metin2_cms) — Neue Tabellen

```prisma
// Items die im Web erstellt/verwaltet werden
model ItemTemplate {
  id          String   @id @default(cuid())
  vnum        Int      @unique  // Metin2 Item VNUM
  name        String
  description String?  @db.Text
  iconUrl     String?
  itemType    String   // WEAPON, ARMOR, MATERIAL, etc.
  grade       ItemGrade @default(NORMAL)
  attributes  Json?    // { atk: 100, def: 50 } etc.
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  shopItems   ShopItem[]
  storageItems WebStorageItem[]
}

enum ItemGrade {
  NORMAL
  RARE
  EPIC
  LEGENDARY
}

// Web-Lager eines Spielers
model WebStorage {
  id          String   @id @default(cuid())
  accountId   Int      @unique  // Metin2 Account ID (aus gameDb)
  maxSlots    Int      @default(200)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       WebStorageItem[]
  transfers   ItemTransfer[]
}

// Ein Item im Web-Lager
model WebStorageItem {
  id          String   @id @default(cuid())
  storageId   String
  storage     WebStorage @relation(fields: [storageId], references: [id])
  templateId  String
  template    ItemTemplate @relation(fields: [templateId], references: [id])
  slot        Int          // Slot-Position 0-199
  count       Int          @default(1)
  enchants    Json?        // Item-Verzauberungen
  createdAt   DateTime     @default(now())

  @@unique([storageId, slot])
}

// Transfer-Log: Web-Lager → Ingame Itemshop-Lager
model ItemTransfer {
  id          String         @id @default(cuid())
  storageId   String
  storage     WebStorage     @relation(fields: [storageId], references: [id])
  itemTemplateId String
  count       Int            @default(1)
  enchants    Json?
  status      TransferStatus @default(PENDING)
  errorMsg    String?
  requestedAt DateTime       @default(now())
  processedAt DateTime?

  @@index([status])
  @@index([storageId])
}

enum TransferStatus {
  PENDING      // Wartet auf Verarbeitung
  PROCESSING   // Wird gerade verarbeitet
  SUCCESS      // Erfolgreich ins Ingame-Lager übertragen
  FAILED       // Fehler — Item bleibt im Web-Lager
  ROLLED_BACK  // Zurückgerollt (Item wieder im Web-Lager)
}
```

### Game-DB (metin2) — Relevante Tabellen (READ)

```sql
-- Itemshop-Lager Tabelle (je nach Serverversion)
-- Häufige Namen: itemshop_buy, item_award, mall_item
SELECT * FROM item_award WHERE account_name = ?;
```

---

## Transfer-Mechanismus

### Warum item_award?

Das Metin2-Itemshop-Lager funktioniert über die `item_award` Tabelle in der Game-DB.
Ein Eintrag dort erscheint beim nächsten Login/Channel-Wechsel automatisch im Ingame-Lager.

### Transfer-Flow

```
Spieler klickt "Ins Ingame-Lager senden"
        ↓
API: POST /api/storage/transfer
        ↓
1. Transaktion START
2. Item aus WebStorageItem löschen (cmsDb)
3. ItemTransfer mit Status=PROCESSING anlegen (cmsDb)
4. INSERT INTO item_award (gameDb) ← EINZIGER Write auf Game-DB!
5. ItemTransfer Status=SUCCESS (cmsDb)
6. Transaktion COMMIT
        ↓
      Erfolg ✓

Bei Fehler in Schritt 4:
1. WebStorageItem wird zurückerstellt (ROLLBACK)
2. ItemTransfer Status=FAILED
3. Fehlermeldung an Spieler
4. Item bleibt sicher im Web-Lager
```

### Wichtig: item_award Tabellen-Struktur

Je nach Server-Source unterschiedlich. Übliche Spalten:

```sql
CREATE TABLE `item_award` (
  `id`           int(11) NOT NULL AUTO_INCREMENT,
  `account_name` varchar(30) NOT NULL,
  `item_vnum`    int(11) NOT NULL,
  `item_count`   tinyint(4) NOT NULL DEFAULT 1,
  `socket0`      int(11) NOT NULL DEFAULT 0,
  `socket1`      int(11) NOT NULL DEFAULT 0,
  `socket2`      int(11) NOT NULL DEFAULT 0,
  `attrtype0`    tinyint(4) NOT NULL DEFAULT 0,
  `attrvalue0`   int(11) NOT NULL DEFAULT 0,
  -- ... bis attrtype7/attrvalue7
  `given_time`   datetime DEFAULT NULL,
  `rewarded`     tinyint(4) NOT NULL DEFAULT 0,  -- 0=ausstehend, 1=abgeholt
  PRIMARY KEY (`id`)
);
```

---

## Sicherheits-Regeln für das Transfer-System

- ❌ Niemals direkt auf game-db schreiben außer in `item_award`
- ✅ Transaktion: Item ERST aus Web-Lager entfernen, DANN in item_award schreiben
- ✅ Bei Fehler: Vollständiger Rollback, Item bleibt im Web-Lager
- ✅ Transfer-Log IMMER führen (ItemTransfer Tabelle)
- ✅ Rate-Limiting: Max 10 Transfers pro Spieler pro Minute
- ✅ Spieler muss eingeloggt/authentifiziert sein
- ✅ Slot-Prüfung: Item muss dem Spieler gehören
- ✅ Admin-Schenken: Separater Audit-Log
