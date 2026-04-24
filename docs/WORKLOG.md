# Worklog

> Concise handoff records. Each entry should help the next agent pick up immediately.
> Keep entries short — focus on what changed, why, and what's left.

---

## 2026-04-24 14:18 — Agent: Codex

### Task: T-014 DeepSeek V4 second AI快讯 article package

**Changes**:
- Created a new cloud Tahoe project for the next AI快讯 article:
  - project `cmocijq2u0000v6bgidcs789o`
  - title `DeepSeek V4发布：真正刺痛大模型市场的，不是参数，而是底价`
  - script `cmocilcwa0005v6bgjvlg3cg9`
- Added manual title-pack strategy task `cmocir4uc0007v6bghgr5hsqi`.
- Added manual publish-copy strategy task `cmocir4vi0009v6bgb2kfsz7s`.
- Added image-brief storyboard `cmocir4vv000bv6bggqolczgu` with three rows:
  - cover: open-source AI repricing
  - body image 1: V4-Pro / V4-Flash split
  - body image 2: 1M context for real work materials

**Reason**:
- The user wanted the next article after GPT5.5 to keep the same or higher quality. The chosen angle avoids a generic "domestic model released" summary and frames DeepSeek V4 as a pricing/ecosystem pressure event for the large-model market.

**Verification / Caveats**:
- Cloud project creation succeeded.
- Serper news search returned live DeepSeek V4 release coverage.
- X platform collection failed on cloud because X credentials are missing (`CONFIG_MISSING`); the article package currently relies on live news evidence, not X social evidence.
- Before real publication, perform one more official-source check against DeepSeek / Hugging Face / API docs because the current event is very fresh and model details may still change.

---

## 2026-04-24 13:55 — Agent: Codex

### Task: T-014 AI快讯 long-form article quality correction

**Changes**:
- Modified `lib/mars-citizen-prompt.ts` — changed AI快讯 / owned-media narrative generation from a short technology update prompt into a Toutiao-first long-form article prompt. The prompt now asks for a hook, source-grounded explanation, 3-5 change points, explicit judgment lines, mobile-readable short paragraphs, and roughly 1800-2600 Chinese characters when materials support it.
- Modified `lib/output-type-copy-prompt.ts` — renamed `NARRATIVE_SCRIPT` guidance from a narrative science script to a Toutiao-first long-form article draft.
- Modified `lib/copy-review-panel.ts` — added review calibration that penalizes owned-media main drafts that read like short summaries instead of full articles.
- Updated cloud inspection project `cmocgo05k0000v6w47xyxcr39` through Tahoe API: added long-form script version `cmochr99s0001v6eixxzgpkhh`, changed the project title to `GPT-5.5来了，真正该看的不是更强，而是更省 — AI快讯`, and updated project background/core idea/style reference to the long-form angle.
- Updated `docs/GPT55_ARTICLE_RUNBOOK.md`, `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Reason**:
- The cloud GPT5.5 inspection draft was technically present but too short. It read like a compressed news explanation, while the desired target is closer to high-quality Chinese tech commentary: a stronger first screen, fuller argument, concrete reader impact, and a memorable closing.

**Verification**:
- `npm run lint` passed with 0 errors and 16 existing warnings.
- `npm run build` passed.
- Cloud API accepted the new script version and project metadata update.

---

## 2026-04-24 10:35 — Agent: Codex

### Task: T-014 GPT-5.5 owned-media dry run + breaking-news review calibration

**Changes**:
- Modified `app/api/research/hot-topics/route.ts` — wrapped hot-topics success responses in the standard `ok(...)` envelope so `useHotTopics()` and `Daily Run` stop crashing on `response.data.news`.
- Modified `lib/copy-review-panel.ts` — tightened reviewer instructions so breaking-news drafts and packaging are judged against Tahoe's own `proofPoints` / source packet instead of stale world-memory fact checks or invented missing metrics.
- Modified `services/project-output-generator.service.ts` — title-pack and publish-copy audience reviews now receive extracted source bullets from the latest script payload, not only the generated titles/highlights.
- Modified `lib/mars-citizen-prompt.ts` — tightened AI快讯 main-draft prompting so each change point must land on an ordinary-reader-visible consequence, not just a model-upgrade summary.
- Modified `lib/image-brief-review.ts` — zero-reference infographic / concept-image rows now stay viable when the prompt itself already carries strong camera/composition direction and the row is asset-ready.
- Modified `lib/output-artifact-prompt.ts` — tightened title generation to avoid generic `三点变化 / 最值得关注` style packaging and push titles toward one concrete user-perceivable change.

**Reason**:
- Tahoe could already execute the article pipeline, but the GPT-5.5 run exposed two weak seams: breaking-news reviews were not grounded enough in Tahoe's own source packet, and image-brief review over-penalized reference-free infographic prompts. Those issues made the pipeline look weaker than it actually was.

**Verification**:
- Real Tahoe source collection for GPT-5.5 succeeded after switching settings away from mock news
- Real Tahoe-owned workflow completed against GPT-5.5:
  - signal search
  - direct draft start
  - title-pack generation
  - publish-copy generation
  - storyboard/image-brief generation
  - render-job creation
  - render-job feedback writeback
- Key run artifacts:
  - project `cmocc5cfq0034s0v59k0ot713`
  - script `cmocc5tij0036s0v5r5b4g6p4`
  - title-pack candidate `cmocd06tc004qs0v5adc0hhg9`
  - publish-copy `cmocc80ju003js0v58wk4zt9z`

---

## 2026-04-23 10:20 — Agent: Codex

### Task: T-014 Business model and operating-flow baseline

**Changes**:
- Added `docs/BUSINESS_MODEL.md` — wrote down Tahoe's core operating flow, dual-engine revenue model, strategic edge, account-role split, and 30-day priorities.
- Updated `docs/CONTENT_MATRIX_STRATEGY.md` — linked the new business-model baseline so editorial strategy and operating strategy no longer live only in chat history.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md` — recorded that Tahoe should be judged against the article-and-image loop plus the owned-media/service dual-engine model.

**Reason**:
- The project needed a durable answer to three recurring questions: what the end-to-end flow is, how Tahoe makes money, and what strategic edge it should build. Those answers were implicit across recent discussions but not yet written into one operational baseline.

**Verification**:
- docs-only change; build not run

---

## 2026-04-23 10:45 — Agent: Codex

### Task: T-014 Daily Run product-plan baseline

