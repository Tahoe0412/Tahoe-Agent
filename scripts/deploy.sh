#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/Tahoe-Agent"
APP_NAME="tahoe"

cd "$APP_DIR"

# Fix ownership in case files were created by a different user (root vs ubuntu)
sudo chown -R "$(whoami)" "$APP_DIR" 2>/dev/null || true

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  echo "[deploy] Fetching latest code from origin/main..."
  git fetch --prune origin main
  git reset --hard origin/main
else
  echo "[deploy] Skipping git pull because code was uploaded by CI."
fi

echo "[deploy] Installing dependencies..."
npm ci

echo "[deploy] Generating Prisma client..."
npx prisma generate

echo "[deploy] Building application..."
npm run build

echo "[deploy] Syncing Prisma schema..."
npx prisma db push

echo "[deploy] Reloading application with PM2..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" || pm2 restart "$APP_NAME"
else
  pm2 start npm --name "$APP_NAME" -- start
fi

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
