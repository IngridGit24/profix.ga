// src/context/AuthContext.jsx
// Replaces Firebase's onAuthStateChanged with a JWT-backed session. The
// `user` object now carries `type`/`current_mode`/`validated` directly
// (from GET /auth/me) — ProtectedRoute no longer needs its own Firestore
// fetch on every navigation to figure out role/mode.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import authService from '../services/auth'
import { connectSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!authService.getToken()) {
      setUser(null)
      return null
    }
    try {
      const freshUser = await authService.getMe()
      setUser(freshUser)
      return freshUser
    } catch {
      // Token invalid/expired — api.js's response interceptor already
      // clears storage and redirects on 401/403.
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    // Paint immediately with whatever was cached, then verify with the server.
    const stored = authService.getStoredUser()
    if (stored) setUser(stored)
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  useEffect(() => {
    if (user) {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }, [user])

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context || { user: null, loading: true }
}
