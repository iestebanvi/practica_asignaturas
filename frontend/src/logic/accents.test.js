import { describe, it, expect } from 'vitest'
import {
  analitzar,
  posicio,
  portaAccent,
  diftongsIHiats,
  RAONS,
  generarCatTonica,
  generarCatClassifica,
  generarCatSillabes,
  generarCatDiftongHiat,
  generarCatDiftongTipus,
  generarCatEscriptura,
  generarCatObertTancat,
  generarCatPerQue,
  generarCatDieresi,
} from './accents.js'
import { PARAULES, DIERESI } from './accentsParaules.js'

const VECES = 400
const repetir = (fn) => Array.from({ length: VECES }, fn)
const VOCAL = /[aeiouàèéíòóúïü]/

function opcionsBones(ej) {
  expect(ej.opciones, ej.enunciado).toContain(ej.respuesta)
  expect(new Set(ej.opciones).size, ej.opciones.join(' | ')).toBe(ej.opciones.length)
}

describe('lista de palabras (normas del IEC)', () => {
  it('sin repetidas', () => {
    const paraules = PARAULES.map((p) => analitzar(p).paraula)
    expect(new Set(paraules).size).toBe(paraules.length)
  })

  for (const entrada of PARAULES) {
    it(entrada, () => {
      const a = analitzar(entrada)
      expect(a.tonica, 'sin sílaba tónica (falta el *)').toBeGreaterThanOrEqual(0)
      for (const s of a.sillabes) expect(s, 'sílaba sin vocal').toMatch(VOCAL)
      const accents = a.paraula.match(/[àèéíòóú]/g) ?? []
      expect(accents.length, 'más de un acento').toBeLessThanOrEqual(1)
      expect(a.paraula, 'acentos que no existen en catalán').not.toMatch(/[áìùÀ-Ü]/)
      if (accents.length) {
        expect(entrada, 'con acento gráfico no hace falta el *').not.toContain('*')
        expect(a.sillabes[a.tonica]).toContain(accents[0])
      }
      // La norma: lleva acento si y solo si le toca
      expect(portaAccent(a), `${a.paraula} (${posicio(a)})`).toBe(a.ambAccent)
    })
  }
})

describe('análisis', () => {
  it('posición de la tónica', () => {
    expect(posicio(analitzar('ca-mi-ó'))).toBe('aguda')
    expect(posicio(analitzar('*tau-la'))).toBe('plana')
    expect(posicio(analitzar('mú-si-ca'))).toBe('esdrúixola')
    expect(posicio(analitzar('fa-mí-li-a'))).toBe('esdrúixola')
  })

  it('la palabra entera: ela geminada y sin marcas', () => {
    expect(analitzar('síl-la-ba').paraula).toBe('síl·laba')
    expect(analitzar('car-re-*te-ra').paraula).toBe('carretera')
  })

  it('diptongos e hiatos (los errores típicos del dossier)', () => {
    const dh = (p) => diftongsIHiats(analitzar(p))
    expect(dh('te-*a-tre')).toEqual({ diftongs: [], hiats: 1 })
    expect(dh('po-*e-ma')).toEqual({ diftongs: [], hiats: 1 })
    expect(dh('pi-*a-no')).toEqual({ diftongs: [], hiats: 1 })
    expect(dh('*tau-la')).toEqual({ diftongs: ['decreixent'], hiats: 0 })
    expect(dh('*qua-dre')).toEqual({ diftongs: ['creixent'], hiats: 0 })
    expect(dh('pin-güí')).toEqual({ diftongs: ['creixent'], hiats: 0 })
    expect(dh('ai-xò')).toEqual({ diftongs: [], hiats: 0 }) // la i de ix no suena
    expect(dh('co-ixí')).toEqual({ diftongs: [], hiats: 0 })
    expect(dh('*es-quí')).toEqual({ diftongs: [], hiats: 0 }) // la u de qui no suena
  })

  it('agudas acabadas en diptongo decreciente: sin acento', () => {
    for (const p of ['a-*vui', 're-*mei', 'di-*jous', 'es-*tiu']) expect(portaAccent(analitzar(p))).toBe(false)
  })
})

