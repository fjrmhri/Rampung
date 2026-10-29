import type { ReactNode } from "react";
import {
  CircleCheck,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertVariant = "destructive" | "positive" | "info";

const variants: Record<
  AlertVariant,
  { box: string; icon: LucideIcon; role?: "alert" | "status" }
> = {
  destructive: {
    box: "border border-destructive-border bg-destructive-soft text-destructive-fg-soft",
    icon: TriangleAlert,
    role: "alert",
  },
  positive: {
    box: "bg-positive-soft font-semibold text-positive",
    icon: CircleCheck,
    role: "status",
  },
  info: {
    box: "bg-muted text-[13px] leading-[1.55] text-info-foreground",
    icon: Info,
  },
};

interface AlertProps {
  variant?: AlertVariant;
  /** `sm`: banner di dalam kartu/form. `lg`: banner halaman (radius 16px). */
  size?: AlertSize;
  title?: ReactNode;
  children: ReactNode;
  /** Tampilkan tombol X "Tutup pesan". */
  onDismiss?: () => void;
  className?: string;
}

export type AlertSize = "sm" | "lg";

const sizes: Record<AlertSize, { box: string; icon: string }> = {
  sm: { box: "gap-2.5 rounded-md px-3.5 py-3", icon: "size-4" },
  lg: { box: "gap-3 rounded-xl px-5 py-[18px] font-semibold", icon: "size-[18px]" },
};

/** Banner pesan: ikon di kiri, padding 12/14 dan radius 10px (sm). */
export function Alert({
  variant = "destructive",
  size = "sm",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const { box, icon: Icon, role } = variants[variant];
  return (
    <div
      role={role}
      className={cn(
        "flex items-start text-sm",
        sizes[size].box,
        box,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", sizes[size].icon)}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pesan"
          className="-my-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-sm transition-colors duration-150 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
