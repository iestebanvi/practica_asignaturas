import { describe, it, expect } from 'vitest'
import {
  generarEjercicio,
  generarEjercicioAleatorio,
  comprobarRespuesta,
  elegirTipoOperacion,
  generarEjercicioDesdeBanco,
  generarEjercicioParaPerfil,
  operacionesConocidas,
  usaBanco,
} from './ejercicios.js'

// Mezcla de operaciones generadas + un tipo de banco ('problema'), para probar
// cómo se combinan. Antes eran los perfiles "pequeno"/"mayor" de perfiles.js.
const PERFIL_PEQUE = { operaciones: ['suma', 'resta'], nivel: 'facil' }
const PERFIL_MAYOR = {
  operaciones: ['suma', 'resta', 'multiplicacion', 'division', 'problema'],
  nivel: 'medio',
}
const MODOS_ANGLES = {
  vocabulari: { operaciones: ['vocabulario'] },
  vocabulariEscrit: { operaciones: ['vocabulario-escrito'] },
  gramatica: { operaciones: ['gramatica'] },
}

describe('generarEjercicio', () => {
  it('genera un ejercicio del tipo pedido', () => {
    expect(generarEjercicio('suma').tipo).toBe('suma')
    expect(generarEjercicio('resta').tipo).toBe('resta')
    expect(generarEjercicio('multiplicacion').tipo).toBe('multiplicacion')
    expect(generarEjercicio('division').tipo).toBe('division')
    expect(generarEjercicio('hora').tipo).toBe('hora')
  })

  it('lanza un error si la operación no existe', () => {
    expect(() => generarEjercicio('potencia')).toThrow()
  })
})

describe('generarEjercicioAleatorio', () => {
  it('solo genera operaciones incluidas en la lista dada (perfil pequeño)', () => {
    for (let i = 0; i < 50; i++) {
      const ej = generarEjercicioAleatorio(PERFIL_PEQUE.operaciones)
      expect(PERFIL_PEQUE.operaciones).toContain(ej.tipo)
    }
  })

  it('puede generar las 4 operaciones aritméticas del perfil mayor', () => {
    const operacionesAritmeticas = PERFIL_MAYOR.operaciones.filter((op) => op !== 'problema')
    const tipos = new Set()
    for (let i = 0; i < 200; i++) {
      tipos.add(generarEjercicioAleatorio(operacionesAritmeticas).tipo)
    }
    expect(tipos).toEqual(new Set(operacionesAritmeticas))
  })
})

describe('elegirTipoOperacion', () => {
  it('excluye "problema" si el banco de problemas está vacío', () => {
    for (let i = 0; i < 50; i++) {
      expect(elegirTipoOperacion(PERFIL_MAYOR.operaciones, [])).not.toBe('problema')
    }
  })

  it('puede elegir "problema" si el banco tiene contenido', () => {
    const banco = [{ enunciado: 'x', respuesta: 1 }]
    const tipos = new Set()
    for (let i = 0; i < 200; i++) {
      tipos.add(elegirTipoOperacion(PERFIL_MAYOR.operaciones, banco))
    }
    expect(tipos).toContain('problema')
  })

  it('lanza un error si no queda ninguna operación disponible (modo "Problemas" sin banco)', () => {
    expect(() => elegirTipoOperacion(['problema'], [])).toThrow()
  })

  it('también funciona con "vocabulario" como tipo respaldado por banco', () => {
    expect(() => elegirTipoOperacion(['vocabulario'], [])).toThrow()
    const banco = [{ enunciado: 'A', respuesta: 'un/a' }]
    expect(elegirTipoOperacion(['vocabulario'], banco)).toBe('vocabulario')
  })
})

describe('generarEjercicioDesdeBanco', () => {
  it('devuelve un ejercicio de tipo problema con los datos del banco', () => {
    const banco = [{ enunciado: 'Un enunciado de prueba', respuesta: 42 }]
    expect(generarEjercicioDesdeBanco(banco)).toEqual({
      tipo: 'problema',
      enunciado: 'Un enunciado de prueba',
      respuesta: 42,
      puntos: 20,
    })
  })
})

describe('operacionesConocidas / usaBanco', () => {
  it('descarta los tipos de ejercicio que el código no sabe generar', () => {
    expect(operacionesConocidas(['suma', 'no-existeix', 'problema'])).toEqual(['suma', 'problema'])
    expect(operacionesConocidas(['no-existeix'])).toEqual([])
  })

  it('distingue los tipos que necesitan un banco de preguntas', () => {
    expect(usaBanco(['suma', 'resta'])).toBe(false)
    expect(usaBanco(['suma', 'problema'])).toBe(true)
    expect(usaBanco(['vocabulario-escrito'])).toBe(true)
  })
})

