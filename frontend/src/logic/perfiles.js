export const PERFILES = {
  pequeno: {
    id: 'pequeno',
    nombre: 'Peque (6 años)',
    operaciones: ['suma', 'resta'],
    nivel: 'facil',
  },
  mayor: {
    id: 'mayor',
    nombre: 'Mayor (11 años)',
    operaciones: ['suma', 'resta', 'multiplicacion', 'division', 'problema'],
    nivel: 'medio',
  },
}

// El perfil "pequeño" elige entre sumas, restas u horas por separado:
// todavía no domina bien la resta, así que no conviene mezclarlas.
export const MODOS_PEQUE = {
  sumas: {
    id: 'sumas',
    nombre: 'Sumas',
    operaciones: ['suma'],
  },
  restas: {
    id: 'restas',
    nombre: 'Restas',
    operaciones: ['resta'],
  },
  horas: {
    id: 'horas',
    nombre: 'Horas',
    operaciones: ['hora'],
  },
}

// El perfil "mayor" elige primero la asignatura y luego el modo dentro de
// ella (p.ej. Matemáticas -> Aritmética/Problemas, Inglés -> Vocabulario).
export const ASIGNATURAS_MAYOR = {
  matematicas: {
    id: 'matematicas',
    nombre: 'Matemáticas',
    modos: {
      aritmetica: {
        id: 'aritmetica',
        nombre: 'Aritmética',
        operaciones: ['suma', 'resta', 'multiplicacion', 'division'],
      },
      problemas: {
        id: 'problemas',
        nombre: 'Problemas',
        operaciones: ['problema'],
      },
    },
  },
  ingles: {
    id: 'ingles',
    nombre: 'Inglés',
    modos: {
      vocabulario: {
        id: 'vocabulario',
        nombre: 'Vocabulario',
        operaciones: ['vocabulario'],
      },
      gramatica: {
        id: 'gramatica',
        nombre: 'Gramática',
        operaciones: ['gramatica'],
      },
    },
  },
}

export function obtenerModo(perfilId, asignaturaId, modoId) {
  if (perfilId === 'mayor') {
    return ASIGNATURAS_MAYOR[asignaturaId]?.modos?.[modoId] ?? null
  }
  return MODOS_PEQUE[modoId] ?? null
}
