#!/bin/bash
set -e

echo "=== Metin2 Web Deploy ==="

cd ~/metin2-web

echo "→ Git Pull..."
git pull

echo "→ Dependencies installieren..."
npm install --legacy-peer-deps

echo "→ Prisma Client generieren..."
npx prisma generate --schema=packages/db/prisma/schema.prisma

echo "→ Datenbank migrieren..."
npx prisma db push --schema=packages/db/prisma/schema.prisma

echo "→ Next.js Build..."
cd apps/web
npm run build

echo "→ PM2 restart..."
cd ~/metin2-web
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "→ PM2 speichern..."
pm2 save

echo "=== Deploy fertig ==="
