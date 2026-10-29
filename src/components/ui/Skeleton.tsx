import { cn } from "@/lib/cn";

interface SkeletonProps {
  /** Ukuran dan bentuk, misalnya `h-[18px] w-3/5`. */
  className?: string;
}

/** Blok placeholder berdenyut 1.6s. Tersembunyi dari pembaca layar. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xs bg-skeleton", className)}
    />
  );
}
