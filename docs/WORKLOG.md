# Worklog

> Concise handoff records. Each entry should help the next agent pick up immediately.
> Keep entries short — focus on what changed, why, and what's left.

---

## 2026-03-21 02:14 — Agent: Codex

### T-010 Output Quality: Add Lightweight Artifact Quality Alerts Inside Workbenches

**Changes**:
- **`lib/artifact-quality.ts`** (new): Added a small shared heuristic layer for artifact quality checks. It flags weak hooks, generic title phrasing, thin publish-copy proof density, abstract scene prompts, weak marketing CTA/proof structure, and ad-creative directions that are too vague for downstream visual generation.
- **`components/workspace/script-lab-workbench.tsx`**: Added a compact “质量提醒” panel for Mars content. It now gives concrete warnings for:
  - video-title hook strength / option depth
  - publish-copy evidence density / CTA clarity
  - whether the currently selected scene is specific enough for Nano Banana / Seedance / Veo style generation
- **`components/workspace/marketing-ops-workbench.tsx`**: Added a parallel “质量提醒” panel for Marketing. It now tells the user when the master copy is still too thin, too slogan-like, or too weak on proof/CTA, and when the ad creative pack is still too abstract to cleanly support storyboard work.

**Reason**:
- The user wants output quality to keep improving, not just navigation. This adds a lightweight, explainable review layer directly where users are editing, without introducing a heavier scoring system or more workflow ceremony.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 01:56 — Agent: Codex

### T-010 Output Quality: Promote Today Materials to First-Class Marketing Prompt Inputs

**Changes**:
- **`services/marketing-context.service.ts`**: Renamed Today-originated context fields to stronger labels (`优先创作输入`, `优先表达焦点`) so downstream prompt builders treat them as first-class guidance instead of generic project notes.
- **`services/promotional-copy.service.ts`**: Updated the creative brief and quality rules so promotional-copy generation explicitly prioritizes factual inputs, trend signals, and keyword focus when those exist in project context.
- **`lib/output-artifact-prompt.ts`**: Updated the ad-creative prompt so it explicitly tells the model to ground the brief in supplied factual inputs / trend framing / keyword focus rather than writing a generic angle from the topic title alone.

**Reason**:
- User-flow improvements only matter if they preserve and improve output quality. This change makes Today-selected materials meaningfully affect the generated Marketing outputs instead of merely being stored in project metadata.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 01:45 — Agent: Codex

### T-010 Today Marketing Context: Carry Selected Materials and Keyword Focus Into Generation

**Changes**:
- **`components/today/today-workbench.tsx`**: The direct Today -> Marketing starts now carry more than just a topic string.
- When the user launches `营销文案` or `广告分镜` from Today, Tahoe now compresses the current selected fact items, trend references, keyword focus, and active keyword-pool name into lightweight project context fields (`projectIntroduction`, `coreIdea`) before triggering generation.

**Reason**:
- Artifact-first UX should not only shorten navigation. It should also preserve the user's current thinking. Without this change, Today-originated Marketing flows were direct in navigation but still shallow in context, which weakened output quality.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 01:33 — Agent: Codex

### T-010 Today Flow: Marketing Actions Now Start Output Generation More Directly

**Changes**:
- **`components/today/today-workbench.tsx`**: The Today marketing actions no longer feel like a plain “go create a project first” detour.
- `营销文案` and `广告分镜` now perform a lightweight chained flow:
  - create a minimal Marketing project shell
  - immediately trigger the requested output generation
  - route the user directly into the relevant workspace
- Mars actions remain split appropriately:
  - fact-driven script generation still goes direct to Script Lab
  - publish-package creation still uses the lighter intent-create handoff

**Reason**:
- This improves artifact-first UX inside Today. Users selecting materials should feel like they are starting work on an output, not stepping sideways into project-creation ceremony.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 01:19 — Agent: Codex

### T-010 Flow Clarity: Align Scene Planner and Render Lab With Artifact-First Navigation

**Changes**:
- **`app/scene-planner/page.tsx`**: Rewrote page-level empty/error states so the page now explains storyboard work in terms of current artifact readiness rather than generic missing data. The empty state now clearly distinguishes “generate first storyboard draft” from “refine in Script Lab first.”
- **`app/render-lab/page.tsx`**: Fixed the most confusing cross-page routing issue: Render Lab no longer points every project toward Marketing by default. The top action now routes by business line, and empty/error states now explain render preparation as “turn storyboard shots into image/video jobs” instead of generic workflow plumbing.

**Reason**:
- User-flow clarity depends heavily on cross-page handoff copy. Scene Planner and Render Lab were still carrying some vague or misleading language, especially around what the next action should be for different business lines.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 01:06 — Agent: Codex

