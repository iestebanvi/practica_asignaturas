import { pool } from './cliente.js'

// Lecturas para la web de alumnos: solo devuelven lo que está activo.

export async function listarCursos() {
  const { rows } = await pool.query(
    `SELECT slug AS id, nombre, icono, color, sombra
       FROM cursos WHERE activo ORDER BY orden, id`,
  )
  return rows
}

// Árbol completo de un curso (asignaturas y modos) en una sola consulta, con
// la misma forma que frontend/src/logic/cursos.js pero con arrays ordenados.
export async function obtenerArbolCurso(slug) {
  const { rows } = await pool.query(
    `SELECT c.slug AS id, c.nombre, c.icono, c.color, c.sombra, c.nivel, c.config,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'id', a.slug, 'nombre', a.nombre, 'icono', a.icono,
                       'color', a.color, 'sombra', a.sombra,
                       'modos', COALESCE((
                         SELECT json_agg(json_build_object(
                                  'id', m.slug, 'nombre', m.nombre,
                                  'color', m.color, 'sombra', m.sombra,
                                  'operaciones', m.operaciones, 'banco', b.slug
                                ) ORDER BY m.orden, m.id)
                           FROM modos m LEFT JOIN bancos b ON b.id = m.banco_id
                          WHERE m.asignatura_id = a.id AND m.activo
                       ), '[]'::json)
                     ) ORDER BY a.orden, a.id)
                FROM asignaturas a
               WHERE a.curso_id = c.id AND a.activo
            ), '[]'::json) AS asignaturas
       FROM cursos c
      WHERE c.slug = $1 AND c.activo`,
    [slug],
  )
  return rows[0] ?? null
}

// Preguntas activas de un banco, o null si el banco no existe.
export async function obtenerBanco(slug) {
  const { rows: bancos } = await pool.query('SELECT id, slug, formato FROM bancos WHERE slug = $1', [slug])
  if (!bancos.length) return null
  const banco = bancos[0]
  const { rows: preguntas } = await pool.query(
    `SELECT id, orden, enunciado, respuesta, opciones, alternativas
       FROM preguntas WHERE banco_id = $1 AND activo ORDER BY orden, id`,
    [banco.id],
  )
  return { slug: banco.slug, formato: banco.formato, preguntas }
}
