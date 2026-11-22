import { pool } from './cliente.js'
import { validarEstructura } from '../validacion/estructura.js'

// Crear, editar, mover y borrar cursos y asignaturas. Cada operación devuelve
// { fila } | { errores } | { error: 'no_buit' } | null (si no existe).

const TABLAS = {
  curso: {
    tabla: 'cursos',
    padre: null,
    hijos: { tabla: 'asignaturas', columna: 'curso_id' },
    columnas: 'id::int, slug, nombre, icono, color, sombra, nivel, config, activo',
    editables: ['nombre', 'icono', 'color', 'sombra', 'nivel', 'config', 'activo'],
  },
  asignatura: {
    tabla: 'asignaturas',
    padre: 'curso_id',
    hijos: { tabla: 'modos', columna: 'asignatura_id' },
    columnas: 'id::int, curso_id::int AS "cursoId", slug, nombre, icono, color, sombra, activo',
    editables: ['nombre', 'icono', 'color', 'sombra', 'activo'],
  },
  // Los modos solo usan "mover" de aquí (crear/editar/borrar: db/modos.js).
  modo: {
    tabla: 'modos',
    padre: 'asignatura_id',
    columnas: 'id::int, asignatura_id::int AS "asignaturaId", slug, nombre, color, sombra, operaciones, banco_id::int AS "bancoId", activo',
  },
}

const valorSql = (campo, valor) => (campo === 'config' ? JSON.stringify(valor) : valor)

// Un slug repetido llega como violación de UNIQUE: se convierte en un error
// del campo, como el resto de validaciones.
function slugRepetido(err) {
  return err.code === '23505' ? { errores: { slug: 'Ja hi ha un element amb aquesta adreça.' } } : null
}

export async function crear(tipo, datos, padreId = null) {
  const { tabla, padre, columnas } = TABLAS[tipo]
  const { valores, errores } = validarEstructura(tipo, datos, { creando: true })
  if (errores) return { errores }
  if (padre) {
    const { rowCount } = await pool.query('SELECT 1 FROM cursos WHERE id = $1', [padreId])
    if (!rowCount) return null
  }

  const campos = Object.keys(valores)
  const params = campos.map((c) => valorSql(c, valores[c]))
  const columnasInsert = [...campos, ...(padre ? [padre] : [])]
  if (padre) params.push(padreId)
  const filtroPadre = padre ? `WHERE ${padre} = $${params.length}` : ''
  try {
    const { rows } = await pool.query(
      `INSERT INTO ${tabla} (${columnasInsert.join(', ')}, orden)
       VALUES (${columnasInsert.map((_, i) => `$${i + 1}`).join(', ')},
               (SELECT COALESCE(max(orden), -1) + 1 FROM ${tabla} ${filtroPadre}))
       RETURNING ${columnas}`,
      params,
    )
    return { fila: rows[0] }
  } catch (err) {
    const repetido = slugRepetido(err)
    if (repetido) return repetido
    throw err
  }
}

export async function actualizar(tipo, id, cambios) {
  const { tabla, columnas, editables } = TABLAS[tipo]
  const { valores, errores } = validarEstructura(tipo, cambios ?? {})
  if (errores) return { errores }
  const campos = Object.keys(valores).filter((c) => editables.includes(c))
  const sets = campos.map((c, i) => `${c} = $${i + 2}`)
  const { rows } = await pool.query(
    `UPDATE ${tabla} SET ${[...sets, 'actualizado_en = now()'].join(', ')} WHERE id = $1 RETURNING ${columnas}`,
    [id, ...campos.map((c) => valorSql(c, valores[c]))],
  )
  return rows.length ? { fila: rows[0] } : null
}

// Solo si está vacío (un curso sin asignaturas, una asignatura sin modos).
export async function borrar(tipo, id) {
  const { tabla, hijos } = TABLAS[tipo]
  const { rows } = await pool.query(
    `SELECT (SELECT count(*)::int FROM ${hijos.tabla} WHERE ${hijos.columna} = $1) AS hijos
       FROM ${tabla} WHERE id = $1`,
    [id],
  )
  if (!rows.length) return null
  if (rows[0].hijos > 0) return { error: 'no_buit' }
  await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [id])
  return { fila: { id } }
}

// Intercambia la posición con el hermano de arriba ('amunt') o de abajo
// ('avall'). De paso renumera el orden de los hermanos (0, 1, 2…).
export async function mover(tipo, id, direccion) {
  const { tabla, padre, columnas } = TABLAS[tipo]
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const { rows: actual } = await cliente.query(
      `SELECT ${padre ? `${padre}::int AS padre` : 'NULL AS padre'} FROM ${tabla} WHERE id = $1`,
      [id],
    )
    if (!actual.length) {
      await cliente.query('ROLLBACK')
      return null
    }
    const { rows: hermanos } = await cliente.query(
      `SELECT id::int FROM ${tabla} ${padre ? `WHERE ${padre} = $1` : ''} ORDER BY orden, id`,
      padre ? [actual[0].padre] : [],
    )
    const ids = hermanos.map((h) => h.id)
    const i = ids.indexOf(id)
    const j = direccion === 'amunt' ? i - 1 : i + 1
    if (j >= 0 && j < ids.length) [ids[i], ids[j]] = [ids[j], ids[i]]
    for (const [orden, hermano] of ids.entries()) {
      await cliente.query(`UPDATE ${tabla} SET orden = $2 WHERE id = $1`, [hermano, orden])
    }
    const { rows } = await cliente.query(`SELECT ${columnas} FROM ${tabla} WHERE id = $1`, [id])
    await cliente.query('COMMIT')
    return { fila: rows[0] }
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    cliente.release()
  }
}
