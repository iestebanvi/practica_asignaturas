import { describe, it, expect, beforeEach, vi } from 'vitest'
import { comprobarAlies, crearAlies, entrar, salir, ErrorAlumne, olvidarTodo } from './alumne.js'

const respuesta = (status, body) =>
  Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })

describe('alumne', () => {
  beforeEach(() => {
    olvidarTodo()
    globalThis.fetch = vi.fn()
  })

  it('comprobarAlies envía el curso y el àlies', async () => {
    fetch.mockReturnValue(respuesta(200, { alies: 'Nil', existeix: true }))
    expect(await comprobarAlies('6-primaria', 'nil')).toEqual({ alies: 'Nil', existeix: true })
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe('/api/alumnes/comprova')
    expect(JSON.parse(opciones.body)).toEqual({ curs: '6-primaria', alies: 'nil' })
  })

  it('crearAlies devuelve el PIN', async () => {
    fetch.mockReturnValue(respuesta(201, { alies: 'Nil', pin: '0420' }))
    expect(await crearAlies('6-primaria', 'Nil')).toEqual({ alies: 'Nil', pin: '0420' })
  })

  it('los errores llegan con su código (PIN incorrecto, bloqueo…)', async () => {
    fetch.mockReturnValue(respuesta(429, { error: 'massa_intents', reintentarEnSegons: 900 }))
    const err = await entrar('6-primaria', 'Nil', '0000').catch((e) => e)
    expect(err).toBeInstanceOf(ErrorAlumne)
    expect(err.codigo).toBe('massa_intents')
    expect(err.datos.reintentarEnSegons).toBe(900)
  })

  it('sin conexión: código "xarxa"; salir acepta 204', async () => {
    fetch.mockReturnValueOnce(Promise.reject(new TypeError('Failed to fetch')))
    expect((await comprobarAlies('6-primaria', 'Nil').catch((e) => e)).codigo).toBe('xarxa')
    fetch.mockReturnValueOnce(Promise.resolve({ status: 204, ok: true }))
    await expect(salir('6-primaria')).resolves.toBeUndefined()
  })
})
