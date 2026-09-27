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
  await page.getByRole('button', { name: 'Vocabulario' }).click()
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
})
