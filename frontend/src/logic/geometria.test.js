import { describe, it, expect } from 'vitest'
import { generarPerimetre, generarArea, generarPerimetreArea, SITUACIONS } from './geometria.js'

const VECES = 300

describe('generarPerimetre', () => {
  it('el resultado es el perímetro de la figura dibujada', () => {
    for (let i = 0; i < VECES; i++) {
      const { tipo, figura, respuesta, puntos, enunciado } = generarPerimetre()
      const m = figura.medidas
      expect(tipo).toBe('perimetre')
      expect(puntos).toBe(15)
      expect(Number.isInteger(respuesta)).toBe(true)
      if (figura.forma === 'quadrat') {
        expect(respuesta).toBe(4 * m.costat)
        expect(enunciado).toBe('Perímetre del quadrat (cm)')
      } else if (figura.forma === 'rectangle') {
        expect(respuesta).toBe(2 * (m.base + m.altura))
        expect(m.altura).toBeLessThan(m.base)
        expect(enunciado).toBe('Perímetre del rectangle (cm)')
      } else {
        expect(figura.forma).toBe('triangle-costats')
        expect(respuesta).toBe(m.a + m.b + m.c)
        expect(enunciado).toBe('Perímetre del triangle (cm)')
      }
    }
  })

  it('los triángulos cumplen la desigualdad triangular', () => {
    for (let i = 0; i < VECES; i++) {
      const { figura } = generarPerimetre()
      if (figura.forma !== 'triangle-costats') continue
      const { a, b, c } = figura.medidas
      expect(a + b).toBeGreaterThan(c)
      expect(a + c).toBeGreaterThan(b)
      expect(b + c).toBeGreaterThan(a)
    }
  })

  it('genera las tres figuras', () => {
    const formas = new Set()
    for (let i = 0; i < VECES; i++) formas.add(generarPerimetre().figura.forma)
    expect(formas).toEqual(new Set(['quadrat', 'rectangle', 'triangle-costats']))
  })
})

describe('generarArea', () => {
  it('el resultado es el área de la figura dibujada, siempre entera', () => {
    for (let i = 0; i < VECES; i++) {
      const { tipo, figura, respuesta, puntos } = generarArea()
      const m = figura.medidas
      expect(tipo).toBe('area')
      expect(puntos).toBe(15)
      expect(Number.isInteger(respuesta)).toBe(true)
      expect(respuesta).toBeGreaterThan(0)
      if (figura.forma === 'quadrat') {
        expect(respuesta).toBe(m.costat * m.costat)
      } else if (figura.forma === 'rectangle') {
        expect(respuesta).toBe(m.base * m.altura)
      } else if (figura.forma === 'triangle-altura') {
        expect((m.base * m.altura) % 2).toBe(0)
        expect(respuesta).toBe((m.base * m.altura) / 2)
      } else {
        expect(figura.forma).toBe('paralelogram')
        expect(respuesta).toBe(m.base * m.altura)
      }
    }
  })

  it('en triángulo y paralelogramo el lado inclinado es mayor que la altura y no cambia el resultado', () => {
    for (let i = 0; i < VECES; i++) {
      const { figura, respuesta } = generarArea()
      if (figura.forma !== 'triangle-altura' && figura.forma !== 'paralelogram') continue
      const { base, altura, costat, dx } = figura.medidas
      expect(costat).toBeGreaterThan(altura)
      expect(dx).toBeGreaterThan(0)
      expect(dx).toBeLessThan(base)
      expect(respuesta).not.toBe(costat * base)
    }
  })

  it('los triángulos son apaisados (altura como mucho el 80% de la base) y la altura cae dentro de la base', () => {
    for (let i = 0; i < VECES; i++) {
      const { figura } = generarArea()
      if (figura.forma !== 'triangle-altura') continue
      const { base, altura, dx } = figura.medidas
      expect(altura).toBeLessThanOrEqual(base * 0.8)
      expect(altura).toBeGreaterThanOrEqual(3)
      expect(dx).toBeLessThanOrEqual(base * 0.45)
    }
  })

  it('genera las cuatro figuras y el enunciado nombra la figura con las unidades', () => {
    const formas = new Set()
    for (let i = 0; i < VECES; i++) {
      const { figura, enunciado } = generarArea()
      formas.add(figura.forma)
      expect(enunciado).toMatch(/^Àrea del (quadrat|rectangle|triangle|paral·lelogram) \(cm²\)$/)
    }
    expect(formas).toEqual(new Set(['quadrat', 'rectangle', 'triangle-altura', 'paralelogram']))
  })
})

describe('generarPerimetreArea', () => {
  it('ofrece las dos opciones y la respuesta es una de ellas', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarPerimetreArea()
      expect(ej.tipo).toBe('perimetre-area')
      expect(ej.opciones.slice().sort()).toEqual(['Perímetre', 'Àrea'])
      expect(ej.opciones).toContain(ej.respuesta)
      expect(SITUACIONS.some((s) => s.text === ej.enunciado && s.respuesta === ej.respuesta)).toBe(true)
    }
  })

  it('el banco de situaciones está equilibrado y sin repetidos', () => {
    const perimetres = SITUACIONS.filter((s) => s.respuesta === 'Perímetre')
    const arees = SITUACIONS.filter((s) => s.respuesta === 'Àrea')
    expect(perimetres.length).toBeGreaterThanOrEqual(5)
    expect(arees.length).toBeGreaterThanOrEqual(5)
    expect(perimetres.length + arees.length).toBe(SITUACIONS.length)
    expect(new Set(SITUACIONS.map((s) => s.text)).size).toBe(SITUACIONS.length)
  })
})
