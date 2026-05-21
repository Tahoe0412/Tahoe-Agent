# Project State

> Last updated: 2026-05-12 by Codex
> Read this file FIRST before doing any work.

## Goal

Build **Tahoe** — a shared AI content-production base that currently serves:
- **Owned media matrix**: Toutiao-first article and image-first publishing across three initial directions:
  - AI快讯
  - 全球股市
  - 消费时尚
- **Commercial services**: client-facing copywriting, ad content, and content-production support

The platform aggregates trend and research signals, then routes users toward the smallest set of actions needed to produce a usable article/image package or a client-facing deliverable.

## Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS custom properties (design tokens)
- **Database**: PostgreSQL (localhost:5432, database `ai_video_mvp`)
- **ORM**: Prisma
- **AI**: Google Gemini API + OpenAI API + Qwen API + local OpenAI-compatible Qwen endpoint support (quality-first routing)
- **Search**: Serper.dev (replaced Google Custom Search)
- **Deployment**: Tencent Cloud server (111.229.24.208), PM2, GitHub Actions CI/CD
- **Proxy**: Clash/Mihomo at 127.0.0.1:7890 (required for mainland China to access Google/YouTube/OpenAI)

## Server Environment

- **IP**: 111.229.24.208
- **Node.js**: v20.20.1
- **PM2 app name**: `tahoe` (legacy) or `tahoe-agent` (primary)
- **Deploy script**: `scripts/deploy.sh`
- **CI/CD**: GitHub Actions → SSH deploy on push to `main`

### Required Server Env Vars (`.env.local`)

```
HTTPS_PROXY=http://127.0.0.1:7890
SERPER_API_KEY=e6448fb346f801faa08a8b443de1b9c64bc5f54a
NO_PROXY=localhost,127.0.0.1,10.*,172.16.*,192.168.*
```

## Current Module Status

| Module | Status | Notes |
|--------|--------|-------|
| Dashboard (`/`) | ✅ Working | Simplified project creation and one primary next action |
| Today Workbench (`/today`) | ✅ Working | Hot topics search with real Serper news data |
| Daily Run (`/daily-run`) | ✅ Working | Operational queue shell with manual signal intake, direct draft start, and lane-aware project handoff |
| Trend Explorer (`/trend-explorer`) | ✅ Working | Trend research with Serper integration |
| Script Lab (`/script-lab`) | ✅ Working | Master-draft / article generation |
| Scene Planner (`/scene-planner`) | ✅ Working | Visual-brief planning, still carrying storyboard-compatible internals |
| Render Lab (`/render-lab`) | ✅ Working | Static image generation is the current priority; video generation is temporarily de-prioritized |
| Marketing Ops (`/marketing-ops`) | ✅ Working | Copy generation, ad creative, and client-facing content support |
| Brand Profiles (`/brand-profiles`) | ✅ Working | Brand keyword pools |
| Settings (`/settings`) | ✅ Working | App configuration |
| Serper News Search | ✅ Live | Returns real Google News results |
| YouTube Connector | ✅ Live | Returns real YouTube video data via Data API v3 |
| X/Twitter Connector | ✅ Live | Returns real tweet data via X API v2 (Bearer Token) |

### Architecture Note