**Changes**:
- Added `docs/DAILY_RUN_PLAN.md` — defined the near-term daily article pipeline, the proposed `Daily Run / 每日运行台`, the stage model (`signal -> topic -> draft -> review -> image -> package`), the item-status model, and the next-action logic.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md` — recorded that the next orchestration layer should be a daily operational surface instead of more disconnected workbenches.

**Reason**:
- The immediate bottleneck is not missing generation capability. It is that daily production still requires manual stitching across multiple pages. The project needed a written product baseline for how daily signal collection, triage, drafting, review, image production, and publish packaging should be tied together.

**Verification**:
- docs-only change; build not run

---

## 2026-04-23 11:20 — Agent: Codex

### Task: T-014 Daily Run shell implementation

**Changes**:
- Added `app/daily-run/page.tsx` — created the first `Daily Run / 每日运行台` page shell with three account-lane cards, stage counters, a global work queue, and one computed next action per recent project.
- Modified `components/dashboard/sidebar.tsx` and `lib/locale-copy.ts` — added a dedicated sidebar entry and page/navigation copy for `Daily Run`.
- Modified `services/workspace-query.service.ts` — extended the project list read model with lightweight artifact counts (`script_count`, `render_job_count`, `strategy_task_count`) so the page can infer current production stage without a new table.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Reason**:
- The product already had most of the necessary workbenches, but no daily operational entry that made status and next action obvious. This first version proves the page shape before a heavier daily-run persistence model is introduced.

**Verification**:
- `npm run build` pending at this step

---

## 2026-04-23 11:45 — Agent: Codex

### Task: T-014 Daily Run manual signal intake bridge

**Changes**:
- Added `components/daily-run/daily-run-signal-panel.tsx` — reused the existing `useHotTopics()` manual search hook inside Daily Run, showing recommended topics and fresh source material without auto-search on mount.
- Modified `app/daily-run/page.tsx` — mounted the new signal panel above the queue so Daily Run now covers both signal intake and project status.
- Modified `app/page.tsx` and `components/dashboard/project-form.tsx` — added support for passing an owned-media preset through the homepage create form, so a topic selected in Daily Run can open the project shell with the correct lane context already attached.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Reason**:
- Daily Run needed to stop being only a read-only queue. The most useful next step was to bridge today's signal search directly into lane-specific project creation, while still preserving the no-auto-search rule and avoiding a premature queue table.

**Verification**:
- `npm run build` pending at this step

---

## 2026-04-23 12:55 — Agent: Codex

### Task: T-014 Daily Run direct draft start from signal cards

**Changes**:
- Modified `components/daily-run/daily-run-signal-panel.tsx` — lane buttons now reuse `/api/scripts/generate-from-news` to start a first draft directly from the selected signal, then patch the created project with lane-specific editorial metadata and trigger background scene splitting before opening `Script Lab`.
- Modified `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md` — documented that Daily Run now starts a lane-bound owned-media draft directly from the topic card instead of only creating an empty project shell.

**Reason**:
- Direct project creation still left one manual step too many. The next useful increment was to make Daily Run produce an actual first draft from the selected signal, so the user lands in `Script Lab` with work already underway.

**Verification**:
- `npm run build` passed

---

## 2026-04-23 12:05 — Agent: Codex

### Task: T-014 Daily Run direct project creation + lightweight triage state

**Changes**:
- Modified `components/daily-run/daily-run-signal-panel.tsx` — topic cards can now be marked `保留 / 忽略` in browser session storage and can create a lane-bound owned-media project directly into `Script Lab`.
- Modified `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md` — documented that the current triage state is session-only and that Daily Run no longer needs to bounce through the homepage create form to start work.

**Reason**:
- The previous bridge still inserted unnecessary friction: after choosing a topic and lane, the user had to go back through the homepage create form. The shortest useful next step was to let Daily Run create the project directly, while still keeping triage state lightweight until a real queue model exists.

**Verification**:
- `npm run build` pending at this step

---

## 2026-04-15 12:25 — Agent: Codex

### Task: T-014 Owned-media preset switch to the new three-account plan

**Changes**:
- Modified `lib/editorial-direction-presets.ts` — kept the existing compatibility IDs, but replaced the shared owned-media preset family with the new account plan: `AI快讯`, `全球股市`, and `消费时尚`. Updated each preset's topic, introduction, core idea, style sample, brand baseline, content pillars, and brief skeleton.
- Modified `app/page.tsx` — replaced the homepage strategy-track labels so the three-account plan is visible on the main no-project surface in both Chinese and English.
- Updated `docs/CONTENT_MATRIX_STRATEGY.md`, `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md` to make the new three-account plan the active documented baseline.

**Reason**:
- The owned-media plan changed from the earlier three directions to a new three-account structure. The shared preset source had to move first so project creation, Brand Profiles, Brief Studio, and homepage strategy copy all point to the same current operating model.

**Verification**:
- `npm run build` pending at this step

---

## 2026-04-12 11:40 — Agent: Codex

### Task: T-015 Local end-to-end create-flow hardening

**Changes**:
- Modified `lib/project-brief.ts` — `suggestProjectTitles(...)` now returns no candidates when the current topic is blank, preventing the homepage create form from auto-filling a misleading project title before the user has entered the current piece idea.
- Modified `components/dashboard/project-form.tsx` — reset `titleSuggestionIndex` whenever the topic or workspace mode changes, and clear the auto title when the topic is empty unless the title has been manually overridden.
- Added `lib/published-at.ts` — centralized parsing for research/news timestamps, including relative Chinese/English strings (`3 天前`, `1 个月前`, `2 days ago`) and Chinese absolute dates (`2026年1月5日`).
- Modified `services/research-orchestrator.service.ts` and `services/research-job.service.ts` — replaced raw `new Date(item.published_at)` inserts with the shared parser so `trendEvidence.createMany()` no longer crashes on relative timestamps from search/news sources.
- Modified `services/app-settings.service.ts` — removed the stale `serpapi_key` default from settings upsert payloads so Prisma no longer throws on an unknown field.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Reason**:
- Local end-to-end verification still found system-owned failures in the first-run path. A copy-first user could hit a create failure caused by invisible defaults or external timestamp formats, so the persistence layer had to be normalized before another round of UX polish.

**Verification**:
- `npm run build` ✅
- `GET /api/health` returned `database: ok` after local DB alignment
- `POST /api/projects` returned `201`
- created-project routes returned `200` on `/`, `/script-lab`, and `/scene-planner`

---

## 2026-04-12 14:59 — Agent: Codex

### Task: T-015 Full owned-media chain verification + trend-score NaN fix

**Changes**:
- Modified `services/trend-scoring/formulas.ts` — replaced raw `new Date(item.published_at)` usage with `parsePublishedAt(...)` and hardened `clampScore(...)` so non-finite values collapse to `0` instead of leaking `NaN` into `momentum_score`.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Reason**:
- Full local chain verification still found one hidden backend bug after the earlier create-flow fixes. If upstream content carried noisy date values, `velocity_score` and `total_score` could become `NaN`, which later surfaced as a misleading Prisma nested-create error (`momentum_score is missing`) during project creation.

**Verification**:
- `POST /api/projects` ✅
- `POST /api/projects/[id]/scripts/rewrite` ✅
- `POST /api/projects/[id]/storyboards/generate` ✅
- `POST /api/projects/[id]/render-jobs` ✅
- `PATCH /api/projects/[id]/render-jobs/[jobId]` ✅
- `POST /api/projects/[id]/generate-output` for `VIDEO_TITLE` ✅
- `POST /api/projects/[id]/generate-output` for `PUBLISH_COPY` ✅
- `GET /`, `GET /script-lab`, `GET /scene-planner`, `GET /render-lab` for the created project all returned `200`

---

## 2026-04-11 17:35 — Agent: Antigravity

### Task: T-014 Image-first terminology sweep across user-visible surfaces

**Changes**:
- Modified `app/page.tsx` — replaced remaining storyboard/video-era labels in dashboard focus reasons, stat card captions, and status labels. Changed 东方元气 icon from `BriefcaseBusiness` to `Heart`. Renamed "视觉条目" → "配图条目", "视觉脚本" → "配图说明", "分镜 / 生成准备" → "配图说明 / 图片生产" across both Chinese and English surfaces.
- Modified `components/dashboard/project-form.tsx` — replaced "配图脚本" → "配图说明" in the owned-media flow summary and storyboard-script flow line.
- Modified `lib/workspace-mode.ts` — replaced "配图脚本" → "配图说明" in the `SHORT_VIDEO` workspace mode description.
- Modified `components/dashboard/sidebar.tsx` — replaced sidebar hint "素材与分镜规划" → "配图说明与素材" for Scene Planner nav.
- Modified `app/script-lab/page.tsx` — replaced "做分镜与素材" → "配图说明" in the next-step CTA label.
- Modified `components/workspace/script-lab-workbench.tsx` — replaced 3 remaining "分镜 / 生成准备" references in the feedback logic with "配图说明 / 图片生产".

**Reason**:
- The product focus is article + static-image publishing, but the pages most visible to new users — homepage, create form, sidebar, and Script Lab — still leaked storyboard/video-era terminology at several points. This pass cleans the first-run-critical surfaces while keeping internal schema compatibility untouched.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 10:28 — Agent: Codex

### Task: T-014 Image-brief readiness review

**Changes**:
- Added `lib/image-brief-review.ts` — introduced a lightweight heuristic review that scores each image-brief row on prompt specificity, reference coverage, asset readiness, composition guidance, and current risk flags.
- Modified `components/workspace/scene-planner-workbench.tsx` — each image-brief row now shows a compact `可开工 / 待补强` readiness badge, and the detail panel now includes a short “图片 brief 复核” block with score, main issues, and next actions.
- Modified `components/workspace/render-lab-workbench.tsx` — the image-job editor now surfaces the same readiness review above the form so users can see the main brief gap before creating a new image task.
- Updated `docs/TASKS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.

