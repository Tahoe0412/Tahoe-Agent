import { describe, expect, it } from "vitest";
import { classifyByRules } from "../services/scene-classification.service";

describe("scene classification rules", () => {
  it("classifies talking-head speech as class A", () => {
    const result = classifyByRules("人物正面口播，静止近景，说出核心观点和行动号召。");

    expect(result.human_type).toBe("H1");
    expect(result.motion_type).toBe("M0");
    expect(result.lip_sync_type).toBe("L1");
    expect(result.production_class).toBe("A");
  });

  it("classifies UI demo scenes as class D", () => {
    const result = classifyByRules("录屏展示 dashboard 和 cursor 操作，强调界面流程与数据截图。");

    expect(result.asset_dependency_type).toBe("S2");
    expect(result.production_class).toBe("D");
    expect(result.risk_flags).toContain("ui_readability");
  });

  it("classifies text-only cards as class T", () => {
    const result = classifyByRules("headline title card with bullet text and subtitle only.");

    expect(result.human_type).toBe("H0");
    expect(result.production_class).toBe("T");
  });
});
