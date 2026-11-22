import { pool } from './cliente.js'
import { interpretarImportacion, MAX_LINEAS, CABECERAS, campoCsv } from '../validacion/importar.js'

function resumir(lineas) {
  const resumen = { ok: 0, error: 0, repetida: 0 }
  for (const l of lineas) resumen[l.estado]++
  return resumen
}

async function bancoConEnunciados(cliente, bancoId) {
  const { rows } = await cliente.query('SELECT id::int, slug, formato FROM bancos WHERE id = $1', [bancoId])
  if (!rows.length) return null
  const { rows: preguntas } = await cliente.query('SELECT enunciado FROM preguntas WHERE banco_id = $1', [bancoId])
  return { ...rows[0], enunciados: preguntas.map((p) => p.enunciado) }
}

// Sin "importar": solo devuelve la vista previa. Con "importar": guarda las
// líneas correctas (todas o ninguna, en una transacción), al final del banco.
// Devuelve null si el banco no existe, o { error: 'massa_linies' }.
export async function importarPreguntas(bancoId, texto, { importar = false, inactivas = false } = {}) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const banco = await bancoConEnunciados(cliente, bancoId)
    if (!banco) {
      await cliente.query('ROLLBACK')
      return null
    }
    const lineas = interpretarImportacion(banco.formato, texto, banco.enunciados)
    if (lineas.length > MAX_LINEAS) {
      await cliente.query('ROLLBACK')
      return { error: 'massa_linies' }
    }

    let importadas = 0
    if (importar) {
      const { rows } = await cliente.query(
        'SELECT COALESCE(max(orden), 0)::int AS max FROM preguntas WHERE banco_id = $1',
        [bancoId],
      )
      let orden = rows[0].max
      for (const { datos } of lineas.filter((l) => l.estado === 'ok')) {
        await cliente.query(
          `INSERT INTO preguntas (banco_id, enunciado, respuesta, opciones, activo, orden)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [bancoId, datos.enunciado, datos.respuesta, datos.opciones && JSON.stringify(datos.opciones), !inactivas, ++orden],
        )
        importadas++
      }
    }
    await cliente.query(importar ? 'COMMIT' : 'ROLLBACK')
    return { formato: banco.formato, lineas, resumen: resumir(lineas), importadas }
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    cliente.release()
  }
}

// CSV con el mismo formato que la importación (ida y vuelta), con cabecera y
// BOM para que Excel lea bien los acentos. Incluye las preguntas inactivas.
export async function bancoACsv(bancoId) {
  const { rows } = await pool.query('SELECT slug, formato FROM bancos WHERE id = $1', [bancoId])
  if (!rows.length) return null
  const { slug, formato } = rows[0]
  const { rows: preguntas } = await pool.query(
    'SELECT enunciado, respuesta, opciones FROM preguntas WHERE banco_id = $1 ORDER BY orden, id',
    [bancoId],
  )
  const fila = (p) => {
    if (formato !== 'opcio_multiple') return [p.enunciado, p.respuesta]
    // La correcta primero, después el resto de opciones.
    return [p.enunciado, p.respuesta, ...(p.opciones ?? []).filter((o) => o !== p.respuesta)]
  }
  const lineas = [CABECERAS[formato], ...preguntas.map(fila)].map((campos) => campos.map(campoCsv).join(';'))
  return { slug, csv: '﻿' + lineas.join('\r\n') + '\r\n' }
}