- `ContentLine` (`MARS_CITIZEN` / `MARKETING`) is still the primary internal business-domain boundary.
- For the current business phase, `MARS_CITIZEN` should be read as the compatibility bucket for the **owned-media matrix**, not strictly as a single “Mars Citizen video brand”.
- `OutputType` is persisted on new projects as the requested artifact intent.
- `WorkspaceMode` is still present for UI/workbench compatibility, but new routing should prefer centralized project-intent resolution over raw `workspace_mode` checks.
- Project creation is now intent-first: users select `contentLine + outputType`, while `workspaceMode` is derived automatically.
- Default project creation is now minimal-first: `topic` is the only required content input, `title` can be left blank and will fall back to the topic, and advanced controls stay collapsed by default.
- Dashboard and Settings now share the same project-creation component/submit path, so new create-flow changes should be implemented once and reused instead of evolving two parallel forms.
- The shared project-creation form now also exposes three quick owned-media presets (`AI快讯`, `全球股市`, `消费时尚`) that prefill the brief context without introducing a separate create flow. The same preset family now also seeds Brand Profiles and Brief Studio so users can carry one editorial direction through project shell, brand constraints, and creative brief setup.
- Scene Planner and Render Lab are now described to users as `配图说明 / 图片生产` surfaces. The current backend still stores these flows as storyboard/render-compatible internals, but the UI should teach image-first work unless a future schema migration explicitly changes that boundary.
- Scene Planner and Render Lab now also expose a lightweight image-brief review seam. Tahoe uses the existing row data (`shotGoal`, `rewritten`, `visualPrompt`, references, risk flags, asset readiness, composition hints) to tell users whether a row is ready for the first image pass or still needs revision.
- Render jobs can now also store structured result feedback inside `output_json.feedback`, so users can mark a run as `保留这一版 / 继续重试 / 先改 brief` and capture the main failure tags directly on the image task record.
- Scene Planner now reads those saved render-job feedback records back onto the matching row. Users can see when a row has already been retried or sent back for brief rewrites, along with the most common recent failure tags.
- The homepage/shared create flow has now been hardened for first-run use: owned-media presets no longer overwrite the current topic, the form brings `project introduction` + `core idea` up into the main owned-media path, and shared default payloads no longer post schema-invalid hidden values during project creation.
- The no-project homepage now leads with a three-step quick-start strip and puts the create form ahead of strategy detail, so first-time users see the immediate action path before the broader editorial-system explanation.
- The shared create form is also being compressed toward a true first-run shell: headline copy is shorter and the “what improves the first draft” guidance now reads as a compact three-point list instead of another card wall.
- The shared create form no longer auto-generates a project title when `topic` is blank. Auto-title suggestions reset cleanly when the topic changes, so the form does not signal a fake “ready” state before the user has entered the current piece idea.
- Research/news project creation now normalizes `published_at` values before persistence. Relative Chinese/English strings such as `3 天前`, `1 个月前`, and `2 days ago`, plus absolute Chinese dates like `2026年1月5日`, are converted into valid timestamps instead of crashing `trendEvidence.createMany()`.
- `AppSettingsService` no longer tries to persist a removed `serpapi_key` field during settings upsert. The current settings payload is aligned with the Prisma schema (`serper_api_key` only), so startup/settings reads do not fail on a stale field name.
- Trend scoring now sanitizes invalid time-derived values at the formula layer. If upstream content carries an odd timestamp, Tahoe no longer emits `NaN` velocity/total scores that later break `trend_topics.create()` with a misleading “momentum_score is missing” error.
- Local end-to-end verification on 2026-04-12 reached a healthy baseline: `/api/health` returned `database: ok`, project creation returned `201`, and the created project rendered successfully on `/`, `/script-lab`, and `/scene-planner`.
- A fuller local chain has also been exercised on 2026-04-12: `create project -> script rewrite -> image-brief generation -> image job create -> image job feedback update -> title pack generate -> publish-copy generate`, and all corresponding project pages returned `200`.
- `sourceScript` is optional during project creation; empty input creates a project shell without an initial user script version.
- Storyboard generation is now also intent-first: if a project has no ready script scenes, Tahoe will derive them from `raw_script_text` or synthesize storyboard seed scenes from topic + domain context before generating storyboard frames.
- Storyboard-first scenes are automatically pushed through scene classification and asset-dependency analysis, so Scene Planner and Render Lab get production metadata without requiring a separate manual prep pass.
- Dashboard routing is now intentionally sparse: Tahoe shows one primary next step by default and treats briefs, trend review, and deeper workflow detail as optional supporting context rather than universal gates.
- News-script generation now has an explicit output-type registry for currently supported news entry outputs (`NARRATIVE_SCRIPT`, `AD_SCRIPT`) so future output expansion can add handlers without growing one large conditional block.
- Project-level packaging outputs now also carry a lightweight artifact harness: `VIDEO_TITLE`, `PUBLISH_COPY`, and `AD_CREATIVE` generation inject output-specific knowledge notes + review checklists into prompts, then persist a structured `artifact_review` summary alongside the saved artifact. Script Lab and Marketing Ops surface that context directly so users can see both the guidance and the review result in the same workbench.
- Marketing master-copy generation now has a stronger second-pass review layer: Tahoe adds reusable “Chinese high-quality media calibration” notes to the prompt, then persists an `audience_panel_review` with four simulated reader types (`feed_scanner`, `skeptical_reader`, `editor`, `sharer`) so copy quality is judged from multiple audience angles instead of one score only.
- Owned-media packaging now follows the same pattern: generated or manually saved title packs and publish-copy packs can also carry an `audience_panel_review`, and Script Lab surfaces that panel next to the existing artifact guidance and heuristic review.
- Owned-media main drafts now also carry a persisted `audience_panel_review` directly on `script.structured_output`. `WorkspaceQueryService` keeps the latest previewable structured draft available, so Script Lab can still show the main-draft verdict after later rewrite / scene-split records are created.
- Project background editing in `ProjectContext` is no longer expected to be fully manual. Tahoe now has a first smart-brief layer that can auto-generate a cleaner project name, normalized topic, detailed project introduction, core idea, and starter style-reference sample from the current topic + workspace + writing settings. For the owned-media line, generated project briefs now speak in article/image-first language instead of assuming short-video output by default.
- Default model routing is now quality-first and split by role instead of one cheap general baseline:
  - `SCRIPT_REWRITE`, storyboard-related generation, and Mars packaging defaults now lean on `gemini-3.1-pro-preview`
  - `SCENE_CLASSIFICATION` and `ASSET_ANALYSIS` now default to `gpt-5.4-mini`
  - `MARKETING_ANALYSIS` and `REPORT_GENERATION` now default to `gpt-5.4`
  - Chinese marketing writing now defaults to `qwen3-max` / `qwen3.5-plus`
