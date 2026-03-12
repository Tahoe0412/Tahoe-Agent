#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Tahoe-Agent"

cd "$APP_DIR"

echo "[deploy] Pulling latest code from main..."
git pull origin main

echo "[deploy] Installing dependencies..."
npm ci

echo "[deploy] Building application..."
npm run build

echo "[deploy] Syncing Prisma schema..."
npx prisma db push

echo "[deploy] Restarting application with PM2..."
if pm2 describe tahoe-agent >/dev/null 2>&1; then
  pm2 restart tahoe-agent
else
  pm2 start npm --name tahoe-agent -- start
fi

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
