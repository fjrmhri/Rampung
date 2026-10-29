import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  /** Pesan error di bawah field. Pasangkan dengan `aria-describedby` di input. */
  error?: ReactNode;
  errorId?: string;
  children: ReactNode;
}

/** Label 14px/600, tanda wajib merah atau "(Opsional)", lalu field. */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  error,
  errorId,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive-fg-soft">
            *
          </span>
        )}
        {optional && (
          <span className="ml-1 text-[13px] font-medium text-muted-foreground">
            (Opsional)
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-destructive-fg-soft"
        >
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
