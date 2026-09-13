import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06180e] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-[#0a2315] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Something went wrong</h2>
              <p className="text-sm text-[#a1cbb2] leading-relaxed">
                The application encountered an unexpected display issue. Your documents and database remain intact.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 border border-emerald-950 rounded-xl text-left font-mono text-[11px] text-amber-200/80 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
