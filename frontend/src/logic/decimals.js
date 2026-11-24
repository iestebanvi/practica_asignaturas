import { randomInt, mezclar, formatDecimal, arrodonirPrecisio } from './common.js'

// Decimales (5è–6è). Internamente un decimal es un entero de "unidades
// mínimas" (3,472 con 3 decimales = 3472 milésimas): así las cuentas son
// exactas y no aparecen errores de coma flotante.
//
// params (opcional, desde el modo): { decimals: 1..3, xifresEnteres: 1..3 }.
// Por defecto, hasta milésimas y parte entera de una cifra.

const PUNTOS_CALCUL = 15
const PUNTOS_ELEGIR = 10
const NOMS_POSICIO = { '-1': 'desenes', 0: 'unitats', 1: 'dècimes', 2: 'centèsimes', 3: 'mil·lèsimes' }

const opcions = ({ decimals = 3, xifresEnteres = 1 } = {}) => ({ decimals, xifresEnteres })

// Decimal con exactamente "decimals" decimales (la última cifra no es 0) y
// parte entera de hasta "xifresEnteres" cifras. Devuelve { k, d, valor, text }.
export function decimalAleatori(decimals, xifresEnteres, { enterMin = 0 } = {}) {
  const escala = 10 ** decimals
  const enter = randomInt(enterMin, 10 ** xifresEnteres - 1)
  let part = randomInt(0, escala - 1)
  if (part % 10 === 0) part += randomInt(1, 9) // que la última cifra no sea 0
  if (part >= escala) part = escala - 1
  const k = enter * escala + part
  return { k, d: decimals, valor: k / escala, text: formatDecimal(k / escala, decimals) }
}

// "En 3,472, quina xifra hi ha a les centèsimes?"
export function generarDecimalPosicio(nivel, params) {
  const { decimals, xifresEnteres } = opcions(params)
  const n = decimalAleatori(decimals, xifresEnteres)
  const [enter, part] = n.text.split(',')
  const posicions = Array.from({ length: decimals }, (_, i) => i + 1)
  posicions.push(0)
  if (enter.length >= 2) posicions.push(-1)
  const pos = posicions[randomInt(0, posicions.length - 1)]
  const xifra = pos > 0 ? part[pos - 1] : enter[enter.length - 1 + pos]
  return {
    tipo: 'decimal-posicio',
    enunciado: `En ${n.text}, quina xifra hi ha a les ${NOMS_POSICIO[pos]}?`,
    respuesta: Number(xifra),
    puntos: PUNTOS_ELEGIR,
  }
}

// "3,45 __ 3,5" → < > =. Incluye las trampas típicas: más cifras decimales no
// es más grande (3,45 < 3,5) y los ceros finales no cambian el valor (2,5 = 2,50).
export function generarDecimalComparar(nivel, params) {
  const { decimals, xifresEnteres } = opcions(params)
  const enter = randomInt(0, 10 ** xifresEnteres - 1)
  const tipus = Math.random()
  let a
  let b
  if (tipus < 0.2) {
    // Iguales, uno con un cero al final
    const x = decimalAleatori(Math.max(1, decimals - 1), xifresEnteres)
    a = x.text
    b = formatDecimal(x.valor, x.d + 1)
  } else if (tipus < 0.6 && decimals >= 2) {
    // Trampa: el de más cifras decimales es el más pequeño (3,45 vs 3,5)
    const curt = randomInt(2, 9)
    a = formatDecimal(enter + curt / 10, 1)
    b = formatDecimal(enter + (randomInt(1, curt - 1) * 10 + randomInt(1, 9)) / 100, 2)
  } else {
    const x = decimalAleatori(decimals, xifresEnteres)
    let y = decimalAleatori(randomInt(1, decimals), xifresEnteres)
    while (y.valor === x.valor) y = decimalAleatori(randomInt(1, decimals), xifresEnteres)
    a = x.text
    b = y.text
  }
  if (Math.random() < 0.5) [a, b] = [b, a]
  const va = Number(a.replace(',', '.'))
  const vb = Number(b.replace(',', '.'))
  return {
    tipo: 'decimal-comparar',
    enunciado: `${a}  ☐  ${b}`,
    respuesta: va < vb ? '<' : va > vb ? '>' : '=',
    opciones: ['<', '=', '>'],
    puntos: PUNTOS_ELEGIR,
  }
}

