import { describe, it, expect } from 'vitest'
import { generarMedi, generarMediImagen } from './medi.js'

const bancoDePrueba = [
  {
    id: 1,
    enunciado: 'Quina capa de la Terra és la gran massa rocosa?',
    opciones: ['Geosfera', 'Hidrosfera', 'Atmosfera', 'Astenosfera'],
    respuesta: 'Geosfera',
  },
  {
    id: 2,
    enunciado: 'Com s\'anomena el magma quan surt a l\'exterior?',
    opciones: ['Lava', 'Magma', 'Cendra', 'Roca'],
    respuesta: 'Lava',
  },
]

describe('generarMedi', () => {
  it('cuando genera una pregunta de texto, usa los datos del banco', () => {
    for (let i = 0; i < 200; i++) {
      const ej = generarMedi(bancoDePrueba)
      expect(['medi-pregunta', 'medi-imatge']).toContain(ej.tipo)
      expect(ej.puntos).toBe(10)
      if (ej.tipo !== 'medi-pregunta') continue

      const item = bancoDePrueba.find((p) => p.enunciado === ej.enunciado)
      expect(item).toBeDefined()
      expect(ej.respuesta).toBe(item.respuesta)
      expect(ej.opciones.slice().sort()).toEqual(item.opciones.slice().sort())
      expect(ej.opciones).toContain(ej.respuesta)
    }
  })

  // Las preguntas de imagen deben salir, pero bastante menos que las de
  // texto (solo hay 13 partes posibles entre los dos diagramas, frente al
  // banco de 50 preguntas): ver PROBABILIDAD_IMAGEN en medi.js.
  it('las preguntas de imagen son una minoría (≈25%) de las generadas', () => {
    let imagenes = 0
    for (let i = 0; i < 400; i++) {
      if (generarMedi(bancoDePrueba).tipo === 'medi-imatge') imagenes++
    }
    expect(imagenes).toBeGreaterThan(50)
    expect(imagenes).toBeLessThan(150)
  })
})

describe('generarMediImagen', () => {
  it('genera un ejercicio de tipo medi-imatge con 4 opciones únicas que incluyen la respuesta', () => {
    for (let i = 0; i < 100; i++) {
      const ej = generarMediImagen()
      expect(ej.tipo).toBe('medi-imatge')
      expect(['volcan', 'riu']).toContain(ej.diagrama)
      expect(ej.opciones).toHaveLength(4)
      expect(new Set(ej.opciones).size).toBe(4)
      expect(ej.opciones).toContain(ej.respuesta)
      expect(ej.puntos).toBe(10)
    }
  })

  it('parteId corresponde al diagrama indicado (volcan o riu)', () => {
    const partesVolcan = ['crater', 'lava', 'conVolcanic', 'xemeneia', 'magma', 'cendres']
    const partesRiu = ['naixement', 'cursAlt', 'cursMitja', 'meandres', 'cursBaix', 'delta', 'desembocadura']
    for (let i = 0; i < 100; i++) {
      const ej = generarMediImagen()
      if (ej.diagrama === 'volcan') {
        expect(partesVolcan).toContain(ej.parteId)
      } else {
        expect(partesRiu).toContain(ej.parteId)
      }
    }
  })
})
