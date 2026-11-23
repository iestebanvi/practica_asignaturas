import { describe, it, expect } from 'vitest'
import { numerosIguals } from './common.js'
import {
  mcd,
  parseFraccio,
  fraccionsEquivalents,
  respostaFraccioCorrecta,
  valorDe,
  generarFraccioDibuix,
  generarFraccioEquivalent,
  generarFraccioSimplificar,
  generarFraccioComparar,
  generarFraccioQuantitat,
  generarFraccioSuma,
  generarFraccioResta,
  generarFraccioDecimal,
} from './fraccions.js'

const VECES = 400
const repetir = (fn) => Array.from({ length: VECES }, fn)
const fraccionsDe = (text) => (text.match(/\d+\/\d+/g) ?? []).map(valorDe)

describe('fracciones: lectura y comprobación', () => {
  it('parseFraccio: "3/4", con espacios, enteros; lo demás es null', () => {
    expect(parseFraccio('3/4')).toEqual({ n: 3, d: 4 })
    expect(parseFraccio(' 3 / 4 ')).toEqual({ n: 3, d: 4 })
    expect(parseFraccio('2')).toEqual({ n: 2, d: 1 })
    expect(parseFraccio('2/')).toEqual({ n: 2, d: 1 })
    for (const t of ['', '/', '/4', '3/0', 'tres', '3,5', '1/2/3']) expect(parseFraccio(t)).toBeNull()
  })

  it('equivalentes y mcd', () => {
    expect(mcd(12, 18)).toBe(6)
    expect(fraccionsEquivalents({ n: 3, d: 4 }, { n: 6, d: 8 })).toBe(true)
    expect(fraccionsEquivalents({ n: 3, d: 4 }, { n: 2, d: 3 })).toBe(false)
    expect(fraccionsEquivalents(null, { n: 1, d: 1 })).toBe(false)
  })

  it('sumas: vale cualquier equivalente; simplificar: solo la irreducible', () => {
    const suma = { tipo: 'fraccio-suma', respuesta: '3/4' }
    expect(respostaFraccioCorrecta(suma, '3/4')).toBe(true)
    expect(respostaFraccioCorrecta(suma, '6/8')).toBe(true)
    expect(respostaFraccioCorrecta(suma, '3/5')).toBe(false)
    expect(respostaFraccioCorrecta({ tipo: 'fraccio-suma', respuesta: '1/1' }, '1')).toBe(true)
    expect(respostaFraccioCorrecta({ tipo: 'fraccio-suma', respuesta: '1/1' }, '4/4')).toBe(true)
    const simp = { tipo: 'fraccio-simplificar', respuesta: '2/3' }
    expect(respostaFraccioCorrecta(simp, '2/3')).toBe(true)
    expect(respostaFraccioCorrecta(simp, '4/6')).toBe(false)
  })
})

describe('fracciones: generadores', () => {
  it('dibujo: las partes pintadas son la respuesta, y salen pastel y barra', () => {
    const formes = new Set()
    for (const ej of repetir(() => generarFraccioDibuix('medio', {}))) {
      const { forma, parts, pintades } = ej.dibuix
      formes.add(forma)
      expect(pintades).toBeGreaterThanOrEqual(1)
      expect(pintades).toBeLessThan(parts)
      expect(parts).toBeLessThanOrEqual(12)
      expect(ej.respuesta).toBe(`${pintades}/${parts}`)
    }
    expect(formes).toEqual(new Set(['pastis', 'barra']))
  })

  it('equivalentes: el hueco hace la igualdad cierta', () => {
    for (const ej of repetir(() => generarFraccioEquivalent('medio', {}))) {
      const [izq, der] = ej.enunciado.split(' = ')
      expect(numerosIguals(valorDe(der.replace('?', ej.respuesta)), valorDe(izq))).toBe(true)
    }
  })

  it('simplificar: la respuesta es irreducible, equivalente y distinta del enunciado', () => {
    for (const ej of repetir(() => generarFraccioSimplificar('medio', {}))) {
      const original = ej.enunciado.replace('Simplifica ', '')
      const r = parseFraccio(ej.respuesta)
      expect(mcd(r.n, r.d)).toBe(1)
      expect(numerosIguals(valorDe(original), r.n / r.d)).toBe(true)
      expect(original).not.toBe(ej.respuesta)
    }
  })

  it('comparar: el signo es correcto y salen los tres', () => {
    const signes = new Set()
    for (const ej of repetir(() => generarFraccioComparar('medio', {}))) {
      const [a, b] = fraccionsDe(ej.enunciado)
      const esperat = numerosIguals(a, b) ? '=' : a < b ? '<' : '>'
      expect(ej.respuesta).toBe(esperat)
      signes.add(ej.respuesta)
    }
    expect(signes).toEqual(new Set(['<', '=', '>']))
  })

  it('fracción de una cantidad: resultado entero y correcto', () => {
    for (const ej of repetir(() => generarFraccioQuantitat('medio', {}))) {
      const [, n, d, q] = ej.enunciado.match(/^(\d+)\/(\d+) de (\d+)$/).map(Number)
      expect(Number.isInteger(ej.respuesta)).toBe(true)
      expect(ej.respuesta).toBe((q * n) / d)
    }
  })

  it('sumar y restar: resultado correcto y simplificado, resta positiva, denominadores sencillos', () => {
    for (const gen of [generarFraccioSuma, generarFraccioResta]) {
      for (const ej of repetir(() => gen('medio', {}))) {
        const [a, b] = fraccionsDe(ej.enunciado)
        const [da, db] = ej.enunciado.match(/\/(\d+)/g).map((t) => Number(t.slice(1)))
        expect(Math.max(da, db) % Math.min(da, db)).toBe(0)
        const r = parseFraccio(ej.respuesta)
        expect(mcd(r.n, r.d)).toBe(1)
        expect(r.n).toBeGreaterThan(0)
        expect(numerosIguals(r.n / r.d, ej.tipo === 'fraccio-suma' ? a + b : a - b)).toBe(true)
      }
    }
  })

  it('respeta denominadorMax', () => {
    for (const ej of repetir(() => generarFraccioSuma('medio', { denominadorMax: 6 }))) {
      for (const d of ej.enunciado.match(/\/(\d+)/g)) expect(Number(d.slice(1))).toBeLessThanOrEqual(6)
    }
  })

  it('fracción → decimal: exacto y con pocos decimales', () => {
    for (const ej of repetir(() => generarFraccioDecimal())) {
      expect(numerosIguals(ej.respuesta, valorDe(ej.enunciado))).toBe(true)
      expect(String(ej.respuesta).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
    }
  })
})
