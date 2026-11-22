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
