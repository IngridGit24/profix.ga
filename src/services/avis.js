// src/services/avis.js
// Replaces the old Firestore `avis.liste` array field on the prestataire
// doc — see api-profixgabon's avisService.js for the table + rating
// aggregation this now talks to.
import api from './api'

export const avisService = {
  async list(prestataireId) {
    const { data } = await api.get(`/avis/${prestataireId}`)
    return data.data
  },

  async create(prestataireId, { note, commentaire }) {
    const { data } = await api.post(`/avis/${prestataireId}`, { note, commentaire })
    return data.data
  },
}

export default avisService
