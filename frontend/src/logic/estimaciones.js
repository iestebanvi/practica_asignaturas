import { randomInt } from './common.js'

const RANGO = { min: 10, max: 99 }
const OPERADORES = ['+', '-']
const PUNTOS_ESTIMACION = 15
const UNITATS = { 10: 'les desenes', 100: 'les centenes', 1000: 'els milers' }

function arrodonir(n, unitat) {
  return Math.round(n / unitat) * unitat
}

// params (opcional, desde el modo): { arrodonir: 10 | 100 | 1000, xifres }.
// Por defecto, números de 2 cifras redondeados a las decenas.
export function generarEstimacion(nivel, params = {}) {
  const unitat = params.arrodonir ?? 10
  const rango = params.xifres ? { min: 10 ** (params.xifres - 1), max: 10 ** params.xifres - 1 } : RANGO
  const operador = OPERADORES[randomInt(0, OPERADORES.length - 1)]
  const a = randomInt(rango.min, rango.max)
  // En la resta, b <= a: redondear es monótono, así que la estimación tampoco
  // baja de 0.
  const b = operador === '-' ? randomInt(rango.min, a) : randomInt(rango.min, rango.max)

  const aRedondeado = arrodonir(a, unitat)
  const bRedondeado = arrodonir(b, unitat)
  const respuesta = operador === '+' ? aRedondeado + bRedondeado : aRedondeado - bRedondeado

  return {
    tipo: 'estimacion',
    enunciado: `Arrodoneix a ${UNITATS[unitat]} i estima: ${a} ${operador} ${b}`,
    respuesta,
    puntos: PUNTOS_ESTIMACION,
  }
}
