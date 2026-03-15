import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    try {
      localStorage.removeItem("app-storage");
    } catch {
      // localStorage may be unavailable
    }
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-50 p-6"
          dir="rtl"
        >
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              אירעה שגיאה בלתי צפויה
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              משהו השתבש. ניתן לנסות לנקות את המטמון ולטעון מחדש את האפליקציה.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-8 text-sm font-black text-white shadow-lg transition-transform active:scale-95"
            >
              נקה מטמון וטען מחדש
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
