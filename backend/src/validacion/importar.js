import { validarPregunta } from './preguntas.js'

export const MAX_LINEAS = 1000

// Cabecera de cada formato: la escribe la exportación CSV y, si es la primera
// línea de lo que se importa, se ignora.
export const CABECERAS = {
  traduccio: ['anglès', 'català'],
  numerica: ['enunciat', 'resposta'],
  opcio_multiple: ['enunciat', 'correcta', 'incorrecta', 'incorrecta'],
}

// Para comparar enunciados (repetidas) y detectar la cabecera: sin mayúsculas,
// acentos ni espacios de más.
export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Parte una línea en campos. Separador: tabulador si la línea tiene alguno
// (celdas copiadas de una hoja de cálculo) y, si no, ";". Respeta las comillas
// de CSV (Excel las pone cuando un campo contiene ";"): "a;b";c -> [a;b, c].
export function partirLinea(linea) {
  const separador = linea.includes('\t') ? '\t' : ';'
  const campos = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') {
        actual += '"'
        i++
      } else if (c === '"') entreComillas = false
      else actual += c
    } else if (c === '"' && actual.trim() === '') {
      entreComillas = true
      actual = ''
    } else if (c === separador) {
      campos.push(actual.trim())
      actual = ''
    } else actual += c
  }
  campos.push(actual.trim())
  return campos
}

// Campo para un CSV con ";": entre comillas si hace falta. Saltos de línea y
// tabuladores pasan a espacios (un tabulador haría que la línea se leyera
// separada por tabuladores al volver a importarla).
export function campoCsv(valor) {
  const texto = String(valor ?? '').replace(/\r?\n|\t/g, ' ')
  return /[;"]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Convierte los campos de una línea en los datos de una pregunta según el
// formato, o devuelve un error si no tiene la forma esperada.
function datosDeCampos(formato, campos) {
  if (formato === 'traduccio') {
    if (campos.length !== 2) return { error: "Ha de tenir 2 camps: anglès;català." }
    return { datos: { enunciado: campos[0], respuesta: campos[1] } }
  }
  if (formato === 'numerica') {
    if (campos.length < 2) return { error: 'Ha de tenir 2 camps: enunciat;resposta.' }
    // La respuesta es el último campo: un enunciado con ";" no rompe nada.
    return { datos: { enunciado: campos.slice(0, -1).join('; '), respuesta: campos.at(-1) } }
  }
  if (campos.length < 3) return { error: 'Ha de tenir almenys 3 camps: enunciat;correcta;incorrecta.' }
  return { datos: { enunciado: campos[0], opciones: campos.slice(1), respuesta: campos[1] } }
}

function esCabecera(formato, campos) {
  const esperada = CABECERAS[formato].map(normalizar)
  return campos.length >= 2 && normalizar(campos[0]) === esperada[0] && normalizar(campos[1]) === esperada[1]
}

// Interpreta un texto pegado o un fichero. Devuelve una entrada por línea no
// vacía: { numero, texto, estado: 'ok' | 'error' | 'repetida', datos?, errores? }.
// "existentes": enunciados que ya están en el banco (para marcar repetidas,
// igual que las que se repiten dentro del propio texto).
export function interpretarImportacion(formato, texto, existentes = []) {
  const vistos = new Set(existentes.map(normalizar))
  const lineas = String(texto ?? '')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((t, i) => ({ numero: i + 1, texto: t }))
    .filter((l) => l.texto.trim() !== '')

  if (lineas.length && esCabecera(formato, partirLinea(lineas[0].texto))) lineas.shift()

  return lineas.map(({ numero, texto: linea }) => {
    const { datos, error } = datosDeCampos(formato, partirLinea(linea))
    if (error) return { numero, texto: linea, estado: 'error', errores: { general: error } }

    const { valores, errores } = validarPregunta(formato, datos)
    if (errores) return { numero, texto: linea, estado: 'error', datos, errores }

    const clave = normalizar(valores.enunciado)
    if (vistos.has(clave)) return { numero, texto: linea, estado: 'repetida', datos: valores }
    vistos.add(clave)
    return { numero, texto: linea, estado: 'ok', datos: valores }
  })
}