### Future Planning Sync: Record Long-Term Direction Without Expanding Current Sprint

**Changes**:
- **`docs/FUTURE_BLUEPRINT.md`** (new): Added a dedicated long-term architecture blueprint that records:
  - current structural bottlenecks
  - why stronger agentic review loops matter
  - why multimodal brand memory / retrieval matters
  - why those two directions are important but should remain future roadmap items for now
- **`docs/DECISIONS.md`**: Added a decision clarifying that Tahoe's long-term direction points toward review loops and brand memory, while current execution should stay focused on output quality, prompt quality, artifact-first UX, and flow clarity.
- **`docs/PROJECT_STATE.md`** and **`docs/TASKS.md`**: Synced the same distinction so future architecture guidance is visible without being confused with the current implementation queue.

**Reason**:
- The user wanted the guidance captured in durable planning docs, but explicitly did not want Tahoe to become over-ambitious or lose focus on current work.

**Verification**:
- Documentation-only slice; no build needed

---

## 2026-03-21 00:49 — Agent: Codex

### T-010 Model-Readiness Feedback: Judge Whether Outputs Are Usable for Visual Generation

**Changes**:
- **`components/workspace/script-lab-workbench.tsx`**: Extended the Script Lab feedback layer so it no longer judges only whether artifacts exist. It now also checks whether scenes are sufficiently prompt-ready for downstream Nano Banana / Seedance / Veo use by looking for continuity anchors, visual-priority hints, avoid tags, and minimum scene prompt substance.
- **`components/workspace/marketing-ops-workbench.tsx`**: Extended the Marketing feedback layer so it can warn when an ad creative pack is still too thin for downstream visual generation, especially when visual direction, shot tone, or concrete selling-point imagery are missing.

**Reason**:
- The user wants better content quality, not just better routing. A useful workbench should help answer: “Is this artifact actually ready for AI image/video production?” rather than only “Has something been generated?”

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 00:39 — Agent: Codex

### T-010 Feedback Layer: Tell the User What Exists, What Is Weak, and What Comes Next

**Changes**:
- **`components/workspace/script-lab-workbench.tsx`**: Added a lightweight “当前判断” panel that summarizes:
  - what Mars artifacts already exist
  - the current weakest point in the content package
  - the recommended next move
- **`components/workspace/marketing-ops-workbench.tsx`**: Added the same kind of top-level readout for Marketing, using the current master draft, ad creative, platform drafts, storyboard status, and compliance state to generate a compact “done / weak / next” summary.

**Reason**:
- After generation, the interface should not force the user to infer the state of the project from scattered panels.
- This is an interaction-quality improvement, not a new workflow: it makes the current system easier to read without adding more navigation.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 00:27 — Agent: Codex

### T-010 Marketing Language Cleanup: Shift From Ops Console to Content Desk

**Changes**:
- **`app/marketing-ops/page.tsx`**: Rewrote page-level navigation and empty/error states so the page no longer frames itself as a generic operations console or a “back to dashboard” detour.
- **`components/workspace/marketing-ops-workbench.tsx`**: Updated the top panel language from “operations” framing to “current copy / creative / channel drafts in one place”, so the page reads more like a content polishing desk.

**Reason**:
- The user flow should stay artifact-first. Marketing pages still carried some older “ops / dashboard / content operations” language that made the experience feel more like an admin surface than a focused production surface.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 00:18 — Agent: Codex

### T-010 Script Lab Language Cleanup: Remove Old Workflow-First Guidance

**Changes**:
- **`app/script-lab/page.tsx`**: Removed the remaining `workspaceMode === "SHORT_VIDEO"` fallback from next-step routing so the page now follows output intent more strictly.
- **`app/script-lab/page.tsx`**: Rewrote the missing-data and empty-state messaging so Script Lab no longer tells the user to “run the full workflow first”.
- The empty state now frames the page in artifact-first language: generate the first draft, then return here to refine scenes and publish packaging.

**Reason**:
- The product direction is now minimal-first and artifact-first. Script Lab still had a few messages that were teaching the older “complete the workflow first” mental model, which created unnecessary friction and conceptual drift.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 00:10 — Agent: Codex

### T-010 Flow Map: User-Journey Baseline for Quality + UX Work

**Changes**:
- **`docs/USER_FLOW.md`** (new): Added a product-facing flow map for Tahoe that defines:
  - the core product principle
  - the two main business-line flows
  - page responsibilities for Homepage / Today / Script Lab / Marketing Ops / Scene Planner / Render Lab
  - current routing rules
  - the highest-priority friction points
