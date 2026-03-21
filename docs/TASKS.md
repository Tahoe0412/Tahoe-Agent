# Tasks

> Task IDs use format `T-XXX`. Always reference by ID when communicating across agents.

## In Progress

### T-010 Dual Content Line Architecture 🔴
- **Goal**: Restructure system around two content lines: 火星公民 (science content) and Marketing (commercial content).
- **Phase 1 (Done)**: ContentLine/OutputType type system, Mars Citizen narrative prompt, Marketing ad script prompt, branching in `NewsScriptService`, API/hook/schema/orchestrator updates.
- **Foundation slice (Done)**: Added a centralized project-intent resolver so routing is driven by `contentLine + outputType`, while `workspaceMode` is now treated as a compatible UI/workflow hint. News-script generation now dispatches by `outputType`; project create/list/workflow paths normalize the same intent fields.
- **Phase 2 (Done)**: Upgraded project creation UI to choose `contentLine + outputType` first. The system now derives `workspaceMode` from the selected intent, and `sourceScript` is optional so users can create a project shell from topic + intent alone.
- **Phase 3 (Done)**: Storyboard generation can now start directly from project topic + intent. Tahoe first reuses existing scene data when available, otherwise rewrites `raw_script_text` or synthesizes storyboard seed scenes from the project domain context before producing storyboard frames. Newly resolved scenes are also auto-classified and sent through asset-dependency analysis so Scene Planner is immediately usable.
- **Phase 4 (Done)**: Simplified the default UX around first principles. Dashboard now shows one primary next action instead of a multi-panel workflow overview; project creation defaults to minimal inputs; advanced controls stay collapsed; `title` is optional and falls back to `topic`; brief/trend detail remains available but is no longer treated as a universal front-door requirement.
- **Phase 5 (Done)**: Removed the duplicated project-creation path in Settings by reusing the shared `ProjectForm` in compact mode. Added an initial news-script output registry so `OutputType -> Generator` dispatch is explicit for the current news entry (`NARRATIVE_SCRIPT`, `AD_SCRIPT`) instead of living as ad-hoc branching inside one service.
- **Entry sync slice (Done)**: Replaced the old `/?prefill=true...` shortcut with intent-aware dashboard prefill links. Today/Trend entry points now route into the minimal project-create flow with explicit topic + intent prefill, and Today's fact-to-script generation now passes `contentLine + outputType` explicitly instead of silently falling back to `MARS_CITIZEN`.
- **Workflow compatibility slice (Done)**: `WorkflowService` no longer hard-fails when `raw_script_text` is empty. Shell projects can still run trend research and reporting; storyboard outputs now escalate to storyboard generation when appropriate, while script-only outputs return an explicit skipped status instead of crashing.
- **UI language sync slice (Done)**: `Trend Explorer`, `Brief Studio`, `Help Center`, and `WorkflowActions` now describe Tahoe in terms of business line + target output + next artifact, with `workspaceMode` reduced to compatibility plumbing instead of the main user-facing model.
- **Prompt quality slice (Done)**: Prompting is now more output-aware and generation-aware. Marketing copy receives explicit `outputType` instructions, narrative/ad scripts emphasize shot-ready structure, and storyboard generation/seed prompts now include concrete guidance for Nano Banana 2 / Pro, Seedance 2.0, and Veo 3.1 style visual prompting.
- **Project output generator slice (Done)**: Added a unified project-level output generation entry. `PLATFORM_COPY`, `VIDEO_TITLE`, `PUBLISH_COPY`, `AD_CREATIVE`, and `AD_STORYBOARD` can now be triggered through one service/route contract instead of living only as type definitions or scattered capability routes.
- **Output Studio UI slice (Done)**: The dashboard now exposes a compact “Output Studio” surface for the current project. Users can trigger same-line outputs directly from the workspace, and the surrounding header/card styling has been tightened toward a calmer editorial production-desk aesthetic.
- **Artifact review slice (Done)**: Newly generated `VIDEO_TITLE`, `PUBLISH_COPY`, and `AD_CREATIVE` outputs now surface inside their natural workbenches instead of only existing as backend artifacts. Script Lab shows the latest title pack + publish copy; Marketing Ops now shows the latest ad creative brief alongside copy operations; Output Studio redirects these artifacts into the place where they can actually be reviewed.
- **Artifact action slice (Done)**: The new artifact panels now support lightweight in-place actions instead of forcing another workflow hop. Script Lab can copy title packs and publish copy directly; Marketing Ops can copy the current ad creative brief or apply its direction into the master-copy editor as a starting point.
- **Mars packaging edit slice (Done)**: `VIDEO_TITLE` and `PUBLISH_COPY` are now lightly editable inside Script Lab and can be saved as new `strategy_task` versions in place. This keeps Mars Citizen packaging work inside the same polishing surface instead of introducing a separate packaging editor.
- **Marketing creative edit slice (Done)**: `AD_CREATIVE` is now lightly editable inside Marketing Ops and can be saved as a new `strategy_task` version in place. The current ad creative pack is no longer just a read-only brief; it can be revised, copied, and used to seed downstream copy/script work from the same surface.
- **Marketing storyboard bridge slice (Done)**: Marketing Ops now includes a compact ad-storyboard bridge card with current storyboard version/frame readiness, plus direct actions to generate a storyboard or open Scene Planner. This keeps ad creative, ad copy, and ad storyboard visibly connected without duplicating the full planner UI.
- **Today entry alignment slice (Done)**: Today Workbench now maps selected topics and material-basket actions directly into the current artifact system. Quick actions and basket CTAs now point to 火星公民脚本、发布包装、Marketing 文案、广告分镜 instead of older generic script/copy/image buckets.
- **Homepage task-entry slice (Done)**: The current homepage now behaves more like a clear start screen when no project is selected. Instead of dropping users straight into form fields, it first presents four obvious task paths: go to Today, start a 火星公民 project, start a Marketing project, or continue the most recent project.
- **Flow-map slice (Done)**: Added a user-facing flow map in `docs/USER_FLOW.md` that defines the product principle, two main business-line flows, page responsibilities, current routing rules, and the highest-value friction points. This is now the baseline reference before we change prompts, page entry states, or next-step behavior again.
- **Current status**: T-010's foundation is in place. Tahoe now has a stable intent model (`contentLine + outputType`), shell-friendly project creation, storyboard-first generation, simplified default UX, and the first small generator registry seam.
- **Remaining push (next)**:
  - Sweep the remaining lower-priority `workspaceMode` compatibility branches in secondary helpers and edge routes, but the main user-facing surfaces are now aligned.
  - Continue moving read models and navigation toward “latest artifact / next output” instead of “which workflow stage are we on”.
  - Decide whether a lightweight storyboard preview/edit surface should also appear directly inside Marketing Ops, or whether the current bridge card + Scene Planner split is the right long-term boundary.
  - Continue refining Today's artifact-first starts. Marketing copy and ad-storyboard actions now chain shell-project creation and output generation automatically, carry selected materials + keyword focus into project context, and already promote that context in prompt priority. A first lightweight output-quality layer is now in place inside Script Lab and Marketing Ops to detect weak hooks, thin proof, and visually abstract concepts; the next refinement should make those alerts even closer to actual downstream model failure modes.
  - Decide when to split out a separate outer landing page. The current internal homepage is now a clearer task-entry board, but Tahoe may still benefit from a lighter top-level product homepage before users enter the production workspace.
  - Rewrite remaining empty-state / helper copy that still teaches the old “run full workflow first” mental model across artifact pages. Script Lab, Scene Planner, and Render Lab have been updated; other pages should follow the same artifact-first language.
  - Add stronger post-generation feedback so each output area can tell the user what was generated, what is weak, and the best next move. Script Lab and Marketing Ops now have a first feedback layer plus a first quality-alert layer for title hooks, publish-proof density, ad-creative specificity, and scene prompt executability; the next refinement should make those suggestions even more prompt-quality-aware and scene-quality-aware.
