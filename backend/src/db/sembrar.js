// Vuelca a la BD el árbol de cursos y los bancos de preguntas.
//
// Solo CREA lo que falta, nunca modifica ni borra: así se puede ejecutar las
// veces que haga falta y, cuando el contenido se edite desde la consola, volver
// a lanzarlo no pisará esos cambios. Un banco que ya tiene preguntas no se toca.
//
// Recibe la forma que produce exportarContenido() (backend/datos/contenido.json):
//   cursos: [{ id, ..., asignaturas: [{ id, ..., modos: [{ id, ..., banco }] }] }]
//     (el "id" es el slug; "banco" es el slug del banco del modo, o null)
//   bancos: [{ slug, nombre, formato, preguntas: [{ orden, enunciado, respuesta,
//             opciones?, alternativas?, activo? }] }]
// El orden de los arrays se guarda como "orden".
export async function sembrar(cliente, { cursos, bancos }) {
  const resumen = { cursos: 0, asignaturas: 0, modos: 0, bancos: 0, preguntas: 0 }
  const idBanco = new Map()

  for (const banco of bancos) {
    const { rows } = await cliente.query(
      `INSERT INTO bancos (slug, nombre, formato) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [banco.slug, banco.nombre, banco.formato],
    )
    if (rows.length) resumen.bancos++
    const { rows: [{ id: bancoId }] } = await cliente.query('SELECT id FROM bancos WHERE slug = $1', [banco.slug])
    idBanco.set(banco.slug, bancoId)

    const { rows: [{ n }] } = await cliente.query('SELECT count(*)::int AS n FROM preguntas WHERE banco_id = $1', [bancoId])
    if (n > 0) continue
    for (const p of banco.preguntas) {
      await cliente.query(
        `INSERT INTO preguntas (banco_id, enunciado, respuesta, opciones, alternativas, orden, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          bancoId,
          p.enunciado,
          String(p.respuesta),
          p.opciones ? JSON.stringify(p.opciones) : null,
          p.alternativas ? JSON.stringify(p.alternativas) : null,
          p.orden,
          p.activo ?? true,
        ],
      )
      resumen.preguntas++
    }
  }

  for (const [iCurso, curso] of cursos.entries()) {
    const cursoId = await insertarSiFalta(
      cliente,
      resumen,
      'cursos',
      `INSERT INTO cursos (slug, nombre, icono, color, sombra, nivel, config, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [curso.id, curso.nombre, curso.icono, curso.color, curso.sombra, curso.nivel, JSON.stringify(curso.config), iCurso, curso.activo ?? true],
      'SELECT id FROM cursos WHERE slug = $1',
      [curso.id],
    )

    for (const [iAsig, asig] of curso.asignaturas.entries()) {
      const asigId = await insertarSiFalta(
        cliente,
        resumen,
        'asignaturas',
        `INSERT INTO asignaturas (curso_id, slug, nombre, icono, color, sombra, orden, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (curso_id, slug) DO NOTHING RETURNING id`,
        [cursoId, asig.id, asig.nombre, asig.icono, asig.color, asig.sombra, iAsig, asig.activo ?? true],
        'SELECT id FROM asignaturas WHERE curso_id = $1 AND slug = $2',
        [cursoId, asig.id],
      )

      for (const [iModo, modo] of asig.modos.entries()) {
        if (modo.banco && !idBanco.has(modo.banco)) {
          throw new Error(`El modo "${modo.id}" usa el banco "${modo.banco}", que no está en los datos`)
        }
        const bancoId = modo.banco ? idBanco.get(modo.banco) : null
        await insertarSiFalta(
          cliente,
          resumen,
          'modos',
          `INSERT INTO modos (asignatura_id, slug, nombre, color, sombra, operaciones, banco_id, orden, activo, bloc)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (asignatura_id, slug) DO NOTHING RETURNING id`,
          [asigId, modo.id, modo.nombre, modo.color, modo.sombra, modo.operaciones, bancoId, iModo, modo.activo ?? true, modo.bloc ?? null],
        )
      }
    }
  }

  return resumen
}

async function insertarSiFalta(cliente, resumen, tabla, sqlInsert, params, sqlSelect, paramsSelect) {
  const { rows } = await cliente.query(sqlInsert, params)
  if (rows.length) {
    resumen[tabla]++
    return rows[0].id
  }
  if (!sqlSelect) return null
  const { rows: existente } = await cliente.query(sqlSelect, paramsSelect)
  return existente[0].id
}
