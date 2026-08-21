// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    // Docker Desktop on Windows doesn't reliably forward inotify events for
    // bind-mounted volumes, so chokidar's default watcher misses edits made
    // from the host — HMR silently serves stale files. Polling works around it.
    watch: { usePolling: true, interval: 300 },
  },
})