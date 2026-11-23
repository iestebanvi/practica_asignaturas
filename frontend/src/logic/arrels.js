import { randomInt, mezclar } from './common.js'

// Arrels quadrades (6è). Cuadrados perfectos de 2² a 20², con más peso para
// los de hasta 12², que es por donde se empieza en clase.
const PUNTOS_CALCUL = 15
const PUNTOS_ELEGIR = 10
const MAX_BASE = 20

export function baseAleatoria() {
  return Math.random() < 0.7 ? randomInt(2, 12) : randomInt(13, MAX_BASE)
}

export function esQuadratPerfecte(n) {
  return Number.isInteger(Math.sqrt(n))
}

// √144 = ?
export function generarArrelExacta() {
  const n = baseAleatoria()
  return { tipo: 'arrel-exacta', enunciado: `√${n * n}`, respuesta: n, puntos: PUNTOS_CALCUL }
}

// Relación con la potencia: "Quin nombre elevat al quadrat dona 81?" o
// "Si 13² = 169, quant fa √169?".
export function generarArrelQuadrat() {
  const n = baseAleatoria()
  const enunciado =
    Math.random() < 0.5
      ? `Quin nombre elevat al quadrat dona ${n * n}?`
      : `Si ${n}² = ${n * n}, quant fa √${n * n}?`
  return { tipo: 'arrel-quadrat', enunciado, respuesta: n, puntos: PUNTOS_CALCUL }
}

// Un número que NO es cuadrado perfecto, entre n² y (n+1)².
function noQuadrat(n) {
  return n * n + randomInt(1, 2 * n)
}

// "50 és un quadrat perfecte?" → Sí / No (la mitad de las veces lo es).
export function generarQuadratPerfecte() {
  const n = baseAleatoria()
  const perfecte = Math.random() < 0.5
  const numero = perfecte ? n * n : noQuadrat(n)
  return {
    tipo: 'quadrat-perfecte',
    enunciado: `${numero} és un quadrat perfecte?`,
    respuesta: perfecte ? 'Sí' : 'No',
    opciones: ['Sí', 'No'],
    puntos: PUNTOS_ELEGIR,
  }
}

const parella = (a) => `${a} i ${a + 1}`

// Raíz entera: "Entre quins dos nombres està √50?" → "7 i 8". Entre los
// distractores, el error típico de dividir entre 2 (√50 → "25 i 26").
export function generarArrelEntera() {
  const n = randomInt(2, 12)
  const numero = noQuadrat(n)
  const correcta = parella(n)
  const candidatos = [n - 1, n + 1, n + 2, Math.floor(numero / 2)]
    .filter((a) => a >= 1 && a !== n)
    .map(parella)
  const opciones = new Set([correcta])
  for (const c of mezclar(candidatos)) if (opciones.size < 4) opciones.add(c)
  return {
    tipo: 'arrel-entera',
    enunciado: `Entre quins dos nombres està √${numero}?`,
    respuesta: correcta,
    opciones: mezclar([...opciones]),
    puntos: PUNTOS_ELEGIR,
  }
}

// Cuadrícula dibujada de n × n: "Té 36 quadrets. Quants en té cada costat?"
export function generarArrelImatge() {
  const n = randomInt(2, 8)
  return {
    tipo: 'arrel-imatge',
    enunciado: `Aquesta quadrícula quadrada té ${n * n} quadrets. Quants quadrets té cada costat?`,
    figura: { forma: 'quadricula', medidas: { n } },
    respuesta: n,
    puntos: PUNTOS_CALCUL,
  }
}
