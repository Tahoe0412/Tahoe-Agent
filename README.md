# AI Video Research Orchestrator MVP

面向 AI 广告 / AI 视频创作者的 Web 应用骨架，用于完成前期调研、脚本 AI 重构、镜头分类、素材依赖分析与报告生成。

补充文档：

- [用户手册](/Users/ztq0412/Documents/Playground/docs/user-manual.md)
- [版本更新记录](/Users/ztq0412/Documents/Playground/docs/release-notes.md)
- [营销平台架构](/Users/ztq0412/Documents/Playground/docs/marketing-platform-architecture.md)
- [腾讯云部署说明](/Users/ztq0412/Documents/Playground/DEPLOY.md)

## 1. 技术架构设计

### 选型

- 前端: Next.js 15 + TypeScript + Tailwind CSS
- 后端: Next.js App Router + Route Handlers
- 数据库: PostgreSQL
- ORM: Prisma
- 图表: Recharts
- 输出约束: Zod Schema

### 为什么优先选 Next.js API / Route Handlers

- 对 MVP 更稳定，前后端同仓库，部署链路更简单。
- 页面、API、类型、Schema、服务层可以共享代码，降低维护成本。
- 后续如果需要高吞吐异步编排，再拆出 FastAPI 或 Worker 更自然。

### 模块分层

1. 平台数据采集层
   - `services/platform-collectors/*`
   - 按平台实现统一接口，当前预留 YouTube / X / TikTok 三个平台适配器。
2. 趋势分析层
   - `services/trend-analysis.service.ts`
   - 负责把采集结果整理为趋势信号与热度摘要。
3. 剧本重构层
   - `services/script-rewrite.service.ts`
   - 输出结构化脚本重写结果。
4. 镜头分类层
   - `services/shot-classification.service.ts`
   - 输出镜头维度标签: 有人/无人、有动作/无动作、有台词/无台词。
5. 素材依赖层
   - `services/asset-dependency.service.ts`
   - 生成每个镜头需要的素材类型和提示信息。
6. 报告生成层
   - `services/report-generator.service.ts`
   - 聚合以上结果，生成前端展示和下游使用的统一报告结构。
7. 编排入口
   - `services/research-orchestrator.service.ts`
   - 负责参数校验、平台采集调用、AI 输出 schema 校验、Prisma 落库。

### 系统流程

1. 用户输入主题和原始剧本。
2. 编排器按平台发起采集任务。
3. 趋势分析、创作者提取、爆款模式总结、剧本重构、镜头分类、素材依赖分析依次产出。
4. 所有结构化结果经过 `schemas/project.ts` 校验。
5. 结果写入 PostgreSQL，并通过 API 返回前端。

## 2. 数据库 Schema 设计

核心实体如下:

- `Project`: 调研项目主表
- `ResearchJob`: 平台采集任务
- `TrendReport`: 趋势研究结果
- `CreatorProfile`: 热门创作者
- `ContentPattern`: 爆款内容模式
- `ScriptVersion`: 原始/重构脚本版本
- `Shot`: 镜头拆解与分类
- `AssetDependency`: 镜头素材依赖
- `GeneratedReport`: 聚合报告结果

完整 Prisma schema 位于 [prisma/schema.prisma](/Users/ztq0412/Documents/Playground/prisma/schema.prisma)。

新增的预生产控制平面设计见 [docs/production-architecture.md](/Users/ztq0412/Documents/Playground/docs/production-architecture.md)。

## 3. API 路由设计

### `POST /api/projects`

创建项目并执行一轮编排，输入:

```json
{
  "title": "AI 视频调研编排 MVP",
  "topic": "AI 广告视频工作流",
  "sourceScript": "原始剧本文本...",
  "platforms": ["YOUTUBE", "X", "TIKTOK"]
}
```

输出:

- 项目主数据
- 结构化研究结果
- 聚合报告

### `GET /api/projects/:id`

按项目读取完整调研结果，包括趋势、创作者、脚本版本、镜头和素材依赖。

### 新增预生产接口

- `GET/POST /api/projects/:id/briefs`
- `GET/POST /api/projects/:id/approvals`
- `GET/POST /api/projects/:id/storyboards`
- `POST /api/projects/:id/frame-references`
- `GET/POST /api/projects/:id/render-jobs`

