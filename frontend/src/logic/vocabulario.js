import { randomInt, mezclar } from './common.js'

// Cada palabra del banco (formato "traduccio") llega como
// { enunciado: palabra en inglés, respuesta: traducción al catalán }.

const NUM_OPCIONES = 4
const PUNTOS_VOCABULARIO = 10
const PUNTOS_VOCABULARIO_ESCRITO = 15

export function generarVocabulario(bancoVocabulario) {
  const palabra = bancoVocabulario[randomInt(0, bancoVocabulario.length - 1)]
  const respuesta = palabra.respuesta

  const opciones = new Set([respuesta])
  while (opciones.size < NUM_OPCIONES && opciones.size < bancoVocabulario.length) {
    const distractor = bancoVocabulario[randomInt(0, bancoVocabulario.length - 1)]
    opciones.add(distractor.respuesta)
  }

  return {
    tipo: 'vocabulario',
    enunciado: palabra.enunciado,
    respuesta,
    opciones: mezclar([...opciones]),
    ingles: palabra.enunciado,
    puntos: PUNTOS_VOCABULARIO,
  }
}

// El modo escrito no usa palabras con "/" (p.ej. "molt/a", "quants/es"):
// son abreviaturas de género/plural pensadas para leerse, no para
// escribirse literalmente, así que no tiene sentido pedir que se tecleen.
function sinBarra(palabra) {
  return !palabra.enunciado.includes('/') && !palabra.respuesta.includes('/')
}

export function generarVocabularioEscrito(bancoVocabulario) {
  const banco = bancoVocabulario.filter(sinBarra)
  const palabra = banco[randomInt(0, banco.length - 1)]
  const haciaIngles = Math.random() < 0.5

  // Si varias palabras inglesas comparten la misma traducción (p.ej. ABOUT y
  // UPON -> "sobre"), al pedir el inglés se aceptan todas (respuestaCoincide
  // admite alternativas separadas por comas).
  const inglesValidos = banco.filter((p) => p.respuesta === palabra.respuesta).map((p) => p.enunciado)

  return {
    tipo: 'vocabulario-escrito',
    enunciado: haciaIngles ? palabra.respuesta : palabra.enunciado,
    respuesta: haciaIngles ? inglesValidos.join(', ') : palabra.respuesta,
    direccion: haciaIngles ? 'ingles' : 'catalan',
    ingles: palabra.enunciado,
    puntos: PUNTOS_VOCABULARIO_ESCRITO,
  }
}
