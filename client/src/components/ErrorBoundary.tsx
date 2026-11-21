import React from "react";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button, Card } from "./ui";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error?.message || "An unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught UI error:", error, info);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoDashboard = (): void => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.assign("/dashboard");
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 text-content-body">
        <Card className="w-full max-w-md text-center" padding="lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-status-danger-border bg-status-danger-soft text-status-danger">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-status-danger">
            Unexpected Application Error
          </p>
          <h1 className="mt-1.5 text-xl font-semibold text-content-heading">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-content-secondary">
            {this.state.errorMessage}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              variant="primary"
              onClick={this.handleReload}
              leftIcon={<RotateCw className="h-4 w-4" />}
            >
              Reload page
            </Button>
            <Button
              variant="outline"
              onClick={this.handleGoDashboard}
              leftIcon={<Home className="h-4 w-4" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
