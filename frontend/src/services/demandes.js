// src/services/demandes.js
// Replaces the old Firestore `demandes` collection reads/writes.
import api from './api'

export const demandesService = {
  async create({ prestataireId, categorie, description }) {
    const { data } = await api.post('/demandes', { prestataireId, categorie, description })
    return data.data
  },

  async getById(id) {
    const { data } = await api.get(`/demandes/${id}`)
    return data.data
  },

  /** `as: 'prestataire'` lists demandes received; otherwise demandes sent as a client. */
  async list({ page = 1, limit = 20, as } = {}) {
    const { data } = await api.get('/demandes', { params: { page, limit, as } })
    return data.data // { demandes, total, page, limit }
  },
}

export default demandesService
