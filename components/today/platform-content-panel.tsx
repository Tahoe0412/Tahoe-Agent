"use client";

import { Check, Play, MessageSquare, Eye, Heart, Repeat2, Users, Clock, BookOpen, Music2 } from "lucide-react";
import type { ContentItem, Creator, PlatformCollectResult, SupportedPlatform } from "@/types/platform-data";
import { cn } from "@/lib/utils";

/* ─── Formatting helpers ─── */

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function extractDescription(item: ContentItem): string {
  const raw = item.raw_payload as Record<string, unknown> | undefined;
  if (!raw) return "";

  if (item.platform === "YOUTUBE") {
    const video = raw.video as { snippet?: { description?: string } } | undefined;
    const desc = video?.snippet?.description ?? "";
    return desc.replace(/\s+/g, " ").trim().slice(0, 160);
  }

  if (item.platform === "X") {
    const tweet = raw.tweet as { text?: string } | undefined;
    return tweet?.text?.replace(/\s+/g, " ").trim().slice(0, 200) ?? "";
  }

  // Serper-based connectors (XHS, DOUYIN, TIKTOK) store snippet in raw_payload
  if (typeof raw.snippet === "string" && raw.snippet.length > 0) {
    return raw.snippet.replace(/\s+/g, " ").trim().slice(0, 200);
  }

  return "";
}

function formatDuration(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── Types ─── */

interface SelectableItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

interface PlatformContentPanelProps {
  platform: SupportedPlatform;
  result: PlatformCollectResult;
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
  locale?: "zh" | "en";
  maxItems?: number;
}

/* ─── Platform config ─── */

const PLATFORM_META: Record<SupportedPlatform, {
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  sourceType: string;
}> = {
  YOUTUBE: {
    label: "YouTube 视频",
    labelEn: "YouTube Videos",
    icon: <Play className="size-4" />,
    sourceType: "youtube_video",
  },
  X: {
    label: "X / Twitter 推文",
    labelEn: "X / Twitter Posts",
    icon: <MessageSquare className="size-4" />,
    sourceType: "x_tweet",
  },
  XHS: {
    label: "小红书笔记",
    labelEn: "Xiaohongshu Posts",
    icon: <BookOpen className="size-4" />,
    sourceType: "xhs_note",
  },
  DOUYIN: {
    label: "抖音视频",
    labelEn: "Douyin Videos",
    icon: <Music2 className="size-4" />,
    sourceType: "douyin_video",
  },
  TIKTOK: {
    label: "TikTok 视频",
    labelEn: "TikTok Videos",
    icon: <Music2 className="size-4" />,
    sourceType: "tiktok_video",
  },
};

/* ─── Component ─── */

export function PlatformContentPanel({
  platform,
  result,
  selectedIds,
  onToggle,
  locale = "zh",
  maxItems = 6,
}: PlatformContentPanelProps) {
  const t = locale === "zh";
  const meta = PLATFORM_META[platform];

  // Build creator lookup for follower counts
  const creatorMap = new Map<string, Creator>();
  for (const creator of result.creators) {
    creatorMap.set(creator.external_creator_id, creator);
  }

  const items = result.content_items.slice(0, maxItems);

  if (items.length === 0 && result.success) {
    return null; // No items to show
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            {meta.icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
            {t ? meta.label : meta.labelEn}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.creators.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-3)]">
              <Users className="size-3" />
              {result.creators.length} {t ? "创作者" : "creators"}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              result.success && result.mode === "live"
                ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                : result.mode === "mock"
                  ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                  : "bg-[var(--danger-bg)] text-[var(--danger-text)]",
            )}
          >
            {result.mode === "live" ? "live" : result.mode} · {items.length}
          </span>
        </div>
      </div>

      {/* Content list */}
      <div className="mt-3 space-y-2">
        {!result.success ? (
          <div className="text-xs leading-6 text-[var(--danger-text)]">
            {result.errors[0]?.message ?? (t ? "请求失败" : "Request failed")}
          </div>
        ) : items.length === 0 ? (
          <div className="text-xs leading-6 text-[var(--text-3)]">
            {t ? "当前没有数据。" : "No data available."}
          </div>
        ) : (
          items.map((item) => {
            const creator = item.creator_external_id
              ? creatorMap.get(item.creator_external_id)
              : undefined;
            const description = extractDescription(item);
            const selectableId = `${platform.toLowerCase()}_${item.external_content_id}`;
            const isSelected = selectedIds.has(selectableId);
            const duration = formatDuration(item.duration_seconds);

            return (
              <div
                key={item.external_content_id}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border bg-[var(--surface-solid)] px-3 py-3 transition cursor-pointer",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40",
                )}
                onClick={() =>
                  onToggle({
                    id: selectableId,
                    title: item.title,
                    url: item.url,
                    snippet: description,
                    source: creator?.display_name ?? platform,
                    source_type: meta.sourceType,
                    published_at: item.published_at,
                  })
                }
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--text-3)]/30 group-hover:border-[var(--accent)]/50",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <div className="text-sm font-medium text-[var(--text-1)] leading-snug">
                    {item.title}
                  </div>

                  {/* Description */}
                  {description && (
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-3)]">
                      {description}
                    </div>
                  )}

                  {/* Creator row */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-2)]">
                    {/* Creator name */}
                    {creator ? (
                      <span className="flex items-center gap-1 font-medium">
                        {creator.display_name}
                        {creator.follower_count ? (
                          <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">
                            <Users className="mr-0.5 inline size-2.5" />
                            {compactNumber(creator.follower_count)}
                          </span>
                        ) : null}
                      </span>
                    ) : item.creator_handle ? (
                      <span className="font-medium">{item.creator_handle}</span>
                    ) : null}
                  </div>

                  {/* Stats row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-3)]">
                    {/* Views / Impressions */}
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {compactNumber(item.view_count)}
                    </span>

                    {/* Likes */}
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {compactNumber(item.like_count)}
                    </span>

                    {/* Comments / Replies */}
                    {item.comment_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {compactNumber(item.comment_count)}
                      </span>
                    )}

                    {/* Retweets / shares */}
                    {item.share_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Repeat2 className="size-3" />
                        {compactNumber(item.share_count)}
                      </span>
                    )}

                    {/* Duration (YouTube only) */}
                    {duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {duration}
                      </span>
                    )}

                    {/* Time ago */}
                    {item.published_at && (
                      <span className="text-[var(--text-3)]">
                        {relativeTime(item.published_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* External link */}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-[10px] text-[var(--text-3)] hover:text-[var(--accent)] transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  ↗
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
