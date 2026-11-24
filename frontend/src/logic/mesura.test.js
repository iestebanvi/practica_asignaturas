import { describe, it, expect } from 'vitest'
import {
  formatQuantitat,
  generarMesuraLongitud,
  generarMesuraMassa,
  generarMesuraCapacitat,
  generarMesuraSuperficie,
  generarMesuraVolum,
  generarMesuraTemps,
  generarMesuraComparar,
  generarMesuraEscala,
} from './mesura.js'
import { comprobarRespuesta } from './ejercicios.js'
import { parseNumeroAmbMilers, numerosIguals } from './common.js'

const VECES = 500
const repetir = (fn) => Array.from({ length: VECES }, fn)

// Potencia de 10 de cada unidad (comprobación independiente del generador).
const EXP = {
  km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3,
  t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3,
  kl: 3, hl: 2, dal: 1, l: 0, dl: -1, cl: -2, ml: -3,
  'km²': 6, 'hm²': 4, ha: 4, 'dam²': 2, 'm²': 0, 'dm²': -2, 'cm²': -4, 'mm²': -6,
}
const VOLUM = { 'm³': 9, 'dm³': 6, 'cm³': 3, 'mm³': 0 }
const VOLUM_EN_LITRES = { 'm³': 3, 'dm³': 0, 'cm³': -3 }

const llegirNombre = (t) => Number(t.replace(/\./g, '').replace(',', '.'))
const decimalsDe = (t) => (t.split(',')[1] ?? '').length

// "3,5 km = ? m" → valor esperado
function esperat(enunciado) {
  const m = enunciado.match(/^([\d.,]+) (\S+) = \? (\S+)$/)
  expect(m, enunciado).toBeTruthy()
  const [, n, a, b] = m
  let ea
  let eb
  if (a in VOLUM && b in VOLUM) [ea, eb] = [VOLUM[a], VOLUM[b]]
  else [ea, eb] = [VOLUM_EN_LITRES[a] ?? EXP[a], VOLUM_EN_LITRES[b] ?? EXP[b]]
  expect(ea, a).toBeTypeOf('number')
  expect(eb, b).toBeTypeOf('number')
  return { valor: llegirNombre(n) * 10 ** (ea - eb), dada: n, a, b, salt: Math.abs(ea - eb) }
}

