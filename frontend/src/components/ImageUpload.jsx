import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '../services/upload';

export default function ImageUpload({ onUpload, label = 'Ajouter une photo', folder = 'general' }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const url = await uploadImage(file, folder)
      onUpload(url)
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi de l'image")
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <input
        type="file" accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={preview} style={{
            width: '100px', height: '100px',
             objectFit: 'cover',
            border: '2px solid #1A6B3C',
          }} />
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '12px', fontWeight: '600',
            }}>Upload...</div>
          )}
        </div>
      ) : (
        <div style={{
          width: '100px', height: '100px', 
          border: '2px dashed #B8DCC8',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '6px', background: '#F7FCF9',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#1A6B3C', textAlign: 'center' }}>{label}</span>
        </div>
      )}
    </label>
  )
}
