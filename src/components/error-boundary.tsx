"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that catches React errors and displays a fallback UI.
 * Prevents the entire app from crashing when an error occurs in the component tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-emerald-50">
          <div className="max-w-md rounded-xl border border-emerald-200/20 bg-black/60 p-6 text-center backdrop-blur">
            <div className="text-xl font-semibold tracking-wide">Something went wrong</div>
            <div className="mt-2 text-sm text-emerald-100/80">
              The game encountered an unexpected error and needs to restart.
            </div>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <pre className="mt-4 max-w-full overflow-auto rounded bg-black/40 p-2 text-left text-xs text-red-400">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 select-none rounded-full border border-emerald-200/20 bg-black/40 px-4 py-2 text-sm text-emerald-50 backdrop-blur transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
