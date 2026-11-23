import { describe, it, expect } from 'vitest'
import { parseNumero, numerosIguals } from './common.js'
import { parseFraccio } from './fraccions.js'
import {
  generarPercentatgeQuantitat,
  generarPercentatgeQuin,
  generarPercentatgeDescompte,
  generarPercentatgeEquivalencia,
  generarProporcioTaula,
  generarProporcioUnitat,
} from './percentatges.js'

const VECES = 500
const repetir = (fn) => Array.from({ length: VECES }, fn)
const nums = (text) => (text.match(/\d+(,\d+)?/g) ?? []).map(parseNumero)

describe('porcentajes', () => {
  it('porcentaje de una cantidad: exacto, con los porcentajes por defecto', () => {
    const vistos = new Set()
    for (const ej of repetir(() => generarPercentatgeQuantitat('medio', {}))) {
      const [p, q] = nums(ej.enunciado)
      vistos.add(p)
      expect(ej.respuesta).toBe((p * q) / 100)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
      expect(q).toBeGreaterThanOrEqual(10)
      expect(q).toBeLessThanOrEqual(200)
    }
    expect(vistos).toEqual(new Set([10, 20, 25, 50, 75]))
  })

  it('respeta los porcentajes y el máximo del modo', () => {
    for (const ej of repetir(() => generarPercentatgeQuantitat('medio', { percentatges: [5, 15], max: 100 }))) {
      const [p, q] = nums(ej.enunciado)
      expect([5, 15]).toContain(p)
      expect(q).toBeLessThanOrEqual(100)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
    }
  })

  it('qué porcentaje es: la parte es ese porcentaje de la cantidad', () => {
    for (const ej of repetir(() => generarPercentatgeQuin('medio', {}))) {
      const [q, part] = nums(ej.enunciado)
      expect((q * ej.respuesta) / 100).toBe(part)
      expect(part).toBeGreaterThan(0)
    }
  })

  it('descuentos: lo que se paga o lo que se ahorra, y salen las dos preguntas', () => {
    const preguntes = new Set()
    for (const ej of repetir(() => generarPercentatgeDescompte('medio', {}))) {
      const [preu, p] = nums(ej.enunciado)
      const estalvi = (preu * p) / 100
      const pagues = ej.enunciado.endsWith('quant pagues?')
      preguntes.add(pagues)
      expect(ej.respuesta).toBe(pagues ? preu - estalvi : estalvi)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
    }
    expect(preguntes.size).toBe(2)
  })

  it('equivalencias fracción / decimal / porcentaje: las cuatro variantes, correctas', () => {
    const variants = new Set()
    for (const ej of repetir(() => generarPercentatgeEquivalencia())) {
      const t = ej.enunciado
      let m
      if ((m = t.match(/^(\d+)\/(\d+) = \? %$/))) {
        variants.add('fraccio→%')
        expect(ej.respuesta).toBe((Number(m[1]) * 100) / Number(m[2]))
        expect(Number.isInteger(ej.respuesta)).toBe(true)
      } else if ((m = t.match(/^([\d,]+) = \? %$/))) {
        variants.add('decimal→%')
        expect(numerosIguals(ej.respuesta, parseNumero(m[1]) * 100)).toBe(true)
      } else if ((m = t.match(/^Escriu (\d+) % en nombre decimal$/))) {
        variants.add('%→decimal')
        expect(numerosIguals(ej.respuesta, Number(m[1]) / 100)).toBe(true)
      } else if ((m = t.match(/^Escriu (\d+) % com a fracció$/))) {
        variants.add('%→fraccio')
        const f = parseFraccio(ej.respuesta)
        expect(ej.formatResposta).toBe('fraccio')
        expect(numerosIguals(f.n / f.d, Number(m[1]) / 100)).toBe(true)
      } else {
        throw new Error(`enunciado inesperado: ${t}`)
      }
    }
    expect(variants.size).toBe(4)
  })
})

describe('proporcionalidad', () => {
  it('tabla: una sola casilla vacía, la razón es constante y la respuesta la cumple', () => {
    for (const ej of repetir(() => generarProporcioTaula())) {
      const [f1, f2] = ej.taula.files
      expect(f1).toHaveLength(4)
      expect([...f1, ...f2].filter((v) => v === null)).toHaveLength(1)
      const completa = [f1, f2].map((f) => f.map((v) => v ?? ej.respuesta))
      const rao = completa[1][0] / completa[0][0]
      for (let j = 0; j < 4; j++) expect(numerosIguals(completa[1][j] / completa[0][j], rao)).toBe(true)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
      expect(ej.taula.magnituds).toHaveLength(2)
    }
  })

  it('reducción a la unidad: b × (total ÷ a)', () => {
    for (const ej of repetir(() => generarProporcioUnitat())) {
      const n = nums(ej.enunciado)
      // El orden de los números depende del contexto; probamos las dos lecturas
      const [x, y, z] = n
      const possibles = [(z * y) / x, (z * x) / y]
      expect(possibles).toContain(ej.respuesta)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
    }
  })
})