- **`docs/TASKS.md`**: Synced T-010 with this new baseline and clarified the next UX/content-quality pushes: fix lingering old-workflow helper copy, strengthen post-generation guidance, and continue reducing artifact-to-artifact friction.

**Reason**:
- Before further changing prompts, pages, or navigation, the product needed one shared map from the user's perspective.
- This prevents us from improving isolated screens while the overall journey drifts or becomes inconsistent again.

**Verification**:
- Documentation-only slice; no build needed

---

## 2026-03-20 05:10 — Agent: Codex

### T-010 Homepage Task Entry: Clear Start Paths on the Current Dashboard

**Changes**:
- **`app/page.tsx`**: Reworked the no-project state so the current homepage acts like a clear task-entry board instead of dropping users straight into a form-first workspace.
- Added four explicit start cards:
  - go to **Today** to find topics
  - start a **火星公民** project
  - start a **Marketing** project
  - continue the **most recent project**
- Kept the minimal project form available beneath the task-entry cards so users can still start directly, but only after the page has clarified the main choices.

**Reason**:
- The user wanted the homepage to make the next action obvious immediately after entry.
- This is an intentional intermediate step before deciding whether Tahoe should later grow a separate outer product homepage.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 04:38 — Agent: Codex

### T-010 Output Studio UI: Direct Artifact Generation from Dashboard

**Changes**:
- **`components/dashboard/output-studio.tsx`** (new): Added a focused dashboard surface that lets the user trigger same-line outputs directly from the current project context.
- **`app/page.tsx`**: Wired the new Output Studio into the dashboard beneath the primary next-step row so it feels like a natural extension of the current project instead of a separate tool.
- **`app/globals.css`**, **`components/ui/page-header.tsx`**, **`components/ui/panel-card.tsx`**: Refined the visual language toward a calmer editorial / production-desk feel: stronger serif display hierarchy, cleaner glow treatment, and more tactile output cards, while still staying inside the existing token system.

**Design direction**:
- Keep the interface simple and calm.
- Let typography carry more hierarchy instead of adding more modules.
- Preserve the existing cyan / slate tech palette, but make output-generation areas feel more intentional and craft-oriented.
- Treat the dashboard as a content bench, not an operations console.

**Reason**:
- The backend generator was already in place, but users still needed a simple front door. This pass closes that gap while also tightening the overall aesthetic around the product’s real use case: generating and refining artifacts.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 04:02 — Agent: Codex

### T-010 Prompt Quality: Output-Aware Copy + Model-Aware Storyboard Prompting

**Changes**:
- **`lib/visual-generation-prompt.ts`** (new): Added shared visual prompting guidance oriented around the current image/video toolchain: Nano Banana 2 / Pro, Seedance 2.0, and Veo 3.1.
- **`lib/output-type-copy-prompt.ts`** (new): Added explicit per-`OutputType` writing instructions so different artifacts no longer inherit the same generic “marketing copy” objective.
- **`services/promotional-copy.service.ts`**: Copy generation now injects target-output instructions directly into the writing task, so platform copy, publish copy, ad-oriented drafts, and other artifacts can diverge in tone and structure more deliberately.
- **`lib/mars-citizen-prompt.ts`** and **`lib/ad-script-prompt.ts`**: Narrative and ad scripts now explicitly optimize for later shot decomposition instead of only reading well as prose.
- **`lib/storyboard-seed-prompt.ts`** and **`services/storyboard-generator.service.ts`**: Storyboard seed generation and full storyboard generation now enforce clearer prompt anatomy for AI image/video production: subject, action, setting, framing, lighting, mood, continuity anchors, and model-aware execution constraints.

**Reason**:
- The next product risk is not only architecture drift but output quality drift. Different artifact types need different copy goals, and storyboard text has to be written for actual image/video generation rather than for human-readable planning alone.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 04:21 — Agent: Codex

### T-010 Project Output Generator: One Entry for Multiple Artifact Types

**Changes**:
- **`services/project-output-generator-registry.ts`** (new): Defined the first project-level supported output set: `PLATFORM_COPY`, `VIDEO_TITLE`, `PUBLISH_COPY`, `AD_CREATIVE`, `AD_STORYBOARD`.
- **`services/project-output-generator.service.ts`** (new): Added a unified generator service that routes by `outputType` and reuses existing services where possible.
- **`app/api/projects/[id]/generate-output/route.ts`** (new): Added one API entry for project-level artifact generation.
- **Execution mapping now in place**:
  - `PLATFORM_COPY` → `PromotionalCopyService`
  - `AD_STORYBOARD` → `StoryboardGeneratorService`
  - `VIDEO_TITLE` → generated title pack saved as a strategy task
  - `PUBLISH_COPY` → generated publish copy pack saved as a strategy task
  - `AD_CREATIVE` → generated ad creative brief saved as a strategy task
