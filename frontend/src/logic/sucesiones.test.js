import { describe, it, expect } from 'vitest'
import { generarSucesion } from './sucesiones.js'

function extraerTerminos(enunciado) {
  return enunciado
    .replace(', __', '')
    .split(', ')
    .map(Number)
}

describe('generarSucesion', () => {
  it('tiene tipo "sucesion" y 15 puntos', () => {
    const ej = generarSucesion()
    expect(ej.tipo).toBe('sucesion')
    expect(ej.puntos).toBe(15)
  })

  it('el enunciado muestra 4 términos seguidos de un hueco', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSucesion()
      expect(ej.enunciado.endsWith(', __')).toBe(true)
      expect(extraerTerminos(ej.enunciado)).toHaveLength(4)
    }
  })

  it('la diferencia entre términos consecutivos es constante y la respuesta continúa esa diferencia', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSucesion()
      const terminos = extraerTerminos(ej.enunciado)
      const diferencia = terminos[1] - terminos[0]

      expect(Math.abs(diferencia)).toBeGreaterThanOrEqual(2)
      expect(Math.abs(diferencia)).toBeLessThanOrEqual(15)

      for (let j = 1; j < terminos.length; j++) {
        expect(terminos[j] - terminos[j - 1]).toBe(diferencia)
      }
      expect(ej.respuesta - terminos[terminos.length - 1]).toBe(diferencia)
    }
  })

  it('ningún término ni la respuesta son negativos', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSucesion()
      const terminos = extraerTerminos(ej.enunciado)
      for (const termino of terminos) {
        expect(termino).toBeGreaterThanOrEqual(0)
      }
      expect(ej.respuesta).toBeGreaterThanOrEqual(0)
    }
  })
})
