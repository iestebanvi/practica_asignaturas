import { describe, it, expect } from 'vitest'
import { generarThereBe, normalizarIngles, respuestaThereBeCorrecta, NOMBRES } from './thereBe.js'
import { comprobarRespuesta, generarEjercicio } from './ejercicios.js'

const VECES = 500

describe('generarThereBe', () => {
  it('devuelve un ejercicio escrito completo y su respuesta es una de las aceptadas', () => {
    for (let i = 0; i < VECES; i++) {
      const ej = generarThereBe()
      expect(ej.tipo).toBe('there-be')
      expect(ej.puntos).toBe(15)
      expect(ej.instruccion).toBeTruthy()
      expect(ej.enunciado).toBeTruthy()
      expect(ej.aceptadas).toContain(ej.respuesta)
      expect(respuestaThereBeCorrecta(ej, ej.respuesta)).toBe(true)
    }
  })

  it('los huecos tienen "___" y la respuesta es una sola palabra (was/were/is/are o su negativa)', () => {
    let huecos = 0
    for (let i = 0; i < VECES; i++) {
      const ej = generarThereBe()
      if (!ej.enunciado.includes('___')) continue
      huecos++
      expect(ej.respuesta).toMatch(/^(is|are|was|were|isn't|aren't|wasn't|weren't|Is|Are|Was|Were)$/)
    }
    expect(huecos).toBeGreaterThan(50)
  })

  it('no mezcla singular con "are/were a" ni plural con "is/was two"', () => {
    for (let i = 0; i < VECES; i++) {
      const { respuesta, enunciado } = generarThereBe()
      const frase = `${enunciado} ${respuesta}`
      expect(frase).not.toMatch(/there (are|were|aren't|weren't) an? /i)
      expect(frase).not.toMatch(/there (is|was|isn't|wasn't) (two|three|four|lots of|any) /i)
      expect(frase).not.toMatch(/\ba [aeiou]/)
    }
  })

  it('usa "an" delante de vocal y "any" en negativas plurales', () => {
    const textos = Array.from({ length: VECES * 4 }, () => generarThereBe().respuesta + ' ' + generarThereBe().enunciado)
    expect(textos.some((t) => t.includes('an island'))).toBe(true)
    expect(textos.some((t) => /aren't any|weren't any/.test(t))).toBe(true)
  })

  it('genera todas las clases de ejercicio', () => {
    const instrucciones = new Set()
    for (let i = 0; i < VECES; i++) {
      instrucciones.add(generarThereBe().instruccion.replace(/\(.*\)/, '').trim())
    }
    expect(instrucciones).toEqual(
      new Set([
        'Completa el hueco :',
        'Escribe la frase en pasado:',
        'Escribe la pregunta:',
        'Responde con respuesta corta :',
        'Completa la pregunta:',
      ]),
    )
  })

  it('el vocabulario tiene plural escrito para todos los nombres', () => {
    for (const n of NOMBRES) expect(n.p).not.toBe(n.s)
  })
})

describe('corrección de respuestas', () => {
  const ej = { tipo: 'there-be', aceptadas: ["There wasn't any paths."] }

  it('ignora mayúsculas, puntuación y espacios', () => {
    expect(respuestaThereBeCorrecta(ej, "  there   WASN'T any paths ")).toBe(true)
  })

  it('acepta contracciones y su forma completa como equivalentes', () => {
    expect(respuestaThereBeCorrecta(ej, 'There was not any paths')).toBe(true)
    expect(respuestaThereBeCorrecta({ aceptadas: ['There was a castle.'] }, 'There was a castle')).toBe(true)
    expect(respuestaThereBeCorrecta({ aceptadas: ["There's a castle."] }, 'There is a castle')).toBe(true)
    expect(respuestaThereBeCorrecta({ aceptadas: ['weren’t'] }, "weren't")).toBe(true)
    expect(respuestaThereBeCorrecta({ aceptadas: ['No, there is not.'] }, "No there isn't")).toBe(true)
  })

  it('el apóstrofo es obligatorio: "wasnt" no vale', () => {
    expect(respuestaThereBeCorrecta({ aceptadas: ["wasn't"] }, 'wasnt')).toBe(false)
  })

  it('rechaza respuestas distintas', () => {
    expect(respuestaThereBeCorrecta({ aceptadas: ['was'] }, 'were')).toBe(false)
    expect(respuestaThereBeCorrecta({ aceptadas: ['Was there a castle?'] }, 'Was there castle?')).toBe(false)
  })

  it('normalizarIngles expande las contracciones', () => {
    expect(normalizarIngles("They're, weren't!")).toBe('they are were not')
  })

  it('comprobarRespuesta y generarEjercicio lo integran', () => {
    const generado = generarEjercicio('there-be')
    expect(comprobarRespuesta(generado, generado.respuesta)).toBe(true)
    expect(comprobarRespuesta(generado, 'xxxx')).toBe(false)
  })
})
