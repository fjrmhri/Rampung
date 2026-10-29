import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconTileTone = "primary" | "positive" | "destructive" | "accent";
export type IconTileSize = "sm" | "md" | "lg" | "xl";

const tones: Record<IconTileTone, string> = {
  primary: "bg-primary-soft text-primary",
  positive: "bg-positive-soft text-positive",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

// Kotak 40 (dialog), 44 (header form), 52 (kosong), 56 (verifikasi).
const sizes: Record<IconTileSize, { box: string; icon: string }> = {
  sm: { box: "size-10 rounded-lg", icon: "size-5" },
  md: { box: "size-11 rounded-lg", icon: "size-5" },
  lg: { box: "size-[52px] rounded-[14px]", icon: "size-6" },
  xl: { box: "size-14 rounded-xl", icon: "size-6" },
};

interface IconTileProps {
  icon: LucideIcon;
  tone?: IconTileTone;
  size?: IconTileSize;
  className?: string;
}

export function IconTile({
  icon: Icon,
  tone = "primary",
  size = "sm",
  className,
}: IconTileProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center",
        sizes[size].box,
        tones[tone],
        className,
      )}
    >
      <Icon className={sizes[size].icon} />
    </div>
  );
}
