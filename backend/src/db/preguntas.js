import { pool } from './cliente.js'
import { validarPregunta } from '../validacion/preguntas.js'

const COLUMNAS = 'id::int, orden, enunciado, respuesta, opciones, alternativas, activo'

async function formatoDeBanco(bancoId) {
  const { rows } = await pool.query('SELECT formato FROM bancos WHERE id = $1', [bancoId])
  return rows[0]?.formato ?? null
}

// Las tres devuelven { pregunta } | { errores } | null (si no existe).

export async function crearPregunta(bancoId, datos) {
  const formato = await formatoDeBanco(bancoId)
  if (!formato) return null
  const { valores, errores } = validarPregunta(formato, datos)
  if (errores) return { errores }
  const { rows } = await pool.query(
    `INSERT INTO preguntas (banco_id, enunciado, respuesta, opciones, activo, orden)
     VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(max(orden), 0) + 1 FROM preguntas WHERE banco_id = $1))
     RETURNING ${COLUMNAS}`,
    [bancoId, valores.enunciado, valores.respuesta, valores.opciones && JSON.stringify(valores.opciones), valores.activo],
  )
  return { pregunta: rows[0] }
}

// Cambio parcial: se combina con lo guardado y se valida la pregunta entera.
export async function actualizarPregunta(id, cambios) {
  const { rows: actuales } = await pool.query(
    `SELECT p.enunciado, p.respuesta, p.opciones, p.activo, b.formato
       FROM preguntas p JOIN bancos b ON b.id = p.banco_id WHERE p.id = $1`,
    [id],
  )
  if (!actuales.length) return null
  const { formato, ...actual } = actuales[0]
  const permitidos = Object.fromEntries(
    Object.entries(cambios ?? {}).filter(([k]) => ['enunciado', 'respuesta', 'opciones', 'activo'].includes(k)),
  )
  const { valores, errores } = validarPregunta(formato, { ...actual, ...permitidos })
  if (errores) return { errores }
  const { rows } = await pool.query(
    `UPDATE preguntas SET enunciado = $2, respuesta = $3, opciones = $4, activo = $5, actualizado_en = now()
      WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, valores.enunciado, valores.respuesta, valores.opciones && JSON.stringify(valores.opciones), valores.activo],
  )
  return { pregunta: rows[0] }
}

export async function borrarPregunta(id) {
  const { rowCount } = await pool.query('DELETE FROM preguntas WHERE id = $1', [id])
  return rowCount > 0
}
