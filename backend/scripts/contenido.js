import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Copia del contenido de la BD (make export-contenido). La fuente de verdad es
// la BD; este fichero es la copia de seguridad, la fuente de make seed y la
// base de los tests.
export const FICHERO_CONTENIDO = path.join(__dirname, '..', 'datos', 'contenido.json')

export function leerContenido() {
  return JSON.parse(readFileSync(FICHERO_CONTENIDO, 'utf-8'))
}
