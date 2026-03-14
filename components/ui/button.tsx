import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium shadow-[0_10px_24px_rgba(87,58,33,0.08)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[var(--text-inverse)] hover:-translate-y-0.5 hover:brightness-[1.03] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        secondary:
          "bg-[color:color-mix(in_srgb,var(--surface-solid)_88%,transparent)] text-[var(--text-1)] ring-1 ring-[var(--border)] hover:-translate-y-0.5 hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
        ghost:
          "text-[var(--text-2)] shadow-none hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--surface-solid)]",
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
