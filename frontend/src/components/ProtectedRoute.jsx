import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F7F9F8',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '4px solid #E2EBE7', borderTop: '4px solid #1A6B3C',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  // Route-level gate for the UI's sake — the real enforcement is
  // authorizeRoles('admin') on the backend for every actual admin action;
  // this is just so a non-admin doesn't even see the page render.
  if (adminOnly && user.type !== 'admin') {
    return <Navigate to="/" replace />
  }

  const path = location.pathname
  const isProviderMode = user.type === 'prestataire' && user.current_mode === 'prestataire'

  if (isProviderMode && (path === '/dashboard' || path === '/dashboard-client')) {
    return <Navigate to="/dashboard-prestataire" replace />
  }
  if (!isProviderMode && path === '/dashboard-prestataire') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
