import { randomInt } from './common.js'
import { ambXifres } from './multiplicaciones.js'

const RANGOS = {
  facil: { min: 1, max: 10 },
  medio: { min: 1, max: 12 },
  dificil: { min: 1, max: 20 },
}

// params (opcional, desde el modo): { xifresDivisor, xifresQuocient } (si
// falta uno, se usa 1 cifra). Siempre exacta.
function divisorICociente(nivel, params) {
  if (params.xifresDivisor || params.xifresQuocient) {
    return [ambXifres(params.xifresDivisor ?? 1), ambXifres(params.xifresQuocient ?? 1)]
  }
  const { min, max } = RANGOS[nivel]
  return [randomInt(2, max), randomInt(min, max)]
}

export function generarDivision(nivel = 'facil', params = {}) {
  const [divisor, cociente] = divisorICociente(nivel, params)
  const dividendo = divisor * cociente // siempre exacta, sin resto
  return {
    tipo: 'division',
    enunciado: `${dividendo} ÷ ${divisor}`,
    respuesta: cociente,
    puntos: 15,
  }
}