- Settings-page model labels and README/env examples are now aligned with that routing split, so the live UI no longer presents the older `gpt-4.1` / `gemini-2.5` / `qwen-plus` style defaults as the main recommended path.
- Qwen routing now also supports a local OpenAI-compatible endpoint through `QWEN_BASE_URL` / `LOCAL_QWEN_BASE_URL`. This lets a locally deployed `qwen3.6-35b` service power Tahoe generation without using DashScope, as long as the model server exposes a `/v1/chat/completions`-compatible API.
- Local OpenAI-compatible Qwen requests now also support production-safe parameter overrides: `QWEN_TEMPERATURE=0.35`, `QWEN_TOP_P=0.85`, and `QWEN_MAX_TOKENS=8192`. The user's LM Studio load currently uses a 131072-token context window; `QWEN_CONTEXT_WINDOW=131072` is documented as a setup note, but the real context must still be configured inside LM Studio / the local inference server.
- `AppSettings.llm_model` schema default now also matches the new baseline (`gpt-5.4-mini`) instead of the earlier `gpt-4.1-mini`, preventing new settings records from silently inheriting an outdated fallback model.
- **(T-018)** Model routing is now credential-aware: `resolveModelRoute()` checks whether the configured provider for a route has valid API credentials before returning it. If the configured provider lacks credentials (e.g., Gemini on cloud without `GEMINI_API_KEY`), it automatically falls back to the first available provider in priority order `OPENAI → QWEN → DEEPSEEK → GEMINI`. Fallback events emit `console.warn` for server-log visibility. One-time normalization script available at `scripts/fix-cloud-model-settings.ts`.
- Long-term architecture direction is now documented separately in `docs/FUTURE_BLUEPRINT.md`. The two most important future vectors are:
  - stronger review-loop / agentic orchestration over time
  - stronger multimodal brand memory / retrieval over time
