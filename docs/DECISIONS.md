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

## D-014 Future Roadmap: Prioritize Review Loops and Brand Memory, But Keep Current Focus Narrow
- **Date**: 2026-03-21
- **Reason**: Tahoe needs a clear long-term evolution path toward stronger creative intelligence and enterprise-grade brand alignment. However, those goals should not hijack the current sprint or trigger premature large-scale rewrites.
- **Impact**: The long-term blueprint now explicitly points toward two major future directions:
  - stronger agentic behavior via structured review / critique loops before large-scale multi-agent expansion
  - multimodal brand memory / retrieval before enterprise-grade style alignment claims
- **Rule**:
  - treat multi-agent coordination and multimodal RAG as **future-direction architecture**, not the current build scope
  - current execution should remain focused on output quality, prompt quality, artifact-first UX, and cleaner flow
  - near-term changes are encouraged when they create clean seams for later evaluation, retrieval, or agentic orchestration, but not when they derail the active product cleanup
- **Files**: `docs/FUTURE_BLUEPRINT.md`, `docs/TASKS.md`, `docs/PROJECT_STATE.md`

## D-015 Artifact Generators Should Carry Their Own Lightweight Knowledge + Review Harness
- **Date**: 2026-03-23
- **Reason**: Tahoe is starting to outgrow one large implicit prompt per artifact. We want a clean path toward stronger review loops and output-specific guidance without prematurely introducing a heavier multi-agent runtime.
- **Impact**: Selected project-level generators now attach output-specific `knowledge_notes` and `review_checklist` guidance at generation time, then persist a structured `artifact_review` summary with the saved artifact. The workbenches surface that stored context directly next to the editable artifact so users can see both “how to write this output” and “what still looks weak”.
- **Rule**:
  - when adding or upgrading artifact generators, prefer a small output-specific harness layer over burying all rules inside one long prompt
  - persist review context with the artifact when possible so downstream workbenches and future review passes can reuse it
  - treat this as a lightweight seam for future stronger review models, not as justification to build a large autonomous multi-agent workflow right now
- **Files**: `lib/output-artifact-guidance.ts`, `lib/output-artifact-prompt.ts`, `services/project-output-generator.service.ts`, `components/workspace/script-lab-workbench.tsx`, `components/workspace/marketing-ops-workbench.tsx`

## D-016 Project Background Should Default to Smart Brief Generation, Not Blank Manual Fields
- **Date**: 2026-03-23
- **Reason**: Raw collected queries and material baskets are useful as source inputs, but they often make poor user-facing project names, themes, and project introductions. Requiring the user to manually rewrite those fields after every research pass creates repeated friction.
- **Impact**: Tahoe now derives a first-pass project brief from the current topic, workspace mode, writing settings, and selected brand. New project creation can seed generated defaults, and `ProjectContext` can auto-fill cleaner title/topic/introduction/core-idea/style-sample fields instead of showing empty or low-quality raw values.
- **Rule**:
  - prefer generated project-brief defaults over exposing blank metadata fields
  - treat raw search queries / collected material strings as source inputs, not necessarily the best final project-facing title/topic copy
  - preserve manual editing, but make “smart fill then lightly adjust” the default workflow
- **Files**: `lib/project-brief.ts`, `services/research-orchestrator.service.ts`, `components/workspace/project-context.tsx`

## D-017 Default Model Routing Should Be Quality-First and Role-Specific
- **Date**: 2026-03-24
- **Reason**: Tahoe’s work is no longer best served by one cheap generalized routing baseline. The product now has clearer role splits:
  - Mars creation and storyboard generation need stronger multimodal creative synthesis
  - structured scene/asset judgments need stable compact reviewers
  - Chinese marketing writing benefits from Qwen’s Chinese copy strength
  - report / diagnosis layers benefit from stronger flagship judgment models
- **Impact**: Default model routing now uses:
  - `gemini-3.1-pro-preview` for `SCRIPT_REWRITE`
  - `gpt-5.4-mini` for `SCENE_CLASSIFICATION` and `ASSET_ANALYSIS`
  - `gpt-5.4` for `REPORT_GENERATION` and `MARKETING_ANALYSIS`
  - `qwen3-max` for `PROMOTIONAL_COPY`
  - `qwen3.5-plus` for `PLATFORM_ADAPTATION`
- **Rule**:
  - prefer role-specific model allocation over one-model-for-everything routing
  - keep Mars creative generation anchored in Gemini while the team is moving toward direct Google image/video API usage
  - keep Chinese marketing generation anchored in Qwen unless evaluation shows a better Chinese-writing model for that specific task
  - use OpenAI flagship / mini models primarily for judgment, review, and structured analysis layers
- **Files**: `lib/model-routing.ts`, `services/app-settings.service.ts`, `app/settings/page.tsx`

