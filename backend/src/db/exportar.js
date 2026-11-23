// Vuelca TODO el contenido de la BD (también lo inactivo) con la forma que
// espera sembrar(): sirve de copia de seguridad versionada en git, de fuente
// para reconstruir la BD (make seed) y de base para los tests.
export async function exportarContenido(cliente) {
  const { rows: cursos } = await cliente.query(
    `SELECT c.slug AS id, c.nombre, c.icono, c.color, c.sombra, c.nivel, c.config, c.activo,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'id', a.slug, 'nombre', a.nombre, 'icono', a.icono,
                       'color', a.color, 'sombra', a.sombra, 'activo', a.activo,
                       'modos', COALESCE((
                         SELECT json_agg(json_build_object(
                                  'id', m.slug, 'nombre', m.nombre,
                                  'color', m.color, 'sombra', m.sombra,
                                  'operaciones', m.operaciones, 'banco', b.slug, 'bloc', m.bloc, 'params', m.params, 'nivells', m.nivells,
                                  'activo', m.activo
                                ) ORDER BY m.orden, m.id)
                           FROM modos m LEFT JOIN bancos b ON b.id = m.banco_id
                          WHERE m.asignatura_id = a.id
                       ), '[]'::json)
                     ) ORDER BY a.orden, a.id)
                FROM asignaturas a WHERE a.curso_id = c.id
            ), '[]'::json) AS asignaturas
       FROM cursos c ORDER BY c.orden, c.id`,
  )

  const { rows: bancos } = await cliente.query(
    `SELECT b.slug, b.nombre, b.formato,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'orden', p.orden, 'enunciado', p.enunciado, 'respuesta', p.respuesta,
                       'opciones', p.opciones, 'alternativas', p.alternativas, 'activo', p.activo
                     ) ORDER BY p.orden, p.id)
                FROM preguntas p WHERE p.banco_id = b.id
            ), '[]'::json) AS preguntas
       FROM bancos b ORDER BY b.slug`,
  )

  return { cursos, bancos }
}