- Near-term editorial direction and business focus are now documented separately in `docs/CONTENT_MATRIX_STRATEGY.md`.
- The broader operating flow, revenue model, account-role split, and 30-day priorities are now documented in `docs/BUSINESS_MODEL.md`. Use that file when product decisions require a business-model answer instead of a UI-only answer.
- The near-term execution plan for the daily article pipeline is now documented in `docs/DAILY_RUN_PLAN.md`. Use that file when the question is how Tahoe should run the day-to-day loop across signal intake, topic triage, draft review, image production, and publish packaging.
- A first `Daily Run / 每日运行台` shell now exists as a read-model orchestration surface. It adds a dedicated sidebar entry, shows the three account lanes, groups recent projects by a lightweight inferred production stage, computes one next action per project, and now also includes a manual signal panel that reuses the Today hot-topics search without violating the "no auto-search on mount" rule. Topic cards can now be marked `保留 / 忽略` in browser session state and can start a lane-bound owned-media draft directly by calling the existing `generate-from-news` flow, patching the new project's lane metadata, and sending the user straight into `Script Lab`.
- A real GPT-5.5 dry run has now been executed through Tahoe itself: real Serper-backed signal intake, direct draft start from Daily Run/source packet, title-pack + publish-copy generation, image-brief generation, image-job creation, and image feedback recording.
- The GPT-5.5 dry run has now been cleaned into one final local inspection project: `cmocc5cfq0034s0v59k0ot713`. The best draft was merged back into that full-chain project as the latest script version, duplicate dry-run projects were archived instead of deleted, and the production notes are documented in `docs/GPT55_ARTICLE_RUNBOOK.md`. Because the Tencent Cloud server uses a separate database, a cloud inspection copy was rebuilt through Tahoe APIs as project `cmocgo05k0000v6w47xyxcr39`.
- Project read models now expose `updated_at`; ordinary project lists default-hide archived projects, while Settings still includes archived records for recovery. Daily Run and Settings both show a visible "最后修改 / Updated" timestamp so stale test projects are easier to spot.
- `/api/research/hot-topics` now returns the `ok(...)` envelope expected by `useHotTopics`, so Daily Run search no longer crashes on `response.data.news`.
- Packaging audience review now receives extracted source-packet bullets from the latest script payload instead of judging only title strings or highlight strings. This is important for just-published topics such as GPT-5.5.
- Image-brief review is now more tolerant of editorial infographic / concept-image rows when the prompt itself already carries strong camera/composition direction and the row is asset-ready, even if no explicit reference image has been attached yet.
- AI快讯 main-draft prompting has been tightened so each change point must land on a user-perceivable consequence instead of stopping at generic industry-summary phrasing.
- AI快讯 main-draft prompting now targets Toutiao-first long-form article drafts by default rather than short news summaries. The expected output is a complete mobile-readable article with a strong hook, factual grounding, explanation, clear judgment, and roughly 1800-2600 Chinese characters when source material is sufficient.
- AI快讯 main-draft prompting and audience review now also include an explicit anti-AI-tone calibration. The writing target is no longer only "longer article"; it must have a core metaphor/tension, plain-language translation, author judgment, source-grounded facts, and non-template paragraph rhythm inspired by high-quality Chinese tech media/creator writing patterns. Do not copy a named creator's voice, but do preserve those structural standards.
- The cloud DeepSeek V4 project `cmocijq2u0000v6bgidcs789o` now has a v2 human-edited draft `cmodr2ie90001v6icxfisey66` with the new title `DeepSeek V4来了：最该紧张的，不是模型公司，而是价格表`. Its title pack (`cmof4q69e0001v6yg2m5s4lb5`), publish copy (`cmof4q6cc0003v6ygzctsfkw0`), image-brief set (`cmof4rior0005v6ygcahadf3r`), and three image jobs (`cmof4tfxm000bv6ygi53jfrvh`, `cmof4tfxq000dv6ygajy7yktm`, `cmof4tfyd000fv6ygxmexr0tg`) are aligned to the same price-table/electricity metaphor.
- Scene Planner and Render Lab now also display storyboard-frame-only image briefs when a project has manual image briefs but no split script scenes. This is important for article/image packages where the image plan can be created directly from the article instead of from scene-split rows.
- Homepage and project-intent cards are now intentionally shorter. Use cards to signal direction, not to explain the full workflow inside every card body.
- The frontend visual baseline has been flattened toward a restrained editorial production desk: homepage, app shell, sidebar, shared project creation, project-intent selection, Output Studio, and common state/error surfaces now use paper-like backgrounds, fine dividers, compact rows, and minimal controls instead of glow-heavy rounded card stacks. The typography has also moved toward a modern art museum / gallery-label feel: `Didact Gothic` + `Noto Sans SC` for UI/body text and `Bodoni Moda` + `Noto Serif SC` for display headings. This was a frontend-only pass; backend APIs and persistence contracts were not changed.
- A second frontend system sweep has now extended that anti-card baseline across the broader product: Today, Trend Explorer, Script Lab, Scene Planner, Render Lab, Marketing Ops, Settings, Brand Profiles, Brief Studio, Industry Templates, shared status/tag/table/score components, and secondary warning surfaces now avoid large rounded cards, gradients, shadows, dark selected panels, translucent white UI, and hard-coded alert palettes. The UI direction is now a flatter modern-art-museum production desk: page-level display typography, dense sans-serif workbench text, fine dividers, tokenized status colors, and subdued inline metadata. Backend APIs, Prisma schema, generation logic, and persisted contracts were not changed.
- Brief Studio platform values are now normalized to the backend schema-safe set (`XHS`, `DOUYIN`, `YOUTUBE`, `X`, `TIKTOK`). Do not reintroduce ad-hoc UI-only values such as `XIAOHONGSHU` or `BRAND_PAGE` into brief payloads unless the schema is explicitly expanded first.
- Daily Run is now the intended default daily publishing surface for the three accounts. The operator should search once, pick one topic per account, generate a quick article package, and do one final edit instead of walking through every artifact/review page by default.
- Daily Run signal selection now starts from the existing `generate-from-news` flow and then sequentially creates image brief, title pack, and publish copy through `/api/daily-run/quick-package`. This is deliberately sequential so a laptop-local 35B model is not asked to run multiple generation calls at once.
- Daily Run and Script Lab have now been simplified for low-friction daily publishing. Daily Run leads with `今日选题`, search, three account topic picks, and one `生成文章包` action; source material, alternate topics, and recommendation reasons are folded into details. Script Lab now presents itself as `成稿编辑`, keeps draft review/source material/system scoring behind details, and treats image-brief internals as advanced配图细节 instead of the main editing path.
- The frontend visual baseline has moved away from the previous warm paper / terracotta-brown palette into a cooler editorial desk direction: porcelain off-white surfaces, deep ink-green navigation, teal primary actions, and controlled cobalt / plum / coral status accents. Core navigation labels now use `今日选题`, `成稿编辑`, `配图 brief`, and `出图台` so the first impression reads as an editorial workflow instead of a systems console.
- A project-root `DESIGN.md` now records Tahoe's local UI direction. It uses the `awesome-design-md` / `getdesign.md` approach and takes WIRED-style editorial density as the primary structural inspiration, while explicitly avoiding Claude-like warm terracotta / parchment styling and pure terminal-tool aesthetics. The separate `frontend-design` Codex skill has also been installed locally under `/Users/ztq0412/.codex/skills/frontend-design`; restart Codex to make that skill available in future sessions.
- Sidebar navigation now treats `/daily-run` as the primary daily path. Today, Trend Explorer, and Brief Studio are still available, but they are no longer presented as required first-stop pages for normal daily publishing.
- The latest frontend refactor now applies the `DESIGN.md` direction to the shared shell and the two primary daily publishing pages. First-run theme behavior defaults to the light editorial desk instead of system dark mode; app shell, headers, panels, tags, buttons, state panels, Daily Run, and Script Lab use lower-radius controls, fine dividers, cooler ink-green/teal actions, and less nested card structure. Daily Run stays search-first, while Script Lab keeps正文/标题/发布文案 in the main path, sends article-line next actions to发布文案, and leaves配图/复核 details behind folds.
- A follow-up frontend pass flattened the remaining first-screen project context and script preview surfaces. `ProjectContext`, `ScriptPreviewPanel`, mobile sidebar controls, tag input, and error notices now use the same low-radius / horizontal-divider language, so Script Lab no longer opens with a large rounded project card followed by rounded script/source/review boxes.
- The latest visual pass shifts that refactor toward an iOS 18-inspired grouped workspace: system font stack, light gray canvas, translucent material panels/sidebar/header, system-blue primary actions, pill buttons/tags, and larger grouped radii across Daily Run and Script Lab. This is still a desktop publishing workbench, not a literal mobile clone; API contracts, schema, model routing, and generation flow are unchanged.
- LM Studio local Qwen (`qwen/qwen3.6-35b-a3b`) requires `reasoning_effort: "none"` for Tahoe's OpenAI-compatible calls. Without it, LM Studio may return all output in `reasoning_content` and leave `message.content` empty. Tahoe now sends that parameter for local Qwen endpoints and keeps `/no_think` in the local prompt path.
- The 2026-04-30 Daily Run generated three local owned-media projects via Qwen: AI快讯 `cmol95fyt0008s0j9ixzy9cxf`, 全球股市 `cmol9777a000rs0j9wtd4w52p`, and 消费时尚 `cmol98iss000ws0j9tfjdjk2y`. Main drafts are usable in Script Lab; local-Qwen background packaging can still partially fail on context-window limits, especially audience review, image brief generation, or later title-pack calls.
- The 2026-05-12 Daily Run was run again entirely through platform APIs using local Qwen 3.6. It created three Script Lab projects with title pack and publish copy completed: AI快讯 `cmp27ijyt0000s0rbdgpuvt61`, 全球股市 `cmp27kqdy0007s0rbedoumpr3`, and 消费时尚 `cmp27mgdl000es0rbmjksdfmu`. This run intentionally set `generateStoryboard=false`, so the daily article-output lane stayed separate from Scene Planner / Render Lab image production.
- Product direction: treat "每日三篇文章输出" as its own Daily Run owned-media board. Future automation for this task should live inside Daily Run / Script Lab handoff and should not require, block, or mutate Marketing Ops, Scene Planner, Render Lab, or other production boards unless the user explicitly asks for image/render work.
- These are **future roadmap items**, not the current sprint scope. Current work should stay focused on content quality, prompt quality, artifact-first UX, and clearer user flow.

