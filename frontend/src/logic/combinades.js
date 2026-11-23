import { randomInt } from './common.js'

// Operaciones combinadas (6è): sumas, restas, multiplicaciones y divisiones
// sencillas, con y sin paréntesis. Se generan desde plantillas ("(a + b) × c")
// rellenando las letras con números hasta que:
//   - todas las divisiones son exactas y ningún resultado parcial es negativo;
//   - hay "trampa": calcular de izquierda a derecha (sin paréntesis: sin
//     respetar la prioridad) o quitando los paréntesis da otro resultado.
//
// params (opcional, desde el modo): { operacions: 2 | 3, max: 10..100 }.
// Por defecto, 2 o 3 operaciones al azar y sumandos hasta 20; los factores y
// divisores van del 2 al 10.

const PLANTILLES = {
  sense: {
    2: ['a + b × c', 'a - b × c', 'a × b + c', 'a × b - c', 'a + b ÷ c', 'a - b ÷ c', 'a ÷ b + c', 'a ÷ b - c'],
    3: ['a + b × c - d', 'a × b + c × d', 'a × b - c × d', 'a - b × c + d', 'a × b - c ÷ d', 'a ÷ b + c × d', 'a + b ÷ c - d'],
  },
  parentesi: {
    2: ['(a + b) × c', '(a - b) × c', 'a × (b + c)', 'a × (b - c)', '(a + b) ÷ c', '(a - b) ÷ c', 'a - (b + c)', 'a - (b - c)'],
    3: ['a + (b - c) × d', '(a + b) × (c - d)', '(a + b) ÷ c + d', 'a × (b + c) - d', 'a - (b + c) ÷ d', '(a - b) × c + d', 'a × (b - c) + d'],
  },
}

const PUNTS = { 2: 15, 3: 20 }
const INTENTS = 500

// ---- Árbol de una expresión: { op, esq, dre } o { num } / { lletra } ----

// Lee una expresión con + - × ÷ y paréntesis respetando la prioridad. Las
// hojas son números o letras (plantillas).
export function llegir(text) {
  const fitxes = text.match(/\d+|[a-z]|[-+×÷()]/g)
  let i = 0
  const terme = () => {
    let node = factor()
    while (fitxes[i] === '×' || fitxes[i] === '÷') node = { op: fitxes[i++], esq: node, dre: factor() }
    return node
  }
  const expressio = () => {
    let node = terme()
    while (fitxes[i] === '+' || fitxes[i] === '-') node = { op: fitxes[i++], esq: node, dre: terme() }
    return node
  }
  function factor() {
    const f = fitxes[i++]
    if (f === '(') {
      const node = expressio()
      i++ // ')'
      return node
    }
    return /\d/.test(f) ? { num: Number(f) } : { lletra: f }
  }
  return expressio()
}

// Valor de un árbol con los números de "valors" (por letra). null si en algún
// paso hay un negativo, una división no exacta o un divisor menor que 2.
export function avaluar(node, valors = {}) {
  if ('num' in node) return node.num
  if ('lletra' in node) return valors[node.lletra]
  const a = avaluar(node.esq, valors)
  const b = avaluar(node.dre, valors)
  if (a === null || b === null) return null
  if (node.op === '+') return a + b
  if (node.op === '-') return a - b >= 0 ? a - b : null
  if (node.op === '×') return a * b
  return b >= 2 && a % b === 0 ? a / b : null
}

// Lo que sale haciendo las operaciones de izquierda a derecha sin prioridad
// ni paréntesis (el error típico).
function esquerraADreta(text) {
  const fitxes = text.replace(/[()]/g, '').split(' ')
  let r = Number(fitxes[0])
  for (let i = 1; i < fitxes.length; i += 2) {
    const n = Number(fitxes[i + 1])
    r = { '+': r + n, '-': r - n, '×': r * n, '÷': r / n }[fitxes[i]]
  }
  return r
}

// Números para cada letra según dónde está: factores y divisores del 2 al
// 10; un dividendo que es un número se hace múltiplo del divisor; los
// sumandos, hasta "max" (hasta 10 si están dentro de un producto).
function omplir(node, max, valors, dinsProducte = false) {
  if ('lletra' in node) {
    valors[node.lletra] = dinsProducte ? randomInt(2, 10) : randomInt(1, max)
    return
  }
  if (node.op === '×' || node.op === '÷') {
    omplir(node.dre, max, valors, true)
    if (node.op === '÷' && 'lletra' in node.esq && 'lletra' in node.dre) {
      valors[node.esq.lletra] = valors[node.dre.lletra] * randomInt(2, 10)
    } else {
      omplir(node.esq, max, valors, true)
    }
    return
  }
  // Dentro de un producto, los sumandos son pequeños (1 a 10)
  omplir(node.esq, dinsProducte ? 10 : max, valors, false)
  omplir(node.dre, dinsProducte ? 10 : max, valors, false)
}

// ¿Algún factor o divisor vale 1? ("(3 - 2) × 2": multiplicar por 1 no enseña nada)
function perUn(node, valors) {
  if (!('op' in node)) return false
  if ((node.op === '×' || node.op === '÷') && (avaluar(node.esq, valors) === 1 || avaluar(node.dre, valors) === 1)) return true
  return perUn(node.esq, valors) || perUn(node.dre, valors)
}

const substituir = (plantilla, valors) => plantilla.replace(/[a-z]/g, (l) => valors[l])

function generar(tipo, ambParentesis, nivel, params = {}) {
  const max = params.max ?? 20
  const operacions = params.operacions ?? randomInt(2, 3)
  const plantilles = PLANTILLES[ambParentesis ? 'parentesi' : 'sense'][operacions]
  let millor = null
  for (let intent = 0; intent < INTENTS; intent++) {
    const plantilla = plantilles[randomInt(0, plantilles.length - 1)]
    const arbre = llegir(plantilla)
    const valors = {}
    omplir(arbre, max, valors)
    const resultat = avaluar(arbre, valors)
    if (!resultat || resultat > 10 * max || perUn(arbre, valors)) continue // ni imposible, ni 0, ni enorme, ni × 1
    const enunciado = substituir(plantilla, valors)
    const candidat = { tipo, enunciado, respuesta: resultat, puntos: PUNTS[operacions] }
    // La trampa: sin paréntesis, de izquierda a derecha; con paréntesis,
    // quitándolos (y respetando la prioridad).
    const erroni = ambParentesis ? avaluar(llegir(enunciado.replace(/[()]/g, ''))) : esquerraADreta(enunciado)
    if (erroni !== resultat) return candidat
    millor ??= candidat
  }
  return millor
}

export function generarCombinada(nivel, params) {
  return generar('combinada', false, nivel, params)
}

export function generarCombinadaParentesi(nivel, params) {
  return generar('combinada-parentesi', true, nivel, params)
}
