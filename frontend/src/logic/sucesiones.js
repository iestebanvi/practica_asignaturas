import { randomInt } from './common.js'

const PUNTOS_SUCESION = 15
const TERMINOS_VISIBLES = 4
const PASO_MIN = 2
const PASO_MAX = 15

export function generarSucesion() {
  const paso = randomInt(PASO_MIN, PASO_MAX)
  const ascendente = Math.random() < 0.5
  const diferencia = ascendente ? paso : -paso

  // Si es descendente, el primer término tiene que ser lo bastante grande
  // para que ni los términos visibles ni la respuesta final bajen de 0.
  const minimoPrimero = ascendente ? 1 : paso * TERMINOS_VISIBLES + randomInt(1, 20)
  const primero = randomInt(minimoPrimero, minimoPrimero + 40)

  const terminos = Array.from({ length: TERMINOS_VISIBLES }, (_, i) => primero + i * diferencia)
  const respuesta = primero + TERMINOS_VISIBLES * diferencia

  return {
    tipo: 'sucesion',
    enunciado: `${terminos.join(', ')}, __`,
    respuesta,
    puntos: PUNTOS_SUCESION,
  }
}
