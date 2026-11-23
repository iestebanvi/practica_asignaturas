import { pool } from './cliente.js'

const MAX_TEXTO = 500
const MAX_VECES = 1000
export const MAX_IMPORTAR = 500

// Un fallo válido: { tipo, enunciado, respuesta, veces } normalizado, o null.
export function validarFallo(f) {
  if (!f || typeof f !== 'object') return null
  const tipo = typeof f.tipo === 'string' ? f.tipo.trim() : ''
  const enunciado = typeof f.enunciado === 'string' ? f.enunciado.trim() : ''
  const respuesta = f.respuesta === undefined || f.respuesta === null ? '' : String(f.respuesta).trim()
  const veces = f.veces ?? 1
  if (!/^[a-z0-9-]{1,40}$/.test(tipo)) return null
  if (!enunciado || enunciado.length > MAX_TEXTO || !respuesta || respuesta.length > MAX_TEXTO) return null
  if (!Number.isInteger(veces) || veces < 1 || veces > MAX_VECES) return null
  return { tipo, enunciado, respuesta, veces }
}

// Suma "veces" al fallo (o lo crea). Atómico frente a peticiones simultáneas.
export async function sumarFallos(alumneId, fallos) {
  for (const f of fallos) {
    await pool.query(
      `INSERT INTO fallos_alumnes (alumne_id, tipo, enunciado, respuesta, veces)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (alumne_id, tipo, enunciado)
       DO UPDATE SET veces = LEAST(fallos_alumnes.veces + EXCLUDED.veces, ${MAX_VECES}),
                     respuesta = EXCLUDED.respuesta, ultima = now()`,
      [alumneId, f.tipo, f.enunciado, f.respuesta, f.veces],
    )
  }
}

export async function listarFallos(alumneId) {
  const { rows } = await pool.query(
    `SELECT tipo, enunciado, respuesta, veces FROM fallos_alumnes
      WHERE alumne_id = $1 ORDER BY veces DESC, ultima DESC`,
    [alumneId],
  )
  return rows
}

export async function vaciarFallos(alumneId) {
  await pool.query('DELETE FROM fallos_alumnes WHERE alumne_id = $1', [alumneId])
}