- **`lib/output-artifact-prompt.ts`** (new): Added focused prompt builders for video titles, publish copy, and ad creative briefs.

**Reason**:
- This is the first real expansion of `OutputType -> Generator` beyond the initial news entry. The system now has a single project-side generation contract instead of forcing each output type to hide behind unrelated service-specific routes.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 03:42 — Agent: Codex

### T-010 UI Language Sync: Main Pages Now Follow Intent-First Semantics

**Changes**:
- **`app/trend-explorer/page.tsx`**: Replaced old `workspaceMode`-based next-step routing with the centralized next-step helper, and updated the detail panel to reference the current target output explicitly.
- **`app/brief-studio/page.tsx`**: Reframed the page as optional context for the current artifact instead of a universal front door, and switched the header CTA to the centralized next-step helper.
- **`app/help-center/page.tsx`**: Rewrote the old “three work modes” explanation into the current product model: two business lines plus target outputs. The quickest-path guidance now matches the minimal-first direction.
- **`components/workspace/workflow-actions.tsx`**: Full-workflow CTA visibility is now based on content/output intent rather than only `workspaceMode`, and the helper text no longer teaches hidden “video modes” as the main product model.

**Reason**:
- T-010 already changed the real system model. These pages were still reinforcing the older workspace-mode framing, which would keep reintroducing conceptual drift for users and future code edits.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 03:05 — Agent: Codex

### T-010 Entry Sync: Intent-Aware Today/Trend Starts

**Changes**:
- **`lib/project-intent.ts`**: Added a shared dashboard-create href helper so topic/intent entry links no longer hand-build legacy `prefill` URLs in multiple places.
- **`app/page.tsx`** and **`components/dashboard/project-form.tsx`**: Dashboard project creation now accepts query-prefilled `topic`, `title`, `contentLine`, and `outputType`, so old side-entry shortcuts can land directly in the new minimal create flow.
- **`components/today/today-workbench.tsx`**: The fact-to-script generation path now sends explicit `contentLine: "MARS_CITIZEN"` and `outputType: "NARRATIVE_SCRIPT"` into the generate hook, removing the accidental default/fallback behavior. Topic quick actions now push intent-aware create links instead of `/?prefill=true...`.
- **`components/trend-discovery/trend-discovery-workbench.tsx`**: Topic-to-project creation now uses the same intent-aware dashboard entry path rather than the legacy prefill shortcut.

**Reason**:
- This closes the most immediate T-010 entry inconsistency: the system had a new intent-first project model, but some high-traffic starts still skipped it and depended on old URL conventions or implicit defaults.

**Verification**:
- `npm run build` pending at handoff

---

## 2026-03-20 03:24 — Agent: Codex

### T-010 Workflow Compatibility: Shell Projects No Longer Crash

**Changes**:
- **`services/workflow.service.ts`**: Removed the hard failure on empty `raw_script_text`. Full workflow now always runs trend research first, then chooses the deepest valid next action based on project intent and available inputs.
- **`services/workflow.service.ts`**: Storyboard outputs (`STORYBOARD_SCRIPT`, `AD_STORYBOARD`) now trigger storyboard generation inside the workflow path, which allows shell projects to stay valid even when no original script was entered.
- **`services/workflow.service.ts`**: Script-only short-video flows now return `script_generation_status: "skipped_missing_raw_script"` when they cannot produce a rewrite yet, instead of throwing. Scene results are collected from the latest saved scene state rather than only from the original rewrite loop.

**Reason**:
- T-010 already introduced shell project creation and storyboard-first generation. The old workflow behavior still assumed every project had to start from a raw script, which made the architecture internally inconsistent.

**Verification**:
- `npm run build` ✅

---

## 2026-03-20 02:28 — Agent: Codex

### T-010 Sync Audit: Stable Foundation, Clear Remaining Push

**What we verified**:
- The current T-010 worktree is coherent with the docs: the intent model, shell project creation, storyboard-first generation, minimal-first dashboard, shared project-creation surface, and initial news generator registry are all in place.
- Most active code changes in the worktree still belong to this one architecture task rather than unrelated feature work.