## D-018 Visible Model Names and Schema Defaults Must Stay In Sync With Live Routing
- **Date**: 2026-03-24
- **Reason**: Once Tahoe switched to a quality-first routing split, leaving older model names in settings labels, env examples, or Prisma defaults would create a misleading live product: the UI would imply one recommendation while new records or copied setup snippets could still resolve to older fallbacks.
- **Impact**:
  - settings surfaces should present the current recommended model generation names clearly
  - README / env examples should mirror the live recommended routing
  - Prisma defaults for `AppSettings.llm_model` should follow the active fallback baseline (`gpt-5.4-mini`)
- **Rule**:
  - when default routing changes, update visible model names, setup docs, and schema defaults in the same task
  - avoid leaving “current recommended” UI copy on one version while persistence defaults still point at an older generation
- **Files**: `components/settings/settings-form.tsx`, `app/settings/page.tsx`, `prisma/schema.prisma`, `README.md`

## D-019 Near-Term Product Focus Is Toutiao-First Article/Image Publishing, Not Video-First Production
- **Date**: 2026-04-10
- **Reason**: The current business objective is to use AI tools and agentic workflows to build an owned-media matrix and monetize through both content/ad revenue and service/technical revenue. At the current platform maturity, article + static-image workflows are more controllable, more publishable, and more aligned with the immediate launch channel than video-first production.
- **Impact**:
  - the near-term launch channel is **头条号 / Toutiao**
  - the owned-media line should be framed as article/image-first
  - video generation remains available in the system but is temporarily de-prioritized
  - the first three editorial directions are:
    - AI快讯
    - 全球股市
    - 消费时尚
- **Rule**:
  - do not begin by renaming database enums or internal compatibility types
  - treat `MARS_CITIZEN` as the current compatibility bucket for the owned-media matrix until a later explicit schema migration is justified
  - update user-facing copy, project briefs, and planning docs now so the product stops teaching a video-first mental model
- **Files**: `docs/CONTENT_MATRIX_STRATEGY.md`, `docs/PROJECT_STATE.md`, `app/page.tsx`, `lib/content-line.ts`, `components/dashboard/project-intent-picker.tsx`, `lib/project-brief.ts`

## D-020 Copy Quality Review Should Combine Chinese-Media Calibration With Multi-Audience Scoring
- **Date**: 2026-04-10
- **Reason**: A single rubric-style “quality diagnosis” is useful but incomplete. The user explicitly wants Tahoe’s copy quality to move closer to the strongest Chinese media / creator writing patterns, and also wants the system to judge drafts from multiple audience perspectives instead of one generalized score.
- **Impact**:
  - Marketing master-copy generation now includes an explicit “Chinese high-quality media calibration” prompt layer
  - saved master-copy versions can carry an `audience_panel_review` with four simulated reader types:
    - `feed_scanner`
    - `skeptical_reader`
    - `editor`
    - `sharer`
  - Marketing Ops now surfaces that second-pass panel directly in the main editor flow
  - the same audience-panel review pattern now also applies to owned-media packaging outputs (`VIDEO_TITLE`, `PUBLISH_COPY`) in Script Lab
- **Rule**:
  - keep the audience panel as a persisted artifact-level review signal, not an ephemeral front-end-only score
  - calibrate toward high-quality Chinese writing patterns through reusable rules + user-provided reference samples, not by hard-coding one named influencer voice
  - treat audience-panel review as a complement to `quality_diagnosis`, not a replacement for it
- **Files**: `lib/copy-review-panel.ts`, `services/promotional-copy.service.ts`, `components/workspace/marketing-ops-workbench.tsx`, `components/workspace/project-context.tsx`, `components/dashboard/project-form.tsx`, `components/settings/project-manager.tsx`

## D-021 Owned-Media Main Draft Review Must Persist On Script Records, Not Only On Packaging Tasks
- **Date**: 2026-04-10
- **Reason**: After packaging gained a strong second-pass audience panel, the main owned-media draft was still the weakest gap. If review only exists on title/publish artifacts, Tahoe can mistakenly optimize packaging while the underlying article is still weak. Also, if that review only appears on the transient preview surface, it disappears as soon as scene splitting completes.
- **Impact**:
  - `NewsScriptService` now backfills `audience_panel_review` onto `script.structured_output` for owned-media narrative drafts
  - `WorkspaceQueryService` now keeps the latest previewable structured draft available, instead of only exposing the absolute latest script record
  - Script Lab now shows a dedicated main-draft review block alongside scene editing, so draft quality survives later workflow transitions
- **Rule**:
  - for owned-media long-form outputs, persist review on the draft record itself (`script.structured_output`) instead of treating draft quality as packaging-only metadata
  - prefer keeping “latest previewable structured draft” available in read models when downstream workflow steps may replace the absolute latest script with more technical rewrite records
  - packaging review should follow draft quality, not substitute for it
