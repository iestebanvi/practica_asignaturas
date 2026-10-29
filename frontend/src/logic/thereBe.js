import { randomInt } from './common.js'

const PUNTOS_THERE_BE = 15

function elegir(lista) {
  return lista[randomInt(0, lista.length - 1)]
}

function cap(texto) {
  return texto[0].toUpperCase() + texto.slice(1)
}

// Vocabulario de la Unit 3 ("At the Castle") y alrededores.
export const NOMBRES = [
  { s: 'castle', p: 'castles' },
  { s: 'village', p: 'villages' },
  { s: 'mountain', p: 'mountains' },
  { s: 'wood', p: 'woods' },
  { s: 'river', p: 'rivers' },
  { s: 'bridge', p: 'bridges' },
  { s: 'waterfall', p: 'waterfalls' },
  { s: 'valley', p: 'valleys' },
  { s: 'field', p: 'fields' },
  { s: 'path', p: 'paths' },
  { s: 'lake', p: 'lakes' },
  { s: 'hill', p: 'hills' },
  { s: 'city', p: 'cities' },
  { s: 'island', p: 'islands' },
  { s: 'cow', p: 'cows' },
  { s: 'house', p: 'houses' },
]

const CANTIDADES = ['two', 'three', 'four', 'lots of']
const MARCAS_PASADO_THERE = ['yesterday', 'last week', 'last year']
const MARCAS_PASADO_PERSONA = ['yesterday', 'last week', 'last night', 'last year', 'on Saturday']

export const SUJETOS = [
  { may: 'I', min: 'I', plural: false, pron: 'I', sinPregunta: true, contraida: "I'm" },
  { may: 'He', min: 'he', plural: false, pron: 'he', contraida: "He's" },
  { may: 'She', min: 'she', plural: false, pron: 'she', contraida: "She's" },
  { may: 'We', min: 'we', plural: true, pron: 'we', contraida: "We're" },
  { may: 'You', min: 'you', plural: true, pron: 'you', sinPregunta: true, contraida: "You're" },
  { may: 'They', min: 'they', plural: true, pron: 'they', contraida: "They're" },
  { may: 'Paul', min: 'Paul', plural: false, pron: 'he' },
  { may: 'Lily', min: 'Lily', plural: false, pron: 'she' },
  { may: 'The robber', min: 'the robber', plural: false, pron: 'he' },
  { may: 'The boys', min: 'the boys', plural: true, pron: 'they' },
  { may: 'The children', min: 'the children', plural: true, pron: 'they' },
  { may: 'Mum and Dad', min: 'Mum and Dad', plural: true, pron: 'they' },
]

export const COMPLEMENTOS = [
  { t: 'very tired' },
  { t: 'happy' },
  { t: 'worried' },
  { t: 'interested' },
  { t: 'in France' },
  { t: 'on the bus' },
  { t: 'in the park' },
  { t: 'at school' },
  { t: 'at home' },
  { t: 'in the pool' },
  { t: 'on the train' },
  { t: 'in the bank' },
]

// Formas del verbo "to be": [afirmativa, negativa].
function verbo(tiempo, plural) {
  if (tiempo === 'presente') return plural ? ['are', "aren't"] : ['is', "isn't"]
  return plural ? ['were', "weren't"] : ['was', "wasn't"]
}

function articulo(nombre) {
  return /^[aeiou]/.test(nombre) ? 'an' : 'a'
}

// ---- There is / There are ------------------------------------------------

function especThere() {
  return { nombre: elegir(NOMBRES), plural: Math.random() < 0.5, cantidad: elegir(CANTIDADES) }
}

function complementoThere(e, tipo, conCantidad = false) {
  if (!e.plural) return `${articulo(e.nombre.s)} ${e.nombre.s}`
  return `${tipo === 'af' || conCantidad ? e.cantidad : 'any'} ${e.nombre.p}`
}

