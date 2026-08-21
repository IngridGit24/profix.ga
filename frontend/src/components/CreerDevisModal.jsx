// src/components/CreerDevisModal.jsx
import { useState } from 'react'
import devisService from '../services/devis'

export default function CreerDevisModal({ demande, onClose, onSuccess }) {
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!montant || parseInt(montant) <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    if (!description || description.length < 10) {
      setError('Veuillez décrire le devis (minimum 10 caractères)')
      return
    }

    setLoading(true)
    setError('')

    try {
      await devisService.create({
        demandeId: demande.id,
        clientId: demande.client_id,
        montant: parseInt(montant),
        description,
      })
      onSuccess()
    } catch (err) {
      console.error('Erreur création devis:', err)
      setError(err.response?.data?.message || 'Erreur lors de la création du devis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      animation: 'fadeIn 0.2s ease-in-out'
    }}>
      <div style={{
        background: '#fff',
        maxWidth: '520px',
        width: '100%',
        padding: '32px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease-in-out'
      }}>

        {/* Entête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
            Créer un devis
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#8FA99E',
              padding: '4px 8px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F7F9F8'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Infos client */}
        <div style={{
          background: '#F7F9F8',
          padding: '12px 16px',
          marginBottom: '20px',
          border: '1px solid #E2EBE7'
        }}>
          <p style={{ fontSize: '12px', color: '#8FA99E' }}>Client</p>
          <p style={{ fontWeight: '700' }}>{demande.client_name}</p>
          <p style={{ fontSize: '13px', color: '#4A5E55', marginTop: '4px' }}>
            {demande.description?.slice(0, 100)}...
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Montant */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
              Montant (FCFA) <span style={{ color: '#D94F3D' }}>*</span>
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 150000"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #E2EBE7',
                fontSize: '14px',
                fontFamily: 'sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
              onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
              required
            />
          </div>

          {/* Description du devis */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4A5E55', display: 'block', marginBottom: '6px' }}>
              Description du devis <span style={{ color: '#D94F3D' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détaillez les travaux et services inclus, le délai d'exécution, les conditions de paiement..."
              style={{
                width: '100%',
                minHeight: '110px',
                padding: '10px 14px',
                border: '1.5px solid #E2EBE7',
                fontSize: '14px',
                fontFamily: 'sans-serif',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
              onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
              required
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              background: '#FDECEA',
              border: '1px solid #F5C6C2',
              fontSize: '13px',
              color: '#D94F3D'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#F7F9F8',
                border: '1px solid #E2EBE7',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#4A5E55'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px',
                background: '#1A6B3C',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Création...' : 'Créer le devis'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
