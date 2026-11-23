import { describe, it, expect } from 'vitest'
import { tamanoBloc, estadoInicial, registrarRespuesta, millorBloc } from './blocs.js'

describe('blocs', () => {
  it('tamaño: el del modo, si no el del curso, si no 15', () => {
    expect(tamanoBloc({ config: { bloc: 10 } }, { bloc: 5 })).toBe(5)
    expect(tamanoBloc({ config: { bloc: 10 } }, { bloc: null })).toBe(10)
    expect(tamanoBloc({ config: {} }, {})).toBe(15)
  })

  it('cuenta puntos y aciertos y cierra el bloque al llegar al tamaño', () => {
    let estado = estadoInicial()
    const respuestas = [
      { esCorrecta: true, puntos: 10 },
      { esCorrecta: false, puntos: 15 },
      { esCorrecta: true, puntos: 15 },
    ]
    const completats = []
    for (const r of [...respuestas, ...respuestas]) {
      const res = registrarRespuesta(estado, r, 3)
      estado = res.estado
      if (res.completat) completats.push(res.completat)
    }
    expect(completats).toEqual([
      { puntos: 25, aciertos: 2, preguntas: 3 },
      { puntos: 25, aciertos: 2, preguntas: 3 },
    ])
    expect(estado.completats).toHaveLength(2)
    expect(estado.actual).toEqual({ puntos: 0, aciertos: 0, preguntas: 0 })
  })

  it('un bloque incompleto no se da por completado', () => {
    const { estado, completat } = registrarRespuesta(estadoInicial(), { esCorrecta: true, puntos: 10 }, 30)
    expect(completat).toBeNull()
    expect(estado.actual.preguntas).toBe(1)
    expect(estado.completats).toEqual([])
  })

  it('mejor bloque: más puntos, después más aciertos, después el primero', () => {
    const a = { puntos: 240, aciertos: 20, preguntas: 30 }
    const b = { puntos: 240, aciertos: 22, preguntas: 30 }
    const c = { puntos: 200, aciertos: 25, preguntas: 30 }
    expect(millorBloc([a, b, c])).toBe(b)
    expect(millorBloc([a, { ...a }])).toBe(a)
    expect(millorBloc([])).toBeNull()
  })
})
