import { randomInt, respuestaCoincide } from './common.js'
import { generarSuma } from './sumas.js'
import { generarResta } from './restas.js'
import { generarMultiplicacion } from './multiplicaciones.js'
import { generarDivision } from './divisiones.js'
import { generarHora } from './horas.js'
import { generarVocabulario, generarVocabularioEscrito } from './vocabulario.js'
import { generarGramatica } from './gramatica.js'

const GENERADORES = {
  suma: generarSuma,
  resta: generarResta,
  multiplicacion: generarMultiplicacion,
  division: generarDivision,
  hora: generarHora,
}

// Tipos cuya respuesta se compara como texto exacto (opción múltiple),
// en vez de como número (input numérico).
const TIPOS_RESPUESTA_TEXTO = ['hora', 'vocabulario', 'gramatica']

export function generarEjercicio(operacion, nivel = 'facil') {
  const generador = GENERADORES[operacion]
  if (!generador) {
    throw new Error(`Operación desconocida: ${operacion}`)
  }
  return generador(nivel)
}

export function generarEjercicioAleatorio(operaciones, nivel = 'facil') {
  const operacion = operaciones[randomInt(0, operaciones.length - 1)]
  return generarEjercicio(operacion, nivel)
}

export function comprobarRespuesta(ejercicio, respuestaUsuario) {
  if (ejercicio.tipo === 'vocabulario-escrito') {
    return respuestaCoincide(ejercicio.respuesta, respuestaUsuario)
  }
  if (TIPOS_RESPUESTA_TEXTO.includes(ejercicio.tipo)) {
    return respuestaUsuario === ejercicio.respuesta
  }
  return Number(respuestaUsuario) === ejercicio.respuesta
}

const PUNTOS_PROBLEMA = 20

// Algunos tipos ('problema', 'vocabulario', 'gramatica') no se generan: se
// eligen de un banco curado que llega del backend. Si el banco aún no ha
// cargado (o todavía no tiene contenido), se descarta esa opción para no
// bloquear el juego.
const GENERADORES_DESDE_BANCO = {
  problema: generarEjercicioDesdeBanco,
  vocabulario: generarVocabulario,
  'vocabulario-escrito': generarVocabularioEscrito,
  gramatica: generarGramatica,
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
    respuesta: problema.respuesta,
    puntos: PUNTOS_PROBLEMA,
  }
}

export function generarEjercicioParaPerfil(perfil, banco = []) {
  const tipo = elegirTipoOperacion(perfil.operaciones, banco)
  const generadorDesdeBanco = GENERADORES_DESDE_BANCO[tipo]
  if (generadorDesdeBanco) {
    return generadorDesdeBanco(banco)
  }
  return generarEjercicio(tipo, perfil.nivel)
}
