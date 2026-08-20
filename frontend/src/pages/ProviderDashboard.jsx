// src/pages/ProviderDashboard.jsx
// Replaces onAuthStateChanged + Firestore onSnapshot(prestataires/{uid})
// with AuthContext + prestatairesService, and the old `avis.liste` array
// field with the real avis table (see services/avis.js). `demandesCount`/
// `missionsEnCours`/`missions` still have no backend source — same as the
// original, which also always showed these as hardcoded '0' (nothing ever
// populated them in Firestore either); not a regression introduced here.
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'
import prestatairesService from '../services/prestataires'
import devisService from '../services/devis'
import demandesService from '../services/demandes'
import messagerieService from '../services/messagerie'
import avisService from '../services/avis'
import { getSocket } from '../services/socket'
import ConversationsList from '../components/ConversationsList'
import DemandesList from '../components/DemandesList'
import DevisList from '../components/DevisList'
import { optimizeAvatar } from '../utils/imageOptimizer'

const VILLES_GABON = [
  'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda',
  'Mouila', 'Lambaréné', 'Koulamoutou', 'Tchibanga', 'Akanda', 'Owendo'
]

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [prestataire, setPrestataire] = useState(null)
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('accueil')

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [newDemandes, setNewDemandes] = useState(0)
  const [newDevis, setNewDevis] = useState(0)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ ville: '', experience: '', categorie: '', skillsInput: '' })
  const [saving, setSaving] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)

  const renderStars = useCallback((note) => {
    const fullStars = Math.round(note || 0)
    const emptyStars = 5 - fullStars
    return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars)
  }, [])

  const stats = useMemo(() => ({
    demandesCount: '0',
    missionsEnCours: '0',
    missions: '0',
    rating: (Number(prestataire?.rating) || 0).toFixed(1),
    totalAvis: prestataire?.reviews_count || 0,
    moyenneAvis: Number(prestataire?.rating) || 0,
  }), [prestataire])

  const quickActions = useMemo(() => [
    { icon: '📋', titre: 'Demandes', desc: 'Voir les nouvelles demandes', action: () => setActiveTab('demandes'), bg: '#E8F5EE', color: '#0F4526' },
    { icon: '📅', titre: 'Planning', desc: 'Gérer mon agenda', action: () => setActiveTab('planning'), bg: '#EEF0FD', color: '#3C3489' },
    { icon: '💬', titre: 'Messages', desc: 'Vos conversations', action: () => setActiveTab('messages'), bg: '#FDF3E3', color: '#7A5C1A' },
    { icon: '📄', titre: 'Devis', desc: 'Gérer vos devis', action: () => setActiveTab('devis'), bg: '#FBEAF0', color: '#993556' },
  ], [])

  const serviceInfo = useMemo(() => [
    { label: '🔧 Catégorie', val: prestataire?.categorie || '-' },
    { label: '📍 Ville', val: prestataire?.ville || '-' },
    { label: '⏱ Expérience', val: prestataire?.experience || '-' },
    { label: '📊 Disponibilité', val: prestataire?.available ? '🟢 Disponible' : '🔴 Occupé' },
  ], [prestataire])

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
    setIsEditing(false)
  }, [])

  const toggleAvailability = useCallback(async () => {
    if (!prestataire || togglingAvailability) return
    setTogglingAvailability(true)
    try {
      const updated = await prestatairesService.setAvailability(prestataire.id, !prestataire.available)
      setPrestataire(updated)
    } catch (err) {
      console.error('Erreur changement disponibilité:', err)
    } finally {
      setTogglingAvailability(false)
    }
  }, [prestataire, togglingAvailability])

  const refreshBadges = useCallback(async (prestataireId) => {
    if (!prestataireId) return
    try {
      const [devisResult, demandesResult, conversations] = await Promise.all([
        devisService.list({ limit: 100, as: 'prestataire' }),
        demandesService.list({ limit: 100, as: 'prestataire' }),
        messagerieService.getConversations(),
      ])
      setNewDevis(devisResult.devis.filter(d => d.statut === 'en_attente').length)
      setNewDemandes(demandesResult.demandes.filter(d => d.statut === 'en_attente' || d.statut === 'devis_envoye').length)
      setUnreadMessages(conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0))
    } catch {
      // Non-critical — badges just stay as-is on a transient error.
    }
  }, [])

  // Auth + chargement du profil prestataire
  useEffect(() => {
    if (!user) { navigate('/connexion'); return }
    if (user.type !== 'prestataire' || user.current_mode !== 'prestataire') {
      navigate('/dashboard')
      return
    }

    const load = async () => {
      try {
        const data = await prestatairesService.getMyProfile()
        setPrestataire(data)
        setEditForm({
          ville: data.ville || '',
          experience: data.experience || '',
          categorie: data.categorie || '',
          skillsInput: data.skills ? data.skills.join(', ') : ''
        })
        const avisData = await avisService.list(data.id).catch(() => [])
        setAvis(avisData)
        refreshBadges(data.id)
      } catch (err) {
        console.error('Erreur chargement prestataire:', err)
      }
      setLoading(false)
    }
    load()
  }, [user, navigate, refreshBadges])

  // Temps réel : rafraîchir les badges sur les événements pertinents
  useEffect(() => {
    if (!prestataire) return
    const socket = getSocket()
    if (!socket) return
    const handler = () => refreshBadges(prestataire.id)
    socket.on('new_demande', handler)
    socket.on('new_devis', handler)
    socket.on('conversation_updated', handler)
    return () => {
      socket.off('new_demande', handler)
      socket.off('new_devis', handler)
      socket.off('conversation_updated', handler)
    }
  }, [prestataire, refreshBadges])

  const toggleMode = async () => {
    try {
      await authService.setMode('client')
      await refreshUser()
      navigate('/dashboard')
    } catch (err) {
      console.error('Erreur lors du changement de mode:', err)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!prestataire) return
    setSaving(true)
    try {
      const skillsArray = editForm.skillsInput
        ? editForm.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []

      const updated = await prestatairesService.update(prestataire.id, {
        ville: editForm.ville,
        experience: editForm.experience,
        categorie: editForm.categorie,
        skills: skillsArray,
      })
      setPrestataire(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur lors de la mise à jour :', err)
      alert('Une erreur est survenue lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !prestataire) return (
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
    { id: 'accueil', icon: '🏠', label: 'Accueil' },
    { id: 'demandes', icon: '📋', label: 'Demandes', count: newDemandes },
    { id: 'planning', icon: '📅', label: 'Planning' },
    { id: 'devis', icon: '📄', label: 'Devis', count: newDevis },
    { id: 'messages', icon: '💬', label: 'Messages', count: unreadMessages },
    { id: 'avis', icon: '⭐', label: 'Avis' },
    { id: 'profil', icon: '👤', label: 'Mon profil' },
  ]

  return (
    <div style={{ paddingTop: '64px', background: '#F7F9F8', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #0F4526, #1A6B3C)',
        padding: '32px 24px 80px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '800', color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {prestataire?.photo
                  ? <img
                      src={optimizeAvatar(prestataire.photo)}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  : user?.name?.charAt(0) || '?'
                }
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>
                  Dashboard Prestataire 🔧
                </p>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                  {user?.name}
                </h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    background: prestataire?.validated ? '#E8F5EE' : '#FDF3E3',
                    color: prestataire?.validated ? '#0F4526' : '#7A5C1A',
                    padding: '3px 10px', borderRadius: '99px',
                  }}>
                    {prestataire?.validated ? '✅ Profil validé' : '⏳ En attente de validation'}
                  </span>
                  {prestataire?.ville && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      background: 'rgba(255,255,255,0.15)', color: '#fff',
                      padding: '3px 10px', borderRadius: '99px',
                    }}>📍 {prestataire.ville}</span>
                  )}
                </div>
              </div>
            </div>

            <button onClick={toggleMode} style={{
              padding: '10px 18px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              👤 Passer en mode client
            </button>
          </div>

          {/* STATS */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { val: stats.demandesCount, lbl: 'Demandes reçues', icon: '📋' },
              { val: stats.missionsEnCours, lbl: 'Missions en cours', icon: '⚡' },
              { val: stats.missions, lbl: 'Missions terminées', icon: '✅' },
              { val: stats.rating, lbl: 'Note moyenne', icon: '⭐' },
            ].map(s => (
              <div key={s.lbl} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '12px 20px',
                textAlign: 'center', minWidth: '110px', flex: '1'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: '900px', margin: '-48px auto 0', padding: '0 24px 64px' }}>
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* TABS AVEC BADGES */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2EBE7', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
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
                }}
              >
                <span style={{ fontSize: '18px' }}>{t.icon}</span>
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
                    borderRadius: '99px',
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
              {!prestataire?.validated && (
                <div style={{
                  background: '#FDF3E3', border: '1px solid #E8C97A',
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  marginBottom: '24px',
                }}>
                  <span style={{ fontSize: '28px' }}>⏳</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#7A5C1A', marginBottom: '4px' }}>
                      Profil en cours de validation
                    </p>
                    <p style={{ fontSize: '12px', color: '#8FA99E' }}>
                      Notre équipe examine votre dossier sous 24-48h.
                    </p>
                  </div>
                </div>
              )}

              <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Actions rapides</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {quickActions.map(a => (
                  <div key={a.titre} onClick={a.action} style={{
                    background: a.bg, borderRadius: '14px',
                    padding: '16px', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{a.icon}</div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: a.color, marginBottom: '4px' }}>{a.titre}</p>
                    <p style={{ fontSize: '11px', color: '#8FA99E' }}>{a.desc}</p>
                  </div>
                ))}
              </div>

              <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Mon service</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {serviceInfo.map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#F7F9F8',
                    borderRadius: '10px', border: '1px solid #E2EBE7',
                    fontSize: '14px',
                  }}>
                    <span style={{ color: '#4A5E55', fontWeight: '600' }}>{r.label}</span>
                    <span style={{ fontWeight: '700' }}>{r.val}</span>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: '#F7F9F8',
                  borderRadius: '10px', border: '1px solid #E2EBE7',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#4A5E55' }}>
                    Changer ma disponibilité
                  </span>
                  <div onClick={toggleAvailability} style={{
                    width: '48px', height: '26px', borderRadius: '99px',
                    background: prestataire?.available ? '#1A6B3C' : '#E2EBE7',
                    cursor: togglingAvailability ? 'wait' : 'pointer', position: 'relative',
                    transition: 'background 0.2s', opacity: togglingAvailability ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#fff', position: 'absolute',
                      top: '3px', left: prestataire?.available ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </div>

              {/* SECTION AVIS */}
              <div style={{ marginTop: '32px', borderTop: '1px solid #E2EBE7', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
                  ⭐ Avis et évaluations
                </h2>

                <div style={{
                  background: '#F7F9F8',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  border: '1px solid #E2EBE7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#1A6B3C' }}>
                      {stats.moyenneAvis.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8FA99E' }}>sur 5</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '28px' }}>
                      {renderStars(stats.moyenneAvis)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8FA99E' }}>
                      {stats.totalAvis} avis clients
                    </div>
                  </div>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {avis.length > 0 ? (
                    avis.slice(0, 3).map((a) => (
                      <div key={a.id} style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #E2EBE7',
                        background: '#fff',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>
                            {a.client_name || 'Client'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#8FA99E' }}>
                            {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                          {renderStars(a.note)}
                        </div>
                        {a.commentaire && (
                          <p style={{ fontSize: '13px', color: '#4A5E55', margin: 0, fontStyle: 'italic' }}>
                            "{a.commentaire}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '32px 16px',
                      color: '#8FA99E',
                      background: '#fff',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                      <p style={{ fontWeight: '600' }}>Aucun avis pour le moment</p>
                      <p style={{ fontSize: '13px' }}>Les premiers avis apparaîtront après vos missions</p>
                    </div>
                  )}

                  {avis.length > 3 && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <button
                        onClick={() => handleTabChange('avis')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#1A6B3C',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textDecoration: 'underline'
                        }}
                      >
                        Voir tous les avis ({avis.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════ DEMANDES ══════ */}
          {activeTab === 'demandes' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                📋 Demandes reçues
                {newDemandes > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {newDemandes}
                  </span>
                )}
              </h2>
              <DemandesList type="prestataire" />
            </div>
          )}

          {/* ══════ PLANNING ══════ */}
          {activeTab === 'planning' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Mon planning</h2>
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8FA99E' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#4A5E55', marginBottom: '8px' }}>
                  Gestion du planning à venir
                </p>
              </div>
            </div>
          )}

          {/* ══════ DEVIS ══════ */}
          {activeTab === 'devis' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                📄 Mes devis
                {newDevis > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {newDevis}
                  </span>
                )}
              </h2>
              <DevisList type="prestataire" />
            </div>
          )}

          {/* ══════ MESSAGES ══════ */}
          {activeTab === 'messages' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                💬 Mes messages
                {unreadMessages > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: '#D94F3D',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {unreadMessages}
                  </span>
                )}
              </h2>
              <ConversationsList />
            </div>
          )}

          {/* ══════ AVIS ══════ */}
          {activeTab === 'avis' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
                ⭐ Tous mes avis clients
              </h2>

              <div style={{
                background: 'linear-gradient(135deg, #F7F9F8, #E8F5EE)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid #B8DCC8',
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                flexWrap: 'wrap'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: '800', color: '#1A6B3C' }}>
                    {stats.moyenneAvis.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#4A5E55' }}>sur 5</div>
                </div>

                <div>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                    {renderStars(stats.moyenneAvis)}
                  </div>
                  <div style={{ fontSize: '15px', color: '#4A5E55' }}>
                    <strong>{stats.totalAvis}</strong> avis clients
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {avis.length > 0 ? (
                  avis.map((a) => (
                    <div key={a.id} style={{
                      background: '#fff',
                      border: '1px solid #E2EBE7',
                      borderRadius: '12px',
                      padding: '16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '15px' }}>
                            {a.client_name || 'Client anonyme'}
                          </span>
                          <div style={{ fontSize: '20px', marginTop: '4px' }}>
                            {renderStars(a.note)}
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8FA99E', whiteSpace: 'nowrap' }}>
                          {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          }) : 'Date inconnue'}
                        </span>
                      </div>

                      {a.commentaire && (
                        <div style={{
                          padding: '12px 16px',
                          background: '#F7F9F8',
                          borderRadius: '8px',
                          marginTop: '4px'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: '#4A5E55',
                            margin: 0,
                            fontStyle: 'italic'
                          }}>
                            "{a.commentaire}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 24px',
                    color: '#8FA99E',
                    background: '#F7F9F8',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#4A5E55' }}>
                      Pas encore d'avis
                    </p>
                    <p style={{ fontSize: '14px' }}>
                      Les clients pourront noter vos services après chaque mission terminée
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ PROFIL ══════ */}
          {activeTab === 'profil' && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Mon profil prestataire</h2>

              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Nom', val: user?.name || '-' },
                    { label: 'Email', val: user?.email || '-' },
                    { label: 'Catégorie de métier', val: prestataire?.categorie || '-' },
                    { label: 'Ville (Gabon)', val: prestataire?.ville || '-' },
                    { label: 'Expérience', val: prestataire?.experience || '-' },
                  ].map(r => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '12px 16px', background: '#F7F9F8',
                      borderRadius: '10px', border: '1px solid #E2EBE7',
                      fontSize: '14px',
                    }}>
                      <span style={{ color: '#4A5E55', fontWeight: '600' }}>{r.label}</span>
                      <span style={{ fontWeight: '700' }}>{r.val}</span>
                    </div>
                  ))}

                  <div style={{
                    padding: '12px 16px',
                    background: '#F7F9F8',
                    borderRadius: '10px',
                    border: '1px solid #E2EBE7',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4A5E55', fontWeight: '600' }}>⭐ Note moyenne</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {renderStars(stats.moyenneAvis)}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#1A6B3C' }}>
                          {stats.moyenneAvis.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8FA99E', marginTop: '4px' }}>
                      {stats.totalAvis} avis clients
                    </div>
                  </div>

                  {prestataire?.skills?.length > 0 && (
                    <div style={{ padding: '12px 16px', background: '#F7F9F8', borderRadius: '10px', border: '1px solid #E2EBE7' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#4A5E55', marginBottom: '8px' }}>Spécialités / Tags</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {prestataire.skills.map(s => (
                          <span key={s} style={{
                            padding: '4px 10px', borderRadius: '99px',
                            fontSize: '11px', fontWeight: '600',
                            background: '#E8F5EE', color: '#0F4526',
                            border: '1px solid #B8DCC8',
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setIsEditing(true)} style={{
                    width: '100%', padding: '12px',
                    background: '#1A6B3C', color: '#fff',
                    border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    marginTop: '8px',
                  }}>✏️ Modifier les détails de mon service</button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5E55', marginBottom: '6px' }}>Catégorie ou Métier</label>
                    <input
                      type="text"
                      value={editForm.categorie}
                      onChange={e => setEditForm({...editForm, categorie: e.target.value})}
                      placeholder="Ex: Électricien, Plombier, Coiffeuse à domicile..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2EBE7', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5E55', marginBottom: '6px' }}>Ville au Gabon 📍</label>
                    <select
                      value={editForm.ville}
                      onChange={e => setEditForm({...editForm, ville: e.target.value})}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2EBE7', boxSizing: 'border-box', background: '#fff' }}
                      required
                    >
                      <option value="">Sélectionne ta ville</option>
                      {VILLES_GABON.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5E55', marginBottom: '6px' }}>Années d'expérience</label>
                    <input
                      type="text"
                      value={editForm.experience}
                      onChange={e => setEditForm({...editForm, experience: e.target.value})}
                      placeholder="Ex: 3 ans d'expérience, Plus de 5 ans..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2EBE7', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5E55', marginBottom: '6px' }}>Spécialités (séparées par des virgules)</label>
                    <input
                      type="text"
                      value={editForm.skillsInput}
                      onChange={e => setEditForm({...editForm, skillsInput: e.target.value})}
                      placeholder="Ex: Dépannage rapide, Climatisation, Coiffure nappy"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2EBE7', boxSizing: 'border-box' }}
                    />
                    <small style={{ color: '#8FA99E', fontSize: '11px', marginTop: '4px', display: 'block' }}>Sépare chaque spécialité par une virgule.</small>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setIsEditing(false)} style={{
                      flex: 1, padding: '12px', background: '#F7F9F8', border: '1px solid #E2EBE7', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                    }}>Annuler</button>

                    <button type="submit" disabled={saving} style={{
                      flex: 1, padding: '12px', background: '#1A6B3C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                      opacity: saving ? 0.7 : 1
                    }}>{saving ? 'Sauvegarde...' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
