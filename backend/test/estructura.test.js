import { describe, it, expect } from 'vitest'
import { validarEstructura, calcularSombra } from '../src/validacion/estructura.js'

describe('calcularSombra', () => {
  it('oscurece el color un 30 %', () => {
    expect(calcularSombra('#ffffff')).toBe('#b3b3b3')
    expect(calcularSombra('#4fc3f7')).toBe('#3789ad')
    expect(calcularSombra('#000000')).toBe('#000000')
  })
})

describe('validarEstructura', () => {
  it('al crear un curso: valores por defecto (inactivo, nivel medio, color base) y sombra calculada', () => {
    const { valores } = validarEstructura('curso', { nombre: ' 2n de primària ', slug: '2-primaria' }, { creando: true })
    expect(valores).toEqual({
      nombre: '2n de primària',
      slug: '2-primaria',
      color: '#4fc3f7',
      sombra: '#3789ad',
      nivel: 'medio',
      config: { majuscules: false, celebracio: false, bloc: 30, recordsCurs: true },
      activo: false,
    })
  })

  it('al crear: nombre y slug obligatorios; slug con formato de URL', () => {
    const { errores } = validarEstructura('curso', { nombre: '', slug: '2n de primària' }, { creando: true })
    expect(errores.nombre).toMatch(/buit/)
    expect(errores.slug).toMatch(/minúscules/)
  })

  it('slugs reservados: profesorat/api/assets para cursos, repassar para asignaturas', () => {
    expect(validarEstructura('asignatura', { nombre: 'X', slug: 'records' }, { creando: true }).errores.slug).toMatch(/reservat/)
    for (const slug of ['profesorat', 'api', 'assets']) {
      expect(validarEstructura('curso', { nombre: 'X', slug }, { creando: true }).errores.slug).toMatch(/reservat/)
    }
    expect(validarEstructura('asignatura', { nombre: 'X', slug: 'repassar' }, { creando: true }).errores.slug).toMatch(/reservat/)
    expect(validarEstructura('asignatura', { nombre: 'X', slug: 'api' }, { creando: true }).valores.slug).toBe('api')
  })

  it('al editar: solo valida lo que llega e ignora el slug (no se puede cambiar)', () => {
    expect(validarEstructura('curso', { activo: true, slug: 'otro' })).toEqual({ valores: { activo: true } })
    expect(validarEstructura('curso', { color: '#ABCDEF' }).valores).toEqual({ color: '#abcdef', sombra: '#7890a7' })
  })

  it('rechaza color, nivel, config, icono y activo no válidos', () => {
    const { errores } = validarEstructura('curso', {
      color: 'blau',
      nivel: 'molt-dificil',
      config: { majuscules: 'sí' },
      icono: 'un text massa llarg',
      activo: 'sí',
    })
    expect(Object.keys(errores).sort()).toEqual(['activo', 'color', 'config', 'icono', 'nivel'])
  })

  it('preguntas por bloque del curso: entre 5 y 100 (30 por defecto)', () => {
    expect(validarEstructura('curso', { config: { bloc: 10 } }).valores.config.bloc).toBe(10)
    expect(validarEstructura('curso', { config: { bloc: 4 } }).errores.bloc).toMatch(/entre 5 i 100/)
    expect(validarEstructura('curso', { config: { bloc: 12.5 } }).errores.bloc).toBeTruthy()
  })

  it('las asignaturas no tienen nivel ni config', () => {
    const { valores } = validarEstructura('asignatura', { nombre: 'Música', slug: 'musica', nivel: 'facil' }, { creando: true })
    expect(valores).not.toHaveProperty('nivel')
    expect(valores).not.toHaveProperty('config')
  })
})
