// src/components/Navbar.jsx
// Previously checked user.email === ADMIN_EMAIL (a hardcoded address) to
// decide whether to show the Admin link — purely cosmetic even before,
// since the real gate is now ProtectedRoute adminOnly + the backend's
// authorizeRoles('admin'), but this now reflects the real role (user.type)
// instead of a hardcoded string.
import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import messagerieService from '../services/messagerie'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const conversations = await messagerieService.getConversations()
      const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setUnreadCount(total)
    } catch {
      // Non-critical — just leave the badge as-is on a transient error.
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    refreshUnreadCount()
  }, [user, refreshUnreadCount])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return

    const handler = () => refreshUnreadCount()
    socket.on('conversation_updated', handler)
    return () => socket.off('conversation_updated', handler)
  }, [user, refreshUnreadCount])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E2EBE7',
      padding: '0 24px',
      height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>

      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <span style={{ fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#0F4526' }}>
          ProFixGabon
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link to="/services" style={{
          padding: '8px 16px', 
          fontSize: '14px', fontWeight: '500', color: '#4A5E55',
          textDecoration: 'none',
        }}>Services</Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                background: '#E8F5EE',
                color: '#0F4526',
                border: '1px solid #B8DCC8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
              }}
            >
              Dashboard
              {unreadCount > 0 && (
                <span style={{
                  background: '#D94F3D',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  minWidth: '18px',
                  textAlign: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <div onClick={() => navigate('/compte')} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#E8F5EE', 
              padding: '6px 14px 6px 8px',
              border: '1px solid #B8DCC8',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '28px', height: '28px', 
                background: '#1A6B3C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#fff', fontWeight: '700',
                overflow: 'hidden',
              }}>
                {user.profile_image
                  ? <img src={user.profile_image} style={{ width: '28px', height: '28px',  objectFit: 'cover' }} />
                  : <span style={{ fontSize: '13px', fontWeight: '800' }}>
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                    </span>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F4526' }}>
                {user.name?.split(' ')[0] || 'Mon compte'}
              </span>
            </div>

            {user.type === 'admin' && (
              <button onClick={() => navigate('/admin')} style={{
                padding: '8px 16px', 
                fontSize: '13px', fontWeight: '600',
                background: '#0F4526', color: '#fff',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>Admin</button>
            )}

            <button onClick={handleLogout} style={{
              padding: '8px 16px', 
              fontSize: '13px', fontWeight: '600',
              background: 'transparent', color: '#D94F3D',
              border: '1.5px solid #F5C6C2', cursor: 'pointer',
            }}>Déconnexion</button>

          </div>
        ) : (
          <>
            <button onClick={() => navigate('/connexion')} style={{
              padding: '8px 16px', 
              fontSize: '14px', fontWeight: '600', color: '#1A6B3C',
              background: 'transparent', border: '1.5px solid #1A6B3C',
              cursor: 'pointer',
            }}>Connexion</button>
            <button onClick={() => navigate('/inscription')} style={{
              padding: '8px 18px', 
              fontSize: '14px', fontWeight: '600',
              background: '#1A6B3C', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}>S'inscrire</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </nav>
  )
}
