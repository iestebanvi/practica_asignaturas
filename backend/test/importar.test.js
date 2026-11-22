import { describe, it, expect } from 'vitest'
import { partirLinea, campoCsv, interpretarImportacion } from '../src/validacion/importar.js'

describe('partirLinea', () => {
  it('separa por ";" y, si hay tabuladores (celdas copiadas de Excel), por tabulador', () => {
    expect(partirLinea('HOUSE; casa, llar ')).toEqual(['HOUSE', 'casa, llar'])
    expect(partirLinea('HOUSE\tcasa; llar')).toEqual(['HOUSE', 'casa; llar'])
  })

  it('respeta las comillas de CSV (con "" para una comilla dentro)', () => {
    expect(partirLinea('"Tinc 3; i 4";7')).toEqual(['Tinc 3; i 4', '7'])
    expect(partirLinea('"Diu ""hola""";salutació')).toEqual(['Diu "hola"', 'salutació'])
  })

  it('campoCsv entrecomilla solo cuando hace falta, y es la inversa de partirLinea', () => {
    expect(campoCsv('casa')).toBe('casa')
    for (const valor of ['a;b', 'Diu "hola"', 'normal']) {
      expect(partirLinea(`${campoCsv(valor)};fi`)).toEqual([valor, 'fi'])
    }
    // Tabuladores y saltos de línea pasan a espacios
    expect(partirLinea(`${campoCsv('x\ty\nz')};fi`)).toEqual(['x y z', 'fi'])
  })
})

describe('interpretarImportacion', () => {
  it('traducción: anglès;català, ignorando líneas vacías y la cabecera', () => {
    const lineas = interpretarImportacion('traduccio', '﻿anglès;català\r\n\r\nHOUSE;casa\nTREE;arbre, abre\n')
    expect(lineas.map((l) => [l.numero, l.estado, l.datos.enunciado, l.datos.respuesta])).toEqual([
      [3, 'ok', 'HOUSE', 'casa'],
      [4, 'ok', 'TREE', 'arbre, abre'],
    ])
  })

  it('traducción: con más o menos de 2 campos es un error de formato', () => {
    const [una, tres] = interpretarImportacion('traduccio', 'HOUSE\nHOUSE;casa;llar')
    expect(una.estado).toBe('error')
    expect(una.errores.general).toMatch(/2 camps/)
    expect(tres.estado).toBe('error')
  })

  it('numérica: la respuesta es el último campo; valida que sea un número', () => {
    const [ok, coma, mal] = interpretarImportacion('numerica', 'Tinc 3 caixes de 8; quants?;24\nLa meitat de 7?;3,5\nQuant?;molts')
    expect(ok.datos).toMatchObject({ enunciado: 'Tinc 3 caixes de 8; quants?', respuesta: '24' })
    expect(coma.datos.respuesta).toBe('3.5')
    expect(mal.estado).toBe('error')
    expect(mal.errores.respuesta).toMatch(/número/)
  })

  it('opción múltiple: enunciat;correcta;incorrectes…', () => {
    const [ok, pocas, repetidas] = interpretarImportacion(
      'opcio_multiple',
      'Capa de gasos?;Atmosfera;Hidrosfera;Geosfera\nUna?;Sí\nDues?;A;A',
    )
    expect(ok.datos).toMatchObject({ respuesta: 'Atmosfera', opciones: ['Atmosfera', 'Hidrosfera', 'Geosfera'] })
    expect(pocas.errores.general).toMatch(/3 camps/)
    expect(repetidas.errores.opciones).toMatch(/repetides/)
  })

  it('marca como repetidas las que ya están en el banco o se repiten en el texto (sin mayúsculas ni acentos)', () => {
    const lineas = interpretarImportacion('traduccio', 'house;casa\nCAFÉ;cafè\ncafe;cafè\nDOG;gos', ['HOUSE'])
    expect(lineas.map((l) => l.estado)).toEqual(['repetida', 'ok', 'repetida', 'ok'])
  })
})
