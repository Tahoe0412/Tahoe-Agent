# Decisions

> Key architectural and product decisions. New agents MUST read this before making changes.
> If you disagree with a decision, discuss with the user first — do NOT silently override.

## D-001 Use Serper.dev instead of Google Custom Search
- **Date**: 2026-03-16
- **Reason**: Google Custom Search JSON API returns 403 for new API keys (effectively discontinued for new users). Serper provides equivalent Google search results via a simpler REST API.
- **Impact**: `services/news-search/serper.ts` and `services/web-search/serper-search.service.ts` are the active search providers. Google files (`google.ts`, `google-search.service.ts`) are kept but no longer imported.

## D-002 Use EnvHttpProxyAgent, never ProxyAgent
- **Date**: 2026-03-16
- **Reason**: The Tencent Cloud server needs a proxy (Clash at 127.0.0.1:7890) to reach external APIs. But `ProxyAgent` routes ALL fetch calls through the proxy, including internal Next.js requests (RSC, prefetch, API routes to self). This causes intermittent page crashes.
- **Rule**: Always use `EnvHttpProxyAgent` which respects `NO_PROXY` env var. Internal requests (`localhost`, `127.0.0.1`) bypass the proxy.
- **File**: `instrumentation.ts`

## D-003 No auto-search on page mount
- **Date**: 2026-03-16
- **Reason**: Auto-searching wastes Serper API quota (2,500/month free tier). Results don't change within minutes, so repeated auto-searches on navigation are wasteful. Users should explicitly click "搜索" to initiate.
- **Impact**: Both `trend-discovery-workbench.tsx` and `today-workbench.tsx` pre-fill the search bar with brand keywords but do NOT auto-search.

## D-004 Use 10-minute client-side cache for search results
- **Date**: 2026-03-16
- **Reason**: Same query within 10 minutes returns identical results. Caching avoids redundant API calls when users navigate away and return.
- **Implementation**: `lib/search-cache.ts` — in-memory `Map` with TTL. Resets on full page reload.

## D-005 Vanilla CSS with design tokens, no Tailwind
- **Date**: 2026-03 (original project decision)
- **Reason**: Maximum flexibility and control over the design system. CSS custom properties (`--text-1`, `--surface-solid`, `--accent`, etc.) define the theme.
- **Rule**: Do NOT introduce Tailwind or any CSS framework unless user explicitly requests it.

## D-006 Keep mockMode: false as default
- **Date**: 2026-03-16
- **Reason**: The platform should show real data. Mock mode was only used during early development. Now that Serper is integrated, there's no reason to default to mock.
- **Exception**: User may temporarily request `mockMode: true` if APIs are down.

## D-007 Always update docs/ after completing work
- **Date**: 2026-03-16
- **Reason**: Multi-agent workflow requires persistent external memory. Chat context is lost between sessions. All important changes must be written back to `docs/` files.
- **Rule**: Before finishing any task, update `TASKS.md`, add to `WORKLOG.md`, and update `DECISIONS.md` if any architectural choice changed.
