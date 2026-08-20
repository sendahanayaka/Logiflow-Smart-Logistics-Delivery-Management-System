import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET?.trim()

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      clearMocks: true,
      restoreMocks: true,
    },
    server: apiTarget
      ? {
          proxy: {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
