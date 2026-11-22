import { describe, it, expect } from 'vitest'
import { NOMBRES_TIPOS, nombreTipo, tiposConocidos, esTipoDeBanco } from './tiposEjercicio.js'

describe('tiposEjercicio', () => {
  it('todos los tipos que sabe generar el código tienen nombre en la consola (y no sobra ninguno)', () => {
    expect(Object.keys(NOMBRES_TIPOS).sort()).toEqual(tiposConocidos().sort())
  })

  it('un tipo desconocido se muestra marcado, sin romper', () => {
    expect(nombreTipo('no-existeix')).toBe('no-existeix (desconegut)')
  })

  it('distingue los tipos que usan banco', () => {
    expect(esTipoDeBanco('vocabulario')).toBe(true)
    expect(esTipoDeBanco('suma')).toBe(false)
  })
})
