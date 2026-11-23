import { randomInt } from './common.js'

const RANGOS = {
  facil: { min: 0, max: 10 },
  medio: { min: 0, max: 20 },
  dificil: { min: 0, max: 100 },
}

// params (opcional, desde el modo): { max } → minuendo entre 0 y max.
export function generarResta(nivel = 'facil', params = {}) {
  const { min, max } = params.max ? { min: 0, max: params.max } : RANGOS[nivel]
  const a = randomInt(min, max)
  const b = randomInt(min, a) // b <= a: nunca da negativo
  return {
    tipo: 'resta',
    enunciado: `${a} - ${b}`,
    respuesta: a - b,
    puntos: 10,
  }
}
