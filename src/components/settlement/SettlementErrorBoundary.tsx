"use client";

import { Component, ReactNode } from "react";

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
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-bold text-destructive">
            Terjadi kesalahan.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami tidak dapat menampilkan komponen settlement saat ini. Silakan
            muat ulang halaman.
          </p>
          {this.state.error?.message ? (
            <p className="mt-3 text-xs text-destructive/80">
              {this.state.error.message}
            </p>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
