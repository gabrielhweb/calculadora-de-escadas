import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorStr: error.toString() + "\n\n" + error.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "white", color: "red", whiteSpace: "pre-wrap", fontFamily: "monospace", zIndex: 99999, position: "relative" }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.errorStr}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
