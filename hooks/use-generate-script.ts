"use client";

import { useState, useCallback } from "react";

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

export function useGenerateScript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateScriptResult | null>(null);

  const generate = useCallback(
    async (searchQuery: string, newsItems: SelectedNewsItem[]) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/scripts/generate-from-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchQuery, newsItems }),
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || payload.message || "生成脚本失败");
        }

        const data = payload.data as GenerateScriptResult;
        setResult(data);
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
