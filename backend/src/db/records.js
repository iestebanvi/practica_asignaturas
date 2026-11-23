import { pool } from './cliente.js'

// Récords: el mejor bloque de cada alumno en cada modo (más puntos; si empatan,
// más aciertos; si no, el más antiguo). Solo cuentan los modos activos de
// asignaturas activas del curso.
const MILLORS = `
  SELECT DISTINCT ON (b.alumne_id, b.modo_id)
         b.alumne_id, b.modo_id, b.puntos, b.aciertos, b.preguntas, b.creat_en,
         a.slug AS asignatura, m.slug AS modo
    FROM blocs b
    JOIN modos m ON m.id = b.modo_id AND m.activo
    JOIN asignaturas a ON a.id = m.asignatura_id AND a.activo
   WHERE a.curso_id = $1
   ORDER BY b.alumne_id, b.modo_id, b.puntos DESC, b.aciertos DESC, b.creat_en ASC`

// Récords de un alumno: { "asignatura/modo": { puntos, aciertos, preguntas } }.
export async function recordsAlumne(cursoId, alumneId) {
  const { rows } = await pool.query(
    `SELECT asignatura, modo, puntos, aciertos, preguntas FROM (${MILLORS}) millors WHERE alumne_id = $2`,
    [cursoId, alumneId],
  )
  return Object.fromEntries(rows.map((r) => [`${r.asignatura}/${r.modo}`, { puntos: r.puntos, aciertos: r.aciertos, preguntas: r.preguntas }]))
}

// Los "limite" mejores àlies de cada modo del curso:
// { "asignatura/modo": [{ posicio, alies, puntos, aciertos, preguntas }] }.
export async function recordsCurs(cursoId, limite = 10) {
  const { rows } = await pool.query(
    `SELECT asignatura, modo, posicio::int, alies, puntos, aciertos, preguntas FROM (
       SELECT millors.*, al.alies,
              row_number() OVER (PARTITION BY millors.modo_id
                                 ORDER BY millors.puntos DESC, millors.aciertos DESC, millors.creat_en ASC) AS posicio
         FROM (${MILLORS}) millors JOIN alumnes al ON al.id = millors.alumne_id
     ) r
     WHERE posicio <= $2
     ORDER BY asignatura, modo, posicio`,
    [cursoId, limite],
  )
  const resultado = {}
  for (const { asignatura, modo, ...fila } of rows) (resultado[`${asignatura}/${modo}`] ??= []).push(fila)
  return resultado
}

// ¿Tiene el curso activos los récords del curso? (Por defecto, sí.)
export async function recordsCursActius(cursoId) {
  const { rows } = await pool.query("SELECT COALESCE((config->>'recordsCurs')::boolean, true) AS actius FROM cursos WHERE id = $1", [
    cursoId,
  ])
  return rows[0]?.actius ?? false
}
