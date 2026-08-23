// src/pages/ClientDashboard.jsx
// Replaces onAuthStateChanged + Firestore onSnapshot badge listeners with
// AuthContext (user) + a REST fetch refreshed on relevant socket events.
// `ville`/`bio` are gone from the profile tab — see AccountPage.jsx's
// header comment for why (no backend column, never functionally used here).
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'
import devisService from '../services/devis'
import messagerieService from '../services/messagerie'
import { getSocket } from '../services/socket'
import { usePolling } from '../hooks/usePolling'
import ConversationsList from '../components/ConversationsList'
import DemandesList from '../components/DemandesList'
import DevisList from '../components/DevisList'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('accueil')

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [newDevis, setNewDevis] = useState(0)

  const refreshBadges = useCallback(async () => {
    if (!user) return
    try {
      const [devisResult, conversations] = await Promise.all([
        devisService.list({ limit: 100 }),
        messagerieService.getConversations(),
      ])
      setNewDevis(devisResult.devis.filter(d => d.statut === 'en_attente').length)
      setUnreadMessages(conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0))
    } catch {
      // Non-critical — badges just stay as-is on a transient error.
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    // Fetch-on-mount, no route params to race against — the accepted use of
    // setState-in-effect per React's own docs ("Fetching data" in
    // https://react.dev/learn/you-might-not-need-an-effect).
    refreshBadges()
  }, [user, refreshBadges])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return
    const handler = () => refreshBadges()
    socket.on('new_devis', handler)
    socket.on('devis_status_changed', handler)
    socket.on('conversation_updated', handler)
    return () => {
      socket.off('new_devis', handler)
      socket.off('devis_status_changed', handler)
      socket.off('conversation_updated', handler)
    }
  }, [user, refreshBadges])

  usePolling(refreshBadges, user ? 10000 : null)

  const switchToProviderMode = async () => {
    try {
      await authService.setMode('prestataire')
      await refreshUser()
      navigate('/dashboard-prestataire')
    } catch (error) {
      console.error('Erreur lors du changement de mode:', error)
    }
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '4px solid #E2EBE7', borderTop: '4px solid #1A6B3C',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const TABS = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'reservations', label: 'Mes demandes' },
    { id: 'devis', label: 'Mes devis', count: newDevis },
    { id: 'messages', label: 'Messages', count: unreadMessages },
    { id: 'profil', label: 'Mon profil' },
  ]

  return (
    <div style={{ paddingTop: '64px', background: '#F7F9F8', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #0F4526, #1A6B3C)',
        padding: '32px 24px 80px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px', height: '64px', 
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: '800', color: '#fff',
              border: '2px solid rgba(255,255,255,0.3)',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {user.profile_image
                ? <img src={user.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.name?.charAt(0) || '?'
              }
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
                Bonjour
              </p>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                {user.name || 'Mon compte'}
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700',
                  background: '#FDF3E3', color: '#7A5C1A',
                  padding: '3px 10px', 
                }}>Client</span>
              </div>
            </div>
          </div>

          {/* STATS RAPIDES */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { val: '0', lbl: 'Demandes' },
              { val: String(newDevis), lbl: 'Devis en attente' },
              { val: '0', lbl: 'Missions terminées' },
            ].map(s => (
              <div key={s.lbl} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                 padding: '12px 20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: '900px', margin: '-48px auto 0', padding: '0 24px 64px' }}>

        {/* TABS AVEC BADGES */}
        <div style={{
          background: '#fff', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E2EBE7', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '14px 8px',
                fontSize: '12px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: activeTab === t.id ? '#1A6B3C' : '#8FA99E',
                borderBottom: activeTab === t.id ? '2px solid #1A6B3C' : '2px solid transparent',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '4px',
                whiteSpace: 'nowrap', minWidth: '80px',
                position: 'relative',
              }}>
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '700',
                    padding: '1px 5px',
                    minWidth: '16px',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 8px rgba(217,79,61,0.4)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}>
                    {t.count > 99 ? '99+' : t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `}</style>

          {/* ══════ ACCUEIL ══════ */}
          {activeTab === 'accueil' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                Que cherchez-vous aujourd'hui ?
              </h2>

              {/* Actions rapides */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { titre: 'Trouver un prestataire', desc: 'Parcourez nos professionnels', action: () => navigate('/services'), bg: '#E8F5EE', color: '#0F4526' },
                  { titre: 'Mes demandes', desc: 'Suivez vos demandes', action: () => setActiveTab('reservations'), bg: '#EEF0FD', color: '#3C3489' },
                  { titre: 'Messages', desc: 'Vos conversations', action: () => setActiveTab('messages'), bg: '#FDF3E3', color: '#7A5C1A' },
                  { titre: 'Mes devis', desc: 'Consultez vos devis', action: () => setActiveTab('devis'), bg: '#FBEAF0', color: '#993556' },
                ].map(a => (
                  <div key={a.titre} onClick={a.action} style={{
                    background: a.bg, 
                    padding: '16px', cursor: 'pointer',
                    border: `1px solid ${a.bg}`,
                    transition: 'transform 0.15s',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: a.color, marginBottom: '4px' }}>{a.titre}</p>
                    <p style={{ fontSize: '11px', color: '#8FA99E' }}>{a.desc}</p>
                  </div>
                ))}
              </div>

              {/* Bannière devenir prestataire - UNIQUEMENT pour les clients purs */}
              {!user.pending_provider && user.type === 'client' && (
                <div style={{
                  background: 'linear-gradient(135deg, #0F4526, #1A6B3C)',
                   padding: '20px 24px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                      Vous proposez un service ?
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      Rejoignez nos prestataires vérifiés
                    </p>
                  </div>
                  <button onClick={() => navigate('/devenir-prestataire')} style={{
                    padding: '10px 20px', 
                    background: '#fff', color: '#0F4526',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '700',
                  }}>Devenir prestataire →</button>
                </div>
              )}

              {/* Bannière en attente */}
              {user.pending_provider && (
                <div style={{
                  background: '#FDF3E3', border: '1px solid #E8C97A',
                   padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#7A5C1A', marginBottom: '4px' }}>
                      Candidature en cours d'examen
                    </p>
                    <p style={{ fontSize: '12px', color: '#8FA99E' }}>
                      Notre équipe examine votre dossier. Vous serez notifié sous 24-48h.
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton REPASSER EN MODE PRESTATAIRE */}
              {user.type === 'prestataire' && user.current_mode === 'client' && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#E8F5EE',
                  border: '1px solid #B8DCC8',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0F4526', marginBottom: '8px' }}>
                    Vous êtes prestataire mais actuellement en mode client
                  </p>
                  <button
                    onClick={switchToProviderMode}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#1A6B3C',
                      color: '#fff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Repasser en mode prestataire
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════ MES DEMANDES ══════ */}
          {activeTab === 'reservations' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                Mes demandes
              </h2>
              <DemandesList type="client" />
            </div>
          )}

          {/* ══════ MES DEVIS ══════ */}
          {activeTab === 'devis' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                Mes devis
                {newDevis > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                  }}>
                    {newDevis}
                  </span>
                )}
              </h2>
              <DevisList type="client" />
            </div>
          )}

          {/* ══════ MESSAGES ══════ */}
          {activeTab === 'messages' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                Mes messages
                {unreadMessages > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                  }}>
                    {unreadMessages}
                  </span>
                )}
              </h2>
              <ConversationsList />
            </div>
          )}

          {/* ══════ PROFIL ══════ */}
          {activeTab === 'profil' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Mon profil</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Nom', val: user.name || '-' },
                  { label: 'Email', val: user.email || '-' },
                  { label: 'Type de compte', val: user.type === 'prestataire' ? 'Prestataire' : 'Client' },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#F7F9F8',
                     border: '1px solid #E2EBE7',
                    fontSize: '14px',
                  }}>
                    <span style={{ color: '#4A5E55', fontWeight: '600' }}>{r.label}</span>
                    <span style={{ fontWeight: '700' }}>{r.val}</span>
                  </div>
                ))}

                {/* Bouton REPASSER EN MODE PRESTATAIRE */}
                {user.type === 'prestataire' && user.current_mode === 'client' && (
                  <button
                    onClick={switchToProviderMode}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '8px',
                      background: '#1A6B3C',
                      color: '#fff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Repasser en mode prestataire
                  </button>
                )}

                {/* Si l'utilisateur n'est pas prestataire, on lui propose de le devenir */}
                {user.type !== 'prestataire' && !user.pending_provider && (
                  <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    background: '#FDF3E3',
                    border: '1px solid #E8C97A',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#7A5C1A', marginBottom: '8px' }}>
                      Vous proposez un service ?
                    </p>
                    <button
                      onClick={() => navigate('/devenir-prestataire')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#C8922A',
                        color: '#fff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Devenir prestataire
                    </button>
                  </div>
                )}

                {user.pending_provider && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    background: '#FDF3E3',
                    border: '1px solid #E8C97A',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#7A5C1A' }}>
                      Candidature en cours d'examen
                    </p>
                  </div>
                )}

                <button onClick={() => navigate('/compte')} style={{
                  width: '100%', padding: '12px',
                  background: '#1A6B3C', color: '#fff',
                  border: 'none', 
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  marginTop: '8px',
                }}>Modifier mon profil</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
