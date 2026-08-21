// src/pages/ProfilePage.jsx
// Replaces the Firestore prestataire doc read + the `avis.liste` array-field
// review system with prestatairesService.getById() and services/avis.js
// (see api-profixgabon avisService.js). The PROVIDERS static-data fallback
// is gone — see BookingPage.jsx's header comment for why.
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import prestatairesService from '../services/prestataires'
import avisService from '../services/avis'
import messagerieService from '../services/messagerie'
import { optimizeAvatar, optimizeGallery } from '../utils/imageOptimizer'
import { SkeletonProfile } from '../components/Skeleton'
import toast from 'react-hot-toast'
import { isValidComment, sanitizeText } from '../utils/validators'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [provider, setProvider] = useState(null)
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)

  // États pour le formulaire d'avis
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [data, avisData] = await Promise.all([
          prestatairesService.getById(id),
          avisService.list(id).catch(() => []),
        ])
        setProvider({
          id: data.id,
          userId: data.user_id,
          initials: data.nom?.charAt(0) + (data.nom?.split(' ')[1]?.charAt(0) || ''),
          photo: data.photo || '',
          name: data.nom,
          role: data.categorie,
          ville: data.ville,
          rating: Number(data.rating) || 0,
          reviews: data.reviews_count || 0,
          exp: data.experience,
          available: data.available,
          about: data.description,
          skills: data.skills || [],
          galerie: data.galerie || [],
          bg: '#E8F5EE',
          emoji: '',
        })
        setAvis(avisData)
      } catch (err) {
        console.error('Erreur chargement prestataire:', err)
        setProvider(null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSubmitAvis = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour laisser un avis')
      return
    }
    if (user.id === provider?.userId) {
      toast.error('Vous ne pouvez pas vous noter vous-même')
      return
    }
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note')
      return
    }
    if (!isValidComment(comment)) {
      toast.error('Le commentaire doit faire entre 10 et 500 caractères')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const updatedAvis = await avisService.create(id, {
        note: rating,
        commentaire: sanitizeText(comment),
      })
      setAvis(updatedAvis)

      const total = updatedAvis.length
      const moyenne = total > 0 ? updatedAvis.reduce((acc, a) => acc + a.note, 0) / total : 0
      setProvider(prev => ({ ...prev, reviews: total, rating: moyenne }))

      setRating(0)
      setComment('')
      setSuccess(true)
      toast.success('Votre avis a été publié !')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      const message = err.response?.data?.message
      toast.error(message || 'Une erreur est survenue. Veuillez réessayer.')
      setError(message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }, [user, id, provider?.userId, rating, comment])

  const handleSendMessage = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté')
      navigate('/connexion')
      return
    }
    if (user.id === provider?.userId) {
      toast.error('Vous ne pouvez pas vous envoyer un message à vous-même')
      return
    }

    try {
      const conversation = await messagerieService.getOrCreateConversation(provider.userId)
      toast.success('Conversation créée !')
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Erreur création conversation:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    }
  }, [user, provider, navigate])

  if (loading) {
    return (
      <div style={{ paddingTop: '64px' }}>
        <SkeletonProfile />
      </div>
    )
  }

  if (!provider) return (
    <div style={{ padding: '100px 24px', textAlign: 'center' }}>Prestataire introuvable</div>
  )

  return (
    <div style={{ paddingTop: '64px', fontFamily: 'sans-serif' }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #0F4526, #1A6B3C)',
        padding: '48px 24px 80px',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <button onClick={() => navigate('/services')} style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '14px',
            background: 'none', border: 'none', cursor: 'pointer',
            marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>← Retour</button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '88px', height: '88px', 
              overflow: 'hidden', flexShrink: 0,
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {provider.photo
                ? <img
                    src={optimizeAvatar(provider.photo)}
                    alt={provider.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                : <span style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>{provider.initials}</span>
              }
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff' }}>{provider.name}</h1>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  background: provider.available ? '#E6F9EE' : '#FDECEA',
                  color: provider.available ? '#1A6B3C' : '#D94F3D',
                  padding: '4px 10px', 
                }}>{provider.available ? 'Disponible' : 'Occupé'}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>{provider.role}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                {provider.ville} · {provider.exp} d'expérience
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {provider.rating > 0 ? `${provider.rating.toFixed(1)} · ${provider.reviews} avis` : 'Nouveau prestataire'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: '700px', margin: '-48px auto 0', padding: '0 24px 64px' }}>
        <div style={{
          background: '#fff', 
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '1px solid #E2EBE7' }}>
            {[
              { val: provider.reviews || '0', lbl: 'Avis' },
              { val: provider.exp || '-', lbl: 'Expérience' },
            ].map((s, i) => (
              <div key={s.lbl} style={{
                padding: '20px', textAlign: 'center',
                borderRight: i < 1 ? '1px solid #E2EBE7' : 'none',
              }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F4526' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: '#8FA99E', marginTop: '3px', fontWeight: '600', textTransform: 'uppercase' }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* À PROPOS */}
          <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#8FA99E', marginBottom: '12px', letterSpacing: '0.06em' }}>À propos</p>
            <p style={{ fontSize: '14px', color: '#4A5E55', lineHeight: '1.7' }}>{provider.about}</p>
          </div>

          {/* SPÉCIALITÉS */}
          {provider.skills?.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#8FA99E', marginBottom: '12px', letterSpacing: '0.06em' }}>Spécialités</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {provider.skills.map(s => (
                  <span key={s} style={{
                    padding: '6px 14px', 
                    fontSize: '12px', fontWeight: '600',
                    background: '#E8F5EE', color: '#0F4526',
                    border: '1px solid #B8DCC8',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* GALERIE */}
          {provider.galerie?.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#8FA99E', marginBottom: '16px', letterSpacing: '0.06em' }}>Galerie de travaux</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {provider.galerie.map((img, i) => (
                  <div key={i} style={{
                    aspectRatio: '1', 
                    overflow: 'hidden', background: '#F0F7F3',
                  }}>
                    <img
                      src={optimizeGallery(img)}
                      alt={`Travail ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOCALISATION */}
          <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#8FA99E', marginBottom: '16px', letterSpacing: '0.06em' }}>Localisation</p>
            <div style={{
              background: '#F0F7F3',
              padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
              border: '1px solid #B8DCC8',
            }}>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F4526', marginBottom: '4px' }}>{provider.ville}</p>
                <p style={{ fontSize: '13px', color: '#4A5E55' }}>Gabon · Interventions à domicile</p>
                <p style={{ fontSize: '12px', color: '#8FA99E', marginTop: '4px' }}>
                  Si vous êtes dans une autre ville, discutez du déplacement avec le prestataire
                </p>
              </div>
            </div>
          </div>

          {/* AVIS EXISTANTS */}
          {avis?.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
              <p style={{
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#8FA99E',
                marginBottom: '12px',
                letterSpacing: '0.06em'
              }}>
                Avis clients ({avis.length})
              </p>
              {avis.map((a) => (
                <div key={a.id} style={{
                  padding: '14px', 
                  background: '#F7F9F8', marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{a.client_name || 'Client'}</span>
                    <span style={{ color: '#C8922A', fontSize: '13px', fontWeight: '700' }}>
                      {a.note}/5
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4A5E55', lineHeight: '1.6' }}>{a.commentaire}</p>
                  <p style={{ fontSize: '11px', color: '#8FA99E', marginTop: '4px' }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* AJOUTER UN AVIS */}
          {user && user.id !== provider.userId && (
            <div style={{ padding: '24px', borderBottom: '1px solid #E2EBE7' }}>
              <p style={{
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#8FA99E',
                marginBottom: '16px',
                letterSpacing: '0.06em'
              }}>
                Donnez votre avis
              </p>

              <div style={{
                background: '#F7F9F8',
                padding: '20px'
              }}>

                {/* Note */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4A5E55',
                    marginBottom: '8px'
                  }}>
                    Votre note <span style={{ color: '#D94F3D' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          width: '40px',
                          height: '40px',
                          fontSize: '15px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: rating >= star ? '1.5px solid #1A6B3C' : '1.5px solid #E2EBE7',
                          background: rating >= star ? '#1A6B3C' : '#fff',
                          color: rating >= star ? '#fff' : '#4A5E55',
                          transition: 'all 0.15s',
                        }}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p style={{ fontSize: '12px', color: '#1A6B3C', marginTop: '4px' }}>
                      Vous avez sélectionné {rating} sur 5
                    </p>
                  )}
                </div>

                {/* Commentaire */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4A5E55',
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    Votre commentaire <span style={{ color: '#D94F3D' }}>*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience avec ce prestataire..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px 14px',
                      border: '1.5px solid #E2EBE7',
                      fontSize: '14px',
                      fontFamily: 'sans-serif',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
                    onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: comment.length < 10 ? '#D94F3D' : '#8FA99E'
                    }}>
                      {comment.length}/10 caractères minimum
                    </span>
                    {comment.length >= 10 && (
                      <span style={{ fontSize: '12px', color: '#1A6B3C' }}>
                        OK
                      </span>
                    )}
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#FDECEA',
                    border: '1px solid #F5C6C2',
                    fontSize: '13px',
                    color: '#D94F3D',
                  }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#E8F5EE',
                    border: '1px solid #B8DCC8',
                    fontSize: '13px',
                    color: '#0F4526',
                  }}>
                    Merci ! Votre avis a été publié et la note a été mise à jour.
                  </div>
                )}

                <button
                  onClick={handleSubmitAvis}
                  disabled={rating === 0 || comment.length < 10 || submitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginTop: '12px',
                    background: rating > 0 && comment.length >= 10 ? '#1A6B3C' : '#B8DCC8',
                    color: '#fff',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: rating > 0 && comment.length >= 10 ? 'pointer' : 'not-allowed',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
                </button>

                <p style={{
                  fontSize: '11px',
                  color: '#8FA99E',
                  marginTop: '12px',
                  textAlign: 'center'
                }}>
                  Votre avis aide les autres clients à faire leur choix
                </p>
              </div>
            </div>
          )}

          {/* CTA - Réservation */}
          <div style={{ padding: '24px' }}>
            <div style={{
              background: '#E8F5EE', border: '1.5px solid #B8DCC8',
               padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '12px',
              flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F4526' }}>Prix négocié entre vous</p>
                <p style={{ fontSize: '12px', color: '#4A5E55', marginTop: '2px' }}>Un devis officiel sera généré avant la mission</p>
              </div>
              <span style={{ fontSize: '12px', color: '#1A6B3C', fontWeight: '600' }}>{provider.ville}</span>
            </div>

            <button onClick={() => navigate(`/reservation/${provider.id}`)} style={{
              width: '100%', padding: '16px',
              background: '#1A6B3C', color: '#fff',
              border: 'none', 
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              marginBottom: '10px',
              boxShadow: '0 4px 16px rgba(26,107,60,0.3)',
            }}>Demander un devis</button>

            <button
              onClick={handleSendMessage}
              style={{
                width: '100%', padding: '14px',
                background: 'transparent', color: '#1A6B3C',
                border: '1.5px solid #1A6B3C', 
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >Envoyer un message</button>
          </div>

        </div>
      </div>
    </div>
  )
}
