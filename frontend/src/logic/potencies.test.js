import { describe, it, expect } from 'vitest'
import {
  generarPotenciaCalcul,
  generarPotenciaCombinada,
  generarPotenciaExpressio,
  generarPotenciaBaseDeu,
  generarPotenciaImatge,
  generarPotenciaConsecutiva,
  generarPotenciaSerie,
  generarPotenciaComparar,
  generarPotenciaDescomposicio,
  superindex,
  potencia,
  formatar,
} from './potencies.js'
import { comprobarRespuesta } from './ejercicios.js'
import { obtenerModo } from './perfiles.js'

const VECES = 400

function opcionesValidas(ej) {
  expect(ej.opciones).toHaveLength(4)
  expect(new Set(ej.opciones).size).toBe(4)
  expect(ej.opciones).toContain(ej.respuesta)
}

describe('utilidades', () => {
  it('escribe superíndices y números con punto de millares', () => {
    expect(superindex(12)).toBe('¹²')
    expect(potencia(8, 5)).toBe('8⁵')
    expect(formatar(1331)).toBe('1.331')
    expect(formatar(14641)).toBe('14.641')
    expect(formatar(512)).toBe('512')
  })
})

describe('generarPotenciaCalcul', () => {
  it('la respuesta es base^exponente y es un entero razonable', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaCalcul()
      const [, base, sup] = ej.enunciado.match(/^(\d+)(\D+)$/)
      const exponent = Number([...sup].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
      expect(ej.respuesta).toBe(Number(base) ** exponent)
      expect(ej.respuesta).toBeLessThanOrEqual(1_000_000)
      expect(comprobarRespuesta(ej, String(ej.respuesta))).toBe(true)
    }
  })
})

describe('generarPotenciaCombinada', () => {
  it('el resultado es positivo y coincide con evaluar la expresión', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaCombinada()
      const js = ej.enunciado
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (s) => `**${[...s].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')}`)
        .replace(/×/g, '*')
        .replace(/−/g, '-')
      expect(ej.respuesta).toBe(Function(`return ${js}`)())
      expect(ej.respuesta).toBeGreaterThan(0)
    }
  })
})

describe('opción múltiple', () => {
  it('expressio: 4 opciones distintas y una es la correcta', () => {
    for (let i = 0; i < VECES; i++) opcionesValidas(generarPotenciaExpressio())
  })

  it('expressio: la multiplicación y la potencia son equivalentes', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaExpressio()
      const factors = ej.enunciado.match(/(\d+)( × \d+)+/)
      if (factors) {
        const llista = factors[0].split(' × ')
        expect(ej.respuesta).toBe(potencia(llista[0], llista.length))
      } else {
        const [, base, sup] = ej.enunciado.match(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\?/)
        const exponent = Number([...sup].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
        expect(ej.respuesta).toBe(Array(exponent).fill(base).join(' × '))
      }
    }
  })

  it('base deu: la respuesta es 10 elevado al exponente del nombre', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaBaseDeu()
      opcionesValidas(ej)
      expect(ej.respuesta.startsWith('10')).toBe(true)
    }
  })

  it('imagen: cuadrícula -> n², cubo -> n³', () => {
    const formas = new Set()
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaImatge()
      opcionesValidas(ej)
      formas.add(ej.figura.forma)
      const exponent = ej.figura.forma === 'cub' ? 3 : 2
      expect(ej.respuesta).toBe(potencia(ej.figura.medidas.n, exponent))
    }
    expect(formas).toEqual(new Set(['cub', 'quadricula']))
  })
})

describe('consecutivas y series', () => {
  it('consecutiva: la respuesta es la potencia siguiente', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaConsecutiva()
      const [, base, sup] = ej.enunciado.match(/calcula quant és (\d+)(\D+)$/)
      const exponent = Number([...sup].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
      expect(ej.respuesta).toBe(Number(base) ** exponent)
      expect(ej.respuesta).toBeLessThan(100_000)
    }
  })

  it('serie: continúa cuadrados o cubos perfectos', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaSerie()
      const termes = ej.enunciado.replace(', __', '').split(', ').map(Number)
      const encaja = (e) => {
        const inici = Math.round(termes[0] ** (1 / e))
        return (
          termes.every((t, k) => t === (inici + k) ** e) && ej.respuesta === (inici + termes.length) ** e
        )
      }
      expect(encaja(2) || encaja(3)).toBe(true)
    }
  })
})

describe('modo Potències', () => {
  it('existe en Matemáticas con las nueve operaciones', () => {
    const modo = obtenerModo('mayor', 'matematicas', 'potencies')
    expect(modo.nombre).toBe('Potències')
    expect(modo.operaciones).toHaveLength(9)
  })
})

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const leerPotencia = (txt) => {
  const [, base, sup] = txt.match(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/)
  return Number(base) ** Number([...sup].map((c) => SUP.indexOf(c)).join(''))
}

describe('comparar y descomponer', () => {
  it('comparar: el símbolo es el correcto y salen <, = y >', () => {
    const vistos = new Set()
    for (let i = 0; i < VECES * 2; i++) {
      const ej = generarPotenciaComparar()
      const [izq, der] = ej.enunciado.replace('Compara: ', '').split(' i ')
      const x = leerPotencia(izq)
      const y = leerPotencia(der)
      expect(ej.respuesta).toBe(x < y ? '<' : x > y ? '>' : '=')
      expect(ej.opciones).toEqual(['<', '=', '>'])
      vistos.add(ej.respuesta)
    }
    expect(vistos).toEqual(new Set(['<', '=', '>']))
  })

  it('descomponer: suma las cifras por su potencia de 10', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarPotenciaDescomposicio()
      const total = ej.enunciado.split(' + ').reduce((suma, parte) => {
        const m = parte.match(/^(\d) × (10[⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/)
        return suma + (m ? Number(m[1]) * leerPotencia(m[2]) : Number(parte))
      }, 0)
      expect(ej.respuesta).toBe(total)
    }
  })
})
