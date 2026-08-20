// src/components/DevisList.jsx
// Replaces Firestore cursor-based pagination with the backend's page/limit
// pagination — see services/devis.js.
import { useState, useEffect, useMemo, useCallback } from 'react'
import devisService from '../services/devis'

export default function DevisList({ type }) {
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('en_attente')
  const [copiedId, setCopiedId] = useState(null)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 20

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const result = await devisService.list({ page: 1, limit: LIMIT, as: type === 'prestataire' ? 'prestataire' : undefined })
      setDevis(result.devis)
      setPage(1)
      setHasMore(result.devis.length < result.total)
    } catch (err) {
      console.error('❌ Erreur chargement devis:', err)
      setError('Erreur lors du chargement des devis')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await devisService.list({ page: nextPage, limit: LIMIT, as: type === 'prestataire' ? 'prestataire' : undefined })
      setDevis(prev => [...prev, ...result.devis])
      setPage(nextPage)
      setHasMore(devis.length + result.devis.length < result.total)
    } catch (err) {
      console.error('❌ Erreur chargement plus de devis:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const copyDevisNumber = useCallback((numero) => {
    navigator.clipboard.writeText(numero).then(() => {
      setCopiedId(numero)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(err => {
      console.error('Erreur copie:', err)
    })
  }, [])

  const handleAccepter = useCallback(async (devisId) => {
    setActionLoading(devisId)
    try {
      await devisService.accepter(devisId)
      setDevis(prev => prev.map(d => d.id === devisId ? { ...d, statut: 'accepte' } : d))
    } catch (error) {
      console.error('❌ Erreur acceptation:', error)
      alert("Erreur lors de l'acceptation du devis")
    }
    setActionLoading(null)
  }, [])

  const handleRefuser = useCallback(async (devisId) => {
    setActionLoading(devisId)
    try {
      await devisService.refuser(devisId)
      setDevis(prev => prev.map(d => d.id === devisId ? { ...d, statut: 'refuse' } : d))
    } catch (error) {
      console.error('❌ Erreur refus:', error)
      alert('Erreur lors du refus du devis')
    }
    setActionLoading(null)
  }, [])

  const filteredDevis = useMemo(() => {
    return devis.filter(d => {
      if (filter === 'en_attente') return d.statut === 'en_attente'
      return d.statut !== 'en_attente'
    })
  }, [devis, filter])

  const counts = useMemo(() => ({
    enAttente: devis.filter(d => d.statut === 'en_attente').length,
    historique: devis.filter(d => d.statut !== 'en_attente').length,
  }), [devis])

  const getStatutBadge = useCallback((statut) => {
    const styles = {
      'en_attente': { background: '#FDF3E3', color: '#7A5C1A', label: '⏳ En attente' },
      'accepte': { background: '#E8F5EE', color: '#0F4526', label: '✅ Accepté' },
      'refuse': { background: '#FDECEA', color: '#D94F3D', label: '❌ Refusé' }
    }
    return styles[statut] || styles['en_attente']
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#8FA99E' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '3px solid #E2EBE7',
          borderTop: '3px solid #1A6B3C',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px'
        }} />
        <p>Chargement des devis...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#D94F3D' }}>
        <p>⚠️ {error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: '#1A6B3C',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (devis.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8FA99E' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#4A5E55' }}>
          {type === 'prestataire' ? 'Aucun devis envoyé' : 'Aucun devis reçu'}
        </p>
        <p style={{ fontSize: '13px' }}>
          {type === 'prestataire'
            ? 'Les devis que vous envoyez apparaîtront ici'
            : 'Les devis des prestataires apparaîtront ici'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* FILTRES */}
      {type === 'prestataire' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('en_attente')}
            style={{
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid',
              borderColor: filter === 'en_attente' ? '#1A6B3C' : '#E2EBE7',
              background: filter === 'en_attente' ? '#1A6B3C' : '#fff',
              color: filter === 'en_attente' ? '#fff' : '#4A5E55',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⏳ En attente ({counts.enAttente})
          </button>
          <button
            onClick={() => setFilter('historique')}
            style={{
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid',
              borderColor: filter === 'historique' ? '#1A6B3C' : '#E2EBE7',
              background: filter === 'historique' ? '#1A6B3C' : '#fff',
              color: filter === 'historique' ? '#fff' : '#4A5E55',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📜 Historique ({counts.historique})
          </button>
        </div>
      )}

      {/* LISTE DES DEVIS FILTRÉS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredDevis.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#8FA99E' }}>
            <p>
              {filter === 'en_attente'
                ? 'Aucun devis en attente'
                : "Aucun devis dans l'historique"}
            </p>
          </div>
        ) : (
          filteredDevis.map((d) => {
            const statut = getStatutBadge(d.statut)
            const autreNom = type === 'prestataire' ? d.client_name : d.prestataire_nom

            return (
              <div
                key={d.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E2EBE7',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '14px' }}>
                      {autreNom}
                    </p>
                    <p style={{ fontSize: '13px', color: '#4A5E55', marginTop: '4px' }}>
                      {d.description}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A6B3C' }}>
                        {Number(d.montant).toLocaleString()} FCFA
                      </span>
                      <span
                        onClick={() => copyDevisNumber(d.numero_devis)}
                        style={{
                          fontSize: '12px',
                          color: '#1A6B3C',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#E8F5EE',
                          padding: '2px 10px',
                          borderRadius: '99px',
                          border: '1px solid #B8DCC8',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#D4EBE0'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#E8F5EE'
                        }}
                      >
                        📄 {d.numero_devis}
                        <span style={{ fontSize: '10px' }}>
                          {copiedId === d.numero_devis ? '✅ Copié !' : '📋'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      background: statut.background,
                      color: statut.color,
                      display: 'inline-block',
                    }}>
                      {statut.label}
                    </span>
                    <div style={{ fontSize: '11px', color: '#8FA99E', marginTop: '4px' }}>
                      {d.date_emission ? new Date(d.date_emission).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                </div>

                {type === 'client' && d.statut === 'en_attente' && (
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '12px',
                    borderTop: '1px solid #E2EBE7',
                    paddingTop: '12px'
                  }}>
                    <button
                      onClick={() => handleAccepter(d.id)}
                      disabled={actionLoading === d.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#1A6B3C',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        opacity: actionLoading === d.id ? 0.7 : 1,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading) e.currentTarget.style.background = '#0F4526'
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading) e.currentTarget.style.background = '#1A6B3C'
                      }}
                    >
                      {actionLoading === d.id ? '⏳...' : '✅ Accepter'}
                    </button>
                    <button
                      onClick={() => handleRefuser(d.id)}
                      disabled={actionLoading === d.id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#FDECEA',
                        color: '#D94F3D',
                        border: '1px solid #F5C6C2',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        opacity: actionLoading === d.id ? 0.7 : 1,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading) e.currentTarget.style.background = '#FCD8D4'
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading) e.currentTarget.style.background = '#FDECEA'
                      }}
                    >
                      {actionLoading === d.id ? '⏳...' : '❌ Refuser'}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}

        {hasMore && devis.length >= LIMIT && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: '12px 20px',
              background: '#E8F5EE',
              border: '1px solid #B8DCC8',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#0F4526',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              opacity: loadingMore ? 0.6 : 1,
              marginTop: '16px',
              width: '100%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) e.currentTarget.style.background = '#D4EBE0'
            }}
            onMouseLeave={(e) => {
              if (!loadingMore) e.currentTarget.style.background = '#E8F5EE'
            }}
          >
            {loadingMore ? '⏳ Chargement...' : '📤 Charger plus de devis'}
          </button>
        )}
      </div>
    </div>
  )
}
