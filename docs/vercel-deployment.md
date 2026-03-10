# Vercel 测试版部署说明

这套工作台当前适合先以“受控测试版”方式部署到 Vercel，而不是直接公开开放。

## 1. 部署前确认

- 代码已经通过:
  - `npm run lint`
  - `npm run build`
- 已启用:
  - `/access` 访问口令页
  - `/api/health` 健康检查
  - `postinstall: prisma generate`

## 2. 推荐环境变量

最少需要：

```bash
DATABASE_URL="..."
APP_BASE_URL="https://your-preview-domain.vercel.app"
PREVIEW_ACCESS_ENABLED="true"
PREVIEW_ACCESS_PASSWORD="your-preview-password"
```

如果要启用真实模型：

```bash
LLM_PROVIDER="GEMINI"
LLM_MOCK_MODE="false"
GEMINI_API_KEY="..."
```

如果要启用最新新闻搜索：

```bash
NEWS_SEARCH_PROVIDER="TAVILY"
NEWS_SEARCH_MOCK_MODE="false"
TAVILY_API_KEY="..."
```

如果要启用真实平台研究：

```bash
PLATFORM_CONNECTOR_MODE="live"
YOUTUBE_API_KEY="..."
X_BEARER_TOKEN="..."
```

如果要让素材上传在 Vercel 上可长期使用：

```bash
UPLOAD_STORAGE_MODE="vercel_blob"
BLOB_READ_WRITE_TOKEN="..."
```

## 3. 素材上传说明

当前代码支持两种模式：

- `local`
  - 适合本地开发
  - 文件写入 `public/uploads`
- `vercel_blob`
  - 适合 Vercel 测试版和共享环境
  - 前端直传 Vercel Blob
  - 上传后自动回写 `uploaded_assets`

推荐线上统一使用：

```bash
UPLOAD_STORAGE_MODE="vercel_blob"
```

## 4. 部署后检查

部署完成后，依次检查：

1. 打开 `/access`
2. 输入测试口令
3. 打开 `/api/health`
4. 创建一个项目
5. 跑一次完整 workflow
6. 去 `Scene Planner` 上传一个素材文件

如果 `/api/health` 返回：

```json
{
  "status": "ok",
  "database": "ok"
}
```

说明应用和数据库都已连通。

## 5. 当前适合的共享方式

建议当前阶段只做：

- 内部团队试用
- 少量合作方试用
- 受邀测试用户试用

暂时不建议直接公开开放，原因是：

- 小红书 / 抖音真实数据源还没接完
- 账号体系还没完成
- 细粒度权限和协作还没做

## 6. 下一步建议

上线测试版后，优先继续补：

1. 最小账号体系
2. 项目分享 / 只读链接
3. 对象存储之外的导出与备份
