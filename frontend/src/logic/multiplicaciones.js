import { randomInt } from './common.js'

const RANGOS = {
  facil: { min: 1, max: 10 }, // tablas de multiplicar
  medio: { min: 1, max: 20 },
  dificil: { min: 10, max: 99 }, // 2 cifras x 1 cifra
}

// Número con exactamente "xifres" cifras (las de una cifra, de 2 a 9: ×1 y ×0
// no tienen gracia).
export function ambXifres(xifres) {
  return xifres === 1 ? randomInt(2, 9) : randomInt(10 ** (xifres - 1), 10 ** xifres - 1)
}

// params (opcional, desde el modo): { taules: [2, 5, 10] } (una de esas tablas
// × 1..10) o { xifresA, xifresB } (cifras de cada factor; si falta uno, 1).
function factores(nivel, params) {
  if (params.taules) {
    const taula = params.taules[randomInt(0, params.taules.length - 1)]
    const altre = randomInt(1, 10)
    return Math.random() < 0.5 ? [taula, altre] : [altre, taula]
  }
  if (params.xifresA || params.xifresB) return [ambXifres(params.xifresA ?? 1), ambXifres(params.xifresB ?? 1)]
  const { min, max } = RANGOS[nivel]
  return [randomInt(min, max), nivel === 'dificil' ? randomInt(2, 9) : randomInt(min, max)]
}

export function generarMultiplicacion(nivel = 'facil', params = {}) {
  const [a, b] = factores(nivel, params)
  return {
    tipo: 'multiplicacion',
    enunciado: `${a} × ${b}`,
    respuesta: a * b,
    puntos: 15,
  }
}
