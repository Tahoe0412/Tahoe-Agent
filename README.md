# AI Video Research Orchestrator

面向 AI 广告、AI 视频和内容团队的工作台应用，用于完成趋势发现、项目编排、脚本生成/重写、镜头拆分、素材依赖分析、品牌资料管理、发布文案和预生产协作。

补充文档：

- [项目结构说明](docs/PROJECT_STRUCTURE.md)
- [用户手册](docs/user-manual.md)
- [版本更新记录](docs/release-notes.md)
- [营销平台架构](docs/marketing-platform-architecture.md)
- [预生产架构](docs/production-architecture.md)
- [腾讯云部署说明](DEPLOY.md)

## 1. 技术栈

- 前端：Next.js 15 App Router + React 19 + TypeScript
- 后端：Next.js Route Handlers
- 数据库：PostgreSQL
- ORM：Prisma 6
- 校验：Zod
- 图表：Recharts
- 测试：Vitest
- 样式：Tailwind CSS 4 + 项目内 UI primitives

本项目保持 Next.js 全栈单仓库结构，不拆成独立 `frontend/` 和 `backend/`。页面、API、schema、service、类型和部署链路在同一仓库内协作，降低 MVP 和自托管部署复杂度。

## 2. 当前模块分层

核心约定是：页面薄、API 薄、业务进 service、边界进 schema/type。

- `app/`：页面、布局、错误页和 `app/api/**/route.ts`。Route handler 只做请求解析、校验、调用 service、统一返回。
- `components/`：React UI。`components/ui` 是通用控件，`components/workspace`、`components/today`、`components/trend-discovery` 等承载业务工作台。
- `services/`：业务逻辑、平台连接器、新闻搜索、趋势评分、脚本/镜头/素材/故事板/营销编排等服务。
- `schemas/`：Zod schema，覆盖项目输入、设置、AI 输出、制作控制、合规和发布文案等边界。
- `lib/`：通用 helper，包括 API 响应、错误处理、环境变量、客户端请求、prompt 构建、文案和上传存储。
- `types/`：跨层共享的 TypeScript 类型。
- `prisma/`：Prisma schema 和迁移。
- `tests/`：Vitest 测试。新增测试优先按 `tests/services`、`tests/api`、`tests/lib` 分组。
- `docs/`：产品、架构、部署、决策、任务和用户文档。

## 3. 主要业务能力

- 趋势发现：平台连接器、新闻搜索、CN 索引证据和趋势评分。
- 项目中心：项目创建、归档、工作区模式和内容线选择。
- Brief Studio：创意简报、品牌约束、目标受众和生产要求。
- Script Lab：主稿预览、发布包装、镜头拆分、镜头分类和镜头级打磨。
- Scene Planner：故事板、分镜参考、连续性和预生产控制。
- Render Lab：图片、视频、声音、音乐等渲染任务管理。
- Marketing Ops：品牌资料、内容支柱、平台改写、合规检查、营销 sprint 和策略任务。
- Daily Run / Today：每日内容执行视图和近期项目入口。
- Settings：模型 provider、模型路由、新闻搜索、主题和语言设置。

## 4. API 边界

常用入口：

- `GET /api/health`：应用和数据库健康检查。
- `GET/POST /api/projects`：项目列表与项目创建。
- `GET/PATCH/DELETE /api/projects/:id`：项目详情、更新和归档。
- `POST /api/research/hot-topics`：趋势热点搜索和评分。
- `POST /api/scripts/generate-from-news`：基于新闻生成脚本。
- `POST /api/scripts/:id/split-scenes`：脚本拆镜头。
- `POST /api/projects/:id/scenes/:sceneId/classify`：镜头分类。
- `POST /api/projects/:id/scenes/:sceneId/assets/analyze`：素材依赖分析。
- `GET/POST /api/projects/:id/briefs`、`storyboards`、`render-jobs`、`approvals`：预生产控制面板。
- `GET/POST /api/brand-profiles`、`industry-templates`、`settings`：运营配置。

成功响应优先使用 `ok`，失败响应优先使用 `fail` 或 `toErrorResponse`。请求体解析优先使用 `parseJsonBody` / `parseOptionalJsonBody`，复杂业务不要直接写在 route handler 里。

## 5. 本地启动

环境要求：

- Node.js 20+
- PostgreSQL 15+

启动步骤：

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:push
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

常用验证命令：

```bash
npm run lint
npm run test:unit
npm run build
npm run prisma:generate
```

## 6. 环境变量

本地开发建议把密钥放在 `.env.local`。不要提交真实密钥、token 或数据库 URL。

基础配置：

```bash
DATABASE_URL="postgresql://..."
APP_BASE_URL="http://localhost:3000"
PREVIEW_ACCESS_ENABLED="false"
PREVIEW_ACCESS_PASSWORD=""
```

模型配置：

```bash
OPENAI_API_KEY=""
GEMINI_API_KEY=""
DEEPSEEK_API_KEY=""
QWEN_API_KEY=""
QWEN_BASE_URL=""
LLM_PROVIDER="OPENAI"
OPENAI_MODEL="gpt-5.4-mini"
LLM_MOCK_MODE="false"
```

平台和搜索：

```bash
YOUTUBE_API_KEY=""
X_BEARER_TOKEN=""
SERPER_API_KEY=""
SERPAPI_KEY=""
PLATFORM_CONNECTOR_MODE="live"
NEWS_SEARCH_PROVIDER="GOOGLE"
NEWS_SEARCH_MOCK_MODE="false"
```

上传存储：

```bash
UPLOAD_STORAGE_MODE="local"
UPLOAD_BASE_PATH="public/uploads"
MAX_UPLOAD_MB="20"
```

如需腾讯云对象存储：

```bash
UPLOAD_STORAGE_MODE="tencent_cos"
TENCENT_COS_SECRET_ID=""
TENCENT_COS_SECRET_KEY=""
TENCENT_COS_BUCKET=""
TENCENT_COS_REGION="ap-guangzhou"
TENCENT_COS_BASE_URL=""
```

## 7. 数据库与部署

完整 Prisma schema 位于 `prisma/schema.prisma`。修改 schema 后需要同步考虑 Prisma Client、迁移、历史数据和生产库同步风险。

当前生产部署链路：

- 服务器：腾讯云 Lighthouse
- 反向代理：nginx
- 进程管理：pm2
- 数据库：服务器本地 PostgreSQL
- 自动部署：GitHub Actions 上传代码并执行 `scripts/deploy.sh`

生产细节、回滚注意事项和服务器命令见 [DEPLOY.md](DEPLOY.md)。

## 8. 维护原则

- 不做无关重构，所有改动都应能追溯到需求。
- 新增业务能力按 `page -> workbench/component -> hook/client -> api route -> service -> schema/type` 的路径落位。
- 大型 workbench 组件优先按状态管理、操作区、表单区和数据面板拆分。
- `lib` 只放跨域 helper；业务规则优先靠近对应 service 或 schema。
- 非主项目内容不要继续堆在根目录，归档候选见 [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)。
