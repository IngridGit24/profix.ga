// src/components/ConversationsList.jsx
// Replaces the Firestore onSnapshot listener with a fetch + a
// 'conversation_updated' socket event to refresh (see services/socket.js).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import messagerieService from '../services/messagerie'
import { getSocket } from '../services/socket'

export default function ConversationsList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const convs = await messagerieService.getConversations()
      setConversations(convs)
    } catch {
      // Non-critical — leave the list as-is on a transient error.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return
    const handler = () => load()
    socket.on('conversation_updated', handler)
    return () => socket.off('conversation_updated', handler)
  }, [user])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ color: '#8FA99E' }}>Chargement des conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8FA99E' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#4A5E55', marginBottom: '8px' }}>
          Aucune conversation
        </p>
        <p style={{ fontSize: '13px' }}>
          Envoyez un message à un prestataire pour commencer
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {conversations.map((conv) => {
        const autreNom = conv.client_id === user.id ? conv.prestataire_name : conv.client_name

        return (
          <div
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            style={{
              background: '#fff',
              border: '1px solid #E2EBE7',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: conv.unread_count > 0 ? '4px solid #1A6B3C' : '4px solid transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F7F9F8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{autreNom}</span>
                {conv.unread_count > 0 && (
                  <span style={{
                    background: '#1A6B3C',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '99px'
                  }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '13px',
                color: conv.unread_count > 0 ? '#111' : '#8FA99E',
                marginTop: '4px',
                fontWeight: conv.unread_count > 0 ? '600' : '400'
              }}>
                {conv.dernier_message || 'Nouvelle conversation'}
              </p>
            </div>
            <div style={{ fontSize: '12px', color: '#8FA99E', textAlign: 'right' }}>
              {conv.date_dernier_message
                ? new Date(conv.date_dernier_message).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