// tipo: 'af' | 'neg' | 'preg'. Devuelve la frase sin signo final.
function there(e, tiempo, tipo, conCantidad = false) {
  const [af, neg] = verbo(tiempo, e.plural)
  const comp = complementoThere(e, tipo, conCantidad)
  if (tipo === 'af') return `There ${af} ${comp}`
  if (tipo === 'neg') return `There ${neg} ${comp}`
  return `${cap(af)} there ${comp}`
}

// En presente, "There is" se muestra a veces contraído ("There's") igual que en la ficha.
function thereEnunciado(e, tiempo, tipo) {
  const frase = there(e, tiempo, tipo)
  if (tiempo === 'presente' && tipo === 'af' && !e.plural && Math.random() < 0.5) {
    return frase.replace('There is', "There's")
  }
  return frase
}

function marcaThere(tiempo) {
  return tiempo === 'presente' ? 'now' : elegir(MARCAS_PASADO_THERE)
}

function tiempoAleatorio() {
  return Math.random() < 0.5 ? 'presente' : 'pasado'
}

const INSTRUCCION_HUECO = { af: 'Completa el hueco (afirmativa):', neg: 'Completa el hueco (negativa):' }

function huecoThere() {
  const e = especThere()
  const tiempo = tiempoAleatorio()
  const tipo = elegir(['af', 'neg'])
  const [af, neg] = verbo(tiempo, e.plural)
  return crear(
    INSTRUCCION_HUECO[tipo],
    `There ___ ${complementoThere(e, tipo)} ${marcaThere(tiempo)}.`,
    tipo === 'af' ? af : neg,
  )
}

function pasadoThere() {
  const e = especThere()
  const tipo = elegir(['af', 'neg'])
  return crear(
    'Escribe la frase en pasado:',
    `${thereEnunciado(e, 'presente', tipo)}.`,
    `${there(e, 'pasado', tipo)}.`,
  )
}

function preguntaThere() {
  const e = especThere()
  const tiempo = tiempoAleatorio()
  const tipo = Math.random() < 0.7 ? 'af' : 'neg'
  const extras = e.plural && tipo === 'af' ? [`${there(e, tiempo, 'preg', true)}?`] : []
  return crear(
    'Escribe la pregunta:',
    `${thereEnunciado(e, tiempo, tipo)}.`,
    `${there(e, tiempo, 'preg')}?`,
    extras,
  )
}

function cortaThere() {
  const e = especThere()
  const tiempo = tiempoAleatorio()
  const si = Math.random() < 0.5
  const [af, neg] = verbo(tiempo, e.plural)
  return crear(
    `Responde con respuesta corta (${si ? 'Sí' : 'No'}):`,
    `${there(e, tiempo, 'preg')}?`,
    si ? `Yes, there ${af}.` : `No, there ${neg}.`,
  )
}

function huecoPreguntaThere() {
  const e = especThere()
  const tiempo = tiempoAleatorio()
  const [af] = verbo(tiempo, e.plural)
  return crear(
    'Completa la pregunta:',
    `___ there ${complementoThere(e, 'preg')}?`,
    cap(af),
  )
}

// ---- was / were con personas ---------------------------------------------

function especPersona(paraPregunta = false) {
  const sujeto = elegir(SUJETOS.filter((s) => !(paraPregunta && s.sinPregunta)))
  return { sujeto, complemento: elegir(COMPLEMENTOS), marca: elegir(MARCAS_PASADO_PERSONA) }
}

function huecoPersona() {
  const { sujeto, complemento, marca } = especPersona()
  const tipo = elegir(['af', 'neg'])
  const [af, neg] = verbo('pasado', sujeto.plural)
  return crear(
    INSTRUCCION_HUECO[tipo],
    `${sujeto.may} ___ ${complemento.t} ${marca}.`,
    tipo === 'af' ? af : neg,
  )
}