describe('generadores', () => {
  const paraules = new Set(PARAULES.map((p) => analitzar(p).paraula))

  it('síl·laba tònica', () => {
    for (const ej of repetir(generarCatTonica)) {
      opcionsBones(ej)
      const p = ej.enunciado.match(/«(.+)»/)[1]
      const a = analitzar(PARAULES.find((x) => analitzar(x).paraula === p))
      expect(ej.respuesta).toBe(a.sillabes[a.tonica])
    }
  })

  it('aguda, plana o esdrúixola: salen las tres', () => {
    const r = new Set(repetir(generarCatClassifica).map((ej) => (opcionsBones(ej), ej.respuesta)))
    expect(r).toEqual(new Set(['aguda', 'plana', 'esdrúixola']))
  })

  it('separar en sílabas: tres opciones, la correcta y dos que no lo son', () => {
    for (const ej of repetir(generarCatSillabes)) {
      opcionsBones(ej)
      expect(ej.opciones).toHaveLength(3)
      const p = ej.enunciado.match(/«(.+)»/)[1]
      expect(ej.respuesta.replace(/l-l/g, 'l·l').replace(/-/g, '')).toBe(p)
      for (const o of ej.opciones) expect(o.replace(/-/g, '')).toBe(p.replace('·', ''))
    }
    // el error "a la castellana" con la rr
    const carretera = repetir(generarCatSillabes).find((e) => e.respuesta === 'car-re-te-ra')
    if (carretera) expect(carretera.opciones).toContain('ca-rre-te-ra')
  })

  it('diftong o hiat, creixent o decreixent', () => {
    const r = new Set(repetir(generarCatDiftongHiat).map((ej) => (opcionsBones(ej), ej.respuesta)))
    expect(r).toEqual(new Set(['un diftong', 'un hiat']))
    const t = new Set(repetir(generarCatDiftongTipus).map((ej) => (opcionsBones(ej), ej.respuesta)))
    expect(t).toEqual(new Set(['creixent', 'decreixent']))
  })

  it('com s’escriu: la correcta es de la lista y las otras no', () => {
    for (const ej of repetir(generarCatEscriptura)) {
      opcionsBones(ej)
      expect(ej.opciones).toHaveLength(3)
      expect(paraules.has(ej.respuesta)).toBe(true)
      for (const o of ej.opciones.filter((x) => x !== ej.respuesta)) expect(paraules.has(o), o).toBe(false)
    }
  })

  it('accent obert o tancat', () => {
    for (const ej of repetir(generarCatObertTancat)) {
      opcionsBones(ej)
      expect(paraules.has(ej.enunciado.split(' ').at(-1).replace('_', ej.respuesta))).toBe(true)
    }
  })

  it('per què porta (o no) accent: la razón coincide con la norma', () => {
    for (const ej of repetir(generarCatPerQue)) {
      opcionsBones(ej)
      const p = ej.enunciado.match(/«(.+)»/)[1]
      const a = analitzar(PARAULES.find((x) => analitzar(x).paraula === p))
      const esperada = a.ambAccent
        ? { aguda: RAONS.agudaAmb, plana: RAONS.planaAmb, esdrúixola: RAONS.esdruixola }[posicio(a)]
        : { aguda: RAONS.agudaSense, plana: RAONS.planaSense }[posicio(a)]
      expect(ej.respuesta, p).toBe(esperada)
    }
  })

  it('dièresi', () => {
    for (const [bona, dolenta] of DIERESI) expect(bona).not.toBe(dolenta)
    for (const ej of repetir(generarCatDieresi)) opcionsBones(ej)
  })
})
