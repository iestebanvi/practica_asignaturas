import { describe, it, expect } from 'vitest'
import { generarEstimacion } from './estimaciones.js'

function redondearDecena(n) {
  return Math.round(n / 10) * 10
}

function extraerDatos(enunciado) {
  const [a, operador, b] = enunciado.replace('Redondea a la decena y estima: ', '').split(' ')
  return { a: Number(a), operador, b: Number(b) }
}

describe('generarEstimacion', () => {
  it('tiene tipo "estimacion" y 15 puntos', () => {
    const ej = generarEstimacion()
    expect(ej.tipo).toBe('estimacion')
    expect(ej.puntos).toBe(15)
  })

  it('la respuesta es la suma/resta de los dos números redondeados a la decena', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarEstimacion()
      const { a, operador, b } = extraerDatos(ej.enunciado)
      const esperada =
        operador === '+' ? redondearDecena(a) + redondearDecena(b) : redondearDecena(a) - redondearDecena(b)
      expect(ej.respuesta).toBe(esperada)
    }
  })

  it('los dos números del enunciado tienen 2 cifras (10-99)', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarEstimacion()
      const { a, b } = extraerDatos(ej.enunciado)
      expect(a).toBeGreaterThanOrEqual(10)
      expect(a).toBeLessThanOrEqual(99)
      expect(b).toBeGreaterThanOrEqual(10)
      expect(b).toBeLessThanOrEqual(99)
    }
  })

  it('en la resta, la estimación nunca es negativa', () => {
    for (let i = 0; i < 200; i++) {
      const ej = generarEstimacion()
      if (ej.enunciado.includes(' - ')) {
        expect(ej.respuesta).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
