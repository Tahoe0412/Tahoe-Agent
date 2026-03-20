"use client";

import { useState, useCallback } from "react";
import type { ContentLine, OutputType } from "@/lib/content-line";

interface GenerateScriptResult {
  projectId: string;
  scriptId: string;
  title: string;
}

interface SelectedNewsItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

interface GenerateOptions {
  contentLine?: ContentLine;
  outputType?: OutputType;
}

export function useGenerateScript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateScriptResult | null>(null);

  const generate = useCallback(
    async (searchQuery: string, newsItems: SelectedNewsItem[], options?: GenerateOptions) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/scripts/generate-from-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery,
            newsItems,
            contentLine: options?.contentLine,
            outputType: options?.outputType,
          }),
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || payload.message || "生成脚本失败");
        }

        const data = payload.data as GenerateScriptResult;
        setResult(data);

        // Fire-and-forget: trigger async scene split in background
        fetch(`/api/scripts/${data.scriptId}/split-scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.warn("[use-generate-script] Background split-scenes failed:", err);
        });

        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "生成脚本失败";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generate, loading, error, result };
}