- **Files**: `services/news-script.service.ts`, `services/workspace-query.service.ts`, `components/workspace/script-preview-panel.tsx`, `components/workspace/script-lab-workbench.tsx`, `app/script-lab/page.tsx`

## D-022 Editorial Direction Presets Should Be Shared Across Project Shell, Brand Profile, and Brief
- **Date**: 2026-04-11
- **Reason**: The three owned-media directions (`AI快讯`, `全球股市`, `消费时尚`) are now part of the operating model, not just copy ideas for one page. Keeping them only inside the create-project form would force users to restate the same baseline when creating brand profiles and briefs, while also making quality drift more likely.
- **Impact**:
  - a shared preset source now seeds project creation, Brand Profiles, and Brief Studio
  - Brand Profile preset application can also create the first default content pillars automatically
  - Brief Studio now uses the same preset family to prefill objective, tone, audience, platforms, CTA, and key message
  - brief platform payloads are normalized to the schema-safe set (`XHS`, `DOUYIN`, `YOUTUBE`, `X`, `TIKTOK`) instead of older UI-only aliases
- **Rule**:
  - when the three owned-media directions evolve, update the shared preset source instead of patching each form independently
  - keep preset cards short in the UI; the richer structure belongs in the hidden preset skeleton, not in longer explanatory card copy
  - do not add new brief platform labels that the backend schema cannot parse without updating the schema and the shared preset source together
- **Files**: `lib/editorial-direction-presets.ts`, `components/dashboard/project-form.tsx`, `components/workspace/brand-profile-workbench.tsx`, `components/workspace/brief-studio-workbench.tsx`

## D-023 Image-First UI Language Should Change Before Any Storyboard/Render Schema Migration
- **Date**: 2026-04-11
- **Reason**: The near-term product focus is article + static-image publishing, not video production. Waiting for a full schema rename before changing the user-facing language would keep teaching the wrong mental model for too long, while a rushed schema rename would create unnecessary migration risk.
- **Impact**:
  - `Scene Planner` now presents itself as `配图说明 / Image Brief`
  - `Render Lab` now presents itself as `图片生产 / Image Production`
  - empty states, page headers, button labels, and workbench card titles now guide users toward image tasks first
  - the underlying `storyboard` / `render` storage and API contracts remain in place for compatibility
- **Rule**:
  - prefer changing user-facing language first when business focus changes faster than the internal schema can safely move
  - keep internal compatibility types until there is a deliberate migration task, not a copy-only cleanup task
  - do not reintroduce video-first helper text on these pages unless video-first production becomes the active business priority again
- **Files**: `lib/locale-copy.ts`, `app/scene-planner/page.tsx`, `app/render-lab/page.tsx`, `components/workspace/scene-planner-workbench.tsx`, `components/workspace/render-lab-workbench.tsx`, `components/workspace/generate-storyboard-button.tsx`

## D-024 Image Generation Should Be Gated By Brief Readiness, Not Only By Prompt Presence
- **Date**: 2026-04-11
- **Reason**: After Tahoe shifted to image-first publishing, the next failure mode was obvious: users could move from Scene Planner to image generation with a prompt that technically existed but was still too abstract, under-referenced, or missing composition guidance. Waiting for a later model-based reviewer would keep the weakest image briefs flowing straight into generation.
- **Impact**:
  - Tahoe now derives a lightweight `image brief review` from the current row data before image generation
  - Scene Planner shows each row as `可开工` or `待补强` with a compact score and the main next-step guidance
  - Render Lab shows the same readiness verdict above the image-job form so users see the main gap before creating a new image task
- **Rule**:
  - do not treat “prompt exists” as the same thing as “brief is ready”
  - prefer a lightweight, explainable heuristic gate first; only add heavier model-based image-brief review once real output failure patterns are clear
  - keep this readiness layer non-blocking for now; it should guide users before generation, not hard-stop them
- **Files**: `lib/image-brief-review.ts`, `components/workspace/scene-planner-workbench.tsx`, `components/workspace/render-lab-workbench.tsx`

## D-025 Image-Job Outcome Feedback Should Persist On Render Jobs Before Any Heavier Image QA System
- **Date**: 2026-04-11
- **Reason**: A pre-generation readiness score is useful, but it is still only a heuristic unless Tahoe can see which real image runs were kept, retried, or sent back for brief rewrites. Building a heavier automated image-QA system before storing even basic human outcome feedback would be premature.
- **Impact**:
  - render jobs now support a lightweight feedback record inside `output_json.feedback`
  - users can mark each image run as:
    - `KEEP`
    - `RETRY`
    - `REWRITE_BRIEF`
  - users can also attach structured issue tags such as prompt-too-abstract, subject drift, style drift, weak composition, thin detail, text artifacts, and reference-not-used
  - Render Lab now surfaces that feedback directly in job history and job details
