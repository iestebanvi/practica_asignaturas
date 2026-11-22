// Acceso a la API de contenido. Cada respuesta se guarda en memoria durante
// la visita (al moverse entre asignaturas y modos no se vuelve a pedir el
// árbol del curso); recargar la página la vuelve a pedir, así que un cambio en
// la BD se ve al recargar. Los errores no se guardan: reintentar vuelve a pedir.

export class ErrorNoTrobat extends Error {}

const cache = new Map()

function pedir(url) {
  if (!cache.has(url)) {
    const peticion = fetch(url).then(async (res) => {
      if (res.status === 404) throw new ErrorNoTrobat(url)
      if (!res.ok) throw new Error(`Error ${res.status} en ${url}`)
      return res.json()
    })
    cache.set(url, peticion)
    peticion.catch(() => cache.delete(url))
  }
  return cache.get(url)
}

export function obtenerCursos() {
  return pedir('/api/cursos')
}

export function obtenerCurso(cursoId) {
  return pedir(`/api/cursos/${encodeURIComponent(cursoId)}`)
}

export async function obtenerPreguntas(banco) {
  const { preguntas } = await pedir(`/api/bancos/${encodeURIComponent(banco)}/preguntas`)
  return preguntas
}

// Solo para los tests.
export function vaciarCache() {
  cache.clear()
}
