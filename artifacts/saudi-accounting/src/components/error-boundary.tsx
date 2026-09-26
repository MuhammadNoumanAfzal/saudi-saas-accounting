import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  const isClerkError = error.message?.includes('failed_to_load_clerk_js') || error.message?.includes('Clerk');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-card border border-border shadow-2xl fade-up">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-black tracking-tight text-foreground">
            {isClerkError ? 'Authentication Service Connection Issue' : 'Application Encountered an Issue'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isClerkError 
              ? 'فشل الاتصال بخدمة التحقق من الهوية. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.' 
              : 'حدث خطأ في المنظومة. يرجى إعادة تحميل الصفحة.'}
          </p>
        </div>

        {import.meta.env.DEV && (
          <pre className="text-left text-[11px] font-mono bg-muted/60 p-3 rounded-xl border border-border overflow-x-auto text-muted-foreground">
            {error.message || String(error)}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 rounded-xl btn-primary py-2.5 px-4 text-xs font-bold transition-all shadow-xs"
          >
            {isClerkError ? 'Retry Connection (إعادة المحاولة)' : 'Reload Page (إعادة التحميل)'}
          </button>
          <button
            type="button"
            onClick={resetError}
            className="rounded-xl border border-border bg-background py-2.5 px-4 text-xs font-bold text-foreground hover:bg-muted transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
