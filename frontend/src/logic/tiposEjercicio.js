import { tiposConocidos, usaBanco } from './ejercicios.js'

// Nombres legibles (en catalán) de cada tipo de ejercicio y de cada formato de
// banco, para la consola del profesorado. tiposEjercicio.test.js comprueba
// que no falte ninguno de los que sabe generar el código.
export const NOMBRES_TIPOS = {
  suma: 'Sumes',
  resta: 'Restes',
  multiplicacion: 'Multiplicacions',
  division: 'Divisions',
  hora: 'Hores (rellotge)',
  sucesion: 'Successions',
  estimacion: 'Estimacions',
  perimetre: 'Perímetre d’una figura',
  area: 'Àrea d’una figura',
  'perimetre-area': 'Perímetre o àrea?',
  'costat-quadrat': 'Costat d’un quadrat',
  'there-be': 'There is / are · was / were',
  'potencia-calcul': 'Potències: càlcul',
  'potencia-combinada': 'Potències: operacions combinades',
  'potencia-expressio': 'Potències: expressió',
  'potencia-base10': 'Potències de base 10',
  'potencia-imatge': 'Potències: imatge',
  'potencia-consecutiva': 'Potències: consecutives',
  'potencia-serie': 'Potències: sèrie',
  'potencia-comparar': 'Potències: comparar',
  'potencia-descomposicio': 'Potències: descomposició',
  problema: 'Problemes (del banc)',
  vocabulario: 'Vocabulari, triar (del banc)',
  'vocabulario-escrito': 'Vocabulari, escriure (del banc)',
  gramatica: 'Gramàtica (del banc)',
  'medi-pregunta': 'Preguntes de Medi (del banc + diagrames)',
}

export const NOMBRES_FORMATOS = {
  numerica: 'Resposta numèrica',
  traduccio: 'Traducció (anglès → català)',
  opcio_multiple: 'Opció múltiple',
}

// Formato de banco que necesita cada tipo que saca las preguntas de un banco
// (el resto se generan solos). Debe coincidir con el catálogo del backend
// (backend/src/catalogo/tiposEjercicio.js): lo comprueba tiposEjercicio.test.js.
export const FORMATO_BANCO_TIPO = {
  problema: 'numerica',
  vocabulario: 'traduccio',
  'vocabulario-escrito': 'traduccio',
  gramatica: 'opcio_multiple',
  'medi-pregunta': 'opcio_multiple',
}

// Agrupación para las casillas del formulario de modo.
export const GRUPOS_TIPOS = [
  { nombre: 'Càlcul', tipos: ['suma', 'resta', 'multiplicacion', 'division', 'sucesion', 'estimacion'] },
  { nombre: 'Rellotge', tipos: ['hora'] },
  { nombre: 'Geometria', tipos: ['perimetre', 'area', 'perimetre-area', 'costat-quadrat'] },
  {
    nombre: 'Potències',
    tipos: [
      'potencia-calcul',
      'potencia-combinada',
      'potencia-expressio',
      'potencia-base10',
      'potencia-imatge',
      'potencia-consecutiva',
      'potencia-serie',
      'potencia-comparar',
      'potencia-descomposicio',
    ],
  },
  { nombre: 'Anglès', tipos: ['there-be'] },
  { nombre: 'Del banc de preguntes', tipos: ['problema', 'vocabulario', 'vocabulario-escrito', 'gramatica', 'medi-pregunta'] },
]

// Formatos de banco que piden los tipos elegidos (0, 1 o —si se mezclan
// mal— varios).
export function formatosRequeridos(tipos) {
  return [...new Set(tipos.map((t) => FORMATO_BANCO_TIPO[t]).filter(Boolean))]
}

export function nombreTipo(tipo) {
  return NOMBRES_TIPOS[tipo] ?? `${tipo} (desconegut)`
}

export function esTipoDeBanco(tipo) {
  return usaBanco([tipo])
}

export { tiposConocidos }
