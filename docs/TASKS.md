# Tasks

> Task IDs use format `T-XXX`. Always reference by ID when communicating across agents.

## In Progress

_(none currently)_

## Pending

### T-005 Configure X/Twitter API
- **Problem**: X connector fails with connection error — no API credentials
- **Goal**: Set up Twitter API v2 credentials for tweet search
- **Acceptance**:
  - Trend search returns X/Twitter post results
  - Error messages no longer appear for X platform

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

### T-004 Configure YouTube Data API ✅
- **Completed**: 2026-03-16
- **Root cause**: `.env.local` had `YOUTUBE_API_KEY=""` (empty), overriding the real key in `.env`. Next.js gives `.env.local` higher priority.
- **Fix**: Populated real API key in `.env.local`; also fixed empty overrides for OpenAI, Gemini, DeepSeek, and Qwen keys
- **Files**: `.env.local`
- **Result**: YouTube connector returns real video data with titles, URLs, view counts, and likes

### T-006 Add cache-busting for deploys ✅
- **Completed**: 2026-03-16
- **Root cause**: Static assets already had correct `Cache-Control: immutable` headers. The real issue was stale HTML referencing deleted chunk files after redeployment → unhandled `ChunkLoadError` → white screen.
- **Fix**: Added `ChunkReloadScript` in root layout that catches `ChunkLoadError` and auto-reloads once (uses `sessionStorage` to prevent loops).
- **Files**: `components/chunk-reload-script.tsx` (new), `app/layout.tsx`
