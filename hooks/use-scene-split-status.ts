"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SceneSplitStatus {
  scriptId: string;
  scene_split_status: "pending" | "splitting" | "done" | "failed" | "unknown";
  scene_count: number;
  scene_split_error: string | null;
  scene_split_at: string | null;
}

/**
 * Polls GET /api/scripts/:id/status every `intervalMs` until
 * scene_split_status is "done" or "failed", or max attempts reached.
 *
 * Returns the latest status + a manual refresh trigger.
 */
export function useSceneSplitStatus(
  scriptId: string | null,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    enabled?: boolean;
  },
) {
  const {
    intervalMs = 5000,
    maxAttempts = 60,
    enabled = true,
  } = options ?? {};

  const [status, setStatus] = useState<SceneSplitStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const attemptRef = useRef(0);

  const fetchStatus = useCallback(async () => {
    if (!scriptId) return null;
    try {
      const res = await fetch(`/api/scripts/${scriptId}/status`);
      if (!res.ok) return null;
      const data = (await res.json()) as SceneSplitStatus;
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [scriptId]);

  useEffect(() => {
    if (!scriptId || !enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    attemptRef.current = 0;

    const poll = async () => {
      if (cancelled) return;
      attemptRef.current += 1;

      const data = await fetchStatus();

      if (
        cancelled ||
        !data ||
        data.scene_split_status === "done" ||
        data.scene_split_status === "failed" ||
        attemptRef.current >= maxAttempts
      ) {
        if (timer) clearInterval(timer);
        setIsPolling(false);
        return;
      }
    };

    setIsPolling(true);
    // Initial fetch
    poll();
    // Start polling
    timer = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      setIsPolling(false);
    };
  }, [scriptId, enabled, intervalMs, maxAttempts, fetchStatus]);

  return {
    status,
    isPolling,
    refresh: fetchStatus,
  };
}
