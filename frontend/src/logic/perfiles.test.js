import { describe, it, expect } from 'vitest'
import { ASIGNATURAS_MAYOR, MODOS_PEQUE, obtenerModo } from './perfiles.js'

describe('ASIGNATURAS_MAYOR', () => {
  it('Matemáticas incluye aritmética (sin problemas) y problemas por separado', () => {
    expect(ASIGNATURAS_MAYOR.matematicas.modos.aritmetica.operaciones).not.toContain('problema')
    expect(ASIGNATURAS_MAYOR.matematicas.modos.problemas.operaciones).toEqual(['problema'])
  })

  it('Inglés incluye el modo vocabulario', () => {
    expect(ASIGNATURAS_MAYOR.ingles.modos.vocabulario.operaciones).toEqual(['vocabulario'])
  })
})

describe('MODOS_PEQUE', () => {
  it('el modo sumas solo contiene sumas', () => {
    expect(MODOS_PEQUE.sumas.operaciones).toEqual(['suma'])
  })

  it('el modo restas solo contiene restas', () => {
    expect(MODOS_PEQUE.restas.operaciones).toEqual(['resta'])
  })

  it('el modo horas solo contiene el tipo hora', () => {
    expect(MODOS_PEQUE.horas.operaciones).toEqual(['hora'])
  })
})

describe('obtenerModo', () => {
  it('para "mayor" busca dentro de la asignatura indicada', () => {
    expect(obtenerModo('mayor', 'matematicas', 'aritmetica')).toBe(
      ASIGNATURAS_MAYOR.matematicas.modos.aritmetica,
    )
    expect(obtenerModo('mayor', 'ingles', 'vocabulario')).toBe(
      ASIGNATURAS_MAYOR.ingles.modos.vocabulario,
    )
  })

  it('para "mayor" devuelve null si la asignatura o el modo no existen', () => {
    expect(obtenerModo('mayor', 'ciencias', 'x')).toBeNull()
    expect(obtenerModo('mayor', 'matematicas', 'geometria')).toBeNull()
  })

  it('para "pequeno" busca directamente en MODOS_PEQUE, ignorando la asignatura', () => {
    expect(obtenerModo('pequeno', null, 'sumas')).toBe(MODOS_PEQUE.sumas)
  })
})
