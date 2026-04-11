import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ArtifactReview } from "@/lib/output-artifact-guidance";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extract a trimmed string array from an unknown value.
 * Used across services and components to normalize AI output fields.
 */
export function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

/**
 * Safely extract a trimmed string from an unknown value.
 */
export function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Parse a raw AI output payload into a typed ArtifactReview, or null if invalid.
 */
export function normalizeArtifactReview(value: unknown): ArtifactReview | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  return {
    status: source.status === "READY" ? "READY" : "NEEDS_REVISION",
    summary: normalizeString(source.summary),
    strengths: normalizeStringList(source.strengths),
    issues: normalizeStringList(source.issues),
    nextSteps: normalizeStringList(source.nextSteps),
  };
}

/**
 * Copy text to clipboard. Throws if clipboard API is unavailable.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("当前环境不支持剪贴板复制。");
  }

  await navigator.clipboard.writeText(text);
}