**Reason**:
- After changing these surfaces to image-first language, the next weak spot was that Tahoe still treated any non-empty prompt as enough to start image generation. The system now makes prompt/reference/composition gaps visible before users spend generation attempts on a weak row.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 10:54 — Agent: Codex

### Task: T-014 Image-job outcome feedback loop

**Changes**:
- Modified `schemas/production-control.ts` — added a compact `renderJobFeedbackSchema` with one verdict, a small issue-tag set, and an optional short note.
- Modified `services/render-job.service.ts` — added `updateFeedback(...)` so Tahoe can persist structured image-run feedback into `render_jobs.output_json.feedback` without changing the database schema.
- Added `app/api/projects/[id]/render-jobs/[jobId]/route.ts` — introduced a `PATCH` endpoint for saving per-job feedback.
- Modified `components/workspace/render-lab-workbench.tsx` — image-job history now indicates when feedback exists, and the right-side job detail panel now includes a small result-feedback form (`保留这一版 / 继续重试 / 先改 brief` + issue tags + short note).
- Updated `docs/TASKS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.

**Reason**:
- The new image-brief readiness review was still only a heuristic. Tahoe now needs real image-run outcomes captured on the job record itself so future prompt/brief quality checks can learn from actual failures instead of only generic rules.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 11:16 — Agent: Codex

### Task: T-014 Feed image-job outcomes back into Scene Planner

**Changes**:
- Added `lib/render-job-feedback.ts` — extracted shared helpers for parsing saved image-run feedback, labeling issue tags, and summarizing recent row-level failure patterns.
- Modified `components/workspace/render-lab-workbench.tsx` — moved result-feedback parsing/labels onto the shared helper so Render Lab and Scene Planner now read from the same feedback layer.
- Modified `app/scene-planner/page.tsx` — passed the recent render jobs into the Scene Planner workbench.
- Modified `components/workspace/scene-planner-workbench.tsx` — rows now show when recent retry / rewrite history exists, and the detail panel now includes a compact “最近出图反馈” block with latest verdict, top issue tags, and the latest short note.
- Updated `docs/TASKS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.

**Reason**:
- Once Tahoe started saving image-run outcome feedback, keeping that information only inside Render Lab left the planning surface blind to the most useful signal. The planner now shows the recent failure pattern before users launch another image attempt.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 09:56 — Agent: Codex

### Task: T-014 Image-first language pass for Scene Planner + Render Lab

**Changes**:
- Modified `lib/locale-copy.ts` — renamed the two production-side surfaces in user-facing copy from storyboard/render-first language to `配图说明 / 图片生产`, and tightened sidebar hints accordingly.
- Modified `app/scene-planner/page.tsx` — updated page-level header actions, empty states, and fallback copy so the page now guides users toward image-brief work instead of storyboard-first/video-first work.
- Modified `app/render-lab/page.tsx` — updated page-level copy so the page now teaches image-job creation first and points users back to `主稿与发布包装` or `配图说明` instead of generic render/video framing.
- Modified `components/workspace/generate-storyboard-button.tsx` — changed the default CTA text to `生成配图说明 / Generate Image Brief`.
- Modified `components/workspace/scene-planner-workbench.tsx` — retitled the main stats, cards, and detail panel around `配图条目 / 配图说明 / 参考素材`, without changing the underlying data model.
- Modified `components/workspace/render-lab-workbench.tsx` — retitled the main cards and empty states to `图片任务`, `图片任务编辑区`, and `图片任务历史`, and changed the primary create CTA from `创建渲染任务` to `创建图片任务`.
- Updated `docs/TASKS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.

**Reason**:
- After the product focus moved to article + static-image publishing, these pages were still teaching users to think in storyboard/render/video terms. The immediate fix was to change the user-facing language while keeping the current backend compatibility layer intact.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 01:20 — Agent: Codex

### Task: T-014 Shared editorial presets for Brand Profiles + Brief Studio

**Changes**:
- Added `lib/editorial-direction-presets.ts` — centralized the three owned-media directions (`AI增长官`, `金钱不眠`, `东方元气`) into one reusable preset source that now carries:
  - project-shell defaults
  - brand-profile defaults
  - default content pillars
  - brief defaults
- Modified `components/dashboard/project-form.tsx` — the existing quick direction presets now reuse the shared preset source and also prefill style-reference guidance.
- Modified `components/workspace/brand-profile-workbench.tsx` — added short direction preset cards above the create form. Applying one preset now pre-fills the visible brand fields and also submits hidden brand skeleton fields (`core_belief`, `target_personas`, `product_lines`, `compliance_notes`, metadata). After creating a profile from a preset, Tahoe also auto-creates the first default content pillars.
- Modified `components/workspace/brief-studio-workbench.tsx` — added the same short direction preset cards above the brief form and wired them to prefill title, objective, tone, audience, platforms, key message, CTA, target audience, and default constraints.
- Modified `components/workspace/brief-studio-workbench.tsx` — normalized brief platform values to the schema-safe set (`XHS`, `DOUYIN`, `YOUTUBE`, `X`, `TIKTOK`) and removed the old create-form reliance on `XIAOHONGSHU` / `BRAND_PAGE`, which could drift away from the backend schema.
- Modified `app/brief-studio/page.tsx` — tightened remaining owned-media helper copy so the page now talks about main drafts and image planning instead of script/storyboard-first language.
- Updated `docs/TASKS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.

**Reason**:
- The next valuable step after quick project presets was to make the same three editorial directions reusable deeper in the workflow. Doing that without a shared source would create drift immediately. Brief Studio also had a latent platform-value mismatch that needed to be fixed before adding more presets on top.

**Verification**:
- `npm run build` ✅

---

## 2026-04-11 00:35 — Agent: Codex

