import { randomInt, parseNumero, arrodonirPrecisio } from './common.js'

// Fracciones (5è–6è). Las fracciones viajan como texto "3/4" (en el enunciado,
// en la respuesta y en lo que escribe el niño con las dos casillas); la
// pantalla las dibuja apiladas.
//
// params (opcional, desde el modo): { denominadorMax: 4..20 }. Por defecto 12.

const PUNTOS_CALCUL = 15
const PUNTOS_ELEGIR = 10

const denMax = (params) => params?.denominadorMax ?? 12

export function mcd(a, b) {
  return b === 0 ? Math.abs(a) : mcd(b, a % b)
}

export const fraccio = (n, d) => `${n}/${d}`

// Lo que escribe el niño: "3/4" → { n: 3, d: 4 }; "2" o "2/" → { n: 2, d: 1 }
// (un entero). Lo que no es una fracción válida → null.
export function parseFraccio(text) {
  const m = String(text).trim().match(/^(\d+)\s*(?:\/\s*(\d*))?$/)
  if (!m) return null
  const d = m[2] ? Number(m[2]) : 1
  if (d === 0) return null
  return { n: Number(m[1]), d }
}

export function fraccionsEquivalents(a, b) {
  return Boolean(a && b) && a.n * b.d === b.n * a.d
}

// Fracción irreducible al azar con denominador entre dMin y dMax (propia: n < d).
function irreductible(dMin, dMax) {
  for (;;) {
    const d = randomInt(dMin, dMax)
    const n = randomInt(1, d - 1)
    if (mcd(n, d) === 1) return { n, d }
  }
}

const simplificada = (n, d) => {
  const g = mcd(n, d)
  return fraccio(n / g, d / g)
}

// Tipos cuya respuesta es una fracción (se escribe con las dos casillas).
// En "simplificar" se exige la irreducible; en el resto vale cualquier
// equivalente (6/8 por 3/4, 1 por 4/4).
export const TIPOS_RESPOSTA_FRACCIO = ['fraccio-dibuix', 'fraccio-simplificar', 'fraccio-suma', 'fraccio-resta']

export function respostaFraccioCorrecta(ejercicio, dada) {
  const correcta = parseFraccio(ejercicio.respuesta)
  const donada = parseFraccio(dada)
  if (!fraccionsEquivalents(correcta, donada)) return false
  return ejercicio.tipo !== 'fraccio-simplificar' || mcd(donada.n, donada.d) === 1
}

// "Quina fracció està pintada?" con un pastel o una barra dividida en partes.
export function generarFraccioDibuix(nivel, params) {
  const d = randomInt(2, Math.min(12, denMax(params)))
  const n = randomInt(1, d - 1)
  return {
    tipo: 'fraccio-dibuix',
    enunciado: 'Quina fracció està pintada?',
    dibuix: { forma: Math.random() < 0.5 ? 'pastis' : 'barra', parts: d, pintades: n },
    respuesta: fraccio(n, d),
    puntos: PUNTOS_ELEGIR,
  }
}

// "2/3 = ?/12" (o "2/3 = 8/?"): completar una fracción equivalente.
export function generarFraccioEquivalent(nivel, params) {
  const base = irreductible(2, Math.min(6, denMax(params)))
  const kMax = Math.max(2, Math.floor((denMax(params) * 2) / base.d))
  const k = randomInt(2, Math.min(kMax, 8))
  const n2 = base.n * k
  const d2 = base.d * k
  const falta = Math.random() < 0.6 ? 'n' : 'd'
  return {
    tipo: 'fraccio-equivalent',
    enunciado: `${fraccio(base.n, base.d)} = ${falta === 'n' ? fraccio('?', d2) : fraccio(n2, '?')}`,
    respuesta: falta === 'n' ? n2 : d2,
    puntos: PUNTOS_CALCUL,
  }
}

// "Simplifica 12/18" → 2/3.
export function generarFraccioSimplificar(nivel, params) {
  const base = irreductible(2, Math.min(9, denMax(params)))
  const k = randomInt(2, base.d <= 4 ? 6 : 4)
  return {
    tipo: 'fraccio-simplificar',
    enunciado: `Simplifica ${fraccio(base.n * k, base.d * k)}`,
    respuesta: fraccio(base.n, base.d),
    puntos: PUNTOS_CALCUL,
  }
}

