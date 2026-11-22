import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prepararEntorno } from './preparar.js'
import { reiniciarLimitador, MAX_FALLOS } from '../src/auth/limitador.js'

const PASSWORD = 'contrasenya-de-prova' // la de vitest.config.js

describe.skipIf(!process.env.DATABASE_URL)('consola del profesorado: /api/admin', () => {
  let pool, servidor, base

  beforeAll(async () => {
    ;({ pool, servidor, base } = await prepararEntorno())
  })

  afterAll(async () => {
    servidor?.close()
    await pool?.end()
  })

  beforeEach(() => {
    reiniciarLimitador()
  })

  const login = (password) =>
    fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

  // "sessio_professorat=xxx; Path=...; HttpOnly..." -> "sessio_professorat=xxx"
  const cookieDe = (res) => res.headers.get('set-cookie').split(';')[0]

  const sessio = (cookie) => fetch(`${base}/api/admin/sessio`, { headers: cookie ? { Cookie: cookie } : {} })

  it('con la contraseña correcta crea una sesión de 7 días en una cookie protegida', async () => {
    const res = await login(PASSWORD)
    expect(res.status).toBe(200)
    const cabecera = res.headers.get('set-cookie')
    expect(cabecera).toMatch(/^sessio_professorat=[\w-]{20,};/)
    expect(cabecera).toMatch(/HttpOnly/)
    expect(cabecera).toMatch(/SameSite=Strict/)
    expect(cabecera).toMatch(/Path=\/api\/admin/)
    expect(cabecera).toMatch(/Max-Age=604800/)

    const { caducaEn } = await res.json()
    const dias = (new Date(caducaEn) - Date.now()) / 86_400_000
    expect(dias).toBeGreaterThan(6.99)
    expect(dias).toBeLessThanOrEqual(7)
  })

  it('en la BD solo se guarda el hash del token, nunca el token', async () => {
    const token = cookieDe(await login(PASSWORD)).split('=')[1]
    const { rows } = await pool.query('SELECT token_hash FROM sesiones_profesorado')
    expect(rows.map((r) => r.token_hash)).not.toContain(token)
    expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.token_hash))).toBe(true)
  })

  it('con una contraseña incorrecta (o sin contraseña) da 401 y no crea sesión', async () => {
    for (const password of ['otra', '', undefined, 12345]) {
      const res = await login(password)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'contrasenya_incorrecta' })
      expect(res.headers.get('set-cookie')).toBeNull()
    }
  })

  it(`tras ${MAX_FALLOS} fallos bloquea la IP aunque luego acierte (429)`, async () => {
    for (let i = 0; i < MAX_FALLOS; i++) expect((await login('mal')).status).toBe(401)
    const res = await login(PASSWORD)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('massa_intents')
    expect(body.reintentarEnSegons).toBeGreaterThan(14 * 60)
  })

  it('un acierto reinicia el contador de fallos', async () => {
    for (let i = 0; i < MAX_FALLOS - 1; i++) await login('mal')
    expect((await login(PASSWORD)).status).toBe(200)
    for (let i = 0; i < MAX_FALLOS - 1; i++) expect((await login('mal')).status).toBe(401)
  })

  it('las rutas protegidas exigen sesión: sin cookie o con una inventada, 401', async () => {
    expect((await sessio()).status).toBe(401)
    expect((await sessio('sessio_professorat=inventada')).status).toBe(401)
    expect((await fetch(`${base}/api/admin/qualsevol-cosa`)).status).toBe(401)
  })

  it('con la cookie de sesión, /api/admin/sessio responde con la caducidad', async () => {
    const cookie = cookieDe(await login(PASSWORD))
    const res = await sessio(cookie)
    expect(res.status).toBe(200)
    expect((await res.json()).caducaEn).toBeTruthy()
  })

  it('tras cerrar sesión la cookie ya no sirve', async () => {
    const cookie = cookieDe(await login(PASSWORD))
    const res = await fetch(`${base}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie } })
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toMatch(/sessio_professorat=;/)
    expect((await sessio(cookie)).status).toBe(401)
  })

  it('una sesión caducada se rechaza', async () => {
    const cookie = cookieDe(await login(PASSWORD))
    await pool.query("UPDATE sesiones_profesorado SET caduca_en = now() - interval '1 minute'")
    expect((await sessio(cookie)).status).toBe(401)
  })

  it('en producción la cookie solo viaja por HTTPS (Secure)', async () => {
    const anterior = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      expect((await login(PASSWORD)).headers.get('set-cookie')).toMatch(/Secure/)
    } finally {
      process.env.NODE_ENV = anterior
    }
  })

  it('sin TEACHER_PASSWD la consola queda desactivada (503) y la web de alumnos sigue funcionando', async () => {
    const anterior = process.env.TEACHER_PASSWD
    delete process.env.TEACHER_PASSWD
    try {
      const res = await login('')
      expect(res.status).toBe(503)
      expect(await res.json()).toEqual({ error: 'consola_desactivada' })
      expect((await fetch(`${base}/api/health`)).status).toBe(200)
    } finally {
      process.env.TEACHER_PASSWD = anterior
    }
  })

  it('ningún curso puede usar los slugs reservados "profesorat" ni "api"', async () => {
    for (const slug of ['profesorat', 'api']) {
      await expect(pool.query("INSERT INTO cursos (slug, nombre) VALUES ($1, 'X')", [slug])).rejects.toThrow(
        /cursos_slug_no_reservado/,
      )
    }
  })

  describe('lectura del contenido (solo con sesión)', () => {
    let cookie
    const getAdmin = async (ruta, conCookie = true) => {
      const res = await fetch(base + ruta, { headers: conCookie ? { Cookie: cookie } : {} })
      return { status: res.status, body: await res.json() }
    }

    beforeAll(async () => {
      reiniciarLimitador()
      cookie = cookieDe(await login(PASSWORD))
    })

    it('sin sesión no se puede leer nada', async () => {
      expect((await getAdmin('/api/admin/contingut', false)).status).toBe(401)
      expect((await getAdmin('/api/admin/bancs/1', false)).status).toBe(401)
    })

    it('/contingut devuelve el árbol con ids de la BD y el resumen de los bancos', async () => {
      const { status, body } = await getAdmin('/api/admin/contingut')
      expect(status).toBe(200)
      // La consola ve también los cursos inactivos (2n-5è, todavía sin contenido)
      expect(body.cursos.map((c) => c.slug)).toEqual(['1-primaria', '2-primaria', '3-primaria', '4-primaria', '5-primaria', '6-primaria'])
      expect(body.cursos.filter((c) => !c.activo).map((c) => c.slug)).toEqual(['2-primaria', '3-primaria', '4-primaria', '5-primaria'])
      const angles = body.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'angles')
      expect(angles.id).toEqual(expect.any(Number))
      const vocab = angles.modos.find((m) => m.slug === 'vocabulari')
      const banco = body.bancos.find((b) => b.id === vocab.bancoId)
      expect(banco).toMatchObject({ slug: 'vocabulari-angles-6', formato: 'traduccio', preguntas: 157, preguntasActivas: 157 })
    })

    it('/contingut incluye lo inactivo, marcado (a diferencia de la API pública)', async () => {
      await pool.query("UPDATE modos SET activo = false WHERE slug = 'potencies'")
      await pool.query("UPDATE preguntas SET activo = false WHERE orden <= 2 AND banco_id = (SELECT id FROM bancos WHERE slug = 'problemes-6')")
      try {
        const { body } = await getAdmin('/api/admin/contingut')
        const potencies = body.cursos.find((c) => c.slug === '6-primaria').asignaturas[0].modos.find((m) => m.slug === 'potencies')
        expect(potencies.activo).toBe(false)
        expect(body.bancos.find((b) => b.slug === 'problemes-6')).toMatchObject({ preguntas: 62, preguntasActivas: 60 })
      } finally {
        await pool.query('UPDATE modos SET activo = true')
        await pool.query('UPDATE preguntas SET activo = true')
      }
    })

    it('/bancs/:id devuelve todas las preguntas y los modos que usan el banco', async () => {
      const { body: contenido } = await getAdmin('/api/admin/contingut')
      const id = contenido.bancos.find((b) => b.slug === 'vocabulari-angles-6').id
      await pool.query('UPDATE preguntas SET activo = false WHERE banco_id = $1 AND orden = 1', [id])
      try {
        const { status, body } = await getAdmin(`/api/admin/bancs/${id}`)
        expect(status).toBe(200)
        expect(body.preguntas).toHaveLength(157)
        expect(body.preguntas[0]).toMatchObject({ orden: 1, enunciado: 'A', respuesta: 'un/a', activo: false })
        expect(body.modos.map((m) => m.nombre)).toEqual(['Vocabulari', 'Vocabulari escrit'])
        expect(body.modos[0]).toMatchObject({ curso: '6è de primària', asignatura: 'Anglès' })
      } finally {
        await pool.query('UPDATE preguntas SET activo = true')
      }
    })

    it('/bancs/:id da 404 si no existe o el id no es válido', async () => {
      expect((await getAdmin('/api/admin/bancs/999999')).status).toBe(404)
      expect((await getAdmin('/api/admin/bancs/abc')).status).toBe(404)
    })
  })

  describe('editar preguntas (solo con sesión)', () => {
    let cookie, idBanco
    const pedir = async (metodo, ruta, body, conCookie = true) => {
      const headers = { 'Content-Type': 'application/json', ...(conCookie ? { Cookie: cookie } : {}) }
      const res = await fetch(base + ruta, { method: metodo, headers, body: body && JSON.stringify(body) })
      return { status: res.status, body: res.status === 204 ? null : await res.json() }
    }
    const idDeBanco = async (slug) =>
      (await pool.query('SELECT id::int FROM bancos WHERE slug = $1', [slug])).rows[0].id
    const publicas = async (slug) => (await (await fetch(`${base}/api/bancos/${slug}/preguntas`)).json()).preguntas

    beforeAll(async () => {
      reiniciarLimitador()
      cookie = cookieDe(await login(PASSWORD))
      idBanco = await idDeBanco('vocabulari-angles-6')
    })

    it('sin sesión no se puede crear, editar ni borrar', async () => {
      expect((await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: 'A', respuesta: 'b' }, false)).status).toBe(401)
      expect((await pedir('PATCH', '/api/admin/preguntes/1', { activo: false }, false)).status).toBe(401)
      expect((await pedir('DELETE', '/api/admin/preguntes/1', null, false)).status).toBe(401)
    })

    it('crear: añade al final del banco y los alumnos la ven enseguida', async () => {
      const { status, body } = await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: ' TREE ', respuesta: 'arbre' })
      expect(status).toBe(201)
      expect(body).toMatchObject({ enunciado: 'TREE', respuesta: 'arbre', activo: true, orden: 158 })
      expect((await publicas('vocabulari-angles-6')).map((p) => p.enunciado)).toContain('TREE')
    })

    it('crear con errores: 400 con los errores por campo y no guarda nada', async () => {
      const antes = (await publicas('problemes-6')).length
      const { status, body } = await pedir('POST', `/api/admin/bancs/${await idDeBanco('problemes-6')}/preguntes`, {
        enunciado: '',
        respuesta: 'molts',
      })
      expect(status).toBe(400)
      expect(body.error).toBe('validacio')
      expect(Object.keys(body.camps).sort()).toEqual(['enunciado', 'respuesta'])
      expect((await publicas('problemes-6')).length).toBe(antes)
    })

    it('crear en un banco inexistente: 404', async () => {
      expect((await pedir('POST', '/api/admin/bancs/999999/preguntes', { enunciado: 'A', respuesta: 'b' })).status).toBe(404)
    })

    it('editar: cambio parcial, se valida la pregunta entera y se ve en la API pública', async () => {
      const { body: creada } = await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: 'CAT', respuesta: 'gos' })
      const { status, body } = await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { respuesta: 'gat, moix' })
      expect(status).toBe(200)
      expect(body).toMatchObject({ enunciado: 'CAT', respuesta: 'gat, moix' })
      expect((await publicas('vocabulari-angles-6')).find((p) => p.enunciado === 'CAT').respuesta).toBe('gat, moix')

      const mal = await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { enunciado: '' })
      expect(mal.status).toBe(400)
      expect(mal.body.camps.enunciado).toBeTruthy()
    })

    it('opción múltiple: crear y editar exige que la correcta esté entre las opciones', async () => {
      const id = await idDeBanco('gramatica-angles-6')
      const { status, body } = await pedir('POST', `/api/admin/bancs/${id}/preguntes`, {
        enunciado: 'There ___ a castle.', opciones: ['is', 'are', 'were'], respuesta: 'is',
      })
      expect(status).toBe(201)
      expect(body.opciones).toEqual(['is', 'are', 'were'])
      const mal = await pedir('PATCH', `/api/admin/preguntes/${body.id}`, { opciones: ['are', 'were'] })
      expect(mal.status).toBe(400)
      expect(mal.body.camps.respuesta).toMatch(/correcta/)
    })

    it('desactivar la oculta a los alumnos sin borrarla; reactivar la recupera', async () => {
      const { body: creada } = await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: 'DOG', respuesta: 'gos' })
      expect((await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { activo: false })).body.activo).toBe(false)
      expect((await publicas('vocabulari-angles-6')).map((p) => p.enunciado)).not.toContain('DOG')
      await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { activo: true })
      expect((await publicas('vocabulari-angles-6')).map((p) => p.enunciado)).toContain('DOG')
    })

    it('borrar: 204, desaparece; borrarla otra vez da 404', async () => {
      const { body: creada } = await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: 'BIRD', respuesta: 'ocell' })
      expect((await pedir('DELETE', `/api/admin/preguntes/${creada.id}`)).status).toBe(204)
      expect((await publicas('vocabulari-angles-6')).map((p) => p.enunciado)).not.toContain('BIRD')
      expect((await pedir('DELETE', `/api/admin/preguntes/${creada.id}`)).status).toBe(404)
      expect((await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { activo: true })).status).toBe(404)
    })

    it('ignora campos que no se pueden editar (como el banco o el orden)', async () => {
      const { body: creada } = await pedir('POST', `/api/admin/bancs/${idBanco}/preguntes`, { enunciado: 'FISH', respuesta: 'peix' })
      const { body } = await pedir('PATCH', `/api/admin/preguntes/${creada.id}`, { banco_id: 1, orden: 1, respuesta: 'peix' })
      expect(body.orden).toBe(creada.orden)
      const { rows } = await pool.query('SELECT banco_id::int FROM preguntas WHERE id = $1', [creada.id])
      expect(rows[0].banco_id).toBe(idBanco)
    })
  })
})
