#!/bin/bash
# ============================================================
# Metin2 Web CMS — Automatisches Install-Script
# Legt CMS-Datenbank, User und Basis-Tabellen automatisch an
# ============================================================

set -e

echo "🎮 Metin2 Web CMS — Installation"
echo "==================================="

# .env laden
if [ ! -f .env ]; then
  echo "❌ .env nicht gefunden. Bitte zuerst: cp .env.example .env && nano .env"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

echo "📦 Prüfe Voraussetzungen..."
command -v mysql >/dev/null 2>&1 || { echo "❌ MySQL nicht gefunden"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js nicht gefunden"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm nicht gefunden"; exit 1; }

echo "✅ Voraussetzungen OK"

# ============================================================
# Datenbank & User anlegen
# ============================================================
echo ""
echo "🗄️  Lege CMS-Datenbank und User an..."

mysql -h "${MYSQL_ROOT_HOST:-localhost}" -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
-- CMS Datenbank anlegen
CREATE DATABASE IF NOT EXISTS \`${CMS_DB_NAME:-metin2_cms}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CMS User anlegen (falls nicht vorhanden)
CREATE USER IF NOT EXISTS '${CMS_DB_USER:-cms_user}'@'localhost'
  IDENTIFIED BY '${CMS_DB_PASSWORD}';

-- Volle Rechte auf CMS-DB
GRANT ALL PRIVILEGES ON \`${CMS_DB_NAME:-metin2_cms}\`.* 
  TO '${CMS_DB_USER:-cms_user}'@'localhost';

-- Read-Only auf Game-DB (für Rankings, Spielerdaten)
GRANT SELECT ON \`${GAME_DB_NAME:-metin2}\`.*
  TO '${CMS_DB_USER:-cms_user}'@'localhost';

FLUSH PRIVILEGES;
EOF

echo "✅ Datenbank und User angelegt"

# ============================================================
# Dependencies installieren
# ============================================================
echo ""
echo "📥 Installiere Node.js Dependencies..."
npm install

# ============================================================
# Prisma Migrations ausführen
# ============================================================
echo ""
echo "🔄 Führe Datenbank-Migrations aus..."
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma 2>/dev/null || \
npx prisma db push --schema=packages/db/prisma/schema.prisma

# ============================================================
# Seed: Standard-Themes und Admin-User
# ============================================================
echo ""
echo "🌱 Erstelle Standard-Daten (Themes, Module, Admin)..."
npx tsx scripts/seed.ts

echo ""
echo "🎉 Installation abgeschlossen!"
echo "==================================="
echo "➡️  Starte den Dev-Server mit: npm run dev"
echo "➡️  Admin-Panel: http://localhost:3000/admin"
echo "==================================="
