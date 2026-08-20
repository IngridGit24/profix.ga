// src/services/prestataires.js
// Replaces direct Firestore reads/writes on the `prestataires` collection.
import api from './api'

export const prestatairesService = {
  async list(filters = {}) {
    const { data } = await api.get('/prestataires', { params: filters })
    return data.data // { prestataires, total, page, limit }
  },

  async getById(id) {
    const { data } = await api.get(`/prestataires/${id}`)
    return data.data
  },

  async getMyProfile() {
    const { data } = await api.get('/prestataires/me/profile')
    return data.data
  },

  /** Provider application — matches RegisterPage's createProviderAccount / BecomeProviderPage. */
  async apply(payload) {
    const { data } = await api.post('/prestataires', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/prestataires/${id}`, payload)
    return data.data
  },

  async setAvailability(id, available) {
    const { data } = await api.patch(`/prestataires/${id}/availability`, { available })
    return data.data
  },

  // -- Admin only --
  async getPending(page = 1, limit = 20) {
    const { data } = await api.get('/prestataires/admin/pending', { params: { page, limit } })
    return data.data
  },

  /** Everything, validated or not, available or not (list() only returns validated+available). */
  async getAllForAdmin(page = 1, limit = 200) {
    const { data } = await api.get('/prestataires/admin/all', { params: { page, limit } })
    return data.data
  },

  async validate(id) {
    const { data } = await api.post(`/prestataires/${id}/validate`)
    return data.data
  },

  async reject(id) {
    await api.post(`/prestataires/${id}/reject`)
  },
}

export default prestatairesService
