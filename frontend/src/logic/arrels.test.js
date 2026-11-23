import { describe, it, expect } from 'vitest'
import {
  baseAleatoria,
  esQuadratPerfecte,
  generarArrelExacta,
  generarArrelQuadrat,
  generarQuadratPerfecte,
  generarArrelEntera,
  generarArrelImatge,
} from './arrels.js'

const VECES = 300
const repetir = (fn) => Array.from({ length: VECES }, fn)

describe('arrels quadrades', () => {
  it('bases de 2 a 20, la mayoría hasta 12', () => {
    const bases = repetir(baseAleatoria)
    expect(Math.min(...bases)).toBeGreaterThanOrEqual(2)
    expect(Math.max(...bases)).toBeLessThanOrEqual(20)
    expect(bases.filter((b) => b <= 12).length).toBeGreaterThan(VECES / 2)
  })

  it('raíz exacta: √(n²) = n', () => {
    for (const ej of repetir(generarArrelExacta)) {
      const numero = Number(ej.enunciado.slice(1))
      expect(ej.respuesta ** 2).toBe(numero)
      expect(ej.tipo).toBe('arrel-exacta')
    }
  })

  it('relación con la potencia: la respuesta al cuadrado es el número del enunciado', () => {
    const formas = new Set()
    for (const ej of repetir(generarArrelQuadrat)) {
      const numeros = ej.enunciado.match(/\d+/g).map(Number)
      expect(ej.respuesta ** 2).toBe(Math.max(...numeros))
      formas.add(ej.enunciado.startsWith('Si') ? 'si' : 'quin')
    }
    expect(formas).toEqual(new Set(['si', 'quin']))
  })

  it('¿cuadrado perfecto?: la respuesta es correcta y salen las dos', () => {
    const respuestas = new Set()
    for (const ej of repetir(generarQuadratPerfecte)) {
      const numero = Number(ej.enunciado.match(/\d+/)[0])
      expect(ej.respuesta).toBe(esQuadratPerfecte(numero) ? 'Sí' : 'No')
      expect(ej.opciones).toEqual(['Sí', 'No'])
      respuestas.add(ej.respuesta)
    }
    expect(respuestas).toEqual(new Set(['Sí', 'No']))
  })

  it('raíz entera: n² < número < (n+1)², 4 opciones distintas con la correcta', () => {
    for (const ej of repetir(generarArrelEntera)) {
      const numero = Number(ej.enunciado.match(/√(\d+)/)[1])
      const [a, b] = ej.respuesta.split(' i ').map(Number)
      expect(b).toBe(a + 1)
      expect(a * a).toBeLessThan(numero)
      expect(numero).toBeLessThan(b * b)
      expect(esQuadratPerfecte(numero)).toBe(false)
      expect(ej.opciones).toContain(ej.respuesta)
      expect(new Set(ej.opciones).size).toBe(ej.opciones.length)
      expect(ej.opciones.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('con dibujo: cuadrícula n × n y la respuesta es el lado', () => {
    for (const ej of repetir(generarArrelImatge)) {
      expect(ej.figura).toEqual({ forma: 'quadricula', medidas: { n: ej.respuesta } })
      expect(ej.enunciado).toContain(`${ej.respuesta * ej.respuesta} quadrets`)
    }
  })
})
