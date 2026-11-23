import { describe, it, expect } from 'vitest'
import { validarModo, validarBanco } from '../src/validacion/modos.js'

const base = { nombre: 'Prova', slug: 'prova' }

describe('validarModo', () => {
  it('modo de ejercicios generados: sin banco (aunque se envíe uno)', () => {
    const { valores, formatoBanco } = validarModo({ ...base, operaciones: ['suma', 'resta', 'suma'], bancoId: 5 }, { creando: true })
    expect(valores.operaciones).toEqual(['suma', 'resta'])
    expect(valores.bancoId).toBeNull()
    expect(formatoBanco).toBeNull()
    expect(valores.activo).toBe(false)
  })

  it('modo con tipos de banco: exige banco y dice qué formato necesita', () => {
    const sinBanco = validarModo({ ...base, operaciones: ['vocabulario'] }, { creando: true })
    expect(sinBanco.errores.bancoId).toMatch(/banc/)
    const conBanco = validarModo({ ...base, operaciones: ['vocabulario', 'vocabulario-escrito'], bancoId: 3 }, { creando: true })
    expect(conBanco.formatoBanco).toBe('traduccio')
    expect(conBanco.valores.bancoId).toBe(3)
  })

  it('se pueden mezclar tipos generados con tipos de UN formato de banco, pero no formatos distintos', () => {
    expect(validarModo({ ...base, operaciones: ['suma', 'problema'], bancoId: 1 }, { creando: true }).formatoBanco).toBe('numerica')
    expect(validarModo({ ...base, operaciones: ['problema', 'vocabulario'], bancoId: 1 }, { creando: true }).errores.operaciones).toMatch(/barrejar/)
  })

  it('al menos un tipo, y todos tienen que existir', () => {
    expect(validarModo({ ...base, operaciones: [] }, { creando: true }).errores.operaciones).toMatch(/almenys/)
    expect(validarModo({ ...base, operaciones: ['suma', 'no-existeix'] }, { creando: true }).errores.operaciones).toMatch(/no existeix/)
    expect(validarModo({ ...base }, { creando: true }).errores.operaciones).toBeTruthy()
  })
})

describe('validarModo: bloque propio', () => {
  it('opcional: null = el del curso; si se pone, entre 5 y 100', () => {
    const op = { ...base, operaciones: ['suma'] }
    expect(validarModo(op, { creando: true }).valores.bloc).toBeNull()
    expect(validarModo({ ...op, bloc: 10 }, { creando: true }).valores.bloc).toBe(10)
    expect(validarModo({ ...op, bloc: 200 }, { creando: true }).errores.bloc).toMatch(/Entre 5 i 100/)
  })
})

describe('validarBanco', () => {
  it('al crear: nombre, identificador y formato', () => {
    expect(validarBanco({ nombre: ' Música ', slug: 'musica-1', formato: 'traduccio' }, { creando: true }).valores).toEqual({
      nombre: 'Música', slug: 'musica-1', formato: 'traduccio',
    })
    const { errores } = validarBanco({ nombre: '', slug: 'Amb Espais', formato: 'altre' }, { creando: true })
    expect(Object.keys(errores).sort()).toEqual(['formato', 'nombre', 'slug'])
  })

  it('al editar solo cuenta el nombre', () => {
    expect(validarBanco({ nombre: 'Nou', formato: 'altre', slug: 'X' })).toEqual({ valores: { nombre: 'Nou' } })
  })
})

import { validarParams, PARAMETRES } from '../src/catalogo/parametres.js'

describe('validarParams', () => {
  it('sin parámetros: vacío', () => {
    expect(validarParams(['suma'], undefined)).toEqual({ params: {} })
  })

  it('acepta valores dentro de rango y descarta los vacíos', () => {
    expect(
      validarParams(['suma', 'estimacion'], { suma: { max: 99999 }, estimacion: { arrodonir: 100, xifres: 3, extra: undefined } }),
    ).toEqual({ error: 'Estimacions: paràmetre desconegut «extra».' })
    expect(validarParams(['suma', 'estimacion'], { suma: { max: 99999 }, estimacion: { arrodonir: 100, xifres: 3 } })).toEqual({
      params: { suma: { max: 99999 }, estimacion: { arrodonir: 100, xifres: 3 } },
    })
    expect(validarParams(['suma'], { suma: { max: '' } })).toEqual({ params: {} })
  })

  it('rechaza fuera de rango, tipos sin parámetros o no marcados, y combinaciones sin sentido', () => {
    const err = (ops, p) => validarParams(ops, p).error
    expect(err(['suma'], { suma: { max: 2 } })).toMatch(/entre 5 i 1000000/)
    expect(err(['suma'], { suma: { max: 1.5 } })).toBeTruthy()
    expect(err(['hora'], { hora: { max: 10 } })).toMatch(/no té paràmetres/)
    expect(err(['suma'], { resta: { max: 10 } })).toMatch(/no està marcat/)
    expect(err(['multiplicacion'], { multiplicacion: { taules: [2], xifresA: 2 } })).toMatch(/o bé les xifres o bé les taules/)
    expect(err(['multiplicacion'], { multiplicacion: { taules: [2, 2] } })).toMatch(/sense repetir/)
    expect(err(['sucesion'], { sucesion: { pasMin: 10, pasMax: 5 } })).toMatch(/salt mínim/)
    expect(err(['estimacion'], { estimacion: { arrodonir: 1000, xifres: 3 } })).toMatch(/més xifres/)
    expect(err(['estimacion'], { estimacion: { arrodonir: 50 } })).toMatch(/10, 100, 1000/)
  })

  it('todos los parámetros tienen etiqueta en catalán', () => {
    for (const specs of Object.values(PARAMETRES)) for (const spec of Object.values(specs)) expect(spec.etiqueta).toBeTruthy()
  })
})