- **Rule**:
  - persist image-run outcome feedback on the render job before introducing heavier model-based image scoring
  - keep the feedback small and structured so it can later be mined to improve brief-review heuristics
  - do not force users through a large QA form; one verdict, a few issue tags, and a short note are enough for the current phase
- **Files**: `schemas/production-control.ts`, `services/render-job.service.ts`, `app/api/projects/[id]/render-jobs/[jobId]/route.ts`, `components/workspace/render-lab-workbench.tsx`

## D-026 Scene Planning Should Show Recent Image Failure Patterns, Not Only Static Brief Quality
- **Date**: 2026-04-11
- **Reason**: Once Tahoe started saving structured image-run feedback, leaving that information only inside Render Lab would force users to rediscover the same failure pattern one page too late. The planning surface should reflect recent image outcomes for the same row, especially when a brief has already been retried or repeatedly sent back for rewrite.
- **Impact**:
  - Scene Planner now summarizes recent image-job feedback for each row using the latest render jobs already available in the workspace read model
  - rows can now show whether they already carry recent retry / rewrite history
  - the detail panel now surfaces the latest verdict, high-frequency issue tags, and the latest short note from real image runs

- **Rule**:
  - do not treat Scene Planner as a static pre-generation editor once real image outcomes exist
  - when recent render-job feedback is available for a row, surface it in planning before asking users to try another generation
  - prefer summarizing the pattern (retry vs rewrite + top issues) instead of dumping every historical feedback record into the planner
- **Files**: `lib/render-job-feedback.ts`, `components/workspace/scene-planner-workbench.tsx`, `app/scene-planner/page.tsx`, `components/workspace/render-lab-workbench.tsx`

## D-027 Homepage Project Creation Must Not Depend On Hidden Invalid Defaults
- **Date**: 2026-04-11
- **Reason**: A first-time user should be able to create a project from the homepage without understanding internal schema limits or hidden metadata fields. Tahoe's shared create form was still posting defaults that violated backend constraints (`platforms > 3`, `script_summary.version_number = 0`) and owned-media presets were also blurring “direction” with “current topic”.
- **Impact**:
  - homepage/shared create flow now slices default `platforms` to a schema-safe maximum of 3
  - empty project-shell research reports now use a valid placeholder `script_summary.version_number`
  - owned-media presets now fill background context and tone only; they no longer overwrite the user's current topic
  - the homepage create form now surfaces current topic + writing context before advanced controls
  - homepage/start cards use more direct labels (`内容矩阵` / `商业服务`, `配图说明`) instead of leaking older internal terms
- **Rule**:
  - do not let hidden defaults in the shared create path violate backend schema limits
  - do not let “direction preset” auto-fill the current topic field for owned-media flows
  - treat `project introduction` and `core idea` as first-run quality inputs for copy-first users, not as purely advanced controls
- **Files**: `components/dashboard/project-form.tsx`, `lib/workspace-mode.ts`, `services/research-orchestrator.service.ts`, `lib/client-api.ts`, `components/dashboard/project-intent-picker.tsx`, `lib/content-line.ts`, `app/page.tsx`

## D-028 First-Run Persistence Paths Must Normalize User-Invisible Derived Values Before Database Writes
- **Date**: 2026-04-12
- **Reason**: Local end-to-end verification still exposed system-owned failures that a copy-first user could neither predict nor correct. The create path auto-filled a title before a topic existed, research evidence attempted to insert raw relative date strings such as `3 天前`, and settings upsert still posted a removed `serpapi_key` field. These are derived/default values owned by the system, so they must be normalized before persistence instead of surfacing as user-facing failures.
- **Impact**:
  - blank topics no longer generate auto-title suggestions
  - changing the topic resets title-suggestion state so each new piece starts from the first suggestion candidate
  - research/news evidence now parses relative Chinese/English timestamps and Chinese absolute dates into valid timestamps before `trendEvidence` inserts
  - settings upsert now matches the Prisma schema field set and only persists `serper_api_key`
- **Rule**:
  - do not auto-fill a “ready-looking” project title when the current topic is still blank
  - never send raw relative timestamp strings into `new Date(...)` for database writes; normalize them first
  - when schema fields are renamed or removed, update env-default mappers in the same change so settings upsert cannot drift silently
- **Files**: `components/dashboard/project-form.tsx`, `lib/project-brief.ts`, `lib/published-at.ts`, `services/research-orchestrator.service.ts`, `services/research-job.service.ts`, `services/app-settings.service.ts`

