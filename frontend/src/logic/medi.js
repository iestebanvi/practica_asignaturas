import { randomInt, mezclar } from './common.js'

const PUNTOS_MEDI = 10
const NUM_OPCIONES = 4

// Partes de cada diagrama interactivo (Volcan.jsx / Riu.jsx): id interno ->
// etiqueta en catalán. El diagrama nunca muestra el texto de la etiqueta, solo
// señala el punto con una flecha: adivinar el nombre es la pregunta.
const PARTES = {
  volcan: {
    crater: 'Cràter',
    lava: 'Lava',
    conVolcanic: 'Con volcànic',
    xemeneia: 'Xemeneia volcànica',
    magma: 'Magma',
    cendres: 'Cendres',
  },
  riu: {
    naixement: 'Naixement',
    cursAlt: 'Curs alt',
    cursMitja: 'Curs mitjà',
    meandres: 'Meandres',
    cursBaix: 'Curs baix',
    delta: 'Delta',
    desembocadura: 'Desembocadura',
  },
}

const DIAGRAMAS = Object.keys(PARTES)

// Solo hay 13 partes posibles entre los dos diagramas (volcán + río), frente
// a un banco de 50 preguntas de texto: si saliera con la misma probabilidad
// que una pregunta de texto cualquiera, se notaría mucho más repetitiva. Por
// eso generarMedi() reparte internamente la probabilidad (1 de cada 4) en vez
// de registrarla como una "operación" más con el mismo peso que el texto.
const PROBABILIDAD_IMAGEN = 0.25

// Preguntas sobre un diagrama (volcán o río): se destaca un punto al azar y
// hay que acertar cómo se llama, entre 3 distractores de ese mismo diagrama.
export function generarMediImagen() {
  const diagrama = DIAGRAMAS[randomInt(0, DIAGRAMAS.length - 1)]
  const partes = PARTES[diagrama]
  const ids = Object.keys(partes)
  const parteId = ids[randomInt(0, ids.length - 1)]
  const respuesta = partes[parteId]

  const opciones = new Set([respuesta])
  while (opciones.size < NUM_OPCIONES && opciones.size < ids.length) {
    opciones.add(partes[ids[randomInt(0, ids.length - 1)]])
  }

  return {
    tipo: 'medi-imatge',
    enunciado: 'Quina part assenyala la fletxa?',
    diagrama,
    parteId,
    respuesta,
    opciones: mezclar([...opciones]),
    puntos: PUNTOS_MEDI,
  }
}

// Preguntas de texto del banco curado (backend/src/data/medi-*.json), mismo
// patrón que generarGramatica: las opciones (incluida la correcta) ya vienen
// escritas a mano en el banco. Una de cada cuatro veces, en vez de texto,
// genera una pregunta de imagen (ver PROBABILIDAD_IMAGEN más arriba).
export function generarMedi(bancoMedi) {
  if (Math.random() < PROBABILIDAD_IMAGEN) {
    return generarMediImagen()
  }

  const item = bancoMedi[randomInt(0, bancoMedi.length - 1)]
  return {
    tipo: 'medi-pregunta',
    enunciado: item.enunciado,
    respuesta: item.respuesta,
    opciones: mezclar(item.opciones),
    puntos: PUNTOS_MEDI,
  }
}
