import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#be123c', fontSize: '22px' }}>Wystąpił nieoczekiwany problem</h2>
          <p style={{ color: '#44403c', fontSize: '14px', maxWidth: '400px', margin: '12px auto' }}>
            {this.state.error?.message || 'Nie udało się załadować galerii.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '16px', 
              padding: '10px 20px', 
              borderRadius: '12px', 
              background: '#be123c', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 600 
            }}
          >
            Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
