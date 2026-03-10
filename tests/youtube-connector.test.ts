import { describe, expect, it } from "vitest";
import { normalizeTitle, parseYouTubeDurationToSeconds } from "@/services/platform-connectors/youtube";

describe("youtube connector helpers", () => {
  it("parses ISO-8601 durations into seconds", () => {
    expect(parseYouTubeDurationToSeconds("PT59S")).toBe(59);
    expect(parseYouTubeDurationToSeconds("PT2M5S")).toBe(125);
    expect(parseYouTubeDurationToSeconds("PT1H2M3S")).toBe(3723);
    expect(parseYouTubeDurationToSeconds(undefined)).toBe(0);
  });

  it("normalizes multilingual titles into stable topic keys", () => {
    expect(normalizeTitle("AI 广告工作流 / 2026!")).toBe("ai_广告工作流_2026");
    expect(normalizeTitle("  Result First Hook  ")).toBe("result_first_hook");
  });
});
