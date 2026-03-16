import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#EEF2FF',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>Something went wrong</h1>
          <pre style={{ background: '#fff', padding: 16, borderRadius: 8, overflow: 'auto', maxWidth: 600, fontSize: 12, color: '#b91c1c' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.href = '/login'}
            style={{ marginTop: 16, padding: '10px 20px', background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
