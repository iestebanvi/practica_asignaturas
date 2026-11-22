import { defineConfig } from '@playwright/test'
import { PUERTO_BACKEND, PUERTO_FRONTEND, ESQUEMA_E2E, PASSWORD_E2E } from './e2e/entorno.js'

const BACKEND = `http://127.0.0.1:${PUERTO_BACKEND}`
const FRONTEND = `http://127.0.0.1:${PUERTO_FRONTEND}`
const ENTORNO_BACKEND = `DB_SCHEMA=${ESQUEMA_E2E} TEACHER_PASSWD=${PASSWORD_E2E} PORT=${PUERTO_BACKEND}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: FRONTEND,
  },
  // Servidores propios en cada ejecución (nunca se reutiliza el "npm run dev",
  // que trabaja con los datos reales). El backend recrea antes el esquema e2e.
  webServer: [
    {
      command: `cd backend && ${ENTORNO_BACKEND} node scripts/preparar-e2e.js && ${ENTORNO_BACKEND} node src/server.js`,
      url: `${BACKEND}/api/health`,
      reuseExistingServer: false,
      timeout: 90000,
    },
    {
      command: `cd frontend && VITE_API_PROXY_TARGET=${BACKEND} VITE_PORT=${PUERTO_FRONTEND} npx vite --host 127.0.0.1`,
      url: FRONTEND,
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
})
