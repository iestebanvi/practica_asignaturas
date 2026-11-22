import { describe, it, expect } from 'vitest'
import { generarVocabulario, generarVocabularioEscrito } from './vocabulario.js'
import { respuestaCoincide } from './common.js'

const bancoDePrueba = [
  { id: 1, enunciado: 'BREAKFAST', respuesta: 'esmorzar' },
  { id: 2, enunciado: 'LUNCH', respuesta: 'dinar' },
  { id: 3, enunciado: 'DINNER', respuesta: 'sopar' },
  { id: 4, enunciado: 'STREET', respuesta: 'carrer' },
  { id: 5, enunciado: 'SQUARE', respuesta: 'plaça' },
]

describe('generarVocabulario', () => {
  it('genera un ejercicio de tipo vocabulario con una palabra del banco', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarVocabulario(bancoDePrueba)
      expect(ej.tipo).toBe('vocabulario')
      const palabra = bancoDePrueba.find((p) => p.enunciado === ej.enunciado)
      expect(palabra).toBeDefined()
      expect(ej.respuesta).toBe(palabra.respuesta)
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
      { id: 1, enunciado: 'A', respuesta: 'un/a' },
      { id: 2, enunciado: 'B', respuesta: 'dos' },
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
      const palabra = bancoDePrueba.find((p) => p.enunciado === ej.ingles)
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
      const palabra = bancoDePrueba.find((p) => p.enunciado === ej.ingles)
      if (ej.direccion === 'ingles') {
        expect(ej.enunciado).toBe(palabra.respuesta)
        expect(ej.respuesta).toBe(palabra.enunciado)
      } else {
        expect(ej.enunciado).toBe(palabra.enunciado)
        expect(ej.respuesta).toBe(palabra.respuesta)
      }
    }
  })

  it('si dos palabras inglesas comparten traducción, al escribir el inglés se aceptan las dos', () => {
    const bancoConRepetidas = [
      { id: 1, enunciado: 'ABOUT', respuesta: 'sobre' },
      { id: 2, enunciado: 'UPON', respuesta: 'sobre' },
    ]
    let vistas = 0
    for (let i = 0; i < 100; i++) {
      const ej = generarVocabularioEscrito(bancoConRepetidas)
      if (ej.direccion !== 'ingles') continue
      vistas++
      expect(respuestaCoincide(ej.respuesta, 'about')).toBe(true)
      expect(respuestaCoincide(ej.respuesta, 'UPON')).toBe(true)
      expect(respuestaCoincide(ej.respuesta, 'under')).toBe(false)
    }
    expect(vistas).toBeGreaterThan(0)
  })

  it('excluye del banco las palabras con "/" (abreviaturas de género/plural)', () => {
    const bancoConBarras = [
      { id: 1, enunciado: 'A', respuesta: 'un/a' },
      { id: 2, enunciado: 'BREAKFAST', respuesta: 'esmorzar' },
    ]
    for (let i = 0; i < 30; i++) {
      const ej = generarVocabularioEscrito(bancoConBarras)
      expect(ej.ingles).toBe('BREAKFAST')
    }
  })
})