- **Files (new)**: `lib/content-line.ts`, `lib/mars-citizen-prompt.ts`, `lib/ad-script-prompt.ts`, `lib/project-intent.ts`, `lib/storyboard-seed-prompt.ts`, `components/dashboard/project-intent-picker.tsx`, `components/workspace/generate-storyboard-button.tsx`
- **Files (modified)**: `services/news-script.service.ts`, `hooks/use-generate-script.ts`, `app/api/scripts/generate-from-news/route.ts`, `schemas/project.ts`, `services/research-orchestrator.service.ts`, `app/api/projects/route.ts`, `services/workflow.service.ts`, `services/promotional-copy.service.ts`, `services/workspace-query.service.ts`, `components/dashboard/project-form.tsx`, `components/settings/project-manager.tsx`, `services/storyboard-generator.service.ts`, `app/scene-planner/page.tsx`, `app/script-lab/page.tsx`, `app/render-lab/page.tsx`, `app/page.tsx`, `lib/workflow-navigator.ts`, `services/news-script-generator-registry.ts`

## Pending

### T-011 Future Architecture Blueprint (Planning Only)
- **Problem**: Tahoe now needs a clear long-term direction, but the team does not want future-looking architecture ideas to disrupt current execution.
- **Goal**: Record the long-term evolution path in a durable blueprint without turning it into the current implementation queue.
- **Scope**:
  - Future direction 1: move toward stronger review loops / agentic orchestration over time
  - Future direction 2: move toward multimodal brand memory / retrieval over time
  - Keep current sprint scope narrow: content quality, prompt quality, artifact-first UX, and cleaner flow
