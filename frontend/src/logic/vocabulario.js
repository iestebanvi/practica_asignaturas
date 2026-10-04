import { randomInt, mezclar } from './common.js'

const NUM_OPCIONES = 4
const PUNTOS_VOCABULARIO = 10
const PUNTOS_VOCABULARIO_ESCRITO = 15

export function generarVocabulario(bancoVocabulario) {
  const palabra = bancoVocabulario[randomInt(0, bancoVocabulario.length - 1)]
  const respuesta = palabra.catalan

  const opciones = new Set([respuesta])
  while (opciones.size < NUM_OPCIONES && opciones.size < bancoVocabulario.length) {
    const distractor = bancoVocabulario[randomInt(0, bancoVocabulario.length - 1)]
    opciones.add(distractor.catalan)
  }

  return {
    tipo: 'vocabulario',
    enunciado: palabra.ingles,
    respuesta,
    opciones: mezclar([...opciones]),
    ingles: palabra.ingles,
    puntos: PUNTOS_VOCABULARIO,
  }
}

// El modo escrito no usa palabras con "/" (p.ej. "molt/a", "quants/es"):
// son abreviaturas de género/plural pensadas para leerse, no para
// escribirse literalmente, así que no tiene sentido pedir que se tecleen.
function sinBarra(palabra) {
  return !palabra.ingles.includes('/') && !palabra.catalan.includes('/')
}

export function generarVocabularioEscrito(bancoVocabulario) {
  const banco = bancoVocabulario.filter(sinBarra)
  const palabra = banco[randomInt(0, banco.length - 1)]
  const haciaIngles = Math.random() < 0.5

  return {
    tipo: 'vocabulario-escrito',
    enunciado: haciaIngles ? palabra.catalan : palabra.ingles,
    respuesta: haciaIngles ? palabra.ingles : palabra.catalan,
    direccion: haciaIngles ? 'ingles' : 'catalan',
    ingles: palabra.ingles,
    puntos: PUNTOS_VOCABULARIO_ESCRITO,
  }
}
