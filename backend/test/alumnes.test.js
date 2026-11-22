import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prepararEntorno } from './preparar.js'
import { validarAlies, normalizarAlies, generarPin, hashPin, pinCorrecto } from '../src/validacion/alies.js'
import { MAX_FALLOS } from '../src/auth/limitador.js'

describe('àlies y PIN (funciones)', () => {
  it('normaliza: sin mayúsculas, acentos ni espacios de más', () => {
    expect(normalizarAlies('  NÍL   Màster ')).toBe('nil master')
  })

  it('valida longitud y caracteres', () => {
    expect(validarAlies('  Nil   Màster ').alies).toBe('Nil Màster')
    expect(validarAlies('N').error).toMatch(/almenys/)
    expect(validarAlies('x'.repeat(21)).error).toMatch(/màxim/)
    expect(validarAlies('Nil<script>').error).toMatch(/només/)
    expect(validarAlies(undefined).error).toBeTruthy()
  })

  it('PIN de 4 cifras, guardado con sal (dos hashes del mismo PIN son distintos)', () => {
    for (let i = 0; i < 50; i++) expect(generarPin()).toMatch(/^\d{4}$/)
    const a = hashPin('0042')
    expect(a).not.toBe(hashPin('0042'))
    expect(pinCorrecto('0042', a)).toBe(true)
    expect(pinCorrecto('0043', a)).toBe(false)
    expect(pinCorrecto('42', a)).toBe(false)
    expect(pinCorrecto(42, a)).toBe(false)
  })
})

