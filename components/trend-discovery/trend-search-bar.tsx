"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { SupportedPlatform } from "@/types/platform-data";

const PLATFORM_OPTIONS: { value: SupportedPlatform; label: string }[] = [
  { value: "YOUTUBE", label: "YouTube" },
  { value: "X", label: "X (Twitter)" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "XHS", label: "小红书" },
  { value: "DOUYIN", label: "抖音" },
];

interface TrendSearchBarProps {
  onSearch: (query: string, platforms: SupportedPlatform[]) => void;
  loading?: boolean;
  defaultQuery?: string;
  defaultPlatforms?: SupportedPlatform[];
}

export function TrendSearchBar({
  onSearch,
  loading = false,
  defaultQuery = "",
  defaultPlatforms = ["YOUTUBE", "X"],
}: TrendSearchBarProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [platforms, setPlatforms] = useState<SupportedPlatform[]>(defaultPlatforms);

  function togglePlatform(platform: SupportedPlatform) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || platforms.length === 0) return;
    onSearch(query.trim(), platforms);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词搜索热点话题，例如：SpaceX 星舰、AI 视频生成..."
          disabled={loading}
          className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] pl-11 pr-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60"
        />
      </div>

      {/* Platform toggles + submit */}
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORM_OPTIONS.map((opt) => {
          const active = platforms.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => togglePlatform(opt.value)}
              disabled={loading}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        <button
          type="submit"
          disabled={loading || !query.trim() || platforms.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(75,143,106,0.16)] transition hover:-translate-y-0.5 hover:brightness-[1.03] disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              搜索中...
            </>
          ) : (
            "搜索热点"
          )}
        </button>
      </div>
    </form>
  );
}
