#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Tahoe-Agent"

cd "$APP_DIR"

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  echo "[deploy] Pulling latest code from main..."
  git pull origin main
else
  echo "[deploy] Skipping git pull because code was uploaded by CI."
fi

echo "[deploy] Installing dependencies..."
npm ci

echo "[deploy] Cleaning stale build cache..."
if [ -d ".next" ]; then
  chmod -R u+rwX .next 2>/dev/null || true
  rm -rf .next
fi

echo "[deploy] Generating Prisma client..."
npx prisma generate

echo "[deploy] Building application..."
npm run build

echo "[deploy] Syncing Prisma schema..."
npx prisma db push

echo "[deploy] Restarting application with PM2..."
if pm2 describe tahoe >/dev/null 2>&1; then
  pm2 restart tahoe
else
  pm2 start npm --name tahoe -- start
fi

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
