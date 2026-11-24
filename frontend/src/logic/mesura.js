import { randomInt, formatDecimal, arrodonirPrecisio } from './common.js'

// Medida (6è): conversiones de longitud, masa, capacidad, superficie y
// volumen, tiempo (sexagesimal), comparar cantidades y escalas.
//
// Una cantidad es { k, d } = k / 10^d (entera, para que las cuentas sean
// exactas) y cada unidad lleva su potencia de 10 respecto a la unidad base
// (km = 3, cm = -2; km² = 6). Convertir es mover la coma "exp" posiciones.
//
// params (opcional, desde el modo): { decimals: 0..2, salts: 1..3 }.
//   decimals = cifras decimales de los datos (0 = solo enteros).
//   salts = cuántos peldaños de la escalera de unidades se saltan como mucho
//   (de m a cm, 2). Por defecto 2 decimales y 3 saltos.

const PUNTOS = 15
const PUNTOS_COMPARAR = 10
const PUNTOS_PROBLEMA = 20

const u = (nom, exp) => ({ nom, exp })
export const UNITATS = {
  longitud: [u('km', 3), u('hm', 2), u('dam', 1), u('m', 0), u('dm', -1), u('cm', -2), u('mm', -3)],
  massa: [u('t', 6), u('kg', 3), u('hg', 2), u('dag', 1), u('g', 0), u('dg', -1), u('cg', -2), u('mg', -3)],
  capacitat: [u('kl', 3), u('hl', 2), u('dal', 1), u('l', 0), u('dl', -1), u('cl', -2), u('ml', -3)],
  superficie: [u('km²', 6), u('hm²', 4), u('dam²', 2), u('m²', 0), u('dm²', -2), u('cm²', -4), u('mm²', -6)],
  volum: [u('m³', 9), u('dm³', 6), u('cm³', 3), u('mm³', 0)],
}
// Volumen ↔ capacidad (en litros): 1 dm³ = 1 l, 1 cm³ = 1 ml, 1 m³ = 1.000 l.
const VOLUM_EN_LITRES = [u('m³', 3), u('dm³', 0), u('cm³', -3)]
const CAPACITAT_CURTA = [u('hl', 2), u('l', 0), u('dl', -1), u('cl', -2), u('ml', -3)]

const MAX_EXP = 6 // no más de un millón de veces (km → mm, km² → m²…)

const opcions = ({ decimals = 2, salts = 3 } = {}) => ({ decimals, salts })
const triar = (llista) => llista[randomInt(0, llista.length - 1)]

// Texto de k / 10^d en catalán: coma decimal y sin punto de miles (2500;
// 12345,6), como se escribe en clase.
export function formatQuantitat(k, d) {
  return formatDecimal(k / 10 ** d)
}

const valor = ({ k, d }) => arrodonirPrecisio(k / 10 ** d)

// k / 10^d multiplicado por 10^e (e puede ser negativo), simplificado.
function perPotencia({ k, d }, e) {
  let nd = d - e
  let nk = k
  if (nd < 0) {
    nk = k * 10 ** -nd
    nd = 0
  }
  while (nd > 0 && nk % 10 === 0) {
    nk /= 10
    nd--
  }
  return { k: nk, d: nd }
}

// Cantidad al azar en la unidad grande: con "d" decimales (la última no es 0).
// Cuantos más ceros se añaden al convertir, más pequeña es la parte entera.
function quantitatGran(decimalsMax, exp) {
  const d = randomInt(0, decimalsMax)
  const maxEnter = exp <= 2 ? 99 : exp <= 3 ? 30 : 9
  const enter = randomInt(d > 0 ? 0 : 1, maxEnter)
  if (d === 0) return { k: enter, d: 0 }
  let part = randomInt(0, 10 ** d - 1)
  if (part % 10 === 0) part += randomInt(1, 9)
  return { k: enter * 10 ** d + Math.min(part, 10 ** d - 1), d }
}

