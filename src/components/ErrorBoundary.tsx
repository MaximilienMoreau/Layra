"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
            Une erreur inattendue s&apos;est produite.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-medium)",
              borderRadius: 8,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
}
