# Worklog

> Concise handoff records. Each entry should help the next agent pick up immediately.
> Keep entries short — focus on what changed, why, and what's left.

---

## 2026-03-17 09:23 — Agent: Antigravity (Claude)

### Auto-Storyboard Generation (Step 1)

**Changes**:
- **`services/storyboard-generator.service.ts`** (new): Core service that reads ScriptScenes from a project, sends them to LLM with rich prompts, and produces StoryboardFrames with `visual_prompt`, `camera_plan`, `motion_plan`, `narration_text`, and production metadata. Falls back to mock data when LLM unavailable.
- **`services/storyboard-generator/json-schema.ts`** (new): JSON Schema defining the structured LLM output for storyboard frames.
- **`app/api/projects/[id]/storyboards/generate/route.ts`** (new): POST endpoint to trigger auto-generation. Accepts optional `{ script_id }` body.

**Reason**: Closes the gap between script rewrite (Stage 2) and storyboard planning (Stage 3). Previously, users had to manually create every storyboard frame. Now one API call generates a complete storyboard from script scenes.

**No schema changes**: Storyboard already had `script_id` FK, StoryboardFrame already had `script_scene_id` FK. All fields existed.

**Remaining**: Image/video generation (Step 2), video composition (Step 3), Douyin/XHS search coverage — all deferred per user request.

---

## 2026-03-16 18:35 — Agent: Antigravity (Claude)

### UI/UX Refactoring: Phase 3 (Dark Mode Fix, Search Redesign, Brand Cleanup)

**Changes**:
- **`app/globals.css`**: Extracted all hardcoded white gradient overlay opacities into CSS variables (`--bg-glow-opacity`, `--panel-glow-opacity`, `--panel-muted-glow`, `--input-glow`, `--pill-glow`). In dark mode, these are set to near-zero, eliminating the washed-out gray background. Darkened `--border` from `#24364A` → `#1E2D40` for subtler edge contrast.
- **`components/today/today-workbench.tsx`**: Redesigned the search bar from a raw OR-string input to a tag-based keyword display. Keywords appear as removable tag chips; a separate inline input allows adding new keywords via Enter. Bottom bar shows keyword count + search button. No duplicate content.
- **`components/settings/theme-settings.tsx`**: Replaced "莫兰迪" branding with "Tahoe" in theme option hint text.
- **`app/settings/page.tsx`**: Removed last "莫兰迪" reference in Theme panel description.

**Reason**: Dark mode was fundamentally broken by hardcoded white gradient overlays that washed out all panel/border contrast. The OR query string was visually cluttered and lacked add/remove UX. "莫兰迪" branding was outdated after the Tahoe rebrand.

**Remaining**: Dark mode and search UX now stable. No further UI phases planned unless user requests.

---

## 2026-03-16 18:10 — Agent: Antigravity (Claude)

### UI/UX Refactoring: Phase 2 (Component Alignment & Token Unification)

**Changes**:
- **`components/today/today-quick-actions.tsx`**: Replaced hardcoded Tailwind color gradients (`from-blue-500/20`, `from-purple-500/20`, `from-emerald-500/20`) with Tahoe token-based equivalents (`var(--sage)`, `var(--terracotta)`, `var(--accent)`). Tightened border-radius from `rounded-2xl`/`rounded-[24px]` to `rounded-xl`.
- **`components/today/today-recent-projects.tsx`**: Replaced hardcoded `emerald-500/15` and `blue-500/15` status chips with `var(--ok-bg/text)` and `var(--accent-soft/accent)`. Added hover shadow.
- **`components/today/today-workbench.tsx`**: Fixed broken `--warning-text`/`--warning-bg` references (→ `--warn-text`/`--warn-bg`). Replaced all hardcoded emerald/amber/red/orange Tailwind colors with Tahoe tokens. Cleaned up old earthy `rgba(145,108,43,...)` shadow remnants. Replaced orange heat badges with accent token.
- **`components/dashboard/sidebar.tsx`** (via Phase 1 hotfix): Replaced 8 hardcoded accent RGBA values with CSS variable references.
- **`app/globals.css`** (via sidebar hotfix): Added `color: var(--sidebar-text)` to `.theme-sidebar` to fix Tailwind v4 `@layer utilities` specificity issue.

**Reason**: Establish complete visual consistency across all Today workspace modules and ensure the Tahoe design tokens are the single source of truth for all colors.

**Remaining**: T-007 Phase 1 & 2 complete. No further UI/UX phases planned unless user requests.

---

## 2026-03-16 17:00 — Agent: Antigravity (Claude)

### UI/UX Refactoring: Phase 1 (Tahoe Brand & Search Command Center)

**Changes**:
- **`app/globals.css`**: Completely mapped the `:root` and `[data-theme="dark"]` design tokens to the new "Lake Tahoe" brand palette requested by the user, focusing on cool blues (`#0F3D5E`, `#5FA8D3`) and a crisp Accent (`#22B8CF`). Maintained all existing token semantics to ensure zero breakage.
- **`components/today/today-workbench.tsx`**: Redesigned Block 1 (Today's Hot Topics) into a unified "Command Center".
  - Merged the "Keyword Pool" `<select>` and the main `<input>` into an inline, Linearesque container with a continuous `focus-within` ring.
  - Replaced excessively large border radii (`rounded-[24px]`) with sharper `rounded-2xl` and `rounded-xl` tokens to increase professional tool feel.
  - Ensured the original boolean query string mechanism remains fully editable and unchanged.

**Reason**: Elevate the UI from a "developer demo" to a "production-ready pro tool" via layout, typography, and spacing refinements without touching core routing or API logic.

**Remaining**:
- (Phase 2) Apply unified hover interactions and styling alignment to the Quick Actions and Recent Projects blocks.

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
