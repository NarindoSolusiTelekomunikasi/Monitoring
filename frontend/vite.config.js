import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiStyle = String(env.VITE_API_STYLE ?? 'rest').trim().toLowerCase()
  const apiBaseUrl = String(env.VITE_API_BASE_URL ?? '').trim()
  const base = env.VITE_BASE_PATH || (mode === 'production' ? '/Monitoring/' : '/')

  return {
    base,
    plugins: [react()],
    server: {
      proxy:
        apiStyle === 'rest' && !apiBaseUrl
          ? {
              '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
              },
            }
          : undefined,
    },
  }
})
