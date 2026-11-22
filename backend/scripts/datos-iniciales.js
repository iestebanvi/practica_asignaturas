// Reúne el contenido que hoy vive en el código (árbol de cursos del frontend
// y JSON de los bancos) en el formato que espera sembrar(). Solo se usa desde
// local (make seed) y en los tests: no va dentro de la imagen Docker.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CURSOS } from '../../frontend/src/logic/cursos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const leer = (fichero) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', fichero), 'utf-8'))

export const FICHEROS_BANCOS = {
  'problemes-6': 'problemas-6primaria.json',
  'vocabulari-angles-6': 'vocabulario-ingles-6primaria.json',
  'gramatica-angles-6': 'gramatica-ingles-6primaria.json',
  'medi-canvis-relleu-6': 'medi-canvis-relleu-6primaria.json',
}

// El "id" de los JSON se conserva como "orden" (y se devuelve como id en los
// endpoints antiguos, para que respondan exactamente igual que antes).
const opcioMultiple = (p) => ({ orden: p.id, enunciado: p.enunciado, respuesta: p.respuesta, opciones: p.opciones })

export function datosIniciales() {
  const cursos = Object.values(CURSOS).map((curso) => ({
    ...curso,
    asignaturas: Object.values(curso.asignaturas).map((asig) => ({
      ...asig,
      modos: Object.values(asig.modos),
    })),
  }))

  const bancos = [
    {
      slug: 'problemes-6',
      nombre: 'Problemes (6è)',
      formato: 'numerica',
      operaciones: ['problema'],
      preguntas: leer(FICHEROS_BANCOS['problemes-6']).map((p) => ({
        orden: p.id,
        enunciado: p.enunciado,
        respuesta: p.respuesta,
      })),
    },
    {
      slug: 'vocabulari-angles-6',
      nombre: 'Vocabulari anglès (6è)',
      formato: 'traduccio',
      operaciones: ['vocabulario', 'vocabulario-escrito'],
      preguntas: leer(FICHEROS_BANCOS['vocabulari-angles-6']).map((p) => ({
        orden: p.id,
        enunciado: p.ingles,
        respuesta: p.catalan,
      })),
    },
    {
      slug: 'gramatica-angles-6',
      nombre: 'Gramàtica anglès (6è)',
      formato: 'opcio_multiple',
      operaciones: ['gramatica'],
      preguntas: leer(FICHEROS_BANCOS['gramatica-angles-6']).map(opcioMultiple),
    },
    {
      slug: 'medi-canvis-relleu-6',
      nombre: 'Medi: canvis en el relleu (6è)',
      formato: 'opcio_multiple',
      operaciones: ['medi-pregunta'],
      preguntas: leer(FICHEROS_BANCOS['medi-canvis-relleu-6']).map(opcioMultiple),
    },
  ]

  return { cursos, bancos }
}
