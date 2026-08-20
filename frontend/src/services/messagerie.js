// src/services/messagerie.js
// Replaces the Firestore-based conversations/messages service. Real-time
// delivery goes through services/socket.js ('new_message',
// 'conversation_updated' events) instead of onSnapshot listeners.
import api from './api'

export const messagerieService = {
  async getConversations() {
    const { data } = await api.get('/conversations')
    return data.data
  },

  /**
   * There's no GET /conversations/:id on the backend (only the messages
   * sub-resource needs the id directly) — so a single conversation's
   * metadata (participant names, etc.) is found by filtering the full list.
   * Fine for now since getConversations() is already fetched for the
   * Navbar badge and dashboards; revisit if conversation lists get large.
   */
  async getConversation(id) {
    const conversations = await this.getConversations()
    return conversations.find((c) => String(c.id) === String(id)) || null
  },

  async getOrCreateConversation(prestataireUserId) {
    const { data } = await api.post('/conversations', { prestataireUserId })
    return data.data
  },

  /** page 1 = most recent `limit` messages, oldest-first within that page. */
  async getMessages(conversationId, { page = 1, limit = 50 } = {}) {
    const { data } = await api.get(`/conversations/${conversationId}/messages`, { params: { page, limit } })
    return data.data
  },

  async sendMessage(conversationId, contenu) {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, { contenu })
    return data.data
  },

  async markAsRead(conversationId) {
    await api.post(`/conversations/${conversationId}/read`)
  },
}

export default messagerieService
