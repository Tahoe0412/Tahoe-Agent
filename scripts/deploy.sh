#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/Tahoe-Agent"
PRIMARY_APP_NAME="${PM2_APP_NAME:-tahoe-agent}"
LEGACY_APP_NAME="tahoe"

resolve_app_name() {
  if pm2 describe "$PRIMARY_APP_NAME" >/dev/null 2>&1; then
    printf '%s\n' "$PRIMARY_APP_NAME"
    return
  fi

  if pm2 describe "$LEGACY_APP_NAME" >/dev/null 2>&1; then
    printf '%s\n' "$LEGACY_APP_NAME"
    return
  fi

  printf '%s\n' "$PRIMARY_APP_NAME"
}

APP_NAME="$(resolve_app_name)"

cd "$APP_DIR"

load_env_file() {
  local file_path="$1"
  if [ -f "$file_path" ]; then
    echo "[deploy] Loading environment from $file_path"
    set -a
    # shellcheck disable=SC1090
    source "$file_path"
    set +a
  fi
}

apply_env_override() {
  local target_key="$1"
  local override_key="$2"
  local override_value="${!override_key:-}"

  if [ -n "$override_value" ]; then
    echo "[deploy] Overriding $target_key from CI/runtime secret"
    export "${target_key}=${override_value}"
  fi
}

load_pm2_env_var() {
  local env_key="$1"
  local env_value

  if [ -n "${!env_key:-}" ]; then
    echo "[deploy] Keeping existing $env_key and skipping PM2 runtime fallback"
    return
  fi

  env_value="$(pm2 jlist 2>/dev/null | node -e '
    const fs = require("fs");
    const appName = process.argv[1];
    const envKey = process.argv[2];
    const payload = fs.readFileSync(0, "utf8").trim();
    if (!payload) process.exit(0);

    const apps = JSON.parse(payload);
    const app = apps.find((entry) => entry.name === appName);
    const value = app?.pm2_env?.[envKey];
    if (typeof value === "string" && value.length > 0) {
      process.stdout.write(value);
    }
  ' "$APP_NAME" "$env_key")"

  if [ -n "$env_value" ]; then
    echo "[deploy] Loading $env_key from PM2 runtime env"
    export "${env_key}=${env_value}"
  fi
}

# Fix ownership in case files were created by a different user (root vs ubuntu)
sudo chown -R "$(whoami)" "$APP_DIR" 2>/dev/null || true

# Match Next.js precedence so Prisma CLI and the build use the same runtime env.
load_env_file "$APP_DIR/.env"
load_env_file "$APP_DIR/.env.local"
apply_env_override "DATABASE_URL" "CI_DATABASE_URL_OVERRIDE"
apply_env_override "DIRECT_URL" "CI_DIRECT_URL_OVERRIDE"
load_pm2_env_var "DATABASE_URL"
load_pm2_env_var "DIRECT_URL"

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

if [ "${SKIP_PRISMA_DB_PUSH:-0}" = "1" ]; then
  echo "[deploy] Skipping Prisma schema sync because no Prisma files changed in this release."
else
  echo "[deploy] Syncing Prisma schema..."
  npx prisma db push --accept-data-loss
fi

echo "[deploy] Building application..."
npm run build

echo "[deploy] Reloading PM2 app: $APP_NAME"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" || pm2 restart "$APP_NAME"
else
  pm2 start npm --name "$APP_NAME" -- start
fi

if [ "$APP_NAME" = "$PRIMARY_APP_NAME" ] && pm2 describe "$LEGACY_APP_NAME" >/dev/null 2>&1; then
  echo "[deploy] Removing legacy PM2 app: $LEGACY_APP_NAME"
  pm2 delete "$LEGACY_APP_NAME" || true
fi

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
