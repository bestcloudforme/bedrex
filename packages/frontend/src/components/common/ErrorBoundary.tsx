import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-center">
            <p className="text-error font-medium">Something went wrong</p>
            <p className="mt-1 text-xs text-text-faint">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs text-white hover:bg-primary/80"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