### `GET /api/taxonomy`

前端表单和流程编排需要的枚举字典。

### `GET /api/health`

健康检查。

## 4. 页面结构

### `/`

- 顶部价值说明
- 指标卡片
- 任务创建表单
- 趋势图表
- 热门创作者列表
- 爆款模式卡片
- 镜头分类与素材依赖预览

### `/projects/[id]`

- 项目详情占位页
- 后续接入数据库读取与可视化详情面板

## 5. 目录结构

```text
app/
  api/
  projects/[id]/
components/
  dashboard/
  layout/
  ui/
lib/
prisma/
schemas/
services/
  platform-collectors/
types/
```

## 6. 本地启动

### 环境要求

- Node.js 20+
- PostgreSQL 15+

### 启动步骤

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env
```

3. 初始化数据库

```bash
npm run prisma:generate
npm run db:push
```

4. 启动开发环境

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

### 文件上传

- 第一版真实素材上传使用本地存储，文件会写入 `public/uploads`
- 可在 `.env` 中调整:

```bash
UPLOAD_STORAGE_MODE="local"
UPLOAD_BASE_PATH="public/uploads"
MAX_UPLOAD_MB="20"
```

- 当前生产环境使用腾讯云服务器，本地存储适合开发和轻量演示。如果后续要做多机共享、跨实例持久化或更大文件上传，建议切到对象存储：
- 如果后续要切到腾讯云对象存储，可改成：

```bash
UPLOAD_STORAGE_MODE="tencent_cos"
TENCENT_COS_SECRET_ID="your_secret_id"
TENCENT_COS_SECRET_KEY="your_secret_key"
TENCENT_COS_BUCKET="your_bucket"
TENCENT_COS_REGION="ap-guangzhou"
TENCENT_COS_BASE_URL="https://your-cdn-or-cos-domain"
```

说明：
- `local` 适合本地开发和演示
- `tencent_cos` 适合腾讯云自托管后的长期素材沉淀与跨实例共享
- 生产环境当前仍可继续使用 `local`，因为应用运行在自有腾讯云服务器
- `TENCENT_COS_BASE_URL` 可选；如果你绑定了 CDN 或自定义域名，建议在这里填写

### 接入真实大模型

- 设置 `OPENAI_API_KEY`
- 或设置 `GEMINI_API_KEY`
- 或设置 `DEEPSEEK_API_KEY`
- 或设置 `QWEN_API_KEY`
- 本地开发建议把这些 key 放在 `.env.local`
- 当前版本会在第一次创建设置记录时自动读取 `.env.local` / `.env` 里的默认 API key，避免你每次重置本地数据库后重新输入
- 模型选择、步骤模型路由和 mock 开关不会自动写入数据库，仍然由你在设置页手动控制
- 将 `LLM_MOCK_MODE` 改为 `false`
- 可在 Settings 页面统一切换默认 provider / model，并为不同步骤单独路由模型

```bash
OPENAI_API_KEY="your_key"
GEMINI_API_KEY=""
DEEPSEEK_API_KEY=""
QWEN_API_KEY=""
OPENAI_MODEL="gpt-5.4-mini"
LLM_PROVIDER="OPENAI"
LLM_MOCK_MODE="false"
```

推荐的分步骤模型路由：

```bash
LLM_ROUTE_MARKETING_ANALYSIS_PROVIDER="OPENAI"
LLM_ROUTE_MARKETING_ANALYSIS_MODEL="gpt-5.4"
LLM_ROUTE_PROMOTIONAL_COPY_PROVIDER="QWEN"
LLM_ROUTE_PROMOTIONAL_COPY_MODEL="qwen3-max"
LLM_ROUTE_PLATFORM_ADAPTATION_PROVIDER="QWEN"
LLM_ROUTE_PLATFORM_ADAPTATION_MODEL="qwen3.5-plus"
LLM_ROUTE_SCRIPT_REWRITE_PROVIDER="GEMINI"
LLM_ROUTE_SCRIPT_REWRITE_MODEL="gemini-3.1-pro-preview"
LLM_ROUTE_SCENE_CLASSIFICATION_PROVIDER="OPENAI"
LLM_ROUTE_SCENE_CLASSIFICATION_MODEL="gpt-5.4-mini"
LLM_ROUTE_ASSET_ANALYSIS_PROVIDER="OPENAI"
LLM_ROUTE_ASSET_ANALYSIS_MODEL="gpt-5.4-mini"
LLM_ROUTE_REPORT_GENERATION_PROVIDER="OPENAI"
LLM_ROUTE_REPORT_GENERATION_MODEL="gpt-5.4"
```

当前已接通真实 LLM 开关的模块:

- Script Rewriter
- Scene Classification
- Asset Dependency Analyzer
- Promotional Copy Generator
- Platform Adaptation

### 接入联网新闻搜索

- 设置 `TAVILY_API_KEY`
- 将 `NEWS_SEARCH_PROVIDER` 改为 `TAVILY`
- 将 `NEWS_SEARCH_MOCK_MODE` 改为 `false`

```bash
TAVILY_API_KEY="your_key"
NEWS_SEARCH_PROVIDER="TAVILY"
NEWS_SEARCH_MOCK_MODE="false"
```

当前“最新新闻”会在趋势研究任务中作为 `NEWS` evidence 写入数据库。

### 接入实时平台搜索

- 设置对应平台 API key / token
- 将 `PLATFORM_CONNECTOR_MODE` 改为 `live`

```bash
YOUTUBE_API_KEY="your_key"
X_BEARER_TOKEN="your_token"
TIKTOK_ACCESS_TOKEN="your_token"
PLATFORM_CONNECTOR_MODE="live"
```

说明:

- YouTube 已接成第一版 live 采集，会组合 `search + videos + channels` 获取标题、发布时间、时长、播放/点赞/评论以及频道订阅量
- X 已接成第一版 live 采集，会调用 `recent search` 并拉取作者扩展信息，返回推文互动数据和作者粉丝量
- TikTok 当前仍以 mock/stub 为主，适合下一步补真实字段映射和限流处理
- Settings 页面位于 `/settings`，可统一管理默认 provider、model 与新闻搜索配置

## 7. 当前 MVP 状态

- 已完成生产可扩展的项目骨架
- 已定义 Prisma 数据模型
- 已定义 API 路由与模块分层
- 已提供首页与项目详情页骨架
- 已使用 Zod 约束结构化 AI 输出
- 当前平台采集与 AI 生成逻辑为占位实现，便于下一步接入真实搜索 API、LLM 和异步队列

## 8. 生产部署建议

当前正式部署链路已经切到腾讯云服务器，推荐按这条主链路维护：

1. 配置线上环境变量
```bash
DATABASE_URL="..."
APP_BASE_URL="http://111.229.24.208"
PREVIEW_ACCESS_ENABLED="true"
PREVIEW_ACCESS_PASSWORD="your-preview-password"
```

2. 至少开启一套真实模型或搜索能力
```bash
GEMINI_API_KEY="your_key"
LLM_PROVIDER="GEMINI"
LLM_MOCK_MODE="false"
```

3. 如需真实趋势采集，继续补平台密钥
```bash
YOUTUBE_API_KEY="your_key"
X_BEARER_TOKEN="your_token"
PLATFORM_CONNECTOR_MODE="live"
```

4. 上线后先访问：
- 页面入口：`/access`
- 健康检查：`/api/health`

5. 服务器构建建议
```bash
npm install
npm run build
```

说明：
- 线上环境仍需提供正确的 `DATABASE_URL`
- 自动部署入口见 [DEPLOY.md](/Users/ztq0412/Documents/Playground/DEPLOY.md)

说明：
- 当 `PREVIEW_ACCESS_ENABLED=true` 时，页面访问会被统一重定向到 `/access`
- 输入正确口令后会写入 cookie，适合内部团队或受邀测试用户共享
- `GET /api/health` 会返回应用状态和数据库连通状态，适合部署探活
- 当前素材上传默认写入 `public/uploads`，更适合自托管开发和轻量生产环境
- 若需要更长期或跨云共享，后续仍建议补 S3、R2、COS 等对象存储

## 8. 下一步建议

1. 接入真实平台搜索与数据采集服务
2. 接入 LLM，并以 JSON Schema / function calling 方式稳定产出结构化结果
3. 增加任务状态流转与队列
4. 为项目详情页补充真实数据库读取和图表
# Tahoe-Agent
