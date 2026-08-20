// src/pages/AdminPage.jsx
// Previously gated by a hardcoded ADMIN_EMAIL checked entirely client-side
// — the updateDoc/deleteDoc calls this page made were reachable directly
// from the browser console by any authenticated user, regardless of what
// this component rendered. Now: the route itself requires
// ProtectedRoute adminOnly (App.jsx), and every actual action below goes
// through backend endpoints gated by authorizeRoles('admin') — this page
// can render whatever it wants, it can't actually validate/reject anyone
// unless the JWT really says type: 'admin'.
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import prestatairesService from '../services/prestataires'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('en_attente')
  const [prestataires, setPrestataires] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  const loadPrestataires = useCallback(async () => {
    setLoading(true)
    try {
      const result = await prestatairesService.getAllForAdmin(1, 200)
      setPrestataires(result.prestataires)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrestataires()
  }, [loadPrestataires])

  const handleValidate = async (id) => {
    setActingId(id)
    try {
      await prestatairesService.validate(id)
      toast.success('Prestataire validé avec succès !')
      loadPrestataires()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Rejeter cette candidature ?')) return
    setActingId(id)
    try {
      await prestatairesService.reject(id)
      toast.success('Candidature rejetée')
      loadPrestataires()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du rejet')
    } finally {
      setActingId(null)
    }
  }

  const enAttente = prestataires.filter((p) => !p.validated)
  const valides = prestataires.filter((p) => p.validated)

  const TABS = [
    { id: 'en_attente', label: '⏳ En attente', count: enAttente.length },
    { id: 'valides', label: '✅ Validés', count: valides.length },
  ]

  const liste = activeTab === 'en_attente' ? enAttente : valides

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '4px solid #E2EBE7', borderTop: '4px solid #1A6B3C',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: '64px', background: '#F7F9F8', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: '#0F4526', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
            🛡️ Dashboard Admin
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
            ProFixGabon · {user?.email}
          </p>

          {/* STATS */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { val: enAttente.length, lbl: 'En attente', bg: '#FDF3E3', color: '#7A5C1A' },
              { val: valides.length, lbl: 'Validés', bg: '#E8F5EE', color: '#0F4526' },
              { val: prestataires.length, lbl: 'Total', bg: '#EEF0FD', color: '#3C3489' },
            ].map((s) => (
              <div key={s.lbl} style={{
                background: s.bg, borderRadius: '12px',
                padding: '12px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

        {/* TABS */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          background: '#fff', padding: '8px', borderRadius: '14px',
          border: '1px solid #E2EBE7',
        }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: '10px',
              borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              background: activeTab === t.id ? '#1A6B3C' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#4A5E55',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {t.label}
              <span style={{
                background: activeTab === t.id ? 'rgba(255,255,255,0.2)' : '#E2EBE7',
                color: activeTab === t.id ? '#fff' : '#4A5E55',
                padding: '2px 8px', borderRadius: '99px',
                fontSize: '12px',
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* LISTE */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#8FA99E' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {activeTab === 'en_attente' ? '🎉' : '📭'}
            </div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#4A5E55', marginBottom: '8px' }}>
              {activeTab === 'en_attente' ? 'Aucune candidature en attente !' : 'Aucun prestataire validé'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {liste.map((p) => (
              <div key={p.id} style={{
                background: '#fff', border: '1px solid #E2EBE7',
                borderRadius: '18px', padding: '20px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}>
                {/* AVATAR */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  overflow: 'hidden', flexShrink: 0,
                  background: '#E8F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: '800', color: '#0F4526',
                }}>
                  {p.photo
                    ? <img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : p.nom?.charAt(0) || '?'}
                </div>

                {/* INFOS */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{p.nom}</p>
                      <p style={{ fontSize: '13px', color: '#4A5E55' }}>{p.categorie} · 📍 {p.ville} · {p.user_email}</p>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      padding: '4px 10px', borderRadius: '99px',
                      background: p.validated ? '#E8F5EE' : '#FDF3E3',
                      color: p.validated ? '#0F4526' : '#7A5C1A',
                    }}>{p.validated ? '✅ Validé' : '⏳ En attente'}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#4A5E55', lineHeight: '1.6', marginBottom: '12px' }}>
                    {p.description?.slice(0, 150)}...
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[
                      { label: `⏱ ${p.experience}` },
                      { label: `📅 ${p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : 'N/A'}` },
                    ].map((m) => (
                      <span key={m.label} style={{
                        fontSize: '12px', color: '#4A5E55',
                        background: '#F7F9F8', padding: '4px 10px',
                        borderRadius: '99px', border: '1px solid #E2EBE7',
                      }}>{m.label}</span>
                    ))}
                  </div>

                  {/* Spécialités */}
                  {p.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {p.skills.map((s) => (
                        <span key={s} style={{
                          fontSize: '11px', fontWeight: '600',
                          background: '#E8F5EE', color: '#0F4526',
                          border: '1px solid #B8DCC8',
                          padding: '3px 10px', borderRadius: '99px',
                        }}>{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Galerie */}
                  {p.galerie?.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {p.galerie.map((img, i) => (
                        <img key={i} src={img} style={{
                          width: '60px', height: '60px',
                          borderRadius: '8px', objectFit: 'cover',
                          border: '1px solid #E2EBE7',
                        }} />
                      ))}
                    </div>
                  )}

                  {/* Pièce d'identité */}
                  {p.piece_identite && (
                    <div style={{
                      marginBottom: '12px',
                      background: '#F7F9F8', borderRadius: '10px',
                      padding: '12px 16px', border: '1px solid #E2EBE7',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#4A5E55', marginBottom: '8px' }}>
                        🪪 Pièce d'identité
                      </p>
                      <a href={p.piece_identite} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '8px',
                        background: '#E8F5EE', color: '#0F4526',
                        border: '1px solid #B8DCC8',
                        fontSize: '13px', fontWeight: '600',
                        textDecoration: 'none',
                      }}>👁️ Voir le document</a>
                    </div>
                  )}

                  {!p.validated && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleValidate(p.id)} disabled={actingId === p.id} style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: '#1A6B3C', color: '#fff',
                        border: 'none', cursor: actingId === p.id ? 'wait' : 'pointer',
                        fontSize: '13px', fontWeight: '700',
                        opacity: actingId === p.id ? 0.6 : 1,
                      }}>✅ Valider le profil</button>
                      <button onClick={() => handleReject(p.id)} disabled={actingId === p.id} style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: '#FDECEA', color: '#D94F3D',
                        border: '1px solid #F5C6C2', cursor: actingId === p.id ? 'wait' : 'pointer',
                        fontSize: '13px', fontWeight: '700',
                        opacity: actingId === p.id ? 0.6 : 1,
                      }}>❌ Rejeter</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
