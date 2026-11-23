// "Per repassar": los fallos del alumno identificado con su àlies se guardan
// en el servidor (desde la fase 7d). Sin àlies no se guarda nada.
//
// Hasta la 7d se guardaban en el navegador (localStorage); migrarFallosLocales
// los pasa al àlies la primera vez que el alumno está identificado en ese
// curso y después los borra del navegador.

const CLAVE_LOCAL = 'practica-asignaturas:fallos'
// Antes de la fase 1 se guardaban por perfil en vez de por curso.
const PERFILES_ANTIGUOS = { pequeno: '1-primaria', mayor: '6-primaria' }

async function peticion(url, opciones) {
  const res = await fetch(url, opciones)
  if (!res.ok) throw new Error(`Error ${res.status} en ${url}`)
  return res.status === 204 ? null : res.json()
}

const json = (metodo, datos) => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(datos),
})

// Las horas no tienen enunciado propio: se apuntan como "Les 9:15".
function etiquetaEjercicio(ejercicio) {
  return ejercicio.tipo === 'hora' ? `Les ${ejercicio.respuesta}` : ejercicio.enunciado
}

// Fallos que aún se están enviando: el juego no los espera (para no frenar),
// pero obtenerFallos sí, para que la lista incluya el último aunque se abra
// "Per repassar" justo después de fallar.
const enviando = new Set()

export function registrarFallo(curso, ejercicio) {
  const envio = peticion(
    '/api/alumnes/fallos',
    json('POST', { curs: curso, tipo: ejercicio.tipo, enunciado: etiquetaEjercicio(ejercicio), respuesta: ejercicio.respuesta }),
  )
  enviando.add(envio)
  envio.catch(() => {}).finally(() => enviando.delete(envio))
  return envio
}

// [{ tipo, enunciado, respuesta, veces }], de más a menos veces.
export async function obtenerFallos(curso) {
  await Promise.allSettled([...enviando])
  const { fallos } = await peticion(`/api/alumnes/fallos?curs=${encodeURIComponent(curso)}`)
  return fallos
}

export function vaciarFallos(curso) {
  return peticion(`/api/alumnes/fallos?curs=${encodeURIComponent(curso)}`, { method: 'DELETE' })
}

// ---- Migración de los fallos guardados en el navegador ----

function leerLocal(almacen) {
  try {
    return JSON.parse(almacen.getItem(CLAVE_LOCAL)) ?? {}
  } catch {
    return {}
  }
}

// Claves del localStorage que corresponden a ese curso (la suya y la del
// perfil antiguo equivalente).
function clavesDelCurso(curso) {
  return [curso, ...Object.keys(PERFILES_ANTIGUOS).filter((p) => PERFILES_ANTIGUOS[p] === curso)]
}

// Fallos del curso guardados en el navegador: [{ tipo, enunciado, respuesta, veces }].
export function fallosLocales(curso, almacen = localStorage) {
  const todos = leerLocal(almacen)
  const lista = []
  for (const clave of clavesDelCurso(curso)) {
    for (const [tipo, items] of Object.entries(todos[clave] ?? {})) {
      for (const item of Object.values(items)) {
        lista.push({ tipo, enunciado: item.enunciado, respuesta: item.respuesta, veces: item.veces })
      }
    }
  }
  return lista
}

export function olvidarFallosLocales(curso, almacen = localStorage) {
  const todos = leerLocal(almacen)
  for (const clave of clavesDelCurso(curso)) delete todos[clave]
  if (Object.keys(todos).length === 0) almacen.removeItem(CLAVE_LOCAL)
  else almacen.setItem(CLAVE_LOCAL, JSON.stringify(todos))
}

const migrando = new Set()

// Pasa al àlies identificado los fallos del curso que guardaba el navegador.
// Se borran del navegador ANTES de enviarlos: si la página se cerrara a mitad
// del envío, al volver no se enviarían otra vez (se contarían dos veces). Si
// el servidor responde con un error, se devuelven al navegador.
export async function migrarFallosLocales(curso, almacen = localStorage) {
  const lista = fallosLocales(curso, almacen)
  if (lista.length === 0 || migrando.has(curso)) return 0
  migrando.add(curso)
  const copia = almacen.getItem(CLAVE_LOCAL)
  olvidarFallosLocales(curso, almacen)
  try {
    const { importats } = await peticion('/api/alumnes/fallos/importa', json('POST', { curs: curso, fallos: lista.slice(0, 500) }))
    return importats
  } catch (err) {
    restaurarCurso(curso, copia, almacen)
    throw err
  } finally {
    migrando.delete(curso)
  }
}

// Vuelve a poner en el navegador los fallos de ese curso (de la copia), sin
// tocar los de otros cursos.
function restaurarCurso(curso, copia, almacen) {
  let antes = {}
  try {
    antes = JSON.parse(copia) ?? {}
  } catch {
    return
  }
  const ahora = leerLocal(almacen)
  for (const clave of clavesDelCurso(curso)) if (antes[clave]) ahora[clave] = antes[clave]
  if (Object.keys(ahora).length) almacen.setItem(CLAVE_LOCAL, JSON.stringify(ahora))
}
