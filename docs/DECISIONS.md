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

## D-008 Dual Content Line Architecture (ContentLine × OutputType)
- **Date**: 2026-03-19
- **Reason**: The system needs to serve two distinct audiences: public-facing science content (火星公民) and enterprise marketing content. Different prompt templates, output structures, and tone parameters are required.
- **Impact**: New `ContentLine` type (`MARS_CITIZEN` / `MARKETING`) is the top-level classification. `WorkspaceMode` is preserved as a sub-type. `OutputType` defines 9 specific deliverables across both lines.
- **Rule**: Every new project must carry a `content_line` in its metadata. Script generation prompts MUST branch by `ContentLine`. Old projects default to `MARS_CITIZEN`.
- **Files**: `lib/content-line.ts`, `lib/mars-citizen-prompt.ts`, `lib/ad-script-prompt.ts`, `services/news-script.service.ts`

## D-009 Resolve Project Intent Centrally
- **Date**: 2026-03-19
- **Reason**: Tahoe is evolving into one shared content-production base serving two business domains. Ad-hoc checks against raw `workspace_mode` in different services were causing routing drift and would make future output types expensive to add.
- **Impact**: `contentLine` is now the primary domain boundary, `outputType` is the requested artifact, and `workspaceMode` is a compatible UI/workflow hint. Explicit user input should be validated strictly; persisted metadata should be resolved leniently with fallback defaults so legacy projects still load safely.
- **Rule**: New routing logic should use `resolveProjectIntent(...)` / `resolveProjectIntentFromMetadata(...)` instead of reading `metadata.workspace_mode` or `metadata.content_line` ad hoc. Workflow branching should prefer `contentLine`; `workspaceMode` remains a presentation/detail layer.
- **Files**: `lib/project-intent.ts`, `services/news-script.service.ts`, `services/workflow.service.ts`, `services/promotional-copy.service.ts`, `services/workspace-query.service.ts`, `app/api/projects/route.ts`

## D-010 Project Creation Is Intent-First; Source Script Is Optional
- **Date**: 2026-03-20
- **Reason**: Users should be able to start from a business line and target artifact even when they only have a topic, a brief idea, or a marketing direction. Requiring a fully formed `sourceScript` at create time blocked the new intent-first workflow.
- **Impact**: Project creation now starts with `contentLine + outputType`. `workspaceMode` is derived from the selected intent. `sourceScript` is optional; when omitted, Tahoe creates a project shell and skips initial user-script version creation.
- **Rule**: New project-entry UI should ask for business line and target output first. Do not reintroduce a hard `sourceScript` requirement into create flows unless a route genuinely needs raw script text to operate.
- **Files**: `components/dashboard/project-form.tsx`, `components/settings/project-manager.tsx`, `schemas/project.ts`, `services/research-orchestrator.service.ts`, `lib/project-intent.ts`, `components/dashboard/project-intent-picker.tsx`

## D-011 Storyboard Generation Can Seed Scenes From Project Intent
- **Date**: 2026-03-20
- **Reason**: After project creation became shell-friendly, keeping storyboard generation dependent on a pre-existing narrative script would preserve the old single-path workflow and block storyboard-first outputs.
- **Impact**: `POST /api/projects/[id]/storyboards/generate` now resolves scene input in priority order: requested script, latest AI rewrite, latest sceneful script, project `raw_script_text` via rewrite, then direct topic/domain-based storyboard seed scenes. Newly resolved scenes are auto-classified and sent through asset analysis before storyboard frames are persisted. Scene Planner also exposes a direct trigger for this path.
- **Rule**: Storyboard-capable outputs must not fail solely because a project skipped the narrative-script step. Prefer reusing real scene data when it exists, but extend the seed-prompt layer instead of reintroducing a hard script prerequisite.
- **Files**: `services/storyboard-generator.service.ts`, `lib/storyboard-seed-prompt.ts`, `components/workspace/generate-storyboard-button.tsx`, `app/scene-planner/page.tsx`, `app/script-lab/page.tsx`, `app/render-lab/page.tsx`

## D-012 Default UX Should Be Minimal-First
- **Date**: 2026-03-20
- **Reason**: Users care about getting to a usable script, storyboard, or marketing draft quickly. Exposing every internal workflow stage on the first screen increases cognitive load without improving output quality.
- **Impact**: Dashboard now defaults to one primary next action plus a compact status view. Project creation defaults to `contentLine + outputType + topic + optional seed`; advanced controls remain available but collapsed. `title` is optional and should fall back to the topic during project creation.
- **Rule**: New entry flows should only expose inputs that materially change the first usable output. Briefs, trend review, reporting, and deeper controls should be treated as optional supporting context unless a route truly cannot operate without them.
- **Files**: `app/page.tsx`, `lib/workflow-navigator.ts`, `components/dashboard/project-form.tsx`, `components/settings/project-manager.tsx`, `schemas/project.ts`, `services/research-orchestrator.service.ts`, `lib/project-intent.ts`

## D-013 Reuse Shared Project Creation UI; Grow Generators by Registry
- **Date**: 2026-03-20
- **Reason**: Dashboard and Settings had started to diverge into two create-project implementations, which would make every future create-flow simplification twice as expensive. At the same time, output-type execution needs a path away from large service-local branching.
- **Impact**: Settings now reuses the shared `ProjectForm` in compact mode, so project creation behavior is defined in one component/submit path. News-script generation now uses an explicit registry for currently supported output types, establishing the pattern for future `OutputType -> Generator` growth.
- **Rule**: Do not create new independent project-creation forms unless a route truly needs a different input contract. When adding new artifact generators, prefer registering a new handler over extending one long chain of `if/else` checks inside an existing service.
- **Files**: `components/dashboard/project-form.tsx`, `components/settings/project-manager.tsx`, `services/news-script.service.ts`, `services/news-script-generator-registry.ts`
