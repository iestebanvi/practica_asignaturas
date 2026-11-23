// Parámetros de dificultad que acepta cada tipo de ejercicio generado. Es la
// única definición: el servidor la usa para validar los modos y la consola la
// pide (GET /api/admin/parametres) para montar el formulario. Los generadores
// del frontend los entienden (frontend/src/logic/ejercicios.js,
// PARAMETRES_ACCEPTATS); un test comprueba que coinciden.
//
// tipus: 'enter' (número entero entre min y max), 'llista' (lista de enteros
// entre min y max, p. ej. tablas de multiplicar) u 'opcio' (uno de "valors").

// Decimales: cuántos decimales (hasta milésimas) y cifras de la parte entera.
const DECIMALS = { tipus: 'enter', etiqueta: 'Decimals (1 = dècimes, 2 = centèsimes, 3 = mil·lèsimes)', min: 1, max: 3 }
const XIFRES_ENTERES = { tipus: 'enter', etiqueta: 'Xifres de la part entera', min: 1, max: 3 }
const AMB_DECIMALS = { decimals: DECIMALS, xifresEnteres: XIFRES_ENTERES }

// Fracciones: denominador más grande que puede salir.
const AMB_DENOMINADOR = { denominadorMax: { tipus: 'enter', etiqueta: 'Denominador màxim', min: 4, max: 20 } }

// Operaciones combinadas: cuántas operaciones (sin poner nada, 2 o 3 al azar)
// y sumandos máximos (los factores y divisores van siempre del 2 al 10).
const COMBINADES = {
  operacions: { tipus: 'enter', etiqueta: 'Operacions per exercici (2 o 3; buit = barrejades)', min: 2, max: 3 },
  max: { tipus: 'enter', etiqueta: 'Sumands màxims', min: 10, max: 100 },
}

// Porcentajes: cuáles pueden salir y cantidad máxima (las cantidades se eligen
// para que el resultado sea exacto).
const PERCENTATGES = {
  percentatges: { tipus: 'llista', etiqueta: 'Només aquests percentatges (p. ex. 10, 25, 50)', min: 1, max: 99 },
  max: { tipus: 'enter', etiqueta: 'Quantitat màxima', min: 20, max: 1000 },
}

// Divisibilidad: número más grande que sale (los criterios, siempre de 3 cifras).
const DIVISIBILITAT = { max: { tipus: 'enter', etiqueta: 'Nombre màxim', min: 20, max: 1000 } }

export const PARAMETRES = {
  suma: {
    max: { tipus: 'enter', etiqueta: 'Nombre màxim', min: 5, max: 1000000 },
  },
  resta: {
    max: { tipus: 'enter', etiqueta: 'Nombre màxim', min: 5, max: 1000000 },
  },
  multiplicacion: {
    xifresA: { tipus: 'enter', etiqueta: 'Xifres del primer factor', min: 1, max: 4 },
    xifresB: { tipus: 'enter', etiqueta: 'Xifres del segon factor', min: 1, max: 3 },
    taules: { tipus: 'llista', etiqueta: 'Només aquestes taules (p. ex. 2, 5, 10)', min: 1, max: 12 },
  },
  division: {
    xifresDivisor: { tipus: 'enter', etiqueta: 'Xifres del divisor', min: 1, max: 3 },
    xifresQuocient: { tipus: 'enter', etiqueta: 'Xifres del quocient', min: 1, max: 4 },
  },
  estimacion: {
    arrodonir: { tipus: 'opcio', etiqueta: 'Arrodonir a', valors: [10, 100, 1000], noms: ['desenes', 'centenes', 'milers'] },
    xifres: { tipus: 'enter', etiqueta: 'Xifres dels nombres', min: 2, max: 6 },
  },
  sucesion: {
    pasMin: { tipus: 'enter', etiqueta: 'Salt mínim', min: 1, max: 1000 },
    pasMax: { tipus: 'enter', etiqueta: 'Salt màxim', min: 1, max: 1000 },
    inicialMax: { tipus: 'enter', etiqueta: 'Primer terme màxim', min: 10, max: 100000 },
  },
  'decimal-posicio': AMB_DECIMALS,
  'decimal-comparar': AMB_DECIMALS,
  'decimal-extrem': { xifresEnteres: XIFRES_ENTERES },
  'decimal-arrodonir': AMB_DECIMALS,
  'decimal-suma': AMB_DECIMALS,
  'decimal-resta': AMB_DECIMALS,
  'decimal-potencia10': AMB_DECIMALS,
  'decimal-per-natural': AMB_DECIMALS,
  'fraccio-dibuix': AMB_DENOMINADOR,
  'fraccio-equivalent': AMB_DENOMINADOR,
  'fraccio-simplificar': AMB_DENOMINADOR,
  'fraccio-comparar': AMB_DENOMINADOR,
  'fraccio-quantitat': AMB_DENOMINADOR,
  'fraccio-suma': AMB_DENOMINADOR,
  'fraccio-resta': AMB_DENOMINADOR,
  combinada: COMBINADES,
  'combinada-parentesi': COMBINADES,
  'percentatge-quantitat': PERCENTATGES,
  'percentatge-quin': PERCENTATGES,
  'percentatge-descompte': PERCENTATGES,
  'div-multiple': DIVISIBILITAT,
  'div-seguent-multiple': DIVISIBILITAT,
  'div-divisor': DIVISIBILITAT,
  'div-primer': DIVISIBILITAT,
  'div-troba-primer': DIVISIBILITAT,
}

