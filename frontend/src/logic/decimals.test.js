import { describe, it, expect } from 'vitest'
import { parseNumero, numerosIguals } from './common.js'
import {
  decimalAleatori,
  generarDecimalPosicio,
  generarDecimalComparar,
  generarDecimalExtrem,
  generarDecimalArrodonir,
  generarDecimalSuma,
  generarDecimalResta,
  generarDecimalPotencia10,
  generarDecimalPerNatural,
} from './decimals.js'

const VECES = 400
const repetir = (fn) => Array.from({ length: VECES }, fn)
// Los decimales del enunciado, como números ("12,35 + 4,8" → [12.35, 4.8])
const decimals = (text) => (text.match(/\d+(,\d+)?/g) ?? []).map(parseNumero)

describe('decimales', () => {
  it('decimalAleatori: exactamente los decimales pedidos, la última cifra no es 0', () => {
    for (let d = 1; d <= 3; d++) {
      for (const n of repetir(() => decimalAleatori(d, 2))) {
        const part = n.text.split(',')[1]
        expect(part).toHaveLength(d)
        expect(part.at(-1)).not.toBe('0')
        expect(n.valor).toBeLessThan(100)
      }
    }
  })

  it('valor posicional: la cifra es la de esa posición', () => {
    const noms = { desenes: -1, unitats: 0, dècimes: 1, centèsimes: 2, 'mil·lèsimes': 3 }
    const vistes = new Set()
    for (const ej of repetir(() => generarDecimalPosicio('medio', { decimals: 3, xifresEnteres: 2 }))) {
      const [, numero, nom] = ej.enunciado.match(/^En ([\d,]+), quina xifra hi ha a les (.+)\?$/)
      const [enter, part] = numero.split(',')
      const pos = noms[nom]
      vistes.add(nom)
      const esperada = pos > 0 ? part[pos - 1] : enter.padStart(2, '0')[1 + pos]
      expect(ej.respuesta).toBe(Number(esperada))
    }
    expect(vistes.size).toBeGreaterThanOrEqual(4)
  })

  it('comparar: el signo es correcto, salen los tres y la trampa 3,45 < 3,5', () => {
    const signes = new Set()
    let trampa = false
    for (const ej of repetir(() => generarDecimalComparar('medio', { decimals: 3 }))) {
      const [a, b] = ej.enunciado.split('☐').map((t) => parseNumero(t))
      expect(ej.respuesta).toBe(a < b ? '<' : a > b ? '>' : '=')
      expect(ej.opciones).toEqual(['<', '=', '>'])
      signes.add(ej.respuesta)
      const [ta, tb] = ej.enunciado.split('☐').map((t) => t.trim().split(',')[1] ?? '')
      if (ta.length !== tb.length && (ta.length > tb.length) === (a < b)) trampa = true
    }
    expect(signes).toEqual(new Set(['<', '=', '>']))
    expect(trampa).toBe(true)
  })

  it('el más grande / pequeño: respuesta correcta entre 4 opciones distintas', () => {
    for (const ej of repetir(() => generarDecimalExtrem('medio', {}))) {
      const valors = ej.opciones.map(parseNumero)
      expect(new Set(valors).size).toBe(4)
      const objectiu = ej.enunciado.includes('gran') ? Math.max(...valors) : Math.min(...valors)
      expect(numerosIguals(parseNumero(ej.respuesta), objectiu)).toBe(true)
    }
  })

  it('redondear: a las unidades, décimas o centésimas, la mitad hacia arriba', () => {
    const unitat = { unitats: 1, dècimes: 0.1, centèsimes: 0.01 }
    for (const ej of repetir(() => generarDecimalArrodonir('medio', { decimals: 3 }))) {
      const [, numero, nom] = ej.enunciado.match(/^Arrodoneix ([\d,]+) a les (.+)$/)
      const u = unitat[nom]
      const esperada = Math.round(parseNumero(numero) / u + 1e-9) * u
      expect(numerosIguals(ej.respuesta, esperada)).toBe(true)
    }
  })

  it('sumar y restar: resultado exacto, la resta nunca negativa, distintos decimales', () => {
    let longitudsDiferents = false
    for (const ej of repetir(() => generarDecimalSuma('medio', { decimals: 3, xifresEnteres: 2 }))) {
      const [a, b] = decimals(ej.enunciado)
      expect(numerosIguals(ej.respuesta, a + b)).toBe(true)
      const [da, db] = ej.enunciado.split(' + ').map((t) => (t.split(',')[1] ?? '').length)
      if (da !== db) longitudsDiferents = true
    }
    expect(longitudsDiferents).toBe(true)
    for (const ej of repetir(() => generarDecimalResta('medio', { decimals: 2 }))) {
      const [a, b] = decimals(ej.enunciado)
      expect(numerosIguals(ej.respuesta, a - b)).toBe(true)
      expect(ej.respuesta).toBeGreaterThanOrEqual(0)
    }
  })

  it('×/÷ por 10, 100, 1000 (sin punto de miles: 1000)', () => {
    for (const ej of repetir(() => generarDecimalPotencia10('medio', {}))) {
      const [, numero, op, factor] = ej.enunciado.match(/^([\d,]+) ([×÷]) (\d+)$/)
      const f = Number(factor)
      expect([10, 100, 1000]).toContain(f)
      const n = parseNumero(numero)
      expect(numerosIguals(ej.respuesta, op === '×' ? n * f : n / f)).toBe(true)
    }
  })

  it('decimal × natural de una cifra', () => {
    for (const ej of repetir(() => generarDecimalPerNatural('medio', { decimals: 2 }))) {
      const [n, m] = decimals(ej.enunciado)
      expect(m).toBeGreaterThanOrEqual(2)
      expect(m).toBeLessThanOrEqual(9)
      expect(numerosIguals(ej.respuesta, n * m)).toBe(true)
    }
  })
})
