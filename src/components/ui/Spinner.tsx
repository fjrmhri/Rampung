import { cn } from "@/lib/cn";

interface SpinnerProps {
  className?: string;
}

/** Lingkaran 16px, sisi kanan transparan, berputar 0.8s. Mewarisi warna teks. */
export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:0.8s]",
        className,
      )}
    />
  );
}
