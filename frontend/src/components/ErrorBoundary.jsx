// src/components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary a attrapé une erreur:', error, errorInfo)
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
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😅</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
            Oups ! Une erreur est survenue
          </h2>
          <p style={{ color: '#4A5E55', marginBottom: '20px' }}>
            Nous rencontrons un problème technique. Veuillez réessayer.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#1A6B3C',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            🔄 Rafraîchir la page
          </button>
          {this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '16px',
              background: '#FDECEA',
              borderRadius: '10px',
              textAlign: 'left',
              maxWidth: '500px',
              width: '100%',
            }}>
              <summary style={{ fontWeight: '700', color: '#D94F3D', cursor: 'pointer' }}>
                Détails de l'erreur
              </summary>
              <pre style={{
                fontSize: '12px',
                color: '#D94F3D',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}