// "a = ? b". La cantidad se elige en la unidad más grande, así el resultado
// en las dos direcciones tiene como mucho "decimals" decimales.
export function conversio(a, b, decimalsMax) {
  const exp = Math.abs(a.exp - b.exp)
  const gran = quantitatGran(decimalsMax, exp)
  const petita = perPotencia(gran, exp)
  const [dada, resultat] = a.exp >= b.exp ? [gran, petita] : [petita, gran]
  return { enunciado: `${formatQuantitat(dada.k, dada.d)} ${a.nom} = ? ${b.nom}`, respuesta: valor(resultat), dada, resultat }
}

// Dos unidades de la escalera separadas por 1..salts peldaños (sin pasar de
// un millón de veces).
function duesUnitats(escala, salts) {
  for (;;) {
    const i = randomInt(0, escala.length - 1)
    const j = i + triar([-1, 1]) * randomInt(1, salts)
    if (j < 0 || j >= escala.length) continue
    if (Math.abs(escala[i].exp - escala[j].exp) > MAX_EXP) continue
    return [escala[i], escala[j]]
  }
}

function generarConversio(tipo, magnitud, params) {
  const { decimals, salts } = opcions(params)
  const [a, b] = duesUnitats(UNITATS[magnitud], salts)
  const { enunciado, respuesta } = conversio(a, b, decimals)
  return { tipo, enunciado, respuesta, puntos: PUNTOS }
}

export function generarMesuraLongitud(nivel, params) {
  return generarConversio('mesura-longitud', 'longitud', params)
}

export function generarMesuraMassa(nivel, params) {
  return generarConversio('mesura-massa', 'massa', params)
}

export function generarMesuraCapacitat(nivel, params) {
  return generarConversio('mesura-capacitat', 'capacitat', params)
}

// Superficie: cada peldaño es ×100. La hectárea (= hm²) se escribe "ha" la
// mitad de las veces.
export function generarMesuraSuperficie(nivel, params) {
  const ex = generarConversio('mesura-superficie', 'superficie', params)
  if (Math.random() < 0.5) ex.enunciado = ex.enunciado.replace('hm²', 'ha')
  return ex
}

// Volumen: cada peldaño es ×1.000 (como mucho 2 peldaños). Un 40 % de las
// veces, entre volumen y capacidad (2 dm³ = ? l; 1,5 l = ? cm³).
export function generarMesuraVolum(nivel, params) {
  const { decimals, salts } = opcions(params)
  if (Math.random() < 0.4) {
    let a
    let b
    do {
      a = triar(VOLUM_EN_LITRES)
      b = triar(CAPACITAT_CURTA)
    } while (Math.abs(a.exp - b.exp) > 3)
    if (Math.random() < 0.5) [a, b] = [b, a]
    const { enunciado, respuesta } = conversio(a, b, decimals)
    return { tipo: 'mesura-volum', enunciado, respuesta, puntos: PUNTOS }
  }
  const [a, b] = duesUnitats(UNITATS.volum, Math.min(salts, 2))
  const { enunciado, respuesta } = conversio(a, b, decimals)
  return { tipo: 'mesura-volum', enunciado, respuesta, puntos: PUNTOS }
}

// Tiempo (sexagesimal). Con decimales, también horas "1,5 h" o "0,25 h".
export function generarMesuraTemps(nivel, params) {
  const { decimals } = opcions(params)
  const variants = ['h-min-a-min', 'min-a-h-min', 'h-a-min', 'min-a-s', 'min-s-a-s', 'dies-a-h']
  if (decimals > 0) variants.push('h-decimal')
  const variant = triar(variants)
  const ex = (enunciado, respuesta) => ({ tipo: 'mesura-temps', enunciado, respuesta, puntos: PUNTOS })
  if (variant === 'h-min-a-min') {
    const h = randomInt(1, 5)
    const m = randomInt(1, 11) * 5
    return ex(`${h} h ${m} min = ? min`, h * 60 + m)
  }
  if (variant === 'min-a-h-min') {
    const h = randomInt(1, 5)
    const m = randomInt(1, 11) * 5
    return ex(`${h * 60 + m} min = ${h} h i ? min`, m)
  }
  if (variant === 'h-a-min') {
    const h = randomInt(2, 10)
    return Math.random() < 0.5 ? ex(`${h} h = ? min`, h * 60) : ex(`${h * 60} min = ? h`, h)
  }
  if (variant === 'min-a-s') {
    const m = randomInt(2, 10)
    return Math.random() < 0.5 ? ex(`${m} min = ? s`, m * 60) : ex(`${m * 60} s = ? min`, m)
  }
  if (variant === 'min-s-a-s') {
    const m = randomInt(1, 5)
    const s = randomInt(1, 11) * 5
    return ex(`${m} min ${s} s = ? s`, m * 60 + s)
  }
  if (variant === 'dies-a-h') {
    const dies = randomInt(2, 7)
    return Math.random() < 0.5 ? ex(`${dies} dies = ? h`, dies * 24) : ex(`${dies * 24} h = ? dies`, dies)
  }
  // 1,5 h = 90 min · 0,25 h = 15 min · 2,75 h = 165 min
  const quarts = triar([1, 2, 3, 5, 6, 7, 9, 10, 11])
  return ex(`${formatDecimal(quarts / 4)} h = ? min`, quarts * 15)
}

