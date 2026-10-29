import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section";
}

/** Kartu dasar: radius 16px, border, latar card. Padding diatur pemanggil. */
export function Card({ as: Tag = "div", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

interface CardTitleProps {
  icon?: LucideIcon;
  children: ReactNode;
  /** Elemen di kanan judul, misalnya pill atau tombol. */
  action?: ReactNode;
  id?: string;
  as?: "h2" | "h3";
}

/** Judul kartu: ikon 20px primary + heading 18px/800. */
export function CardTitle({
  icon: Icon,
  children,
  action,
  id,
  as: Heading = "h2",
}: CardTitleProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
        )}
        <Heading id={id} className="text-lg font-extrabold tracking-[-0.01em]">
          {children}
        </Heading>
      </div>
      {action}
    </div>
  );
}
