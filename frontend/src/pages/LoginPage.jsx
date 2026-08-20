// src/pages/LoginPage.jsx
// Google sign-in removed for now — the new backend doesn't implement an
// OAuth flow yet (see api-profixgabon's README). Rate limiting is now
// real and server-side (429 responses), so the old client-side
// checkRateLimit/resetRateLimit calls are gone — they only ever protected
// against nothing, since a page refresh reset them.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { isValidEmail, isValidPassword } from '../utils/validators'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!isValidEmail(email)) {
      toast.error('Veuillez entrer un email valide')
      return
    }
    if (!isValidPassword(password)) {
      toast.error('Le mot de passe doit faire au moins 6 caractères')
      return
    }

    setLoading(true)
    setError('')
    try {
      await authService.login(email, password)
      await refreshUser()
      toast.success('✅ Connexion réussie !')
      navigate('/')
    } catch (err) {
      const status = err.response?.status
      const code = err.response?.data?.code
      const message = err.response?.data?.message

      if (status === 409 && code === 'PASSWORD_RESET_REQUIRED') {
        toast.error('Ce compte doit réinitialiser son mot de passe avant la première connexion.')
        setError(message || 'Réinitialisation requise.')
        setShowForgot(true)
      } else if (status === 429) {
        toast.error(`⛔ ${message || 'Trop de tentatives. Réessayez plus tard.'}`)
        setError(message)
      } else if (status === 401) {
        toast.error('❌ Email ou mot de passe incorrect')
        setError('Email ou mot de passe incorrect')
        setShowForgot(true)
      } else {
        toast.error('❌ Erreur de connexion')
        setError('Erreur de connexion')
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #E2EBE7', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F7F9F8',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div onClick={() => navigate('/')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#1A6B3C', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
            }}>🔧</div>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F4526' }}>ProFixGabon</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Bon retour !</h1>
          <p style={{ fontSize: '14px', color: '#4A5E55' }}>Connectez-vous à votre compte</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: '20px',
          padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #E2EBE7',
        }}>

          {/* FORMULAIRE */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
                onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
                onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
              />
            </div>

            {error && (
              <div style={{
                background: '#FDECEA', border: '1px solid #F5C6C2',
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '13px', color: '#D94F3D', marginBottom: '16px',
              }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              background: '#1A6B3C', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>

          {showForgot && (
            <p style={{
              textAlign: 'center', fontSize: '13px', color: '#1A6B3C',
              marginTop: '16px', cursor: 'pointer', fontWeight: '600',
            }}
              onClick={() => navigate('/mot-de-passe-oublie')}
            >
              Mot de passe oublié ? Cliquez ici
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#4A5E55', marginTop: '24px' }}>
          Pas encore de compte ?{' '}
          <span onClick={() => navigate('/inscription')} style={{ color: '#1A6B3C', fontWeight: '700', cursor: 'pointer' }}>
            S'inscrire
          </span>
        </p>

      </div>
    </div>
  )
}