describe.skipIf(!process.env.DATABASE_URL)('alumnos: /api/alumnes', () => {
  let pool, servidor, base, limitadorPin

  beforeAll(async () => {
    ;({ pool, servidor, base } = await prepararEntorno())
    ;({ limitadorPin } = await import('../src/routes/alumnes.js'))
  })

  afterAll(async () => {
    servidor?.close()
    await pool?.end()
  })

  beforeEach(() => limitadorPin.reiniciar())

  // Devuelve { status, body, cookie } (cookie = "nombre=valor" si la hay).
  async function pedir(metodo, ruta, body, cookie) {
    const res = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body && JSON.stringify(body),
    })
    const setCookie = res.headers.get('set-cookie')
    return {
      status: res.status,
      body: res.status === 204 ? null : await res.json(),
      cookie: setCookie?.split(';')[0] ?? null,
      setCookie,
    }
  }
  const idCurso = async (slug) => (await pool.query('SELECT id::int FROM cursos WHERE slug = $1', [slug])).rows[0].id

  it('comprova: un àlies nuevo no existe; no crea nada', async () => {
    const { status, body } = await pedir('POST', '/api/alumnes/comprova', { curs: '6-primaria', alies: ' Nil ' })
    expect(status).toBe(200)
    expect(body).toEqual({ alies: 'Nil', existeix: false })
    expect((await pool.query('SELECT count(*)::int AS n FROM alumnes')).rows[0].n).toBe(0)
  })

  it('crea: devuelve el PIN una vez y abre sesión con una cookie de un año para ese curso', async () => {
    const { status, body, cookie, setCookie } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Nil' })
    expect(status).toBe(201)
    expect(body.alies).toBe('Nil')
    expect(body.pin).toMatch(/^\d{4}$/)
    expect(cookie).toMatch(new RegExp(`^alumne_${await idCurso('6-primaria')}=`))
    expect(setCookie).toMatch(/HttpOnly/)
    expect(setCookie).toMatch(/SameSite=Strict/)
    expect(setCookie).toMatch(/Path=\/api\/alumnes/)
    expect(setCookie).toMatch(/Max-Age=31536000/)

    const jo = await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, cookie)
    expect(jo.body).toEqual({ alumne: { alies: 'Nil' } })
    // En la BD no está el PIN en claro
    const { rows } = await pool.query("SELECT pin_hash FROM alumnes WHERE alies = 'Nil'")
    expect(rows[0].pin_hash).not.toContain(body.pin)
  })

  it('el mismo àlies (sin mayúsculas ni acentos) ya existe: comprova lo dice y crea da 409', async () => {
    expect((await pedir('POST', '/api/alumnes/comprova', { curs: '6-primaria', alies: 'NÍL' })).body).toEqual({
      alies: 'Nil',
      existeix: true,
    })
    expect((await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'nil' })).status).toBe(409)
    // En otro curso es un àlies distinto
    expect((await pedir('POST', '/api/alumnes/comprova', { curs: '1-primaria', alies: 'Nil' })).body.existeix).toBe(false)
  })

  it('entra: con el PIN correcto abre sesión; con uno incorrecto, 401', async () => {
    const { body: creat } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Pantera' })
    const mal = await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'pantera', pin: creat.pin === '0000' ? '0001' : '0000' })
    expect(mal.status).toBe(401)
    expect(mal.body.error).toBe('pin_incorrecte')
    expect(mal.cookie).toBeNull()

    const ok = await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'pantera', pin: creat.pin })
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ alies: 'Pantera' })
    expect((await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, ok.cookie)).body.alumne.alies).toBe('Pantera')
  })

  it(`tras ${MAX_FALLOS} PIN incorrectos el àlies se bloquea (429) aunque luego acierte`, async () => {
    const { body: creat } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Bloquejat' })
    const malo = creat.pin === '0000' ? '0001' : '0000'
    for (let i = 0; i < MAX_FALLOS; i++) {
      expect((await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Bloquejat', pin: malo })).status).toBe(401)
    }
    const r = await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Bloquejat', pin: creat.pin })
    expect(r.status).toBe(429)
    expect(r.body.reintentarEnSegons).toBeGreaterThan(14 * 60)
    // Otro àlies no se ve afectado
    const { body: altre } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Altre' })
    expect((await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Altre', pin: altre.pin })).status).toBe(200)
  })

  it('un àlies inexistente: 404 al entrar', async () => {
    expect((await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Ningú', pin: '1234' })).status).toBe(404)
  })

  it('la sesión es por curso: la de 6è no sirve en 1r, y un dispositivo puede tener las dos', async () => {
    const seis = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Germà gran' })
    const u = await pedir('POST', '/api/alumnes/crea', { curs: '1-primaria', alies: 'Germà petit' })
    expect((await pedir('GET', '/api/alumnes/jo?curs=1-primaria', null, seis.cookie)).body.alumne).toBeNull()
    const ambdues = `${seis.cookie}; ${u.cookie}`
    expect((await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, ambdues)).body.alumne.alies).toBe('Germà gran')
    expect((await pedir('GET', '/api/alumnes/jo?curs=1-primaria', null, ambdues)).body.alumne.alies).toBe('Germà petit')
  })

  it('surt: cierra la sesión de ese curso', async () => {
    const { cookie } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Surto' })
    expect((await pedir('POST', '/api/alumnes/surt', { curs: '6-primaria' }, cookie)).status).toBe(204)
    expect((await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, cookie)).body.alumne).toBeNull()
  })

  it('cursos inactivos o inexistentes: 404 (2n está inactivo)', async () => {
    expect((await pedir('POST', '/api/alumnes/comprova', { curs: '2-primaria', alies: 'Nil' })).status).toBe(404)
    expect((await pedir('POST', '/api/alumnes/crea', { curs: 'no-existeix', alies: 'Nil' })).status).toBe(404)
    expect((await pedir('GET', '/api/alumnes/jo')).status).toBe(404)
  })

  it('àlies no válido: 400 con el mensaje', async () => {
    const r = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'N' })
    expect(r.status).toBe(400)
    expect(r.body.missatge).toMatch(/almenys/)
  })

  describe('consola: àlies del curso (con sesión de profesor)', () => {
    let profe
    beforeAll(async () => {
      const { reiniciarLimitador } = await import('../src/auth/limitador.js')
      reiniciarLimitador()
      profe = (await pedir('POST', '/api/admin/login', { password: process.env.TEACHER_PASSWD })).cookie
    })

    it('sin sesión de profesor no se puede ver ni tocar', async () => {
      const id = await idCurso('6-primaria')
      expect((await pedir('GET', `/api/admin/cursos/${id}/alumnes`)).status).toBe(401)
      expect((await pedir('POST', '/api/admin/alumnes/1/pin')).status).toBe(401)
    })

    it('lista los àlies del curso, sin PIN', async () => {
      const { status, body } = await pedir('GET', `/api/admin/cursos/${await idCurso('6-primaria')}/alumnes`, null, profe)
      expect(status).toBe(200)
      expect(body.map((a) => a.alies)).toContain('Nil')
      expect(Object.keys(body[0]).sort()).toEqual(['alies', 'creatEn', 'id', 'ultimAcces'])
    })

    it('renombrar (sin repetir dentro del curso)', async () => {
      const { body: a } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Lleig' })
      const id = (await pool.query("SELECT id::int FROM alumnes WHERE alies = 'Lleig'")).rows[0].id
      expect((await pedir('PATCH', `/api/admin/alumnes/${id}`, { alies: 'Net' }, profe)).body.alies).toBe('Net')
      const rep = await pedir('PATCH', `/api/admin/alumnes/${id}`, { alies: 'NIL' }, profe)
      expect(rep.status).toBe(400)
      expect(rep.body.camps.alies).toMatch(/Ja hi ha/)
      expect(a.pin).toBeTruthy()
    })

    it('PIN nuevo: el viejo deja de servir y se cierran sus sesiones', async () => {
      const { body: creat, cookie } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Oblidadís' })
      const id = (await pool.query("SELECT id::int FROM alumnes WHERE alies = 'Oblidadís'")).rows[0].id
      const { body } = await pedir('POST', `/api/admin/alumnes/${id}/pin`, null, profe)
      expect(body.pin).toMatch(/^\d{4}$/)
      expect((await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, cookie)).body.alumne).toBeNull()
      if (body.pin !== creat.pin) {
        expect((await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Oblidadís', pin: creat.pin })).status).toBe(401)
      }
      expect((await pedir('POST', '/api/alumnes/entra', { curs: '6-primaria', alies: 'Oblidadís', pin: body.pin })).status).toBe(200)
    })

    it('borrar un àlies (y con él, sus sesiones)', async () => {
      const { cookie } = await pedir('POST', '/api/alumnes/crea', { curs: '6-primaria', alies: 'Esborrable' })
      const id = (await pool.query("SELECT id::int FROM alumnes WHERE alies = 'Esborrable'")).rows[0].id
      expect((await pedir('DELETE', `/api/admin/alumnes/${id}`, null, profe)).status).toBe(204)
      expect((await pedir('GET', '/api/alumnes/jo?curs=6-primaria', null, cookie)).body.alumne).toBeNull()
      expect((await pedir('DELETE', `/api/admin/alumnes/${id}`, null, profe)).status).toBe(404)
    })
  })
})
