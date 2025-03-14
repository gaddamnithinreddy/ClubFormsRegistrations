import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // You can also send error reports to your error tracking service here
    // Example: Sentry.captureException(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 dark:text-white">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 