import { describe, it, expect } from 'vitest'
import { buscarAsignatura, buscarModo, estiloColor } from './cursos.js'

// Árbol de ejemplo con la forma de GET /api/cursos/:curso
const CURSO = {
  id: '6-primaria',
  nombre: '6è de primària',
  asignaturas: [
    {
      id: 'matematiques',
      nombre: 'Matemàtiques',
      modos: [
        { id: 'aritmetica', nombre: 'Aritmètica', operaciones: ['suma'], banco: null },
        { id: 'sumes-restes', nombre: 'Sumes i restes', operaciones: ['suma', 'resta'], banco: null },
      ],
    },
    { id: 'angles', nombre: 'Anglès', modos: [{ id: 'vocabulari', operaciones: ['vocabulario'], banco: 'voc' }] },
  ],
}

describe('buscarAsignatura / buscarModo', () => {
  it('buscan por id (slug de la URL)', () => {
    const mates = buscarAsignatura(CURSO, 'matematiques')
    expect(mates).toBe(CURSO.asignaturas[0])
    expect(buscarModo(mates, 'sumes-restes')).toBe(mates.modos[1])
    expect(buscarModo(buscarAsignatura(CURSO, 'angles'), 'vocabulari').banco).toBe('voc')
  })

  it('devuelven null si algo no existe, sin romper aunque falte un nivel', () => {
    expect(buscarAsignatura(CURSO, 'ciencies')).toBeNull()
    expect(buscarModo(buscarAsignatura(CURSO, 'matematiques'), 'geometria')).toBeNull()
    expect(buscarModo(buscarAsignatura(CURSO, 'ciencies'), 'aritmetica')).toBeNull()
    expect(buscarAsignatura(null, 'matematiques')).toBeNull()
  })
})

describe('estiloColor', () => {
  it('convierte color y sombra en variables CSS', () => {
    expect(estiloColor({ color: '#111', sombra: '#222' })).toEqual({ '--fons': '#111', '--sombra': '#222' })
  })
})
