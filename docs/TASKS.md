# Tasks

> Task IDs use format `T-XXX`. Always reference by ID when communicating across agents.

## In Progress

_(none currently)_

## Pending

### T-004 Configure YouTube Data API
- **Problem**: YouTube connector returns 0 results because no API key is configured
- **Goal**: Add YouTube Data API v3 key, configure the connector to fetch real video data
- **Acceptance**:
  - Trend search returns YouTube video results
  - Video titles and URLs are real, not mock
  - API key stored securely in `.env.local`

### T-005 Configure X/Twitter API
- **Problem**: X connector fails with connection error — no API credentials
- **Goal**: Set up Twitter API v2 credentials for tweet search
- **Acceptance**:
  - Trend search returns X/Twitter post results
  - Error messages no longer appear for X platform

### T-006 Add cache-busting headers to Next.js
- **Problem**: After server deploys, users see "页面加载失败" because browser caches old JS chunks
- **Goal**: Add proper `Cache-Control` headers for `/_next/static/` assets
- **Acceptance**:
  - Users don't need to manually clear cache after deploys
  - JS chunks use content-hash filenames (already the case, but verify)

## Done

### T-001 Replace Google Custom Search with Serper.dev ✅
- **Completed**: 2026-03-16
- **Commit**: `b21bb00`
- **Files**: `services/news-search/serper.ts`, `services/web-search/serper-search.service.ts`, `services/news-search/index.ts`, `app/api/research/web-search/route.ts`, `services/app-settings.service.ts`, `prisma/schema.prisma`, `.env`

### T-002 Fix mockMode and deployment issues ✅
- **Completed**: 2026-03-16
- **Commits**: `c0a86ed`, `38d3d3c`
- **Root causes**:
  - `mockMode: true` hardcoded in `trend-discovery-workbench.tsx`
  - `ProxyAgent` routing ALL fetch through Clash (including internal requests)
- **Fixes**: Set `mockMode: false`, replaced `ProxyAgent` with `EnvHttpProxyAgent`

### T-003 Remove auto-search and add result caching ✅
- **Completed**: 2026-03-16
- **Commit**: `5a57f8f`
- **Files**: `lib/search-cache.ts` (new), `components/trend-discovery/trend-discovery-workbench.tsx`, `components/today/today-workbench.tsx`
- **Result**: No auto-search on mount, 10-minute in-memory cache for search results
