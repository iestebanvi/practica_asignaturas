import { describe, it, expect, beforeEach } from 'vitest'
import { registrarFallo, obtenerFallos, vaciarFallos } from './fallos.js'

beforeEach(() => {
  localStorage.clear()
})

describe('registrarFallo / obtenerFallos', () => {
  it('registra un fallo de vocabulario con enunciado y respuesta', () => {
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar' })

    const fallos = obtenerFallos('mayor')
    expect(fallos).toEqual([
      { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar', veces: 1, ultima: expect.any(String) },
    ])
  })

  it('para el tipo "hora" usa "Las <hora>" como enunciado (no tiene uno propio)', () => {
    registrarFallo('pequeno', { tipo: 'hora', respuesta: '9:15' })

    const fallos = obtenerFallos('pequeno')
    expect(fallos[0].enunciado).toBe('Las 9:15')
    expect(fallos[0].respuesta).toBe('9:15')
  })

  it('acumula veces si se falla la misma palabra varias veces', () => {
    const ejercicio = { tipo: 'vocabulario', enunciado: 'STREET', respuesta: 'carrer' }
    registrarFallo('mayor', ejercicio)
    registrarFallo('mayor', ejercicio)
    registrarFallo('mayor', ejercicio)

    const fallos = obtenerFallos('mayor')
    expect(fallos).toHaveLength(1)
    expect(fallos[0].veces).toBe(3)
  })

  it('ordena de más a menos fallada', () => {
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'A', respuesta: 'un/a' })
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'B', respuesta: 'b' })
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'B', respuesta: 'b' })

    const fallos = obtenerFallos('mayor')
    expect(fallos.map((f) => f.enunciado)).toEqual(['B', 'A'])
  })

  it('mantiene separados los fallos de distintos perfiles', () => {
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar' })
    registrarFallo('pequeno', { tipo: 'hora', respuesta: '3:00' })

    expect(obtenerFallos('mayor')).toHaveLength(1)
    expect(obtenerFallos('pequeno')).toHaveLength(1)
  })

  it('mantiene separados los fallos de distintos tipos dentro del mismo perfil', () => {
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar' })
    registrarFallo('mayor', { tipo: 'gramatica', enunciado: 'I ___ to school', respuesta: 'go' })

    const fallos = obtenerFallos('mayor')
    expect(fallos).toHaveLength(2)
    expect(fallos.map((f) => f.tipo).sort()).toEqual(['gramatica', 'vocabulario'])
  })

  it('devuelve una lista vacía si no hay fallos registrados', () => {
    expect(obtenerFallos('mayor')).toEqual([])
  })
})

describe('vaciarFallos', () => {
  it('borra solo los fallos del perfil indicado', () => {
    registrarFallo('mayor', { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar' })
    registrarFallo('pequeno', { tipo: 'hora', respuesta: '3:00' })

    vaciarFallos('mayor')

    expect(obtenerFallos('mayor')).toEqual([])
    expect(obtenerFallos('pequeno')).toHaveLength(1)
  })
})
