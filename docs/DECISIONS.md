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
    - AI增长官
    - 金钱不眠
    - 东方元气
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
- **Reason**: The three owned-media directions (`AI增长官`, `金钱不眠`, `东方元气`) are now part of the operating model, not just copy ideas for one page. Keeping them only inside the create-project form would force users to restate the same baseline when creating brand profiles and briefs, while also making quality drift more likely.
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
