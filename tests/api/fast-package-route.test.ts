import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  generateFastPackage: vi.fn(),
}));

vi.mock("@/services/daily-run/owned-media-package.service", () => ({
  OwnedMediaPackageService: vi.fn(() => ({
    generateFastPackage: mocks.generateFastPackage,
  })),
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("daily-run fast-package route", () => {
  it("passes owned-media editorial direction to the service", async () => {
    mocks.generateFastPackage.mockResolvedValue({
      projectId: "project_1",
      scriptId: "script_1",
      completed: 4,
      failed: 0,
      readiness: {
        status: "READY",
        score: 88,
        message: "ok",
      },
      nextHref: "/script-lab?projectId=project_1",
      steps: [],
    });
    const { POST } = await import("@/app/api/daily-run/fast-package/route");

    const response = await POST(new Request("http://localhost/api/daily-run/fast-package", {
      method: "POST",
      body: JSON.stringify({
        topic: "OpenAI 新模型",
        contentLine: "OWNED_MEDIA",
        editorialDirection: "AI快讯",
        platforms: ["TOUTIAO"],
        deferPackaging: true,
        materials: [
          {
            id: "news_1",
            title: "OpenAI 发布新模型",
            url: "https://example.com/news",
            snippet: "模型能力和价格变化。",
            source: "Example",
            source_type: "news",
            published_at: "2026-04-29T04:00:00.000Z",
          },
        ],
      }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.generateFastPackage).toHaveBeenCalledWith(expect.objectContaining({
      contentLine: "OWNED_MEDIA",
      editorialDirection: "AI快讯",
      deferPackaging: true,
    }));
  });

  it("rejects empty materials", async () => {
    const { POST } = await import("@/app/api/daily-run/fast-package/route");

    const response = await POST(new Request("http://localhost/api/daily-run/fast-package", {
      method: "POST",
      body: JSON.stringify({
        topic: "OpenAI 新模型",
        contentLine: "OWNED_MEDIA",
        editorialDirection: "AI快讯",
        materials: [],
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.generateFastPackage).not.toHaveBeenCalled();
  });

  it("classifies downstream service failures as server errors", async () => {
    mocks.generateFastPackage.mockRejectedValue(new Error("Qwen route unavailable"));
    const { POST } = await import("@/app/api/daily-run/fast-package/route");

    const response = await POST(new Request("http://localhost/api/daily-run/fast-package", {
      method: "POST",
      body: JSON.stringify({
        topic: "OpenAI 新模型",
        contentLine: "OWNED_MEDIA",
        editorialDirection: "AI快讯",
        materials: [
          {
            id: "news_1",
            title: "OpenAI 发布新模型",
            url: "https://example.com/news",
            snippet: "模型能力和价格变化。",
            source: "Example",
            source_type: "news",
            published_at: "2026-04-29T04:00:00.000Z",
          },
        ],
      }),
    }));

    expect(response.status).toBe(500);
  });
});
