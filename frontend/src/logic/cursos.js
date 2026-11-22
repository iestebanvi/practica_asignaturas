// Árbol curso -> asignatura -> modo. Vive en código hasta la fase 3 del plan
// (docs/planes/plan-contenido-dinamico-cursos.md), en la que pasará a la BD con
// esta misma forma: por eso cada nivel lleva ya su "id" (slug de la URL) y su
// color, en vez de depender de clases CSS por modo.
//
// config.majuscules: toda la interfaz en mayúsculas y letra más grande (los de
// 1r solo saben leer en mayúscula). config.celebracio: emoji animado al acertar.
export const CURSOS = {
  primer: {
    id: '1-primaria',
    nombre: '1r de primària',
    icono: '🐣',
    color: '#ff8a65',
    sombra: '#d0530f',
    nivel: 'facil',
    config: { majuscules: true, celebracio: true },
    asignaturas: {
      matematiques: {
        id: 'matematiques',
        nombre: 'Matemàtiques',
        icono: '🔢',
        color: '#4fc3f7',
        sombra: '#0288d1',
        // Sumas y restas por separado: todavía no domina bien la resta, así
        // que no conviene mezclarlas.
        modos: {
          sumes: { id: 'sumes', nombre: 'Sumes', color: '#ffca28', sombra: '#f57f17', operaciones: ['suma'] },
          restes: { id: 'restes', nombre: 'Restes', color: '#7e57c2', sombra: '#4527a0', operaciones: ['resta'] },
          hores: { id: 'hores', nombre: 'Hores', color: '#ec407a', sombra: '#ad1457', operaciones: ['hora'] },
        },
      },
    },
  },
  sise: {
    id: '6-primaria',
    nombre: '6è de primària',
    icono: '🚀',
    color: '#4fc3f7',
    sombra: '#0288d1',
    nivel: 'medio',
    config: { majuscules: false, celebracio: false },
    asignaturas: {
      matematiques: {
        id: 'matematiques',
        nombre: 'Matemàtiques',
        icono: '🔢',
        color: '#4fc3f7',
        sombra: '#0288d1',
        modos: {
          aritmetica: {
            id: 'aritmetica',
            nombre: 'Aritmètica',
            color: '#ab47bc',
            sombra: '#7b1fa2',
            operaciones: ['suma', 'resta', 'multiplicacion', 'division'],
          },
          sumesRestes: {
            id: 'sumes-restes',
            nombre: 'Sumes i restes',
            color: '#00acc1',
            sombra: '#00838f',
            operaciones: ['suma', 'resta'],
          },
          multiplicacionsDivisions: {
            id: 'multiplicacions-divisions',
            nombre: 'Multiplicacions i divisions',
            color: '#5e35b1',
            sombra: '#311b92',
            operaciones: ['multiplicacion', 'division'],
          },
          problemes: {
            id: 'problemes',
            nombre: 'Problemes',
            color: '#26a69a',
            sombra: '#00796b',
            operaciones: ['problema'],
          },
          successions: {
            id: 'successions',
            nombre: 'Successions',
            color: '#ef6c00',
            sombra: '#bf360c',
            operaciones: ['sucesion'],
          },
          estimacions: {
            id: 'estimacions',
            nombre: 'Estimacions',
            color: '#6d4c41',
            sombra: '#3e2723',
            operaciones: ['estimacion'],
          },
          perimetresArees: {
            id: 'perimetres-arees',
            nombre: 'Perímetres i àrees',
            color: '#43a047',
            sombra: '#1b5e20',
            operaciones: ['perimetre', 'area', 'perimetre-area', 'costat-quadrat'],
          },
          potencies: {
            id: 'potencies',
            nombre: 'Potències',
            color: '#00838f',
            sombra: '#005662',
            operaciones: [
              'potencia-calcul',
              'potencia-combinada',
              'potencia-expressio',
              'potencia-base10',
              'potencia-imatge',
              'potencia-consecutiva',
              'potencia-serie',
              'potencia-comparar',
              'potencia-descomposicio',
            ],
          },
        },
      },
      angles: {
        id: 'angles',
        nombre: 'Anglès',
        icono: '🇬🇧',
        color: '#ef5350',
        sombra: '#c62828',
        modos: {
          vocabulari: {
            id: 'vocabulari',
            nombre: 'Vocabulari',
            color: '#3949ab',
            sombra: '#1a237e',
            operaciones: ['vocabulario'],
          },
          vocabulariEscrit: {
            id: 'vocabulari-escrit',
            nombre: 'Vocabulari escrit',
            color: '#00897b',
            sombra: '#00695c',
            operaciones: ['vocabulario-escrito'],
          },
          gramatica: {
            id: 'gramatica',
            nombre: 'Gramàtica',
            color: '#fb8c00',
            sombra: '#e65100',
            operaciones: ['gramatica'],
          },
          thereBe: {
            id: 'there-be',
            nombre: 'There is / are · was / were',
            color: '#5e35b1',
            sombra: '#3f2380',
            operaciones: ['there-be'],
          },
        },
      },
      medi: {
        id: 'medi',
        nombre: 'Medi',
        icono: '🌋',
        color: '#8d6e63',
        sombra: '#4e342e',
        modos: {
          canvisRelleu: {
            id: 'canvis-relleu',
            nombre: 'Canvis en el relleu',
            color: '#ff7043',
            sombra: '#bf360c',
            // Un único generador ('medi-pregunta'): internamente decide si la
            // pregunta es de texto o de imagen (ver PROBABILIDAD_IMAGEN en
            // medi.js), para que la de imagen no salga tan a menudo como una
            // operación aparte con el mismo peso saldría.
            operaciones: ['medi-pregunta'],
          },
        },
      },
    },
  },
}

// Todas las búsquedas van por el campo "id" (no por la clave del objeto): así
// da igual cómo se nombren las claves internas (p.ej. "sumesRestes" con id
// "sumes-restes"); un desajuste entre clave e id ya dejó una vez la pantalla en
// blanco.
function buscarPorId(coleccion, id) {
  if (!coleccion) return null
  return Object.values(coleccion).find((item) => item.id === id) ?? null
}

export function obtenerCurso(cursoId) {
  return buscarPorId(CURSOS, cursoId)
}

export function obtenerAsignatura(cursoId, asignaturaId) {
  return buscarPorId(obtenerCurso(cursoId)?.asignaturas, asignaturaId)
}

export function obtenerModo(cursoId, asignaturaId, modoId) {
  return buscarPorId(obtenerAsignatura(cursoId, asignaturaId)?.modos, modoId)
}

// Variables CSS para pintar una tarjeta/botón con el color de su elemento.
export function estiloColor(item) {
  return { '--fons': item.color, '--sombra': item.sombra }
}
