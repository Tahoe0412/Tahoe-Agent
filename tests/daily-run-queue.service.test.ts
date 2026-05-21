import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma before importing the service — use vi.hoisted so the variable
// is available when the vi.mock factory (which is hoisted) executes.
const mockPrisma = vi.hoisted(() => ({
  dailyRunItem: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";

describe("DailyRunQueueService", () => {
  let service: DailyRunQueueService;

  beforeEach(() => {
    service = new DailyRunQueueService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createItem", () => {
    it("creates a daily run item with TOPIC_SELECTED status", async () => {
      const mockItem = {
        id: "test-id",
        run_date: new Date("2026-05-21"),
        account_direction: "AI快讯",
        topic: "测试话题",
        status: "TOPIC_SELECTED",
      };
      mockPrisma.dailyRunItem.create.mockResolvedValue(mockItem);

      const result = await service.createItem({
        runDate: new Date("2026-05-21"),
        accountDirection: "AI快讯",
        topic: "测试话题",
      });

      expect(mockPrisma.dailyRunItem.create).toHaveBeenCalledWith({
        data: {
          run_date: new Date("2026-05-21"),
          account_direction: "AI快讯",
          topic: "测试话题",
          topic_source: undefined,
          metadata: undefined,
          status: "TOPIC_SELECTED",
        },
      });
      expect(result).toEqual(mockItem);
    });

    it("passes topicSource and metadata as JSON", async () => {
      mockPrisma.dailyRunItem.create.mockResolvedValue({ id: "test-id" });

      await service.createItem({
        runDate: new Date("2026-05-21"),
        accountDirection: "全球股市",
        topic: "美股大涨",
        topicSource: { provider: "serper", query: "美股" },
        metadata: { priority: "high" },
      });

      expect(mockPrisma.dailyRunItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topic_source: { provider: "serper", query: "美股" },
          metadata: { priority: "high" },
        }),
      });
    });
  });

  describe("getRunItems", () => {
    it("queries items for a specific date with project include", async () => {
      mockPrisma.dailyRunItem.findMany.mockResolvedValue([]);

      const date = new Date("2026-05-21");
      await service.getRunItems(date);

      expect(mockPrisma.dailyRunItem.findMany).toHaveBeenCalledWith({
        where: { run_date: date },
        include: {
          project: {
            select: { id: true, title: true, status: true, metadata: true },
          },
        },
        orderBy: [{ account_direction: "asc" }, { created_at: "desc" }],
      });
    });
  });

  describe("getRunHistory", () => {
    it("queries items from the last N days", async () => {
      mockPrisma.dailyRunItem.findMany.mockResolvedValue([]);

      await service.getRunHistory(7);

      expect(mockPrisma.dailyRunItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { run_date: { gte: expect.any(Date) } },
          orderBy: [{ run_date: "desc" }, { account_direction: "asc" }, { created_at: "desc" }],
        }),
      );
    });

    it("defaults to 30 days", async () => {
      mockPrisma.dailyRunItem.findMany.mockResolvedValue([]);

      await service.getRunHistory();

      expect(mockPrisma.dailyRunItem.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateStatus", () => {
    it("updates status and project_id", async () => {
      mockPrisma.dailyRunItem.update.mockResolvedValue({ id: "item-1", status: "DRAFTING" });

      await service.updateStatus("item-1", "DRAFTING", { projectId: "proj-1" });

      expect(mockPrisma.dailyRunItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: {
          status: "DRAFTING",
          project_id: "proj-1",
          error_message: undefined,
          quality_score: undefined,
          metadata: undefined,
          retry_count: undefined,
        },
      });
    });

    it("increments retry_count and sets error_message on FAILED", async () => {
      mockPrisma.dailyRunItem.update.mockResolvedValue({ id: "item-1", status: "FAILED" });

      await service.updateStatus("item-1", "FAILED", { errorMessage: "生成失败" });

      expect(mockPrisma.dailyRunItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: expect.objectContaining({
          status: "FAILED",
          error_message: "生成失败",
          retry_count: { increment: 1 },
        }),
      });
    });
  });

  describe("markBestPick", () => {
    it("unmarks existing best pick then marks the given item", async () => {
      const existingItem = {
        id: "item-1",
        run_date: new Date("2026-05-21"),
        account_direction: "AI快讯",
      };
      mockPrisma.dailyRunItem.findUniqueOrThrow.mockResolvedValue(existingItem);
      mockPrisma.dailyRunItem.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.dailyRunItem.update.mockResolvedValue({ ...existingItem, is_best_pick: true });

      await service.markBestPick("item-1");

      expect(mockPrisma.dailyRunItem.updateMany).toHaveBeenCalledWith({
        where: {
          run_date: existingItem.run_date,
          account_direction: "AI快讯",
          is_best_pick: true,
        },
        data: { is_best_pick: false },
      });
      expect(mockPrisma.dailyRunItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { is_best_pick: true },
      });
    });
  });

  describe("retryItem", () => {
    it("resets status to TOPIC_SELECTED and clears error", async () => {
      mockPrisma.dailyRunItem.update.mockResolvedValue({ id: "item-1", status: "TOPIC_SELECTED" });

      await service.retryItem("item-1");

      expect(mockPrisma.dailyRunItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: {
          status: "TOPIC_SELECTED",
          error_message: null,
        },
      });
    });
  });

  describe("markPublished", () => {
    it("sets status to PUBLISHED", async () => {
      mockPrisma.dailyRunItem.update.mockResolvedValue({ id: "item-1", status: "PUBLISHED" });

      await service.markPublished("item-1");

      expect(mockPrisma.dailyRunItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { status: "PUBLISHED" },
      });
    });
  });

  describe("getItem", () => {
    it("finds item by ID with project include", async () => {
      mockPrisma.dailyRunItem.findUnique.mockResolvedValue({ id: "item-1" });

      await service.getItem("item-1");

      expect(mockPrisma.dailyRunItem.findUnique).toHaveBeenCalledWith({
        where: { id: "item-1" },
        include: {
          project: {
            select: { id: true, title: true, status: true, metadata: true },
          },
        },
      });
    });

    it("returns null for non-existent item", async () => {
      mockPrisma.dailyRunItem.findUnique.mockResolvedValue(null);

      const result = await service.getItem("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getDailyStats", () => {
    it("aggregates stats by status and direction", async () => {
      mockPrisma.dailyRunItem.findMany.mockResolvedValue([
        { status: "TOPIC_SELECTED", account_direction: "AI快讯", is_best_pick: false, quality_score: null },
        { status: "DRAFTING", account_direction: "AI快讯", is_best_pick: true, quality_score: 0.8 },
        { status: "TOPIC_SELECTED", account_direction: "全球股市", is_best_pick: false, quality_score: null },
        { status: "PUBLISHED", account_direction: "全球股市", is_best_pick: true, quality_score: 0.9 },
      ]);

      const date = new Date("2026-05-21");
      const stats = await service.getDailyStats(date);

      expect(stats.total).toBe(4);
      expect(stats.byStatus).toEqual({
        TOPIC_SELECTED: 2,
        DRAFTING: 1,
        PUBLISHED: 1,
      });
      expect(stats.byDirection["AI快讯"].total).toBe(2);
      expect(stats.byDirection["AI快讯"].bestPick).toBe(true);
      expect(stats.byDirection["全球股市"].total).toBe(2);
      expect(stats.byDirection["全球股市"].bestPick).toBe(true);
    });

    it("returns empty stats for a day with no items", async () => {
      mockPrisma.dailyRunItem.findMany.mockResolvedValue([]);

      const stats = await service.getDailyStats(new Date("2026-01-01"));

      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.byDirection).toEqual({});
    });
  });
});
