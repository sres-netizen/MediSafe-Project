import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MediSafe Component Error Caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          maxWidth: '600px',
          margin: '2rem auto',
          background: '#ffffff',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', color: '#b91c1c', marginBottom: '0.5rem' }}>
            Something went wrong rendering the clinical view
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Reload MediSafe
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
