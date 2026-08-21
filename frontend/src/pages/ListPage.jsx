// src/pages/ListPage.jsx
// Replaces the Firestore `prestataires` query (validated == true) with
// prestatairesService.list(), which already only returns validated +
// available providers by default (see api-profixgabon prestataireService.list).
// The PROVIDERS static-data fallback is gone — see BookingPage.jsx's header
// comment for why showing fake profiles is misleading now that this is a
// real backend.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import prestatairesService from '../services/prestataires'
import { VILLES } from '../data/data'
import { SkeletonProviderList } from '../components/Skeleton'
import { motion } from 'framer-motion'
import { useDebounce } from '../hooks/useDebounce'

export default function ListPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [villeFilter, setVilleFilter] = useState('Toutes les villes')
  const [prestataires, setPrestataires] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const filters = ['Tous', 'Disponible', 'Mieux noté', 'Plomberie', 'Électricité', 'Couture', 'Nettoyage', 'Peinture']

  useEffect(() => {
    const loadPrestataires = async () => {
      setLoading(true)
      try {
        const result = await prestatairesService.list({
          ville: villeFilter !== 'Toutes les villes' ? villeFilter : undefined,
          categorie: !['Tous', 'Disponible', 'Mieux noté'].includes(activeFilter) ? activeFilter : undefined,
          search: debouncedSearch || undefined,
          limit: 100,
        })
        setPrestataires(result.prestataires.map(p => ({
          id: p.id,
          name: p.nom,
          role: p.categorie,
          ville: p.ville,
          about: p.description,
          skills: p.skills || [],
          photo: p.photo || '',
          exp: p.experience,
          available: p.available,
          rating: Number(p.rating) || 0,
          reviews: p.reviews_count || 0,
          bg: '#E8F5EE',
          emoji: '',
        })))
      } catch (err) {
        console.error('Erreur chargement prestataires:', err)
        setPrestataires([])
      }
      setLoading(false)
    }
    loadPrestataires()
  }, [villeFilter, activeFilter, debouncedSearch])

  const filtered = prestataires.filter(p => {
    // 'Disponible' / 'Mieux noté' are client-side-only refinements on top of
    // the already-fetched, already-filtered-by-ville-and-catégorie list.
    if (activeFilter === 'Disponible') return p.available
    if (activeFilter === 'Mieux noté') return p.rating >= 4.8
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ paddingTop: '64px' }}
    >

      {/* HEADER */}
      <div style={{ background: '#0F4526', padding: '40px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button onClick={() => navigate('/')} style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '14px',
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px',
          }}>← Accueil</button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                Tous les prestataires
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
                {filtered.length} professionnel{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
                {villeFilter !== 'Toutes les villes' ? ` à ${villeFilter}` : ' au Gabon'}
                {debouncedSearch && ` · "${debouncedSearch}"`}
              </p>
            </div>
          </div>

          {/* BARRE DE RECHERCHE */}
          <div style={{ marginTop: '16px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un prestataire, un service, une ville..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(255,255,255,0.2)',
                fontSize: '15px',
                outline: 'none',
                fontFamily: 'sans-serif',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2EBE7',
        padding: '12px 24px',
        position: 'sticky', top: '64px', zIndex: 50,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55' }}>Ville :</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Toutes les villes', ...VILLES].map(v => (
                <button key={v} onClick={() => setVilleFilter(v)} style={{
                  padding: '5px 14px', 
                  fontSize: '12px', fontWeight: '600', border: '1.5px solid',
                  borderColor: villeFilter === v ? '#1A6B3C' : '#E2EBE7',
                  background: villeFilter === v ? '#1A6B3C' : '#fff',
                  color: villeFilter === v ? '#fff' : '#4A5E55',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{v}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55' }}>Service :</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} style={{
                  padding: '5px 14px', 
                  fontSize: '12px', fontWeight: '600', border: '1.5px solid',
                  borderColor: activeFilter === f ? '#C8922A' : '#E2EBE7',
                  background: activeFilter === f ? '#C8922A' : '#fff',
                  color: activeFilter === f ? '#fff' : '#4A5E55',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LISTE */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {loading ? (
          <SkeletonProviderList count={6} />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '64px 24px', color: '#8FA99E' }}
          >
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#4A5E55', marginBottom: '8px' }}>
              {debouncedSearch ? `Aucun résultat pour "${debouncedSearch}"` : 'Aucun prestataire trouvé'}
            </p>
            <p style={{ fontSize: '14px' }}>
              {debouncedSearch ? 'Essayez un autre terme de recherche' : 'Essayez une autre ville ou catégorie'}
            </p>
          </motion.div>
        ) : (
          filtered.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigate(`/profil/${p.id}`)}
              style={{
                background: '#fff',
                border: '1px solid #E2EBE7',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* AVATAR */}
              <div style={{
                width: '64px', height: '64px', 
                background: p.bg || '#E8F5EE', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', overflow: 'hidden',
              }}>
                {p.photo
                  ? <img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  : <span style={{ fontSize: '20px', fontWeight: '800', color: '#0F4526' }}>{p.initials}</span>
                }
              </div>

              {/* INFOS */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '3px' }}>{p.name}</p>
                <p style={{ fontSize: '13px', color: '#4A5E55', marginBottom: '8px' }}>{p.role}</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.rating > 0 && (
                    <span style={{ fontSize: '12px', color: '#8FA99E' }}>
                      <strong style={{ color: '#111' }}>{p.rating.toFixed(1)}</strong> ({p.reviews} avis)
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#8FA99E' }}>{p.exp}</span>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    background: '#F0F7F3', color: '#1A6B3C',
                    border: '1px solid #B8DCC8',
                    padding: '2px 10px', 
                  }}>{p.ville}</span>
                </div>
              </div>

              {/* BADGES */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  background: p.available ? '#E6F9EE' : '#FDECEA',
                  color: p.available ? '#1A6B3C' : '#D94F3D',
                  padding: '4px 10px', 
                }}>{p.available ? 'Disponible' : 'Occupé'}</span>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  background: '#E8F5EE', color: '#0F4526',
                  border: '1px solid #B8DCC8',
                  padding: '4px 10px', 
                }}>Devis gratuit</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