### Task: T-014 Card-copy tightening + owned-media quick presets

**Changes**:
- Modified `app/page.tsx` — shortened homepage start-card descriptions and footers so cards signal direction without explaining the full workflow inside each card.
- Modified `lib/content-line.ts` and `components/dashboard/project-intent-picker.tsx` — tightened business-line and output-type card descriptions; the owned-media package block is now a compact asset row instead of a longer explanatory paragraph.
- Modified `components/dashboard/project-form.tsx` — switched key inputs to controlled state and added three quick owned-media presets (`AI增长官`, `金钱不眠`, `东方元气`) that prefill topic, project introduction, and core idea for faster project creation.
- Updated `docs/TASKS.md` and `docs/PROJECT_STATE.md`.

**Reason**: The user asked to keep feature cards concise and to start turning the three editorial directions into something operational. The fastest useful move was to shorten entry-card copy and make those three directions directly selectable in the shared project-creation form.

**Verification**:
- `npm run build` ✅

---

## 2026-04-10 10:45 — Agent: Codex

### Task: T-014 Owned-media main-draft audience review

**Changes**:
- Modified `services/news-script.service.ts` — owned-media narrative draft generation now backfills a persisted `audience_panel_review` onto `script.structured_output` using the same Chinese-media calibration + four-audience panel pattern already used in Marketing and packaging review.
- Modified `services/workspace-query.service.ts` — the workspace read model now keeps the latest previewable structured draft available instead of only exposing the absolute latest script row, so later rewrite/scene records do not hide the main article draft.
- Modified `components/workspace/script-preview-panel.tsx` — the pre-scene preview now shows main-draft audience scores, verdict, calibration summary, and reviewer concerns directly above the structured opening/body/closing sections.
- Modified `components/workspace/script-lab-workbench.tsx` and `app/script-lab/page.tsx` — Script Lab now carries the latest structured main draft into the workbench and shows a dedicated “主稿复核” block even after scene rows exist. Top-level “当前判断” also prioritizes main-draft audience objections before packaging advice.
- Updated `docs/TASKS.md`, `docs/DECISIONS.md`, and `docs/PROJECT_STATE.md`.

**Reason**: Packaging review was already strong, but the owned-media article itself still lacked a persistent quality layer. That created the wrong optimization order. The system now judges the main draft as a publishable article first, and keeps that verdict visible after downstream scene work starts.

**Verification**:
- `npm run build` ✅

---

## 2026-03-24 16:27 — Agent: Antigravity

### Serper-Based Platform Connectors for XHS, Douyin, TikTok

**Changes**:
- **`services/platform-connectors/serper-base.ts`** (new): Shared base class for Serper site-scoped Google search connectors. Uses `site:domain.com` query pattern, transforms organic results into `ContentItem`/`Creator`.
- **`services/platform-connectors/xhs.ts`**: Rewrote stub → uses Serper `site:xiaohongshu.com`, Chinese locale.
- **`services/platform-connectors/douyin.ts`**: Rewrote stub → uses Serper `site:douyin.com`, Chinese locale.
- **`services/platform-connectors/tiktok.ts`**: Rewrote stub → uses Serper `site:tiktok.com`, English locale.
- **`lib/env.ts`**: Changed env key mapping for XHS, DOUYIN, TIKTOK from platform-specific keys → `SERPER_API_KEY` (already configured).
- **`components/today/platform-content-panel.tsx`**: Added Serper snippet extraction fallback for descriptions.

**Verification**:
- `npm run build` ✅

---


### Today Page: Content Line Toggle + Platform Selection

**Changes**:
- **`components/today/today-workbench.tsx`**:
  - Added content line toggle (火星公民 / 商业线) below the section header
  - Added platform checkboxes (YouTube, X, 小红书, 抖音, TikTok) next to the toggle
  - Switching content line auto-presets platforms: Mars Citizen → YouTube+X, Marketing → XHS+DOUYIN+X
  - Users can manually toggle individual platforms on/off (minimum 1 required)
  - Selected platforms are passed to the search function
- **`components/today/platform-content-panel.tsx`**: Expanded to support all 5 platforms (added XHS, DOUYIN, TIKTOK metadata and icons)

**Verification**:
- `npm run build` ✅

---


### Today Page: Independent YouTube & X Content Panels

**Changes**:
- **`components/today/platform-content-panel.tsx`** (new): Reusable panel component that displays platform content items with:
  - Creator name, handle, and follower count (compact notation)
  - Engagement metrics: views/impressions, likes, comments/replies, retweets (X), duration (YouTube)
  - Brief description (YouTube video description / X tweet text)
  - Relative time ("3h ago")
  - Material selection checkboxes (adds to the existing material basket)
- **`components/today/today-workbench.tsx`**: Integrated platform panels in a new grid row after the Google News + CN Indexed Evidence section. Also updated stale error help text that was still suggesting users add X credentials.

**Reason**:
- YouTube video and X tweet data was already being collected via platform connectors but was only used implicitly as trend scoring input. Users could not see individual videos or tweets or understand what data each platform was contributing.

**Verification**:
- `npm run build` ✅

---


### T-005 X/Twitter Connector: Docs Sync — Mark as Working

**Changes**:
- **`docs/PROJECT_STATE.md`**: Updated X/Twitter connector status from ⚠️ Failed → ✅ Live. Removed "X connector doesn't return real data" from Known Issues.
- **`docs/TASKS.md`**: Moved T-005 from Pending to Done.
- **`.env`**: Replaced empty `X_BEARER_TOKEN=""` / `TIKTOK_ACCESS_TOKEN=""` with comments pointing to `.env.local` to prevent future confusion.

**Reason**:
- The X API Bearer Token was already configured in `.env.local` and the deploy workflow injects it via GitHub Secrets. The docs were stale from before the token was set up.

**Verification**:
- Confirmed `X_BEARER_TOKEN` is present and non-empty in `.env.local`
- `.env.local` takes higher priority than `.env` in Next.js, so the old empty placeholder was not causing a runtime issue, but was misleading

---

## 2026-04-10 00:00 — Agent: Codex

### T-014 Reposition Tahoe Around Toutiao-First Article/Image Publishing

**Changes**:
- **`docs/CONTENT_MATRIX_STRATEGY.md`** (new): Added a near-term business strategy baseline for Tahoe:
  - use AI + agentic workflows to build an owned-media matrix
  - start from 头条号 / Toutiao
  - prioritize article + static-image production over video-first execution
  - anchor the first three directions in `AI增长官`, `金钱不眠`, and `东方元气`
- **`docs/PROJECT_STATE.md`**: Updated the project goal and module notes so the owned-media line is described as article/image-first instead of short-video-first.
- **`docs/TASKS.md`**: Added `T-014` to track the repositioning work.
- **`docs/DECISIONS.md`**: Added `D-019`, making Toutiao-first article/image publishing the near-term product baseline.
- **`app/page.tsx`**: Rewrote the homepage entry copy and workspace framing so the owned-media line now reads as article/image-first. Marketing copy now reads as client-facing commercial services.
- **`lib/content-line.ts`**: Updated content-line and output-type metadata so user-facing labels now describe article/image packages and client-service outputs rather than defaulting to video language.
- **`components/dashboard/project-intent-picker.tsx`**: Reframed the owned-media project package from “one project = one video” to “one project = one publishable article package”.
- **`lib/project-brief.ts`**: Updated generated titles, introductions, core ideas, and style-reference defaults so the owned-media line now generates article/image-first briefs rather than short-video briefs.

