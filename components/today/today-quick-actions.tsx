import {
  Zap,
  FileText,
  Clapperboard,
  ImageIcon,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicRankingItem } from "@/types/trend-discovery";

interface TodayQuickActionsProps {
  selectedTopic: TopicRankingItem;
  locale: "zh" | "en";
  onAction: (
    topicLabel: string,
    actionType: "mars_script" | "mars_package" | "marketing_copy" | "marketing_storyboard",
  ) => void;
}

export function TodayQuickActions({
  selectedTopic,
  locale,
  onAction,
}: TodayQuickActionsProps) {
  const t = locale === "zh";

  return (
    <section className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-6">
      <div className="mb-4 flex items-center gap-3">
        <Zap className="size-5 text-[var(--accent)]" />
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)]">
            {t ? "快速产出" : "Quick Actions"}
          </h3>
          <p className="text-sm text-[var(--text-3)]">
            {t
              ? `选题：${selectedTopic.label} — 直接选择要做的产物`
              : `Topic: ${selectedTopic.label} — choose the artifact you want next`}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            type: "mars_script" as const,
            icon: Clapperboard,
            label: t ? "科技脚本" : "Science Script",
            desc: t
              ? "进入火星公民脚本主线，先拿到第一版叙事脚本"
              : "Start the Mars Citizen line with a first narrative script",
            color: "from-[var(--sage)]/12 to-[var(--sage)]/4",
            textColor: "text-[var(--sage)]",
          },
          {
            type: "mars_package" as const,
            icon: Zap,
            label: t ? "发布包装" : "Publish Package",
            desc: t
              ? "直接去做视频标题和发布文案"
              : "Jump straight to titles and publish copy",
            color: "from-[var(--accent)]/12 to-[var(--accent)]/4",
            textColor: "text-[var(--accent)]",
          },
          {
            type: "marketing_copy" as const,
            icon: FileText,
            label: t ? "营销文案" : "Marketing Copy",
            desc: t
              ? "进入 Marketing 主线，先生成平台文案"
              : "Start the Marketing line with platform copy",
            color: "from-[var(--terracotta)]/12 to-[var(--terracotta)]/4",
            textColor: "text-[var(--terracotta)]",
          },
          {
            type: "marketing_storyboard" as const,
            icon: ImageIcon,
            label: t ? "广告分镜" : "Ad Storyboard",
            desc: t
              ? "直接走广告分镜与视觉制作方向"
              : "Go directly into ad storyboard and visual planning",
            color: "from-[var(--accent)]/12 to-[var(--accent)]/4",
            textColor: "text-[var(--accent)]",
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onAction(selectedTopic.label, item.type)}
            className="group flex flex-col items-start rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md"
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br",
                item.color
              )}
            >
              <item.icon className={cn("size-5", item.textColor)} />
            </div>
            <div className="mt-3 text-sm font-semibold text-[var(--text-1)]">
              {item.label}
            </div>
            <div className="mt-1 text-xs leading-5 text-[var(--text-3)]">
              {item.desc}
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
              {t ? "开始" : "Start"} <ArrowRight className="size-3" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
