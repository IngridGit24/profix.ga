// src/services/auth.js
// Replaces firebase/auth (signInWithEmailAndPassword, createUserWithEmailAndPassword,
// onAuthStateChanged, signInWithPopup) — JWT-based auth against api-profixgabon.
//
// Google sign-in is NOT carried over yet: the new backend doesn't implement
// an OAuth flow (api-livrago-express has passport-google-oauth20 wired up
// for reference, but this backend doesn't have it yet) — see the backend
// README's "what's not done" list. Email/password only for now.
import api from './api'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function persistSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const authService = {
  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // `type` is not a param here — the backend always creates a plain client
  // account (see api-profixgabon authService.register's doc comment).
  // Becoming a prestataire is a separate step: prestatairesService.apply()
  // after registering, reviewed by an admin.
  async register({ name, email, password, phone }) {
    const { data } = await api.post('/auth/register', { name, email, password, phone })
    persistSession(data.data.token, data.data.user)
    return data.data.user
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    persistSession(data.data.token, data.data.user)
    return data.data.user
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Best-effort — clear the local session regardless.
    }
    clearSession()
  },

  async getMe() {
    const { data } = await api.get('/auth/me')
    localStorage.setItem(USER_KEY, JSON.stringify(data.data))
    return data.data
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload)
    localStorage.setItem(USER_KEY, JSON.stringify(data.data))
    return data.data
  },

  async changePassword(currentPassword, newPassword) {
    await api.put('/auth/change-password', { currentPassword, newPassword })
  },

  /** Switch between client/prestataire dashboards — only works if the account is a validated provider. */
  async setMode(mode) {
    const { data } = await api.put('/auth/mode', { mode })
    localStorage.setItem(USER_KEY, JSON.stringify(data.data))
    return data.data
  },

  async requestPasswordReset(email) {
    await api.post('/auth/request-password-reset', { email })
  },

  async resetPassword(token, newPassword) {
    const { data } = await api.post('/auth/reset-password', { token, newPassword })
    persistSession(data.data.token, data.data.user)
    return data.data.user
  },
}

export default authService
