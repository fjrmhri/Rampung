"use client";

import { Component, ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";

interface SettlementErrorBoundaryProps {
  children: ReactNode;
}

interface SettlementErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SettlementErrorBoundary extends Component<
  SettlementErrorBoundaryProps,
  SettlementErrorBoundaryState
> {
  constructor(props: SettlementErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("SettlementErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert size="lg" title="Terjadi kesalahan.">
          <p className="mt-1 font-normal">
            Kami tidak dapat menampilkan komponen settlement saat ini. Silakan
            muat ulang halaman.
          </p>
          {this.state.error?.message ? (
            <p className="mt-2 font-mono text-xs font-normal">
              {this.state.error.message}
            </p>
          ) : null}
        </Alert>
      );
    }

    return this.props.children;
  }
}
