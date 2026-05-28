# Metin2 Web CMS

> Modulares CMS für Metin2 Private Server — Dark Fantasy Design, Theme-System, isolierte Module.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![MySQL](https://img.shields.io/badge/MySQL-8-orange?logo=mysql)

## Schnellstart

```bash
git clone https://github.com/stb-srv/metin2-web.git
cd metin2-web
cp .env.example .env
# .env anpassen
bash scripts/install.sh
npm install
npm run dev
```

Siehe [ARCHITECTURE.md](./ARCHITECTURE.md) für die vollständige Dokumentation.

## Features

- 🎮 Dark Fantasy UI im Metin2-Stil
- 🧩 Modulares System — ein Modul crasht, der Rest läuft
- 🎨 Theme-System mit eigenem Theme-Editor
- 🔒 Read-only Zugriff auf die Metin2-Spieler-DB
- ⚙️ Admin-Panel für Modul- und Theme-Verwaltung
- 🚀 Automatisches Install-Script mit DB-Setup

## Deployment

### Erststart (einmalig)
```bash
npm install -g pm2
cd ~/metin2-web
chmod +x scripts/deploy.sh
bash scripts/deploy.sh
pm2 startup   # Ausgabe als root ausführen für Autostart
```

### Updates deployen
```bash
bash ~/metin2-web/scripts/deploy.sh
```
