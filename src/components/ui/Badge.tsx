import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "primary" | "accent" | "positive" | "version";
export type BadgeShape = "tag" | "pill";

const variants: Record<BadgeVariant, string> = {
  primary: "bg-primary-soft font-bold text-primary-hover",
  accent: "bg-accent font-bold text-accent-foreground",
  positive: "bg-positive-soft font-bold text-positive",
  version: "bg-muted font-mono font-normal text-muted-foreground",
};

const shapes: Record<BadgeShape, string> = {
  tag: "gap-1 rounded-xs py-0.5",
  pill: "gap-1.5 rounded-full px-2.5 py-1",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
}

/**
 * Badge 12px. `tag` (radius 6px): jenis split, Pemilik, versi.
 * `pill`: Admin, Lunas.
 */
export function Badge({
  variant = "primary",
  shape = "tag",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center text-xs whitespace-nowrap",
        variants[variant],
        shapes[shape],
        shape === "tag" && (variant === "version" ? "px-1.5" : "px-2"),
        className,
      )}
      {...props}
    />
  );
}

interface LiveBadgeProps {
  children: string;
}

/** Pill "Real-time" dengan titik 7px yang berdenyut. */
export function LiveBadge({ children }: LiveBadgeProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-[7px] rounded-full bg-positive-soft px-2.5 py-1 text-xs font-bold whitespace-nowrap text-live-foreground">
      <span
        aria-hidden="true"
        className="size-[7px] animate-pulse rounded-full bg-live"
      />
      {children}
    </span>
  );
}
