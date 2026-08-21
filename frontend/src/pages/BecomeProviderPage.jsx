// src/pages/BecomeProviderPage.jsx
// Replaces the direct Firestore `users`/`prestataires` doc writes with
// prestatairesService.apply() — same application-then-admin-validation flow
// as RegisterPage's prestataire path (see its header comment). `nom` isn't
// editable here (never was — the original reused the account's
// displayName); it's just sent as user.name.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import prestatairesService from '../services/prestataires'
import ImageUpload from '../components/ImageUpload'
import { uploadImage } from '../services/upload'
import { CATEGORIES, VILLES } from '../data/data'
import toast from 'react-hot-toast'

export default function BecomeProviderPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Champs du formulaire
  const [photo, setPhoto] = useState('')
  const [pieceIdentite, setPieceIdentite] = useState('')
  const [ville, setVille] = useState('')
  const [categorie, setCategorie] = useState('')
  const [description, setDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [galerie, setGalerie] = useState([])

  useEffect(() => {
    if (!user) { navigate('/connexion'); return }
    if (user.type === 'prestataire') { navigate('/compte'); return }
  }, [user, navigate])

  const handleGalerieUpload = (url) => {
    setGalerie(prev => [...prev, url].slice(0, 4))
  }

  const handleIdUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingId(true)
    try {
      const url = await uploadImage(file, 'identite')
      setPieceIdentite(url)
    } catch {
      toast.error("Erreur lors de l'envoi du document")
    } finally {
      setUploadingId(false)
    }
  }

  const handleSubmit = async () => {
    if (!categorie || !ville || !description || !experience || !pieceIdentite) {
      toast.error("Veuillez remplir tous les champs obligatoires et ajouter votre pièce d'identité")
      return
    }
    setLoading(true)
    try {
      await prestatairesService.apply({
        nom: user.name,
        ville,
        categorie,
        description,
        experience,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        photo,
        galerie,
        pieceIdentite,
      })
      await refreshUser()
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi de la candidature")
    }
    setLoading(false)
  }

  const STEPS = ['Infos de base', 'Votre service', 'Portfolio']

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '48px 24px',
        fontFamily: 'sans-serif',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>
          Demande envoyée !
        </h2>
        <p style={{ fontSize: '15px', color: '#4A5E55', maxWidth: '420px', lineHeight: '1.6', marginBottom: '8px' }}>
          Votre demande pour devenir prestataire a été soumise avec succès.
        </p>
        <p style={{ fontSize: '14px', color: '#8FA99E', maxWidth: '420px', lineHeight: '1.6', marginBottom: '32px' }}>
          Notre équipe va vérifier vos informations et valider votre profil sous 24-48h.
        </p>
        <button onClick={() => navigate('/')} style={{
          padding: '14px 28px', 
          background: '#1A6B3C', color: '#fff',
          border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
        }}>Retour à l'accueil</button>
      </div>
    )
  }

  const cardStyle = {
    background: '#fff', border: '1px solid #E2EBE7',
     overflow: 'hidden', marginBottom: '16px',
  }
  const headerStyle = {
    padding: '16px 20px', borderBottom: '1px solid #E2EBE7',
    fontSize: '14px', fontWeight: '700', background: '#F7F9F8',
    display: 'flex', alignItems: 'center', gap: '8px',
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #E2EBE7', 
    fontSize: '14px', fontFamily: 'sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ paddingTop: '64px', background: '#F7F9F8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* BACK */}
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/compte')} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#4A5E55', fontSize: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: '20px',
        }}>← {step > 1 ? 'Étape précédente' : 'Retour au compte'}</button>

        {/* TITRE */}
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>
          Devenir prestataire
        </h1>
        <p style={{ fontSize: '14px', color: '#4A5E55', marginBottom: '28px' }}>
          Rejoignez nos professionnels vérifiés sur ProFixGabon
        </p>

        {/* PROGRESS */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', 
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

        {/* ══════ ÉTAPE 1 — INFOS DE BASE ══════ */}
        {step === 1 && (
          <>
            <div style={cardStyle}>
              <div style={headerStyle}>Vos informations de base</div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Pièce d'identité */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', marginBottom: '6px' }}>
                    Pièce d'identité <span style={{ color: '#D94F3D' }}>*</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#8FA99E', marginBottom: '10px' }}>
                    CNI, passeport ou permis de conduire — visible uniquement par notre équipe
                  </p>
                  {pieceIdentite ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#E8F5EE', border: '1px solid #B8DCC8',
                       padding: '10px 14px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F4526' }}>Document uploadé</p>
                        <p style={{ fontSize: '11px', color: '#4A5E55' }}>Votre pièce d'identité a été envoyée</p>
                      </div>
                      <button onClick={() => setPieceIdentite('')} style={{
                        background: 'none', border: 'none', color: '#D94F3D',
                        cursor: 'pointer', fontSize: '18px',
                      }}>×</button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      border: '2px dashed #E2EBE7', 
                      padding: '16px', cursor: 'pointer',
                      background: '#F7F9F8', opacity: uploadingId ? 0.6 : 1,
                    }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
                          {uploadingId ? 'Envoi en cours...' : 'Ajouter votre pièce d\'identité'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#8FA99E' }}>JPG ou PNG · Max 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingId}
                        onChange={handleIdUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', marginBottom: '10px' }}>
                    Photo de profil
                  </p>
                  <ImageUpload onUpload={setPhoto} label="Ajouter photo" />
                </div>

                {/* Ville */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Votre ville
                  </label>
                  <select value={ville} onChange={e => setVille(e.target.value)} style={{...inputStyle, background: '#fff'}}>
                    <option value="">Sélectionner votre ville</option>
                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Expérience */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Années d'expérience
                  </label>
                  <select value={experience} onChange={e => setExperience(e.target.value)} style={{...inputStyle, background: '#fff'}}>
                    <option value="">Sélectionner</option>
                    {['Moins d\'1 an', '1-2 ans', '3-5 ans', '5-10 ans', 'Plus de 10 ans'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => ville && experience && setStep(2)}
              style={{
                width: '100%', padding: '16px',
                background: ville && experience ? '#1A6B3C' : '#B8DCC8',
                color: '#fff', border: 'none', 
                fontSize: '15px', fontWeight: '700',
                cursor: ville && experience ? 'pointer' : 'not-allowed',
              }}>
              Continuer →
            </button>
          </>
        )}

        {/* ══════ ÉTAPE 2 — VOTRE SERVICE ══════ */}
        {step === 2 && (
          <>
            <div style={cardStyle}>
              <div style={headerStyle}>Votre service</div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Catégorie */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '10px' }}>
                    Catégorie de service
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                    {CATEGORIES.slice(0, 16).map(c => (
                      <div key={c.label} onClick={() => setCategorie(c.label)} style={{
                        padding: '10px 8px',  cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: categorie === c.label ? '#1A6B3C' : '#E2EBE7',
                        background: categorie === c.label ? '#E8F5EE' : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        textAlign: 'center',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: categorie === c.label ? '#0F4526' : '#4A5E55' }}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Décrivez votre service
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex : Plombier professionnel avec 5 ans d'expérience, spécialisé dans les fuites d'eau et l'installation sanitaire..."
                    style={{
                      ...inputStyle, minHeight: '120px',
                      resize: 'vertical', lineHeight: '1.6',
                    }}
                    onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                    onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                  />
                  <p style={{ fontSize: '12px', color: description.length < 30 ? '#D94F3D' : '#8FA99E', marginTop: '4px' }}>
                    {description.length} caractères {description.length < 30 ? '(minimum 30)' : '✓'}
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Spécialités <span style={{ fontWeight: '400', color: '#8FA99E' }}>(séparées par des virgules)</span>
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="Ex : Fuites d'eau, Chauffe-eau, Sanitaires, Urgences"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                    onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                  />
                  {skills && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {skills.split(',').map((s, i) => s.trim() && (
                        <span key={i} style={{
                          padding: '4px 10px', 
                          fontSize: '11px', fontWeight: '600',
                          background: '#E8F5EE', color: '#0F4526',
                          border: '1px solid #B8DCC8',
                        }}>{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => categorie && description.length >= 30 && setStep(3)}
              style={{
                width: '100%', padding: '16px',
                background: categorie && description.length >= 30 ? '#1A6B3C' : '#B8DCC8',
                color: '#fff', border: 'none', 
                fontSize: '15px', fontWeight: '700',
                cursor: categorie && description.length >= 30 ? 'pointer' : 'not-allowed',
              }}>
              Continuer →
            </button>
          </>
        )}

        {/* ══════ ÉTAPE 3 — PORTFOLIO ══════ */}
        {step === 3 && (
          <>
            <div style={cardStyle}>
              <div style={headerStyle}>
                Photos de vos travaux
                <span style={{ fontSize: '12px', color: '#8FA99E', fontWeight: '400' }}>(optionnel · max 4)</span>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: '#4A5E55', marginBottom: '16px' }}>
                  Ajoutez des photos de vos réalisations pour inspirer confiance aux clients.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {galerie.map((url, i) => (
                    <div key={i} style={{
                      aspectRatio: '1', 
                      overflow: 'hidden', position: 'relative',
                      border: '1px solid #E2EBE7',
                    }}>
                      <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setGalerie(prev => prev.filter((_, j) => j !== i))} style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '24px', height: '24px', 
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        border: 'none', cursor: 'pointer', fontSize: '14px',
                      }}>×</button>
                    </div>
                  ))}
                  {galerie.length < 4 && (
                    <ImageUpload onUpload={handleGalerieUpload} label="Ajouter" folder="galerie" />
                  )}
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div style={cardStyle}>
              <div style={headerStyle}>Récapitulatif</div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Ville', val: ville },
                  { label: 'Catégorie', val: categorie },
                  { label: 'Expérience', val: experience },
                  { label: 'Spécialités', val: skills || 'Non renseigné' },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #E2EBE7',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#4A5E55' }}>{r.label}</span>
                    <span style={{ fontWeight: '600', maxWidth: '200px', textAlign: 'right' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice validation */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              background: '#FDF3E3', border: '1px solid #E8C97A',
               padding: '14px 16px', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#7A5C1A', lineHeight: '1.6' }}>
                Votre profil sera examiné par notre équipe sous <strong>24-48h</strong> avant d'être publié sur la plateforme.
              </p>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '16px',
              background: '#1A6B3C', color: '#fff',
              border: 'none', 
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(26,107,60,0.3)',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Envoi en cours...' : 'Soumettre ma candidature'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
