# Deploy Guide

This project is deployed on Tencent Cloud Lighthouse with local PostgreSQL.

## Current Production Setup

- Server: Tencent Cloud Lighthouse
- Public IP: `111.229.24.208`
- App directory: `/home/ubuntu/Tahoe-Agent`
- Runtime user: `ubuntu`
- Process manager: `pm2` (`tahoe`)
- Reverse proxy: `nginx`
- Database: local PostgreSQL
- Database name: `ai_video_mvp`
- Database user: `tahoe`

## Production Architecture

1. GitHub stores source code.
2. GitHub Actions runs on pushes to `main`.
3. Actions uploads the latest project files to the server over SSH.
4. The server runs `scripts/deploy.sh`.
5. `deploy.sh` installs dependencies, builds the app, syncs Prisma schema, and restarts `pm2`.
6. `nginx` serves public traffic on port `80` and forwards it to Next.js on port `3000`.

## Local Release Flow

After making code changes locally:

```bash
git status
git add .
git commit -m "your update message"
git push origin main
```

Once pushed, GitHub Actions automatically deploys the latest code to production.

## GitHub Actions Workflow

Workflow file:

```text
.github/workflows/deploy.yml
```

What it does:

- checks out the repo
- configures SSH using repository secrets
- uploads project files to Tencent Cloud
- runs the server deploy script

Required GitHub repository secrets:

- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_PORT`
- `SERVER_SSH_KEY`

## Server Deploy Script

Deploy script:

```text
scripts/deploy.sh
```

It performs:

```bash
git fetch --prune origin main # skipped in CI deploy when SKIP_GIT_PULL=1
git reset --hard origin/main
npm ci
source .env && source .env.local # when present, .env.local overrides .env
npx prisma db push
npm run build
# auto-detects `tahoe-agent` first, falls back to legacy `tahoe`
pm2 reload <detected-app> || pm2 restart <detected-app>
pm2 save
```

Important:

- `scripts/deploy.sh` no longer stops `pm2` before install/build. If deploy fails mid-way, the current app process stays online.
- `scripts/deploy.sh` now auto-detects the real PM2 process name and prefers `tahoe-agent`, so CI and manual deploys operate on the same live app.
- Prefer GitHub Actions for production releases. It uploads code over SSH and runs `SKIP_GIT_PULL=1 /home/ubuntu/Tahoe-Agent/scripts/deploy.sh`, which avoids server-side GitHub TLS failures.

## Server Environment

Production environment files live on the server here:

```text
/home/ubuntu/Tahoe-Agent/.env
/home/ubuntu/Tahoe-Agent/.env.local
```

`scripts/deploy.sh` now loads both files before running Prisma/build commands, with `.env.local` overriding `.env` to match Next.js runtime precedence.
If `DATABASE_URL` / `DIRECT_URL` are still inconsistent, the script also falls back to the currently running PM2 app env so CI deploys match the healthy production runtime.
GitHub Actions now skips `prisma db push` automatically when the release does not change `prisma/schema.prisma` or `prisma/migrations`, so frontend-only deploys are not blocked by an unrelated database sync step.

Current production app base URL:

```text
APP_BASE_URL="http://111.229.24.208"
```

If you change environment variables:

1. SSH into the server
2. Edit `.env` or `.env.local`
3. Rebuild and restart the app

Commands:

```bash
cd /home/ubuntu/Tahoe-Agent
nano .env.local
npm run build
pm2 restart tahoe-agent || pm2 restart tahoe
pm2 save
```

## Useful Server Commands

Check app process:

```bash
pm2 status
```

View app logs:

```bash
pm2 logs tahoe-agent || pm2 logs tahoe
```

Restart app:

```bash
pm2 restart tahoe-agent || pm2 restart tahoe
```

Check nginx:

```bash
sudo systemctl status nginx --no-pager
```

Reload nginx after config changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Check PostgreSQL:

```bash
sudo systemctl status postgresql --no-pager
```

## Quick Health Checks

On the server:

```bash
curl http://127.0.0.1:3000
curl http://127.0.0.1
pm2 status
```

From a browser:

```text
http://111.229.24.208
```

## Emergency Recovery

If a manual server deploy fails with a GitHub TLS error such as `GnuTLS recv error (-110)`, do not stop `pm2` first. Use this order instead:

1. Restore the current process immediately if it is down:

```bash
pm2 restart tahoe-agent || pm2 restart tahoe
```

2. Push the fix to `main` from local.

3. Trigger the GitHub Actions deploy workflow, or push to `main` and let the workflow deploy automatically.

4. Re-check service health:

```bash
pm2 status
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1
```

## First Things To Do Next

1. Bind a real domain name.
2. Configure HTTPS.
3. Rotate any previously exposed secrets and API keys.
4. Keep using GitHub Actions for all future releases.

## Notes

- `scripts/deploy.sh` supports `SKIP_GIT_PULL=1` for CI-driven deployments.
- Production uses the server's local PostgreSQL instance.
- If GitHub Actions succeeds but the site looks stale, check `pm2 logs tahoe-agent || pm2 logs tahoe` and rerun the latest workflow.
