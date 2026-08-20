// src/components/DemandesList.jsx
// Replaces Firestore cursor-based pagination (lastVisible/startAfter) with
// the backend's page/limit pagination — see services/demandes.js.
import { useState, useEffect, useCallback } from 'react'
import demandesService from '../services/demandes'
import CreerDevisModal from './CreerDevisModal'

export default function DemandesList({ type }) {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showDevisModal, setShowDevisModal] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState(null)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 20

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const result = await demandesService.list({ page: 1, limit: LIMIT, as: type === 'prestataire' ? 'prestataire' : undefined })
      setDemandes(result.demandes)
      setPage(1)
      setHasMore(result.demandes.length < result.total)
    } catch (err) {
      console.error('❌ Erreur chargement demandes:', err)
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
      const result = await demandesService.list({ page: nextPage, limit: LIMIT, as: type === 'prestataire' ? 'prestataire' : undefined })
      setDemandes(prev => [...prev, ...result.demandes])
      setPage(nextPage)
      setHasMore(demandes.length + result.demandes.length < result.total)
    } catch (err) {
      console.error('❌ Erreur chargement plus de demandes:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleCreerDevis = (demande) => {
    setSelectedDemande(demande)
    setShowDevisModal(true)
  }

  const handleDevisSuccess = () => {
    setShowDevisModal(false)
    setSelectedDemande(null)
    loadInitial()
  }

  const getStatutBadge = (statut) => {
    const styles = {
      'en_attente': { background: '#FDF3E3', color: '#7A5C1A', label: '⏳ En attente' },
      'devis_envoye': { background: '#E8F5EE', color: '#0F4526', label: '📄 Devis envoyé' },
      'accepte': { background: '#E8F5EE', color: '#0F4526', label: '✅ Accepté' },
      'refuse': { background: '#FDECEA', color: '#D94F3D', label: '❌ Refusé' }
    }
    return styles[statut] || styles['en_attente']
  }

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
        <p>Chargement des demandes...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (demandes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8FA99E' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#4A5E55' }}>
          {type === 'prestataire' ? 'Aucune demande reçue' : 'Aucune demande envoyée'}
        </p>
        <p style={{ fontSize: '13px' }}>
          {type === 'prestataire'
            ? 'Les clients vous enverront des demandes ici'
            : 'Envoyez une demande à un prestataire pour commencer'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {demandes.map((demande) => {
          const statut = getStatutBadge(demande.statut)
          const isPrestataire = type === 'prestataire'
          const peutCreerDevis = isPrestataire && demande.statut === 'en_attente'

          return (
            <div
              key={demande.id}
              style={{
                background: '#fff',
                border: '1px solid #E2EBE7',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F7F9F8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '14px' }}>
                    {type === 'prestataire' ? demande.client_name : demande.prestataire_nom}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4A5E55', marginTop: '4px', whiteSpace: 'pre-line' }}>
                    {demande.description?.slice(0, 150)}
                    {demande.description?.length > 150 && '...'}
                  </p>
                  {demande.categorie && (
                    <span style={{ fontSize: '12px', color: '#8FA99E' }}>🔧 {demande.categorie}</span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    background: statut.background,
                    color: statut.color,
                    display: 'inline-block'
                  }}>
                    {statut.label}
                  </span>
                  <div style={{ fontSize: '11px', color: '#8FA99E', marginTop: '4px' }}>
                    {demande.created_at ? new Date(demande.created_at).toLocaleDateString('fr-FR') : ''}
                  </div>
                </div>
              </div>

              {/* BOUTON CRÉER UN DEVIS (pour prestataire) */}
              {peutCreerDevis && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #E2EBE7', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleCreerDevis(demande)}
                    style={{
                      padding: '8px 16px',
                      background: '#1A6B3C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0F4526'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#1A6B3C'}
                  >
                    📄 Créer un devis
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {hasMore && demandes.length >= LIMIT && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: '12px 20px',
              background: '#EEF0FD',
              border: '1px solid #C8CEE8',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#3C3489',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              opacity: loadingMore ? 0.6 : 1,
              marginTop: '16px',
              width: '100%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) e.currentTarget.style.background = '#DDE1F5'
            }}
            onMouseLeave={(e) => {
              if (!loadingMore) e.currentTarget.style.background = '#EEF0FD'
            }}
          >
            {loadingMore ? '⏳ Chargement...' : '📤 Charger plus de demandes'}
          </button>
        )}
      </div>

      {/* Modale de création de devis */}
      {showDevisModal && selectedDemande && (
        <CreerDevisModal
          demande={selectedDemande}
          onClose={() => {
            setShowDevisModal(false)
            setSelectedDemande(null)
          }}
          onSuccess={handleDevisSuccess}
        />
      )}
    </>
  )
}
