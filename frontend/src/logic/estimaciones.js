import { randomInt } from './common.js'

const RANGO = { min: 10, max: 99 }
const OPERADORES = ['+', '-']
const PUNTOS_ESTIMACION = 15

function redondearDecena(n) {
  return Math.round(n / 10) * 10
}

export function generarEstimacion() {
  const operador = OPERADORES[randomInt(0, OPERADORES.length - 1)]
  const a = randomInt(RANGO.min, RANGO.max)
  // En la resta, b <= a: al redondear a la decena (función monótona) la
  // estimación tampoco baja de 0.
  const b = operador === '-' ? randomInt(RANGO.min, a) : randomInt(RANGO.min, RANGO.max)

  const aRedondeado = redondearDecena(a)
  const bRedondeado = redondearDecena(b)
  const respuesta = operador === '+' ? aRedondeado + bRedondeado : aRedondeado - bRedondeado

  return {
    tipo: 'estimacion',
    enunciado: `Redondea a la decena y estima: ${a} ${operador} ${b}`,
    respuesta,
    puntos: PUNTOS_ESTIMACION,
  }
}
