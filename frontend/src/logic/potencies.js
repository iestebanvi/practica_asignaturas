import { randomInt, mezclar } from './common.js'

const PUNTOS_CALCUL = 15
const PUNTOS_ELEGIR = 10

const SUPERINDEX = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function elegir(lista) {
  return lista[randomInt(0, lista.length - 1)]
}

export function superindex(exponent) {
  return String(exponent)
    .split('')
    .map((d) => SUPERINDEX[Number(d)])
    .join('')
}

export function potencia(base, exponent) {
  return `${base}${superindex(exponent)}`
}

function producte(base, vegades) {
  return Array(vegades).fill(base).join(' × ')
}

// Números grandes con punto de millares, como en las fichas (1.331).
export function formatar(numero) {
  return String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Respuesta correcta + tres distractores distintos, mezclados.
function opcionsAmb(correcta, candidats) {
  const distractors = [...new Set(candidats)].filter((c) => c !== correcta)
  return mezclar([correcta, ...mezclar(distractors).slice(0, 3)])
}

// ---- Calcular ------------------------------------------------------------

function baseIExponent() {
  const tipus = randomInt(1, 10)
  if (tipus <= 5) return { base: randomInt(2, 9), exponent: randomInt(2, 5) }
  if (tipus <= 7) return { base: randomInt(11, 15), exponent: randomInt(2, 3) }
  if (tipus <= 9) return { base: randomInt(2, 9) * 10, exponent: randomInt(2, 3) }
  return { base: 10, exponent: randomInt(2, 6) }
}

export function generarPotenciaCalcul() {
  const { base, exponent } = baseIExponent()
  return {
    tipo: 'potencia-calcul',
    enunciado: potencia(base, exponent),
    respuesta: base ** exponent,
    puntos: PUNTOS_CALCUL,
  }
}

// ---- Expresiones combinadas ----------------------------------------------

export function generarPotenciaCombinada() {
  const forma = randomInt(1, 4)

  if (forma === 1) {
    const a = elegir([randomInt(11, 30), randomInt(2, 9) * 10])
    const n = randomInt(1, 50) * 10
    return combinada(`${potencia(a, 2)} + ${n}`, a * a + n)
  }
  if (forma === 2) {
    const a = elegir([randomInt(3, 9), randomInt(1, 3) * 10])
    const cub = a ** 3
    const n = 5 * randomInt(1, Math.floor((cub - 1) / 5))
    return combinada(`${potencia(a, 3)} − ${n}`, cub - n)
  }
  if (forma === 3) {
    const m = randomInt(2, 99)
    const e = randomInt(2, 4)
    const k = randomInt(1, 90) * 10
    return combinada(`(${m} × ${potencia(10, e)}) + ${k}`, m * 10 ** e + k)
  }
  const b = randomInt(2, 4)
  const a = randomInt(Math.floor(Math.sqrt(b ** 3)) + 1, 15)
  const c = randomInt(1, 30)
  return combinada(`${potencia(a, 2)} − ${potencia(b, 3)} + ${c}`, a * a - b ** 3 + c)
}

function combinada(enunciado, respuesta) {
  return { tipo: 'potencia-combinada', enunciado, respuesta, puntos: PUNTOS_CALCUL }
}

// ---- Potencia <-> multiplicación -----------------------------------------

export function generarPotenciaExpressio() {
  const base = randomInt(2, 9)
  const exponent = randomInt(3, 6)

  if (Math.random() < 0.5) {
    const correcta = potencia(base, exponent)
    return {
      tipo: 'potencia-expressio',
      enunciado: `Escriu en forma de potència: ${producte(base, exponent)}`,
      respuesta: correcta,
      opciones: opcionsAmb(correcta, [
        potencia(exponent, base),
        potencia(base, exponent - 1),
        potencia(base, exponent + 1),
        potencia(base + 1, exponent),
      ]),
      puntos: PUNTOS_ELEGIR,
    }
  }

  const correcta = producte(base, exponent)
  return {
    tipo: 'potencia-expressio',
    enunciado: `Quina multiplicació de factors expressa ${potencia(base, exponent)}?`,
    respuesta: correcta,
    opciones: opcionsAmb(correcta, [
      producte(base, exponent - 1),
      producte(base, exponent + 1),
      `${base} × ${exponent}`,
      producte(exponent, base > 6 ? 3 : base),
      producte(base + 1, exponent),
      producte(base, exponent + 2),
    ]),
    puntos: PUNTOS_ELEGIR,
  }
}

// ---- Potencias de base 10 ------------------------------------------------

export const BASE_DEU = [
  { nom: 'Deu', exponent: 1 },
  { nom: 'Cent', exponent: 2 },
  { nom: 'Mil', exponent: 3 },
  { nom: 'Deu mil', exponent: 4 },
  { nom: 'Cent mil', exponent: 5 },
  { nom: 'Un milió', exponent: 6 },
  { nom: 'Deu milions', exponent: 7 },
  { nom: 'Cent milions', exponent: 8 },
]

export function generarPotenciaBaseDeu() {
  const item = elegir(BASE_DEU)
  const correcta = potencia(10, item.exponent)
  return {
    tipo: 'potencia-base10',
    enunciado: `Escriu en forma de potència de base deu: ${item.nom}`,
    respuesta: correcta,
    opciones: opcionsAmb(
      correcta,
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter((e) => e !== item.exponent && Math.abs(e - item.exponent) <= 3)
        .map((e) => potencia(10, e)),
    ),
    puntos: PUNTOS_ELEGIR,
  }
}

// ---- Potencia dibujada ---------------------------------------------------

// Cuadrícula n x n  -> n²;  cubo n x n x n -> n³.
export function generarPotenciaImatge() {
  const cub = Math.random() < 0.4
  const n = cub ? randomInt(2, 4) : randomInt(2, 7)
  const correcta = potencia(n, cub ? 3 : 2)
  return {
    tipo: 'potencia-imatge',
    enunciado: cub ? 'Quina potència representa aquest cub?' : 'Quina potència representa aquesta quadrícula?',
    figura: { forma: cub ? 'cub' : 'quadricula', medidas: { n } },
    respuesta: correcta,
    opciones: opcionsAmb(correcta, [
      potencia(n, cub ? 2 : 3),
      potencia(n + 1, cub ? 3 : 2),
      potencia(n - 1, cub ? 3 : 2),
      potencia(cub ? 3 : 2, n),
    ]),
    puntos: PUNTOS_ELEGIR,
  }
}

// ---- Potencias consecutivas ----------------------------------------------

export function generarPotenciaConsecutiva() {
  const base = randomInt(2, 15)
  const exponent = base > 9 ? randomInt(2, 3) : randomInt(2, 4)
  return {
    tipo: 'potencia-consecutiva',
    enunciado: `Si ${potencia(base, exponent)} és ${formatar(base ** exponent)}, calcula quant és ${potencia(base, exponent + 1)}`,
    respuesta: base ** (exponent + 1),
    puntos: PUNTOS_CALCUL,
  }
}

// ---- Serie de cuadrados (y cubos) perfectos -------------------------------

export function generarPotenciaSerie() {
  const exponent = Math.random() < 0.75 ? 2 : 3
  const visibles = randomInt(4, 6)
  const inici = exponent === 2 ? randomInt(1, 8) : randomInt(1, 3)
  const termes = Array.from({ length: visibles }, (_, i) => (inici + i) ** exponent)
  return {
    tipo: 'potencia-serie',
    enunciado: `${termes.join(', ')}, __`,
    respuesta: (inici + visibles) ** exponent,
    puntos: PUNTOS_CALCUL,
  }
}

// ---- Comparar potencias ---------------------------------------------------

// Parejas distintas que dan el mismo valor (2⁴ = 4², 2⁶ = 4³ = 8²...).
const IGUALES = [
  [[2, 4], [4, 2]],
  [[2, 6], [4, 3]],
  [[2, 6], [8, 2]],
  [[4, 3], [8, 2]],
  [[3, 4], [9, 2]],
  [[2, 8], [4, 4]],
  [[2, 2], [4, 1]],
]

export function generarPotenciaComparar() {
  let a
  let b
  if (Math.random() < 0.2) {
    ;[a, b] = elegir(IGUALES)
    if (Math.random() < 0.5) [a, b] = [b, a]
  } else {
    do {
      a = [randomInt(2, 9), randomInt(2, 5)]
      b = [randomInt(2, 9), randomInt(2, 5)]
    } while (a[0] ** a[1] === b[0] ** b[1])
  }
  const x = a[0] ** a[1]
  const y = b[0] ** b[1]
  return {
    tipo: 'potencia-comparar',
    enunciado: `Compara: ${potencia(...a)} i ${potencia(...b)}`,
    respuesta: x < y ? '<' : x > y ? '>' : '=',
    opciones: ['<', '=', '>'],
    puntos: PUNTOS_ELEGIR,
  }
}

// ---- Descomponer un número en potencias de 10 ----------------------------

export function generarPotenciaDescomposicio() {
  const exponents = mezclar([1, 2, 3, 4]).slice(0, randomInt(2, 3)).sort((p, q) => q - p)
  const termes = exponents.map((e) => ({ xifra: randomInt(1, 9), e }))
  const unitats = randomInt(0, 9)
  const parts = termes.map((t) => `${t.xifra} × ${potencia(10, t.e)}`)
  if (unitats > 0) parts.push(String(unitats))
  return {
    tipo: 'potencia-descomposicio',
    enunciado: parts.join(' + '),
    respuesta: termes.reduce((suma, t) => suma + t.xifra * 10 ** t.e, unitats),
    puntos: PUNTOS_CALCUL,
  }
}
