import { describe, it, expect } from 'vitest'
import { generarVocabulario, generarVocabularioEscrito } from './vocabulario.js'

const bancoDePrueba = [
  { id: 1, ingles: 'BREAKFAST', catalan: 'esmorzar' },
  { id: 2, ingles: 'LUNCH', catalan: 'dinar' },
  { id: 3, ingles: 'DINNER', catalan: 'sopar' },
  { id: 4, ingles: 'STREET', catalan: 'carrer' },
  { id: 5, ingles: 'SQUARE', catalan: 'plaça' },
]

describe('generarVocabulario', () => {
  it('genera un ejercicio de tipo vocabulario con una palabra del banco', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarVocabulario(bancoDePrueba)
      expect(ej.tipo).toBe('vocabulario')
      const palabra = bancoDePrueba.find((p) => p.ingles === ej.enunciado)
      expect(palabra).toBeDefined()
      expect(ej.respuesta).toBe(palabra.catalan)
      expect(ej.puntos).toBe(10)
    }
  })

  it('genera 4 opciones únicas que incluyen la respuesta correcta', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarVocabulario(bancoDePrueba)
      expect(ej.opciones).toHaveLength(4)
      expect(new Set(ej.opciones).size).toBe(4)
      expect(ej.opciones).toContain(ej.respuesta)
    }
  })

  it('no se cuelga si el banco tiene menos de 4 traducciones únicas', () => {
    const bancoPequeno = [
      { id: 1, ingles: 'A', catalan: 'un/a' },
      { id: 2, ingles: 'B', catalan: 'dos' },
    ]
    const ej = generarVocabulario(bancoPequeno)
    expect(ej.opciones.length).toBeLessThanOrEqual(2)
  })

  it('incluye el campo "ingles" para poder pronunciar la palabra', () => {
    const ej = generarVocabulario(bancoDePrueba)
    expect(ej.ingles).toBe(ej.enunciado)
  })
})

describe('generarVocabularioEscrito', () => {
  it('genera un ejercicio de tipo "vocabulario-escrito" con los datos del banco', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarVocabularioEscrito(bancoDePrueba)
      expect(ej.tipo).toBe('vocabulario-escrito')
      const palabra = bancoDePrueba.find((p) => p.ingles === ej.ingles)
      expect(palabra).toBeDefined()
      expect(ej.puntos).toBe(15)
    }
  })

  it('a veces pide escribir en inglés y a veces en catalán', () => {
    const direcciones = new Set()
    for (let i = 0; i < 100; i++) {
      direcciones.add(generarVocabularioEscrito(bancoDePrueba).direccion)
    }
    expect(direcciones).toEqual(new Set(['ingles', 'catalan']))
  })

  it('cuando la dirección es "ingles", se ve el catalán y hay que escribir el inglés', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarVocabularioEscrito(bancoDePrueba)
      const palabra = bancoDePrueba.find((p) => p.ingles === ej.ingles)
      if (ej.direccion === 'ingles') {
        expect(ej.enunciado).toBe(palabra.catalan)
        expect(ej.respuesta).toBe(palabra.ingles)
      } else {
        expect(ej.enunciado).toBe(palabra.ingles)
        expect(ej.respuesta).toBe(palabra.catalan)
      }
    }
  })

  it('excluye del banco las palabras con "/" (abreviaturas de género/plural)', () => {
    const bancoConBarras = [
      { id: 1, ingles: 'A', catalan: 'un/a' },
      { id: 2, ingles: 'BREAKFAST', catalan: 'esmorzar' },
    ]
    for (let i = 0; i < 30; i++) {
      const ej = generarVocabularioEscrito(bancoConBarras)
      expect(ej.ingles).toBe('BREAKFAST')
    }
  })
})
