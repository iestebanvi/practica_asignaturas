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
      sumasRestas: {
        id: 'sumas-restas',
        nombre: 'Sumas y restas',
        operaciones: ['suma', 'resta'],
      },
      multiplicacionesDivisiones: {
        id: 'multiplicaciones-divisiones',
        nombre: 'Multiplicaciones y divisiones',
        operaciones: ['multiplicacion', 'division'],
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
      vocabularioEscrito: {
        id: 'vocabulario-escrito',
        nombre: 'Vocabulario escrito',
        operaciones: ['vocabulario-escrito'],
      },
      gramatica: {
        id: 'gramatica',
        nombre: 'Gramática',
        operaciones: ['gramatica'],
      },
    },
  },
}

// Busca por el campo "id" (no por la clave del objeto): así da igual cómo se
// nombren las claves internas (p.ej. "sumasRestas" con id "sumas-restas"),
// evita que un desajuste entre clave e id deje la pantalla en blanco.
export function obtenerModo(perfilId, asignaturaId, modoId) {
  const modos = perfilId === 'mayor' ? ASIGNATURAS_MAYOR[asignaturaId]?.modos : MODOS_PEQUE
  if (!modos) return null
  return Object.values(modos).find((modo) => modo.id === modoId) ?? null
}
