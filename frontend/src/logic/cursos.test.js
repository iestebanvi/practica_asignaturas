import { describe, it, expect } from 'vitest'
import { CURSOS, obtenerCurso, obtenerAsignatura, obtenerModo } from './cursos.js'
import { generarEjercicioParaPerfil } from './ejercicios.js'

const sise = CURSOS.sise.asignaturas

describe('CURSOS', () => {
  it('6è: Matemàtiques separa aritmètica (sin problemas) y problemes', () => {
    expect(sise.matematiques.modos.aritmetica.operaciones).not.toContain('problema')
    expect(sise.matematiques.modos.problemes.operaciones).toEqual(['problema'])
  })

  it('6è: Matemàtiques incluye los bloques de sumes/restes y multiplicacions/divisions por separado', () => {
    expect(sise.matematiques.modos.sumesRestes.operaciones).toEqual(['suma', 'resta'])
    expect(sise.matematiques.modos.multiplicacionsDivisions.operaciones).toEqual([
      'multiplicacion',
      'division',
    ])
  })

  it('6è: Anglès incluye vocabulari (selección y escrito) y gramàtica', () => {
    expect(sise.angles.modos.vocabulari.operaciones).toEqual(['vocabulario'])
    expect(sise.angles.modos.vocabulariEscrit.operaciones).toEqual(['vocabulario-escrito'])
    expect(sise.angles.modos.gramatica.operaciones).toEqual(['gramatica'])
  })

  it('1r: sumes, restes y hores van por separado', () => {
    const modos = CURSOS.primer.asignaturas.matematiques.modos
    expect(modos.sumes.operaciones).toEqual(['suma'])
    expect(modos.restes.operaciones).toEqual(['resta'])
    expect(modos.hores.operaciones).toEqual(['hora'])
  })

  it('1r va en mayúsculas y con celebración; 6è no', () => {
    expect(CURSOS.primer.config).toEqual({ majuscules: true, celebracio: true })
    expect(CURSOS.sise.config).toEqual({ majuscules: false, celebracio: false })
  })

  it('todos los ids son slugs válidos para la URL y no se repiten dentro de su nivel', () => {
    const slug = /^[a-z0-9]+(-[a-z0-9]+)*$/
    const ids = (coleccion) => Object.values(coleccion).map((x) => x.id)
    const sinRepetir = (lista) => expect(new Set(lista).size).toBe(lista.length)

    sinRepetir(ids(CURSOS))
    for (const curso of Object.values(CURSOS)) {
      expect(curso.id).toMatch(slug)
      sinRepetir(ids(curso.asignaturas))
      for (const asignatura of Object.values(curso.asignaturas)) {
        expect(asignatura.id).toMatch(slug)
        // "repassar" está reservado para la ruta /:curso/repassar
        expect(asignatura.id).not.toBe('repassar')
        sinRepetir(ids(asignatura.modos))
        for (const modo of Object.values(asignatura.modos)) expect(modo.id).toMatch(slug)
      }
    }
  })
})

describe('obtenerCurso / obtenerAsignatura / obtenerModo', () => {
  it('buscan por id', () => {
    expect(obtenerCurso('6-primaria')).toBe(CURSOS.sise)
    expect(obtenerAsignatura('6-primaria', 'angles')).toBe(sise.angles)
    expect(obtenerModo('6-primaria', 'matematiques', 'aritmetica')).toBe(sise.matematiques.modos.aritmetica)
  })

  it('devuelven null si algo no existe', () => {
    expect(obtenerCurso('9-primaria')).toBeNull()
    expect(obtenerAsignatura('6-primaria', 'ciencies')).toBeNull()
    expect(obtenerModo('6-primaria', 'matematiques', 'geometria')).toBeNull()
    expect(obtenerModo('9-primaria', 'matematiques', 'aritmetica')).toBeNull()
    // El modo existe, pero en otro curso
    expect(obtenerModo('1-primaria', 'matematiques', 'aritmetica')).toBeNull()
  })

  // Regresión: la clave del objeto (p.ej. "sumesRestes") no tiene por qué
  // coincidir con su campo "id" (p.ej. "sumes-restes"); si se buscara por clave
  // en vez de por id, esto fallaría en silencio y dejaría la pantalla en blanco.
  it('encuentran TODOS los modos declarados,', () => {
    for (const curso of Object.values(CURSOS)) {
      for (const asignatura of Object.values(curso.asignaturas)) {
        for (const modo of Object.values(asignatura.modos)) {
          expect(obtenerModo(curso.id, asignatura.id, modo.id)).toBe(modo)
          expect(modo.operaciones.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('los modos generados de cada curso producen ejercicios con su nivel', () => {
    const sumes = obtenerModo('1-primaria', 'matematiques', 'sumes')
    const ejercicio = generarEjercicioParaPerfil({ operaciones: sumes.operaciones, nivel: CURSOS.primer.nivel })
    expect(ejercicio.tipo).toBe('suma')
  })
})
