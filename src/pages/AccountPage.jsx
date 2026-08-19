// src/pages/AccountPage.jsx
// Replaces the Firestore `users/{uid}` doc read/write with authService.
//
// Schema gap vs the old Firestore shape: the new `users` table has no
// ville/bio/newsletter columns (see api-profixgabon migrate.js) — those
// were purely decorative here (never used to filter/match anything, unlike
// a prestataire's ville) and newsletter was never wired to a real mailer
// even in the original. Dropped rather than faked. `phone` IS a real,
// backend-supported field, so it replaces them as the second editable field.
//
// Account deletion is also dropped: there's no DELETE /auth endpoint on the
// new backend yet (see its README's "what's not done" list) — a button
// that silently did nothing would be worse than no button.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, refreshUser, logout } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profil')

  const [nom, setNom] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState('')

  useEffect(() => {
    if (!user) return
    setNom(user.name || '')
    setPhone(user.phone || '')
    setPhoto(user.profile_image || '')
  }, [user])

  // No loading/redirect guard needed here — ProtectedRoute (see App.jsx)
  // never renders this component before `user` is loaded and set.

  const handleSave = async () => {
    setSaving(true)
    try {
      await authService.updateProfile({ name: nom, phone, profileImage: photo })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const TABS = [
    { id: 'profil', icon: '👤', label: 'Mon profil' },
    { id: 'securite', icon: '🔒', label: 'Sécurité' },
  ]

  return (
    <div style={{ paddingTop: '64px', background: '#F7F9F8', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #0F4526, #1A6B3C)',
        padding: '40px 24px 80px',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            {photo ? (
              <img src={photo} style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
            ) : (
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: '800', color: '#fff',
                border: '3px solid rgba(255,255,255,0.3)',
              }}>{nom?.charAt(0) || '?'}</div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{nom || 'Mon compte'}</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>{user?.email}</p>
            <span style={{
              fontSize: '11px', fontWeight: '700',
              background: user?.type === 'prestataire' ? '#E8F5EE' : '#FDF3E3',
              color: user?.type === 'prestataire' ? '#0F4526' : '#7A5C1A',
              padding: '3px 10px', borderRadius: '99px',
            }}>
              {user?.type === 'prestataire' ? '🔧 Prestataire' : '👤 Client'}
            </span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: '700px', margin: '-48px auto 0', padding: '0 24px 64px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2EBE7' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '16px 8px',
                fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: activeTab === t.id ? '#1A6B3C' : '#8FA99E',
                borderBottom: activeTab === t.id ? '2px solid #1A6B3C' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* TAB PROFIL */}
          {activeTab === 'profil' && (
            <div style={{ padding: '24px' }}>

              {/* Photo */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', marginBottom: '12px' }}>Photo de profil</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ImageUpload onUpload={setPhoto} label="Changer" />
                  {photo && <p style={{ fontSize: '12px', color: '#1A6B3C', fontWeight: '600' }}>✓ Photo mise à jour</p>}
                </div>
              </div>

              {/* Nom */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>Nom complet</label>
                <input value={nom} onChange={e => setNom(e.target.value)} style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #E2EBE7', borderRadius: '10px',
                  fontSize: '14px', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
                  onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                  onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                />
              </div>

              {/* Téléphone */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>Téléphone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+241 XX XX XX XX"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid #E2EBE7', borderRadius: '10px',
                    fontSize: '14px', fontFamily: 'inherit',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                  onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                />
              </div>

              {saved && (
                <div style={{
                  background: '#E8F5EE', border: '1px solid #B8DCC8',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#0F4526', marginBottom: '16px',
                }}>✅ Profil mis à jour avec succès !</div>
              )}

              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '14px',
                background: '#1A6B3C', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>

              {/* Devenir prestataire — seulement pour les clients */}
              {user?.type === 'client' && !user?.pending_provider && (
                <div style={{
                  marginTop: '20px',
                  background: '#FDF3E3', border: '1px solid #E8C97A',
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', flexWrap: 'wrap',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#7A5C1A' }}>Vous proposez un service ?</p>
                    <p style={{ fontSize: '12px', color: '#8FA99E', marginTop: '2px' }}>Devenez prestataire sur ProFixGabon</p>
                  </div>
                  <button onClick={() => navigate('/devenir-prestataire')} style={{
                    padding: '10px 20px', borderRadius: '10px',
                    background: '#C8922A', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>Devenir prestataire →</button>
                </div>
              )}
            </div>
          )}

          {/* TAB SÉCURITÉ */}
          {activeTab === 'securite' && (
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', marginBottom: '4px' }}>Email</p>
                <p style={{ fontSize: '14px', color: '#111', padding: '12px 14px', background: '#F7F9F8', borderRadius: '10px' }}>{user?.email}</p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', marginBottom: '4px' }}>Compte créé le</p>
                <p style={{ fontSize: '14px', color: '#111', padding: '12px 14px', background: '#F7F9F8', borderRadius: '10px' }}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>

              <button onClick={handleLogout} style={{
                width: '100%', padding: '14px',
                background: 'transparent', color: '#D94F3D',
                border: '1.5px solid #F5C6C2', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}>🚪 Se déconnecter</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
