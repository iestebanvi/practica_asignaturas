import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Los tests van contra el Supabase real (el mismo de la web), pero en un
    // esquema propio que se borra y se recrea en cada ejecución.
    env: { DB_SCHEMA: 'test' },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
