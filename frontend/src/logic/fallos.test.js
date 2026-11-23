import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registrarFallo,
  obtenerFallos,
  vaciarFallos,
  fallosLocales,
  olvidarFallosLocales,
  migrarFallosLocales,
} from './fallos.js'

const CLAVE = 'practica-asignaturas:fallos'
const respuesta = (status, body) =>
  Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })

// Formato antiguo del navegador: { curso o perfil: { tipo: { clave: { enunciado, respuesta, veces } } } }
function guardarLocal(datos) {
  localStorage.setItem(CLAVE, JSON.stringify(datos))
}

describe('fallos (API)', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('registrarFallo envía tipo, enunciado y respuesta; las horas se apuntan como "Les <hora>"', async () => {
    fetch.mockReturnValue(respuesta(204))
    await registrarFallo('1-primaria', { tipo: 'hora', enunciado: '', respuesta: '9:15' })
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe('/api/alumnes/fallos')
    expect(JSON.parse(opciones.body)).toEqual({ curs: '1-primaria', tipo: 'hora', enunciado: 'Les 9:15', respuesta: '9:15' })
  })

  it('obtenerFallos espera a que terminen de enviarse los fallos pendientes', async () => {
    let terminar
    fetch.mockReturnValueOnce(new Promise((ok) => (terminar = ok)))
    fetch.mockReturnValueOnce(respuesta(200, { fallos: [] }))
    registrarFallo('6-primaria', { tipo: 'vocabulario', enunciado: 'A', respuesta: 'b' })
    const lista = obtenerFallos('6-primaria')
    await new Promise((r) => setTimeout(r, 10))
    expect(fetch).toHaveBeenCalledTimes(1) // la lista aún no se ha pedido
    terminar({ status: 204, ok: true })
    await lista
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('obtenerFallos y vaciarFallos', async () => {
    fetch.mockReturnValueOnce(respuesta(200, { fallos: [{ tipo: 'vocabulario', enunciado: 'A', respuesta: 'b', veces: 2 }] }))
    expect(await obtenerFallos('6-primaria')).toHaveLength(1)
    fetch.mockReturnValueOnce(respuesta(204))
    await vaciarFallos('6-primaria')
    expect(fetch.mock.calls[1]).toEqual(['/api/alumnes/fallos?curs=6-primaria', { method: 'DELETE' }])
  })
})

describe('fallos guardados en el navegador (migración)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn()
  })

  it('lee los del curso y también los del perfil antiguo equivalente (mayor → 6è)', () => {
    guardarLocal({
      '6-primaria': { vocabulario: { HOUSE: { enunciado: 'HOUSE', respuesta: 'casa', veces: 2 } } },
      mayor: { gramatica: { X: { enunciado: 'X', respuesta: 'is', veces: 1 } } },
      pequeno: { hora: { 'Les 9:15': { enunciado: 'Les 9:15', respuesta: '9:15', veces: 3 } } },
    })
    expect(fallosLocales('6-primaria')).toEqual([
      { tipo: 'vocabulario', enunciado: 'HOUSE', respuesta: 'casa', veces: 2 },
      { tipo: 'gramatica', enunciado: 'X', respuesta: 'is', veces: 1 },
    ])
    expect(fallosLocales('1-primaria')).toEqual([{ tipo: 'hora', enunciado: 'Les 9:15', respuesta: '9:15', veces: 3 }])
  })

  it('olvidar borra solo los del curso; si no queda nada, borra la clave', () => {
    guardarLocal({ mayor: { a: {} }, pequeno: { b: {} } })
    olvidarFallosLocales('6-primaria')
    expect(JSON.parse(localStorage.getItem(CLAVE))).toEqual({ pequeno: { b: {} } })
    olvidarFallosLocales('1-primaria')
    expect(localStorage.getItem(CLAVE)).toBeNull()
  })

  it('migrar: los borra del navegador antes de que responda el servidor (no se envían dos veces)', async () => {
    guardarLocal({ '6-primaria': { vocabulario: { HOUSE: { enunciado: 'HOUSE', respuesta: 'casa', veces: 2 } } } })
    let terminar
    fetch.mockReturnValue(new Promise((ok) => (terminar = ok)))
    const envio = migrarFallosLocales('6-primaria')
    expect(localStorage.getItem(CLAVE)).toBeNull()
    expect(await migrarFallosLocales('6-primaria')).toBe(0) // nada que enviar ya
    terminar({ status: 200, ok: true, json: () => Promise.resolve({ importats: 1 }) })
    expect(await envio).toBe(1)
  })

  it('migrar: los envía al àlies y, si el servidor los acepta, los borra del navegador', async () => {
    guardarLocal({ '6-primaria': { vocabulario: { HOUSE: { enunciado: 'HOUSE', respuesta: 'casa', veces: 2 } } } })
    fetch.mockReturnValue(respuesta(200, { importats: 1 }))
    expect(await migrarFallosLocales('6-primaria')).toBe(1)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      curs: '6-primaria',
      fallos: [{ tipo: 'vocabulario', enunciado: 'HOUSE', respuesta: 'casa', veces: 2 }],
    })
    expect(localStorage.getItem(CLAVE)).toBeNull()
  })

  it('si el servidor falla, vuelven al navegador (sin tocar los de otro curso); si no hay nada, no se llama', async () => {
    guardarLocal({
      '6-primaria': { vocabulario: { A: { enunciado: 'A', respuesta: 'b', veces: 1 } } },
      pequeno: { hora: { H: { enunciado: 'Les 1:00', respuesta: '1:00', veces: 1 } } },
    })
    fetch.mockReturnValue(respuesta(500, {}))
    await expect(migrarFallosLocales('6-primaria')).rejects.toThrow()
    expect(fallosLocales('6-primaria')).toHaveLength(1)
    expect(fallosLocales('1-primaria')).toHaveLength(1)
    olvidarFallosLocales('1-primaria')

    fetch.mockClear()
    expect(await migrarFallosLocales('1-primaria')).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
  })
})
