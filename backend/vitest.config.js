import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Los tests van contra el Supabase real (el mismo de la web), pero en un
    // esquema propio que se borra y se recrea en cada ejecución.
    // Contraseña de la consola propia de los tests (nunca la real).
    env: { DB_SCHEMA: 'test', TEACHER_PASSWD: 'contrasenya-de-prova' },
    // Todos los ficheros recrean el mismo esquema "test": de uno en uno.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
