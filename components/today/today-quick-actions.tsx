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
  onAction: (topicLabel: string, actionType: "script" | "copy" | "image") => void;
}

export function TodayQuickActions({
  selectedTopic,
  locale,
  onAction,
}: TodayQuickActionsProps) {
  const t = locale === "zh";

  return (
    <section className="rounded-[24px] border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/5 to-transparent p-6">
      <div className="mb-4 flex items-center gap-3">
        <Zap className="size-5 text-[var(--accent)]" />
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)]">
            {t ? "快速产出" : "Quick Actions"}
          </h3>
          <p className="text-sm text-[var(--text-3)]">
            {t
              ? `选题：${selectedTopic.label} — 选择产出方式`
              : `Topic: ${selectedTopic.label} — choose output type`}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            type: "script" as const,
            icon: Clapperboard,
            label: t ? "生成脚本" : "Generate Script",
            desc: t
              ? "AI 拆解选题，输出可拍摄的分镜脚本"
              : "AI breaks down the topic into a shootable script",
            color: "from-blue-500/20 to-cyan-500/20",
            textColor: "text-blue-400",
          },
          {
            type: "copy" as const,
            icon: FileText,
            label: t ? "生成文案" : "Generate Copy",
            desc: t
              ? "围绕选题生成多平台推广文案"
              : "Generate multi-platform marketing copy",
            color: "from-purple-500/20 to-pink-500/20",
            textColor: "text-purple-400",
          },
          {
            type: "image" as const,
            icon: ImageIcon,
            label: t ? "AI 配图" : "AI Images",
            desc: t
              ? "根据选题自动生成封面和配图"
              : "Auto-generate cover and illustrations for the topic",
            color: "from-emerald-500/20 to-teal-500/20",
            textColor: "text-emerald-400",
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onAction(selectedTopic.label, item.type)}
            className="group flex flex-col items-start rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br",
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
