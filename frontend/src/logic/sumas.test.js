import { describe, it, expect } from 'vitest'
import { generarSuma } from './sumas.js'

describe('generarSuma', () => {
  it('la respuesta es siempre la suma de los dos números del enunciado', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSuma('medio')
      const [a, b] = ej.enunciado.split(' + ').map(Number)
      expect(ej.respuesta).toBe(a + b)
      expect(ej.tipo).toBe('suma')
    }
  })

  it('en nivel medio/difícil respeta el rango máximo del nivel', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSuma('medio')
      const [a, b] = ej.enunciado.split(' + ').map(Number)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThanOrEqual(20)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(20)
    }
  })

  it('en nivel fácil (Peque) el resultado nunca supera 12', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSuma('facil')
      expect(ej.respuesta).toBeGreaterThanOrEqual(1)
      expect(ej.respuesta).toBeLessThanOrEqual(12)
    }
  })

  it('en nivel fácil (Peque) el número más grande va siempre en primera posición', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarSuma('facil')
      const [primero, segundo] = ej.enunciado.split(' + ').map(Number)
      expect(primero).toBeGreaterThanOrEqual(segundo)
      expect(primero + segundo).toBe(ej.respuesta)
    }
  })
})
