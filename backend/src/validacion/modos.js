import { TIPOS_EJERCICIO } from '../catalogo/tiposEjercicio.js'
import { validarEstructura, blocValido, BLOC_MIN, BLOC_MAX } from './estructura.js'
import { validarParams } from '../catalogo/parametres.js'

export const FORMATOS = ['numerica', 'traduccio', 'opcio_multiple']

// Niveles 2 y 3 (el 1 es el propio modo).
export const MAX_NIVELLS = 3

// Tipos de un modo o de un nivel: { operaciones } | { error }.
function validarOperaciones(operaciones) {
  if (!Array.isArray(operaciones) || operaciones.length === 0) return { error: "Tria almenys un tipus d'exercici." }
  if (operaciones.some((op) => typeof op !== 'string' || !(op in TIPOS_EJERCICIO))) {
    return { error: "Hi ha algun tipus d'exercici que no existeix." }
  }
  return { operaciones: [...new Set(operaciones)] }
}

// Formatos de banco que piden unos tipos (sin repetir).
const formatosDe = (operaciones) => [...new Set(operaciones.map((op) => TIPOS_EJERCICIO[op]).filter(Boolean))]

// Niveles 2 y 3: { nivells } | { error }. Cada uno con sus tipos, su
// dificultad y si está abierto a los alumnos.
function validarNivells(nivells) {
  if (nivells === undefined || nivells === null) return { nivells: [] }
  if (!Array.isArray(nivells) || nivells.length > MAX_NIVELLS - 1) return { error: `Com a màxim ${MAX_NIVELLS} nivells.` }
  const resultat = []
  for (const [i, nivell] of nivells.entries()) {
    const nom = `Nivell ${i + 2}`
    const { operaciones, error } = validarOperaciones(nivell?.operaciones)
    if (error) return { error: `${nom}: ${error.charAt(0).toLowerCase()}${error.slice(1)}` }
    const p = validarParams(operaciones, nivell.params)
    if (p.error) return { error: `${nom}: ${p.error}` }
    if (typeof (nivell.obert ?? true) !== 'boolean') return { error: `${nom}: obert ha de ser sí o no.` }
    resultat.push({ operaciones, params: p.params, obert: nivell.obert ?? true })
  }
  return { nivells: resultat }
}

// Modo completo (al crear, o lo guardado + los cambios al editar). Nombre,
// slug, color y activo se validan como en cursos/asignaturas; además los tipos
// de ejercicio. Devuelve { valores, formatoBanco } (formatoBanco: el formato
// de banco que exigen los tipos elegidos, o null) o { errores }.
export function validarModo(datos, { creando = false } = {}) {
  const base = validarEstructura('modo', datos, { creando })
  const errores = { ...(base.errores ?? {}) }
  const valores = { ...(base.valores ?? {}) }

  let formatoBanco = null
  const ops = validarOperaciones(datos.operaciones)
  const niv = validarNivells(datos.nivells)
  if (ops.error) errores.operaciones = ops.error
  if (niv.error) errores.nivells = niv.error
  if (!ops.error && !niv.error) {
    // Todos los niveles comparten el banco del modo: un solo formato.
    const formatos = formatosDe([...ops.operaciones, ...niv.nivells.flatMap((n) => n.operaciones)])
    if (formatos.length > 1) {
      errores.operaciones =
        "No es poden barrejar tipus que fan servir bancs de formats diferents (cada mode té un sol banc, també entre nivells)."
    } else {
      valores.operaciones = ops.operaciones
      valores.nivells = niv.nivells
      formatoBanco = formatos[0] ?? null
    }
  }

  // Parámetros de dificultad por tipo (solo de los tipos marcados).
  if (valores.operaciones) {
    const { params, error } = validarParams(valores.operaciones, datos.params)
    if (error) errores.params = error
    else valores.params = params
  }

  // Tamaño de bloque propio del modo (null = el del curso).
  const bloc = datos.bloc ?? null
  if (bloc !== null && !blocValido(bloc)) errores.bloc = `Entre ${BLOC_MIN} i ${BLOC_MAX}, o buit per fer servir el del curs.`
  else valores.bloc = bloc

  if (formatoBanco) {
    if (!Number.isInteger(datos.bancoId)) errores.bancoId = 'Tria el banc de preguntes.'
    else valores.bancoId = datos.bancoId
  } else {
    // Sin tipos de banco, el modo no usa ningún banco.
    valores.bancoId = null
  }

  return Object.keys(errores).length ? { errores } : { valores, formatoBanco }
}

export function validarBanco(datos, { creando = false } = {}) {
  const errores = {}
  const valores = {}
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
  if (creando || datos.nombre !== undefined) {
    if (!nombre) errores.nombre = 'El nom no pot estar buit.'
    else if (nombre.length > 80) errores.nombre = 'Màxim 80 caràcters.'
    else valores.nombre = nombre
  }
  if (creando) {
    const slug = typeof datos.slug === 'string' ? datos.slug.trim() : ''
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      errores.slug = "L'identificador només pot tenir minúscules sense accents, números i guions."
    } else valores.slug = slug
    if (!FORMATOS.includes(datos.formato)) errores.formato = 'Tria el format.'
    else valores.formato = datos.formato
  }
  return Object.keys(errores).length ? { errores } : { valores }
}
