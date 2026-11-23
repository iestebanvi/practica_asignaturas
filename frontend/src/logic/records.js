// Récords (sin caché: cambian a cada bloque que se completa).
import { ErrorNoTrobat } from './api.js'

async function pedir(url) {
  const res = await fetch(url)
  if (res.status === 404) throw new ErrorNoTrobat(url)
  if (!res.ok) throw new Error(`Error ${res.status} en ${url}`)
  return res.json()
}

// Del alumno identificado en el curso: { "asignatura/modo": { puntos, aciertos, preguntas } }.
export async function obtenerRecordsPropis(curso) {
  const { records } = await pedir(`/api/alumnes/records?curs=${encodeURIComponent(curso)}`)
  return records
}

// Del curso (top 10 por modo): { "asignatura/modo": [{ posicio, alies, puntos, aciertos, preguntas }] }.
// Lanza ErrorNoTrobat si el curso los tiene desactivados.
export async function obtenerRecordsCurs(curso) {
  const { records } = await pedir(`/api/alumnes/records-curs?curs=${encodeURIComponent(curso)}`)
  return records
}

// Clave de un modo en los récords: "asignatura/modo" (nivel 1) o "asignatura/modo/2".
export const claveModo = (asignatura, modo, nivell = 1) => `${asignatura}/${modo}${nivell > 1 ? `/${nivell}` : ''}`

// Los récords del curso se muestran salvo que el curso los desactive.
export const recordsCursActius = (curso) => curso.config?.recordsCurs !== false
