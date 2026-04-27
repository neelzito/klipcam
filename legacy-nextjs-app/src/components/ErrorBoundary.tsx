"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: string) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      errorInfo: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const oopsMessages = [
        {
          title: "The AI took a creative detour",
          subtitle: "Even the best algorithms need a coffee break sometimes!",
          emoji: "🤖"
        },
        {
          title: "Houston, we have a (minor) glitch", 
          subtitle: "Our digital rocket ship hit some space debris, but we're on it!",
          emoji: "🚀"
        },
        {
          title: "Plot twist nobody saw coming",
          subtitle: "The code decided to improvise... we're redirecting it back to the script!",
          emoji: "🎬"
        },
        {
          title: "The pixels went on strike",
          subtitle: "Don't worry, we're negotiating with the digital union right now!",
          emoji: "🎨"
        }
      ];
      const randomIndex = Math.floor(Math.random() * oopsMessages.length);
      const randomMessage = oopsMessages[randomIndex] ?? oopsMessages[0];

      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 text-center relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 animate-pulse"></div>
              
              <div className="relative">
                <div className="relative mb-6">
                  <div className="text-6xl animate-bounce">{randomMessage?.emoji || '🤖'}</div>
                  <div className="absolute -top-2 -right-2 text-2xl animate-ping">💥</div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-3">{randomMessage?.title || 'Something unexpected happened'}</h1>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {randomMessage?.subtitle || 'Our AI is taking a quick coffee break!'}
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-lg text-left">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg">🔍</span>
                      <h3 className="text-sm font-semibold text-red-400">Dev Mode: Behind the Scenes</h3>
                    </div>
                    <details className="group cursor-pointer">
                      <summary className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                        <span className="group-open:rotate-90 inline-block transition-transform">▶</span> Error Details
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div className="p-3 bg-red-900/30 rounded border border-red-500/30">
                          <p className="text-xs text-red-200 font-mono break-all">
                            🚨 {this.state.error.message}
                          </p>
                        </div>
                        {this.state.errorInfo && (
                          <details className="group cursor-pointer">
                            <summary className="text-xs text-red-300 hover:text-red-200 transition-colors">
                              <span className="group-open:rotate-90 inline-block transition-transform">▶</span> Stack Trace
                            </summary>
                            <pre className="text-xs text-red-200/80 mt-2 p-2 bg-red-900/40 rounded border overflow-auto max-h-40">
                              {this.state.errorInfo}
                            </pre>
                          </details>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={this.handleReset}
                    className="group w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-xl transition-all transform hover:scale-105 active:scale-95 font-bold"
                  >
                    <span className="group-hover:animate-spin">🔄</span>
                    <span>Give it another shot</span>
                    <span className="group-hover:animate-bounce">✨</span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={this.handleReload}
                      className="group flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all transform hover:scale-105 text-sm font-medium"
                    >
                      <RefreshCw className="w-3 h-3 group-hover:animate-spin" />
                      <span>Fresh Start</span>
                    </button>
                    
                    <button
                      onClick={this.handleGoHome}
                      className="group flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all transform hover:scale-105 text-sm font-medium"
                    >
                      <Home className="w-3 h-3 group-hover:animate-bounce" />
                      <span>Safe Harbor</span>
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">
                      💬 Still stuck? Our creator support team has your back!
                    </p>
                    <a 
                      href="/support" 
                      className="inline-flex items-center space-x-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <span>🎆</span>
                      <span>Get help from humans</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fun floating elements */}
            <div className="absolute top-10 left-10 text-2xl animate-ping opacity-20">🔧</div>
            <div className="absolute top-20 right-20 text-xl animate-bounce opacity-30 [animation-delay:0.5s]">⚙️</div>
            <div className="absolute bottom-20 left-20 text-lg animate-pulse opacity-25">💻</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('Error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  };
}

// Utility component for wrapping async operations
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary 
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error('Async error caught:', error);
        console.error('Error info:', errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}