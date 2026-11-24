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
  'arrel-exacta': 'Arrels: arrel exacta (√144)',
  'arrel-quadrat': 'Arrels: relació amb la potència',
  'quadrat-perfecte': 'Arrels: és un quadrat perfecte?',
  'arrel-entera': 'Arrels: entre quins dos nombres està?',
  'arrel-imatge': 'Arrels: costat d’una quadrícula dibuixada',
  'decimal-posicio': 'Decimals: valor posicional',
  'decimal-comparar': 'Decimals: comparar (< > =)',
  'decimal-extrem': 'Decimals: el més gran / el més petit',
  'decimal-arrodonir': 'Decimals: arrodonir',
  'decimal-suma': 'Decimals: sumes',
  'decimal-resta': 'Decimals: restes',
  'decimal-potencia10': 'Decimals: × i ÷ per 10, 100, 1000',
  'decimal-per-natural': 'Decimals: decimal × natural',
  'fraccio-dibuix': 'Fraccions: llegir un dibuix',
  'fraccio-equivalent': 'Fraccions: equivalents',
  'fraccio-simplificar': 'Fraccions: simplificar',
  'fraccio-comparar': 'Fraccions: comparar (< > =)',
  'fraccio-quantitat': 'Fraccions: fracció d’una quantitat',
  'fraccio-suma': 'Fraccions: sumes',
  'fraccio-resta': 'Fraccions: restes',
  'fraccio-decimal': 'Fraccions: passar a decimal',
  combinada: 'Operacions combinades (sense parèntesis)',
  'combinada-parentesi': 'Operacions combinades (amb parèntesis)',
  'percentatge-quantitat': 'Percentatges: percentatge d’una quantitat',
  'percentatge-quin': 'Percentatges: quin percentatge és',
  'percentatge-descompte': 'Percentatges: descomptes',
  'percentatge-equivalencia': 'Percentatges: fracció, decimal i %',
  'proporcio-taula': 'Proporcionalitat: completar una taula',
  'proporcio-unitat': 'Proporcionalitat: reducció a la unitat',
  'div-multiple': 'Divisibilitat: és múltiple?',
  'div-seguent-multiple': 'Divisibilitat: el múltiple següent',
  'div-divisor': 'Divisibilitat: divisors',
  'div-criteris': 'Divisibilitat: criteris (2, 3, 5, 9, 10)',
  'div-primer': 'Divisibilitat: és primer?',
  'div-troba-primer': 'Divisibilitat: troba el primer',
  'mesura-longitud': 'Mesura: longitud (km, m, cm…)',
  'mesura-massa': 'Mesura: massa (t, kg, g…)',
  'mesura-capacitat': 'Mesura: capacitat (l, dl, ml…)',
  'mesura-superficie': 'Mesura: superfície (m², ha…)',
  'mesura-volum': 'Mesura: volum (m³, dm³, litres)',
  'mesura-temps': 'Mesura: temps (h, min, s)',
  'mesura-comparar': 'Mesura: comparar (< > =)',
  'mesura-escala': 'Mesura: escales de mapes i plànols',
  'cat-tonica': 'Accents: síl·laba tònica',
  'cat-classifica': 'Accents: aguda, plana o esdrúixola',
  'cat-sillabes': 'Accents: separar en síl·labes',
  'cat-diftong-hiat': 'Accents: diftong o hiat',
  'cat-diftong-tipus': 'Accents: diftong creixent o decreixent',
  'cat-escriptura': 'Accents: com s’escriu?',
  'cat-obert-tancat': 'Accents: obert o tancat (è/é, ò/ó)',
  'cat-per-que': 'Accents: per què porta (o no) accent?',
  'cat-dieresi': 'Accents: dièresi',
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
  {
    nombre: 'Arrels quadrades',
    tipos: ['arrel-exacta', 'arrel-quadrat', 'quadrat-perfecte', 'arrel-entera', 'arrel-imatge'],
  },
  {
    nombre: 'Decimals',
    tipos: [
      'decimal-posicio',
      'decimal-comparar',
      'decimal-extrem',
      'decimal-arrodonir',
      'decimal-suma',
      'decimal-resta',
      'decimal-potencia10',
      'decimal-per-natural',
    ],
  },
  { nombre: 'Operacions combinades', tipos: ['combinada', 'combinada-parentesi'] },
  {
    nombre: 'Divisibilitat',
    tipos: [
      'div-multiple',
      'div-seguent-multiple',
      'div-divisor',
      'div-criteris',
      'div-primer',
      'div-troba-primer',
    ],
  },
  {
    nombre: 'Percentatges i proporcionalitat',
    tipos: [
      'percentatge-quantitat',
      'percentatge-quin',
      'percentatge-descompte',
      'percentatge-equivalencia',
      'proporcio-taula',
      'proporcio-unitat',
    ],
  },
  {
    nombre: 'Fraccions',
    tipos: [
      'fraccio-dibuix',
      'fraccio-equivalent',
      'fraccio-simplificar',
      'fraccio-comparar',
      'fraccio-quantitat',
      'fraccio-suma',
      'fraccio-resta',
      'fraccio-decimal',
    ],
  },
  { nombre: 'Mesura', tipos: ['mesura-longitud', 'mesura-massa', 'mesura-capacitat', 'mesura-superficie', 'mesura-volum', 'mesura-temps', 'mesura-comparar', 'mesura-escala'] },
  { nombre: 'Català: accents', tipos: ['cat-tonica', 'cat-classifica', 'cat-sillabes', 'cat-diftong-hiat', 'cat-diftong-tipus', 'cat-escriptura', 'cat-obert-tancat', 'cat-per-que', 'cat-dieresi'] },
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
