import { describe, it, expect } from 'vitest'
import { PARAMETRES_ACCEPTATS, generarEjercicio, generarEjercicioParaPerfil } from './ejercicios.js'
// La definición única de los parámetros vive en el servidor.
import { PARAMETRES, validarParams } from '../../../backend/src/catalogo/parametres.js'

const VECES = 300
const repetir = (fn) => Array.from({ length: VECES }, fn)
const numeros = (enunciado) => enunciado.match(/\d+/g).map(Number)
const xifres = (n) => String(n).length

describe('parámetros de dificultad por modo', () => {
  it('los parámetros que define el servidor son exactamente los que entienden los generadores', () => {
    const delServidor = Object.fromEntries(Object.entries(PARAMETRES).map(([tipo, ps]) => [tipo, Object.keys(ps).sort()]))
    const delJuego = Object.fromEntries(Object.entries(PARAMETRES_ACCEPTATS).map(([tipo, ps]) => [tipo, [...ps].sort()]))
    expect(delJuego).toEqual(delServidor)
  })

  it('suma y resta: { max } acota los números y la resta nunca es negativa', () => {
    for (const ej of repetir(() => generarEjercicio('suma', 'facil', { max: 99999 }))) {
      const [a, b] = numeros(ej.enunciado)
      expect(Math.max(a, b)).toBeLessThanOrEqual(99999)
      expect(ej.respuesta).toBe(a + b)
    }
    const grandes = repetir(() => generarEjercicio('suma', 'facil', { max: 99999 })).filter((e) => e.respuesta > 1000)
    expect(grandes.length).toBeGreaterThan(VECES / 2) // de verdad usa el rango, no el del nivel fácil
    for (const ej of repetir(() => generarEjercicio('resta', 'facil', { max: 5000 }))) {
      const [a, b] = numeros(ej.enunciado)
      expect(a).toBeLessThanOrEqual(5000)
      expect(ej.respuesta).toBe(a - b)
      expect(ej.respuesta).toBeGreaterThanOrEqual(0)
    }
  })

  it('multiplicación: cifras de cada factor, o solo ciertas tablas', () => {
    for (const ej of repetir(() => generarEjercicio('multiplicacion', 'facil', { xifresA: 3, xifresB: 2 }))) {
      const [a, b] = numeros(ej.enunciado)
      expect([xifres(a), xifres(b)]).toEqual([3, 2])
      expect(ej.respuesta).toBe(a * b)
    }
    for (const ej of repetir(() => generarEjercicio('multiplicacion', 'medio', { taules: [2, 5] }))) {
      const [a, b] = numeros(ej.enunciado)
      expect([a, b].some((x) => x === 2 || x === 5)).toBe(true)
      expect(Math.max(a, b)).toBeLessThanOrEqual(10)
    }
  })

  it('división: exacta, con las cifras pedidas en divisor y cociente', () => {
    for (const ej of repetir(() => generarEjercicio('division', 'facil', { xifresDivisor: 2, xifresQuocient: 3 }))) {
      const [dividendo, divisor] = numeros(ej.enunciado)
      expect(xifres(divisor)).toBe(2)
      expect(xifres(ej.respuesta)).toBe(3)
      expect(divisor * ej.respuesta).toBe(dividendo)
    }
  })

  it('estimación: redondea a la unidad pedida con números de las cifras pedidas', () => {
    for (const ej of repetir(() => generarEjercicio('estimacion', 'medio', { arrodonir: 100, xifres: 3 }))) {
      expect(ej.enunciado).toMatch(/^Arrodoneix a les centenes i estima: /)
      const [a, b] = numeros(ej.enunciado)
      expect([xifres(a), xifres(b)]).toEqual([3, 3])
      const r = (n) => Math.round(n / 100) * 100
      expect(ej.respuesta).toBe(ej.enunciado.includes('+') ? r(a) + r(b) : r(a) - r(b))
    }
  })

  it('series: el salto está entre el mínimo y el máximo', () => {
    for (const ej of repetir(() => generarEjercicio('sucesion', 'medio', { pasMin: 25, pasMax: 50 }))) {
      const [t1, t2] = numeros(ej.enunciado)
      expect(Math.abs(t2 - t1)).toBeGreaterThanOrEqual(25)
      expect(Math.abs(t2 - t1)).toBeLessThanOrEqual(50)
    }
  })

  it('sin parámetros, cada generador hace lo de siempre (según el nivel)', () => {
    for (const ej of repetir(() => generarEjercicio('suma', 'facil'))) expect(ej.respuesta).toBeLessThanOrEqual(12)
    for (const ej of repetir(() => generarEjercicio('resta', 'facil', {}))) expect(numeros(ej.enunciado)[0]).toBeLessThanOrEqual(10)
  })

  it('el modo pasa a cada tipo solo sus parámetros', () => {
    const perfil = { operaciones: ['suma', 'resta'], nivel: 'facil', params: { suma: { max: 50000 } } }
    const ejs = repetir(() => generarEjercicioParaPerfil(perfil))
    expect(ejs.filter((e) => e.tipo === 'suma').some((e) => e.respuesta > 100)).toBe(true)
    expect(ejs.filter((e) => e.tipo === 'resta').every((e) => numeros(e.enunciado)[0] <= 10)).toBe(true)
  })

  it('la validación del servidor acepta parámetros válidos de los generadores', () => {
    expect(validarParams(['multiplicacion'], { multiplicacion: { taules: [2, 5, 10] } })).toEqual({
      params: { multiplicacion: { taules: [2, 5, 10] } },
    })
  })
})
