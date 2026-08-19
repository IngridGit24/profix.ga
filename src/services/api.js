// src/services/api.js
// Replaces direct Firebase SDK calls throughout the app — everything now
// goes through the api-profixgabon backend instead of Firestore/Firebase
// Auth directly from the browser.
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url || ''
      // Don't wipe the session over a login/register attempt failing —
      // only over an *existing* session's token being rejected.
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/connexion') {
          window.location.href = '/connexion'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
