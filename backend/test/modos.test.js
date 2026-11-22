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
