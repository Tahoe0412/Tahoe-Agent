import { describe, expect, it } from "vitest";
import { buildAudiencePanelPrompt, normalizeAudiencePanelReview } from "@/lib/copy-review-panel";

describe("copy review panel", () => {
  it("uses simple fixed names for the four audience reviewers", () => {
    const review = normalizeAudiencePanelReview({
      averageScore: 78,
      styleFitScore: 76,
      publishReadiness: "REVISION_FIRST",
      calibrationSummary: "需要补强第一屏。",
      overallVerdict: "有信息，但还不够像可转发文章。",
      reviewers: [
        { id: "feed_scanner", label: "快刷读者", persona: "", score: 70, likes: ["有主题"], concerns: ["第一屏弱"], nextAction: "先改开头。", verdict: "会划走。" },
        { id: "skeptical_reader", label: "怀疑者", persona: "", score: 72, likes: ["有来源"], concerns: ["证据少"], nextAction: "补来源归因。", verdict: "暂时不信。" },
        { id: "editor", label: "编辑", persona: "", score: 80, likes: ["结构完整"], concerns: ["转场平"], nextAction: "删掉套话。", verdict: "可改。" },
        { id: "sharer", label: "转发者", persona: "", score: 74, likes: ["有观点"], concerns: ["金句少"], nextAction: "加一句可转述判断。", verdict: "还不会转。" },
      ],
    });

    expect(review?.reviewers.map((item) => item.label)).toEqual(["小夏", "老周", "阿岚", "小满"]);
  });

  it("instructs the model to output those names", () => {
    const prompt = buildAudiencePanelPrompt({
      topic: "OpenAI Agent",
      draftTypeLabel: "主稿 / 长文",
      bodyCopy: "这是一篇测试正文。",
    });

    expect(prompt.userPrompt).toContain("小夏");
    expect(prompt.userPrompt).toContain("老周");
    expect(prompt.userPrompt).toContain("阿岚");
    expect(prompt.userPrompt).toContain("小满");
  });
});
