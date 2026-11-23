import { defineConfig } from '@playwright/test'

// Los e2e contra producción (make test-e2e-prod): sin servidores locales. Los
// tests que crean o editan datos (consola, àlies, bloques) se saltan solos
// fuera del entorno e2e local, así que esto solo lee y juega sin àlies.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 4,
  use: { baseURL: process.env.PROD_URL || 'https://practica-jungfrau.up.railway.app' },
})
