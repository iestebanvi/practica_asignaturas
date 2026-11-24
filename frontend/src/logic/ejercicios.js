import { randomInt, respuestaCoincide, parseNumero, parseNumeroAmbMilers, numerosIguals } from './common.js'
import { generarSuma } from './sumas.js'
import { generarResta } from './restas.js'
import { generarMultiplicacion } from './multiplicaciones.js'
import { generarDivision } from './divisiones.js'
import { generarHora } from './horas.js'
import { generarVocabulario, generarVocabularioEscrito } from './vocabulario.js'
import { generarGramatica } from './gramatica.js'
import { generarSucesion } from './sucesiones.js'
import { generarEstimacion } from './estimaciones.js'
import { generarMedi } from './medi.js'
import { generarPerimetre, generarArea, generarPerimetreArea, generarCostatQuadrat } from './geometria.js'
import {
  generarPotenciaCalcul,
  generarPotenciaCombinada,
  generarPotenciaExpressio,
  generarPotenciaBaseDeu,
  generarPotenciaImatge,
  generarPotenciaConsecutiva,
  generarPotenciaSerie,
  generarPotenciaComparar,
  generarPotenciaDescomposicio,
} from './potencies.js'
import { generarThereBe, respuestaThereBeCorrecta } from './thereBe.js'
import {
  generarArrelExacta,
  generarArrelQuadrat,
  generarQuadratPerfecte,
  generarArrelEntera,
  generarArrelImatge,
} from './arrels.js'
import {
  generarDecimalPosicio,
  generarDecimalComparar,
  generarDecimalExtrem,
  generarDecimalArrodonir,
  generarDecimalSuma,
  generarDecimalResta,
  generarDecimalPotencia10,
  generarDecimalPerNatural,
} from './decimals.js'
import {
  generarFraccioDibuix,
  generarFraccioEquivalent,
  generarFraccioSimplificar,
  generarFraccioComparar,
  generarFraccioQuantitat,
  generarFraccioSuma,
  generarFraccioResta,
  generarFraccioDecimal,
  TIPOS_RESPOSTA_FRACCIO,
  respostaFraccioCorrecta,
} from './fraccions.js'
import { generarCombinada, generarCombinadaParentesi } from './combinades.js'
import {
  generarPercentatgeQuantitat,
  generarPercentatgeQuin,
  generarPercentatgeDescompte,
  generarPercentatgeEquivalencia,
  generarProporcioTaula,
  generarProporcioUnitat,
} from './percentatges.js'
import {
  generarDivMultiple,
  generarDivSeguentMultiple,
  generarDivDivisor,
  generarDivCriteris,
  generarDivPrimer,
  generarDivTrobaPrimer,
} from './divisibilitat.js'
import {
  generarMesuraLongitud,
  generarMesuraMassa,
  generarMesuraCapacitat,
  generarMesuraSuperficie,
  generarMesuraVolum,
  generarMesuraTemps,
  generarMesuraComparar,
  generarMesuraEscala,
} from './mesura.js'

