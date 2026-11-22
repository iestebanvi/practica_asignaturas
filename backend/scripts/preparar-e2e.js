// Deja el esquema de los e2e (DB_SCHEMA, p.ej. "e2e") recién creado y con la
// copia del contenido (backend/datos/contenido.json). Lo ejecuta Playwright
// antes de arrancar el backend de los e2e: así los tests de los editores
// pueden crear, cambiar y borrar sin tocar los datos reales ("public").
import 'dotenv/config'
import { pool, ESQUEMA } from '../src/db/cliente.js'
import { ejecutarMigraciones } from '../src/db/migrar.js'
import { sembrar } from '../src/db/sembrar.js'
import { leerContenido } from './contenido.js'

if (ESQUEMA === 'public') {
  console.error('preparar-e2e se niega a tocar el esquema "public" (los datos reales). Usa DB_SCHEMA=e2e.')
  process.exit(1)
}

try {
  await pool.query(`DROP SCHEMA IF EXISTS ${ESQUEMA} CASCADE`)
  await ejecutarMigraciones()
  const cliente = await pool.connect()
  try {
    await sembrar(cliente, leerContenido())
  } finally {
    cliente.release()
  }
  console.log(`Esquema "${ESQUEMA}" preparado para los e2e`)
} finally {
  await pool.end()
}