**Remaining gaps we identified**:
- **`services/workflow.service.ts`**: still assumes a raw-script-first “full workflow” and throws when `raw_script_text` is empty, which conflicts with shell projects and storyboard-first outputs.
- **`components/workspace/workflow-actions.tsx`**, **`app/help-center/page.tsx`**, **`app/trend-explorer/page.tsx`**, **`app/brief-studio/page.tsx`**: still contain older `workspaceMode`-first or short-video-first flow language, so parts of the UI are conceptually behind the new intent model.
- **`components/today/today-workbench.tsx`** and **`components/trend-discovery/trend-discovery-workbench.tsx`**: still rely on the old `/?prefill=true&title=...&topic=...` shortcut instead of an intent-first create/output path.
- **Generator coverage**: only the news entry has a registry seam so far. Most other output types are still not first-class execution handlers yet.

**Why this matters**:
- T-010 is no longer blocked by missing foundations. The remaining work is mostly about removing old workflow assumptions and extending the same intent/output architecture consistently across the rest of the app.

## 2026-03-20 02:09 — Agent: Codex

### Shared Project Creation Surface + Initial News Generator Registry

**Changes**:
- **`components/dashboard/project-form.tsx`**: Upgraded the shared create form to support both full-page dashboard mode and compact embedded mode, while keeping one submit path and one set of intent/default rules.
- **`components/settings/project-manager.tsx`**: Replaced the separate Settings-side create form with the shared compact `ProjectForm`, removing the second independent implementation of project creation.
- **`services/news-script-generator-registry.ts`** (new): Added an explicit registry/type layer for the currently supported news-entry outputs (`NARRATIVE_SCRIPT`, `AD_SCRIPT`).
- **`services/news-script.service.ts`**: Switched news-script dispatch to use the registry instead of keeping support checks and output routing as ad-hoc local branching only.

**Reason**: Future simplification work should happen once, not twice. This pass removes create-flow drift between Dashboard and Settings and establishes the first small `OutputType -> Generator` execution seam for later expansion.

**Verification**:
- `npm run build` ✅

## 2026-03-20 01:34 — Agent: Codex

### Minimal-First Dashboard + Lightweight Project Creation

**Changes**:
- **`app/page.tsx`**: Reworked the default dashboard around one primary next action, a compact status summary, and an optional “more details” disclosure. Removed the old multi-panel “understand the whole system first” feel from the landing experience.
- **`lib/workflow-navigator.ts`**: Simplified next-step routing so Tahoe no longer assumes every project must pass through briefs or trend review before users can make progress. Storyboard-capable outputs route directly to Scene Planner / Render Lab when appropriate.
- **`components/dashboard/project-form.tsx`**: Slimmed the create flow down to intent + topic + optional seed, with advanced controls collapsed by default. The project title is now optional in the UI and falls back to the topic on submit.
- **`components/settings/project-manager.tsx`**: Aligned the secondary create-project entry with the same lightweight behavior so users do not see a more complicated alternative form in Settings.
- **`lib/project-intent.ts`**, **`schemas/project.ts`**, **`services/research-orchestrator.service.ts`**: Centralized the “title falls back to topic” rule so all create flows share one naming fallback instead of duplicating client-side assumptions.

**Reason**: The product should feel like a direct path to a first usable output, not a workflow diagram. This pass intentionally removes default friction and pushes non-essential configuration into optional disclosures.

**Verification**:
- `npm run build` ✅

## 2026-03-20 00:58 — Agent: Codex

### Dual Content Line Architecture: Phase 3 Direct Storyboard Generation

**Changes**:
- **`services/storyboard-generator.service.ts`**: Storyboard generation no longer hard-depends on a pre-existing AI rewrite. It now reuses requested scene data when present, can split a provided script into scenes, can auto-rewrite `raw_script_text`, and finally can synthesize storyboard seed scenes directly from topic + project intent.
- **`services/storyboard-generator.service.ts`**: After resolving scenes, the service now auto-runs scene classification and asset-dependency analysis for any scene that has not been prepared yet, so downstream planners do not start from empty production metadata.
- **`lib/storyboard-seed-prompt.ts`** (new): Added separate seed prompt builders for 火星公民 science videos and Marketing ad storyboards so direct scene generation reflects the two business domains.
- **`components/workspace/generate-storyboard-button.tsx`** (new): Added a reusable UI action that triggers storyboard generation and refreshes the workspace.
- **`app/scene-planner/page.tsx`**: Added direct-generate entry points in both the page header and the empty state, so shell projects can create storyboard data without taking a detour through Script Lab first.
- **`app/script-lab/page.tsx`** and **`app/render-lab/page.tsx`**: Tightened page routing around storyboard-capable outputs instead of relying on the old short-video-only / workspace-mode assumptions.

**Reason**: This completes the current T-010 architecture slice. Users can now start from topic + business line + target output, then go straight into storyboard generation even when they intentionally skipped the narrative-script path.

**Verification**:
- `npm run build` ✅

## 2026-03-20 00:16 — Agent: Codex

