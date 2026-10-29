"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./Button";

interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Label saat form server action sedang dikirim. */
  pendingText: ReactNode;
}

/** Tombol submit untuk form server action; spinner + `pendingText` saat pending. */
export function SubmitButton({
  pendingText,
  children,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
