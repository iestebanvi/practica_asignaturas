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

// ---- Números con decimales ----
// Se trabaja con 6 decimales como máximo para evitar los errores de coma
// flotante del ordenador (0,1 + 0,2 = 0,30000000000000004).
const PRECISIO = 1e6

export function arrodonirPrecisio(n) {
  return Math.round(n * PRECISIO) / PRECISIO
}

// Lee lo que escribe el niño: "3,25", "3.25", " 3,50 " → 3.25. Lo que no es un
// número (vacío, "3,2,1", "tres"…) → NaN.
export function parseNumero(texto) {
  const net = String(texto).trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(net)) return NaN
  return Number(net)
}

export function numerosIguals(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && arrodonirPrecisio(a) === arrodonirPrecisio(b)
}

// Un número tal como se escribe en catalán: coma decimal y sin ceros finales
// (3.5 → "3,5"; 4 → "4"). "decimals" obliga a mostrar exactamente esos
// decimales (2.5 con 2 → "2,50").
export function formatDecimal(n, decimals) {
  const text = decimals === undefined ? String(arrodonirPrecisio(n)) : arrodonirPrecisio(n).toFixed(decimals)
  return text.replace('.', ',')
}
