import { describe, it, expect } from 'vitest'
import { normalizarTexto, respuestaCoincide, parseNumero, numerosIguals, formatDecimal } from './common.js'

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


describe('números con decimales', () => {
  it('parseNumero acepta coma o punto y espacios; lo demás es NaN', () => {
    expect(parseNumero('3,25')).toBe(3.25)
    expect(parseNumero(' 3.25 ')).toBe(3.25)
    expect(parseNumero('3,50')).toBe(3.5)
    expect(parseNumero('42')).toBe(42)
    expect(parseNumero('-2,5')).toBe(-2.5)
    for (const t of ['', '3,2,1', 'tres', '3,', ',5', '3 ,5']) expect(parseNumero(t)).toBeNaN()
  })

  it('numerosIguals no se deja engañar por la coma flotante', () => {
    expect(0.1 + 0.2 === 0.3).toBe(false)
    expect(numerosIguals(0.1 + 0.2, 0.3)).toBe(true)
    expect(numerosIguals(3.5, 3.51)).toBe(false)
    expect(numerosIguals(NaN, NaN)).toBe(false)
  })

  it('formatDecimal: coma decimal, sin ceros finales salvo que se pidan', () => {
    expect(formatDecimal(3.5)).toBe('3,5')
    expect(formatDecimal(4)).toBe('4')
    expect(formatDecimal(0.1 + 0.2)).toBe('0,3')
    expect(formatDecimal(2.5, 2)).toBe('2,50')
  })
})
