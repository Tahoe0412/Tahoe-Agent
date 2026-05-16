import { describe, expect, it } from "vitest";
import { buildOwnedMediaNarrativePrompt } from "@/lib/mars-citizen-prompt";

const facts = [
  {
    title: "OpenAI 发布新模型",
    source: "Example News",
    published_at: "2026-04-29T04:00:00.000Z",
    snippet: "模型能力和价格发生变化。",
  },
];

describe("owned media narrative prompt", () => {
  it("generates distinct editor briefs for the three owned-media accounts", () => {
    const ai = buildOwnedMediaNarrativePrompt(facts, [], "OpenAI 新模型", "AI快讯");
    const market = buildOwnedMediaNarrativePrompt(facts, [], "纳指 财报", "全球股市");
    const fashion = buildOwnedMediaNarrativePrompt(facts, [], "品牌联名新品", "消费时尚");

    expect(ai.systemPrompt).toContain("AI 信息过滤器");
    expect(ai.systemPrompt).toContain("这条 AI 新闻真正改变了什么");
    expect(market.systemPrompt).toContain("市场变量解释者");
    expect(market.systemPrompt).toContain("不构成投资建议");
    expect(fashion.systemPrompt).toContain("品牌与审美信号编辑");
    expect(fashion.systemPrompt).toContain("空泛种草");
    expect(ai.systemPrompt).toContain("账号人设包装");
    expect(market.systemPrompt).toContain("不是荐股老师");
    expect(fashion.systemPrompt).toContain("不是柜姐");
    expect(new Set([ai.systemPrompt, market.systemPrompt, fashion.systemPrompt]).size).toBe(3);
  });

  it("keeps long-form Toutiao constraints in the prompt", () => {
    const prompt = buildOwnedMediaNarrativePrompt(facts, [], "OpenAI 新模型", "AI快讯");

    expect(prompt.userPrompt).toContain("1900-2300 中文字");
    expect(prompt.systemPrompt).toContain("低于 1700 字视为没有展开");
    expect(prompt.userPrompt).toContain("至少做 2 次显性来源归因");
    expect(prompt.userPrompt).toContain("至少写 1 个“账号人设段落”");
    expect(prompt.systemPrompt).toContain("不复制具体文章");
  });

  it("does not inject AI-specific visual guidance into market or fashion prompts", () => {
    const market = buildOwnedMediaNarrativePrompt(facts, [], "纳指 财报", "全球股市");
    const fashion = buildOwnedMediaNarrativePrompt(facts, [], "品牌联名新品", "消费时尚");

    expect(market.userPrompt).not.toContain("前沿科技内容");
    expect(fashion.userPrompt).not.toContain("前沿科技内容");
    expect(market.userPrompt).toContain("财经热点长文");
    expect(fashion.userPrompt).toContain("消费时尚热点长文");
  });
});
