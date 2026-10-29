"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { IconTile, type IconTileTone } from "./IconTile";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  /** Dipanggil oleh Batal dan Escape. Abaikan di sisi pemanggil jika aksi sedang berjalan. */
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  tone?: IconTileTone;
  description: ReactNode;
  /** Konten tambahan di antara deskripsi dan tombol, misalnya ringkasan transaksi. */
  children?: ReactNode;
  /** Tombol konfirmasi di kanan "Batal". */
  actions: ReactNode;
  cancelLabel?: string;
}

/**
 * Dialog modal: fokus awal ke Batal, Tab berputar di dalam panel,
 * Escape menutup, dan fokus kembali ke pemicu setelah ditutup.
 */
export function Dialog({
  open,
  onClose,
  title,
  icon,
  tone = "primary",
  description,
  children,
  actions,
  cancelLabel = "Batal",
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const onEscape = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;

  const trapFocus = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items =
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4 backdrop-blur-[2px]">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={trapFocus}
        className="flex w-full max-w-[420px] flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg"
      >
        <div className="flex items-center gap-3">
          <IconTile icon={icon} tone={tone} />
          <h3 id={titleId} className="text-lg font-extrabold">
            {title}
          </h3>
        </div>
        <div
          id={descId}
          className="text-sm leading-[1.6] text-pretty text-muted-foreground"
        >
          {description}
        </div>
        {children}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button ref={cancelRef} variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {actions}
        </div>
      </div>
    </div>
  );
}
