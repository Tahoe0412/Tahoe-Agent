# Tasks

> Task IDs use format `T-XXX`. Always reference by ID when communicating across agents.

## In Progress

### T-014 Toutiao-First Owned Media Repositioning 🔴
- **Goal**: Reposition Tahoe around a Toutiao-first article/image workflow for the near term, while preserving the existing internal architecture.
- **Business target**:
  - use AI tools and agentic workflows to build an owned-media matrix
  - start from 头条号
  - support both content/ad revenue and service/technical revenue
- **Editorial directions**:
  - AI快讯
  - 全球股市
  - 消费时尚
- **Rules for this phase**:
  - de-prioritize video-first product thinking
  - prioritize article quality, publish packaging, and refined image output
  - keep current internal types (`MARS_CITIZEN` / `MARKETING`) for compatibility instead of starting with a schema rename
- **Current slice (Done)**:
  - user-facing copy for the owned-media line now speaks in article/image-first language on the homepage and project-intent entry surfaces
  - generated project briefs for the owned-media line now default to article/image-first framing instead of short-video framing
  - strategy baseline is now written in `docs/CONTENT_MATRIX_STRATEGY.md`
  - the no-project homepage start surface now reads as an editorial production desk instead of a generic four-card launcher
  - the shared project-creation form now teaches article/image-first input quality and no longer defaults its owned-media copy to short-video language
  - homepage and intent cards now use shorter, less procedural copy instead of explaining the whole workflow inside every card
  - style-reference prompts now explicitly steer users toward 1-3 high-quality Chinese media / blogger samples instead of vague slogans
  - Marketing master-copy generation now includes a “Chinese high-quality media calibration” layer plus a persisted multi-audience review panel
  - owned-media packaging (`VIDEO_TITLE`, `PUBLISH_COPY`) now also carries the same persisted multi-audience review panel in Script Lab, including manually saved versions
  - owned-media main drafts now also backfill a persisted `audience_panel_review` onto `script.structured_output`, and Script Lab keeps showing the latest structured draft + its audience verdict even after scene rows exist
  - the shared project-creation form now includes quick owned-media presets for `AI快讯`, `全球股市`, and `消费时尚`, so users can prefill the brief without manually rewriting the whole context block
  - the same three editorial directions now also exist as shared preset skeletons for Brand Profiles and Brief Studio, so owned-media projects can carry a reusable brand/brief baseline instead of only a one-off create-form prefill
  - Brief Studio now submits schema-safe platform values (`XHS`, `DOUYIN`, `YOUTUBE`, `X`, `TIKTOK`) instead of the older mixed UI-only labels, so presets and manual brief creation no longer risk invalid platform payloads
  - Scene Planner and Render Lab now speak in image-first language on the user-facing surface (`配图说明` / `图片生产`) while still keeping the internal `storyboard` / `render` compatibility model unchanged
  - Scene Planner and Render Lab now carry a lightweight `image brief review` layer that scores each row for readiness before image generation, surfaces the main gap, and nudges users to fix prompt/reference/composition issues before opening a new image job
  - Image Production now also supports structured per-job result feedback (`保留这一版 / 继续重试 / 先改 brief` + issue tags + short note), so real image failures can start feeding back into the planning loop instead of living only in transient chat comments
  - Scene Planner now also reads back recent image-job feedback for the same row, so users can see whether a brief has already been retried or repeatedly sent back for rewrite, plus the current high-frequency failure tags
  - the first-run create path has been hardened again: blank topics no longer generate fake auto-titles, topic changes reset title suggestions cleanly, relative/Chinese `published_at` strings are normalized before persistence, and settings upserts no longer post the removed `serpapi_key` field
  - local end-to-end verification now reaches `health -> create project -> homepage/script-lab/scene-planner` successfully against the local Postgres setup
  - trend scoring now clamps invalid time-derived values to stop `NaN` scores from breaking nested `trend_topics.create()` during project creation
  - full local owned-media chain now runs through `create project -> script rewrite -> image brief -> image task -> image feedback -> title pack -> publish copy`
  - the shared owned-media preset family has now been switched to `AI快讯`, `全球股市`, and `消费时尚`, so the product baseline matches the current three-account plan without changing internal compatibility IDs
  - the near-term operating flow, dual-engine revenue model, strategic edge, account-role split, and 30-day priorities are now written down in `docs/BUSINESS_MODEL.md`, so future product decisions can be tested against one explicit business baseline instead of scattered chat history
  - the near-term product plan for the daily article pipeline is now written down in `docs/DAILY_RUN_PLAN.md`, including the `Daily Run / 每日运行台` proposal, the stage model (`signal -> topic -> draft -> review -> image -> package`), and the recommended next-action logic
  - the first `Daily Run / 每日运行台` shell now exists at `/daily-run`, with a sidebar entry, three account-lane cards, inferred project-stage counts, one computed next action per recent project, and a manual signal panel that lets users search today's topics, mark them `保留 / 忽略`, and start a lane-bound owned-media draft directly from the selected signal before entering `Script Lab`
  - Tahoe has now been dry-run against a real GPT-5.5 topic using only the platform itself: Daily Run signal intake, direct draft start, title-pack generation, publish-copy generation, storyboard/image-brief generation, render-job creation, and render-job feedback all completed against real Serper-backed sources
  - `/api/research/hot-topics` has been fixed to return the API envelope expected by `useHotTopics`, removing the Daily Run `response.data.news` crash
  - packaging audience review is now source-packet-grounded for breaking topics: title and publish-copy reviews receive extracted bullets from the latest script payload instead of evaluating only title strings / highlight strings
  - image-brief review now recognizes strong prompt-embedded camera/composition direction and no longer over-penalizes asset-ready infographic / concept-image rows just because no explicit reference image exists yet
  - AI快讯 master-draft prompting now explicitly forces each change point to land on a reader-perceivable consequence instead of stopping at generic model-upgrade phrasing
  - AI快讯 master-draft prompting has now been upgraded from short-summary generation to Toutiao-first long-form article generation. The prompt now asks for a hook, complete argument arc, source-grounded explanation, 3-5 change points, clear judgment lines, and roughly 1800-2600 Chinese characters when materials support it.
  - the GPT-5.5 dry-run workspace has been cleaned: the best draft was merged into final local project `cmocc5cfq0034s0v59k0ot713`, duplicate GPT5.5 trial projects were archived rather than deleted, a cloud inspection copy was rebuilt as `cmocgo05k0000v6w47xyxcr39`, and `docs/GPT55_ARTICLE_RUNBOOK.md` now records the article-production process for teammates
  - project lists now expose and display `updated_at`; Daily Run and Settings show "最后修改 / Updated", ordinary read models default-hide archived projects, and Settings remains the recovery surface for archived work
  - the `/daily-run` runtime screenshot was checked against a clean `.next` reset and fresh dev server; `/daily-run` returned `200`, so the observed webpack `call` error is treated as stale dev/HMR cache unless it reappears after clean restart
