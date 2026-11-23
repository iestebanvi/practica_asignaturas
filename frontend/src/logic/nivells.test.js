import { describe, it, expect } from 'vitest'
import { nivellsDe, nivellPerDefecte, triarNivell, modoDelNivell } from './nivells.js'
import { claveModo } from './records.js'

const modo = { id: 'combinades', operaciones: ['combinada'], params: { combinada: { operacions: 2 } } }

describe('niveles de un modo', () => {
  it('sin niveles: solo el 1, que es el propio modo', () => {
    expect(nivellsDe(modo)).toEqual([{ nivell: 1, operaciones: ['combinada'], params: { combinada: { operacions: 2 } } }])
    expect(nivellsDe({ ...modo, nivells: [] })).toHaveLength(1)
  })

  it('API pública: los niveles ya vienen numerados y abiertos', () => {
    const publico = { ...modo, nivells: [{ nivell: 3, operaciones: ['combinada-parentesi'], params: {} }] }
    expect(nivellsDe(publico).map((n) => n.nivell)).toEqual([1, 3])
  })

  it('consola: se numeran por posición; los cerrados solo con tambeTancats', () => {
    const consola = {
      ...modo,
      nivells: [
        { operaciones: ['combinada-parentesi'], params: {}, obert: false },
        { operaciones: ['combinada', 'combinada-parentesi'], params: {}, obert: true },
      ],
    }
    expect(nivellsDe(consola).map((n) => n.nivell)).toEqual([1, 3])
    expect(nivellsDe(consola, { tambeTancats: true }).map((n) => n.nivell)).toEqual([1, 2, 3])
  })

  it('por defecto el más alto; uno pedido solo si existe', () => {
    const nivells = nivellsDe({ ...modo, nivells: [{ nivell: 2, operaciones: ['combinada-parentesi'], params: {} }] })
    expect(nivellPerDefecte(nivells)).toBe(2)
    expect(triarNivell(nivells, '1')).toBe(1)
    expect(triarNivell(nivells, null)).toBe(2)
    expect(triarNivell(nivells, '3')).toBe(2)
    expect(modoDelNivell(modo, nivells, 2)).toMatchObject({ id: 'combinades', operaciones: ['combinada-parentesi'], params: {} })
    expect(modoDelNivell(modo, nivells, 1).operaciones).toEqual(['combinada'])
  })

  it('clave de récords: el nivel 1 como siempre; el 2 y el 3, con sufijo', () => {
    expect(claveModo('matematiques', 'combinades')).toBe('matematiques/combinades')
    expect(claveModo('matematiques', 'combinades', 1)).toBe('matematiques/combinades')
    expect(claveModo('matematiques', 'combinades', 2)).toBe('matematiques/combinades/2')
  })
})
