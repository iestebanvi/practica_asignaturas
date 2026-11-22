import { describe, it, expect, beforeEach, vi } from 'vitest'
import { obtenerCursos, obtenerCurso, obtenerPreguntas, ErrorNoTrobat, vaciarCache } from './api.js'

function respuesta(status, body) {
  return Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) })
}

describe('api', () => {
  beforeEach(() => {
    vaciarCache()
    globalThis.fetch = vi.fn()
  })

  it('pide el árbol del curso y lo guarda: la segunda vez no vuelve a pedirlo', async () => {
    fetch.mockReturnValue(respuesta(200, { id: '6-primaria', asignaturas: [] }))
    expect(await obtenerCurso('6-primaria')).toEqual({ id: '6-primaria', asignaturas: [] })
    await obtenerCurso('6-primaria')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/cursos/6-primaria')
  })

  it('cursos distintos son peticiones distintas', async () => {
    fetch.mockImplementation(() => respuesta(200, {}))
    await obtenerCurso('1-primaria')
    await obtenerCurso('6-primaria')
    await obtenerCursos()
    expect(fetch.mock.calls.map((c) => c[0])).toEqual(['/api/cursos/1-primaria', '/api/cursos/6-primaria', '/api/cursos'])
  })

  it('un 404 lanza ErrorNoTrobat', async () => {
    fetch.mockReturnValue(respuesta(404, { error: 'curso_no_encontrado' }))
    await expect(obtenerCurso('9-primaria')).rejects.toBeInstanceOf(ErrorNoTrobat)
  })

  it('un error no se guarda: al reintentar se vuelve a pedir', async () => {
    fetch.mockReturnValueOnce(respuesta(500, { error: 'error_interno' }))
    const error = await obtenerCursos().catch((e) => e)
    expect(error.message).toMatch(/500/)
    expect(error).not.toBeInstanceOf(ErrorNoTrobat)

    fetch.mockReturnValueOnce(respuesta(200, [{ id: '6-primaria' }]))
    expect(await obtenerCursos()).toEqual([{ id: '6-primaria' }])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('un fallo de red tampoco se guarda', async () => {
    fetch.mockReturnValueOnce(Promise.reject(new TypeError('Failed to fetch')))
    await expect(obtenerCursos()).rejects.toThrow('Failed to fetch')
    fetch.mockReturnValueOnce(respuesta(200, []))
    expect(await obtenerCursos()).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('obtenerPreguntas devuelve solo la lista de preguntas del banco', async () => {
    fetch.mockReturnValue(respuesta(200, { slug: 'voc', formato: 'traduccio', preguntas: [{ enunciado: 'A', respuesta: 'un/a' }] }))
    expect(await obtenerPreguntas('voc')).toEqual([{ enunciado: 'A', respuesta: 'un/a' }])
    expect(fetch).toHaveBeenCalledWith('/api/bancos/voc/preguntas')
  })
})
