import { describe, expect, it } from "vitest";
import { buildAssetRuleOutput } from "../services/asset-dependency-analyzer.service";

describe("asset dependency analyzer rules", () => {
  it("marks human speaking scene as needing character and voice assets", () => {
    const result = buildAssetRuleOutput({
      rewritten_for_ai: "人物在工作室口播，展示产品界面并给出结论。",
      continuity_group: "intro_arc",
      classification: {
        human_type: "H1",
        lip_sync_type: "L1",
        asset_dependency_type: "S3",
        production_class: "B",
      },
      uploaded_asset_types: [],
    });

    expect(result.needs_character_base).toBe(true);
    expect(result.needs_voice).toBe(true);
    expect(result.is_asset_ready).toBe(false);
  });

  it("returns ready when all required assets are already uploaded", () => {
    const result = buildAssetRuleOutput({
      rewritten_for_ai: "录屏展示 dashboard 操作和旁白说明。",
      continuity_group: "demo_arc",
      classification: {
        human_type: "H0",
        lip_sync_type: "L1",
        asset_dependency_type: "S2",
        production_class: "D",
      },
      uploaded_asset_types: ["VOICE"],
    });

    expect(result.needs_scene_base).toBe(false);
    expect(result.needs_voice).toBe(true);
    expect(result.is_asset_ready).toBe(true);
  });
});
