// src/services/upload.js
// Replaces the old unsigned Cloudinary upload_preset flow — anyone, logged
// in or not, could previously upload directly to the Cloudinary account.
// Now the backend signs each upload request; only an authenticated user can
// get a signature, and it's tied to a specific timestamp/folder.
import api from './api'

/**
 * Uploads `file` to Cloudinary using a fresh, backend-signed request.
 * `folder` is 'general' (photos, gallery) or 'identite' (ID documents —
 * kept in a separate Cloudinary folder, same as before).
 */
export async function uploadImage(file, folder = 'general') {
  const { data } = await api.get('/uploads/signature', { params: { folder } })
  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = data.data

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', signedFolder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    throw new Error("Échec de l'envoi de l'image")
  }
  const result = await res.json()
  return result.secure_url
}

export default { uploadImage }