// "3/4 ☐ 5/8" → < > =. Con el mismo denominador, con distinto y, a veces,
// equivalentes (2/4 = 1/2).
export function generarFraccioComparar(nivel, params) {
  const max = denMax(params)
  const tipus = Math.random()
  let a
  let b
  if (tipus < 0.2) {
    a = irreductible(2, Math.min(6, max))
    const k = randomInt(2, Math.max(2, Math.floor(max / a.d)))
    b = { n: a.n * k, d: a.d * k }
  } else if (tipus < 0.55) {
    const d = randomInt(3, max)
    const n1 = randomInt(1, d - 1)
    let n2 = randomInt(1, d - 1)
    while (n2 === n1) n2 = randomInt(1, d - 1)
    a = { n: n1, d }
    b = { n: n2, d }
  } else {
    a = irreductible(2, max)
    b = irreductible(2, max)
    while (b.d === a.d || a.n * b.d === b.n * a.d) b = irreductible(2, max)
  }
  if (Math.random() < 0.5) [a, b] = [b, a]
  const dif = a.n * b.d - b.n * a.d
  return {
    tipo: 'fraccio-comparar',
    enunciado: `${fraccio(a.n, a.d)}  ☐  ${fraccio(b.n, b.d)}`,
    respuesta: dif < 0 ? '<' : dif > 0 ? '>' : '=',
    opciones: ['<', '=', '>'],
    puntos: PUNTOS_ELEGIR,
  }
}

// "3/4 de 20" → 15 (la cantidad siempre es múltiplo del denominador).
export function generarFraccioQuantitat(nivel, params) {
  const { n, d } = irreductible(2, Math.min(10, denMax(params)))
  const quantitat = d * randomInt(2, 12)
  return {
    tipo: 'fraccio-quantitat',
    enunciado: `${fraccio(n, d)} de ${quantitat}`,
    respuesta: (quantitat / d) * n,
    puntos: PUNTOS_CALCUL,
  }
}

// Dos fracciones para sumar o restar: con el mismo denominador o con uno
// múltiplo del otro (1/2 + 1/4), sin mínimo común múltiplo.
function dosFraccions(params, suma) {
  const max = denMax(params)
  if (Math.random() < 0.5) {
    const d = randomInt(3, max)
    const a = randomInt(1, d - 1)
    const b = suma ? randomInt(1, d - a) : randomInt(1, d - 1)
    return [
      { n: a, d },
      { n: b, d },
    ]
  }
  const d1 = randomInt(2, Math.min(6, Math.floor(max / 2)))
  const k = randomInt(2, Math.max(2, Math.min(4, Math.floor(max / d1))))
  const d2 = d1 * k
  const x = { n: randomInt(1, d1 - 1), d: d1 }
  const y = { n: randomInt(1, d2 - 1), d: d2 }
  return Math.random() < 0.5 ? [x, y] : [y, x]
}

export function generarFraccioSuma(nivel, params) {
  const [a, b] = dosFraccions(params, true)
  const d = Math.max(a.d, b.d)
  const n = (a.n * d) / a.d + (b.n * d) / b.d
  return {
    tipo: 'fraccio-suma',
    enunciado: `${fraccio(a.n, a.d)} + ${fraccio(b.n, b.d)}`,
    respuesta: simplificada(n, d),
    puntos: PUNTOS_CALCUL,
  }
}

export function generarFraccioResta(nivel, params) {
  for (;;) {
    let [a, b] = dosFraccions(params, false)
    if (a.n * b.d < b.n * a.d) [a, b] = [b, a]
    const d = Math.max(a.d, b.d)
    const n = (a.n * d) / a.d - (b.n * d) / b.d
    if (n <= 0) continue
    return {
      tipo: 'fraccio-resta',
      enunciado: `${fraccio(a.n, a.d)} - ${fraccio(b.n, b.d)}`,
      respuesta: simplificada(n, d),
      puntos: PUNTOS_CALCUL,
    }
  }
}

// "3/4 =" → 0,75. Solo denominadores que dan un decimal exacto y corto.
const DENOMINADORS_DECIMALS = [2, 4, 5, 10, 20, 25, 100]

export function generarFraccioDecimal() {
  const d = DENOMINADORS_DECIMALS[randomInt(0, DENOMINADORS_DECIMALS.length - 1)]
  let n = randomInt(1, d - 1)
  while (d === 100 && n % 10 === 0) n = randomInt(1, d - 1)
  return {
    tipo: 'fraccio-decimal',
    enunciado: fraccio(n, d),
    respuesta: arrodonirPrecisio(n / d),
    puntos: PUNTOS_CALCUL,
  }
}

// Para los tests y el e2e: valor de un texto "3/4" o "0,75".
export function valorDe(text) {
  const f = parseFraccio(text)
  return f ? f.n / f.d : parseNumero(text)
}
