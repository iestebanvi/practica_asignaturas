import { pool } from './cliente.js'

// Lecturas para la consola del profesorado: a diferencia de contenido.js,
// incluyen lo inactivo y usan los ids de la BD (los slugs pueden repetirse
// entre cursos distintos). Los ids se pasan a ::int: "pg" devuelve los BIGINT
// sueltos como texto pero dentro de un JSON como número, y así siempre son
// números.

export async function obtenerContenidoAdmin() {
  const { rows: cursos } = await pool.query(
    `SELECT c.id::int, c.slug, c.nombre, c.icono, c.color, c.sombra, c.nivel, c.config, c.activo,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'id', a.id::int, 'slug', a.slug, 'nombre', a.nombre, 'icono', a.icono,
                       'color', a.color, 'sombra', a.sombra, 'activo', a.activo,
                       'modos', COALESCE((
                         SELECT json_agg(json_build_object(
                                  'id', m.id::int, 'slug', m.slug, 'nombre', m.nombre,
                                  'color', m.color, 'sombra', m.sombra, 'activo', m.activo,
                                  'operaciones', m.operaciones, 'bancoId', m.banco_id::int, 'bloc', m.bloc
                                ) ORDER BY m.orden, m.id)
                           FROM modos m WHERE m.asignatura_id = a.id
                       ), '[]'::json)
                     ) ORDER BY a.orden, a.id)
                FROM asignaturas a WHERE a.curso_id = c.id
            ), '[]'::json) AS asignaturas
       FROM cursos c ORDER BY c.orden, c.id`,
  )

  const { rows: bancos } = await pool.query(
    `SELECT b.id::int, b.slug, b.nombre, b.formato,
            count(p.id)::int AS preguntas,
            (count(p.id) FILTER (WHERE p.activo))::int AS "preguntasActivas"
       FROM bancos b LEFT JOIN preguntas p ON p.banco_id = b.id
      GROUP BY b.id ORDER BY b.nombre, b.id`,
  )

  return { cursos, bancos }
}

// Banco con TODAS sus preguntas (también las inactivas) y los modos que lo
// usan (con su curso y asignatura, para poder enlazarlos). null si no existe.
export async function obtenerBancoAdmin(id) {
  const { rows: bancos } = await pool.query('SELECT id::int, slug, nombre, formato FROM bancos WHERE id = $1', [id])
  if (!bancos.length) return null

  const [{ rows: preguntas }, { rows: modos }] = await Promise.all([
    pool.query(
      `SELECT id::int, orden, enunciado, respuesta, opciones, alternativas, activo
         FROM preguntas WHERE banco_id = $1 ORDER BY orden, id`,
      [id],
    ),
    pool.query(
      `SELECT m.id::int, m.nombre, m.activo, a.nombre AS asignatura, c.nombre AS curso
         FROM modos m JOIN asignaturas a ON a.id = m.asignatura_id JOIN cursos c ON c.id = a.curso_id
        WHERE m.banco_id = $1 ORDER BY c.orden, a.orden, m.orden`,
      [id],
    ),
  ])

  return { ...bancos[0], preguntas, modos }
}