describe('generarEjercicioDesdeBanco', () => {
  it('convierte a número la respuesta, que en la BD se guarda como texto', () => {
    const ej = generarEjercicioDesdeBanco([{ enunciado: 'Problema', respuesta: '42' }])
    expect(ej.respuesta).toBe(42)
    expect(comprobarRespuesta(ej, '42')).toBe(true)
  })
})

describe('generarEjercicioParaPerfil', () => {
  it('nunca genera un problema si el banco está vacío', () => {
    for (let i = 0; i < 50; i++) {
      expect(generarEjercicioParaPerfil(PERFIL_MAYOR, []).tipo).not.toBe('problema')
    }
  })

  it('puede generar un problema del banco cuando hay contenido', () => {
    const banco = [{ enunciado: 'Un enunciado de prueba', respuesta: 42 }]
    const tipos = new Set()
    for (let i = 0; i < 200; i++) {
      tipos.add(generarEjercicioParaPerfil(PERFIL_MAYOR, banco).tipo)
    }
    expect(tipos).toContain('problema')
  })

  it('genera vocabulario a partir del banco de palabras', () => {
    const banco = [
      { enunciado: 'BREAKFAST', respuesta: 'esmorzar' },
      { enunciado: 'LUNCH', respuesta: 'dinar' },
      { enunciado: 'DINNER', respuesta: 'sopar' },
      { enunciado: 'STREET', respuesta: 'carrer' },
    ]
    const ej = generarEjercicioParaPerfil(MODOS_ANGLES.vocabulari, banco)
    expect(ej.tipo).toBe('vocabulario')
    expect(banco.some((p) => p.enunciado === ej.enunciado && p.respuesta === ej.respuesta)).toBe(true)
  })

  it('genera gramática a partir del banco de ejercicios', () => {
    const banco = [
      {
        enunciado: 'Yesterday I ___ to the park.',
        opciones: ['go', 'went', 'gone', 'going'],
        respuesta: 'went',
      },
    ]
    const ej = generarEjercicioParaPerfil(MODOS_ANGLES.gramatica, banco)
    expect(ej.tipo).toBe('gramatica')
    expect(ej.respuesta).toBe('went')
  })

  it('genera vocabulario escrito a partir del banco de palabras', () => {
    const banco = [{ enunciado: 'BREAKFAST', respuesta: 'esmorzar' }]
    const ej = generarEjercicioParaPerfil(MODOS_ANGLES.vocabulariEscrit, banco)
    expect(ej.tipo).toBe('vocabulario-escrito')
    expect(ej.ingles).toBe('BREAKFAST')
  })
})

describe('comprobarRespuesta', () => {
  const ejercicio = { tipo: 'suma', enunciado: '2 + 3', respuesta: 5 }

  it('acepta la respuesta correcta, como número o como string', () => {
    expect(comprobarRespuesta(ejercicio, 5)).toBe(true)
    expect(comprobarRespuesta(ejercicio, '5')).toBe(true)
  })

  it('rechaza una respuesta incorrecta', () => {
    expect(comprobarRespuesta(ejercicio, 4)).toBe(false)
    expect(comprobarRespuesta(ejercicio, 'no sé')).toBe(false)
  })

  it('para el tipo "hora" compara la respuesta como texto exacto', () => {
    const ejercicioHora = { tipo: 'hora', hora: 9, minuto: 15, respuesta: '9:15' }
    expect(comprobarRespuesta(ejercicioHora, '9:15')).toBe(true)
    expect(comprobarRespuesta(ejercicioHora, '9:30')).toBe(false)
  })

  it('para el tipo "vocabulario" compara la respuesta como texto exacto', () => {
    const ejercicioVocab = { tipo: 'vocabulario', enunciado: 'BREAKFAST', respuesta: 'esmorzar' }
    expect(comprobarRespuesta(ejercicioVocab, 'esmorzar')).toBe(true)
    expect(comprobarRespuesta(ejercicioVocab, 'dinar')).toBe(false)
  })

  it('para el tipo "vocabulario-escrito" compara de forma tolerante (sin acentos, mayúsculas...)', () => {
    const ejercicioEscrito = {
      tipo: 'vocabulario-escrito',
      enunciado: 'esmorzar',
      respuesta: 'BREAKFAST',
    }
    expect(comprobarRespuesta(ejercicioEscrito, 'breakfast')).toBe(true)
    expect(comprobarRespuesta(ejercicioEscrito, 'Breakfast')).toBe(true)
    expect(comprobarRespuesta(ejercicioEscrito, 'lunch')).toBe(false)

    const ejercicioConTo = { tipo: 'vocabulario-escrito', enunciado: 'ser o estar', respuesta: 'BE (TO)' }
    expect(comprobarRespuesta(ejercicioConTo, 'be')).toBe(true)
  })
})
