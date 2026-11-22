import { describe, it, expect } from 'vitest'
import {
  NOMBRES_TIPOS,
  nombreTipo,
  tiposConocidos,
  esTipoDeBanco,
  FORMATO_BANCO_TIPO,
  GRUPOS_TIPOS,
  formatosRequeridos,
} from './tiposEjercicio.js'
// El servidor valida los modos con su propia copia de la lista de tipos.
import { TIPOS_EJERCICIO as CATALOGO_BACKEND } from '../../../backend/src/catalogo/tiposEjercicio.js'

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

  it('la lista de tipos del backend coincide con la del frontend (tipos y formato de banco)', () => {
    const delFrontend = Object.fromEntries(tiposConocidos().map((t) => [t, FORMATO_BANCO_TIPO[t] ?? null]))
    expect(CATALOGO_BACKEND).toEqual(delFrontend)
  })

  it('los tipos con formato de banco son exactamente los que usan banco', () => {
    for (const tipo of tiposConocidos()) expect(Boolean(FORMATO_BANCO_TIPO[tipo])).toBe(esTipoDeBanco(tipo))
  })

  it('los grupos del formulario contienen cada tipo exactamente una vez', () => {
    const agrupados = GRUPOS_TIPOS.flatMap((g) => g.tipos)
    expect(agrupados.sort()).toEqual(tiposConocidos().sort())
  })

  it('formatosRequeridos', () => {
    expect(formatosRequeridos(['suma', 'resta'])).toEqual([])
    expect(formatosRequeridos(['vocabulario', 'vocabulario-escrito', 'suma'])).toEqual(['traduccio'])
    expect(formatosRequeridos(['problema', 'gramatica']).sort()).toEqual(['numerica', 'opcio_multiple'])
  })
})
