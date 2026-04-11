# Project State

> Last updated: 2026-04-11 by Codex
> Read this file FIRST before doing any work.

## Goal

Build **Tahoe** — a shared AI content-production base that currently serves:
- **Owned media matrix**: Toutiao-first article and image-first publishing across three initial directions:
  - AI增长官
  - 金钱不眠
  - 东方元气
- **Commercial services**: client-facing copywriting, ad content, and content-production support

The platform aggregates trend and research signals, then routes users toward the smallest set of actions needed to produce a usable article/image package or a client-facing deliverable.

## Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS custom properties (design tokens)
- **Database**: PostgreSQL (localhost:5432, database `ai_video_mvp`)
- **ORM**: Prisma
- **AI**: Google Gemini API + OpenAI API + Qwen API (quality-first routing)
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
- The shared project-creation form now also exposes three quick owned-media presets (`AI增长官`, `金钱不眠`, `东方元气`) that prefill the brief context without introducing a separate create flow. The same preset family now also seeds Brand Profiles and Brief Studio so users can carry one editorial direction through project shell, brand constraints, and creative brief setup.
- Scene Planner and Render Lab are now described to users as `配图说明 / 图片生产` surfaces. The current backend still stores these flows as storyboard/render-compatible internals, but the UI should teach image-first work unless a future schema migration explicitly changes that boundary.
- Scene Planner and Render Lab now also expose a lightweight image-brief review seam. Tahoe uses the existing row data (`shotGoal`, `rewritten`, `visualPrompt`, references, risk flags, asset readiness, composition hints) to tell users whether a row is ready for the first image pass or still needs revision.
- Render jobs can now also store structured result feedback inside `output_json.feedback`, so users can mark a run as `保留这一版 / 继续重试 / 先改 brief` and capture the main failure tags directly on the image task record.
- Scene Planner now reads those saved render-job feedback records back onto the matching row. Users can see when a row has already been retried or sent back for brief rewrites, along with the most common recent failure tags.
- The homepage/shared create flow has now been hardened for first-run use: owned-media presets no longer overwrite the current topic, the form brings `project introduction` + `core idea` up into the main owned-media path, and shared default payloads no longer post schema-invalid hidden values during project creation.
- The no-project homepage now leads with a three-step quick-start strip and puts the create form ahead of strategy detail, so first-time users see the immediate action path before the broader editorial-system explanation.
- The shared create form is also being compressed toward a true first-run shell: headline copy is shorter and the “what improves the first draft” guidance now reads as a compact three-point list instead of another card wall.
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
- `AppSettings.llm_model` schema default now also matches the new baseline (`gpt-5.4-mini`) instead of the earlier `gpt-4.1-mini`, preventing new settings records from silently inheriting an outdated fallback model.
- Long-term architecture direction is now documented separately in `docs/FUTURE_BLUEPRINT.md`. The two most important future vectors are:
  - stronger review-loop / agentic orchestration over time
  - stronger multimodal brand memory / retrieval over time
- Near-term editorial direction and business focus are now documented separately in `docs/CONTENT_MATRIX_STRATEGY.md`.
- Homepage and project-intent cards are now intentionally shorter. Use cards to signal direction, not to explain the full workflow inside every card body.
- Brief Studio platform values are now normalized to the backend schema-safe set (`XHS`, `DOUYIN`, `YOUTUBE`, `X`, `TIKTOK`). Do not reintroduce ad-hoc UI-only values such as `XIAOHONGSHU` or `BRAND_PAGE` into brief payloads unless the schema is explicitly expanded first.
- These are **future roadmap items**, not the current sprint scope. Current work should stay focused on content quality, prompt quality, artifact-first UX, and clearer user flow.

## Known Issues

1. CI/CD runs sometimes fail if server `node_modules` gets corrupted — manual `npm ci` fixes it

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