**Reason**:
- The user explicitly changed the business target: Tahoe should now focus on high-quality text and refined image publishing, starting from Toutiao, before returning to video.

**Verification**:
- `npm run build` passed after the code/doc edits in this entry

---

## 2026-04-10 21:10 — Agent: Codex

### Task: Install UI/UX Pro Max project-local Codex skill

**Changes**:
- Installed `UI/UX Pro Max` into the current repository as a project-local Codex skill at **`.codex/skills/ui-ux-pro-max/SKILL.md`** using `npx uipro-cli init --ai codex`.

**Reason**:
- The user asked to install the external UI skill from `nextlevelbuilder/ui-ux-pro-max-skill` for use inside this project.

**Verification**:
- Confirmed `.codex/skills/ui-ux-pro-max/SKILL.md` exists after installation.
- The upstream repo is not a standard `SKILL.md` repository for the generic installer; the supported install path for Codex is via `uipro-cli`.

---

## 2026-04-10 21:20 — Agent: Codex

### Task: Adapt UI/UX Pro Max skill for Tahoe constraints

**Changes**:
- Modified **`.codex/skills/ui-ux-pro-max/SKILL.md`** so the local skill now:
  - defaults to `nextjs` for Tahoe work
  - uses `.codex/skills/ui-ux-pro-max/scripts/search.py` paths instead of the upstream generic examples
  - explicitly treats upstream output as design guidance rather than direct implementation code
  - explicitly forbids Tailwind-based implementation inside Tahoe
  - tells future agents to translate recommendations into Tahoe's `vanilla CSS + CSS custom properties` system

**Reason**:
- The upstream skill assumes `html-tailwind` as the default implementation path, which conflicts with Tahoe's repo constraints and would produce the wrong kind of code if used unmodified.

**Verification**:
- Confirmed the local `SKILL.md` now contains a Tahoe-specific override section and nextjs-based command examples.

---

## 2026-04-10 21:40 — Agent: Codex

### Task: First UI/UX Pro Max-guided homepage pass

**Changes**:
- **`app/page.tsx`**: Reworked the no-project homepage state into a more editorial landing surface:
  - added a strategy board for the current business model and the three owned-media directions
  - changed the start surface from a uniform four-card launcher into a more directional production entry grid
  - added richer start-card footers so each path reads like a concrete production sequence
- **`app/globals.css`**: Added homepage-specific styles for:
  - the strategy board
  - editorial direction pills
  - production-note cards
  - asymmetric start-card layout and hover states
- **`docs/TASKS.md`**: Recorded this as part of the current T-014 repositioning slice.

**Reason**:
- After shifting Tahoe toward Toutiao-first article/image publishing, the homepage still behaved like a generic dashboard launcher. The first no-project surface needed to read more like an editorial production desk with a clear business frame.

**Verification**:
- `npm run build` passed after the homepage edits
- local visual check on `http://localhost:3001/` confirmed the new strategy board and asymmetric start-card layout render in the no-project state
- local dev still reports existing Prisma permission errors when loading recent projects; the homepage falls back and remains usable, but that database issue is separate from this UI change

---

## 2026-04-10 22:05 — Agent: Codex

### Task: Upgrade shared project-creation form for article/image-first quality

**Changes**:
- **`components/dashboard/project-form.tsx`**:
  - rewrote the form intro copy so it now emphasizes concrete topic definition and source-material quality instead of generic workflow language
  - changed the owned-media flow copy from short-video language to `选题研究 -> 主稿生成 -> 配图脚本 -> 发布包装`
  - added a “最能提高首稿质量的输入” helper block that explains what kind of topic, source material, and style reference produces better first drafts
  - upgraded owned-media placeholders from “口播 / 脚本” framing to “背景材料 / 事实底稿” framing
  - made `styleReferenceSample` visible for both lines so owned-media article work can also benefit from style anchoring when needed
- **`lib/workspace-mode.ts`**:
  - changed the user-facing `SHORT_VIDEO` metadata to read as the current owned-media/article-image compatibility bucket
  - updated default topic / source defaults and visible default platforms accordingly
- **`components/settings/project-manager.tsx`**:
  - aligned the filter and create-surface labels so the owned-media mode no longer appears as “短视频 / Short Video” in settings UI

**Reason**:
- After the homepage was repositioned, the shared project form was still teaching an older short-video mental model. That was weakening both clarity and first-draft quality.

**Verification**:
- `npm run build` passed after the form and metadata edits
- local visual check on `http://localhost:3001/` confirmed the upgraded create-project copy and the new input-quality helper block render in the no-project state
- local dev still reports the existing Prisma permission error when trying to load recent projects; that database issue is separate from this form/UI slice

---

## 2026-04-10 23:10 — Agent: Codex

### Task: Add Chinese-media calibration + multi-audience review for marketing master copy

**Changes**:
- **`lib/copy-review-panel.ts`** (new):
  - added a reusable “Chinese high-quality media calibration” notes layer
  - defined a persisted `AudiencePanelReview` shape with four simulated audience types:
    - `feed_scanner`
    - `skeptical_reader`
    - `editor`
    - `sharer`
  - added prompt builders and JSON / Zod schemas for second-pass audience scoring
- **`services/promotional-copy.service.ts`**:
  - added the new calibration notes directly into master-copy generation and enhancement prompts
  - added async post-save review enrichment so generated and manually saved master-copy versions can now persist:
    - `quality_diagnosis`
    - `audience_panel_review`
  - kept this review enrichment non-fatal so the main draft still saves even if the second-pass reviewer fails
- **`components/workspace/marketing-ops-workbench.tsx`**:
  - added a new “观众评分面板 / Audience panel” surface under the master-copy editor
  - surfaced average score, style-fit score, readiness judgment, overall verdict, and per-reviewer likes / concerns / next action
  - updated the top feedback summary so it can now react to the weakest simulated audience, not only the old diagnosis field
- **`components/workspace/project-context.tsx`**, **`components/dashboard/project-form.tsx`**, **`components/settings/project-manager.tsx`**:
  - tightened style-reference guidance so users are explicitly pushed toward 1-3 high-quality Chinese media / blogger samples instead of vague slogan-like references

**Reason**:
- The user explicitly wants copy quality to move closer to strong Chinese media writing patterns, and wants Tahoe to judge drafts using multiple audience perspectives instead of one generic score. The right seam was to upgrade the persisted review layer, not just add more prompt text.

**Verification**:
- `npm run build` passed after the review-layer and UI changes
- no schema migration was required because the new review panel is stored inside `strategy_tasks.task_json`

---

## 2026-04-10 23:40 — Agent: Codex

### Task: Extend multi-audience review to owned-media packaging in Script Lab

**Changes**:
- **`lib/output-artifact-prompt.ts`**:
  - removed the strongest remaining short-video framing from the title-pack and publish-copy prompt copy so these outputs are now prompted as article/image-first publishing artifacts
- **`services/project-output-generator.service.ts`**:
  - added the same “Chinese high-quality media calibration” notes to `VIDEO_TITLE` and `PUBLISH_COPY` generation
  - added async post-save `audience_panel_review` enrichment for generated title packs and publish-copy packs