### Dual Content Line Architecture: Phase 2 Entry UI + Optional Project Shells

**Changes**:
- **`components/dashboard/project-intent-picker.tsx`** (new): Shared UI picker for `contentLine + outputType`.
- **`components/dashboard/project-form.tsx`**: Replaced “choose workspace mode first” with intent-first project creation. The form now derives `workspaceMode` from the selected output, shows business-line/output summaries, and treats `sourceScript` as optional input.
- **`components/settings/project-manager.tsx`**: Aligned the secondary create-project entry with the same intent-first flow so the app no longer has two conflicting creation patterns.
- **`lib/project-intent.ts`**: Added `outputType -> workspaceMode` mapping, so marketing copy outputs default to `COPYWRITING` while ad outputs default to `PROMOTION`.
- **`schemas/project.ts`**: Relaxed `sourceScript` from required long text to optional/default-empty input on create.
- **`services/research-orchestrator.service.ts`**: Project creation now supports shell projects. If `sourceScript` is empty, `raw_script_text` stays null and no initial user script version is created.

**Reason**: The system now matches the product model more closely: users first decide whether they are working on 火星公民 or Marketing, then select the artifact they want. A project can start from intent + topic even before a full script exists.

**Verification**:
- `npm run build` ✅

**Remaining**:
- Phase 3: Independent storyboard generation directly from topic / intent
- Future refinement: split domain-specific generators further so Mars Citizen and Marketing creation flows are even more explicit

---

## 2026-03-19 19:14 — Agent: Codex

### Dual Content Line Architecture: Intent Routing Foundation

**Changes**:
- **`lib/project-intent.ts`** (new): Central resolver for `contentLine`, `outputType`, `workspaceMode`, and workflow kind. Explicit input is validated strictly; persisted metadata is coerced leniently for backward compatibility.
- **`services/news-script.service.ts`**: News-generation entry now resolves a project intent first and dispatches by `outputType` (`NARRATIVE_SCRIPT` / `AD_SCRIPT`) instead of branching only on `contentLine`.
- **`schemas/project.ts`**: Added optional `outputType` / `output_type` schema support so project intent can be carried through create/update flows.
- **`services/research-orchestrator.service.ts`**: New projects now persist `output_type` alongside `content_line` and normalized `workspace_mode`.
- **`services/workflow.service.ts`**: Workflow routing now branches by resolved `contentLine` (`MARS_CITIZEN` vs `MARKETING`) with backward-compatible fallback from old metadata.
- **`services/promotional-copy.service.ts`** and **`services/workspace-query.service.ts`**: Replaced ad-hoc `workspace_mode` parsing with centralized project-intent resolution.
- **`app/api/projects/route.ts`** and **`app/api/scripts/generate-from-news/route.ts`**: Expose/validate normalized intent fields consistently.

**Reason**: Tahoe is now explicitly a shared production base for two business domains. This change lays the routing foundation so future generator splitting and UI upgrades can build on one canonical intent model instead of scattered metadata checks.

**Verification**:
- `npm run build` ✅

**Remaining**:
- Phase 2 UI: content-line + output-type selection in project creation
- Split domain generators further so Mars Citizen and Marketing live in clearer service boundaries
- Decouple “create project shell” from mandatory `sourceScript` input

---

## 2026-03-19 17:22 — Agent: Antigravity (Claude)

### Dual Content Line Architecture (Phase 1)

**Changes**:
- **`lib/content-line.ts`** (new): Core type system — `ContentLine` (`MARS_CITIZEN` / `MARKETING`), `OutputType` (9 types), metadata helpers in zh/en, backwards-compatible mapping from `WorkspaceMode`.
- **`lib/mars-citizen-prompt.ts`** (new): Science narrative prompt builder for 火星公民 content line. Uses science-explorer tone with tech breakthrough emphasis.
- **`lib/ad-script-prompt.ts`** (new): Marketing persuasion prompt builder. Uses hook→pain→solution→proof→CTA structure.
- **`services/news-script.service.ts`**: Refactored into `generateNarrativeScript()` (Mars Citizen) and `generateAdScript()` (Marketing) private methods, branching by `contentLine` parameter.
- **`hooks/use-generate-script.ts`**: Added optional `GenerateOptions` parameter (`contentLine`, `outputType`).
- **`app/api/scripts/generate-from-news/route.ts`**: Added `contentLine` and `outputType` to request schema.
- **`schemas/project.ts`**: Added `contentLine` to both create and update schemas.
- **`services/research-orchestrator.service.ts`**: Stores `content_line` in project metadata, derived from input or inferred from `workspaceMode`.
- **`app/api/projects/route.ts`**: Exposes `content_line` in project list response (defaults to `MARS_CITIZEN` for old projects).