- **Next**:
  - promote the current session-only signal panel into a persisted topic-triage queue, so `Daily Run` can remember which signals were kept, dismissed, drafted, or routed across reloads and machines
  - upgrade the current inferred queue from artifact-count heuristics to a real item-level daily-run status model
  - merge image-brief readiness and recent image-job outcomes into one tighter score, so repeated real failures can directly drag down “可开工”判断
  - add an explicit "article length / depth" control to Daily Run and Script Lab so users can choose short update, standard article, or deep commentary without changing the prompt manually
  - continue sweeping remaining 分镜 references in lower-traffic secondary pages (help-center, workflow-actions, marketing-ops, approval-board)
  - refine each owned-media line's final brand/persona package, especially `消费时尚`, which still needs a tighter runway/brand-analysis voice before the preset should be treated as final

> **2026-04-11 (Antigravity)**: swept remaining video-era terminology from homepage, create form, sidebar, Script Lab, and workspace-mode. All first-run-visible surfaces now say 配图说明 / 图片生产 instead of 配图脚本 / 分镜 / 视觉脚本.

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
- **Current status**: T-010's foundation is in place. Tahoe now has a stable intent model (`contentLine + outputType`), shell-friendly project creation, storyboard-first generation, simplified default UX, the first small generator registry seam, and a first lightweight artifact harness for selected output generators.
- **Artifact harness slice (Done)**: `VIDEO_TITLE`, `PUBLISH_COPY`, and `AD_CREATIVE` generation now attach output-specific knowledge notes and review checklists at generation time, then persist a structured `artifact_review` with the saved artifact. Script Lab and Marketing Ops now surface that stored guidance/review context directly beside the editable artifact, creating a clean seam for future stronger review loops without introducing a heavier multi-agent system yet.
- **Audience-review slice (Done)**: Marketing master-copy generation and saved versions now backfill a second-pass `audience_panel_review` alongside the existing diagnosis. Tahoe simulates four audience archetypes (`feed_scanner`, `skeptical_reader`, `editor`, `sharer`) and stores their scores, likes, concerns, and next actions directly on the saved version payload.
- **Smart project-brief slice (Done)**: Tahoe now has a first automatic project-background layer for `ProjectContext`. New projects get generated defaults for title / introduction / core idea / style reference sample, and the edit UI now exposes a one-click “自动补全项目信息” action that rewrites those fields from the current topic, workspace mode, writing settings, and selected brand. This reduces the need to manually rewrite the brief every time raw collected query strings or materials change.
- **Quality-first model routing slice (Done)**: Default model routing has now been updated to the current preferred split:
  - `gemini-3.1-pro-preview` for core Mars creation / script rewrite
  - `gpt-5.4-mini` for scene classification + asset analysis
  - `gpt-5.4` for report generation + marketing analysis / review
  - `qwen3-max` / `qwen3.5-plus` for Chinese marketing generation and adaptation
