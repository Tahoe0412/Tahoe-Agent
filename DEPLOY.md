# Deploy Guide

This project is deployed on Tencent Cloud Lighthouse and is no longer dependent on Vercel or Supabase for production runtime.

## Current Production Setup

- Server: Tencent Cloud Lighthouse
- Public IP: `111.229.24.208`
- App directory: `/home/ubuntu/Tahoe-Agent`
- Runtime user: `ubuntu`
- Process manager: `pm2`
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
git pull origin main          # skipped in CI deploy when SKIP_GIT_PULL=1
npm ci
npm run build
npx prisma db push
pm2 restart tahoe-agent
pm2 save
```

## Server Environment

Production `.env` lives on the server here:

```text
/home/ubuntu/Tahoe-Agent/.env
```

Current production app base URL:

```text
APP_BASE_URL="http://111.229.24.208"
```

If you change environment variables:

1. SSH into the server
2. Edit `.env`
3. Rebuild and restart the app

Commands:

```bash
cd /home/ubuntu/Tahoe-Agent
nano .env
npm run build
pm2 restart tahoe-agent
pm2 save
```

## Useful Server Commands

Check app process:

```bash
pm2 status
```

View app logs:

```bash
pm2 logs tahoe-agent
```

Restart app:

```bash
pm2 restart tahoe-agent
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

## First Things To Do Next

1. Bind a real domain name.
2. Configure HTTPS.
3. Rotate any previously exposed secrets and API keys.
4. Keep using GitHub Actions for all future releases.

## Notes

- `scripts/deploy.sh` supports `SKIP_GIT_PULL=1` for CI-driven deployments.
- Production currently uses the server's local PostgreSQL instance, not Supabase.
- If GitHub Actions succeeds but the site looks stale, check `pm2 logs tahoe-agent` and rerun the latest workflow.
