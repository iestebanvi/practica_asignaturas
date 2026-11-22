import { describe, it, expect } from 'vitest'
import { validarPregunta } from '../src/validacion/preguntas.js'

describe('validarPregunta', () => {
  it('numérica: acepta enteros y decimales con coma o punto (se guarda con punto)', () => {
    expect(validarPregunta('numerica', { enunciado: ' Quant fa? ', respuesta: '54' }).valores).toEqual({
      enunciado: 'Quant fa?', respuesta: '54', opciones: null, activo: true,
    })
    expect(validarPregunta('numerica', { enunciado: 'x', respuesta: '3,5' }).valores.respuesta).toBe('3.5')
    expect(validarPregunta('numerica', { enunciado: 'x', respuesta: -2 }).valores.respuesta).toBe('-2')
  })

  it('numérica: rechaza respuestas que no son números', () => {
    for (const respuesta of ['cinquanta', '5 euros', '1.2.3', '']) {
      expect(validarPregunta('numerica', { enunciado: 'x', respuesta }).errores.respuesta).toBeTruthy()
    }
  })

  it('enunciado vacío o demasiado largo', () => {
    expect(validarPregunta('traduccio', { enunciado: '   ', respuesta: 'casa' }).errores.enunciado).toMatch(/buit/)
    expect(validarPregunta('traduccio', { enunciado: 'x'.repeat(1001), respuesta: 'casa' }).errores.enunciado).toMatch(/1000/)
  })

  it('traducción: guarda la respuesta tal cual (los sinónimos van separados por comas) y sin opciones', () => {
    const { valores } = validarPregunta('traduccio', { enunciado: 'HOUSE', respuesta: 'casa, llar', opciones: ['a', 'b'] })
    expect(valores).toEqual({ enunciado: 'HOUSE', respuesta: 'casa, llar', opciones: null, activo: true })
  })

  it('opción múltiple: la respuesta tiene que ser una de las opciones', () => {
    const ok = validarPregunta('opcio_multiple', { enunciado: 'Capa?', opciones: [' Geosfera', 'Hidrosfera '], respuesta: 'Geosfera' })
    expect(ok.valores.opciones).toEqual(['Geosfera', 'Hidrosfera'])
    const ko = validarPregunta('opcio_multiple', { enunciado: 'Capa?', opciones: ['Geosfera', 'Hidrosfera'], respuesta: 'Atmosfera' })
    expect(ko.errores.respuesta).toMatch(/correcta/)
  })

  it('opción múltiple: entre 2 y 6 opciones, sin vacías ni repetidas', () => {
    const err = (opciones) => validarPregunta('opcio_multiple', { enunciado: 'x', opciones, respuesta: opciones?.[0] }).errores.opciones
    expect(err(['A'])).toMatch(/entre 2 i 6/)
    expect(err(['A', 'B', 'C', 'D', 'E', 'F', 'G'])).toMatch(/entre 2 i 6/)
    expect(err(['A', ' '])).toMatch(/buida/)
    expect(err(['A', 'A'])).toMatch(/repetides/)
    expect(err(undefined)).toMatch(/entre 2 i 6/)
  })

  it('activo tiene que ser booleano si se envía', () => {
    expect(validarPregunta('traduccio', { enunciado: 'A', respuesta: 'b', activo: 'sí' }).errores.activo).toBeTruthy()
    expect(validarPregunta('traduccio', { enunciado: 'A', respuesta: 'b', activo: false }).valores.activo).toBe(false)
  })
})
