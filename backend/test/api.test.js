import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { leerContenido } from '../scripts/contenido.js'

// Los tests cargan en el esquema "test" la copia del contenido real
// (backend/datos/contenido.json).
const contenido = leerContenido()

// Sin DATABASE_URL (p.ej. en una máquina sin .env) estos tests se saltan.
describe.skipIf(!process.env.DATABASE_URL)('API sobre la BD (esquema "test")', () => {
  let pool, servidor, base, sembrar, ejecutarMigraciones, exportarContenido

  beforeAll(async () => {
    // Imports dinámicos: cliente.js exige DATABASE_URL al cargarse.
    ;({ pool } = await import('../src/db/cliente.js'))
    ;({ ejecutarMigraciones } = await import('../src/db/migrar.js'))
    ;({ sembrar } = await import('../src/db/sembrar.js'))
    ;({ exportarContenido } = await import('../src/db/exportar.js'))
    const { crearApp } = await import('../src/app.js')

    expect(process.env.DB_SCHEMA).toBe('test')
    await pool.query('DROP SCHEMA IF EXISTS test CASCADE')
    await ejecutarMigraciones()
    const cliente = await pool.connect()
    try {
      await sembrar(cliente, contenido)
    } finally {
      cliente.release()
    }

    servidor = crearApp().listen(0)
    await new Promise((ok) => servidor.once('listening', ok))
    base = `http://127.0.0.1:${servidor.address().port}`
  })

  afterAll(async () => {
    servidor?.close()
    await pool?.end()
  })

  const get = async (ruta) => {
    const res = await fetch(base + ruta)
    return { status: res.status, body: await res.json() }
  }

  it('sembrar + exportar es un viaje de ida y vuelta exacto (el export es una copia fiel)', async () => {
    expect(await exportarContenido(pool)).toEqual(contenido)
  })

  describe('/api/cursos', () => {
    it('lista los cursos activos en orden', async () => {
      const { body } = await get('/api/cursos')
      expect(body.map((c) => c.id)).toEqual(['1-primaria', '6-primaria'])
      expect(body[0]).toMatchObject({ nombre: '1r de primària', icono: '🐣', color: '#ff8a65' })
    })

    it('devuelve el árbol completo de un curso, igual que cursos.js', async () => {
      const { status, body } = await get('/api/cursos/6-primaria')
      expect(status).toBe(200)
      expect(body).toMatchObject({ id: '6-primaria', nivel: 'medio', config: { majuscules: false, celebracio: false } })
      expect(body.asignaturas.map((a) => a.id)).toEqual(['matematiques', 'angles', 'medi'])

      const original = contenido.cursos.find((c) => c.id === '6-primaria')
      expect(original).toBeTruthy()
      for (const [i, asig] of original.asignaturas.entries()) {
        expect(body.asignaturas[i].modos.map((m) => [m.id, m.nombre, m.operaciones])).toEqual(
          asig.modos.map((m) => [m.id, m.nombre, m.operaciones]),
        )
      }
    })

    it('enlaza cada modo con su banco; Vocabulari y Vocabulari escrit comparten el mismo', async () => {
      const { body } = await get('/api/cursos/6-primaria')
      const modos = Object.fromEntries(body.asignaturas.flatMap((a) => a.modos.map((m) => [m.id, m.banco])))
      expect(modos.vocabulari).toBe('vocabulari-angles-6')
      expect(modos['vocabulari-escrit']).toBe('vocabulari-angles-6')
      expect(modos.problemes).toBe('problemes-6')
      expect(modos['canvis-relleu']).toBe('medi-canvis-relleu-6')
      expect(modos.aritmetica).toBeNull()
    })

    it('404 si el curso no existe', async () => {
      const { status, body } = await get('/api/cursos/9-primaria')
      expect(status).toBe(404)
      expect(body.error).toBe('curso_no_encontrado')
    })

    it('oculta lo inactivo (curso, asignatura, modo y pregunta)', async () => {
      await pool.query("UPDATE modos SET activo = false WHERE slug = 'potencies'")
      await pool.query("UPDATE asignaturas SET activo = false WHERE slug = 'medi'")
      await pool.query("UPDATE preguntas SET activo = false WHERE orden = 1 AND banco_id = (SELECT id FROM bancos WHERE slug = 'problemes-6')")
      await pool.query("UPDATE cursos SET activo = false WHERE slug = '1-primaria'")
      try {
        const arbol = (await get('/api/cursos/6-primaria')).body
        expect(arbol.asignaturas.map((a) => a.id)).not.toContain('medi')
        expect(arbol.asignaturas[0].modos.map((m) => m.id)).not.toContain('potencies')
        const problemes = (await get('/api/bancos/problemes-6/preguntas')).body.preguntas
        expect(problemes.map((p) => p.orden)).not.toContain(1)
        expect((await get('/api/cursos')).body.map((c) => c.id)).toEqual(['6-primaria'])
        expect((await get('/api/cursos/1-primaria')).status).toBe(404)
      } finally {
        await pool.query('UPDATE modos SET activo = true')
        await pool.query('UPDATE asignaturas SET activo = true')
        await pool.query('UPDATE preguntas SET activo = true')
        await pool.query('UPDATE cursos SET activo = true')
      }
    })
  })

  describe('/api/bancos/:banco/preguntas', () => {
    it('devuelve las preguntas activas del banco, en orden y tal cual están en la BD', async () => {
      for (const banco of contenido.bancos) {
        const { status, body } = await get(`/api/bancos/${banco.slug}/preguntas`)
        expect(status).toBe(200)
        expect(body.formato).toBe(banco.formato)
        expect(body.preguntas.map(({ orden, enunciado, respuesta }) => ({ orden, enunciado, respuesta }))).toEqual(
          banco.preguntas.filter((p) => p.activo).map(({ orden, enunciado, respuesta }) => ({ orden, enunciado, respuesta })),
        )
      }
    })

    it('devuelve formato y opciones de una pregunta de opción múltiple', async () => {
      const { status, body } = await get('/api/bancos/medi-canvis-relleu-6/preguntas')
      expect(status).toBe(200)
      expect(body.formato).toBe('opcio_multiple')
      expect(body.preguntas).toHaveLength(50)
      expect(body.preguntas[0]).toMatchObject({ orden: 1, respuesta: 'Geosfera' })
    })

    it('404 si el banco no existe', async () => {
      expect((await get('/api/bancos/no-existeix/preguntas')).status).toBe(404)
    })
  })

  it('una ruta /api desconocida da 404 en JSON (no el index.html), también las antiguas ya retiradas', async () => {
    for (const ruta of ['/api/no-existeix', '/api/problemas', '/api/vocabulario']) {
      const { status, body } = await get(ruta)
      expect(status).toBe(404)
      expect(body.error).toBe('no_encontrado')
    }
  })

  it('sembrar rechaza un modo que apunta a un banco inexistente', async () => {
    const roto = structuredClone(contenido)
    roto.cursos[0].asignaturas[0].modos.push({
      id: 'modo-roto', nombre: 'Roto', color: '#000', sombra: '#000', operaciones: ['problema'], banco: 'no-existeix',
    })
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')
      await expect(sembrar(cliente, roto)).rejects.toThrow(/no-existeix/)
    } finally {
      await cliente.query('ROLLBACK')
      cliente.release()
    }
  })

  it('sembrar y migrar son idempotentes: repetirlos no crea ni duplica nada', async () => {
    expect(await ejecutarMigraciones()).toEqual([])
    const cliente = await pool.connect()
    try {
      const resumen = await sembrar(cliente, contenido)
      expect(resumen).toEqual({ cursos: 0, asignaturas: 0, modos: 0, bancos: 0, preguntas: 0 })
    } finally {
      cliente.release()
    }
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM preguntas')
    expect(rows[0].n).toBe(contenido.bancos.reduce((n, b) => n + b.preguntas.length, 0))
  })

  it('sembrar no pisa lo que ya se ha editado', async () => {
    await pool.query("UPDATE modos SET nombre = 'Editat' WHERE slug = 'aritmetica'")
    const cliente = await pool.connect()
    try {
      await sembrar(cliente, contenido)
    } finally {
      cliente.release()
    }
    const { rows } = await pool.query("SELECT nombre FROM modos WHERE slug = 'aritmetica'")
    expect(rows[0].nombre).toBe('Editat')
  })

  it('todas las tablas tienen RLS activado (la API REST de Supabase no puede tocarlas)', async () => {
    const { rows } = await pool.query(
      "SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'test'::regnamespace AND relkind = 'r'",
    )
    expect(rows.length).toBeGreaterThanOrEqual(6)
    for (const r of rows) expect(r.relrowsecurity, r.relname).toBe(true)
  })
})
