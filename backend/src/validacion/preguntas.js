const MAX_ENUNCIADO = 1000
const MAX_RESPUESTA = 300
const MIN_OPCIONES = 2
const MAX_OPCIONES = 6

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '')

// Comprueba una pregunta completa según el formato de su banco. Devuelve
// { valores } (normalizados, listos para guardar) o { errores: { campo: msg } }
// con mensajes en catalán para mostrarlos en la consola.
export function validarPregunta(formato, datos) {
  const errores = {}
  const enunciado = texto(datos.enunciado)
  let respuesta = typeof datos.respuesta === 'number' ? String(datos.respuesta) : texto(datos.respuesta)
  let opciones = null

  if (!enunciado) errores.enunciado = "L'enunciat no pot estar buit."
  else if (enunciado.length > MAX_ENUNCIADO) errores.enunciado = `Màxim ${MAX_ENUNCIADO} caràcters.`

  if (formato === 'opcio_multiple') {
    opciones = Array.isArray(datos.opciones) ? datos.opciones.map(texto) : []
    if (opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) {
      errores.opciones = `Hi ha d'haver entre ${MIN_OPCIONES} i ${MAX_OPCIONES} opcions.`
    } else if (opciones.some((o) => !o)) {
      errores.opciones = 'Cap opció pot estar buida.'
    } else if (new Set(opciones).size !== opciones.length) {
      errores.opciones = 'Hi ha opcions repetides.'
    } else if (!opciones.includes(respuesta)) {
      errores.respuesta = 'Marca quina opció és la correcta.'
    }
  } else if (!respuesta) {
    errores.respuesta = 'La resposta no pot estar buida.'
  } else if (formato === 'numerica') {
    // Se acepta coma o punto decimal; se guarda con punto.
    const normalizada = respuesta.replace(',', '.')
    if (!/^-?\d+(\.\d+)?$/.test(normalizada)) errores.respuesta = 'La resposta ha de ser un número.'
    else respuesta = normalizada
  }
  if (respuesta.length > MAX_RESPUESTA) errores.respuesta = `Màxim ${MAX_RESPUESTA} caràcters.`

  if (datos.activo !== undefined && typeof datos.activo !== 'boolean') errores.activo = 'Valor no vàlid.'

  if (Object.keys(errores).length) return { errores }
  return { valores: { enunciado, respuesta, opciones, activo: datos.activo ?? true } }
}
