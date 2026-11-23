import { randomInt, formatDecimal, arrodonirPrecisio } from './common.js'
import { mcd, fraccio } from './fraccions.js'

// Porcentajes y proporcionalidad (6è). Todos los números se eligen para que
// el resultado sea exacto (el 25 % solo se aplica a múltiplos de 4…).
//
// params (opcional, desde el modo; tipos de porcentaje):
//   { percentatges: [10, 25, …], max: 20..1000 }.
// Por defecto 10, 20, 25, 50 y 75 %, y cantidades hasta 200.

const PERCENTATGES = [10, 20, 25, 50, 75]
const PUNTOS_CALCUL = 15
const PUNTOS_PROBLEMA = 20

const triar = (llista) => llista[randomInt(0, llista.length - 1)]

// Un porcentaje de la lista y una cantidad (hasta "max", al menos 10) de la
// que ese porcentaje es un número entero.
function percentatgeIQuantitat(params = {}) {
  const p = triar(params.percentatges?.length ? params.percentatges : PERCENTATGES)
  const pas = 100 / mcd(p, 100) // la cantidad tiene que ser múltiplo de esto
  const max = params.max ?? 200
  const minim = Math.ceil(10 / pas)
  const maxim = Math.max(minim, Math.floor(max / pas))
  const quantitat = pas * randomInt(minim, maxim)
  return { p, quantitat, part: (quantitat * p) / 100 }
}

// "25 % de 80" → 20
export function generarPercentatgeQuantitat(nivel, params) {
  const { p, quantitat, part } = percentatgeIQuantitat(params)
  return { tipo: 'percentatge-quantitat', enunciado: `${p} % de ${quantitat}`, respuesta: part, puntos: PUNTOS_CALCUL }
}

// "Quin percentatge de 50 és 10?" → 20
export function generarPercentatgeQuin(nivel, params) {
  let r = percentatgeIQuantitat(params)
  for (let i = 0; i < 20 && r.part === 0; i++) r = percentatgeIQuantitat(params)
  return {
    tipo: 'percentatge-quin',
    enunciado: `Quin percentatge de ${r.quantitat} és ${r.part}?`,
    respuesta: r.p,
    puntos: PUNTOS_CALCUL,
  }
}

// Descuentos: a veces se pregunta lo que se paga y a veces lo que se ahorra.
const ARTICLES = ['Una samarreta', 'Unes sabatilles', 'Una motxilla', 'Un joc', 'Una pilota', 'Uns auriculars', 'Una jaqueta']

export function generarPercentatgeDescompte(nivel, params) {
  const { p, quantitat, part } = percentatgeIQuantitat(params)
  const pagues = Math.random() < 0.6
  return {
    tipo: 'percentatge-descompte',
    enunciado: `${triar(ARTICLES)} costa ${quantitat} €. Si en fan un ${p} % de descompte, ${pagues ? 'quant pagues?' : 'quant t’estalvies?'}`,
    respuesta: pagues ? quantitat - part : part,
    puntos: PUNTOS_PROBLEMA,
  }
}

// Equivalencias entre fracción, decimal y porcentaje:
//   "3/4 = ? %" → 75 · "0,35 = ? %" → 35 · "Escriu 40 % en nombre decimal" → 0,4
//   · "Escriu 25 % com a fracció" → 1/4 (con las dos casillas; vale cualquier equivalente)
const DENOMINADORS = [2, 4, 5, 10, 20, 25, 50]

export function generarPercentatgeEquivalencia() {
  const variant = randomInt(0, 3)
  if (variant === 0) {
    const d = triar(DENOMINADORS)
    const n = randomInt(1, d - 1)
    return {
      tipo: 'percentatge-equivalencia',
      enunciado: `${fraccio(n, d)} = ? %`,
      respuesta: (n * 100) / d,
      puntos: PUNTOS_CALCUL,
    }
  }
  const p = randomInt(1, 19) * 5 // 5, 10, … 95
  if (variant === 1) {
    return {
      tipo: 'percentatge-equivalencia',
      enunciado: `${formatDecimal(p / 100)} = ? %`,
      respuesta: p,
      puntos: PUNTOS_CALCUL,
    }
  }
  if (variant === 2) {
    return {
      tipo: 'percentatge-equivalencia',
      enunciado: `Escriu ${p} % en nombre decimal`,
      respuesta: arrodonirPrecisio(p / 100),
      puntos: PUNTOS_CALCUL,
    }
  }
  const g = mcd(p, 100)
  return {
    tipo: 'percentatge-equivalencia',
    enunciado: `Escriu ${p} % com a fracció`,
    respuesta: fraccio(p / g, 100 / g),
    formatResposta: 'fraccio',
    puntos: PUNTOS_CALCUL,
  }
}

// Tabla de proporcionalidad de 4 columnas con una casilla vacía (null). La
// segunda fila es la primera × a/b (b = 1 casi siempre).
const MAGNITUDS = [
  ['Quilos', 'Preu (€)'],
  ['Llibretes', 'Preu (€)'],
  ['Hores', 'Quilòmetres'],
  ['Persones', 'Pizzes'],
  ['Litres', 'Ampolles'],
  ['Minuts', 'Pàgines'],
]

export function generarProporcioTaula() {
  const b = Math.random() < 0.7 ? 1 : triar([2, 3, 4])
  let a = randomInt(2, 9)
  while (mcd(a, b) !== 1) a = randomInt(2, 9)
  const valors = new Set()
  while (valors.size < 4) valors.add(b * randomInt(1, 10))
  const fila1 = [...valors].sort((x, y) => x - y)
  const fila2 = fila1.map((x) => (x * a) / b)
  const fila = randomInt(0, 1)
  const columna = randomInt(0, 3)
  const respuesta = (fila === 0 ? fila1 : fila2)[columna]
  const files = [fila1, fila2].map((f, i) => f.map((v, j) => (i === fila && j === columna ? null : v)))
  return {
    tipo: 'proporcio-taula',
    enunciado: 'Completa la taula de proporcionalitat',
    taula: { magnituds: triar(MAGNITUDS), files },
    respuesta,
    puntos: PUNTOS_CALCUL,
  }
}

// Reducción a la unidad: "3 llibretes costen 6 €. Quant costen 7 llibretes?"
const CONTEXTOS_UNITAT = [
  (a, b, ta) => `${a} llibretes costen ${ta} €. Quant costen ${b} llibretes?`,
  (a, b, ta) => `Un cotxe fa ${ta} km en ${a} hores. Quants km farà en ${b} hores, a la mateixa velocitat?`,
  (a, b, ta) => `Amb ${a} ous es fan ${ta} galetes. Quantes galetes es fan amb ${b} ous?`,
  (a, b, ta) => `${a} entrades del cinema costen ${ta} €. Quant costen ${b} entrades?`,
  (a, b, ta) => `Una impressora fa ${ta} còpies en ${a} minuts. Quantes còpies farà en ${b} minuts?`,
]

export function generarProporcioUnitat() {
  const unitat = randomInt(2, 12)
  const a = randomInt(2, 9)
  let b = randomInt(2, 12)
  while (b === a) b = randomInt(2, 12)
  return {
    tipo: 'proporcio-unitat',
    enunciado: triar(CONTEXTOS_UNITAT)(a, b, a * unitat),
    respuesta: b * unitat,
    puntos: PUNTOS_PROBLEMA,
  }
}
