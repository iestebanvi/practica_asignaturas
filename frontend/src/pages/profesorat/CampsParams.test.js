import { describe, it, expect } from 'vitest'
import { paramsPerDesar } from './CampsParams.jsx'

describe('paramsPerDesar', () => {
  const SPECS = { suma: { max: { tipus: 'enter' } }, multiplicacion: { taules: { tipus: 'llista' }, xifresA: { tipus: 'enter' } } }

  it('solo los tipos marcados, sin vacíos; números y listas convertidos', () => {
    expect(
      paramsPerDesar(
        ['suma', 'multiplicacion'],
        {
          suma: { max: '99999' },
          multiplicacion: { taules: '2, 5,10', xifresA: '' },
          resta: { max: '50' }, // no marcado
        },
        SPECS,
      ),
    ).toEqual({ suma: { max: 99999 }, multiplicacion: { taules: [2, 5, 10] } })
  })

  it('una lista de un solo número sigue siendo una lista', () => {
    expect(paramsPerDesar(['multiplicacion'], { multiplicacion: { taules: '7' } }, SPECS)).toEqual({ multiplicacion: { taules: [7] } })
  })

  it('lo que no se entiende se envía tal cual (el servidor dirá qué está mal)', () => {
    expect(paramsPerDesar(['suma'], { suma: { max: 'molts' } }, SPECS)).toEqual({ suma: { max: 'molts' } })
    expect(paramsPerDesar(['suma'], { suma: { max: '' } }, SPECS)).toEqual({})
  })
})