describe('medida', () => {
  it('formatQuantitat: coma decimal y sin punto de miles', () => {
    expect(formatQuantitat(25, 1)).toBe('2,5')
    expect(formatQuantitat(2500, 0)).toBe('2500')
    expect(formatQuantitat(123456, 1)).toBe('12345,6')
    expect(formatQuantitat(999, 0)).toBe('999')
  })

  const CONVERSIONS = {
    longitud: generarMesuraLongitud,
    massa: generarMesuraMassa,
    capacitat: generarMesuraCapacitat,
    superficie: generarMesuraSuperficie,
    volum: generarMesuraVolum,
  }
  for (const [nom, generar] of Object.entries(CONVERSIONS)) {
    it(`conversiones de ${nom}: resultado correcto, exacto y dentro de los parámetros`, () => {
      for (const params of [{}, { decimals: 0, salts: 1 }, { decimals: 1, salts: 2 }, { decimals: 2, salts: 3 }]) {
        for (const ej of repetir(() => generar('medio', params))) {
          const { valor, dada, a, b } = esperat(ej.enunciado)
          expect(numerosIguals(ej.respuesta, valor), ej.enunciado).toBe(true)
          expect(a).not.toBe(b === 'ha' ? 'hm²' : b)
          const dec = params.decimals ?? 2
          expect(decimalsDe(dada), ej.enunciado).toBeLessThanOrEqual(dec)
          expect(decimalsDe(String(ej.respuesta)), ej.enunciado).toBeLessThanOrEqual(dec)
          expect(ej.respuesta).toBeGreaterThan(0)
          expect(ej.respuesta).toBeLessThan(10_000_000)
        }
      }
    })
  }

  it('los saltos limitan la distancia entre unidades', () => {
    for (const ej of repetir(() => generarMesuraLongitud('medio', { salts: 1 }))) {
      expect(esperat(ej.enunciado).salt).toBe(1)
    }
    for (const ej of repetir(() => generarMesuraSuperficie('medio', { salts: 1 }))) {
      expect(esperat(ej.enunciado).salt).toBe(2)
    }
    const salts = new Set(repetir(() => esperat(generarMesuraLongitud('medio', { salts: 3 }).enunciado).salt))
    expect([...salts].sort()).toEqual([1, 2, 3])
  })

  it('volumen: también entre volumen y capacidad; superficie con hectáreas', () => {
    const units = new Set(repetir(() => esperat(generarMesuraVolum('medio', {}).enunciado)).flatMap((x) => [x.a, x.b]))
    expect(units.has('l')).toBe(true)
    expect(units.has('mm³')).toBe(true)
    const sup = new Set(repetir(() => esperat(generarMesuraSuperficie('medio', {}).enunciado)).flatMap((x) => [x.a, x.b]))
    expect(sup.has('ha')).toBe(true)
  })

  it('tiempo: resultado correcto en cada variante; horas con coma solo si hay decimales', () => {
    const S = { h: 3600, min: 60, s: 1, dies: 86400 }
    const segons = (t) => [...t.matchAll(/([\d,]+) (h|min|s|dies)/g)].reduce((s, [, n, u]) => s + llegirNombre(n) * S[u], 0)
    const totes = [...repetir(() => generarMesuraTemps('medio', {})), ...repetir(() => generarMesuraTemps('medio', { decimals: 0 }))]
    for (const ej of totes) {
      const [esq, dre] = ej.enunciado.split(' = ')
      const unitat = dre.match(/\? (h|min|s|dies)/)[1]
      // el lado derecho: lo conocido + ? en su unidad
      const conegut = segons(dre.replace(/\? \S+/, ''))
      expect(segons(esq), ej.enunciado).toBe(conegut + ej.respuesta * S[unitat])
      expect(Number.isInteger(ej.respuesta)).toBe(true)
    }
    expect(repetir(() => generarMesuraTemps('medio', { decimals: 0 })).some((e) => e.enunciado.includes(','))).toBe(false)
    expect(repetir(() => generarMesuraTemps('medio', { decimals: 1 })).some((e) => e.enunciado.includes(','))).toBe(true)
  })

  it('comparar: respuesta correcta y salen las tres', () => {
    const respostes = new Set()
    const casos = [...repetir(() => generarMesuraComparar('medio', {})), ...repetir(() => generarMesuraComparar('medio', { decimals: 0, salts: 1 }))]
    for (const [i, ej] of casos.entries()) {
      const [x, y] = ej.enunciado.split('☐').map((c) => c.trim())
      const dec = i < VECES ? 2 : 0
      expect(decimalsDe(x.split(' ')[0]), ej.enunciado).toBeLessThanOrEqual(dec)
      expect(decimalsDe(y.split(' ')[0]), ej.enunciado).toBeLessThanOrEqual(dec)
      const valor = (c) => {
        const [n, unitat] = c.split(' ')
        return llegirNombre(n) * 10 ** EXP[unitat]
      }
      const [vx, vy] = [valor(x), valor(y)]
      const r = Math.abs(vx - vy) < 1e-9 * Math.max(vx, vy) ? '=' : vx < vy ? '<' : '>'
      expect(ej.respuesta, ej.enunciado).toBe(r)
      expect(x.split(' ')[1]).not.toBe(y.split(' ')[1])
      respostes.add(r)
    }
    expect(respostes).toEqual(new Set(['<', '=', '>']))
  })

  it('escalas: resultado correcto en las cuatro variantes', () => {
    const vistes = new Set()
    for (const ej of repetir(() => generarMesuraEscala())) {
      const ns = (ej.enunciado.match(/[\d.]+(,\d+)?/g) ?? []).filter((x) => /\d/.test(x)).map(llegirNombre)
      if (ej.enunciado.startsWith('Un mapa')) {
        const [, e, cm] = ns
        expect(ej.respuesta).toBeCloseTo((cm * e) / 100000, 6)
        vistes.add(0)
      } else if (ej.enunciado.startsWith('En un plànol')) {
        const [, e, cm] = ns
        expect(ej.respuesta).toBeCloseTo((cm * e) / 100, 6)
        vistes.add(1)
      } else if (ej.enunciado.startsWith('Una habitació')) {
        const [m, , e] = ns
        expect(ej.respuesta).toBeCloseTo((m * 100) / e, 6)
        vistes.add(2)
      } else {
        const [cm, km] = ns
        expect(ej.respuesta).toBeCloseTo((km * 100000) / cm, 6)
        vistes.add(3)
      }
    }
    expect(vistes.size).toBe(4)
  })

  it('las respuestas se aceptan con coma, con punto decimal y con punto de miles', () => {
    expect(parseNumeroAmbMilers('2.500')).toBe(2500)
    expect(parseNumeroAmbMilers('12.345,5')).toBe(12345.5)
    expect(parseNumeroAmbMilers('2.5')).toBeNaN()
    const gran = { tipo: 'mesura-longitud', respuesta: 2500 }
    expect(comprobarRespuesta(gran, '2500')).toBe(true)
    expect(comprobarRespuesta(gran, '2.500')).toBe(true)
    expect(comprobarRespuesta(gran, '2,5')).toBe(false)
    const petit = { tipo: 'mesura-longitud', respuesta: 2.5 }
    expect(comprobarRespuesta(petit, '2,5')).toBe(true)
    expect(comprobarRespuesta(petit, '2.5')).toBe(true)
    expect(comprobarRespuesta(petit, '2.500')).toBe(true) // = 2,500
    expect(comprobarRespuesta(petit, '2500')).toBe(false)
    expect(comprobarRespuesta({ tipo: 'mesura-escala', respuesta: 50000 }, '50.000')).toBe(true)
  })
})
