import { describe, it, expect } from 'vitest'
import { llegir, avaluar, generarCombinada, generarCombinadaParentesi } from './combinades.js'

const VECES = 500
const repetir = (fn) => Array.from({ length: VECES }, fn)
const calcula = (text) => avaluar(llegir(text))
// Las operaciones de izquierda a derecha, sin prioridad (el error típico)
const esquerraADreta = (text) => {
  const f = text.replace(/[()]/g, '').split(' ')
  let r = Number(f[0])
  for (let i = 1; i < f.length; i += 2) r = { '+': r + +f[i + 1], '-': r - +f[i + 1], '×': r * +f[i + 1], '÷': r / +f[i + 1] }[f[i]]
  return r
}
const operacions = (text) => (text.match(/[-+×÷]/g) ?? []).length

describe('operaciones combinadas', () => {
  it('el evaluador respeta la prioridad y los paréntesis', () => {
    expect(calcula('8 + 4 × 3')).toBe(20)
    expect(calcula('(8 + 4) × 3')).toBe(36)
    expect(calcula('20 - 12 ÷ 4')).toBe(17)
    expect(calcula('6 + (15 - 3) ÷ 4')).toBe(9)
    expect(calcula('(7 + 5) × (6 - 2)')).toBe(48)
    expect(calcula('10 - 4 - 3')).toBe(3)
    expect(calcula('7 ÷ 2')).toBeNull()
    expect(calcula('3 - 5')).toBeNull()
  })

  it('sin paréntesis: resultado correcto, entero, no negativo, y con trampa', () => {
    let trampes = 0
    for (const ej of repetir(() => generarCombinada('medio', {}))) {
      expect(ej.enunciado).not.toMatch(/[()]/)
      expect(ej.respuesta).toBe(calcula(ej.enunciado))
      expect(Number.isInteger(ej.respuesta) && ej.respuesta >= 0).toBe(true)
      expect([2, 3]).toContain(operacions(ej.enunciado))
      if (esquerraADreta(ej.enunciado) !== ej.respuesta) trampes++
    }
    expect(trampes).toBeGreaterThan(VECES * 0.95)
  })

  it('con paréntesis: correcto y quitar los paréntesis cambia el resultado', () => {
    let trampes = 0
    for (const ej of repetir(() => generarCombinadaParentesi('medio', {}))) {
      expect(ej.enunciado).toMatch(/\(.+\)/)
      expect(ej.respuesta).toBe(calcula(ej.enunciado))
      expect(ej.respuesta).toBeGreaterThanOrEqual(0)
      if (calcula(ej.enunciado.replace(/[()]/g, '')) !== ej.respuesta) trampes++
    }
    expect(trampes).toBeGreaterThan(VECES * 0.95)
  })

  it('nunca se multiplica ni se divide por 1 (tampoco por un paréntesis que vale 1)', () => {
    const ambUn = (node) =>
      'op' in node &&
      ((['×', '÷'].includes(node.op) && (avaluar(node.esq) === 1 || avaluar(node.dre) === 1)) || ambUn(node.esq) || ambUn(node.dre))
    for (const gen of [generarCombinada, generarCombinadaParentesi]) {
      for (const ej of repetir(() => gen('medio', {}))) expect(ambUn(llegir(ej.enunciado))).toBe(false)
    }
  })

  it('respeta los parámetros: número de operaciones y tamaño', () => {
    for (const ej of repetir(() => generarCombinada('medio', { operacions: 2, max: 10 }))) {
      expect(operacions(ej.enunciado)).toBe(2)
      expect(ej.respuesta).toBeLessThanOrEqual(100)
    }
    for (const ej of repetir(() => generarCombinadaParentesi('medio', { operacions: 3 }))) {
      expect(operacions(ej.enunciado)).toBe(3)
      expect(ej.puntos).toBe(20)
    }
  })
})
