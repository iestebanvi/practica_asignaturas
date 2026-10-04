import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bancoProblemas = JSON.parse(
  readFileSync(
    path.join(__dirname, '..', 'backend', 'src', 'data', 'problemas-6primaria.json'),
    'utf-8',
  ),
)
const respuestasProblemas = new Map(bancoProblemas.map((p) => [p.enunciado, p.respuesta]))

const bancoVocabulario = JSON.parse(
  readFileSync(
    path.join(__dirname, '..', 'backend', 'src', 'data', 'vocabulario-ingles-6primaria.json'),
    'utf-8',
  ),
)
const traduccionesVocabulario = new Map(bancoVocabulario.map((p) => [p.ingles, p.catalan]))

function respuestaCorrecta(enunciado) {
  if (respuestasProblemas.has(enunciado)) {
    return respuestasProblemas.get(enunciado)
  }
  const [a, op, b] = enunciado.replace('=', '').trim().split(' ')
  const operaciones = {
    '+': (x, y) => x + y,
    '-': (x, y) => x - y,
    '×': (x, y) => x * y,
    '÷': (x, y) => x / y,
  }
  return operaciones[op](Number(a), Number(b))
}

function puntosEsperados(enunciado) {
  if (respuestasProblemas.has(enunciado)) return 20
  const op = enunciado.split(' ')[1]
  return op === '+' || op === '-' ? 10 : 15
}

async function entrarEnAritmetica(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Matemáticas' }).click()
  await page.getByRole('button', { name: 'Aritmética' }).click()
}

async function entrarEnProblemas(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Matemáticas' }).click()
  await page.getByRole('button', { name: 'Problemas' }).click()
}

async function entrarEnVocabulario(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Inglés' }).click()
  // exact:true porque también existe el botón "Vocabulario escrito"
  await page.getByRole('button', { name: 'Vocabulario', exact: true }).click()
}

async function entrarEnVocabularioEscrito(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Inglés' }).click()
  await page.getByRole('button', { name: 'Vocabulario escrito' }).click()
}

async function entrarEnSumasRestas(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Matemáticas' }).click()
  await page.getByRole('button', { name: 'Sumas y restas' }).click()
}

async function entrarEnMultiplicacionesDivisiones(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Matemáticas' }).click()
  await page.getByRole('button', { name: 'Multiplicaciones y divisiones' }).click()
}

async function entrarEnGramatica(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Mayor/ }).click()
  await page.getByRole('button', { name: 'Inglés' }).click()
  await page.getByRole('button', { name: 'Gramática' }).click()
}

async function entrarEnPeque(page, modoNombre) {
  await page.goto('/')
  await page.getByRole('button', { name: /Peque/ }).click()
  await page.getByRole('button', { name: modoNombre }).click()
}

async function leerHoraCorrecta(page) {
  const aria = await page.locator('.reloj').getAttribute('aria-label')
  const [, hora, minuto] = aria.match(/las (\d+) y (\d+) minutos/)
  return `${hora}:${minuto.padStart(2, '0')}`
}

