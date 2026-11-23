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

  describe('importar y exportar (solo con sesión)', () => {
    let cookie
    const pedir = async (metodo, ruta, body, conCookie = true) => {
      const headers = { 'Content-Type': 'application/json', ...(conCookie ? { Cookie: cookie } : {}) }
      return fetch(base + ruta, { method: metodo, headers, body: body && JSON.stringify(body) })
    }
    const idDeBanco = async (slug) =>
      (await pool.query('SELECT id::int FROM bancos WHERE slug = $1', [slug])).rows[0].id
    const contar = async (id) =>
      (await pool.query('SELECT count(*)::int AS n FROM preguntas WHERE banco_id = $1', [id])).rows[0].n

    beforeAll(async () => {
      reiniciarLimitador()
      cookie = cookieDe(await login(PASSWORD))
    })

    it('sin sesión no se puede importar ni descargar', async () => {
      expect((await pedir('POST', '/api/admin/bancs/1/importa', { texto: 'A;b' }, false)).status).toBe(401)
      expect((await pedir('GET', '/api/admin/bancs/1/csv', null, false)).status).toBe(401)
      expect((await pedir('GET', '/api/admin/export', null, false)).status).toBe(401)
    })

    it('revisar no guarda nada y devuelve el estado de cada línea', async () => {
      const id = await idDeBanco('vocabulari-angles-6')
      const antes = await contar(id)
      const res = await pedir('POST', `/api/admin/bancs/${id}/importa`, { texto: 'PIG;porc\nBREAKFAST;esmorzar\nSOLO' })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.resumen).toEqual({ ok: 1, error: 1, repetida: 1 })
      expect(body.lineas.map((l) => l.estado)).toEqual(['ok', 'repetida', 'error'])
      expect(body.importadas).toBe(0)
      expect(await contar(id)).toBe(antes)
    })

    it('importar guarda solo las correctas, al final del banco; con "inactivas" quedan ocultas a los alumnos', async () => {
      const id = await idDeBanco('vocabulari-angles-6')
      const antes = await contar(id)
      const res = await pedir('POST', `/api/admin/bancs/${id}/importa`, {
        texto: 'COW;vaca\nHORSE;cavall\nmal format\nBREAKFAST;esmorzar',
        importar: true,
        inactivas: true,
      })
      const body = await res.json()
      expect(body.importadas).toBe(2)
      expect(await contar(id)).toBe(antes + 2)
      const { rows } = await pool.query(
        "SELECT enunciado, activo, orden FROM preguntas WHERE banco_id = $1 AND enunciado IN ('COW', 'HORSE') ORDER BY orden",
        [id],
      )
      expect(rows.map((r) => [r.enunciado, r.activo])).toEqual([['COW', false], ['HORSE', false]])
      expect(rows[1].orden).toBe(rows[0].orden + 1)
      const publicas = await (await fetch(`${base}/api/bancos/vocabulari-angles-6/preguntas`)).json()
      expect(publicas.preguntas.map((p) => p.enunciado)).not.toContain('COW')
    })

    it('más de 1000 líneas: 400 y no guarda nada', async () => {
      const id = await idDeBanco('vocabulari-angles-6')
      const antes = await contar(id)
      const texto = Array.from({ length: 1001 }, (_, i) => `WORD${i};paraula${i}`).join('\n')
      const res = await pedir('POST', `/api/admin/bancs/${id}/importa`, { texto, importar: true })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('massa_linies')
      expect(await contar(id)).toBe(antes)
    })

    it('el CSV de un banco se puede volver a importar tal cual (ida y vuelta): todo sale repetido', async () => {
      for (const slug of ['medi-canvis-relleu-6', 'problemes-6', 'vocabulari-angles-6']) {
        const id = await idDeBanco(slug)
        const res = await pedir('GET', `/api/admin/bancs/${id}/csv`)
        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toMatch(/text\/csv/)
        expect(res.headers.get('content-disposition')).toMatch(new RegExp(`${slug}\\.csv`))
        // BOM UTF-8 (EF BB BF) para que Excel lea bien los acentos. Se mira en
        // los bytes: res.text() lo quita al decodificar.
        const bytes = new Uint8Array(await res.arrayBuffer())
        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
        const csv = new TextDecoder().decode(bytes)

        const revisio = await (await pedir('POST', `/api/admin/bancs/${id}/importa`, { texto: csv })).json()
        expect(revisio.resumen).toEqual({ ok: 0, error: 0, repetida: await contar(id) })
      }
    })

    it('en el CSV de opción múltiple la correcta va primero', async () => {
      const id = await idDeBanco('medi-canvis-relleu-6')
      const csv = await (await pedir('GET', `/api/admin/bancs/${id}/csv`)).text()
      const [cabecera, primera] = csv.replace('\uFEFF', '').split('\r\n')
      expect(cabecera).toBe('enunciat;correcta;incorrecta;incorrecta')
      expect(primera).toBe('Quina capa de la Terra és la gran massa rocosa compacta i arrodonida?;Geosfera;Hidrosfera;Atmosfera;Astenosfera')
    })

    it('la copia completa tiene el formato de contenido.json', async () => {
      const res = await pedir('GET', '/api/admin/export')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-disposition')).toMatch(/contingut-\d{4}-\d{2}-\d{2}\.json/)
      const copia = await res.json()
      expect(copia.cursos.map((c) => c.id)).toContain('6-primaria')
      expect(copia.bancos.find((b) => b.slug === 'problemes-6').preguntas.length).toBeGreaterThanOrEqual(62)
    })

    it('importar en un banco inexistente: 404; sin texto: 400', async () => {
      expect((await pedir('POST', '/api/admin/bancs/999999/importa', { texto: 'A;b' })).status).toBe(404)
      expect((await pedir('POST', '/api/admin/bancs/1/importa', {})).status).toBe(400)
    })
  })

  describe('cursos y asignaturas (solo con sesión)', () => {
    let cookie
    const pedir = async (metodo, ruta, body, conCookie = true) => {
      const headers = { 'Content-Type': 'application/json', ...(conCookie ? { Cookie: cookie } : {}) }
      const res = await fetch(base + ruta, { method: metodo, headers, body: body && JSON.stringify(body) })
      return { status: res.status, body: res.status === 204 ? null : await res.json() }
    }
    const publicos = async () => (await (await fetch(`${base}/api/cursos`)).json()).map((c) => c.id)
    const ordenCursos = async () =>
      (await pool.query('SELECT slug FROM cursos ORDER BY orden, id')).rows.map((r) => r.slug)

    beforeAll(async () => {
      reiniciarLimitador()
      cookie = cookieDe(await login(PASSWORD))
    })

    it('sin sesión no se puede crear, editar, mover ni borrar', async () => {
      expect((await pedir('POST', '/api/admin/cursos', { nombre: 'X', slug: 'x' }, false)).status).toBe(401)
      expect((await pedir('PATCH', '/api/admin/cursos/1', { activo: true }, false)).status).toBe(401)
      expect((await pedir('POST', '/api/admin/cursos/1/mou', { direccio: 'amunt' }, false)).status).toBe(401)
      expect((await pedir('DELETE', '/api/admin/assignatures/1', null, false)).status).toBe(401)
    })

    it('crear un curso: inactivo, al final, con la sombra calculada; no lo ven los alumnos hasta activarlo', async () => {
      const { status, body } = await pedir('POST', '/api/admin/cursos', {
        nombre: 'Prova', slug: 'prova', icono: '🧪', color: '#FF0000', nivel: 'facil', config: { majuscules: true },
      })
      expect(status).toBe(201)
      expect(body).toMatchObject({
        slug: 'prova', nombre: 'Prova', icono: '🧪', color: '#ff0000', sombra: '#b30000', nivel: 'facil',
        config: { majuscules: true, celebracio: false, bloc: 30 }, activo: false,
      })
      expect((await ordenCursos()).at(-1)).toBe('prova')
      expect(await publicos()).not.toContain('prova')

      const activado = await pedir('PATCH', `/api/admin/cursos/${body.id}`, { activo: true, nombre: 'Prova 2' })
      expect(activado.body).toMatchObject({ activo: true, nombre: 'Prova 2', slug: 'prova' })
      expect(await publicos()).toContain('prova')
    })

    it('slug repetido o reservado: 400 en el campo slug', async () => {
      const repetido = await pedir('POST', '/api/admin/cursos', { nombre: 'Altre 6è', slug: '6-primaria' })
      expect(repetido.status).toBe(400)
      expect(repetido.body.camps.slug).toMatch(/Ja hi ha/)
      const reservado = await pedir('POST', '/api/admin/cursos', { nombre: 'Consola', slug: 'profesorat' })
      expect(reservado.body.camps.slug).toMatch(/reservat/)
    })

    it('el slug no cambia aunque se envíe al editar', async () => {
      const { body: curso } = await pedir('POST', '/api/admin/cursos', { nombre: 'Fix', slug: 'fix' })
      const { body } = await pedir('PATCH', `/api/admin/cursos/${curso.id}`, { slug: 'canviat', nombre: 'Fix 2' })
      expect(body.slug).toBe('fix')
    })

    it('asignaturas: crear dentro de un curso (slug único solo dentro del curso) y editar', async () => {
      const { body: curso } = await pedir('POST', '/api/admin/cursos', { nombre: 'Amb assignatures', slug: 'amb-assignatures' })
      const { status, body } = await pedir('POST', `/api/admin/cursos/${curso.id}/assignatures`, {
        nombre: 'Matemàtiques', slug: 'matematiques', icono: '🔢', color: '#00ff00',
      })
      expect(status).toBe(201)
      expect(body).toMatchObject({ cursoId: curso.id, slug: 'matematiques', activo: false, sombra: '#00b300' })

      // El mismo slug en otro curso (6è ya tiene "matematiques") está permitido; en el mismo, no
      const repetida = await pedir('POST', `/api/admin/cursos/${curso.id}/assignatures`, { nombre: 'Mates', slug: 'matematiques' })
      expect(repetida.body.camps.slug).toMatch(/Ja hi ha/)

      const editada = await pedir('PATCH', `/api/admin/assignatures/${body.id}`, { nombre: 'Mates', nivel: 'facil' })
      expect(editada.body.nombre).toBe('Mates')
      expect(editada.body).not.toHaveProperty('nivel')

      expect((await pedir('POST', '/api/admin/cursos/999999/assignatures', { nombre: 'X', slug: 'x' })).status).toBe(404)
    })

    it('mover: intercambia con el vecino; en los extremos no hace nada', async () => {
      const { rows } = await pool.query("SELECT id::int FROM cursos WHERE slug = '2-primaria'")
      const id = rows[0].id
      const antes = await ordenCursos()
      const i = antes.indexOf('2-primaria')

      await pedir('POST', `/api/admin/cursos/${id}/mou`, { direccio: 'amunt' })
      const despues = await ordenCursos()
      expect(despues[i - 1]).toBe('2-primaria')
      expect(despues[i]).toBe(antes[i - 1])

      await pedir('POST', `/api/admin/cursos/${id}/mou`, { direccio: 'avall' })
      expect(await ordenCursos()).toEqual(antes)

      const primero = (await pool.query('SELECT id::int FROM cursos ORDER BY orden, id LIMIT 1')).rows[0].id
      await pedir('POST', `/api/admin/cursos/${primero}/mou`, { direccio: 'amunt' })
      expect(await ordenCursos()).toEqual(antes)
      expect((await pedir('POST', `/api/admin/cursos/${id}/mou`, { direccio: 'lateral' })).status).toBe(400)
    })

    it('borrar solo si está vacío: un curso con asignaturas o una asignatura con modos da 409', async () => {
      const seis = (await pool.query("SELECT id::int FROM cursos WHERE slug = '6-primaria'")).rows[0].id
      const res = await pedir('DELETE', `/api/admin/cursos/${seis}`)
      expect(res.status).toBe(409)
      expect(res.body.error).toBe('no_buit')
      const mates = (await pool.query('SELECT id::int FROM asignaturas WHERE curso_id = $1 ORDER BY orden LIMIT 1', [seis])).rows[0].id
      expect((await pedir('DELETE', `/api/admin/assignatures/${mates}`)).status).toBe(409)

      const { body: curso } = await pedir('POST', '/api/admin/cursos', { nombre: 'Buit', slug: 'buit' })
      const { body: asig } = await pedir('POST', `/api/admin/cursos/${curso.id}/assignatures`, { nombre: 'A', slug: 'a' })
      expect((await pedir('DELETE', `/api/admin/cursos/${curso.id}`)).status).toBe(409)
      expect((await pedir('DELETE', `/api/admin/assignatures/${asig.id}`)).status).toBe(204)
      expect((await pedir('DELETE', `/api/admin/cursos/${curso.id}`)).status).toBe(204)
      expect((await pedir('DELETE', `/api/admin/cursos/${curso.id}`)).status).toBe(404)
    })
  })

  describe('modos y bancos (solo con sesión)', () => {
    let cookie, asignaturaId
    const pedir = async (metodo, ruta, body, conCookie = true) => {
      const headers = { 'Content-Type': 'application/json', ...(conCookie ? { Cookie: cookie } : {}) }
      const res = await fetch(base + ruta, { method: metodo, headers, body: body && JSON.stringify(body) })
      return { status: res.status, body: res.status === 204 ? null : await res.json() }
    }
    const idDeBanco = async (slug) => (await pool.query('SELECT id::int FROM bancos WHERE slug = $1', [slug])).rows[0].id

    beforeAll(async () => {
      reiniciarLimitador()
      cookie = cookieDe(await login(PASSWORD))
      // Curso y asignatura activos propios para jugar los modos como alumno
      const { body: curso } = await pedir('POST', '/api/admin/cursos', { nombre: 'Modes', slug: 'modes', activo: true })
      const { body: asig } = await pedir('POST', `/api/admin/cursos/${curso.id}/assignatures`, { nombre: 'Prova', slug: 'prova', activo: true })
      asignaturaId = asig.id
    })

    it('sin sesión no se puede tocar ni modos ni bancos', async () => {
      expect((await pedir('POST', `/api/admin/assignatures/${asignaturaId}/modes`, {}, false)).status).toBe(401)
      expect((await pedir('PATCH', '/api/admin/modes/1', {}, false)).status).toBe(401)
      expect((await pedir('POST', '/api/admin/bancs', {}, false)).status).toBe(401)
      expect((await pedir('DELETE', '/api/admin/bancs/1', null, false)).status).toBe(401)
    })

    it('crear un modo de ejercicios generados: aparece en el árbol público al activarlo', async () => {
      const { status, body } = await pedir('POST', `/api/admin/assignatures/${asignaturaId}/modes`, {
        nombre: 'Sumes i restes', slug: 'sumes-restes', color: '#00acc1', operaciones: ['suma', 'resta'],
      })
      expect(status).toBe(201)
      expect(body).toMatchObject({ asignaturaId, slug: 'sumes-restes', operaciones: ['suma', 'resta'], bancoId: null, activo: false, sombra: '#007887' })

      const arbol = async () => (await (await fetch(`${base}/api/cursos/modes`)).json()).asignaturas[0].modos
      expect(await arbol()).toEqual([])
      await pedir('PATCH', `/api/admin/modes/${body.id}`, { activo: true })
      expect((await arbol()).map((m) => [m.id, m.operaciones, m.banco])).toEqual([['sumes-restes', ['suma', 'resta'], null]])
    })

    it('modo de banco: banco obligatorio, existente y de formato compatible', async () => {
      const ruta = `/api/admin/assignatures/${asignaturaId}/modes`
      const datos = { nombre: 'Vocabulari', slug: 'vocabulari', operaciones: ['vocabulario'] }
      expect((await pedir('POST', ruta, datos)).body.camps.bancoId).toMatch(/Tria/)
      expect((await pedir('POST', ruta, { ...datos, bancoId: 999999 })).body.camps.bancoId).toMatch(/no existeix/)
      const incompatible = await pedir('POST', ruta, { ...datos, bancoId: await idDeBanco('problemes-6') })
      expect(incompatible.body.camps.bancoId).toMatch(/format/)

      const ok = await pedir('POST', ruta, { ...datos, bancoId: await idDeBanco('vocabulari-angles-6') })
      expect(ok.status).toBe(201)
      expect(ok.body.bancoId).toBe(await idDeBanco('vocabulari-angles-6'))
    })

    it('editar: cambiar a tipos generados quita el banco; el slug no cambia; validación del modo entero', async () => {
      const { body: modo } = await pedir('POST', `/api/admin/assignatures/${asignaturaId}/modes`, {
        nombre: 'Problemes', slug: 'problemes', operaciones: ['problema'], bancoId: await idDeBanco('problemes-6'),
      })
      const { body } = await pedir('PATCH', `/api/admin/modes/${modo.id}`, { operaciones: ['multiplicacion'], slug: 'altre' })
      expect(body).toMatchObject({ operaciones: ['multiplicacion'], bancoId: null, slug: 'problemes' })
      const mal = await pedir('PATCH', `/api/admin/modes/${modo.id}`, { operaciones: ['gramatica'] })
      expect(mal.status).toBe(400)
      expect(mal.body.camps.bancoId).toBeTruthy()
    })

    it('slug repetido en la misma asignatura: 400', async () => {
      const r = await pedir('POST', `/api/admin/assignatures/${asignaturaId}/modes`, { nombre: 'X', slug: 'sumes-restes', operaciones: ['suma'] })
      expect(r.body.camps.slug).toMatch(/Ja hi ha/)
    })

    it('mover y borrar modos; borrar no toca el banco ni sus preguntas', async () => {
      const ruta = `/api/admin/assignatures/${asignaturaId}/modes`
      const { body: a } = await pedir('POST', ruta, { nombre: 'A', slug: 'a', operaciones: ['suma'] })
      const { body: b } = await pedir('POST', ruta, { nombre: 'B', slug: 'b', operaciones: ['vocabulario'], bancoId: await idDeBanco('vocabulari-angles-6') })
      const orden = async () =>
        (await pool.query('SELECT slug FROM modos WHERE asignatura_id = $1 ORDER BY orden, id', [asignaturaId])).rows.map((r) => r.slug)
      await pedir('POST', `/api/admin/modes/${b.id}/mou`, { direccio: 'amunt' })
      const despues = await orden()
      expect(despues.indexOf('b')).toBe(despues.indexOf('a') - 1)

      const preguntasAntes = (await pool.query('SELECT count(*)::int AS n FROM preguntas WHERE banco_id = $1', [b.bancoId])).rows[0].n
      expect((await pedir('DELETE', `/api/admin/modes/${b.id}`)).status).toBe(204)
      expect((await pedir('DELETE', `/api/admin/modes/${b.id}`)).status).toBe(404)
      const preguntasDespues = (await pool.query('SELECT count(*)::int AS n FROM preguntas WHERE banco_id = $1', [b.bancoId])).rows[0].n
      expect(preguntasDespues).toBe(preguntasAntes)
      expect((await pedir('DELETE', `/api/admin/modes/${a.id}`)).status).toBe(204)
    })

    it('bancos: crear (vacío), renombrar, y borrar solo si está vacío y sin uso', async () => {
      const { status, body: banco } = await pedir('POST', '/api/admin/bancs', { nombre: 'Música', slug: 'musica', formato: 'opcio_multiple' })
      expect(status).toBe(201)
      expect(banco).toMatchObject({ slug: 'musica', formato: 'opcio_multiple' })
      expect((await pedir('POST', '/api/admin/bancs', { nombre: 'Altre', slug: 'musica', formato: 'traduccio' })).body.camps.slug).toMatch(/Ja hi ha/)

      const renombrado = await pedir('PATCH', `/api/admin/bancs/${banco.id}`, { nombre: 'Música (2n)', formato: 'traduccio' })
      expect(renombrado.body).toMatchObject({ nombre: 'Música (2n)', formato: 'opcio_multiple' })

      // Usado por un modo: no se puede borrar
      const { body: modo } = await pedir('POST', `/api/admin/assignatures/${asignaturaId}/modes`, {
        nombre: 'Música', slug: 'musica', operaciones: ['gramatica'], bancoId: banco.id,
      })
      expect((await pedir('DELETE', `/api/admin/bancs/${banco.id}`)).status).toBe(409)
      await pedir('DELETE', `/api/admin/modes/${modo.id}`)

      // Con preguntas: tampoco
      const { body: pregunta } = await pedir('POST', `/api/admin/bancs/${banco.id}/preguntes`, { enunciado: 'Do?', opciones: ['Do', 'Re'], respuesta: 'Do' })
      expect((await pedir('DELETE', `/api/admin/bancs/${banco.id}`)).status).toBe(409)
      await pedir('DELETE', `/api/admin/preguntes/${pregunta.id}`)

      expect((await pedir('DELETE', `/api/admin/bancs/${banco.id}`)).status).toBe(204)
      expect((await pedir('GET', `/api/admin/bancs/${banco.id}`)).status).toBe(404)
    })
  })
})
