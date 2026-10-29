import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type InputSize = "sm" | "md" | "lg" | "amount";

// Ukuran memuat tinggi, lebar, radius, padding, dan teks agar tidak bentrok
// dengan `className`.
const sizes: Record<InputSize, string> = {
  // 36px, angka rata kanan; lebar diatur pemanggil (persentase/nominal split).
  sm: "h-9 rounded-sm px-2.5 text-right text-sm font-bold tabular-nums",
  md: "h-11 w-full rounded-md px-3.5 text-[15px]",
  lg: "h-[46px] w-full rounded-md px-3.5 text-[15px]",
  // Jumlah total dengan prefiks "Rp" absolut di kiri.
  amount:
    "h-[46px] w-full rounded-md pr-3.5 pl-11 text-[17px] font-extrabold tabular-nums",
};

/**
 * Kelas field teks. Dipakai juga untuk `<select>` agar tampil seragam.
 * Fokus: border primary + ring 3px primary/20%. Error lewat `aria-invalid`.
 */
export function inputVariants({
  size = "lg",
  className,
}: { size?: InputSize; className?: string } = {}) {
  return cn(
    "border border-input-border bg-card text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-3 focus:ring-primary/20",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/15",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
    sizes[size],
    className,
  );
}

interface InputProps
  extends Omit<ComponentProps<"input">, "size"> {
  size?: InputSize;
}

export function Input({ size, className, ...props }: InputProps) {
  return <input className={inputVariants({ size, className })} {...props} />;
}

interface SelectProps
  extends Omit<ComponentProps<"select">, "size"> {
  size?: InputSize;
}

export function Select({ size, className, ...props }: SelectProps) {
  return <select className={inputVariants({ size, className })} {...props} />;
}