const GENERADORES = {
  suma: generarSuma,
  resta: generarResta,
  multiplicacion: generarMultiplicacion,
  division: generarDivision,
  hora: generarHora,
  sucesion: generarSucesion,
  estimacion: generarEstimacion,
  perimetre: generarPerimetre,
  area: generarArea,
  'perimetre-area': generarPerimetreArea,
  'costat-quadrat': generarCostatQuadrat,
  'there-be': generarThereBe,
  'potencia-calcul': generarPotenciaCalcul,
  'potencia-combinada': generarPotenciaCombinada,
  'potencia-expressio': generarPotenciaExpressio,
  'potencia-base10': generarPotenciaBaseDeu,
  'potencia-imatge': generarPotenciaImatge,
  'potencia-consecutiva': generarPotenciaConsecutiva,
  'potencia-serie': generarPotenciaSerie,
  'potencia-comparar': generarPotenciaComparar,
  'potencia-descomposicio': generarPotenciaDescomposicio,
  'arrel-exacta': generarArrelExacta,
  'arrel-quadrat': generarArrelQuadrat,
  'quadrat-perfecte': generarQuadratPerfecte,
  'arrel-entera': generarArrelEntera,
  'arrel-imatge': generarArrelImatge,
  'decimal-posicio': generarDecimalPosicio,
  'decimal-comparar': generarDecimalComparar,
  'decimal-extrem': generarDecimalExtrem,
  'decimal-arrodonir': generarDecimalArrodonir,
  'decimal-suma': generarDecimalSuma,
  'decimal-resta': generarDecimalResta,
  'decimal-potencia10': generarDecimalPotencia10,
  'decimal-per-natural': generarDecimalPerNatural,
  'fraccio-dibuix': generarFraccioDibuix,
  'fraccio-equivalent': generarFraccioEquivalent,
  'fraccio-simplificar': generarFraccioSimplificar,
  'fraccio-comparar': generarFraccioComparar,
  'fraccio-quantitat': generarFraccioQuantitat,
  'fraccio-suma': generarFraccioSuma,
  'fraccio-resta': generarFraccioResta,
  'fraccio-decimal': generarFraccioDecimal,
  combinada: generarCombinada,
  'combinada-parentesi': generarCombinadaParentesi,
  'percentatge-quantitat': generarPercentatgeQuantitat,
  'percentatge-quin': generarPercentatgeQuin,
  'percentatge-descompte': generarPercentatgeDescompte,
  'percentatge-equivalencia': generarPercentatgeEquivalencia,
  'proporcio-taula': generarProporcioTaula,
  'proporcio-unitat': generarProporcioUnitat,
  'div-multiple': generarDivMultiple,
  'div-seguent-multiple': generarDivSeguentMultiple,
  'div-divisor': generarDivDivisor,
  'div-criteris': generarDivCriteris,
  'div-primer': generarDivPrimer,
  'div-troba-primer': generarDivTrobaPrimer,
  'mesura-longitud': generarMesuraLongitud,
  'mesura-massa': generarMesuraMassa,
  'mesura-capacitat': generarMesuraCapacitat,
  'mesura-superficie': generarMesuraSuperficie,
  'mesura-volum': generarMesuraVolum,
  'mesura-temps': generarMesuraTemps,
  'mesura-comparar': generarMesuraComparar,
  'mesura-escala': generarMesuraEscala,
}

// Tipos cuya respuesta se compara como texto exacto (opción múltiple),
// en vez de como número (input numérico).
const TIPOS_RESPUESTA_TEXTO = [
  'hora',
  'vocabulario',
  'gramatica',
  'medi-pregunta',
  'medi-imatge',
  'perimetre-area',
  'potencia-expressio',
  'potencia-base10',
  'potencia-imatge',
  'potencia-comparar',
  'quadrat-perfecte',
  'arrel-entera',
  'decimal-comparar',
  'decimal-extrem',
  'fraccio-comparar',
  'div-multiple',
  'div-divisor',
  'div-criteris',
  'div-primer',
  'div-troba-primer',
  'mesura-comparar',
]

// Parámetros de dificultad que entiende cada generador (los que puede poner un
// modo en "params"). Tiene que coincidir con backend/src/catalogo/parametres.js
// (lo comprueba parametres.test.js).
export const PARAMETRES_ACCEPTATS = {
  suma: ['max'],
  resta: ['max'],
  multiplicacion: ['xifresA', 'xifresB', 'taules'],
  division: ['xifresDivisor', 'xifresQuocient'],
  estimacion: ['arrodonir', 'xifres'],
  sucesion: ['pasMin', 'pasMax', 'inicialMax'],
  'decimal-posicio': ['decimals', 'xifresEnteres'],
  'decimal-comparar': ['decimals', 'xifresEnteres'],
  'decimal-extrem': ['xifresEnteres'],
  'decimal-arrodonir': ['decimals', 'xifresEnteres'],
  'decimal-suma': ['decimals', 'xifresEnteres'],
  'decimal-resta': ['decimals', 'xifresEnteres'],
  'decimal-potencia10': ['decimals', 'xifresEnteres'],
  'decimal-per-natural': ['decimals', 'xifresEnteres'],
  'fraccio-dibuix': ['denominadorMax'],
  'fraccio-equivalent': ['denominadorMax'],
  'fraccio-simplificar': ['denominadorMax'],
  'fraccio-comparar': ['denominadorMax'],
  'fraccio-quantitat': ['denominadorMax'],
  'fraccio-suma': ['denominadorMax'],
  'fraccio-resta': ['denominadorMax'],
  combinada: ['operacions', 'max'],
  'combinada-parentesi': ['operacions', 'max'],
  'percentatge-quantitat': ['percentatges', 'max'],
  'percentatge-quin': ['percentatges', 'max'],
  'percentatge-descompte': ['percentatges', 'max'],
  'div-multiple': ['max'],
  'div-seguent-multiple': ['max'],
  'div-divisor': ['max'],
  'div-primer': ['max'],
  'div-troba-primer': ['max'],
  'mesura-longitud': ['decimals', 'salts'],
  'mesura-massa': ['decimals', 'salts'],
  'mesura-capacitat': ['decimals', 'salts'],
  'mesura-superficie': ['decimals', 'salts'],
  'mesura-volum': ['decimals', 'salts'],
  'mesura-comparar': ['decimals', 'salts'],
  'mesura-temps': ['decimals'],
}

