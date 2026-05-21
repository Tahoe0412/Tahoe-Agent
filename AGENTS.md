# AGENTS.md

AI Video Research Orchestrator 协作代理指南。本文吸收参考文件的核心思想：先想清楚、保持简单、精确修改、用验证闭环；同时按本项目的实际技术栈和业务边界落地。

## 1. 工作原则

### 先理解，再改代码

- 先阅读相关页面、API route、service、schema 和测试，不要只凭文件名猜实现。
- 如果需求有多种解释，先明确假设；只有在风险高或会影响数据/生产行为时再停下来问。
- 把任务转成可验证目标，例如“修复接口报错”应对应到复现方式、相关测试或可运行的健康检查。
- 不要隐藏不确定性。发现数据库、环境变量、外部 API 或部署状态不确定时，直接说明。

### 简单优先

- 只实现当前需求，不预埋没有被要求的扩展点。
- 单次使用的逻辑不要抽成复杂抽象。
- 能复用现有 helper、schema、service、组件时，不新增平行体系。
- 如果改动开始变大，先重新审视是否碰到了错误边界或需求理解偏差。

### 精确修改

- 只改和任务直接相关的文件。
- 不顺手重构、不统一格式、不改无关文案、不删除原本就存在的死代码。
- 保持现有命名、文件组织、中文/英文文案风格和 TypeScript 写法。
- 如果你的改动造成未使用 import、变量、函数，清理它们；不要清理别人留下的无关内容。

## 2. 项目架构边界

本项目是面向 AI 广告 / AI 视频创作者的 Next.js 应用，用于趋势调研、脚本生成/重写、镜头拆分、素材依赖、品牌资料、营销编排和产出管理。

主要技术栈：

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Prisma 6 + PostgreSQL
- Zod schema
- Vitest
- Tailwind CSS 4

核心目录职责：

- `app/`: 页面和 Route Handlers。页面只负责路由级组合，API route 负责请求解析、schema 校验、调用 service、返回统一响应。
- `components/`: React UI。优先复用 `components/ui/*`、`components/workspace/*`、`components/layout/*` 的现有模式。
- `services/`: 业务逻辑、编排、外部平台连接器、AI 输出处理。复杂业务不要塞进 route 或组件。
- `schemas/`: Zod 输入/输出约束。接口入参、AI 结构化输出和跨层数据边界优先在这里建模。
- `lib/`: 通用 helper、环境变量读取、API 响应、错误处理、prompt 构建、客户端请求封装。
- `types/`: 跨模块共享的 TypeScript 类型。
- `prisma/`: 数据模型和迁移。改 schema 要同步考虑 Prisma Client、迁移和服务层读写。
- `tests/`: Vitest 单元测试，覆盖 service、schema、路由 helper 和关键算法。
- `docs/`: 产品、部署、架构和用户文档。

## 3. 编码约定

### TypeScript

- 遵守 `strict`，不要用 `any` 绕过类型，除非边界数据确实不可知且有收窄逻辑。
- 使用 `@/*` 路径别名。
- 外部输入必须先校验再进入业务逻辑，优先使用现有 Zod schema。
- 日期、JSON 字段、Prisma enum 和 nullable 字段要显式处理，不依赖隐式 truthy/falsy。

### API Route Handlers

- 成功响应优先使用 `ok`，失败响应优先使用 `fail` 或 `toErrorResponse`。
- 请求体解析优先使用 `parseJsonBody` / `parseOptionalJsonBody`。
- Route handler 保持薄层：解析请求、校验、调用 service、返回响应。
- 新增接口要考虑错误码、校验失败、数据库未就绪、not found 和权限/预览访问等既有模式。
- 不要把大段业务流程直接写在 `app/api/**/route.ts`。

### Service 层

- 业务编排放在 `services/*`，并优先匹配已有 service 命名和职责。
- 平台采集和连接器沿用 `platform-collectors`、`platform-connectors`、`news-search`、`web-search` 的接口风格。
- AI 结构化输出必须有 schema 或 JSON schema 约束，不能只靠 prompt 描述。
- 涉及数据库写入时，优先让 service 输出明确结果，避免 UI 或 route 拼接复杂状态。

