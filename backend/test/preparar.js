// Prepara el esquema "test" desde cero (migraciones + opcionalmente el
// contenido de backend/datos/contenido.json) y levanta la app en un puerto
// libre. Imports dinámicos: cliente.js exige DATABASE_URL al cargarse.
import { expect } from 'vitest'
import { leerContenido } from '../scripts/contenido.js'

export async function prepararEntorno({ conContenido = true } = {}) {
  const { pool } = await import('../src/db/cliente.js')
  const { ejecutarMigraciones } = await import('../src/db/migrar.js')
  const { sembrar } = await import('../src/db/sembrar.js')
  const { crearApp } = await import('../src/app.js')

  expect(process.env.DB_SCHEMA).toBe('test')
  await pool.query('DROP SCHEMA IF EXISTS test CASCADE')
  await ejecutarMigraciones()
  if (conContenido) {
    const cliente = await pool.connect()
    try {
      await sembrar(cliente, leerContenido())
    } finally {
      cliente.release()
    }
  }

  const servidor = crearApp().listen(0)
  await new Promise((ok) => servidor.once('listening', ok))
  return { pool, servidor, base: `http://127.0.0.1:${servidor.address().port}` }
}
