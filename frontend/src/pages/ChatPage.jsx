// src/pages/ChatPage.jsx
// Replaces Firestore's onSnapshot-based message listener + subcollection
// pagination with services/messagerie.js (REST) + services/socket.js
// ('new_message' event, room-scoped to this conversation).
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import messagerieService from '../services/messagerie'
import { getSocket, joinConversation, leaveConversation } from '../services/socket'
import { usePolling } from '../hooks/usePolling'
import { SkeletonMessage } from '../components/Skeleton'
import toast from 'react-hot-toast'
import { sanitizeText } from '../utils/validators'

const MESSAGES_LIMIT = 20

export default function ChatPage() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState(null)
  const [sending, setSending] = useState(false)

  // PAGINATION — page 1 is the most recent MESSAGES_LIMIT messages (see
  // messagerieService.getMessages); "load more" walks backwards in time.
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Charger la conversation (métadonnées) + les messages
  useEffect(() => {
    if (!conversationId || !user) return

    const load = async () => {
      try {
        const [conv, msgs] = await Promise.all([
          messagerieService.getConversation(conversationId),
          messagerieService.getMessages(conversationId, { page: 1, limit: MESSAGES_LIMIT }),
        ])
        setConversation(conv)
        setMessages(msgs)
        setHasMore(msgs.length === MESSAGES_LIMIT)
        setPage(1)
        await messagerieService.markAsRead(conversationId)
      } catch (error) {
        console.error('Erreur chargement conversation:', error)
      }
      setLoading(false)
    }

    load()
  }, [conversationId, user])

  // Temps réel : rejoindre la room de cette conversation et écouter les nouveaux messages
  useEffect(() => {
    if (!conversationId || !user) return

    joinConversation(conversationId)
    const socket = getSocket()

    const handleNewMessage = (payload) => {
      if (String(payload.conversationId) !== String(conversationId)) return
      setMessages((prev) => [...prev, payload.message])
      if (payload.message.expediteur_id !== user.id && document.visibilityState === 'visible') {
        messagerieService.markAsRead(conversationId).catch(() => {})
      }
    }

    socket?.on('new_message', handleNewMessage)

    return () => {
      socket?.off('new_message', handleNewMessage)
      leaveConversation(conversationId)
    }
  }, [conversationId, user])

  // Filet de secours sans socket (voir usePolling) : revérifie les messages
  // les plus récents et les fusionne par id — pas un simple reload, pour ne
  // pas dupliquer ceux déjà ajoutés par le socket quand il fonctionne, ni
  // perdre les plus anciens chargés via "Charger plus de messages".
  const pollMessages = useCallback(async () => {
    if (!conversationId) return
    try {
      const latest = await messagerieService.getMessages(conversationId, { page: 1, limit: MESSAGES_LIMIT })
      setMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]))
        for (const m of latest) byId.set(m.id, m)
        return Array.from(byId.values()).sort((a, b) => a.id - b.id)
      })
    } catch {
      // silencieux — prochain tick réessaie
    }
  }, [conversationId])

  usePolling(pollMessages, conversationId && user ? 5000 : null)

  // Marquer comme lu quand la page redevient visible
  useEffect(() => {
    if (!conversationId || !user) return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        messagerieService.markAsRead(conversationId).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [conversationId, user])

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages.length, scrollToBottom])

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const older = await messagerieService.getMessages(conversationId, { page: nextPage, limit: MESSAGES_LIMIT })
      setMessages((prev) => [...older, ...prev])
      setPage(nextPage)
      setHasMore(older.length === MESSAGES_LIMIT)
    } catch (error) {
      console.error('Erreur chargement plus de messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const sanitizedMessage = sanitizeText(newMessage).trim()
    if (!sanitizedMessage || sending) return

    setSending(true)
    try {
      // Not appended locally — the sender is in this conversation's socket
      // room too, so the server's 'new_message' broadcast delivers it back
      // and handleNewMessage above appends it. Avoids double-inserting it.
      await messagerieService.sendMessage(conversationId, sanitizedMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Erreur envoi message:', error)
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        paddingTop: '64px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F7F9F8'
      }}>
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #E2EBE7',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#E8F5EE',
          }} />
          <div>
            <div style={{
              width: '150px',
              height: '16px',
              background: '#E8F5EE',
              marginBottom: '4px',
            }} />
            <div style={{
              width: '80px',
              height: '12px',
              background: '#E8F5EE',
            }} />
          </div>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <SkeletonMessage />
          <SkeletonMessage />
          <SkeletonMessage />
          <SkeletonMessage />
          <SkeletonMessage />
        </div>
        <div style={{
          background: '#fff',
          padding: '12px 24px',
          borderTop: '1px solid #E2EBE7',
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{
            flex: 1,
            height: '40px',
            background: '#F7F9F8',
          }} />
          <div style={{
            width: '80px',
            height: '40px',
            background: '#E8F5EE',
          }} />
        </div>
      </div>
    )
  }

  const autreNom = conversation
    ? (conversation.client_id === user?.id ? conversation.prestataire_name : conversation.client_name)
    : 'Utilisateur'

  return (
    <div style={{
      paddingTop: '64px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F7F9F8'
    }}>

      {/* Entête */}
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #E2EBE7',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#4A5E55',
            padding: '4px 8px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F7F9F8'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#E8F5EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: '#0F4526',
          }}>
            {autreNom?.charAt(0) || '?'}
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '16px' }}>{autreNom || 'Utilisateur'}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {hasMore && messages.length >= MESSAGES_LIMIT && (
          <button
            onClick={loadMoreMessages}
            disabled={loadingMore}
            style={{
              alignSelf: 'center',
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #E2EBE7',
              fontSize: '12px',
              color: '#8FA99E',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              opacity: loadingMore ? 0.5 : 1,
              marginBottom: '8px'
            }}
          >
            {loadingMore ? 'Chargement...' : 'Charger plus de messages'}
          </button>
        )}

        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#8FA99E'
          }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}></p>
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.expediteur_id === user?.id
            const msgDate = msg.created_at ? new Date(msg.created_at) : null
            const prevDate = messages[index - 1]?.created_at ? new Date(messages[index - 1].created_at) : null
            const showDate = index === 0 || !prevDate || msgDate?.toDateString() !== prevDate.toDateString()

            return (
              <div key={msg.id ?? index}>
                {showDate && msgDate && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#8FA99E',
                    margin: '8px 0',
                    padding: '4px 12px',
                    background: '#F7F9F8',
                    alignSelf: 'center',
                    display: 'inline-block',
                    width: 'auto',
                  }}>
                    {msgDate.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                )}

                <div style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '75%'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#8FA99E',
                    marginBottom: '4px',
                    textAlign: isMine ? 'right' : 'left'
                  }}>
                    {isMine ? 'Vous' : `${autreNom || 'Client'}`}
                  </div>

                  <div style={{
                    background: isMine ? '#1A6B3C' : '#fff',
                    color: isMine ? '#fff' : '#111',
                    padding: '10px 14px',
                    borderBottomRightRadius: isMine ? '4px' : '12px',
                    borderBottomLeftRadius: isMine ? '12px' : '4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    wordWrap: 'break-word'
                  }}>
                    {msg.contenu}
                  </div>

                  <div style={{
                    fontSize: '10px',
                    color: '#8FA99E',
                    marginTop: '4px',
                    textAlign: isMine ? 'right' : 'left',
                  }}>
                    {msgDate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) || ''}
                    {isMine && msg.lu ? '' : ''}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Envoi */}
      <form
        onSubmit={handleSend}
        style={{
          background: '#fff',
          padding: '12px 24px',
          borderTop: '1px solid #E2EBE7',
          display: 'flex',
          gap: '12px'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1.5px solid #E2EBE7',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'sans-serif',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#1A6B3C'}
          onBlur={(e) => e.target.style.borderColor = '#E2EBE7'}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            padding: '10px 20px',
            background: newMessage.trim() ? '#1A6B3C' : '#B8DCC8',
            color: '#fff',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            opacity: sending ? 0.7 : 1,
            transition: 'background 0.2s, opacity 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? '...' : 'Envoyer'}
        </button>
      </form>
    </div>
  )
}