const NOMS_TIPUS = {
  suma: 'Sumes',
  resta: 'Restes',
  multiplicacion: 'Multiplicacions',
  division: 'Divisions',
  estimacion: 'Estimacions',
  sucesion: 'Successions',
  'decimal-posicio': 'Decimals (valor posicional)',
  'decimal-comparar': 'Decimals (comparar)',
  'decimal-extrem': 'Decimals (el més gran / petit)',
  'decimal-arrodonir': 'Decimals (arrodonir)',
  'decimal-suma': 'Decimals (sumes)',
  'decimal-resta': 'Decimals (restes)',
  'decimal-potencia10': 'Decimals (× i ÷ per 10, 100, 1000)',
  'decimal-per-natural': 'Decimals (decimal × natural)',
  'fraccio-dibuix': 'Fraccions (llegir un dibuix)',
  'fraccio-equivalent': 'Fraccions (equivalents)',
  'fraccio-simplificar': 'Fraccions (simplificar)',
  'fraccio-comparar': 'Fraccions (comparar (< > =))',
  'fraccio-quantitat': 'Fraccions (fracció d’una quantitat)',
  'fraccio-suma': 'Fraccions (sumes)',
  'fraccio-resta': 'Fraccions (restes)',
  combinada: 'Operacions combinades (sense parèntesis)',
  'combinada-parentesi': 'Operacions combinades (amb parèntesis)',
  'percentatge-quantitat': 'Percentatges (percentatge d’una quantitat)',
  'percentatge-quin': 'Percentatges (quin percentatge és)',
  'percentatge-descompte': 'Percentatges (descomptes)',
  'div-multiple': 'Divisibilitat (és múltiple?)',
  'div-seguent-multiple': 'Divisibilitat (el múltiple següent)',
  'div-divisor': 'Divisibilitat (divisors)',
  'div-primer': 'Divisibilitat (és primer?)',
  'div-troba-primer': 'Divisibilitat (troba el primer)',
}

function valorValid(spec, valor) {
  if (spec.tipus === 'enter') return Number.isInteger(valor) && valor >= spec.min && valor <= spec.max
  if (spec.tipus === 'opcio') return spec.valors.includes(valor)
  return (
    Array.isArray(valor) &&
    valor.length > 0 &&
    valor.every((v) => Number.isInteger(v) && v >= spec.min && v <= spec.max) &&
    new Set(valor).size === valor.length
  )
}

function descripcio(spec) {
  if (spec.tipus === 'opcio') return `ha de ser ${spec.valors.join(', ')}`
  if (spec.tipus === 'llista') return `ha de ser una llista de nombres entre ${spec.min} i ${spec.max}, sense repetir`
  return `ha de ser un nombre entre ${spec.min} i ${spec.max}`
}

// Valida los parámetros de un modo según sus tipos de ejercicio. Devuelve
// { params } (limpios: sin tipos vacíos) o { error } con el mensaje en catalán.
export function validarParams(operaciones, params) {
  if (params === undefined || params === null) return { params: {} }
  if (typeof params !== 'object' || Array.isArray(params)) return { error: 'Paràmetres no vàlids.' }
  const net = {}
  for (const [tipo, valores] of Object.entries(params)) {
    const specs = PARAMETRES[tipo]
    if (!specs) return { error: `El tipus «${tipo}» no té paràmetres.` }
    if (!operaciones.includes(tipo)) return { error: `Hi ha paràmetres de ${NOMS_TIPUS[tipo]}, però aquest tipus no està marcat.` }
    if (!valores || typeof valores !== 'object' || Array.isArray(valores)) return { error: 'Paràmetres no vàlids.' }
    const nets = {}
    for (const [clave, valor] of Object.entries(valores)) {
      const spec = specs[clave]
      if (!spec) return { error: `${NOMS_TIPUS[tipo]}: paràmetre desconegut «${clave}».` }
      if (valor === null || valor === undefined || valor === '') continue
      if (!valorValid(spec, valor)) return { error: `${NOMS_TIPUS[tipo]}: «${spec.etiqueta}» ${descripcio(spec)}.` }
      nets[clave] = valor
    }
    // Combinaciones que no tienen sentido
    if (tipo === 'multiplicacion' && nets.taules && (nets.xifresA || nets.xifresB)) {
      return { error: 'Multiplicacions: tria o bé les xifres o bé les taules, no les dues coses.' }
    }
    if (tipo === 'sucesion' && nets.pasMin && nets.pasMax && nets.pasMin > nets.pasMax) {
      return { error: 'Successions: el salt mínim no pot ser més gran que el màxim.' }
    }
    if (tipo === 'estimacion' && nets.arrodonir && 10 ** (nets.xifres ?? 2) <= nets.arrodonir) {
      return { error: 'Estimacions: per arrodonir a aquesta unitat els nombres han de tenir més xifres.' }
    }
    if (Object.keys(nets).length) net[tipo] = nets
  }
  return { params: net }
}
