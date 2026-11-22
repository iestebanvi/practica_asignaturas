import { createHash, randomBytes } from 'node:crypto'
import { pool } from '../db/cliente.js'

export const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000

const hash = (token) => createHash('sha256').update(token).digest('hex')

// Crea una sesión y devuelve el token (solo viaja en la cookie; en la BD queda
// su hash). De paso limpia las sesiones caducadas.
export async function crearSesion() {
  const token = randomBytes(32).toString('base64url')
  const caducaEn = new Date(Date.now() + DURACION_SESION_MS)
  await pool.query('DELETE FROM sesiones_profesorado WHERE caduca_en < now()')
  await pool.query('INSERT INTO sesiones_profesorado (token_hash, caduca_en) VALUES ($1, $2)', [hash(token), caducaEn])
  return { token, caducaEn }
}

// Devuelve { caducaEn } si el token corresponde a una sesión vigente, o null.
export async function obtenerSesion(token) {
  if (!token) return null
  const { rows } = await pool.query(
    'SELECT caduca_en FROM sesiones_profesorado WHERE token_hash = $1 AND caduca_en > now()',
    [hash(token)],
  )
  return rows.length ? { caducaEn: rows[0].caduca_en } : null
}

export async function borrarSesion(token) {
  if (!token) return
  await pool.query('DELETE FROM sesiones_profesorado WHERE token_hash = $1', [hash(token)])
}
