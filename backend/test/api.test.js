import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FICHEROS_BANCOS, datosIniciales } from '../scripts/datos-iniciales.js'
import { RUTAS_ANTIGUAS } from '../src/routes/legado.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const leerJson = (fichero) => JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', fichero), 'utf-8'))

// Sin DATABASE_URL (p.ej. en una máquina sin .env) estos tests se saltan.
describe.skipIf(!process.env.DATABASE_URL)('API sobre la BD (esquema "test")', () => {
  let pool, servidor, base, sembrar, ejecutarMigraciones

  beforeAll(async () => {
    // Imports dinámicos: cliente.js exige DATABASE_URL al cargarse.
    ;({ pool } = await import('../src/db/cliente.js'))
    ;({ ejecutarMigraciones } = await import('../src/db/migrar.js'))
    ;({ sembrar } = await import('../src/db/sembrar.js'))
    const { crearApp } = await import('../src/app.js')

    expect(process.env.DB_SCHEMA).toBe('test')
    await pool.query('DROP SCHEMA IF EXISTS test CASCADE')
    await ejecutarMigraciones()
    const cliente = await pool.connect()
    try {
      await sembrar(cliente, datosIniciales())
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

  describe('endpoints antiguos', () => {
    // Garantía de la fase 2: el frontend recibe EXACTAMENTE lo mismo que
    // cuando se servían los JSON.
    for (const [ruta, banco] of Object.entries(RUTAS_ANTIGUAS)) {
      it(`${ruta} devuelve lo mismo que ${FICHEROS_BANCOS[banco]}`, async () => {
        const { status, body } = await get(ruta)
        expect(status).toBe(200)
        expect(body).toEqual(leerJson(FICHEROS_BANCOS[banco]))
      })
    }
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

      const original = datosIniciales().cursos.find((c) => c.id === '6-primaria')
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
        expect((await get('/api/problemas')).body.map((p) => p.id)).not.toContain(1)
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
    it('devuelve formato y preguntas en orden', async () => {
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

  it('una ruta /api desconocida da 404 en JSON (no el index.html)', async () => {
    const { status, body } = await get('/api/no-existeix')
    expect(status).toBe(404)
    expect(body.error).toBe('no_encontrado')
  })

  it('sembrar y migrar son idempotentes: repetirlos no crea ni duplica nada', async () => {
    expect(await ejecutarMigraciones()).toEqual([])
    const cliente = await pool.connect()
    try {
      const resumen = await sembrar(cliente, datosIniciales())
      expect(resumen).toEqual({ cursos: 0, asignaturas: 0, modos: 0, bancos: 0, preguntas: 0 })
    } finally {
      cliente.release()
    }
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM preguntas')
    expect(rows[0].n).toBe(62 + 157 + 50)
  })

  it('sembrar no pisa lo que ya se ha editado', async () => {
    await pool.query("UPDATE modos SET nombre = 'Editat' WHERE slug = 'aritmetica'")
    const cliente = await pool.connect()
    try {
      await sembrar(cliente, datosIniciales())
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
