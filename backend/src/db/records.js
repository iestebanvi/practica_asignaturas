import { pool } from './cliente.js'

// Récords: el mejor bloque de cada alumno en cada modo y nivel (más puntos; si
// empatan, más aciertos; si no, el más antiguo). Solo cuentan los modos
// activos de asignaturas activas del curso. La clave es "asignatura/modo"
// para el nivel 1 y "asignatura/modo/2" (o /3) para los otros.
const MILLORS = `
  SELECT DISTINCT ON (b.alumne_id, b.modo_id, b.nivell)
         b.alumne_id, b.modo_id, b.nivell, b.puntos, b.aciertos, b.preguntas, b.creat_en,
         a.slug || '/' || m.slug || CASE WHEN b.nivell > 1 THEN '/' || b.nivell ELSE '' END AS clau
    FROM blocs b
    JOIN modos m ON m.id = b.modo_id AND m.activo
    JOIN asignaturas a ON a.id = m.asignatura_id AND a.activo
   WHERE a.curso_id = $1
   ORDER BY b.alumne_id, b.modo_id, b.nivell, b.puntos DESC, b.aciertos DESC, b.creat_en ASC`

// Récords de un alumno: { "asignatura/modo": { puntos, aciertos, preguntas } }.
export async function recordsAlumne(cursoId, alumneId) {
  const { rows } = await pool.query(
    `SELECT clau, puntos, aciertos, preguntas FROM (${MILLORS}) millors WHERE alumne_id = $2`,
    [cursoId, alumneId],
  )
  return Object.fromEntries(rows.map(({ clau, ...r }) => [clau, r]))
}

// Los "limite" mejores àlies de cada modo del curso:
// { "asignatura/modo": [{ posicio, alies, puntos, aciertos, preguntas }] }.
export async function recordsCurs(cursoId, limite = 10) {
  const { rows } = await pool.query(
    `SELECT clau, posicio::int, alies, puntos, aciertos, preguntas FROM (
       SELECT millors.*, al.alies,
              row_number() OVER (PARTITION BY millors.modo_id, millors.nivell
                                 ORDER BY millors.puntos DESC, millors.aciertos DESC, millors.creat_en ASC) AS posicio
         FROM (${MILLORS}) millors JOIN alumnes al ON al.id = millors.alumne_id
     ) r
     WHERE posicio <= $2
     ORDER BY clau, posicio`,
    [cursoId, limite],
  )
  const resultado = {}
  for (const { clau, ...fila } of rows) (resultado[clau] ??= []).push(fila)
  return resultado
}

// ¿Tiene el curso activos los récords del curso? (Por defecto, sí.)
export async function recordsCursActius(cursoId) {
  const { rows } = await pool.query("SELECT COALESCE((config->>'recordsCurs')::boolean, true) AS actius FROM cursos WHERE id = $1", [
    cursoId,
  ])
  return rows[0]?.actius ?? false
}