export function generarEjercicio(operacion, nivel = 'facil', params = {}) {
  const generador = GENERADORES[operacion]
  if (!generador) {
    throw new Error(`Operación desconocida: ${operacion}`)
  }
  return generador(nivel, params)
}

export function generarEjercicioAleatorio(operaciones, nivel = 'facil') {
  const operacion = operaciones[randomInt(0, operaciones.length - 1)]
  return generarEjercicio(operacion, nivel)
}

export function comprobarRespuesta(ejercicio, respuestaUsuario) {
  if (ejercicio.tipo === 'vocabulario-escrito') {
    return respuestaCoincide(ejercicio.respuesta, respuestaUsuario)
  }
  if (ejercicio.tipo === 'there-be') {
    return respuestaThereBeCorrecta(ejercicio, respuestaUsuario)
  }
  // (Algunos ejercicios piden una fracción aunque su tipo no: formatResposta.)
  if (TIPOS_RESPOSTA_FRACCIO.includes(ejercicio.tipo) || ejercicio.formatResposta === 'fraccio') {
    return respostaFraccioCorrecta(ejercicio, respuestaUsuario)
  }
  if (TIPOS_RESPUESTA_TEXTO.includes(ejercicio.tipo)) {
    return respuestaUsuario === ejercicio.respuesta
  }
  // Respuesta numérica: se acepta coma o punto decimal ("3,5" = "3.50") y,
  // si la respuesta pasa de 1000, también el punto de miles ("2.500").
  if (numerosIguals(parseNumero(respuestaUsuario), ejercicio.respuesta)) return true
  return ejercicio.respuesta >= 1000 && numerosIguals(parseNumeroAmbMilers(respuestaUsuario), ejercicio.respuesta)
}

const PUNTOS_PROBLEMA = 20

// Algunos tipos ('problema', 'vocabulario', 'gramatica') no se generan: se
// eligen de un banco de preguntas que llega de la BD (el banco del modo). Si el banco aún no ha
// cargado (o todavía no tiene contenido), se descarta esa opción para no
// bloquear el juego.
const GENERADORES_DESDE_BANCO = {
  problema: generarEjercicioDesdeBanco,
  vocabulario: generarVocabulario,
  'vocabulario-escrito': generarVocabularioEscrito,
  gramatica: generarGramatica,
  'medi-pregunta': generarMedi,
}

// El árbol de modos llega de la BD (y lo podrá editar un profesor): un tipo
// de ejercicio que este código no sabe generar se ignora en vez de romper la
// pantalla.
export function operacionesConocidas(operaciones) {
  return operaciones.filter((op) => op in GENERADORES || op in GENERADORES_DESDE_BANCO)
}

// Todos los tipos de ejercicio que este código sabe generar.
export function tiposConocidos() {
  return [...Object.keys(GENERADORES), ...Object.keys(GENERADORES_DESDE_BANCO)]
}

export function usaBanco(operaciones) {
  return operaciones.some((op) => op in GENERADORES_DESDE_BANCO)
}

export function elegirTipoOperacion(operaciones, banco = []) {
  const disponibles = operaciones.filter(
    (op) => !(op in GENERADORES_DESDE_BANCO) || banco.length > 0,
  )
  if (disponibles.length === 0) {
    throw new Error('No hay ninguna operación disponible (¿el banco aún no ha cargado?)')
  }
  return disponibles[randomInt(0, disponibles.length - 1)]
}

export function generarEjercicioDesdeBanco(bancoProblemas) {
  const problema = bancoProblemas[randomInt(0, bancoProblemas.length - 1)]
  return {
    tipo: 'problema',
    enunciado: problema.enunciado,
    // En la BD todas las respuestas son texto; las de problemas son números.
    respuesta: Number(problema.respuesta),
    puntos: PUNTOS_PROBLEMA,
  }
}

// perfil: { operaciones, nivel, params? } (params: los del modo, por tipo).
export function generarEjercicioParaPerfil(perfil, banco = []) {
  const tipo = elegirTipoOperacion(perfil.operaciones, banco)
  const generadorDesdeBanco = GENERADORES_DESDE_BANCO[tipo]
  if (generadorDesdeBanco) {
    return generadorDesdeBanco(banco)
  }
  return generarEjercicio(tipo, perfil.nivel, perfil.params?.[tipo] ?? {})
}
