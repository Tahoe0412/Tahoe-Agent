# 品牌营销策略、内容生产与运营自动化工作台

## 新定位

平台从“内容研究与前置编排工具”升级为“品牌营销策略、内容生产与运营自动化一体化工作台”。

核心原则：

- 平台通用层负责沉淀方法、模板与规则
- 项目实例层负责把品牌、行业和执行周期组合成可落地的项目
- research / script / scene / workflow 继续保留，作为内容生产主链路
- 新增模块通过 `brand_profile + industry_template + campaign_sprint` 注入到既有链路中

## 两层模型

### A. 平台通用层

- `BrandProfile`
  - 品牌定位、品牌语气、禁用表达、合规备注、平台优先级
- `IndustryTemplate`
  - 行业关键词、竞品关键词、内容边界、风险词、推荐选题
- `IndustryResearchSnapshot`
  - 行业研究快照
- `CompetitorProfile`
  - 竞品档案与表达角度
- `ContentPillar`
  - 品牌内容矩阵

### B. 项目实例层

- `Project`
  - 现在可以绑定 `brand_profile_id` 与 `industry_template_id`
- `CampaignSprint`
  - 一轮项目执行周期
- `StrategyTask`
  - 项目级内容策略任务
- `PlatformAdaptation`
  - 多平台改写结果
- `ComplianceCheck`
  - 发布前检查
- `OptimizationReview`
  - 复盘与下一轮建议

## 页面信息架构

- `/brand-profiles`
  - 品牌档案库
  - 内容支柱维护
  - 绑定到当前项目
- `/industry-templates`
  - 行业模板库
  - 竞品档案
  - 风险词与推荐选题
  - 绑定到当前项目
- `/marketing-ops`
  - Campaign / Sprint
  - 项目级策略任务
  - 平台改写
  - 合规检查
  - 复盘优化

## 与现有模块的衔接

- Dashboard
  - 增加品牌、行业模板、执行周期提示
- Brief Studio
  - 后续可自动读取品牌语气、禁用表达、目标平台优先级
- Trend Explorer
  - 后续可读取行业模板里的竞品关键词与风险词
- Script Lab
  - 后续可读取品牌 voice、内容支柱和平台适配要求
- Scene Planner
  - 后续可读取平台改写、合规结果与素材优先级
- Workflow
  - 下一阶段可扩展为：
    - research -> brief -> script -> storyboard -> adaptation -> compliance -> review

## 当前最小可用实现

- 数据库 schema 已扩展
- API 与 service 已新增
- 三个新页面已可创建和查看数据
- 新数据已挂回 `WorkspaceQueryService`

## 下一步建议

1. 把品牌 / 行业配置注入 Script Rewrite prompt
2. 给 Platform Adaptation 接真实 LLM 改写
3. 给 Compliance Check 接真实规则 + 模型校验
4. 给 Optimization Review 接平台表现数据导入
