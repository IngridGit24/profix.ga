// src/pages/RegisterPage.jsx
// Replaces createUserWithEmailAndPassword/signInWithPopup + direct Firestore
// setDoc('users'/'prestataires') with the new backend.
//
// Every account is created as a plain client (authService.register never
// accepts a `type` — see its doc comment). Choosing "Proposer un service"
// no longer writes a prestataire doc directly; it registers the client
// account, then submits a prestataire *application* via
// prestatairesService.apply(), which lands as unvalidated and only becomes
// a real prestataire once an admin calls validate() — see AdminPage.
//
// Flow detail: for a prestataire signup, the client account is created
// right after step 2 (not at the very end) because step 4's ID-document
// upload needs an authenticated request — see handleStep2Continue's
// comment. The client path is unchanged: account creation still waits for
// the review/confirm step.
//
// Google sign-in is gone (no OAuth flow on the new backend yet, same as
// LoginPage). The ID-document upload now goes through services/upload.js
// (signed Cloudinary request) instead of posting straight to Cloudinary
// with an unsigned upload_preset.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { VILLES, CATEGORIES } from '../data/data'
import { isValidEmail, isStrongPassword, isValidName, isValidDescription, sanitizeText } from '../utils/validators'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'
import prestatairesService from '../services/prestataires'
import { uploadImage } from '../services/upload'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [userType, setUserType] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [ville, setVille] = useState('')
  const [categorie, setCategorie] = useState('')
  const [experience, setExperience] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [pieceIdentite, setPieceIdentite] = useState('')

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

  const registerFailed = (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message
    if (status === 409) {
      toast.error('Cet email est déjà utilisé')
      setError('Cet email est déjà utilisé')
    } else {
      toast.error(message || "Erreur lors de l'inscription")
      setError(message || "Erreur lors de l'inscription")
    }
    setLoading(false)
  }

  /**
   * Step 2 "Continuer". For a client this only validates and moves to the
   * review step — the account isn't created until they confirm there.
   *
   * For a prestataire it actually creates the (client) account right away.
   * That's not just cosmetic: step 4's ID-document upload needs a JWT
   * (services/upload.js asks the backend for a signed Cloudinary request,
   * and that endpoint requires auth — see uploadRoutes.js), so the account
   * has to exist before the user can get there. A user who abandons the
   * wizard after this point still ends up with a working client account —
   * that's fine, they can finish applying later from BecomeProviderPage.
   */
  const handleStep2Continue = async () => {
    if (!nom || !email || !password || !confirm) {
      toast.error('Remplissez tous les champs')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (!isStrongPassword(password)) {
      toast.error('Mot de passe trop faible (8+ car., majuscule, minuscule, chiffre)')
      return
    }
    setError('')

    if (userType === 'client') {
      setStep('confirm')
      return
    }

    setLoading(true)
    try {
      await authService.register({ name: nom, email, password })
      await refreshUser()
      setStep(3)
    } catch (err) {
      registerFailed(err)
      return
    }
    setLoading(false)
  }

  /** Client-only: the account is created here, on final confirmation. */
  const handleClientConfirm = async () => {
    if (!isValidName(nom) || !isValidEmail(email)) return
    setLoading(true)
    setError('')
    try {
      await authService.register({ name: nom, email, password })
      await refreshUser()
      toast.success('✅ Compte client créé avec succès !')
      navigate('/')
    } catch (err) {
      registerFailed(err)
    }
  }

  /** Prestataire-only: account already exists (see handleStep2Continue) — this only submits the application. */
  const handleProviderApply = async () => {
    if (!isValidDescription(description)) {
      toast.error('La description doit faire au moins 10 caractères')
      return
    }
    if (!pieceIdentite) {
      toast.error("La pièce d'identité est obligatoire")
      return
    }
    setLoading(true)
    setError('')
    try {
      await prestatairesService.apply({
        nom,
        categorie,
        ville,
        description: sanitizeText(description),
        experience,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        pieceIdentite,
      })
      toast.success('✅ Demande de prestataire envoyée !')
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.message
      toast.error(message || "Erreur lors de l'envoi de la candidature")
      setError(message || "Erreur lors de l'envoi de la candidature")
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #E2EBE7', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  const STEPS_PROVIDER = ['Type', 'Infos', 'Service', 'Identité']
  const STEPS_CLIENT = ['Type', 'Infos', 'Confirmation']

  const currentStepIndex = step === 'confirm' ? 2 : step - 1

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F7F9F8',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div onClick={() => navigate('/')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#1A6B3C', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
            }}>🔧</div>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F4526' }}>ProFixGabon</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', marginTop: '12px', marginBottom: '4px' }}>Créer un compte</h1>
          <p style={{ fontSize: '14px', color: '#4A5E55' }}>Rejoignez la communauté ProFixGabon</p>
        </div>

        {/* PROGRESS */}
        {userType && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            {(userType === 'prestataire' ? STEPS_PROVIDER : STEPS_CLIENT).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700',
                    background: i < currentStepIndex ? '#1A6B3C' : '#fff',
                    border: i <= currentStepIndex ? '2px solid #1A6B3C' : '2px solid #E2EBE7',
                    color: i < currentStepIndex ? '#fff' : i === currentStepIndex ? '#1A6B3C' : '#8FA99E',
                  }}>{i < currentStepIndex ? '✓' : i + 1}</div>
                  <span style={{
                    fontSize: '9px', fontWeight: '600', textAlign: 'center',
                    color: i <= currentStepIndex ? '#1A6B3C' : '#8FA99E',
                    maxWidth: '60px',
                  }}>{s}</span>
                </div>
                {i < (userType === 'prestataire' ? STEPS_PROVIDER : STEPS_CLIENT).length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', marginBottom: '16px',
                    background: i < currentStepIndex ? '#1A6B3C' : '#E2EBE7',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: '20px',
          padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #E2EBE7',
        }}>

          {/* ══════ ÉTAPE 1 — TYPE DE COMPTE ══════ */}
          {step === 1 && (
            <>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#4A5E55', marginBottom: '16px' }}>
                Je souhaite :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[
                  { val: 'client', icon: '👤', titre: 'Trouver un service', desc: 'Je cherche un professionnel' },
                  { val: 'prestataire', icon: '🔧', titre: 'Proposer un service', desc: 'Je suis un professionnel' },
                ].map(t => (
                  <div key={t.val} onClick={() => setUserType(t.val)} style={{
                    padding: '20px 16px', borderRadius: '14px', cursor: 'pointer',
                    border: '2px solid',
                    borderColor: userType === t.val ? '#1A6B3C' : '#E2EBE7',
                    background: userType === t.val ? '#E8F5EE' : '#fff',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icon}</div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: userType === t.val ? '#0F4526' : '#111', marginBottom: '4px' }}>{t.titre}</p>
                    <p style={{ fontSize: '11px', color: '#8FA99E' }}>{t.desc}</p>
                  </div>
                ))}
              </div>

              {userType === 'prestataire' && (
                <div style={{
                  background: '#FDF3E3', border: '1px solid #E8C97A',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
                }}>
                  <p style={{ fontSize: '12px', color: '#7A5C1A', lineHeight: '1.6' }}>
                    ⚠️ Votre profil sera examiné par notre équipe avant d'être publié. Vous aurez accès à la plateforme en tant que client en attendant.
                  </p>
                </div>
              )}

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #F5C6C2',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#D94F3D', marginBottom: '16px',
                }}>⚠️ {error}</div>
              )}

              <button onClick={() => {
                if (!userType) { setError('Choisissez un type de compte'); return }
                setError('')
                setStep(2)
              }} style={{
                width: '100%', padding: '14px',
                background: userType ? '#1A6B3C' : '#B8DCC8',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700',
                cursor: userType ? 'pointer' : 'not-allowed',
              }}>Continuer →</button>
            </>
          )}

          {/* ══════ ÉTAPE 2 — INFOS PERSONNELLES ══════ */}
          {step === 2 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Nom complet', val: nom, set: setNom, type: 'text', placeholder: 'Jean-Pierre Mboua' },
                  { label: 'Email', val: email, set: setEmail, type: 'email', placeholder: 'votre@email.com' },
                  { label: 'Mot de passe', val: password, set: setPassword, type: 'password', placeholder: '••••••••' },
                  { label: 'Confirmer le mot de passe', val: confirm, set: setConfirm, type: 'password', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder} required style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                      onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#8FA99E', marginTop: '8px' }}>
                8 caractères minimum, avec majuscule, minuscule et chiffre.
              </p>

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #F5C6C2',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#D94F3D', marginTop: '16px',
                }}>⚠️ {error}</div>
              )}

              <button onClick={handleStep2Continue} disabled={loading} style={{
                width: '100%', padding: '14px', marginTop: '20px',
                background: '#1A6B3C', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}>
                Continuer →
              </button>
            </>
          )}

          {/* ══════ ÉTAPE CONFIRMATION CLIENT ══════ */}
          {step === 'confirm' && userType === 'client' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>👤</div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Confirmer votre compte</h3>
                <p style={{ fontSize: '13px', color: '#4A5E55', lineHeight: '1.6' }}>
                  Vérifiez vos informations avant de créer votre compte
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Nom', val: nom },
                  { label: 'Email', val: email },
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
              </div>

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #F5C6C2',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#D94F3D', marginBottom: '16px',
                }}>⚠️ {error}</div>
              )}

              <button onClick={handleClientConfirm} disabled={loading} style={{
                width: '100%', padding: '14px',
                background: '#1A6B3C', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: '10px',
              }}>
                {loading ? 'Création du compte...' : '🚀 Créer mon compte'}
              </button>

              <button onClick={() => setStep(2)} style={{
                width: '100%', padding: '12px',
                background: 'transparent', color: '#4A5E55',
                border: '1.5px solid #E2EBE7', borderRadius: '12px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>← Modifier mes infos</button>
            </>
          )}

          {/* ══════ ÉTAPE 3 — SERVICE (PRESTATAIRE) ══════ */}
          {step === 3 && userType === 'prestataire' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Ville <span style={{ color: '#D94F3D' }}>*</span>
                  </label>
                  <select value={ville} onChange={e => setVille(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                    <option value="">Sélectionner votre ville</option>
                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '10px' }}>
                    Catégorie <span style={{ color: '#D94F3D' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                    {CATEGORIES.slice(0, 12).map(c => (
                      <div key={c.label} onClick={() => setCategorie(c.label)} style={{
                        padding: '8px', borderRadius: '10px', cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: categorie === c.label ? '#1A6B3C' : '#E2EBE7',
                        background: categorie === c.label ? '#E8F5EE' : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      }}>
                        <span style={{ fontSize: '18px' }}>{c.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: '600', textAlign: 'center', color: categorie === c.label ? '#0F4526' : '#4A5E55' }}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Expérience <span style={{ color: '#D94F3D' }}>*</span>
                  </label>
                  <select value={experience} onChange={e => setExperience(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                    <option value="">Sélectionner</option>
                    {['Moins d\'1 an', '1-2 ans', '3-5 ans', '5-10 ans', 'Plus de 10 ans'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Description <span style={{ color: '#D94F3D' }}>*</span>
                  </label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez votre service et votre expérience..."
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: '1.6' }}
                    onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                    onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
                    Spécialités <span style={{ fontSize: '11px', fontWeight: '400', color: '#8FA99E' }}>(séparées par des virgules)</span>
                  </label>
                  <input type="text" value={skills} onChange={e => setSkills(e.target.value)}
                    placeholder="Ex : Fuites d'eau, Chauffe-eau, Urgences"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1A6B3C'}
                    onBlur={e => e.target.style.borderColor = '#E2EBE7'}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #F5C6C2',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#D94F3D', marginTop: '12px',
                }}>⚠️ {error}</div>
              )}

              <button onClick={() => {
                if (!ville || !categorie || !experience || !description) {
                  toast.error('Remplissez tous les champs obligatoires')
                  return
                }
                setError('')
                setStep(4)
              }} style={{
                width: '100%', padding: '14px', marginTop: '20px',
                background: '#1A6B3C', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              }}>Continuer →</button>
            </>
          )}

          {/* ══════ ÉTAPE 4 — PIÈCE D'IDENTITÉ (PRESTATAIRE) ══════ */}
          {step === 4 && userType === 'prestataire' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🪪</div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Pièce d'identité</h3>
                <p style={{ fontSize: '13px', color: '#4A5E55', lineHeight: '1.6' }}>
                  Obligatoire pour vérifier votre identité. Visible uniquement par notre équipe.
                </p>
              </div>

              {pieceIdentite ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#E8F5EE', border: '1px solid #B8DCC8',
                  borderRadius: '10px', padding: '14px', marginBottom: '20px',
                }}>
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F4526' }}>Document uploadé !</p>
                    <p style={{ fontSize: '11px', color: '#4A5E55' }}>Votre pièce d'identité a été envoyée</p>
                  </div>
                  <button onClick={() => setPieceIdentite('')} style={{
                    background: 'none', border: 'none', color: '#D94F3D', cursor: 'pointer', fontSize: '20px',
                  }}>×</button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '12px', border: '2px dashed #B8DCC8', borderRadius: '14px',
                  padding: '32px', cursor: 'pointer', background: '#F7FCF9',
                  marginBottom: '20px', opacity: uploadingId ? 0.6 : 1,
                }}>
                  <span style={{ fontSize: '40px' }}>📎</span>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>
                      {uploadingId ? 'Envoi en cours...' : "Cliquez pour ajouter votre pièce d'identité"}
                    </p>
                    <p style={{ fontSize: '12px', color: '#8FA99E' }}>CNI, Passeport ou Permis · JPG ou PNG</p>
                  </div>
                  <input type="file" accept="image/*" disabled={uploadingId} onChange={handleIdUpload} style={{ display: 'none' }} />
                </label>
              )}

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #F5C6C2',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#D94F3D', marginBottom: '16px',
                }}>⚠️ {error}</div>
              )}

              <div style={{
                background: '#FDF3E3', border: '1px solid #E8C97A',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
              }}>
                <p style={{ fontSize: '12px', color: '#7A5C1A', lineHeight: '1.6' }}>
                  ⏳ Votre profil sera examiné sous <strong>24-48h</strong>. En attendant, vous pouvez utiliser la plateforme en tant que client.
                </p>
              </div>

              <button onClick={handleProviderApply} disabled={loading || !pieceIdentite} style={{
                width: '100%', padding: '14px',
                background: pieceIdentite ? '#1A6B3C' : '#B8DCC8',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700',
                cursor: pieceIdentite ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Envoi de la candidature...' : '🚀 Envoyer ma candidature'}
              </button>
            </>
          )}

        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#4A5E55', marginTop: '20px' }}>
          Déjà un compte ?{' '}
          <span onClick={() => navigate('/connexion')} style={{ color: '#1A6B3C', fontWeight: '700', cursor: 'pointer' }}>
            Se connecter
          </span>
        </p>

      </div>
    </div>
  )
}
