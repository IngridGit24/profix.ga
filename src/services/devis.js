// src/services/devis.js
// Replaces the old Firestore `devis` collection reads/writes.
import api from './api'

export const devisService = {
  async create({ demandeId, clientId, montant, description }) {
    const { data } = await api.post('/devis', { demandeId, clientId, montant, description })
    return data.data
  },

  async getById(id) {
    const { data } = await api.get(`/devis/${id}`)
    return data.data
  },

  /** `as: 'prestataire'` lists devis sent; otherwise devis received as a client. */
  async list({ page = 1, limit = 20, as } = {}) {
    const { data } = await api.get('/devis', { params: { page, limit, as } })
    return data.data // { devis, total, page, limit }
  },

  async accepter(id) {
    const { data } = await api.post(`/devis/${id}/accepter`)
    return data.data
  },

  async refuser(id) {
    const { data } = await api.post(`/devis/${id}/refuser`)
    return data.data
  },
}

export default devisService