## Known Issues

1. CI/CD runs sometimes fail if server `node_modules` gets corrupted — manual `npm ci` fixes it
2. Some local environments may still carry stale `app_settings` records with mock/news provider values from earlier phases. This is a persisted local-state issue, not a current code crash, but it can make first-run verification look "mock-first" unless the settings are updated.
3. ~~The local quality-first model route can still inherit older persisted provider/model settings from `app_settings`.~~ **Resolved by T-018**: `resolveModelRoute()` now automatically falls back to an available provider when the configured provider lacks credentials. Run `npx tsx scripts/fix-cloud-model-settings.ts` to also normalize the persisted settings record.
4. The GPT-5.5 article dry run shows the pipeline is now functional end-to-end. A later quality pass replaced the too-short cloud inspection draft with a long-form v2 and upgraded AI快讯 prompting, but future runs still need factual source quality checks before real publication.
5. The local `/daily-run` webpack runtime screenshot was not reproducible after clearing `.next` and starting a clean dev server; build and HTTP smoke tests returned `200`. If it reappears on port 3000, stop the older dev process and restart from a clean cache.
6. ~~Cloud packaging generation can still inherit an older persisted Gemini model setting (`gemini-2.5-pro`) and fail with Google API `User location is not supported for the API use`.~~ **Resolved by T-018**: `generateStructuredJson()` now uses credential-aware fallback. If Gemini lacks credentials, it will automatically fall back to OPENAI (or the next available provider). Console warnings log when fallback occurs.
7. Local Qwen support is now verified on the user's machine through LM Studio at `http://127.0.0.1:1234/v1`, using model `qwen3.6-35b-a3b-uncensored-hauhaucs-aggressive`. The local Tahoe settings database and `.env.local` both route all model steps to this Qwen endpoint for local testing. This does not make Tencent Cloud able to call the laptop-local endpoint.
8. Local Qwen generation parameters are intentionally conservative for now (`temperature=0.35`, `top_p=0.85`, `max_tokens=8192`) because Tahoe still depends on JSON-shaped outputs for review, packaging, and image-brief records. Raise creativity only after checking parse reliability.