// "1,5 kg ☐ 1400 g" → < = >. La segunda cantidad es la primera convertida
// (iguales) o la de una cantidad muy cercana: hay que convertir para saberlo.
const MAGNITUDS_COMPARAR = ['longitud', 'massa', 'capacitat']

export function generarMesuraComparar(nivel, params) {
  const { decimals, salts } = opcions(params)
  let [a, b] = duesUnitats(UNITATS[triar(MAGNITUDS_COMPARAR)], salts)
  if (a.exp < b.exp) [a, b] = [b, a] // a, la unidad grande
  const gran = quantitatGran(decimals, a.exp - b.exp)
  let altra = gran
  if (Math.random() >= 0.25) {
    // Una cantidad cercana: se cambia la última cifra (en la unidad grande,
    // para no añadir decimales)
    for (;;) {
      const k = gran.k + triar([-3, -2, -1, 1, 2, 3])
      if (k > 0) {
        altra = { k, d: gran.d }
        break
      }
    }
  }
  const enB = perPotencia(altra, a.exp - b.exp)
  let esquerra = `${formatQuantitat(gran.k, gran.d)} ${a.nom}`
  let dreta = `${formatQuantitat(enB.k, enB.d)} ${b.nom}`
  let dif = gran.k - altra.k // las dos en la unidad a, con los mismos decimales
  if (Math.random() < 0.5) {
    ;[esquerra, dreta] = [dreta, esquerra]
    dif = -dif
  }
  return {
    tipo: 'mesura-comparar',
    enunciado: `${esquerra}  ☐  ${dreta}`,
    respuesta: dif < 0 ? '<' : dif > 0 ? '>' : '=',
    opciones: ['<', '=', '>'],
    puntos: PUNTOS_COMPARAR,
  }
}

// Escalas de mapas (resultado en km) y de planos (en m).
const ESCALES_MAPA = [10000, 25000, 50000, 100000, 200000, 500000, 1000000]
const ESCALES_PLANOL = [50, 100, 200, 500]

export function generarMesuraEscala() {
  const variant = randomInt(0, 3)
  const cm = randomInt(2, 12)
  const ex = (enunciado, respuesta) => ({ tipo: 'mesura-escala', enunciado, respuesta, puntos: PUNTOS_PROBLEMA })
  if (variant === 0) {
    const e = triar(ESCALES_MAPA)
    return ex(
      `Un mapa té escala 1:${e}. Dos pobles estan a ${cm} cm en el mapa. Quants quilòmetres hi ha en realitat?`,
      arrodonirPrecisio((cm * e) / 100000),
    )
  }
  if (variant === 1) {
    const e = triar(ESCALES_PLANOL)
    return ex(
      `En un plànol a escala 1:${e}, una paret fa ${cm} cm. Quants metres fa en realitat?`,
      arrodonirPrecisio((cm * e) / 100),
    )
  }
  if (variant === 2) {
    const e = triar(ESCALES_PLANOL)
    const metres = formatDecimal((cm * e) / 100)
    return ex(`Una habitació fa ${metres} m de llarg. Quants centímetres farà en un plànol a escala 1:${e}?`, cm)
  }
  const e = triar(ESCALES_MAPA)
  const km = formatDecimal((cm * e) / 100000)
  return ex(`En un mapa, ${cm} cm són ${km} km en realitat. Quina és l’escala? Escriu el nombre que va després de «1:».`, e)
}
