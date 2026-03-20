"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest, explainClientError } from "@/lib/client-api";

export function GenerateStoryboardButton({
  projectId,
  locale = "zh",
  label,
  variant = "primary",
}: {
  projectId: string;
  locale?: "zh" | "en";
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/storyboards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      router.refresh();
    } catch (requestError) {
      setError(explainClientError(requestError, locale).title);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant={variant} onClick={() => void handleGenerate()} disabled={pending}>
        {pending
          ? locale === "en"
            ? "Generating storyboard..."
            : "正在生成分镜..."
          : label ?? (locale === "en" ? "Generate Storyboard" : "直接生成分镜")}
      </Button>
      {error ? <div className="max-w-sm text-center text-xs leading-6 text-[var(--danger-text)]">{error}</div> : null}
    </div>
  );
}