- **`services/marketing-operations.service.ts`**:
  - extended manual `strategy_task` saves so Script Lab’s “另存新版本” flow for `VIDEO_TITLE` / `PUBLISH_COPY` also backfills an `audience_panel_review` instead of dropping to no second-pass review
- **`components/workspace/script-lab-workbench.tsx`**:
  - renamed the main title-pack card to “内容标题包”
  - added a new “观众评分” block for both title pack and publish copy
  - updated the top-level Script Lab “当前判断” logic so it can react to the weakest simulated audience, not only the older heuristic review

**Reason**:
- After adding multi-audience review to Marketing master copy, the highest-value next step was to extend the same judgment layer to owned-media publishing artifacts. This keeps Tahoe’s packaging quality loop consistent across both business lines and avoids letting manually saved title/publish versions silently lose the review layer.

**Verification**:
- `npm run build` passed after the packaging-review changes

---

## 2026-03-24 14:45 — Agent: Codex

### T-013 Finance Ops: Generate Excel Cost & Budget Workbook

**Changes**:
- **`scripts/generate_tahoe_cost_budget_workbook.py`** (new): Added a reusable workbook generator based on `openpyxl`.
- **`docs/Tahoe_cost_budget_template.xlsx`** (new): Generated a finance workbook with six sheets:
  - `README`
  - `Parameters`
  - `Unit_Costs`
  - `Project_Estimator`
  - `Monthly_Budget`
  - `Project_Ledger`
- **Workbook follow-up**: Filled the workbook with current official pricing assumptions for Tahoe’s active stack and added a dedicated `Pricing_Sources` sheet. The sheet now records:
  - OpenAI `GPT-5.4` pricing
  - `GPT-5 mini` pricing used transparently as the temporary budget proxy for `gpt-5.4-mini`
  - Gemini 3 Pro / Gemini 3 Pro Image / Veo 3.1 pricing
  - Qwen `qwen3-max` / `qwen3.5-plus` pricing
  - Serper / SerpApi search pricing

**Reason**:
- The user wants a real Excel file, not just conceptual tables. The workbook now reflects Tahoe’s production-depth cost model and explicitly includes retry / revision / trial-and-error overhead for text, image, and video workflows.

**Verification**:
- Workbook generated successfully via `python3 scripts/generate_tahoe_cost_budget_workbook.py`
- Verified sheet structure with `openpyxl` load test

---

## 2026-03-24 14:17 — Agent: Codex

### T-010 Model Naming Sync + Cloud Release Prep

**Changes**:
- **`components/settings/settings-form.tsx`**: Added clearer human-readable labels for the current model list so the settings UI now shows names like `GPT-5.4 Mini`, `Gemini 3.1 Pro Preview`, and `Qwen 3.5 Plus` instead of only raw provider IDs.
- **`app/settings/page.tsx`**: Updated settings guidance copy so the recommended live-search stack references `Serper / SerpApi` instead of older Google Custom Search wording.
- **`prisma/schema.prisma`**: Updated `AppSettings.llm_model` default from `gpt-4.1-mini` to `gpt-5.4-mini`.
- **`prisma/migrations/20260324142000_update_app_settings_default_model/migration.sql`**: Added a migration to keep schema-default rebuilds aligned with the current fallback model.
- **`README.md`**: Updated env examples and recommended route snippets to the current quality-first routing split.
- **`final_schema.sql` / `all_migrations.sql`**: Synced generated SQL snapshots with the new `AppSettings` default model.

**Reason**:
- The user wants the site-facing model names updated and the current typography/model-routing changes deployed together. This step removes the last old-model-name drift between settings UI, setup docs, and persistence defaults.

**Verification**:
- Pending in this entry. Next step: `npm run build`, then commit / push / deploy.

---

## 2026-03-24 00:11 — Agent: Codex

### T-010 Model Routing Refresh: Switch Defaults to Quality-First Gemini 3.1 / GPT-5.4 / Qwen 3 Split

**Changes**:
- **`lib/model-routing.ts`**: Updated provider model option lists and default routes:
  - `SCRIPT_REWRITE` -> `gemini-3.1-pro-preview`
  - `SCENE_CLASSIFICATION` -> `gpt-5.4-mini`
  - `ASSET_ANALYSIS` -> `gpt-5.4-mini`
  - `REPORT_GENERATION` -> `gpt-5.4`
  - `MARKETING_ANALYSIS` -> `gpt-5.4`
  - `PROMOTIONAL_COPY` -> `qwen3-max`
  - `PLATFORM_ADAPTATION` -> `qwen3.5-plus`
- **`services/app-settings.service.ts`**: Updated the fallback main model from `gpt-4.1-mini` to `gpt-5.4-mini`.
- **`app/settings/page.tsx`**: Updated the settings-page description to reflect the new quality-first default routing.

**Reason**:
- The user explicitly chose the quality-first model split and confirmed that `gpt-5.4-mini` is now available. Tahoe’s default model routing now matches that decision instead of the older cheaper baseline.

**Verification**:
- Not yet run in this step. Recommended next verification: `npm run build`

---

## 2026-03-23 15:29 — Agent: Codex

### T-012 Typography Follow-up: Switch Display English to Cinzel

**Changes**:
- **`app/globals.css`**: Added Google Fonts import for `Cinzel` alongside `Inter`.
- **`app/globals.css`**: Updated `.theme-font-display` to use `Cinzel` first for English display typography, with Chinese serif fallbacks (`Noto Serif SC`, `Songti SC`, `STSong`, `SimSun`, `Source Han Serif SC`) so mixed Chinese/English headings keep a closer carved-serif / editorial feel.
- **`app/globals.css`**: Updated global body typography so Chinese body text also consistently uses serif Chinese fonts (`Noto Serif SC` first, then Songti-family fallbacks), while English body text remains `Inter`. This makes the entire interface feel more unified instead of only changing the large headings.

**Reason**:
- User wants the typography direction applied consistently, not only on English headings. `Cinzel` is a strong web-safe match for the engraved serif reference, and `Noto Serif SC` / Songti-family fallbacks keep Chinese text in the same editorial serif family.

**Verification**:
- `npm run build` ✅

---

## 2026-03-23 15:20 — Agent: Codex

### Context Handoff Before Switching Tasks

**Current focus to preserve**:
- **`T-010` still in progress**. The highest-value remaining work is no longer the base intent model; it is the “last-mile quality + artifact readability” layer:
  - expand the lightweight artifact harness beyond `VIDEO_TITLE` / `PUBLISH_COPY` / `AD_CREATIVE`
  - decide whether the next quality step is `PLATFORM_COPY` support or a stronger second-pass reviewer
  - decide whether project briefs should auto-refresh when Today/material context changes, instead of requiring the current one-click smart-fill action
  - continue removing lower-priority old `workspaceMode` assumptions and old full-workflow teaching copy

**Most important recent completed slices**:
- Added a lightweight artifact harness for selected outputs: generation now stores `knowledge_notes`, `review_checklist`, and `artifact_review`, and the workbenches surface them directly.
- Added a smart project-brief layer: title / topic / introduction / core idea / starter style sample now default to generated values, and `ProjectContext` has a one-click auto-fill action instead of forcing repeated manual rewriting.

