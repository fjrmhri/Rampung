"use client";

import { useRef, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** id elemen yang menjadi label radiogroup. */
  labelledBy: string;
}

/**
 * Pilihan tunggal bergaya segmented (`role="radiogroup"`).
 * Tab masuk ke opsi terpilih; panah kiri/kanan/atas/bawah memindah pilihan.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const langkah =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (langkah === 0) return;
    e.preventDefault();
    const next = (index + langkah + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted p-1"
    >
      {options.map((opsi, index) => {
        const terpilih = opsi.value === value;
        const Icon = opsi.icon;
        return (
          <button
            key={opsi.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={terpilih}
            tabIndex={terpilih ? 0 : -1}
            onClick={() => onChange(opsi.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[9px] border px-1 py-1.5 text-center text-[13px] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1",
              terpilih
                ? "border-primary/35 bg-card text-primary-hover shadow-[0_1px_3px_oklch(0.23_0.015_60/0.12)]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {opsi.label}
          </button>
        );
      })}
    </div>
  );
}
