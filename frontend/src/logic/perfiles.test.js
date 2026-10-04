import { describe, it, expect } from 'vitest'
import { ASIGNATURAS_MAYOR, MODOS_PEQUE, obtenerModo } from './perfiles.js'

describe('ASIGNATURAS_MAYOR', () => {
  it('Matemáticas incluye aritmética (sin problemas) y problemas por separado', () => {
    expect(ASIGNATURAS_MAYOR.matematicas.modos.aritmetica.operaciones).not.toContain('problema')
    expect(ASIGNATURAS_MAYOR.matematicas.modos.problemas.operaciones).toEqual(['problema'])
  })

  it('Matemáticas incluye los bloques de sumas/restas y multiplicaciones/divisiones por separado', () => {
    expect(ASIGNATURAS_MAYOR.matematicas.modos.sumasRestas.operaciones).toEqual(['suma', 'resta'])
    expect(ASIGNATURAS_MAYOR.matematicas.modos.multiplicacionesDivisiones.operaciones).toEqual([
      'multiplicacion',
      'division',
    ])
  })

  it('Inglés incluye vocabulario (selección y escrito) y gramática', () => {
    expect(ASIGNATURAS_MAYOR.ingles.modos.vocabulario.operaciones).toEqual(['vocabulario'])
    expect(ASIGNATURAS_MAYOR.ingles.modos.vocabularioEscrito.operaciones).toEqual([
      'vocabulario-escrito',
    ])
    expect(ASIGNATURAS_MAYOR.ingles.modos.gramatica.operaciones).toEqual(['gramatica'])
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

  // Regresión: la clave del objeto (p.ej. "sumasRestas") no tiene por qué
  // coincidir con su campo "id" (p.ej. "sumas-restas"); si obtenerModo
  // buscara por clave en vez de por id, esto fallaría en silencio y dejaría
  // la pantalla en blanco al jugar.
  it('encuentra TODOS los modos declarados de Mayor, usando su propio id', () => {
    for (const asignatura of Object.values(ASIGNATURAS_MAYOR)) {
      for (const modo of Object.values(asignatura.modos)) {
        expect(obtenerModo('mayor', asignatura.id, modo.id)).toBe(modo)
      }
    }
  })

  it('encuentra TODOS los modos declarados de Peque, usando su propio id', () => {
    for (const modo of Object.values(MODOS_PEQUE)) {
      expect(obtenerModo('pequeno', null, modo.id)).toBe(modo)
    }
  })
})
