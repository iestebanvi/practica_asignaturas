import { randomInt } from './common.js'

const RANGOS = {
  medio: { min: 0, max: 20 },
  dificil: { min: 0, max: 100 },
}

const SUMA_MAXIMA_FACIL = 12

export function generarSuma(nivel = 'facil') {
  if (nivel === 'facil') {
    // Para el peque: números pequeños (suma máxima 12) y el número más
    // grande siempre en primera posición, para facilitar contar hacia adelante.
    const total = randomInt(1, SUMA_MAXIMA_FACIL)
    const pequeno = randomInt(0, Math.floor(total / 2))
    const grande = total - pequeno
    return {
      tipo: 'suma',
      enunciado: `${grande} + ${pequeno}`,
      respuesta: total,
      puntos: 10,
    }
  }

  const { min, max } = RANGOS[nivel]
  const a = randomInt(min, max)
  const b = randomInt(min, max)
  return {
    tipo: 'suma',
    enunciado: `${a} + ${b}`,
    respuesta: a + b,
    puntos: 10,
  }
}
