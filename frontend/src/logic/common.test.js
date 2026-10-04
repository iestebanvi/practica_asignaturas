import { describe, it, expect } from 'vitest'
import { normalizarTexto, respuestaCoincide } from './common.js'

describe('normalizarTexto', () => {
  it('pasa a minúsculas y quita espacios sobrantes', () => {
    expect(normalizarTexto('  Esmorzar  ')).toBe('esmorzar')
  })

  it('quita acentos', () => {
    expect(normalizarTexto('església')).toBe('esglesia')
    expect(normalizarTexto('allà')).toBe('alla')
  })

  it('quita el marcador "(TO)" de los verbos', () => {
    expect(normalizarTexto('BE (TO)')).toBe('be')
  })

  it('quita la puntuación final', () => {
    expect(normalizarTexto('Què?')).toBe('que')
    expect(normalizarTexto('I tant!')).toBe('i tant')
    expect(normalizarTexto('si...')).toBe('si')
  })
})

describe('respuestaCoincide', () => {
  it('acepta una coincidencia exacta', () => {
    expect(respuestaCoincide('esmorzar', 'esmorzar')).toBe(true)
  })

  it('ignora mayúsculas y acentos al comparar', () => {
    expect(respuestaCoincide('església', 'Esglesia')).toBe(true)
    expect(respuestaCoincide('BE (TO)', 'be')).toBe(true)
  })

  it('acepta cualquiera de varias alternativas separadas por comas', () => {
    expect(respuestaCoincide('trucar, cridar algú', 'trucar')).toBe(true)
    expect(respuestaCoincide('trucar, cridar algú', 'cridar algú')).toBe(true)
  })

  it('rechaza una respuesta que no coincide con ninguna alternativa', () => {
    expect(respuestaCoincide('esmorzar', 'dinar')).toBe(false)
  })
})
