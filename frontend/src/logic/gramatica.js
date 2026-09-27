import { randomInt, mezclar } from './common.js'

const PUNTOS_GRAMATICA = 10

// A diferencia de vocabulario.js, aquí las opciones (incluidas las
// incorrectas) vienen ya escritas a mano en el propio banco, porque en
// gramática las alternativas tienen que ser formas mal usadas a propósito
// (verbo en el tiempo equivocado, etc.), no traducciones de otra palabra.
export function generarGramatica(bancoGramatica) {
  const item = bancoGramatica[randomInt(0, bancoGramatica.length - 1)]
  return {
    tipo: 'gramatica',
    enunciado: item.enunciado,
    respuesta: item.respuesta,
    opciones: mezclar(item.opciones),
    puntos: PUNTOS_GRAMATICA,
  }
}
