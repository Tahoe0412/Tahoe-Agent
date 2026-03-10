"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn("flex w-full items-center justify-between gap-3 text-left", summaryClassName)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition", open ? "rotate-180" : "")} />
      </button>
      {open ? <div className={contentClassName}>{children}</div> : null}
    </div>
  );
}