## D-029 Trend Scoring Must Never Emit NaN Into Persistence Paths
- **Date**: 2026-04-12
- **Reason**: During full-chain verification, project creation still failed even after timestamp parsing was fixed because some upstream content carried odd date values that pushed the trend-scoring velocity calculation into `NaN`. That `NaN` later surfaced at the Prisma layer as a misleading nested-create validation error (`momentum_score is missing`). The scoring layer must sanitize invalid numeric inputs before any persistence step.
- **Impact**:
  - trend-scoring now parses content timestamps through the shared `parsePublishedAt(...)` helper instead of raw `new Date(...)`
  - score clamping now converts any non-finite value into `0` before building the final score breakdown
  - project creation can persist trend topics even when upstream search/content timestamps are noisy or partially malformed
- **Rule**:
  - do not allow `NaN`, `Infinity`, or other non-finite score values to leave the scoring layer
  - when a score depends on external timestamps, normalize the timestamp first and clamp the derived score second
  - prefer fixing this class of issue at the formula layer, not by adding one-off guards at each database write
- **Files**: `services/trend-scoring/formulas.ts`

## D-030 Tahoe Should Operate On A Dual-Engine Model: Owned Media For Proof And Reach, Services For Cash Flow
- **Date**: 2026-04-23
- **Reason**: Tahoe's current value does not come from being a generic AI tool. Its near-term advantage is the ability to turn one topic into a judged, publishable article-and-image package, then reuse that same workflow for paid delivery. That means the business should be designed around two linked engines: owned-media output that proves the method, and service delivery that monetizes the method sooner.
- **Impact**:
  - owned-media work should be treated as both a publishing business and a proof layer for future sales
  - service delivery should stay in scope as a first-class revenue path, not a side effect
  - product prioritization should favor the article-package loop (`topic -> draft -> review -> image -> packaging`) over broader but less defensible feature expansion
  - the three owned-media accounts should have distinct editorial jobs:
    - `AI快讯` filters AI change
    - `全球股市` interprets market variables
    - `消费时尚` judges brand / runway / consumer signals
- **Rule**:
  - do not optimize Tahoe primarily as a wide self-serve tool before the article-and-image method is stable
  - judge roadmap items by whether they strengthen publishable quality, account differentiation, or service reuse
  - when strategic questions come up, check `docs/BUSINESS_MODEL.md` before expanding scope
- **Files**: `docs/BUSINESS_MODEL.md`, `docs/CONTENT_MATRIX_STRATEGY.md`, `docs/PROJECT_STATE.md`, `docs/TASKS.md`

## D-031 The Near-Term Operational Center Should Be A Daily Run Surface, Not More Isolated Workbenches
- **Date**: 2026-04-23
- **Reason**: Tahoe already has most of the necessary production pieces — signal intake, project creation, master-draft generation, review seams, image-brief review, image jobs, and publish packaging — but they still require too much manual stitching. The immediate bottleneck is not a missing model or another new workbench. It is the lack of one operational surface that makes daily production visible and actionable across the three owned-media accounts.
- **Impact**:
  - the next orchestration surface should be `Daily Run / 每日运行台`
  - that surface should manage one shared stage model:
    - `signal intake`
    - `topic triage`
    - `draft`
    - `review`
    - `image`
    - `publish package`
  - the daily run should compute one best next action per item instead of forcing users to manually inspect multiple pages
  - existing pages (`Today`, `Script Lab`, `Scene Planner`, `Render Lab`) remain, but should increasingly behave as specialized deep-work views behind the daily operational queue
- **Rule**:
  - do not add more disconnected workflow surfaces before the daily run layer exists
  - prioritize status clarity and next-action clarity over broader dashboard expansion
  - treat the daily article package loop as the main production unit, not individual isolated artifacts
- **Files**: `docs/DAILY_RUN_PLAN.md`, `docs/PROJECT_STATE.md`, `docs/TASKS.md`

## D-032 The First Daily Run Version Should Reuse Existing Project Artifacts Before Introducing A New Queue Table
- **Date**: 2026-04-23
- **Reason**: Tahoe already has enough artifact signals to make a first daily operational surface useful: recent projects, script presence, image-brief presence, image-job presence, and packaging-task presence. Adding a new workflow table before proving the page structure would create schema churn without confirming the right operating model.
- **Impact**:
  - the first `/daily-run` version reuses `listProjects()` read data
  - project stage is inferred from current artifacts:
    - no script -> `待起稿`
    - script but no image brief -> `待审核`
    - image brief but no image job -> `待配图`
    - image job but no package task -> `待包装`
    - package task exists -> `可发布`
  - the page computes one next action and routes users back into the existing specialized workbenches
- **Rule**:
  - prove the daily-run interaction shape with existing read models first
  - only add a dedicated `daily_run_item` persistence model after signal intake and account-lane assignment are ready to be promoted into first-class workflow state
  - keep `Daily Run` as an orchestration layer, not a duplicate editor
- **Files**: `app/daily-run/page.tsx`, `components/dashboard/sidebar.tsx`, `lib/locale-copy.ts`, `services/workspace-query.service.ts`

