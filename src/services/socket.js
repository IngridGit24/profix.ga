// src/services/socket.js
// Real-time layer, replacing Firestore's onSnapshot listeners.
import { io } from 'socket.io-client'

const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
  try {
    const u = new URL(apiUrl)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'http://localhost:4000'
  }
}

let socket = null

export function connectSocket() {
  const token = localStorage.getItem('token')
  if (!token) return null

  if (socket?.connected) return socket

  socket = io(getSocketBaseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinConversation(conversationId) {
  socket?.emit('join_conversation', conversationId)
}

export function leaveConversation(conversationId) {
  socket?.emit('leave_conversation', conversationId)
}

export default { connectSocket, getSocket, disconnectSocket, joinConversation, leaveConversation }