test.describe('Practica Asignaturas', () => {
  test('Peque se muestra todo en mayúsculas; Mayor no', async ({ page }) => {
    await entrarEnPeque(page, 'Sumas')
    await expect(page.locator('.pantalla')).toHaveCSS('text-transform', 'uppercase')

    await entrarEnAritmetica(page)
    await expect(page.locator('.pantalla')).toHaveCSS('text-transform', 'none')
  })

  test('Peque - Sumas: solo genera sumas', async ({ page }) => {
    await entrarEnPeque(page, 'Sumas')
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toContain('+')
    expect(enunciado).not.toContain('-')
  })

  test('Peque - Restas: solo genera restas', async ({ page }) => {
    await entrarEnPeque(page, 'Restas')
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toContain('-')
    expect(enunciado).not.toContain('+')
  })

  test('Peque - Horas: muestra el reloj y 4 opciones; acertar suma puntos', async ({ page }) => {
    await entrarEnPeque(page, 'Horas')
    await expect(page.locator('.reloj')).toBeVisible()
    await expect(page.locator('.opciones button')).toHaveCount(4)

    const correcta = await leerHoraCorrecta(page)
    await page.getByRole('button', { name: correcta, exact: true }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 10')
    await expect(page.locator('.anterior')).toHaveText('Anterior: ✓ correcto')
  })

  test('Peque - Horas: fallar muestra la hora correcta en el panel "Anterior"', async ({ page }) => {
    await entrarEnPeque(page, 'Horas')

    const correcta = await leerHoraCorrecta(page)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ✗ tu respuesta (${incorrecta}) — la correcta era ${correcta}`,
    )
  })

  test('Peque ve una celebración animada al acertar', async ({ page }) => {
    await entrarEnPeque(page, 'Sumas')

    const enunciado = await page.locator('.enunciado').innerText()
    const [a, , b] = enunciado.replace('=', '').trim().split(' ')
    const respuesta = Number(a) + Number(b)

    await page.locator('input[type="number"]').fill(String(respuesta))
    await page.getByRole('button', { name: 'COMPROBAR' }).click()

    await expect(page.locator('.celebracion')).toBeVisible()
    await expect(page.locator('.celebracion')).not.toHaveText('')
  })

  test('el input recupera el foco automáticamente tras fallar una respuesta (Peque)', async ({ page }) => {
    await entrarEnPeque(page, 'Sumas')

    const enunciado = page.locator('.enunciado')
    const input = page.locator('input[type="number"]')
    const textoAnterior = await enunciado.innerText()

    await input.fill('999999')
    await page.getByRole('button', { name: 'COMPROBAR' }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    await expect(enunciado).not.toHaveText(textoAnterior, { timeout: 3000 })
    await expect(input).toBeFocused()
  })

  test('las pantallas de asignatura y de modo permiten volver atrás', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Mayor/ }).click()
    await expect(page.getByRole('button', { name: 'Matemáticas' })).toBeVisible()

    await page.getByRole('button', { name: 'Matemáticas' }).click()
    await expect(page.getByRole('button', { name: 'Aritmética' })).toBeVisible()

    await page.getByRole('button', { name: '← Volver' }).click()
    await expect(page.getByRole('button', { name: 'Matemáticas' })).toBeVisible()

    await page.getByRole('button', { name: '← Volver' }).click()
    await expect(page.getByRole('button', { name: /Peque/ })).toBeVisible()
  })

  test('modo Aritmética: nunca genera problemas, y flujo completo hasta el resumen', async ({ page }) => {
    await entrarEnAritmetica(page)

    const enunciado = await page.locator('.enunciado').innerText()
    expect(respuestasProblemas.has(enunciado)).toBe(false)

    const input = page.locator('input[type="number"]')
    await input.fill(String(respuestaCorrecta(enunciado)))
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalizar' }).click()

    await expect(page.locator('.resumen')).toBeVisible()
    await expect(page.locator('.puntos-totales')).toHaveText(`${puntosEsperados(enunciado)} puntos`)
    await expect(page.locator('.detalle')).toHaveText('Aciertos: 1 · Fallos: 0')
  })

  test('modo Aritmética: el panel "Anterior" muestra la operación y la solución tras fallar', async ({
    page,
  }) => {
    await entrarEnAritmetica(page)

    const enunciadoInicial = await page.locator('.enunciado').innerText()
    const enunciadoSinIgual = enunciadoInicial.replace(/\s*=$/, '')
    const respuesta = respuestaCorrecta(enunciadoInicial)
    const respuestaDada = respuesta + 1000

    await page.locator('input[type="number"]').fill(String(respuestaDada))
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    // Tras el auto-avance al siguiente ejercicio, el panel "Anterior" debe seguir visible
    await expect(page.locator('.enunciado')).not.toHaveText(enunciadoInicial, { timeout: 3000 })
    const anterior = page.locator('.anterior')
    await expect(anterior).toHaveClass(/incorrecto/)
    await expect(anterior).toHaveText(
      `Anterior: ${enunciadoSinIgual} = ${respuesta} ✗ (pusiste ${respuestaDada})`,
    )
  })

  test('modo Problemas: todas las preguntas vienen del banco curado y valen 20 puntos', async ({ page }) => {
    await entrarEnProblemas(page)

    const enunciado = page.locator('.enunciado')
    const texto = await enunciado.innerText()
    expect(respuestasProblemas.has(texto)).toBe(true)
    await expect(enunciado).toHaveClass(/enunciado-problema/)

    const input = page.locator('input[type="number"]')
    await input.fill(String(respuestaCorrecta(texto)))
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalizar' }).click()
    await expect(page.locator('.puntos-totales')).toHaveText('20 puntos')
  })

  test('modo Problemas: el panel "Anterior" es breve y no repite el enunciado', async ({ page }) => {
    await entrarEnProblemas(page)

    const texto = await page.locator('.enunciado').innerText()
    const respuesta = respuestasProblemas.get(texto)

    await page.locator('input[type="number"]').fill('-1')
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await expect(page.locator('.enunciado')).not.toHaveText(texto, { timeout: 3000 })
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ✗ tu respuesta (-1) — la correcta era ${respuesta}`,
    )
  })

  test('modo Vocabulario: muestra la palabra en inglés y 4 opciones en catalán; acertar suma puntos', async ({
    page,
  }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    expect(traduccionesVocabulario.has(palabra)).toBe(true)
    await expect(page.locator('.opciones button')).toHaveCount(4)

    const correcta = traduccionesVocabulario.get(palabra)
    await page.getByRole('button', { name: correcta, exact: true }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 10')
    await expect(page.locator('.anterior')).toHaveText(`Anterior: ${palabra} = ${correcta} ✓`)
  })

  test('modo Vocabulario: fallar muestra la traducción correcta en el panel "Anterior"', async ({ page }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ${palabra} = ${correcta} ✗ (pusiste ${incorrecta})`,
    )
  })

  test('modo Gramática: sin contenido todavía, muestra un aviso en vez de romperse', async ({ page }) => {
    await entrarEnGramatica(page)

    await expect(page.getByText('Todavía no hay ejercicios de gramática')).toBeVisible()
    await expect(page.locator('.enunciado')).toHaveCount(0)

    await page.getByRole('button', { name: '← Volver' }).click()
    await expect(page.getByRole('button', { name: 'Vocabulario', exact: true })).toBeVisible()
  })

  test('un fallo de vocabulario se guarda en "Para repasar"', async ({ page }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalizar' }).click()
    await page.getByRole('button', { name: /Para repasar/ }).click()

    await expect(page.locator('.lista-repasar li')).toHaveCount(1)
    await expect(page.locator('.repasar-enunciado')).toHaveText(palabra)
    await expect(page.locator('.repasar-respuesta')).toHaveText(correcta)
    await expect(page.locator('.repasar-veces')).toHaveText('×1')
  })

  test('"Para repasar" es accesible desde la pantalla de modo, y "Vaciar lista" borra los fallos', async ({
    page,
  }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)
    await page.getByRole('button', { name: incorrecta, exact: true }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalizar' }).click()
    await page.getByRole('button', { name: 'Elegir otro perfil' }).click()

    // Desde la pantalla de modo (sin jugar) también se accede a "Para repasar"
    await page.getByRole('button', { name: /Mayor/ }).click()
    await page.getByRole('button', { name: 'Inglés' }).click()
    await page.getByRole('button', { name: /Para repasar/ }).click()
    await expect(page.locator('.lista-repasar li')).toHaveCount(1)

    await page.getByRole('button', { name: 'Vaciar lista' }).click()
    await expect(page.getByText('¡Todavía no has fallado nada!')).toBeVisible()
  })

  test('Matemáticas - Sumas y restas: nunca genera multiplicaciones ni divisiones', async ({ page }) => {
    await entrarEnSumasRestas(page)
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toMatch(/[+-]/)
    expect(enunciado).not.toMatch(/[×÷]/)
  })

  test('Matemáticas - Multiplicaciones y divisiones: nunca genera sumas ni restas', async ({ page }) => {
    await entrarEnMultiplicacionesDivisiones(page)
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toMatch(/[×÷]/)
    expect(enunciado).not.toMatch(/[+-]/)
  })

  test('Vocabulario (selección): el botón de audio está disponible junto a la palabra en inglés', async ({
    page,
  }) => {
    await entrarEnVocabulario(page)
    await expect(page.locator('.boton-audio')).toBeVisible()
  })

  test('Vocabulario: el botón de audio no rompe la página al pulsarlo', async ({ page }) => {
    const erroresConsola = []
    page.on('pageerror', (e) => erroresConsola.push(e.message))

    await entrarEnVocabulario(page)
    await page.locator('.boton-audio').click()
    await page.waitForTimeout(200)

    expect(erroresConsola).toEqual([])
  })

  test('Vocabulario escrito: pide a veces inglés y a veces catalán, y acepta mayúsculas/minúsculas distintas', async ({
    page,
  }) => {
    await entrarEnVocabularioEscrito(page)

    const instruccion = await page.locator('.instruccion').innerText()
    const pideIngles = instruccion.includes('inglés')
    const enunciado = await page.locator('.enunciado').innerText()

    const primeraAlternativa = (texto) => texto.split(',')[0].trim()
    const entrada = pideIngles
      ? bancoVocabulario.find((p) => p.catalan === enunciado)
      : bancoVocabulario.find((p) => p.ingles === enunciado)
    const respuesta = pideIngles
      ? primeraAlternativa(entrada.ingles).toLowerCase()
      : primeraAlternativa(entrada.catalan).toUpperCase()

    // Antes de responder, el audio solo debe estar si el inglés ya es visible
    // (es decir, si NO toca escribirlo)
    await expect(page.locator('.boton-audio')).toHaveCount(pideIngles ? 0 : 1)

    await page.locator('input[type="text"]').fill(respuesta)
    await page.getByRole('button', { name: 'Comprobar' }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 15')
    // Tras responder, el audio ya está disponible siempre (el inglés queda revelado)
    await expect(page.locator('.boton-audio')).toBeVisible()
  })

  test('Vocabulario escrito: un fallo también se guarda en "Para repasar"', async ({ page }) => {
    await entrarEnVocabularioEscrito(page)

    await page.locator('input[type="text"]').fill('xxxxxxxx')
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalizar' }).click()
    await page.getByRole('button', { name: /Para repasar/ }).click()
    await expect(page.locator('.lista-repasar li')).toHaveCount(1)
  })
})
