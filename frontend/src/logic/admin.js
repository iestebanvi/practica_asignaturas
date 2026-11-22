// Acceso a la API de la consola del profesorado. A diferencia de api.js no
// hay caché: el estado de la sesión siempre se pregunta al servidor. La
// sesión va en una cookie HttpOnly que gestiona el navegador.

export class ErrorAdmin extends Error {
  constructor(codigo, datos = {}) {
    super(codigo)
    this.codigo = codigo // 'contrasenya_incorrecta' | 'massa_intents' | 'consola_desactivada' | 'xarxa'...
    this.datos = datos
  }
}

async function peticion(url, opciones = {}) {
  let res
  try {
    res = await fetch(url, opciones)
  } catch {
    throw new ErrorAdmin('xarxa')
  }
  if (res.status === 204) return null
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ErrorAdmin(body.error ?? `http_${res.status}`, body)
  return body
}

export function iniciarSesion(password) {
  return peticion('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function cerrarSesion() {
  return peticion('/api/admin/logout', { method: 'POST' })
}

// { caducaEn } si hay sesión válida; null si no la hay (o ha caducado).
export async function comprobarSesion() {
  try {
    return await peticion('/api/admin/sessio')
  } catch (err) {
    if (err.codigo === 'sessio_requerida') return null
    throw err
  }
}

// Todo el contenido para la consola (también lo inactivo).
export function obtenerContenidoAdmin() {
  return peticion('/api/admin/contingut')
}

export function obtenerBancoAdmin(id) {
  return peticion(`/api/admin/bancs/${encodeURIComponent(id)}`)
}

const json = (metodo, datos) => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(datos),
})

// Si los datos no son válidos, lanzan ErrorAdmin('validacio') con
// err.datos.camps = { campo: mensaje }.
export function crearPregunta(bancoId, datos) {
  return peticion(`/api/admin/bancs/${encodeURIComponent(bancoId)}/preguntes`, json('POST', datos))
}

export function actualizarPregunta(id, cambios) {
  return peticion(`/api/admin/preguntes/${encodeURIComponent(id)}`, json('PATCH', cambios))
}

export function borrarPregunta(id) {
  return peticion(`/api/admin/preguntes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Importar preguntas pegadas o de un fichero. Sin "importar" solo devuelve la
// vista previa: { lineas: [{ numero, texto, estado, datos, errores }], resumen }.
export function revisarImportacion(bancoId, texto) {
  return peticion(`/api/admin/bancs/${encodeURIComponent(bancoId)}/importa`, json('POST', { texto }))
}

export function importarPreguntas(bancoId, texto, { inactivas = false } = {}) {
  return peticion(
    `/api/admin/bancs/${encodeURIComponent(bancoId)}/importa`,
    json('POST', { texto, importar: true, inactivas }),
  )
}

// Descargas (enlaces normales: la cookie de sesión viaja sola).
export const urlCsvBanco = (bancoId) => `/api/admin/bancs/${encodeURIComponent(bancoId)}/csv`
export const URL_COPIA_COMPLETA = '/api/admin/export'
