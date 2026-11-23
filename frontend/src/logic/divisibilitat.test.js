import { describe, it, expect } from 'vitest'
import {
  esPrimer,
  divisors,
  generarDivMultiple,
  generarDivSeguentMultiple,
  generarDivDivisor,
  generarDivCriteris,
  generarDivPrimer,
  generarDivTrobaPrimer,
} from './divisibilitat.js'

const VECES = 500
const repetir = (fn) => Array.from({ length: VECES }, fn)
const nums = (t) => (t.match(/\d+/g) ?? []).map(Number)

describe('divisibilidad', () => {
  it('esPrimer y divisors', () => {
    expect([2, 3, 5, 7, 11, 29, 97].every(esPrimer)).toBe(true)
    expect([0, 1, 4, 9, 51, 91, 100].some(esPrimer)).toBe(false)
    expect(divisors(12)).toEqual([1, 2, 3, 4, 6, 12])
  })

  it('¿es múltiplo?: correcto, salen sí y no, dentro del máximo', () => {
    const respostes = new Set()
    for (const max of [20, 100, 500]) {
      for (const ej of repetir(() => generarDivMultiple('medio', { max }))) {
        const [n, d] = nums(ej.enunciado)
        expect(ej.respuesta).toBe(n % d === 0 ? 'Sí' : 'No')
        expect(n).toBeGreaterThan(d)
        expect(n).toBeLessThanOrEqual(max)
        respostes.add(ej.respuesta)
      }
    }
    expect(respostes.size).toBe(2)
  })

  it('siguiente múltiplo', () => {
    for (const ej of repetir(() => generarDivSeguentMultiple('medio', {}))) {
      const [d, m] = nums(ej.enunciado)
      expect(m % d).toBe(0)
      expect(ej.respuesta).toBe(m + d)
    }
  })

  it('divisores: 4 opciones distintas y una sola cumple lo que se pide', () => {
    for (const max of [20, 100]) {
      for (const ej of repetir(() => generarDivDivisor('medio', { max }))) {
        const [n] = nums(ej.enunciado)
        const ops = ej.opciones.map(Number)
        expect(new Set(ops).size).toBe(4)
        expect(ops.every((d) => d > 1 && d < n)).toBe(true)
        const cumple = ej.enunciado.includes('NO') ? ops.filter((d) => n % d !== 0) : ops.filter((d) => n % d === 0)
        expect(cumple).toEqual([Number(ej.respuesta)])
      }
    }
  })

  it('criterios: números de 3 cifras, divisores 2, 3, 5, 9 o 10, respuesta correcta', () => {
    const divisorsVistos = new Set()
    for (const ej of repetir(() => generarDivCriteris())) {
      const [n, d] = nums(ej.enunciado)
      divisorsVistos.add(d)
      expect(n).toBeGreaterThanOrEqual(100)
      expect(n).toBeLessThanOrEqual(999)
      expect(ej.respuesta).toBe(n % d === 0 ? 'Sí' : 'No')
    }
    expect(divisorsVistos).toEqual(new Set([2, 3, 5, 9, 10]))
  })

  it('¿es primo?: correcto; los compuestos son impares y no acaban en 5', () => {
    for (const ej of repetir(() => generarDivPrimer('medio', {}))) {
      const [n] = nums(ej.enunciado)
      expect(ej.respuesta).toBe(esPrimer(n) ? 'Sí' : 'No')
      if (!esPrimer(n)) expect(n % 2 && n % 5).toBeTruthy()
    }
  })

  it('encontrar el primo: exactamente uno de los cuatro', () => {
    for (const ej of repetir(() => generarDivTrobaPrimer('medio', {}))) {
      const primers = ej.opciones.map(Number).filter(esPrimer)
      expect(ej.opciones).toHaveLength(4)
      expect(primers).toEqual([Number(ej.respuesta)])
    }
  })
})
