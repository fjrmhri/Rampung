import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  copied: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  copiedLabel: string;
  variant?: "secondary" | "primary";
}

const variants = {
  secondary: {
    idle: "border border-input bg-card font-semibold hover:bg-muted",
    pad: "px-3.5",
  },
  primary: {
    idle: "bg-primary font-bold text-primary-foreground hover:bg-primary-hover",
    pad: "px-3",
  },
};

/**
 * Tombol salin 40px. Elemen tombol tetap sama saat berganti ke state
 * tersalin (positive + Check) agar fokus keyboard tidak hilang.
 */
export function CopyButton({
  copied,
  onClick,
  icon,
  label,
  copiedLabel,
  variant = "secondary",
}: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variants[variant].pad,
        copied
          ? "border border-positive-border bg-positive-soft font-bold text-positive"
          : variants[variant].idle,
      )}
    >
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : icon}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