## Constraints — DO NOT VIOLATE

1. **Do NOT use `ProxyAgent` globally** — use `EnvHttpProxyAgent` with `NO_PROXY` in `instrumentation.ts`
2. **Do NOT set `mockMode: true`** unless explicitly requested — it wastes Serper API quota
3. **Do NOT auto-search on page mount** — user must click "搜索" explicitly
4. **Always run `npx prisma db push`** after adding Prisma schema fields
5. **Always update `docs/` files** after completing any task
6. **Keep the existing design system** — vanilla CSS with CSS custom properties, no Tailwind
7. **Serper free tier**: 2,500 queries/month — be conservative with API calls

## 部署工作流规则

默认情况下，agent 完成任务后只执行：
- build
- git commit
- git push

默认不自动部署到腾讯云服务器。

只有在以下条件同时满足时，才允许自动部署：
1. 改动是低风险任务（如 UI、样式、文案、轻量前端优化）
2. build 通过
3. 未触碰核心业务逻辑、API 契约、数据库结构、鉴权、支付或其他高风险链路
4. 当前任务被明确标记为允许部署，或用户明确要求"改完自动部署"

如果不满足以上条件，则只允许做到 push，不允许自动部署。

任务结束时，必须明确汇报：
- Build: passed / failed / not run
- Commit: yes / no
- Push: yes / no
- Deploy: yes / no

如果某一步没做，必须直接说明原因，不要用模糊表述。