- **Important constraint**:
  - This is a planning task, not an active implementation task
  - Do **not** treat it as authorization to pause current product cleanup and start a large multi-agent or vector-platform build
- **Reference**: `docs/FUTURE_BLUEPRINT.md`

### T-005 Configure X/Twitter API
- **Problem**: X connector fails with connection error — no API credentials
- **Goal**: Set up Twitter API v2 credentials for tweet search
- **Acceptance**:
  - Trend search returns X/Twitter post results
  - Error messages no longer appear for X platform

### T-009 Expand Hot Topics with China-Focused Indexed Search
- **Problem**: Current hot-topics search is biased toward US/English results because Serper requests use `gl: "us"` and `hl: "en"`. Tahoe lacks reliable domestic evidence sources for Chinese trend discovery.
- **Goal**: Increase mainland China trend coverage without introducing fragile scrapers or unsupported "official search APIs".
- **Recommended approach**:
  - Keep Serper as the base provider; do **not** pivot to unverified Baidu/Sogou/360 "search APIs"
  - Add CN-oriented Serper configuration (`gl: "cn"`, `hl: "zh-cn"`) for Chinese topic discovery
  - Add scoped indexed search for public platform pages and sites, e.g. `site:xiaohongshu.com`, `site:douyin.com`, and selected Chinese news/community domains
  - Feed these results into the hot-topics aggregation pipeline as lower-confidence indexed evidence, distinct from first-party platform connector data
- **Acceptance**:
  - Chinese queries return more Chinese-language evidence in `/api/research/hot-topics`
  - Hot-topic results can include indexed Douyin/XHS public pages without scraping
  - Response metadata clearly distinguishes indexed/search-derived evidence from native platform connector evidence
  - No global proxy changes, no scrapers, no Tailwind, no mock-by-default regressions

## Done

### T-012 UI Polish: Clean Typography & Modern Icons ✅
- **Completed**: 2026-03-21
- **Result**: Updated font stack to `Inter`, replaced emojis with Lucide React icons (`Rocket`, `Briefcase`), and softened dashboard border radii and shadows for a more intuitive, cleaner aesthetic.

### T-007 UI/UX Enhancement (Phase 1–3) ✅
- **Completed**: 2026-03-16
- **Result**: Tahoe brand tokens, dark mode fix, tag-based search, sidebar improvements

### T-008 Auto-Storyboard Generation (Step 1) ✅
- **Completed**: 2026-03-17
- **Result**: Auto-storyboard from ScriptScenes via LLM

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
