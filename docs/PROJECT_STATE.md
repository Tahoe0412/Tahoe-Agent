# Project State

> Last updated: 2026-03-16 by Antigravity (Claude)
> Read this file FIRST before doing any work.

## Goal

Build **Tahoe** — a production-ready marketing intelligence workspace that helps content creators research trends, generate scripts, and produce marketing copy. The platform aggregates data from YouTube, X (Twitter), Google News, and other sources to surface actionable hot topics.

## Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS custom properties (design tokens)
- **Database**: PostgreSQL (localhost:5432, database `ai_video_mvp`)
- **ORM**: Prisma
- **AI**: Google Gemini API
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
| Dashboard (`/`) | ✅ Working | Project creation, workspace overview |
| Today Workbench (`/today`) | ✅ Working | Hot topics search with real Serper news data |
| Trend Explorer (`/trend-explorer`) | ✅ Working | Trend research with Serper integration |
| Script Lab (`/script-lab`) | ✅ Working | Script generation |
| Scene Planner (`/scene-planner`) | ✅ Working | Storyboard planning |
| Render Lab (`/render-lab`) | ✅ Working | Image/video generation |
| Marketing Ops (`/marketing-ops`) | ✅ Working | Copy generation and distribution |
| Brand Profiles (`/brand-profiles`) | ✅ Working | Brand keyword pools |
| Settings (`/settings`) | ✅ Working | App configuration |
| Serper News Search | ✅ Live | Returns real Google News results |
| YouTube Connector | ✅ Live | Returns real YouTube video data via Data API v3 |
| X/Twitter Connector | ⚠️ Failed | Connection fails (needs Twitter API credentials) |

## Known Issues

1. X connector doesn't return real data — only Serper news search and YouTube work
2. CI/CD runs sometimes fail if server `node_modules` gets corrupted — manual `npm ci` fixes it

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
