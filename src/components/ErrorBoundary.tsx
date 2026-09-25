import React from 'react';
import { Button } from '@/components/ui/Button';

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
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-stone-50 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-sm">
            <div className="text-5xl">🌸</div>
            <div className="space-y-2">
              <h1 className="font-cormorant text-2xl font-light text-stone-800 italic">
                Something went wrong
              </h1>
              <p className="text-stone-500 text-sm font-light">
                We encountered an unexpected error. Please refresh the page to continue.
              </p>
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
