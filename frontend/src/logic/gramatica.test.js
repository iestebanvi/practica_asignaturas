import { describe, it, expect } from 'vitest'
import { generarGramatica } from './gramatica.js'

const bancoDePrueba = [
  {
    id: 1,
    enunciado: 'Yesterday I ___ to the park.',
    opciones: ['go', 'went', 'gone', 'going'],
    respuesta: 'went',
  },
  {
    id: 2,
    enunciado: 'She ___ football every Sunday.',
    opciones: ['play', 'plays', 'played', 'playing'],
    respuesta: 'plays',
  },
]

describe('generarGramatica', () => {
  it('genera un ejercicio de tipo gramatica con los datos del banco', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarGramatica(bancoDePrueba)
      expect(ej.tipo).toBe('gramatica')
      const item = bancoDePrueba.find((p) => p.enunciado === ej.enunciado)
      expect(item).toBeDefined()
      expect(ej.respuesta).toBe(item.respuesta)
      expect(ej.puntos).toBe(10)
    }
  })

  it('las opciones son las del banco (mezcladas), incluida la respuesta correcta', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarGramatica(bancoDePrueba)
      const item = bancoDePrueba.find((p) => p.enunciado === ej.enunciado)
      expect(ej.opciones.slice().sort()).toEqual(item.opciones.slice().sort())
      expect(ej.opciones).toContain(ej.respuesta)
    }
  })
})
