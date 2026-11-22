// Búsquedas sobre el árbol de un curso tal como llega de la API
// (GET /api/cursos/:curso): { id, nombre, ..., asignaturas: [{ id, ..., modos: [...] }] }.
// Los "id" son los slugs de la URL.

export function buscarAsignatura(curso, asignaturaId) {
  return curso?.asignaturas.find((a) => a.id === asignaturaId) ?? null
}

export function buscarModo(asignatura, modoId) {
  return asignatura?.modos.find((m) => m.id === modoId) ?? null
}

// Variables CSS para pintar una tarjeta/botón con el color de su elemento.
export function estiloColor(item) {
  return { '--fons': item.color, '--sombra': item.sombra }
}