- **Model naming + fallback sync slice (Done)**: Settings-page model labels, env examples, and schema defaults are now aligned with the quality-first split. The visible UI now presents the current model generation names more clearly, and new `AppSettings` records default to `gpt-5.4-mini` instead of the old `gpt-4.1-mini`.
- **Remaining push (next)**:
  - Sweep the remaining lower-priority `workspaceMode` compatibility branches in secondary helpers and edge routes, but the main user-facing surfaces are now aligned.
  - Continue moving read models and navigation toward “latest artifact / next output” instead of “which workflow stage are we on”.
  - Decide whether the next quality step should expand this artifact harness to `PLATFORM_COPY`, or deepen the current three outputs with a second-pass model reviewer instead of heuristics alone.
  - Expand the new Chinese-media calibration + audience-panel review layer from Marketing master copy into owned-media article and publish-packaging outputs.
  - Decide whether the next project-brief step should auto-refresh on material ingestion / Today selections as well, so the brief updates itself without requiring the user to click the smart-fill action.
  - Decide whether a lightweight storyboard preview/edit surface should also appear directly inside Marketing Ops, or whether the current bridge card + Scene Planner split is the right long-term boundary.
  - Continue refining Today's artifact-first starts. Marketing copy and ad-storyboard actions now chain shell-project creation and output generation automatically, carry selected materials + keyword focus into project context, and already promote that context in prompt priority. A first lightweight output-quality layer is now in place inside Script Lab and Marketing Ops to detect weak hooks, thin proof, and visually abstract concepts; the next refinement should make those alerts even closer to actual downstream model failure modes.
  - Decide when to split out a separate outer landing page. The current internal homepage is now a clearer task-entry board, but Tahoe may still benefit from a lighter top-level product homepage before users enter the production workspace.
  - Rewrite remaining empty-state / helper copy that still teaches the old “run full workflow first” mental model across artifact pages. Script Lab, Scene Planner, and Render Lab have been updated; other pages should follow the same artifact-first language.
  - Add stronger post-generation feedback so each output area can tell the user what was generated, what is weak, and the best next move. Script Lab and Marketing Ops now have a first feedback layer plus a first quality-alert layer for title hooks, publish-proof density, ad-creative specificity, and scene prompt executability; the next refinement should make those suggestions even more prompt-quality-aware and scene-quality-aware.
  - Coordinate with T-014 so the owned-media line is treated as article/image-first in user-facing copy, while the current internal compatibility types stay stable.
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

