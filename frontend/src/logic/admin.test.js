import { describe, it, expect, beforeEach, vi } from 'vitest'
import { iniciarSesion, cerrarSesion, comprobarSesion, ErrorAdmin } from './admin.js'

const respuesta = (status, body) =>
  Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })

describe('admin', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('iniciarSesion envía la contraseña por POST en JSON', async () => {
    fetch.mockReturnValue(respuesta(200, { caducaEn: '2026-11-29T00:00:00Z' }))
    expect(await iniciarSesion('secreta')).toEqual({ caducaEn: '2026-11-29T00:00:00Z' })
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe('/api/admin/login')
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(opciones.body)).toEqual({ password: 'secreta' })
  })

  it('los errores del servidor llegan con su código y datos', async () => {
    fetch.mockReturnValue(respuesta(429, { error: 'massa_intents', reintentarEnSegons: 900 }))
    const err = await iniciarSesion('x').catch((e) => e)
    expect(err).toBeInstanceOf(ErrorAdmin)
    expect(err.codigo).toBe('massa_intents')
    expect(err.datos.reintentarEnSegons).toBe(900)
  })

  it('sin conexión, el código es "xarxa"', async () => {
    fetch.mockReturnValue(Promise.reject(new TypeError('Failed to fetch')))
    expect((await iniciarSesion('x').catch((e) => e)).codigo).toBe('xarxa')
  })

  it('comprobarSesion devuelve null si no hay sesión, y la sesión si la hay', async () => {
    fetch.mockReturnValueOnce(respuesta(401, { error: 'sessio_requerida' }))
    expect(await comprobarSesion()).toBeNull()
    fetch.mockReturnValueOnce(respuesta(200, { caducaEn: 'x' }))
    expect(await comprobarSesion()).toEqual({ caducaEn: 'x' })
  })

  it('comprobarSesion no esconde otros errores (p.ej. consola desactivada)', async () => {
    fetch.mockReturnValue(respuesta(503, { error: 'consola_desactivada' }))
    expect((await comprobarSesion().catch((e) => e)).codigo).toBe('consola_desactivada')
  })

  it('cerrarSesion acepta la respuesta vacía (204)', async () => {
    fetch.mockReturnValue(Promise.resolve({ status: 204, ok: true }))
    expect(await cerrarSesion()).toBeNull()
  })
})
