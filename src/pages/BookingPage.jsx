// src/pages/BookingPage.jsx
// Replaces the Firestore prestataire lookup + `demandes` collection write.
//
// Two schema gaps vs the old Firestore shape, both deliberate simplifications
// rather than silent drops:
// - demandes has no date/time columns on the new backend (see
//   api-profixgabon's demandeService.create), so the chosen day/time is
//   folded into the description text instead of a separate field.
// - demandes has no photos column, and the old "photo" step never actually
//   uploaded anything anywhere — it stored local blob: URLs straight into
//   Firestore, which only resolve in the browser tab that created them and
//   are dead links for the prestataire viewing the request. Dropped rather
//   than reproduced.
//
// The PROVIDERS static-data fallback is also gone — showing a fake profile
// a user could "book" when the backend has no real data would be
// misleading now that this actually hits a real API.
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import prestatairesService from '../services/prestataires'
import demandesService from '../services/demandes'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { isValidDescription, sanitizeText } from '../utils/validators'

export default function BookingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const times = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  const disabledTimes = ['08:00', '09:00', '16:00']
  const days = Array.from({ length: 30 }, (_, i) => i + 1)

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const data = await prestatairesService.getById(id)
        setProvider({
          id: data.id,
          name: data.nom,
          role: data.categorie,
          ville: data.ville,
          photo: data.photo || '',
          available: data.available,
        })
      } catch (err) {
        console.error('Erreur chargement prestataire:', err)
        setProvider(null)
      }
      setLoading(false)
    }
    loadProvider()
  }, [id])

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour envoyer une demande')
      navigate('/connexion')
      return
    }

    if (!isValidDescription(description)) {
      toast.error('La description doit faire au moins 10 caractères')
      return
    }

    if (!selectedDay || !selectedTime) {
      toast.error('Veuillez sélectionner une date et une heure')
      return
    }

    setSubmitting(true)
    try {
      const scheduleNote = `Disponibilité souhaitée : ${selectedDay} juin 2026 à ${selectedTime}`
      const fullDescription = sanitizeText(`${scheduleNote}\n\n${description}`)

      await demandesService.create({
        prestataireId: provider.id,
        categorie: provider.role,
        description: fullDescription,
      })
      toast.success('✅ Demande envoyée avec succès !')
      setSubmitted(true)
    } catch (error) {
      console.error('Erreur envoi demande:', error)
      toast.error(error.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (!provider) return (
    <div style={{ padding: '100px 24px', textAlign: 'center' }}>Prestataire introuvable</div>
  )

  if (submitted) {
    return (
      <div style={{
        paddingTop: '64px', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '48px 24px',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#E8F5EE', border: '2px solid #B8DCC8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', marginBottom: '24px',
        }}>✅</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Demande envoyée !</h2>
        <p style={{ fontSize: '15px', color: '#4A5E55', maxWidth: '420px', lineHeight: '1.6', marginBottom: '8px' }}>
          Votre demande a bien été transmise à <strong>{provider.name}</strong>.
        </p>
        <p style={{ fontSize: '14px', color: '#8FA99E', maxWidth: '420px', lineHeight: '1.6', marginBottom: '32px' }}>
          Il vous contactera pour convenir du prix et valider le devis avant de commencer la mission.
        </p>
        <button onClick={() => navigate('/')} style={{
          padding: '14px 28px', borderRadius: '12px',
          background: '#1A6B3C', color: '#fff',
          border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
        }}>🏠 Retour à l'accueil</button>
      </div>
    )
  }

  const STEPS = ['Date & heure', 'Description', 'Confirmation']

  const cardStyle = {
    background: '#fff', border: '1px solid #E2EBE7',
    borderRadius: '18px', overflow: 'hidden', marginBottom: '16px',
  }
  const cardHeaderStyle = {
    padding: '16px 20px', borderBottom: '1px solid #E2EBE7',
    fontSize: '14px', fontWeight: '700',
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#F7F9F8',
  }

  return (
    <div style={{ paddingTop: '64px', fontFamily: 'sans-serif', background: '#F7F9F8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '32px 24px 64px' }}>

        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(`/profil/${provider.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#4A5E55', fontSize: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: '20px',
        }}>← {step > 1 ? 'Étape précédente' : 'Retour au profil'}</button>

        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Réserver une intervention</h1>
        <p style={{ fontSize: '14px', color: '#4A5E55', marginBottom: '28px' }}>
          avec <strong>{provider.name}</strong> · 📍 {provider.ville}
        </p>

        {/* PROGRESS */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700',
                  background: i + 1 < step ? '#1A6B3C' : '#fff',
                  border: i + 1 <= step ? '2px solid #1A6B3C' : '2px solid #E2EBE7',
                  color: i + 1 < step ? '#fff' : i + 1 === step ? '#1A6B3C' : '#8FA99E',
                }}>{i + 1 < step ? '✓' : i + 1}</div>
                <span style={{
                  fontSize: '10px', fontWeight: '600', textAlign: 'center',
                  color: i + 1 <= step ? '#1A6B3C' : '#8FA99E',
                }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', marginBottom: '18px',
                  background: i + 1 < step ? '#1A6B3C' : '#E2EBE7',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ÉTAPE 1 — DATE & HEURE */}
        {step === 1 && (
          <>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📅 Choisissez une date</div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2EBE7', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                  <span style={{ fontSize: '15px', fontWeight: '700' }}>Juin 2026</span>
                  <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2EBE7', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px' }}>
                  {['L','M','M','J','V','S','D'].map((d, i) => (
                    <div key={i} style={{ fontSize: '11px', fontWeight: '700', color: '#8FA99E', padding: '8px 0' }}>{d}</div>
                  ))}
                  {Array(6).fill(null).map((_, i) => <div key={`e${i}`} />)}
                  {days.map(d => (
                    <div key={d} onClick={() => setSelectedDay(d)} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', borderRadius: '8px', cursor: 'pointer',
                      background: d === selectedDay ? '#1A6B3C' : 'transparent',
                      color: d === selectedDay ? '#fff' : '#111',
                      fontWeight: d === selectedDay ? '700' : '400',
                    }}>{d}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardHeaderStyle}>🕐 Choisissez un créneau</div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {times.map(t => (
                    <div key={t} onClick={() => !disabledTimes.includes(t) && setSelectedTime(t)} style={{
                      padding: '10px', borderRadius: '10px', textAlign: 'center',
                      fontSize: '13px', fontWeight: '600',
                      cursor: disabledTimes.includes(t) ? 'not-allowed' : 'pointer',
                      border: '1.5px solid',
                      borderColor: selectedTime === t && !disabledTimes.includes(t) ? '#1A6B3C' : '#E2EBE7',
                      background: selectedTime === t && !disabledTimes.includes(t) ? '#1A6B3C' : '#fff',
                      color: selectedTime === t && !disabledTimes.includes(t) ? '#fff' : disabledTimes.includes(t) ? '#ccc' : '#4A5E55',
                      opacity: disabledTimes.includes(t) ? 0.4 : 1,
                    }}>{t}</div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#8FA99E', marginTop: '12px' }}>🔴 Créneaux grisés = déjà réservés</p>
              </div>
            </div>

            <button onClick={() => selectedDay && selectedTime && setStep(2)} style={{
              width: '100%', padding: '16px',
              background: selectedDay && selectedTime ? '#1A6B3C' : '#B8DCC8',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700',
              cursor: selectedDay && selectedTime ? 'pointer' : 'not-allowed',
            }}>
              {selectedDay && selectedTime ? 'Continuer →' : 'Sélectionnez une date et un créneau'}
            </button>
          </>
        )}

        {/* ÉTAPE 2 — DESCRIPTION */}
        {step === 2 && (
          <>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📝 Décrivez votre problème</div>
              <div style={{ padding: '20px' }}>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex : J'ai une fuite sous l'évier depuis 2 jours..."
                  style={{
                    width: '100%', minHeight: '140px',
                    border: '1.5px solid #E2EBE7', borderRadius: '12px',
                    padding: '14px', fontSize: '14px',
                    fontFamily: 'sans-serif', outline: 'none',
                    resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                  onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: description.length < 20 ? '#D94F3D' : '#8FA99E' }}>
                    {description.length} caractères {description.length < 20 ? '(minimum 20)' : '✓'}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={() => description.length >= 20 && setStep(3)} style={{
              width: '100%', padding: '16px',
              background: description.length >= 20 ? '#1A6B3C' : '#B8DCC8',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700',
              cursor: description.length >= 20 ? 'pointer' : 'not-allowed',
            }}>
              {description.length >= 20 ? 'Continuer →' : 'Décrivez votre problème (min. 20 caractères)'}
            </button>
          </>
        )}

        {/* ÉTAPE 3 — RÉCAPITULATIF */}
        {step === 3 && (
          <>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>📋 Récapitulatif de votre demande</div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: '#F7F9F8', borderRadius: '12px' }}>
                  {provider.photo
                    ? <img src={provider.photo} alt={provider.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                    : <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#0F4526' }}>
                        {provider.name?.charAt(0)}
                      </div>
                  }
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700' }}>{provider.name}</p>
                    <p style={{ fontSize: '12px', color: '#4A5E55' }}>{provider.role} · 📍 {provider.ville}</p>
                  </div>
                </div>

                {[
                  { label: '📅 Date', val: `${selectedDay} juin 2026` },
                  { label: '🕐 Heure', val: selectedTime },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid #E2EBE7', fontSize: '14px',
                  }}>
                    <span style={{ color: '#4A5E55' }}>{r.label}</span>
                    <span style={{ fontWeight: '600' }}>{r.val}</span>
                  </div>
                ))}

                <div style={{ padding: '12px 0' }}>
                  <p style={{ fontSize: '13px', color: '#4A5E55', marginBottom: '6px', fontWeight: '600' }}>📝 Description</p>
                  <p style={{ fontSize: '13px', color: '#111', lineHeight: '1.6', background: '#F7F9F8', padding: '10px', borderRadius: '8px' }}>{description}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #E2EBE7' }}>
                  <span style={{ fontSize: '14px', color: '#4A5E55' }}>💰 Montant</span>
                  <span style={{
                    background: '#E8F5EE', color: '#0F4526',
                    border: '1px solid #B8DCC8',
                    padding: '4px 12px', borderRadius: '99px',
                    fontSize: '12px', fontWeight: '700',
                  }}>À négocier</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              background: '#FDF3E3', border: '1px solid #E8C97A',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
            }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <p style={{ fontSize: '13px', color: '#7A5C1A', lineHeight: '1.6' }}>
                Un devis officiel sera généré et signé par les deux parties avant le début de la mission.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '16px',
                background: submitting ? '#B8DCC8' : '#1A6B3C',
                color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(26,107,60,0.3)',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? '⏳ Envoi en cours...' : '📤 Envoyer la demande'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
