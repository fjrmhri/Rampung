import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "danger-outline"
  | "icon"
  | "icon-outline"
  | "icon-danger"
  | "text";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex items-center justify-center text-center transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-md bg-primary font-bold text-primary-foreground not-disabled:hover:bg-primary-hover focus-visible:outline-ring",
  secondary:
    "rounded-md border border-input bg-card font-semibold text-foreground not-disabled:hover:bg-muted focus-visible:outline-ring",
  accent:
    "rounded-md border border-accent-border bg-accent font-bold text-accent-foreground not-disabled:hover:bg-accent-hover focus-visible:outline-ring",
  danger:
    "rounded-md bg-destructive font-bold text-destructive-foreground not-disabled:hover:bg-destructive-hover focus-visible:outline-destructive",
  "danger-outline":
    "rounded-md border border-destructive-border bg-card font-bold text-destructive-fg-soft not-disabled:hover:bg-destructive-soft focus-visible:outline-destructive",
  icon: "size-10 shrink-0 rounded-md text-muted-foreground not-disabled:hover:bg-muted not-disabled:hover:text-primary focus-visible:outline-ring",
  "icon-outline":
    "size-10 shrink-0 rounded-md border border-input bg-card text-foreground not-disabled:hover:bg-muted focus-visible:outline-ring",
  "icon-danger":
    "size-10 shrink-0 rounded-md text-muted-foreground not-disabled:hover:bg-destructive-soft not-disabled:hover:text-destructive focus-visible:outline-destructive",
  text: "min-h-10 gap-1.5 rounded-xs px-1 text-sm font-bold text-primary not-disabled:hover:underline focus-visible:outline-ring",
};

// Varian kotak (bukan icon/text) memakai ukuran ini.
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 gap-1.5 px-3.5 text-[13px]",
  md: "min-h-11 gap-2 px-[18px] text-sm",
  lg: "min-h-[46px] gap-2 px-5 text-[15px]",
  xl: "min-h-12 gap-2 px-5 text-[15px]",
};

// Disabled memakai warna sendiri, bukan opacity 50%.
const disabledStyles: Record<ButtonVariant, string> = {
  primary: "disabled:bg-disabled-bg disabled:text-disabled-fg",
  secondary:
    "disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
  accent: "disabled:opacity-60",
  danger: "disabled:bg-destructive-soft disabled:text-destructive-fg-soft",
  "danger-outline": "disabled:opacity-60",
  icon: "disabled:opacity-50",
  "icon-outline": "disabled:opacity-50",
  "icon-danger": "disabled:opacity-50",
  text: "disabled:text-muted-foreground",
};

const boxVariants = new Set<ButtonVariant>([
  "primary",
  "secondary",
  "accent",
  "danger",
  "danger-outline",
]);

interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Kelas tombol. Dipakai juga untuk `<Link>` yang tampil sebagai tombol.
 * `className` tidak boleh menimpa padding, tinggi, atau warna varian
 * karena tidak ada penggabungan kelas yang bentrok.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
}: ButtonVariantOptions = {}) {
  return cn(
    base,
    variants[variant],
    boxVariants.has(variant) && sizes[size],
    fullWidth && "w-full",
    loading
      ? "cursor-wait opacity-75"
      : cn(disabledStyles[variant], "disabled:cursor-not-allowed"),
    className,
  );
}

export interface ButtonProps
  extends ComponentProps<"button">,
    Omit<ButtonVariantOptions, "className"> {}

/**
 * Tombol dasar. Varian `icon`, `icon-outline`, dan `icon-danger` wajib diberi `aria-label`.
 * Saat `loading`, tombol dinonaktifkan dan spinner tampil di depan label.
 */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({
        variant,
        size,
        fullWidth,
        loading,
        className,
      })}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
