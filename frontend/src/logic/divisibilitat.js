import { randomInt, mezclar } from './common.js'

// Divisibilidad (6è): múltiplos, divisores, criterios de divisibilidad y
// números primos.
//
// params (opcional, desde el modo): { max: 20..1000 } = número más grande que
// sale (por defecto 100). Los criterios usan siempre números de 3 cifras.

const PUNTOS = 10
const SI = 'Sí'
const NO = 'No'

const maxDe = (params) => params?.max ?? 100
const triar = (llista) => llista[randomInt(0, llista.length - 1)]

export function esPrimer(n) {
  if (n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

export function divisors(n) {
  return Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0)
}

// Compuestos "con trampa": impares, no acaban en 5 (21, 27, 51, 91…).
const compostosEnganyosos = (max) =>
  Array.from({ length: max - 9 }, (_, i) => i + 10).filter((n) => n % 2 && n % 5 && !esPrimer(n))
const primers = (max) => Array.from({ length: max - 1 }, (_, i) => i + 2).filter(esPrimer)

// "És 48 múltiple de 6?" → Sí / No (los "no" se quedan cerca de un múltiplo)
export function generarDivMultiple(nivel, params) {
  const max = maxDe(params)
  const d = randomInt(2, Math.min(12, Math.floor(max / 2)))
  let n = d * randomInt(2, Math.max(2, Math.floor(max / d)))
  const si = Math.random() < 0.5
  if (!si) n += randomInt(1, d - 1) * (n + d <= max && Math.random() < 0.5 ? 1 : -1)
  return {
    tipo: 'div-multiple',
    enunciado: `És ${n} múltiple de ${d}?`,
    respuesta: n % d === 0 ? SI : NO,
    opciones: [SI, NO],
    puntos: PUNTOS,
  }
}

// "Quin és el múltiple de 7 que va després de 42?" → 49
export function generarDivSeguentMultiple(nivel, params) {
  const max = maxDe(params)
  const d = randomInt(3, Math.min(12, Math.floor(max / 3)))
  const k = randomInt(2, Math.max(2, Math.floor(max / d) - 1))
  return {
    tipo: 'div-seguent-multiple',
    enunciado: `Quin és el múltiple de ${d} que va després de ${d * k}?`,
    respuesta: d * (k + 1),
    puntos: PUNTOS,
  }
}

// "Quin d'aquests NO és divisor de 24?" (3 divisores y 1 que no lo es) o
// "Quin d'aquests és divisor de 36?" (1 divisor y 3 que no). Sin el 1 ni el
// propio número, que son demasiado fáciles.
export function generarDivDivisor(nivel, params) {
  const max = maxDe(params)
  const candidats = Array.from({ length: max - 11 }, (_, i) => i + 12).filter((n) => divisors(n).length >= 5)
  const n = triar(candidats)
  const propis = divisors(n).filter((d) => d > 1 && d < n)
  const totsNoDivisors = Array.from({ length: n - 2 }, (_, i) => i + 2).filter((d) => n % d !== 0)
  // Si hay bastantes, solo hasta la mitad: que no se vean a simple vista (47 de 84)
  const petits = totsNoDivisors.filter((d) => d <= n / 2)
  const noDivisors = petits.length >= 3 ? petits : totsNoDivisors
  const negativa = Math.random() < 0.5
  const [bons, dolents] = negativa
    ? [mezclar(propis).slice(0, 3), mezclar(noDivisors).slice(0, 1)]
    : [mezclar(propis).slice(0, 1), mezclar(noDivisors).slice(0, 3)]
  return {
    tipo: 'div-divisor',
    enunciado: negativa ? `Quin d’aquests NO és divisor de ${n}?` : `Quin d’aquests és divisor de ${n}?`,
    respuesta: String(negativa ? dolents[0] : bons[0]),
    opciones: mezclar([...bons, ...dolents].map(String)),
    puntos: PUNTOS,
  }
}

// Criterios de divisibilidad con números de 3 cifras: "És 135 divisible per 3?"
export function generarDivCriteris() {
  const d = triar([2, 3, 5, 9, 10])
  const si = Math.random() < 0.5
  let n = randomInt(100, 999)
  while ((n % d === 0) !== si) n = randomInt(100, 999)
  return {
    tipo: 'div-criteris',
    enunciado: `És ${n} divisible per ${d}?`,
    respuesta: si ? SI : NO,
    opciones: [SI, NO],
    puntos: PUNTOS,
  }
}

// "És primer el 29?" → Sí / No (los "no" son compuestos con trampa)
export function generarDivPrimer(nivel, params) {
  const max = Math.max(20, maxDe(params))
  const si = Math.random() < 0.5
  const n = si ? triar(primers(max).filter((p) => p > 3)) : triar(compostosEnganyosos(max))
  return {
    tipo: 'div-primer',
    enunciado: `És primer el ${n}?`,
    respuesta: si ? SI : NO,
    opciones: [SI, NO],
    puntos: PUNTOS,
  }
}

// "Quin d'aquests nombres és primer?": 1 primo y 3 compuestos con trampa.
export function generarDivTrobaPrimer(nivel, params) {
  const max = Math.max(30, maxDe(params))
  const primer = triar(primers(max).filter((p) => p > 10))
  const compostos = mezclar(compostosEnganyosos(max)).slice(0, 3)
  return {
    tipo: 'div-troba-primer',
    enunciado: 'Quin d’aquests nombres és primer?',
    respuesta: String(primer),
    opciones: mezclar([primer, ...compostos].map(String)),
    puntos: PUNTOS,
  }
}
