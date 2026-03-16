# Changelog

All notable changes to this project will be documented in this file.
Format: `[Date] [Commit] — Summary`

---

## 2026-03-16

### fix: use EnvHttpProxyAgent to avoid proxying internal requests (`38d3d3c`)
- **File**: `instrumentation.ts`
- **Problem**: `ProxyAgent` routed ALL `fetch()` calls through the Clash proxy (`127.0.0.1:7890`), including Next.js internal requests (RSC data fetching, route prefetching, etc.). This caused intermittent "页面加载失败" errors — pages would load sometimes but crash on navigation or button clicks.
- **Fix**: Replaced `ProxyAgent` with `EnvHttpProxyAgent`, which respects the `NO_PROXY` environment variable. Internal requests (`localhost`, `127.0.0.1`, private IPs) now bypass the proxy, while external API calls (Serper, YouTube, Gemini, etc.) still route through Clash.

### fix: disable hardcoded mockMode in trend discovery workbench (`c0a86ed`)
- **File**: `components/trend-discovery/trend-discovery-workbench.tsx`
- **Problem**: `mockMode` was hardcoded to `true`, so the trend explorer always returned mock/placeholder data instead of real search results.
- **Fix**: Changed `mockMode: true` → `mockMode: false` on line 59.

### feat: replace Google Custom Search with Serper.dev (`b21bb00`)
- **Files**:
  - `services/news-search/serper.ts` — **[NEW]** Serper news search provider
  - `services/web-search/serper-search.service.ts` — **[NEW]** Serper web search service
  - `services/news-search/index.ts` — Switched from Google to Serper provider
  - `app/api/research/web-search/route.ts` — Switched from GoogleSearchService to SerperSearchService
  - `services/app-settings.service.ts` — Added `serperApiKey` to `EffectiveAppSettings`
  - `prisma/schema.prisma` — Added `serper_api_key` field to `AppSettings` model
  - `.env` — Added `SERPER_API_KEY` and `NEWS_SEARCH_PROVIDER`
- **Problem**: Google Custom Search JSON API was discontinued (returns 403 for new API keys). The project had no working news/web search.
- **Fix**: Integrated Serper.dev as a drop-in replacement. Serper provides Google search results via a simpler POST API. Both news search (`/news` endpoint) and web search (`/search` endpoint) are supported.
- **API Key**: Stored in `SERPER_API_KEY` env var. Free tier: 2,500 queries/month.

---

## Deployment Notes

### Server Environment
- **Server**: Tencent Cloud (`111.229.24.208`)
- **Node.js**: v20.20.1
- **PM2 app name**: `tahoe` (legacy) or `tahoe-agent` (primary)
- **Database**: PostgreSQL at `localhost:5432`, database `ai_video_mvp`
- **Proxy**: Clash/Mihomo at `127.0.0.1:7890` for accessing Google/YouTube/OpenAI from mainland China

### Deploy Command (manual)
```bash
cd /home/ubuntu/Tahoe-Agent && git pull origin main && rm -rf .next && npm run build && pm2 restart tahoe --update-env
```

### Required Server Environment Variables (`.env.local`)
```
HTTPS_PROXY=http://127.0.0.1:7890
SERPER_API_KEY=<your-key>
NO_PROXY=localhost,127.0.0.1,10.*,172.16.*,192.168.*
```

### Common Pitfalls
1. **After adding Prisma schema fields**: Must run `npx prisma db push --accept-data-loss` on the server
2. **After `rm -rf node_modules`**: Must run `npm ci` before `npm run build`
3. **Global proxy dispatcher**: Never use `ProxyAgent` globally — use `EnvHttpProxyAgent` with `NO_PROXY` to skip internal requests
4. **CI/CD auto-deploy**: GitHub Actions workflow `Deploy To Tencent Cloud` handles deploys on push to `main`. If it fails, manual deploy is needed.