**Reason**: System now explicitly distinguishes between two content lines with different prompt templates, output structures, and branding. This is the data layer + prompt branching foundation for the full dual-line architecture.

**No schema migration needed**: `content_line` stored in existing `metadata` JSON field.

**Remaining**: Phase 2 (UI entry point upgrade with content line picker), Phase 3 (independent storyboard generation from topic).

---

## 2026-03-17 10:29 — Agent: Codex

### Hot Topics: China-Focused Search Strategy Evaluation

**Context**:
- User wants to improve Stage 1 hot-topic collection by adding domestic Chinese data sources.
- Reviewed `pipeline_analysis.md.resolved` and current search pipeline implementation.

**What we confirmed**:
- The current hot-topics route only aggregates platform connectors plus one news search call: `app/api/research/hot-topics/route.ts`.
- Current Serper requests are US/English biased:
  - `services/news-search/serper.ts` uses `gl: "us"` and `hl: "en"`
  - `services/web-search/serper-search.service.ts` also defaults to `gl: "us"`
- `services/web-search/serper-search.service.ts` already has a useful primitive for scoped search: `searchPlatformContent({ siteDomain })`.

**Recommendation**:
- Do **not** build the domestic trend expansion around unverified "official" Baidu / Sogou / 360 search APIs from AI-generated suggestions. Treat that route as unreliable unless a real, stable, documented API is verified later.
- Prefer a lower-risk extension of the existing Serper pipeline:
  - add CN-oriented search settings (`gl: "cn"`, `hl: "zh-cn"`) for Chinese queries
  - add indexed public-page search such as `site:xiaohongshu.com` and `site:douyin.com`
  - optionally add selected Chinese news/community domains as extra evidence sources
  - ingest this data as **indexed evidence**, not as first-party platform data

**Why this path**:
- Reuses the existing production search provider and avoids a new provider migration
- Avoids scraper/legal/anti-bot maintenance burden
- Matches the existing code structure with minimal surface-area changes
- Gives broader Chinese coverage even though it is not true real-time platform-native search

**Important caveat for next agents**:
- The earlier `pipeline_analysis.md.resolved` note saying Stage 3 auto-storyboard generation was missing is now outdated. `T-008` completed auto-storyboard generation on 2026-03-17. Use that document only for the Stage 1 search expansion idea, not as the current source of truth for the whole pipeline.

**Suggested implementation order**:
- 1. Add CN search profile support to Serper-backed services
- 2. Extend `/api/research/hot-topics` to fetch indexed CN evidence in parallel
- 3. Tag and weight indexed evidence separately in scoring/aggregation
- 4. Surface source labels clearly in UI so users know whether evidence is native-platform or search-index derived

**Left undone**:
- No code changes yet to the search pipeline
- Logged follow-up task as `T-009`

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

## 2026-03-20 22:40 — Agent: Codex

### Task: T-010 Artifact review surfaces

**Changes**:
- Modified `services/workspace-query.service.ts` — exposed structured read models for Mars output packs (`VIDEO_TITLE`, `PUBLISH_COPY`) and Marketing ad creative artifacts (`AD_CREATIVE`) instead of forcing UI code to inspect raw strategy tasks ad hoc.
- Modified `components/workspace/script-lab-workbench.tsx` and `app/script-lab/page.tsx` — Script Lab now shows a compact “发布包装” area with latest title pack and publish copy before the scene editor, so Mars Citizen outputs are visible where the user is already polishing script/story beats.
- Modified `components/workspace/marketing-ops-workbench.tsx` — Marketing Ops now surfaces the latest ad creative brief at the top of the workspace so copy, ad script, and storyboard can stay anchored to one visible creative direction.
- Modified `components/dashboard/output-studio.tsx` — `VIDEO_TITLE` / `PUBLISH_COPY` generation now redirects into Script Lab, matching the place where those artifacts are reviewed.
- Updated `docs/TASKS.md` to mark the artifact review slice complete.

**Reason**: The unified output generator already existed, but the new outputs still felt invisible after generation. This closes the loop so generation leads directly to readable artifacts instead of hidden database rows.

**Remaining**:
- Add lightweight inline editing/copy affordances for the new artifact panels
- Keep reducing leftover `workspaceMode` compatibility assumptions in secondary helpers/routes

---

## 2026-03-20 23:05 — Agent: Codex

### Task: T-010 Artifact action surfaces