### T-005 Configure X/Twitter API ✅
- **Completed**: 2026-03-21
- **Result**: `X_BEARER_TOKEN` configured in `.env.local` and auto-injected during deploy via GitHub Actions. X connector returns real tweet data via X API v2 `tweets/search/recent`.

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

### T-005 Configure X/Twitter API ✅
- **Completed**: 2026-03-21
- **Result**: `X_BEARER_TOKEN` configured in `.env.local` and auto-injected during deploy via GitHub Actions. X connector returns real tweet data via X API v2 `tweets/search/recent`.

### T-012 UI Polish: Clean Typography & Modern Icons ✅
- **Completed**: 2026-03-21
- **Result**: Updated global typography to a mixed editorial system: English body text stays on `Inter`, English display/title text uses `Cinzel`, and Chinese body/display text now consistently falls back to serif Chinese faces led by `Noto Serif SC` / `Songti SC`. Also replaced emojis with Lucide React icons (`Rocket`, `Briefcase`) and softened dashboard border radii and shadows for a more intuitive, cleaner aesthetic.

### T-013 Finance Ops: Cost & Budget Workbook Template ✅
- **Completed**: 2026-03-24
- **Result**: Added a reusable Excel workbook for Tahoe financial planning at `docs/Tahoe_cost_budget_template.xlsx`, plus a generator script `scripts/generate_tahoe_cost_budget_workbook.py`. The workbook includes a README sheet, parameters, unit-cost assumptions, single-project estimator, monthly budget planner, and project ledger so costs can be tracked by production depth and include retry / revision overhead.

### T-014 Homepage First-Run Flow Hardening ✅
- **Completed**: 2026-04-11
- **Result**: Fixed the homepage new-user create path so it no longer fails on hidden schema-constrained defaults. Owned-media presets no longer overwrite the current topic, the form now exposes topic + writing context earlier, and homepage/start-card language is more direct for copy-first users.

### T-015 Local End-to-End Create Flow Hardening ✅
- **Completed**: 2026-04-12
- **Result**: Fixed the remaining local create-flow blockers: empty topics no longer auto-fill misleading project titles, topic changes reset title suggestions, research evidence dates now parse relative Chinese/English strings safely before persistence, settings upsert no longer sends the removed `serpapi_key` field, and trend scoring now sanitizes invalid time-derived values so `trend_topics.create()` no longer fails with a hidden `NaN` score. Local validation now reaches `GET /api/health -> POST /api/projects -> POST /scripts/rewrite -> POST /storyboards/generate -> POST /render-jobs -> PATCH /render-jobs/[jobId] -> POST /generate-output`, with the project pages returning `200`.

### T-016 GPT5.5 Final Package Cleanup and Daily Run Bug Sweep ✅
- **Completed**: 2026-04-24
- **Result**: Fixed the Tahoe lint blockers, excluded unrelated analysis/econometrics folders from product lint, exposed `updated_at` in project read models, hid archived projects by default, added visible last-modified timestamps to Daily Run and Settings, merged the best GPT5.5 draft into final local project `cmocc5cfq0034s0v59k0ot713`, rebuilt a cloud inspection copy as `cmocgo05k0000v6w47xyxcr39`, archived duplicate dry-run projects, and documented the full GPT5.5 article production process in `docs/GPT55_ARTICLE_RUNBOOK.md`.

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