## D-033 Daily Run Signal Intake Must Stay Manual Until Triage Persistence Exists
- **Date**: 2026-04-23
- **Reason**: Tahoe already has a working Today hot-topics search, but the product explicitly avoids automatic search on mount to control API usage and to keep the user's first action deliberate. Daily Run still needs a way to collect today's signals, so the safest bridge is to reuse the existing hot-topics search manually inside Daily Run before introducing a heavier persisted triage queue.
- **Impact**:
  - `Daily Run` now includes a manual signal panel powered by the existing `useHotTopics()` hook
  - users can search once, inspect recommended topics, mark them `保留 / 忽略` in browser session state, and route them into one of the three owned-media lanes
  - routing now starts a lane-bound owned-media draft directly by reusing the existing `generate-from-news` flow, patching the new project's lane metadata, and opening `Script Lab`, instead of bouncing through the homepage create form
- **Rule**:
  - do not reintroduce auto-search on page mount for `Daily Run`
  - reuse existing signal infrastructure first; persistence comes later
  - until queue persistence exists, lightweight triage state may live in browser session storage, but should not be treated as durable workflow state
- **Files**: `components/daily-run/daily-run-signal-panel.tsx`, `app/daily-run/page.tsx`, `app/page.tsx`, `components/dashboard/project-form.tsx`

## D-034 Breaking-News Review Must Be Grounded On Tahoe's Own Source Packet
- **Date**: 2026-04-24
- **Reason**: During the GPT-5.5 dry run, Tahoe could collect real news, generate a draft, generate packaging, and create image jobs, but the review layer still partially behaved as if it were fact-checking against stale model memory instead of the platform's own freshly collected source packet. That made packaging reviews and draft reviews overly punitive on just-published topics and broke the intended "collect -> write -> review" loop.
- **Impact**:
  - audience-review prompts now explicitly treat the provided `proofPoints` as the editorial source packet and stop demanding URLs, benchmark names, or exact percentages that were never present in the packet
  - `VIDEO_TITLE` and `PUBLISH_COPY` reviews now receive extracted source bullets from the latest script payload instead of only title options / highlight strings
  - AI快讯 / Mars main-draft prompting now pushes each change point toward a reader-perceivable consequence instead of generic industry-summary phrasing
  - image-brief review now accepts prompt-embedded camera/composition direction for infographic or concept-image rows instead of over-penalizing all zero-reference rows equally
- **Rule**:
  - for just-published topics, review should judge fidelity to Tahoe's own collected source packet, not external-memory recall
  - do not require unsupported percentages or benchmark names if the packet only provides qualitative changes; only penalize concrete specifics when the draft invents them
  - packaging review must see the same source packet as the main draft, otherwise title/publish review will drift from article reality
  - image-brief readiness should distinguish between "no references because the row is weak" and "no references because the row is a self-contained infographic/concept prompt"
- **Files**: `app/api/research/hot-topics/route.ts`, `lib/copy-review-panel.ts`, `lib/mars-citizen-prompt.ts`, `lib/image-brief-review.ts`, `services/project-output-generator.service.ts`, `lib/output-artifact-prompt.ts`

## D-035 Trial Production Projects Should Be Archived, Not Hard Deleted
- **Date**: 2026-04-24
- **Reason**: Real production runs can create several project shells while testing source quality, prompt quality, and packaging quality. Hard-deleting those projects would remove useful evidence, generated scripts, image briefs, and render-job feedback. But leaving every trial visible makes Daily Run and Settings noisy.
- **Impact**:
  - duplicate GPT5.5 dry-run projects are marked `ARCHIVED` and tagged with cleanup metadata instead of being deleted
  - ordinary project read models hide archived projects by default
  - Settings remains the recovery surface and can still include archived projects
  - project lists now show `updated_at` so recent test noise is easier to identify
- **Rule**:
  - do not hard-delete production-trial projects unless the user explicitly asks for permanent deletion
  - prefer one final inspection project per article package, with duplicate attempts archived and linked back through metadata
  - expose last-modified time wherever users choose what to open next
- **Files**: `services/workspace-query.service.ts`, `app/api/projects/route.ts`, `app/daily-run/page.tsx`, `components/settings/project-manager.tsx`, `docs/GPT55_ARTICLE_RUNBOOK.md`

