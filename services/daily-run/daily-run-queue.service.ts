import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DailyRunItemStatus } from "@prisma/client";

export type CreateDailyRunItemInput = {
  runDate: Date;
  accountDirection: string; // AI快讯 / 全球股市 / 消费时尚
  topic: string;
  topicSource?: unknown;
  metadata?: unknown;
};

export type DailyRunItemWithProject = Awaited<ReturnType<typeof prisma.dailyRunItem.findFirst>> & {
  project?: { id: string; title: string; status: string; metadata: unknown } | null;
};

export class DailyRunQueueService {
  /**
   * Create a new queue item for a daily run topic selection.
   * Multiple items per direction per day are allowed (user picks the best one later).
   */
  async createItem(input: CreateDailyRunItemInput) {
    return prisma.dailyRunItem.create({
      data: {
        run_date: input.runDate,
        account_direction: input.accountDirection,
        topic: input.topic,
        topic_source: input.topicSource as Prisma.InputJsonValue,
        metadata: input.metadata as Prisma.InputJsonValue,
        status: "TOPIC_SELECTED",
      },
    });
  }

  /** Get all items for a specific run date, with project details */
  async getRunItems(runDate: Date) {
    return prisma.dailyRunItem.findMany({
      where: { run_date: runDate },
      include: {
        project: {
          select: { id: true, title: true, status: true, metadata: true },
        },
      },
      orderBy: [{ account_direction: "asc" }, { created_at: "desc" }],
    });
  }

  /** Get run history for the last N days */
  async getRunHistory(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    return prisma.dailyRunItem.findMany({
      where: { run_date: { gte: since } },
      include: {
        project: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: [{ run_date: "desc" }, { account_direction: "asc" }, { created_at: "desc" }],
    });
  }

  /** Update item status (state machine transitions) */
  async updateStatus(
    itemId: string,
    status: DailyRunItemStatus,
    extra?: { projectId?: string; errorMessage?: string; qualityScore?: number; metadata?: unknown },
  ) {
    return prisma.dailyRunItem.update({
      where: { id: itemId },
      data: {
        status,
        project_id: extra?.projectId,
        error_message: status === "FAILED" ? extra?.errorMessage : undefined,
        quality_score: extra?.qualityScore,
        metadata: extra?.metadata as Prisma.InputJsonValue,
        retry_count: status === "FAILED" ? { increment: 1 } : undefined,
      },
    });
  }

  /** Mark an item as the best pick for its direction on that day */
  async markBestPick(itemId: string) {
    const item = await prisma.dailyRunItem.findUniqueOrThrow({ where: { id: itemId } });

    // Unmark any existing best pick for the same direction + date
    await prisma.dailyRunItem.updateMany({
      where: {
        run_date: item.run_date,
        account_direction: item.account_direction,
        is_best_pick: true,
      },
      data: { is_best_pick: false },
    });

    return prisma.dailyRunItem.update({
      where: { id: itemId },
      data: { is_best_pick: true },
    });
  }

  /** Retry a failed item: reset status to TOPIC_SELECTED */
  async retryItem(itemId: string) {
    return prisma.dailyRunItem.update({
      where: { id: itemId },
      data: {
        status: "TOPIC_SELECTED",
        error_message: null,
      },
    });
  }

  /** Mark an item as published */
  async markPublished(itemId: string) {
    return prisma.dailyRunItem.update({
      where: { id: itemId },
      data: { status: "PUBLISHED" },
    });
  }

  /** Get a single item by ID */
  async getItem(itemId: string) {
    return prisma.dailyRunItem.findUnique({
      where: { id: itemId },
      include: {
        project: {
          select: { id: true, title: true, status: true, metadata: true },
        },
      },
    });
  }

  /** Get daily production stats */
  async getDailyStats(runDate: Date) {
    const items = await prisma.dailyRunItem.findMany({
      where: { run_date: runDate },
      select: { status: true, account_direction: true, is_best_pick: true, quality_score: true },
    });

    const total = items.length;
    const byStatus: Record<string, number> = {};
    const byDirection: Record<string, { total: number; bestPick: boolean; avgQuality: number | null }> = {};

    for (const item of items) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;

      if (!byDirection[item.account_direction]) {
        byDirection[item.account_direction] = { total: 0, bestPick: false, avgQuality: null };
      }
      byDirection[item.account_direction].total++;
      if (item.is_best_pick) byDirection[item.account_direction].bestPick = true;
    }

    return { runDate, total, byStatus, byDirection };
  }
}
