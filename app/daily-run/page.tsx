import type { Metadata } from "next";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";
import { DailyRunQueueManager } from "@/components/daily-run/daily-run-queue-manager";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "今日选题 - Daily Run | Tahoe Workspace",
  description: "三个账号各定一题，再生成三篇可发布图文。",
};

export default async function DailyRunPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const service = new DailyRunQueueService();
  const [items, stats] = await Promise.all([
    service.getRunItems(today),
    service.getDailyStats(today),
  ]);

  const serializedItems = items.map((item) => ({
    ...item,
    run_date: item.run_date.toISOString(),
    created_at: item.created_at.toISOString(),
  }));

  const serializedStats = {
    total: stats.total,
    byStatus: stats.byStatus,
    byDirection: stats.byDirection,
  };

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={isEn ? "Daily Desk" : "日更主线"}
          title={isEn ? "Today’s Topics" : "今日选题"}
          description={
            isEn
              ? "Pick one topic for each account, then generate three publishable article packages."
              : "三个账号各定一题，再生成三篇可发布图文。"
          }
          locale={locale}
        />

        <div className="border-t border-[var(--border)] pt-6">
          <DailyRunQueueManager
            initialItems={serializedItems}
            initialStats={serializedStats}
            locale={locale}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