// "Quin és el nombre més petit?" entre 0,7 · 0,65 · 0,072 · 0,71 (trampas de
// longitud: 0,65 parece más grande que 0,7 y 0,072 que 0,7).
export function generarDecimalExtrem(nivel, params) {
  const { xifresEnteres } = opcions(params)
  const e = randomInt(0, 10 ** xifresEnteres - 1)
  const a = randomInt(3, 9) // una cifra decimal: e,a
  const valors = [
    e + a / 10, // 0,7
    e + (randomInt(1, a - 1) * 10 + randomInt(1, 9)) / 100, // 0,65
    e + randomInt(11, 99) / 1000, // 0,072
    e + (a * 10 + randomInt(1, 9)) / 100, // 0,71
  ].map(arrodonirPrecisio)
  const mesGran = Math.random() < 0.5
  const objectiu = mesGran ? Math.max(...valors) : Math.min(...valors)
  return {
    tipo: 'decimal-extrem',
    enunciado: mesGran ? 'Quin és el nombre més gran?' : 'Quin és el nombre més petit?',
    respuesta: formatDecimal(objectiu),
    opciones: mezclar(valors.map((v) => formatDecimal(v))),
    puntos: PUNTOS_ELEGIR,
  }
}

// "Arrodoneix 3,47 a les dècimes" → 3,5 (la mitad, hacia arriba).
export function generarDecimalArrodonir(nivel, params) {
  const { decimals, xifresEnteres } = opcions(params)
  const d = Math.max(1, decimals)
  const objectiu = randomInt(0, d - 1) // 0 = unitats, 1 = dècimes, 2 = centèsimes
  const n = decimalAleatori(d, xifresEnteres)
  const factor = 10 ** (d - objectiu)
  const arrodonit = Math.floor((n.k + factor / 2) / factor) / 10 ** objectiu
  return {
    tipo: 'decimal-arrodonir',
    enunciado: `Arrodoneix ${n.text} a les ${NOMS_POSICIO[objectiu]}`,
    respuesta: arrodonirPrecisio(arrodonit),
    puntos: PUNTOS_CALCUL,
  }
}

// Sumas y restas con distinto número de decimales (12,35 + 4,8): obliga a
// alinear bien la coma.
function dosDecimals(params) {
  const { decimals, xifresEnteres } = opcions(params)
  const a = decimalAleatori(randomInt(1, decimals), xifresEnteres)
  const b = decimalAleatori(randomInt(1, decimals), xifresEnteres)
  return [a, b]
}

export function generarDecimalSuma(nivel, params) {
  const [a, b] = dosDecimals(params)
  return {
    tipo: 'decimal-suma',
    enunciado: `${a.text} + ${b.text}`,
    respuesta: arrodonirPrecisio(a.valor + b.valor),
    puntos: PUNTOS_CALCUL,
  }
}

export function generarDecimalResta(nivel, params) {
  let [a, b] = dosDecimals(params)
  if (b.valor > a.valor) [a, b] = [b, a]
  return {
    tipo: 'decimal-resta',
    enunciado: `${a.text} - ${b.text}`,
    respuesta: arrodonirPrecisio(a.valor - b.valor),
    puntos: PUNTOS_CALCUL,
  }
}

// "3,45 × 100" o "56,2 ÷ 10": mover la coma.
export function generarDecimalPotencia10(nivel, params) {
  const { decimals, xifresEnteres } = opcions(params)
  const n = decimalAleatori(randomInt(1, decimals), xifresEnteres)
  const factor = [10, 100, 1000][randomInt(0, 2)]
  const multiplicar = Math.random() < 0.5
  return {
    tipo: 'decimal-potencia10',
    enunciado: `${n.text} ${multiplicar ? '×' : '÷'} ${factor}`,
    respuesta: arrodonirPrecisio(multiplicar ? n.valor * factor : n.valor / factor),
    puntos: PUNTOS_CALCUL,
  }
}

// "2,35 × 4": decimal por natural de una cifra.
export function generarDecimalPerNatural(nivel, params) {
  const { decimals, xifresEnteres } = opcions(params)
  const n = decimalAleatori(randomInt(1, Math.min(decimals, 2)), xifresEnteres, { enterMin: 1 })
  const natural = randomInt(2, 9)
  return {
    tipo: 'decimal-per-natural',
    enunciado: `${n.text} × ${natural}`,
    respuesta: (n.k * natural) / 10 ** n.d,
    puntos: PUNTOS_CALCUL,
  }
}