**Lessons worth carrying forward**:
- Tahoe benefits most from small harness seams, not heavy new systems. The productive pattern has been: add durable output-specific guidance/review context first, then decide later whether a stronger model-based reviewer is worth it.
- Raw collected query strings are often poor user-facing project metadata. Treat them as source inputs, then derive cleaner project-facing title/topic/brief copy from them.
- The right UX direction remains artifact-first and minimal-first. Users should mostly edit the delta, not reconstruct the whole project context every time new materials arrive.

**Verification state at handoff**:
- `npm run build` passed after both the artifact-harness slice and smart-project-brief slice.

---

## 2026-03-23 15:08 — Agent: Codex

### T-010 Smart Project Brief: Auto-Generate Better Title / Topic / Introduction / Style Sample

**Changes**:
- **`lib/project-brief.ts`** (new): Added a lightweight smart-brief generator. It can:
  - normalize raw OR-style topic strings into cleaner project topics
  - generate a better project title (Mars Citizen short-video defaults now prefer a dated “科技快讯” naming pattern)
  - generate a fuller `project_introduction`
  - generate a `core_idea`
  - generate a starter `style_reference_sample`
- **`services/research-orchestrator.service.ts`**: New project creation now seeds generated defaults for project title / introduction / core idea / style sample when the user has not filled those fields manually.
- **`components/workspace/project-context.tsx`**:
  - empty project background fields now render with generated defaults instead of looking blank
  - added a one-click `自动补全项目信息` action in the editor
  - fixed project-context save so `copy_length` is now persisted too

**Reason**:
- The user should not have to rewrite the project brief every time research inputs change. Raw collection strings are often good source inputs but poor final-facing project names/themes.

**Verification**:
- `npm run build` ✅

---

## 2026-03-23 14:12 — Agent: Codex

### T-010 Artifact Harness: Add Output-Specific Knowledge Notes + Stored Review Context

**Changes**:
- **`lib/output-artifact-guidance.ts`** (new): Added a lightweight artifact harness layer for `VIDEO_TITLE`, `PUBLISH_COPY`, and `AD_CREATIVE`. Each output now has:
  - output-specific `knowledgeNotes`
  - output-specific `reviewChecklist`
  - a structured `artifactReview` derived from existing quality heuristics
- **`lib/output-artifact-prompt.ts`**: Updated prompt builders so packaging / creative generators can inject those knowledge notes and self-review checklists directly into the generation prompt instead of keeping all rules implicit.
- **`services/project-output-generator.service.ts`**: `VIDEO_TITLE`, `PUBLISH_COPY`, and `AD_CREATIVE` generation now persist `generation_harness`, `knowledge_notes`, `review_checklist`, and `artifact_review` inside `task_json`.
- **`components/workspace/script-lab-workbench.tsx`**: Title-pack and publish-copy panels now surface the stored “创作知识 / 系统复核” context directly beside the editable artifact, with a fallback to local review when older versions do not have stored review metadata yet.
- **`components/workspace/marketing-ops-workbench.tsx`**: Ad creative panel now surfaces the same stored “创作知识 / 系统复核” context beside the current creative brief.

**Reason**:
- We want to absorb the strongest practical lesson from `learn-claude-code` without overbuilding: keep the model-facing rules modular and make review context durable. This gives Tahoe a clear seam for stronger future review loops while staying inside the current sprint’s focus on output quality, prompt quality, and artifact-first UX.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 11:36 — Agent: Antigravity

### T-005 Twitter API: X_BEARER_TOKEN Auto-Injection in Deploy

**Changes**:
- **`.github/workflows/deploy.yml`**: Added an idempotent step that reads `X_BEARER_TOKEN` from GitHub Secrets and injects it into the server's `.env.local` during deploy. Uses `sed -i` to remove any stale value, then appends the current one.

**Reason**:
- The X connector (`services/platform-connectors/x.ts`) was already fully implemented but the Bearer Token wasn't reaching the production server. This change closes the gap so `tweets/search/recent` works in production.

**Verification**:
- Deploy to Tencent Cloud ✅ `completed | success`

---

## 2026-03-21 11:23 — Agent: Antigravity

### T-012 UI Polish Round 2

**Changes**:
- **`components/ui/page-header.tsx`**: Removed stale `workflowCaption` footer ("从目标定义开始…"). Replaced hardcoded gradient blobs with `var(--accent-soft)` / `var(--sage-soft)` for dark mode compatibility. Divider line also now uses `var(--accent-soft)`.
- **`app/page.tsx`**: `StartCard` now accepts `locale` prop → CTA shows "Start →" in English, "开始 →" in Chinese. Added decorative accent glow circle in top-right corner of each card for visual depth. Cards use `overflow-hidden` + `relative` positioning for proper layering.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 11:16 — Agent: Antigravity

### T-009 Chinese Search Enhancement: Locale-Aware News Search

**Changes**:
- **`services/news-search/index.ts`**: Added `detectLocale()` — detects CJK characters in the query and switches `searchLatestNews()` from `gl:us/hl:en` to `gl:cn/hl:zh-cn`. The CN indexed evidence pipeline (Baidu, Google CN, XHS, Douyin) was already fully implemented; this fix ensures the **primary** news column also returns Chinese results for Chinese queries.

**Reason**:
- Chinese queries like "火星探测器" were returning English-language results in the main news column because Serper defaulted to US locale.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 10:51 — Agent: Antigravity

### T-010 Wrap-up: workspaceMode Surface Cleanup + Intent-First Copy

**Changes**:
- **`components/dashboard/project-mode-picker.tsx`** [DELETED]: Dead component replaced by `project-intent-picker.tsx`.
- **`components/workspace/layout.tsx`**: Removed `workspaceMode` prop — no longer forwarded.
- **`components/dashboard/sidebar.tsx`**: Removed unused `workspaceMode` parameter and `WorkspaceMode` import.
- **10 page files** (`page.tsx`, `script-lab`, `brand-profiles`, `brief-studio`, `industry-templates`, `help-center`, `marketing-ops`, `render-lab`, `scene-planner`, `trend-explorer`): Removed `workspaceMode={workspace?.workspaceMode}` from `<WorkspaceLayout>` calls.
- **`app/help-center/page.tsx`**: Rewrote "Getting Started" from "按顺序跑通完整流程" → "从一个选题开始，系统会帮你推进到第一版产物".
- **`services/workspace-query.service.ts`**: Softened brand/industry copy from "建议先完成配置" → "可选：绑定后产出更统一".
- **`components/workspace/project-context.tsx`**: Updated empty-state from "先从总览页新建" → "输入选题 + 选择产物类型就能新建".

**Reason**:
- `workspaceMode` in UI surfaces leaked the old mental model. UX copy was still teaching "run the full workflow" when the system now supports "give a topic and go".

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 10:05 — Agent: Antigravity

### T-012 UI Polish: Clean Typography & Modern Icons

**Changes**:
- **`app/globals.css`**: Updated base font stack to `Inter` (importing from Google Fonts) to make the typography sleeker and more modern.
- **`lib/content-line.ts`**: Replaced generic standard emojis (🚀, 💼) with professional `LucideReact` icons (`Rocket`, `Briefcase`).
- **`components/dashboard/project-intent-picker.tsx`**: Removed heavy borders and excessive border radii (`rounded-[24px]` -> `rounded-2xl`). Implemented cohesive styling for the selected intent state and correctly rendered Lucide icons.
- **`app/page.tsx`**: Softened card styles throughout the dashboard. Lowered heavy gradient glows, replaced `rounded-[26px]` with cleaner `rounded-2xl`, and added subtle layout transitions on hover.

