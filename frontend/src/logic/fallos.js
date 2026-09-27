const CLAVE_STORAGE = 'practica-asignaturas:fallos'

// Tipos de ejercicio de opción múltiple cuyos fallos merece la pena
// registrar para repasar (vocabulario, gramática, horas...). Se guarda en
// localStorage, por dispositivo: es "global" entre sesiones, pero no sigue
// al niño si cambia de dispositivo.

function leerTodos() {
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE)
    return datos ? JSON.parse(datos) : {}
  } catch {
    return {}
  }
}

function guardarTodos(todos) {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(todos))
  } catch {
    // localStorage no disponible (modo privado, cuota llena...): no pasa nada grave, solo no se guarda.
  }
}

function etiquetaEjercicio(ejercicio) {
  return ejercicio.tipo === 'hora' ? `Las ${ejercicio.respuesta}` : ejercicio.enunciado
}

export function registrarFallo(perfilId, ejercicio) {
  const todos = leerTodos()
  todos[perfilId] ??= {}
  todos[perfilId][ejercicio.tipo] ??= {}

  const clave = etiquetaEjercicio(ejercicio)
  const existente = todos[perfilId][ejercicio.tipo][clave]

  todos[perfilId][ejercicio.tipo][clave] = {
    enunciado: clave,
    respuesta: ejercicio.respuesta,
    veces: (existente?.veces ?? 0) + 1,
    ultima: new Date().toISOString(),
  }

  guardarTodos(todos)
}

export function obtenerFallos(perfilId) {
  const porTipo = leerTodos()[perfilId] ?? {}
  const lista = []

  for (const [tipo, items] of Object.entries(porTipo)) {
    for (const item of Object.values(items)) {
      lista.push({ tipo, ...item })
    }
  }

  return lista.sort((a, b) => b.veces - a.veces)
}

export function vaciarFallos(perfilId) {
  const todos = leerTodos()
  delete todos[perfilId]
  guardarTodos(todos)
}
