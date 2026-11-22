import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Puertos de desarrollo fuera de los habituales (3000/5173), que en esta
  // máquina suelen estar ocupados por contenedores de otros proyectos.
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3100'
  const port = Number(env.VITE_PORT) || 5180

  return {
    plugins: [react()],
    server: {
      port,
      // Si el puerto está ocupado, falla en vez de saltar a otro en silencio
      // (así no se acaba abriendo la web de otro proyecto por error).
      strictPort: true,
      proxy: {
        '/api': apiProxyTarget
      }
    },
    test: {
      environment: 'jsdom'
    }
  }
})
