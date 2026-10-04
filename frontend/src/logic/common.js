export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function mezclar(array) {
  const copia = [...array]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// Normaliza texto para comparar respuestas escritas a mano: minúsculas, sin
// acentos, sin marcadores gramaticales típicos de este proyecto ("(TO)")
// ni puntuación final.
export function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(to\)/g, '')
    .replace(/[?!.…]/g, '')
    .trim()
}

// Para respuestas con varias alternativas válidas separadas por comas
// (p.ej. "trucar, cridar algú"), acepta cualquiera de ellas.
export function respuestaCoincide(correcta, dada) {
  const candidatas = correcta.split(',').map((c) => normalizarTexto(c))
  return candidatas.includes(normalizarTexto(dada))
}
