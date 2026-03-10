import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--surface-strong)] text-[var(--text-inverse)] hover:bg-[var(--surface-strong-2)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        secondary:
          "bg-[var(--surface-solid)] text-[var(--text-1)] ring-1 ring-[var(--border)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        ghost:
          "text-[var(--text-2)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
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

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
