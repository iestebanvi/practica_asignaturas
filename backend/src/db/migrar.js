import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, ESQUEMA } from './cliente.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR_MIGRACIONES = path.join(__dirname, 'migraciones')
// Número arbitrario pero fijo: identifica el candado de migraciones.
const CANDADO = 727_001

// Aplica, en orden y cada una en su transacción, las migraciones .sql que aún
// no constan en _migrations. El candado evita que dos instancias arrancando a
// la vez (solape durante un redeploy) apliquen la misma migración dos veces.
export async function ejecutarMigraciones() {
  const cliente = await pool.connect()
  try {
    await cliente.query(`CREATE SCHEMA IF NOT EXISTS ${ESQUEMA}`)
    await cliente.query(`SET search_path TO ${ESQUEMA}`)
    await cliente.query('SELECT pg_advisory_lock($1)', [CANDADO])
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        nombre TEXT PRIMARY KEY,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
      )`)
    await cliente.query('ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY')

    const { rows } = await cliente.query('SELECT nombre FROM _migrations')
    const aplicadas = new Set(rows.map((r) => r.nombre))
    const ficheros = (await readdir(DIR_MIGRACIONES)).filter((f) => f.endsWith('.sql')).sort()
    const pendientes = ficheros.filter((f) => !aplicadas.has(f))

    for (const fichero of pendientes) {
      const sql = await readFile(path.join(DIR_MIGRACIONES, fichero), 'utf-8')
      try {
        await cliente.query('BEGIN')
        await cliente.query(sql)
        await cliente.query('INSERT INTO _migrations (nombre) VALUES ($1)', [fichero])
        await cliente.query('COMMIT')
        console.log(`Migración aplicada: ${fichero}`)
      } catch (err) {
        await cliente.query('ROLLBACK')
        throw new Error(`Falló la migración ${fichero}: ${err.message}`)
      }
    }
    return pendientes
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1)', [CANDADO]).catch(() => {})
    cliente.release()
  }
}