## D-036 AI快讯 Main Drafts Should Default To Long-Form Toutiao Articles, Not Short Summaries
- **Date**: 2026-04-24
- **Reason**: The first cloud GPT5.5 inspection article proved that the pipeline could collect signals and create artifacts, but the main draft was too short and read like a compressed update. The target product is a publishable Toutiao image/text article comparable to strong Chinese tech commentary: hook, facts, explanation, judgment, and a memorable closing. A short summary can be useful as a packaging artifact, but it should not be the default main draft for owned-media publishing.
- **Impact**:
  - `NARRATIVE_SCRIPT` copy now describes a Toutiao-first long-form article draft instead of a voiceover-style tech script
  - AI快讯 prompting asks for 1800-2600 Chinese characters when source material is sufficient, with a minimum long-form floor instead of a 90-second draft
  - the prompt requires a hook, source grounding, 3-5 change points, reader-facing consequences, clear judgment lines, and a final takeaway
  - audience-review calibration now explicitly penalizes owned-media main drafts that read like short summaries rather than complete articles
  - the cloud GPT5.5 inspection project `cmocgo05k0000v6w47xyxcr39` now has a v2 long-form script and updated project background
- **Rule**:
  - do not optimize AI快讯 main drafts for brevity unless the user explicitly chooses a short-update mode
  - title packs, publish copy, and image briefs can stay compact; the main article should carry the full argument
  - if source material is thin, write the uncertainty and observation boundary into a longer explanatory article instead of falling back to a tiny summary
- **Files**: `lib/mars-citizen-prompt.ts`, `lib/output-type-copy-prompt.ts`, `lib/copy-review-panel.ts`, `docs/GPT55_ARTICLE_RUNBOOK.md`

## D-037 AI快讯 Quality Bar Must Penalize Template-Like AI Tone, Not Just Short Length
- **Date**: 2026-04-25
- **Reason**: After the first long-form upgrades, the user identified a second quality gap: drafts could be long enough but still sound like AI-generated summaries. The writing target should be closer to strong Chinese tech media and creator essays: factual density, event tension, plain-language metaphor, author judgment, and memorable closing lines.
- **Impact**:
  - AI快讯 prompting now asks for a core metaphor or central tension before expanding facts.
  - Drafts must include "人话翻译" paragraphs that turn model specs, long context, Agent capability, pricing, or open-source strategy into concrete work scenarios.
  - The prompt explicitly discourages通稿开头、机械小标题、万能转接词、咨询腔宏大词, and symmetrical AI-style summaries.
  - Audience review now treats "AI味" as a first-class failure mode and caps style-fit scores for drafts that are accurate but feel like press-release summaries.
  - The DeepSeek V4 cloud project has a v2 draft that applies this calibration before the next article run.
- **Rule**:
  - do not copy named creators or media voices directly; learn reusable structural methods only
  - a publishable AI快讯 article must have facts plus authorial interpretation; a correct neutral summary is not enough
  - if the first screen sounds like a press release, the draft should be revised even when the facts are correct
- **Files**: `lib/mars-citizen-prompt.ts`, `lib/copy-review-panel.ts`, `lib/output-type-copy-prompt.ts`

## D-038 Local Qwen Should Reuse The QWEN Provider Instead Of Adding A New Prisma Enum
- **Date**: 2026-04-26
- **Reason**: The user has a local `qwen3.6-35b` deployment and wants Tahoe to avoid unsupported Gemini routes during local generation. Adding a new `LOCAL_QWEN` Prisma enum would force a schema migration and create cloud/local compatibility risk. The safer seam is to reuse the existing `QWEN` provider and let `QWEN_BASE_URL` point at any OpenAI-compatible local model server.
- **Impact**:
  - `QWEN_BASE_URL` / `LOCAL_QWEN_BASE_URL` can override DashScope for Qwen calls
  - Qwen local calls use prompt-embedded JSON schema instructions instead of relying on OpenAI's strict `json_schema` response format, because many local model servers do not implement it
  - Settings and docs expose `qwen3.6-35b` / `qwen3.6-35b-a3b` as selectable Qwen model names
- **Rule**:
  - do not add a new model-provider enum solely for local Qwen while an OpenAI-compatible base URL is sufficient
  - keep cloud deployment separate from local machine access; Tencent Cloud cannot call the user's `127.0.0.1`
  - if local Qwen is expected to power cloud generation later, expose it through a secure network endpoint or deploy the model beside the server
- **Files**: `lib/openai-json.ts`, `lib/model-routing.ts`, `services/app-settings.service.ts`, `components/settings/settings-form.tsx`, `README.md`, `.env.example`

## D-039 Local Qwen Calls Should Pin Conservative Generation Parameters
- **Date**: 2026-04-26
- **Reason**: Tahoe uses local Qwen for structured JSON outputs, long-form drafts, packaging, and review loops. LM Studio defaults can be too creative for JSON-heavy production chains, and a high temperature increases parse failures and inconsistent review results.
- **Impact**:
  - local OpenAI-compatible Qwen requests now read `QWEN_TEMPERATURE`, `QWEN_TOP_P`, and `QWEN_MAX_TOKENS`
  - the current local baseline is `temperature=0.35`, `top_p=0.85`, `max_tokens=8192`
  - `QWEN_CONTEXT_WINDOW=131072` is documented as the current LM Studio load setting, but Tahoe treats it as a setup note because the actual context window is controlled by the local inference server
