import { describe, it, expect } from "vitest";
import {
  checkWordCount,
  checkForbiddenPatterns,
  checkInformationDensity,
  checkTitleQuality,
  checkOpeningHook,
  checkParagraphStructure,
  runQualityCheck,
} from "@/lib/quality-gate";

const AI_CONFIG = {
  forbiddenPatterns: ["让我们一起", "不得不说", "颠覆一切"],
  targetWordCount: { min: 1500, max: 3000 },
  qualityChecklist: [],
};

describe("checkWordCount", () => {
  it("passes when word count is within range", () => {
    const text = "中".repeat(2000);
    const result = checkWordCount(text, AI_CONFIG);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("fails when word count is below minimum", () => {
    const text = "中".repeat(500);
    const result = checkWordCount(text, AI_CONFIG);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it("allows slight overshoot within 20% tolerance", () => {
    const text = "中".repeat(3500); // 3500 < 3000 * 1.2 = 3600
    const result = checkWordCount(text, AI_CONFIG);
    expect(result.passed).toBe(true);
  });
});

describe("checkForbiddenPatterns", () => {
  it("passes when no forbidden patterns found", () => {
    const text = "OpenAI 发布了新模型，性能提升了 30%。";
    const result = checkForbiddenPatterns(text, AI_CONFIG);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("fails when forbidden pattern is found", () => {
    const text = "让我们一起来看看这个新模型的表现";
    const result = checkForbiddenPatterns(text, AI_CONFIG);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("让我们一起");
  });

  it("accumulates multiple violations", () => {
    const text = "不得不说，这真的颠覆一切";
    const result = checkForbiddenPatterns(text, AI_CONFIG);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("2 个禁用表达");
  });
});

describe("checkInformationDensity", () => {
  it("scores high for data-rich text", () => {
    const text = "OpenAI 发布 GPT-6，API 价格下调 40%，上下文长度 128K，推理速度提升 3 倍。Anthropic 紧随其后。Google DeepMind 论文显示效率提升 10 倍。";
    const result = checkInformationDensity(text);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("scores low for vague text", () => {
    const text = "最近的发展令人瞩目。这个领域正在经历前所未有的变化。我们应该关注这些趋势。未来的走向值得期待。这些变化将深刻影响我们的生活。";
    const result = checkInformationDensity(text);
    expect(result.score).toBeLessThan(75);
  });
});

describe("checkTitleQuality", () => {
  it("scores well for structured title with numbers", () => {
    const result = checkTitleQuality("美联储暂停加息背后：三个被忽略的经济信号");
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("penalizes clickbait", () => {
    const result = checkTitleQuality("震惊！99%的人不知道的秘密");
    expect(result.score).toBeLessThan(70);
  });

  it("penalizes too-short titles", () => {
    const result = checkTitleQuality("AI新闻");
    expect(result.message).toContain("过短");
  });
});

describe("checkOpeningHook", () => {
  it("fails on generic openings", () => {
    const text = "近日，AI 领域发生了一件大事。\n\n这件事的影响深远。";
    const result = checkOpeningHook(text);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("近日");
  });

  it("passes on direct openings", () => {
    const text = "OpenAI 在 12 月 3 日发布了 GPT-6 系列模型。\n\n新模型的推理能力提升了 3 倍。";
    const result = checkOpeningHook(text);
    expect(result.passed).toBe(true);
  });
});

describe("checkParagraphStructure", () => {
  it("fails on single-paragraph text", () => {
    const text = "这是一段很长的文字没有分段。".repeat(20);
    const result = checkParagraphStructure(text);
    expect(result.passed).toBe(false);
  });

  it("passes on well-structured text", () => {
    const paragraphs = Array.from({ length: 6 }, (_, i) => `第${i + 1}段内容，包含足够的信息。`.repeat(3));
    const text = paragraphs.join("\n\n");
    const result = checkParagraphStructure(text);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});

describe("runQualityCheck (integration)", () => {
  it("runs full check with direction", () => {
    const title = "OpenAI 发布 GPT-6：多模态推理能力提升 3 倍";
    const content = Array.from({ length: 10 }, (_, i) =>
      `第${i + 1}段：OpenAI 在 2026 年发布了 GPT-6 模型。性能指标提升了 ${(i + 1) * 10}%，API 调用成本降低了 ${(i + 1) * 5}%。这对行业的影响是深远的。`
    ).join("\n\n");
    const result = runQualityCheck(title, content, "AI快讯");
    expect(result.score).toBeGreaterThan(0);
    expect(result.checks.length).toBeGreaterThanOrEqual(4);
    expect(result.checks.some((c) => c.name === "字数范围")).toBe(true);
    expect(result.checks.some((c) => c.name === "禁用词检查")).toBe(true);
  });

  it("runs without direction config gracefully", () => {
    const result = runQualityCheck("测试标题：一个有结构的标题", "测试内容。\n\n第二段。\n\n第三段。\n\n第四段。", "不存在的方向");
    // Should still run universal checks
    expect(result.checks.length).toBeGreaterThanOrEqual(4);
    expect(result.checks.some((c) => c.name === "信息密度")).toBe(true);
  });
});
