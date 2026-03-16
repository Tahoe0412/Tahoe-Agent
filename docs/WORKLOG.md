# Worklog

> Concise handoff records. Each entry should help the next agent pick up immediately.
> Keep entries short — focus on what changed, why, and what's left.

---

## 2026-03-16 16:25 — Agent: Antigravity (Claude)

### Architecture Optimization: Phase 1 (Hook Extraction)

**Changes**:
- Created `hooks/use-hot-topics.ts` to encapsulate identical API request logic (`/api/research/hot-topics`), caching, and loading/error states.
- Refactored `components/today/today-workbench.tsx` to use the new hook. Removed ~80 lines of inline API calls and raw state.
- Refactored `components/trend-discovery/trend-discovery-workbench.tsx` similarly (185 lines -> 120 lines).

### Architecture Optimization: Phase 2 (Component Splitting)

**Changes**:
- Split `components/today/today-workbench.tsx` into smaller, focused view components: `TodayQuickActions` and `TodayRecentProjects`.
- `TodayWorkbench` size reduced from ~570 lines to ~395 lines.

**Reason**: The UI components were "fat", directly mixing view rendering with complex fetch and cache logic, which made them hard to maintain.

**Remaining**:
- (Phase 3) Cleanup business/routing logic (`workflow-navigator`).

### Architecture Optimization: Phase 3 (Logic Extraction)

**Changes**:
- Created `lib/workflow-navigator.ts` with `getDashboardNextStep` logic.
- Removed the 45-line inline routing/business logic from `app/page.tsx` (Dashboard).

**Reason**: This logic was a brittle collection of nested if-statements embedded in a Server Component. Moving it to a dedicated stateless utility prepares it for future unit testing and keeps the page component focused on data fetching and rendering.

**Conclusion**: The minimal but effective refactoring plan covering API extraction, fat component splitting, and routing logic extraction is complete.

---

## 2026-03-16 16:08 — Agent: Antigravity (Claude)

### Task: T-006 Add cache-busting for deploys

**Changes**:
- Created `components/chunk-reload-script.tsx` — inline script that catches `ChunkLoadError` and auto-reloads once
- Modified `app/layout.tsx` — added `<ChunkReloadScript />` after `<ThemeScript />`

**Root cause**: Static assets already had correct `immutable` cache headers. The real issue was stale HTML pages referencing chunk files deleted after redeploy.

**Remaining**: None. Deploy to verify in production.

---

## 2026-03-16 16:01 — Agent: Antigravity (Claude)

### Task: T-004 Configure YouTube Data API

**Changes**:
- Modified `.env.local` — populated `YOUTUBE_API_KEY` with real key (was empty, overriding `.env`)
- Also fixed empty overrides for `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`

**Root cause**: `.env.local` had `YOUTUBE_API_KEY=""` which overrode the real key in `.env`. Next.js gives `.env.local` higher priority. `getPlatformApiKey()` returns null for empty strings → `CONFIG_MISSING`.

**Remaining**: None for this task. YouTube connector was already fully implemented.

---

## 2026-03-16 15:45 — Agent: Antigravity (Claude)

### Task: T-003 Remove auto-search and add result caching
**Commit**: `5a57f8f`

**Changes**:
- Created `lib/search-cache.ts` — 10-min TTL in-memory cache
- Modified `components/trend-discovery/trend-discovery-workbench.tsx` — removed auto-search `useEffect`, added cache
- Modified `components/today/today-workbench.tsx` — same changes
- Updated subtitle text: "自动搜索中" → "点击搜索开始"

**Reason**: User requested no auto-search to save API quota and avoid redundant calls.

**Remaining**: None for this task.

---

## 2026-03-16 15:35 — Agent: Antigravity (Claude)

### Task: Add Today Workbench to sidebar
**Commit**: `37fc76d`

**Changes**:
- Modified `components/dashboard/sidebar.tsx` — added `/today` nav item with `CalendarDays` icon in explore group

**Reason**: Today page existed but had no sidebar entry.

---

## 2026-03-16 15:10 — Agent: Antigravity (Claude)

### Task: T-002 Fix mockMode and deployment issues
**Commits**: `c0a86ed`, `38d3d3c`

**Changes**:
- `components/trend-discovery/trend-discovery-workbench.tsx` — changed `mockMode: true` → `false`
- `instrumentation.ts` — replaced `ProxyAgent` with `EnvHttpProxyAgent`, added `NO_PROXY` defaults

**Reason**:
- mockMode was hardcoded to `true`, so all searches returned fake data
- ProxyAgent routed internal Next.js requests through Clash proxy, causing intermittent "页面加载失败"

**Remaining**: Users with cached old JS bundles need to clear browser cache manually.

---

## 2026-03-16 (earlier) — Agent: Antigravity (Claude)

### Task: T-001 Replace Google Custom Search with Serper.dev
**Commit**: `b21bb00`

**Changes**:
- Created `services/news-search/serper.ts` — Serper news search provider
- Created `services/web-search/serper-search.service.ts` — Serper web search service
- Modified `services/news-search/index.ts` — switched import to Serper
- Modified `app/api/research/web-search/route.ts` — switched to SerperSearchService
- Modified `services/app-settings.service.ts` — added `serperApiKey`
- Modified `prisma/schema.prisma` — added `serper_api_key` field
- Modified `.env` — added `SERPER_API_KEY`

**Reason**: Google Custom Search JSON API discontinued (returns 403 for new keys).

**Remaining**: YouTube and X connectors still need real API keys (T-004, T-005).

**Next Agent**:
- Check `services/news-search/serper.ts` for news search implementation
- Check `services/web-search/serper-search.service.ts` for web search
- The old Google files exist but are unused
