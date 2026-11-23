// Validación de cursos y asignaturas creados/editados desde la consola.
// Mensajes en catalán: se muestran tal cual debajo de cada campo.

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const COLOR = /^#[0-9a-f]{6}$/i
const NIVELES = ['facil', 'medio', 'dificil']
// Preguntas por bloque (récords): 30 si no se dice otra cosa.
export const BLOC_PER_DEFECTE = 30
export const BLOC_MIN = 5
export const BLOC_MAX = 100

export function blocValido(valor) {
  return Number.isInteger(valor) && valor >= BLOC_MIN && valor <= BLOC_MAX
}
const MAX_NOMBRE = 60
const MAX_ICONO = 8

// Partes de la URL que ya usa la web: un curso o asignatura con ese slug
// taparía otra pantalla.
export const SLUGS_RESERVADOS = {
  curso: ['profesorat', 'api', 'assets'],
  asignatura: ['repassar'],
  modo: [],
}

// Sombra de los botones: el mismo color un 30 % más oscuro.
export function calcularSombra(color) {
  const canal = (i) => Math.round(parseInt(color.slice(i, i + 2), 16) * 0.7)
  return '#' + [1, 3, 5].map((i) => canal(i).toString(16).padStart(2, '0')).join('')
}

const texto = (v) => (typeof v === 'string' ? v.trim() : v)

// tipo: 'curso' | 'asignatura' | 'modo'. creando: el slug solo se acepta al crear.
// (De los modos, aquí solo se validan los campos comunes; ver validacion/modos.js.)
// Solo valida los campos presentes (sirve para cambios parciales) salvo los
// obligatorios al crear. Devuelve { valores } o { errores }.
export function validarEstructura(tipo, datos, { creando = false } = {}) {
  const errores = {}
  const valores = {}

  if (creando || datos.nombre !== undefined) {
    const nombre = texto(datos.nombre)
    if (!nombre || typeof nombre !== 'string') errores.nombre = 'El nom no pot estar buit.'
    else if (nombre.length > MAX_NOMBRE) errores.nombre = `Màxim ${MAX_NOMBRE} caràcters.`
    else valores.nombre = nombre
  }

  if (creando) {
    const slug = texto(datos.slug)
    if (!slug || !SLUG.test(slug)) {
      errores.slug = "L'adreça només pot tenir minúscules sense accents, números i guions (p. ex. 2n-primaria)."
    } else if (SLUGS_RESERVADOS[tipo].includes(slug)) {
      errores.slug = `«${slug}» està reservat per la web; tria'n un altre.`
    } else valores.slug = slug
  }

  if (datos.icono !== undefined) {
    const icono = texto(datos.icono) ?? ''
    if (typeof icono !== 'string' || [...icono].length > MAX_ICONO) errores.icono = 'Posa-hi un emoji (o deixa-ho buit).'
    else valores.icono = icono || null
  }

  if (creando || datos.color !== undefined) {
    const color = texto(datos.color) ?? '#4fc3f7'
    if (typeof color !== 'string' || !COLOR.test(color)) errores.color = 'Color no vàlid.'
    else {
      valores.color = color.toLowerCase()
      valores.sombra = calcularSombra(valores.color)
    }
  }

  if (tipo === 'curso') {
    if (creando || datos.nivel !== undefined) {
      const nivel = datos.nivel ?? 'medio'
      if (!NIVELES.includes(nivel)) errores.nivel = 'Nivell no vàlid.'
      else valores.nivel = nivel
    }
    if (creando || datos.config !== undefined) {
      const config = datos.config ?? {}
      const { majuscules = false, celebracio = false, bloc = BLOC_PER_DEFECTE } = config
      if (typeof config !== 'object' || typeof majuscules !== 'boolean' || typeof celebracio !== 'boolean') {
        errores.config = 'Configuració no vàlida.'
      } else if (!blocValido(bloc)) {
        errores.bloc = `Les preguntes per bloc han de ser entre ${BLOC_MIN} i ${BLOC_MAX}.`
      } else valores.config = { majuscules, celebracio, bloc }
    }
  }

  if (creando || datos.activo !== undefined) {
    // Lo nuevo se crea inactivo salvo que se diga lo contrario.
    const activo = datos.activo ?? false
    if (typeof activo !== 'boolean') errores.activo = 'Valor no vàlid.'
    else valores.activo = activo
  }

  return Object.keys(errores).length ? { errores } : { valores }
}
