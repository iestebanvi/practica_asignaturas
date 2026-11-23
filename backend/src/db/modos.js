import { pool } from './cliente.js'
import { validarModo, validarBanco } from '../validacion/modos.js'

const COLUMNAS_MODO =
  'id::int, asignatura_id::int AS "asignaturaId", slug, nombre, color, sombra, operaciones, banco_id::int AS "bancoId", bloc, params, activo'
const COLUMNAS_BANCO = 'id::int, slug, nombre, formato'
const CAMPOS_MODO = ['slug', 'nombre', 'color', 'sombra', 'operaciones', 'banco_id', 'bloc', 'params', 'activo']

const repetido = (err, campo, mensaje) => (err.code === '23505' ? { errores: { [campo]: mensaje } } : null)

// Comprueba que el banco elegido existe y tiene el formato que piden los
// tipos de ejercicio del modo.
async function comprobarBanco(valores, formatoBanco) {
  if (!formatoBanco) return null
  const { rows } = await pool.query('SELECT formato FROM bancos WHERE id = $1', [valores.bancoId])
  if (!rows.length) return { bancoId: 'Aquest banc no existeix.' }
  if (rows[0].formato !== formatoBanco) return { bancoId: "El banc no és del format que necessiten els tipus d'exercici triats." }
  return null
}

function aColumnas(valores) {
  const { bancoId, params, ...resto } = valores
  return { ...resto, banco_id: bancoId, ...(params ? { params: JSON.stringify(params) } : {}) }
}

// Todas devuelven { fila } | { errores } | null (si no existe).

export async function crearModo(asignaturaId, datos) {
  const { valores, formatoBanco, errores } = validarModo(datos, { creando: true })
  if (errores) return { errores }
  const erroresBanco = await comprobarBanco(valores, formatoBanco)
  if (erroresBanco) return { errores: erroresBanco }
  const { rowCount } = await pool.query('SELECT 1 FROM asignaturas WHERE id = $1', [asignaturaId])
  if (!rowCount) return null

  const columnas = aColumnas(valores)
  const campos = CAMPOS_MODO.filter((c) => c in columnas)
  try {
    const { rows } = await pool.query(
      `INSERT INTO modos (asignatura_id, ${campos.join(', ')}, orden)
       VALUES ($1, ${campos.map((_, i) => `$${i + 2}`).join(', ')},
               (SELECT COALESCE(max(orden), -1) + 1 FROM modos WHERE asignatura_id = $1))
       RETURNING ${COLUMNAS_MODO}`,
      [asignaturaId, ...campos.map((c) => columnas[c])],
    )
    return { fila: rows[0] }
  } catch (err) {
    const r = repetido(err, 'slug', 'Ja hi ha un mode amb aquesta adreça en aquesta assignatura.')
    if (r) return r
    throw err
  }
}

// Cambio parcial: se combina con lo guardado y se valida el modo entero (los
// tipos y el banco dependen el uno del otro). El slug no cambia.
export async function actualizarModo(id, cambios = {}) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_MODO} FROM modos WHERE id = $1`, [id])
  if (!rows.length) return null
  const actual = rows[0]
  const permitidos = Object.fromEntries(
    Object.entries(cambios).filter(([k]) => ['nombre', 'color', 'operaciones', 'bancoId', 'bloc', 'params', 'activo'].includes(k)),
  )
  const { valores, formatoBanco, errores } = validarModo({ ...actual, ...permitidos })
  if (errores) return { errores }
  const erroresBanco = await comprobarBanco(valores, formatoBanco)
  if (erroresBanco) return { errores: erroresBanco }

  const columnas = aColumnas(valores)
  const campos = CAMPOS_MODO.filter((c) => c !== 'slug' && c in columnas)
  const { rows: guardado } = await pool.query(
    `UPDATE modos SET ${campos.map((c, i) => `${c} = $${i + 2}`).join(', ')}, actualizado_en = now()
      WHERE id = $1 RETURNING ${COLUMNAS_MODO}`,
    [id, ...campos.map((c) => columnas[c])],
  )
  return { fila: guardado[0] }
}

// Borrar un modo no toca su banco (las preguntas son del banco).
export async function borrarModo(id) {
  const { rowCount } = await pool.query('DELETE FROM modos WHERE id = $1', [id])
  return rowCount ? { fila: { id } } : null
}

export async function crearBanco(datos) {
  const { valores, errores } = validarBanco(datos, { creando: true })
  if (errores) return { errores }
  try {
    const { rows } = await pool.query(
      `INSERT INTO bancos (slug, nombre, formato) VALUES ($1, $2, $3) RETURNING ${COLUMNAS_BANCO}`,
      [valores.slug, valores.nombre, valores.formato],
    )
    return { fila: rows[0] }
  } catch (err) {
    const r = repetido(err, 'slug', 'Ja hi ha un banc amb aquest identificador.')
    if (r) return r
    throw err
  }
}

// Solo el nombre: el slug y el formato quedan fijos.
export async function actualizarBanco(id, cambios = {}) {
  const { valores, errores } = validarBanco({ nombre: cambios.nombre })
  if (errores) return { errores }
  const { rows } = await pool.query(
    `UPDATE bancos SET nombre = $2, actualizado_en = now() WHERE id = $1 RETURNING ${COLUMNAS_BANCO}`,
    [id, valores.nombre],
  )
  return rows.length ? { fila: rows[0] } : null
}

// Solo si no tiene preguntas y ningún modo lo usa.
export async function borrarBanco(id) {
  const { rows } = await pool.query(
    `SELECT (SELECT count(*)::int FROM preguntas WHERE banco_id = $1) AS preguntas,
            (SELECT count(*)::int FROM modos WHERE banco_id = $1) AS modos
       FROM bancos WHERE id = $1`,
    [id],
  )
  if (!rows.length) return null
  if (rows[0].preguntas > 0 || rows[0].modos > 0) return { error: 'no_buit' }
  await pool.query('DELETE FROM bancos WHERE id = $1', [id])
  return { fila: { id } }
}
