import { describe, expect, it } from "vitest";
import { resolveWorkflowResearchMockMode } from "@/services/workflow.service";

describe("resolveWorkflowResearchMockMode", () => {
  it("defaults to live-capable mode when project metadata is absent", () => {
    expect(resolveWorkflowResearchMockMode(undefined)).toBe(false);
    expect(resolveWorkflowResearchMockMode(null)).toBe(false);
    expect(resolveWorkflowResearchMockMode({})).toBe(false);
  });

  it("preserves explicit project mock settings", () => {
    expect(resolveWorkflowResearchMockMode({ mock_mode: true })).toBe(true);
    expect(resolveWorkflowResearchMockMode({ mock_mode: false })).toBe(false);
  });
});