**Reason**:
- The user requested a more intuitive and concise UI, specifically asking to update the fonts and icons. Emojis and thick bubbly shapes made the UI feel less professional. Softening borders and applying a unified, modern geometric sans-serif font instantly elevated the visual quality.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 10:28 — Agent: Antigravity

### T-012 Mars Citizen: Unified Video Project Instead of 5 Separate Outputs

**Changes**:
- **`components/dashboard/project-intent-picker.tsx`**: When the user selects 火星公民, the output type grid is now replaced with a single "一个项目 = 一期视频" panel showing all five deliverables (脚本、分镜、标题、简介、发布文案) as icons in a pipeline. Marketing retains its individual output type selection.
- **`lib/content-line.ts`**: Updated Mars Citizen description to "每期视频一个项目 — 自动产出脚本、分镜、标题、简介、发布文案".

**Reason**:
- User pointed out that Mars Citizen outputs are not independent choices — they are all part of one video episode project. The old UI was misleading.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 10:23 — Agent: Antigravity

### T-012 Dashboard Cards: Remove Redundant Copy

**Changes**:
- **`app/page.tsx`**: Condensed StartCard titles and descriptions. Titles shortened to category names ("今日选题", "火星公民", "Marketing", "继续项目"); descriptions now list concrete outputs with `·` separators instead of restating the title as a sentence. CTA link changed from repeating the title to a hover-only "开始 →".

**Reason**:
- Every card was saying the same thing twice — the title, the description, and the CTA link all conveyed the same action in slightly different words.

**Verification**:
- `npm run build` ✅

---

## 2026-03-21 10:17 — Agent: Antigravity

### T-012 Sidebar: Narrow Collapsed Width

**Changes**:
- **`app/globals.css`**: Reduced `.theme-sidebar-mini` width from 88px to 60px with tighter padding.
- **`components/layout/app-shell.tsx`**: Updated content wrapper margin from `xl:ml-[88px]` to `xl:ml-[60px]`.
- **`components/dashboard/sidebar.tsx`**: Shrunk collapsed icon containers (`p-2.5 → p-2`, `rounded-2xl → rounded-xl`) and brand header (`size-12 → size-10`).

**Reason**:
- Collapsed sidebar was too wide and visually blocked the main content area.

**Verification**:
- `npm run build` ✅

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
## 2026-04-11 13:35 — Agent: Codex

### Task: Harden Homepage First-Run Create Flow

**Changes**:
- Modified `components/dashboard/project-form.tsx`
  - owned-media presets no longer overwrite the current topic field
  - current topic is now framed as `本期题目`
  - `项目介绍` and `核心想法` are now visible in the main owned-media create path instead of hiding behind advanced controls
  - shared project creation now slices default `platforms` to the schema-safe max of 3
- Modified `lib/workspace-mode.ts` — reduced shared default platform payloads to a schema-safe set of 3
- Modified `services/research-orchestrator.service.ts` — fixed empty project-shell report generation so `script_summary.version_number` stays schema-valid
- Modified `lib/client-api.ts` — improved validation-error guidance for the two hidden-default failure modes
- Modified `components/dashboard/project-intent-picker.tsx`, `lib/content-line.ts`, `app/page.tsx` — replaced lingering `配图脚本` / `Mars Citizen` style labels on the homepage path with more direct image/article-first wording

**Reason**:
- A real first-run UX pass showed the homepage create path failing on hidden system defaults before a new user could even create a first project. The form also mixed up long-term direction presets with the current article topic, which made the first step harder than necessary for copy-first users.

**Validation**:
- `npm run build` passed after the fixes
- Browser verification confirmed the original hidden `platforms` blocker was removed; subsequent create attempts no longer fail on that issue

### Follow-up: Make the no-project homepage answer “what do I do now?”

**Changes**:
- Modified `app/page.tsx`
  - reordered the no-project homepage to: quick-start steps -> create form -> alternative entry cards -> optional strategy details
  - moved the heavier editorial strategy explanation behind a disclosure instead of showing it ahead of the create path
- Modified `components/dashboard/project-form.tsx`
  - shortened the create-form title and description so the form reads like an immediate action, not a system overview

**Reason**:
- After the first-run UX pass, the next issue was not only hidden validation blockers; it was that the page still taught strategy before it taught the first action. The homepage now prioritizes immediate task clarity over editorial framing.

### Follow-up: Compress the create form itself

**Changes**:
- Modified `components/dashboard/project-form.tsx`
  - shortened the create-form headline and description again
  - converted the first-draft quality guidance from a three-card wall into a denser numbered list

**Reason**:
- Even after the homepage reorder, the create form still asked a first-time user to visually parse too many equally weighted panels. The form now puts more weight on fields and less on explanatory cards.

---

## 2026-04-24 12:55 — Agent: Codex

### Task: T-016 GPT5.5 Final Package Cleanup and Daily Run Bug Sweep

**Changes**:
- Modified `eslint.config.mjs` — excluded unrelated `analysis/**` and `econometrics_assignment2b_bundle/**` directories from Tahoe product lint, so old presentation/helper files no longer block deployment checks.
- Modified `components/workspace/script-lab-workbench.tsx` — escaped the remaining JSX quote that produced the Tahoe lint error.
- Modified `services/workspace-query.service.ts` and `app/api/projects/route.ts` — project lists now return `updated_at`, order by recent modification, and hide `ARCHIVED` projects by default.
- Modified `app/settings/page.tsx` and `components/settings/project-manager.tsx` — Settings remains the project recovery surface by loading archived projects, and project rows now show "最后修改 / Updated".
- Modified `app/daily-run/page.tsx` — Daily Run project cards and recent activity rows now show last modified time.
- Modified `components/daily-run/daily-run-signal-panel.tsx` — replaced undefined danger-border variable usage with an explicit color-mix border.
- Added `docs/GPT55_ARTICLE_RUNBOOK.md` — records the final GPT5.5 article package, inspection links, image briefs, image-task feedback, cleanup list, and process notes for teammates.
- Updated `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and `docs/DECISIONS.md`.

**Data changes**:
- Kept final GPT5.5 project `cmocc5cfq0034s0v59k0ot713`.
- Copied the best draft from `cmocd8dug004rs0v5dn16snhu` into the final project as script version `2`.
- Marked the final project `COMPLETED`.
- Archived 10 duplicate GPT5.5 dry-run projects with `cleanup_reason = gpt55_dry_run_duplicate`.
- Rebuilt a cloud inspection copy through public Tahoe APIs as `cmocgo05k0000v6w47xyxcr39`, including one script record, title pack, publish copy, three image briefs, three image jobs, and saved image-job feedback.

**Validation**:
- `npm run lint` passed with warnings only.
- `npm run build` passed.
- Cleared `.next`, started a fresh dev server, and verified `/`, `/daily-run`, `/today`, `/settings`, `/script-lab`, `/scene-planner`, and `/render-lab` returned `200`.
- Verified `/api/health`, `/api/settings`, `/api/projects`, and `/api/research/hot-topics` returned successfully; hot-topics reported `mode = live`, not mock.

**Reason**:
- The user needed one inspectable GPT5.5 article package, not scattered trial projects. The `/daily-run` runtime screenshot was consistent with a stale webpack/HMR cache; a clean local restart returned `200`, while code fixes addressed the real lint/read-model issues found during the sweep.