### Prisma / 数据库

- 修改 `prisma/schema.prisma` 前先确认现有模型关系和迁移历史。
- 新字段要考虑历史数据、默认值、nullable、索引、唯一约束和生产库同步风险。
- 不要随意修改或重写既有 migration。
- 本地开发可用 `npm run prisma:generate`、`npm run prisma:migrate` 或 `npm run db:push`，但生产部署说明以 `DEPLOY.md` 为准。

### 前端 UI

- 这是工作台型应用，界面应偏高密度、清晰、可扫描，避免营销落地页式装饰。
- 页面优先复用已有工作台组件、侧边栏、状态面板、按钮和表格样式。
- 不要引入新的 UI 组件体系；已有 `components/ui/*` 能解决时优先使用。
- 交互状态要完整：loading、empty、error、disabled、成功反馈和长文本换行。
- 文案风格保持本项目现有中英混合习惯：业务说明多为中文，技术字段和平台名保持英文。

## 4. 环境变量与外部服务

- 不要提交真实密钥、token、数据库 URL 或生产 `.env` 内容。
- 环境读取集中参考 `lib/env.ts`，不要在各处散落重复解析逻辑。
- 平台连接器可能依赖 `YOUTUBE_API_KEY`、`X_BEARER_TOKEN`、`SERPER_API_KEY` 等；缺失时要有明确降级或错误。
- 上传存储支持 `local` 和 `tencent_cos`，相关配置沿用现有 helper。
- 网络搜索、AI 生成、对象存储和平台 API 都可能失败，错误信息要能帮助定位，但不要泄露密钥。

## 5. 测试与验证

优先选择和改动范围匹配的验证，不要只说“应该可以”。

常用命令：

```bash
npm run lint
npm run test:unit
npm run build
npm run prisma:generate
```

选择标准：

- 改 service、schema、算法或 helper：添加/更新 Vitest，并运行相关测试或 `npm run test:unit`。
- 改 API route：至少验证 schema、错误响应和主要成功路径；必要时补 route helper 测试。
- 改 Prisma schema：运行 `npm run prisma:generate`，并说明迁移/同步方式。
- 改前端页面或组件：运行 lint/build；涉及视觉或交互时启动本地服务并浏览器检查关键路径。
- 改部署脚本或生产配置：阅读 `DEPLOY.md`，避免让当前 PM2 进程在失败构建中下线。

## 6. Git 与文件安全

- 工作区可能已有用户改动。先看 `git status`，不要还原或覆盖不是你做的改动。
- 不使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 不提交 `node_modules`、`.next`、`tsconfig.tsbuildinfo`、上传文件、临时输出或真实环境文件。
- 修改生成文件前确认它是否应该由命令生成，而不是手写。
- 对生产相关文件保持谨慎，尤其是 `scripts/deploy.sh`、`.github/workflows/*`、`prisma/schema.prisma` 和 `DEPLOY.md`。

## 7. 完成标准

每次任务结束前，至少确认：

1. 改动是否直接对应用户目标。
2. 是否复用了项目现有边界和 helper。
3. 是否没有引入无关重构或格式噪音。
4. 是否运行了合适的测试/构建/检查，或说明为什么无法运行。
5. 是否需要提醒用户数据库迁移、环境变量、部署步骤或残余风险。

## 8. 面向本项目的判断准则

- 如果问题发生在“页面行为”，先看 `components/*` 和对应 `app/**/page.tsx`。
- 如果问题发生在“接口返回/数据缺失”，先看 `app/api/**/route.ts`、对应 service、schema 和 Prisma include/select。
- 如果问题发生在“AI 输出结构不稳定”，先看 prompt、JSON schema、Zod schema 和解析/兜底逻辑。
- 如果问题发生在“生产能跑本地不能跑”或相反，先看环境变量、数据库连接、上传存储模式和 `DEPLOY.md`。
- 如果需求涉及新增业务能力，优先从 schema/service/API/UI 的最小闭环实现，不先做大范围平台化。

这些规则的目标不是让代理变慢，而是减少无谓改动、降低生产风险，并让每一次修改都能被清楚验证。
