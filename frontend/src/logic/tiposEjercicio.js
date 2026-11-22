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

export function nombreTipo(tipo) {
  return NOMBRES_TIPOS[tipo] ?? `${tipo} (desconegut)`
}

export function esTipoDeBanco(tipo) {
  return usaBanco([tipo])
}

export { tiposConocidos }
