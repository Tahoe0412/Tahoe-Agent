# Content Matrix Strategy

> Last updated: 2026-04-15 by Codex
> This document defines the near-term business focus for Tahoe.

For the broader operating flow, revenue model, account-role split, and 30-day priorities, see `docs/BUSINESS_MODEL.md`.

## Near-Term Goal

Use AI tools and agentic workflows to build an owned-media matrix, starting from **Toutiao article/image publishing**, and turn that matrix into two revenue streams:

1. **Content / advertising revenue**
2. **Service / technical revenue**

This is the current priority. Video is explicitly **not** the main production target for now.

## Production Focus

Tahoe should now optimize for:

- topic discovery
- project brief generation
- article / master-draft generation
- title / summary / publish packaging
- polished image-brief generation
- refined static image production

Tahoe should de-prioritize:

- video-first workflows
- shot continuity as a production blocker
- video render as the default “next step”

## Launch Channel

Primary launch channel:

- **Toutiao / 头条号**

Reason:

- article + image format is a better fit for the current platform maturity
- it reduces execution complexity versus video
- it gives a clearer path to testing titles, packaging, and editorial positioning

Secondary channels can follow later through adaptation and repackaging.

## Editorial Directions

Tahoe should treat the following as the first three owned-media directions:

### 1. AI快讯

- persona: 科技资讯 / AI 行业观察
- focus:
  - 大模型发布
  - Agent 动态
  - AI 产品更新
  - 行业快讯

### 2. 全球股市

- persona: 全球市场观察 / 财经快评
- focus:
  - 美股
  - 港股
  - A股
  - 宏观资金
  - 财报与公司动态

### 3. 消费时尚

- persona: 品牌与生活方式观察
- focus:
  - 品牌动态
  - 美妆服饰
  - 消费趋势
  - 审美与购买判断

## Product Implications

Current Tahoe internal type names do not need to be renamed immediately.

- `MARS_CITIZEN` should be treated as the current compatibility bucket for the **owned-media matrix**
- `MARKETING` should remain the **commercial services** line

This means:

- do not spend time on a schema rename first
- do update user-facing copy and planning docs now
- use brand profiles / project briefs / topic strategy to represent the three editorial directions

## Immediate Build Priorities

### P1

- improve article / master-draft quality
- improve title / summary / packaging quality
- improve image-brief quality
- improve static image quality and consistency

### P2

- add project-level visual setup for article cover / inline images
- add clearer editorial-direction seeding in project briefs
- make Toutiao-first packaging explicit in output guidance

### P3

- return to video only after text + image quality is stable

## Success Criteria

Tahoe is on the right path when:

- one topic can quickly become a publishable Toutiao article package
- the article and images feel aligned and intentional
- the three editorial directions have visibly different positioning and voice
- the platform can support both owned-media output and client-service output without mixing the two
