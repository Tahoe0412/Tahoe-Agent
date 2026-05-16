import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium shadow-none transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-strong)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        secondary:
          "bg-[var(--surface-solid)] text-[var(--accent)] ring-1 ring-[var(--border)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        ghost:
          "text-[var(--accent)] shadow-none hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, type, ...props }: ButtonProps) {
  return <button type={type ?? "button"} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