- **Rule**:
  - prefer stable local-Qwen parameters for the production pipeline before increasing creativity
  - if article prose needs more variation later, tune route-specific prompts first, then raise temperature only after JSON reliability is verified
  - do not assume `.env` can change the context window; set that inside LM Studio / vLLM / SGLang
- **Files**: `lib/openai-json.ts`, `.env.example`, `README.md`

## D-040 Tahoe Frontend Should Prefer Flat Editorial Work Surfaces Over Decorative Card Stacks
- **Date**: 2026-04-26
- **Reason**: The user wants Tahoe to feel less like a generic AI-generated dashboard and more like a serious daily content-production desk. The previous visual system relied too much on rounded cards, glows, gradients, icon tiles, and decorative hierarchy, which added visual noise without helping the operator decide the next editorial action.
- **Impact**:
  - the visual baseline now favors paper-like backgrounds, fine dividers, row-based selection, compact controls, and restrained typography
  - common shell components, homepage entry, shared project creation, project intent selection, Output Studio, buttons, state panels, and error notices have been flattened first
  - this is a frontend-only visual direction; backend services, API contracts, Prisma schema, and model routes remain unchanged
- **Rule**:
  - avoid adding new card grids, glow blobs, gradient buttons, large rounded icon tiles, or decorative containers unless a repeated item genuinely needs framing
  - prefer section dividers, lists, tables, and explicit next-action rows for operational surfaces
  - keep future UI changes inside Tahoe's existing vanilla CSS / CSS custom property system
- **Files**: `app/globals.css`, `app/page.tsx`, `.impeccable.md`, `components/layout/app-shell.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/project-form.tsx`, `components/dashboard/project-intent-picker.tsx`, `components/dashboard/output-studio.tsx`, `components/dashboard/metric-card.tsx`, `components/ui/page-header.tsx`, `components/ui/panel-card.tsx`, `components/ui/button.tsx`, `components/ui/state-panel.tsx`, `components/ui/error-notice.tsx`, `components/workspace/next-step-link.tsx`

## D-041 Daily Production Should Default To A 90-Minute Quick Package, Not Full Workflow Review
- **Date**: 2026-04-26
- **Reason**: The user can spend about 90 minutes per day to publish three account articles. A full artifact-by-artifact review loop makes the product feel too heavy for daily operations and creates more cost than the current business stage needs. The default unit should be one publishable article package, not separate perfect passes for draft, review, image brief, title pack, and publish copy.
- **Impact**:
  - Daily Run is now the primary navigation entry for day-to-day publishing.
  - Selecting a signal from Daily Run creates the article draft and then sequentially generates image brief, title pack, and publish copy as one quick package.
  - Deep work pages remain available for repair, but they are no longer presented as required daily steps.
  - The sidebar keeps Today, Trend Explorer, and Brief Studio available as management/deep-research surfaces instead of putting them in the main daily path.
- **Rule**:
  - optimize the default workflow for "good enough to publish, then one final edit"
  - do not add new mandatory review gates unless they remove more work than they add
  - avoid concurrent local-model generation; local 35B runs should be sequenced to protect memory
- **Files**: `app/daily-run/page.tsx`, `components/daily-run/daily-run-signal-panel.tsx`, `app/api/daily-run/quick-package/route.ts`, `components/dashboard/sidebar.tsx`

## D-042 The Anti-Card Frontend Direction Applies System-Wide, Not Only To The Homepage
- **Date**: 2026-04-26
- **Reason**: After the first visual rewrite, the homepage and Daily Run entry had the intended editorial-desk tone, but deeper workbenches still carried the old AI-dashboard language. That mismatch made the product feel inconsistent once users left the first screen.
- **Impact**:
  - Today, Trend Explorer, Script Lab, Scene Planner, Render Lab, Marketing Ops, Settings, Brand Profiles, Brief Studio, Industry Templates, and shared utility components should follow the same flat editorial workbench language
  - selected states should be light/tokenized instead of dark panels with white text
  - status indicators should use small semantic tags or inline metadata, not decorative pill walls
  - display typography belongs primarily at page-level hierarchy; dense workbench surfaces should stay readable and sans-serif
- **Rule**:
  - do not treat lower-traffic workbenches as exempt from the anti-card design direction
  - avoid reintroducing large rounded cards, gradients, glows, hover-lift shadows, translucent white UI, circular score widgets, or hard-coded alert color palettes
  - keep future UI changes inside the current frontend stack and do not change backend contracts for style-only work
- **Files**: `app/globals.css`, `components/ui/*`, `components/today/*`, `components/trend-discovery/*`, `components/workspace/*`, `app/*/page.tsx`