**Changes**:
- Modified `components/workspace/script-lab-workbench.tsx` — added one-click copy actions for the latest video-title pack and publish-copy pack, so Mars packaging outputs can be reused immediately without leaving Script Lab.
- Modified `components/workspace/marketing-ops-workbench.tsx` — added “copy creative brief” and “use in editor” actions for the latest ad creative pack, allowing the current creative direction to seed master-angle / hook / selling-point fields directly inside the existing editor.
- Updated `docs/TASKS.md` to mark the lightweight artifact-action slice complete.

**Reason**: The new result panels were visible but still passive. These actions make them operational while keeping the product simple and avoiding another dedicated editing workflow.

**Remaining**:
- Decide whether Mars packaging artifacts should stay copy-first or gain their own persisted edit/save loop
- Continue cleaning secondary `workspaceMode` compatibility assumptions

---

## 2026-03-20 23:18 — Agent: Codex

### Task: T-010 Mars packaging in-place save

**Changes**:
- Modified `components/workspace/script-lab-workbench.tsx` — the Mars packaging panel now supports in-place editing for `VIDEO_TITLE` and `PUBLISH_COPY`, with “save as new version” actions that persist back into `strategy_tasks`.
- Reused the existing `POST /api/projects/[id]/strategy-tasks` route instead of inventing a second persistence path, keeping the implementation small and consistent with the current artifact model.
- Updated `docs/TASKS.md` to mark the Mars packaging edit slice complete.

**Reason**: Copy-only actions were useful, but they still forced the user to edit elsewhere. This closes the loop for Mars Citizen packaging while keeping the UI compact and avoiding another dedicated packaging workflow.

**Remaining**:
- Decide whether Marketing ad creative should also gain a persisted save loop or remain a brief that seeds downstream editors
- Continue reducing secondary `workspaceMode` compatibility assumptions

---

## 2026-03-20 23:32 — Agent: Codex

### Task: T-010 Marketing creative in-place save

**Changes**:
- Modified `components/workspace/marketing-ops-workbench.tsx` — the ad creative area now has editable fields for audience, angle, hook, selling points, visual direction, shot tone, and CTA, plus a “save as new version” action.
- Reused the existing `POST /api/projects/[id]/strategy-tasks` persistence path so edited creative briefs save back as normal `AD_CREATIVE` strategy-task versions instead of inventing a separate storage model.
- Updated `docs/TASKS.md` to mark the Marketing creative edit slice complete.

**Reason**: The ad creative panel had become useful as a visible brief, but it was still read-only. This closes the loop for Marketing the same way Mars packaging already works: review, tweak, save, continue downstream.

**Remaining**:
- Decide whether `AD_STORYBOARD` should become directly editable/operable inside Marketing Ops instead of mostly living in Scene Planner
- Continue reducing secondary `workspaceMode` compatibility assumptions

---

## 2026-03-20 23:46 — Agent: Codex

### Task: T-010 Marketing storyboard bridge

**Changes**:
- Modified `services/workspace-query.service.ts` — added a compact storyboard summary to `marketingOverview` so Marketing Ops can read current storyboard version, frame count, and ready-frame count without duplicating full planner state.
- Modified `components/workspace/marketing-ops-workbench.tsx` — added a lightweight “广告分镜” bridge card with storyboard status plus direct actions to generate a storyboard or open Scene Planner.
- Updated `docs/TASKS.md` to mark the Marketing storyboard bridge slice complete.

**Reason**: Marketing had creative + copy editing in one place, but storyboard still felt like an abrupt context switch. This adds a visible bridge without collapsing Scene Planner into Marketing Ops or reintroducing a bulky workflow UI.

**Remaining**:
- Decide whether Marketing Ops should eventually show a lightweight storyboard preview/edit slice, or keep the current bridge-card + dedicated Scene Planner boundary
- Continue reducing secondary `workspaceMode` compatibility assumptions

---

## 2026-03-21 00:08 — Agent: Codex

### Task: T-010 Today entry alignment

**Changes**:
- Modified `components/today/today-quick-actions.tsx` — replaced the older generic quick-action buckets with four concrete artifact-oriented entry points: 火星公民脚本、发布包装、Marketing 文案、广告分镜.
- Modified `components/today/today-workbench.tsx` — material basket actions now route selected topics/materials into the same dual-line intent system used elsewhere. The basket no longer only leads to “generate script”; it now branches into Mars packaging and Marketing output paths too.
- Updated `docs/TASKS.md` to mark the Today entry alignment slice complete.

**Reason**: Today should be the discovery/start surface for the same production system we just built, not a parallel mini-product with older action names and mismatched next steps.

**Remaining**:
- Decide whether Marketing outputs in Today should eventually support direct generation from selected materials, instead of always going through dashboard intent creation first
- Continue reducing secondary `workspaceMode` compatibility assumptions

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
