// src/hooks/usePolling.js
// Fallback for environments where Socket.IO can't hold a persistent
// connection (serverless — e.g. Vercel Functions, see services/socket.js).
// Re-runs `callback` on an interval as a safety net alongside the existing
// socket listeners, which stay wired up as-is and simply become
// redundant-but-harmless wherever sockets do work (Docker/local).
import { useEffect, useRef } from 'react'

/** @param {() => void} callback @param {number|null} delayMs - null/0 disables polling */
export function usePolling(callback, delayMs) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!delayMs) return
    const id = setInterval(() => savedCallback.current(), delayMs)
    return () => clearInterval(id)
  }, [delayMs])
}

export default usePolling
