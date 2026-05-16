import type { ReactNode } from "react";

const toneStyles: Record<string, string> = {
  default: "theme-chip",
  danger: "theme-chip-danger",
  success: "theme-chip-ok",
  warning: "theme-chip-warn",
};

/**
 * A small pill/chip for inline status labels.
 * Used across Script Lab, Scene Planner, and other workbench components.
 */
export function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const className = toneStyles[tone] ?? toneStyles.default;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}
