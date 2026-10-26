import { randomInt, mezclar } from './common.js'

const PUNTOS_CALCUL = 15
const PUNTOS_SITUACIO = 10

function elegir(lista) {
  return lista[randomInt(0, lista.length - 1)]
}

// Triángulo (a, b, c) que se dibuja a escala con c como base. Se descartan los
// muy planos o con un ángulo obtuso en la base, que quedarían raros en pantalla.
function triangleValid() {
  for (let intents = 0; intents < 200; intents++) {
    const c = randomInt(4, 12)
    const a = randomInt(3, 12)
    const b = randomInt(3, 12)
    if (a + b <= c || a + c <= b || b + c <= a) continue
    const x = (b * b + c * c - a * a) / (2 * c)
    if (x <= 0.5 || x >= c - 0.5) continue
    if (b * b - x * x < 6.25) continue // altura de al menos 2,5
    return { a, b, c }
  }
  return { a: 5, b: 5, c: 6 }
}

// El lado inclinado (distractor: no se usa para el área) siempre es mayor que
// la altura, como en la ficha del cole.
function costatInclinat(dx, altura) {
  return Math.max(altura + 1, Math.round(Math.hypot(dx, altura)))
}

function rectangleAleatori() {
  const base = randomInt(4, 15)
  return { base, altura: randomInt(2, base - 1) }
}

export function generarPerimetre() {
  const forma = elegir(['quadrat', 'rectangle', 'triangle-costats'])
  let nom
  let medidas
  let respuesta

  if (forma === 'quadrat') {
    nom = 'quadrat'
    medidas = { costat: randomInt(2, 12) }
    respuesta = 4 * medidas.costat
  } else if (forma === 'rectangle') {
    nom = 'rectangle'
    medidas = rectangleAleatori()
    respuesta = 2 * (medidas.base + medidas.altura)
  } else {
    nom = 'triangle'
    medidas = triangleValid()
    respuesta = medidas.a + medidas.b + medidas.c
  }

  return {
    tipo: 'perimetre',
    enunciado: `Perímetre del ${nom} (cm)`,
    figura: { forma, medidas },
    respuesta,
    puntos: PUNTOS_CALCUL,
  }
}

export function generarArea() {
  const forma = elegir(['quadrat', 'rectangle', 'triangle-altura', 'paralelogram'])
  let nom
  let medidas
  let respuesta

  if (forma === 'quadrat') {
    nom = 'quadrat'
    medidas = { costat: randomInt(2, 12) }
    respuesta = medidas.costat * medidas.costat
  } else if (forma === 'rectangle') {
    nom = 'rectangle'
    medidas = rectangleAleatori()
    respuesta = medidas.base * medidas.altura
  } else if (forma === 'triangle-altura') {
    nom = 'triangle'
    // Figuras apaisadas (altura <= 80% de la base) para que las etiquetas
    // quepan dentro del dibujo; base x altura siempre par (área entera).
    const base = randomInt(6, 14)
    const maxAltura = Math.floor(base * 0.8)
    const altura = base % 2 === 0 ? randomInt(3, maxAltura) : 2 * randomInt(2, Math.floor(maxAltura / 2))
    const dx = randomInt(Math.ceil(base * 0.25), Math.floor(base * 0.45))
    medidas = { base, altura, dx, costat: costatInclinat(dx, altura) }
    respuesta = (base * altura) / 2
  } else {
    nom = 'paral·lelogram'
    const base = randomInt(5, 12)
    const altura = randomInt(3, 9)
    const dx = randomInt(2, Math.min(4, base - 1)) // el pie de la altura cae dentro de la base
    medidas = { base, altura, dx, costat: costatInclinat(dx, altura) }
    respuesta = base * altura
  }

  return {
    tipo: 'area',
    enunciado: `Àrea del ${nom} (cm²)`,
    figura: { forma, medidas },
    respuesta,
    puntos: PUNTOS_CALCUL,
  }
}

const PERIMETRE = 'Perímetre'
const AREA = 'Àrea'

export const SITUACIONS = [
  { text: "Volem posar una tanca al voltant d'un jardí.", respuesta: PERIMETRE },
  { text: "Volem posar una cinta al voltant d'una cartolina.", respuesta: PERIMETRE },
  { text: "Volem posar una sanefa al voltant d'una fotografia.", respuesta: PERIMETRE },
  { text: "Volem posar una corda al voltant d'un pati per delimitar-lo.", respuesta: PERIMETRE },
  { text: "Volem posar un marc al voltant d'un quadre.", respuesta: PERIMETRE },
  { text: "Volem donar una volta caminant per la vora d'una plaça.", respuesta: PERIMETRE },
  { text: "Volem posar llums de Nadal al voltant d'una finestra.", respuesta: PERIMETRE },
  { text: 'Volem tancar un hort amb una xarxa.', respuesta: PERIMETRE },
  { text: "Volem cobrir el terra d'una habitació amb rajoles.", respuesta: AREA },
  { text: 'Volem pintar una paret.', respuesta: AREA },
  { text: 'Volem sembrar gespa en un jardí.', respuesta: AREA },
  { text: "Volem posar moqueta a tot el terra d'una sala.", respuesta: AREA },
  { text: "Volem forrar amb paper la tapa d'un llibre.", respuesta: AREA },
  { text: "Volem pintar el terra d'una pista d'esports.", respuesta: AREA },
  { text: 'Volem empaperar una paret.', respuesta: AREA },
  { text: "Volem posar parquet a una habitació.", respuesta: AREA },
]

export function generarPerimetreArea() {
  const situacio = elegir(SITUACIONS)
  return {
    tipo: 'perimetre-area',
    enunciado: situacio.text,
    respuesta: situacio.respuesta,
    opciones: mezclar([PERIMETRE, AREA]),
    puntos: PUNTOS_SITUACIO,
  }
}