function presentePersona(sujeto, tipo, complemento) {
  const [af, neg] = verbo('presente', sujeto.plural)
  const contraer = sujeto.contraida && Math.random() < 0.5
  if (tipo === 'af') {
    if (contraer) return `${sujeto.contraida} ${complemento.t}`
    return `${sujeto.may} ${sujeto.may === 'I' ? 'am' : af} ${complemento.t}`
  }
  if (sujeto.may === 'I') return `I'm not ${complemento.t}`
  return `${sujeto.may} ${neg} ${complemento.t}`
}

function pasadoPersona() {
  const { sujeto, complemento } = especPersona()
  const tipo = elegir(['af', 'neg'])
  const [af, neg] = verbo('pasado', sujeto.plural)
  return crear(
    'Escribe la frase en pasado:',
    `${presentePersona(sujeto, tipo, complemento)}.`,
    `${sujeto.may} ${tipo === 'af' ? af : neg} ${complemento.t}.`,
  )
}

function preguntaPersona() {
  const { sujeto, complemento, marca } = especPersona(true)
  const tipo = Math.random() < 0.7 ? 'af' : 'neg'
  const [af, neg] = verbo('pasado', sujeto.plural)
  return crear(
    'Escribe la pregunta:',
    `${sujeto.may} ${tipo === 'af' ? af : neg} ${complemento.t} ${marca}.`,
    `${cap(af)} ${sujeto.min} ${complemento.t} ${marca}?`,
  )
}

function cortaPersona() {
  const { sujeto, complemento, marca } = especPersona(true)
  const si = Math.random() < 0.5
  const [af, neg] = verbo('pasado', sujeto.plural)
  return crear(
    `Responde con respuesta corta (${si ? 'Sí' : 'No'}):`,
    `${cap(af)} ${sujeto.min} ${complemento.t} ${marca}?`,
    `${si ? 'Yes' : 'No'}, ${sujeto.pron} ${si ? af : neg}.`,
  )
}

function huecoPreguntaPersona() {
  const { sujeto, complemento, marca } = especPersona(true)
  const [af] = verbo('pasado', sujeto.plural)
  if (Math.random() < 0.5) {
    return crear('Completa la pregunta:', `___ ${sujeto.min} ${complemento.t} ${marca}?`, cap(af))
  }
  return crear('Completa la pregunta:', `Where ___ ${sujeto.min} ${marca}?`, af)
}

// ---- Construcción y corrección ------------------------------------------

function crear(instruccion, enunciado, respuesta, extras = []) {
  return {
    tipo: 'there-be',
    instruccion,
    enunciado,
    respuesta,
    aceptadas: [respuesta, ...extras],
    puntos: PUNTOS_THERE_BE,
  }
}

// Más peso a las formas con "there", que es lo que piden las fichas del cole.
const GENERADORES = [
  huecoThere,
  huecoThere,
  pasadoThere,
  pasadoThere,
  preguntaThere,
  cortaThere,
  huecoPreguntaThere,
  huecoPersona,
  huecoPersona,
  pasadoPersona,
  preguntaPersona,
  cortaPersona,
  huecoPreguntaPersona,
]

export function generarThereBe() {
  return elegir(GENERADORES)()
}

const EXPANSIONES = {
  "there's": 'there is',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "i'm": 'i am',
  "he's": 'he is',
  "she's": 'she is',
  "we're": 'we are',
  "you're": 'you are',
  "they're": 'they are',
}

// Ignora mayúsculas, puntuación y espacios de más, y trata las contracciones
// como equivalentes a su forma completa. El apóstrofo SÍ es obligatorio:
// "isnt" no vale, solo "isn't" o "is not".
export function normalizarIngles(texto) {
  return texto
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,?!]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => EXPANSIONES[palabra] ?? palabra)
    .join(' ')
}

export function respuestaThereBeCorrecta(ejercicio, respuestaUsuario) {
  const dada = normalizarIngles(respuestaUsuario)
  return ejercicio.aceptadas.some((aceptada) => normalizarIngles(aceptada) === dada)
}
