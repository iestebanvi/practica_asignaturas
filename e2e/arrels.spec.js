import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Arrels quadrades: un profesor crea el modo desde la consola (aquí, por la
// API) y un alumno lo juega. Se responde bien a cada tipo de ejercicio.
test.describe('Arrels quadrades', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 90_000 })

  const TIPOS = ['arrel-exacta', 'arrel-quadrat', 'quadrat-perfecte', 'arrel-entera', 'arrel-imatge', 'costat-quadrat']

  // Respuesta correcta según lo que hay en pantalla.
  async function respuestaCorrecta(page) {
    const opciones = page.locator('.opciones button')
    const texto = (await page.locator('.zona-exercici .enunciado').first().innerText()).trim()
    const numeros = (texto.match(/\d+/g) ?? []).map(Number)
    if ((await opciones.count()) > 0) {
      if (texto.includes('quadrat perfecte')) return Number.isInteger(Math.sqrt(numeros[0])) ? 'Sí' : 'No'
      const n = Math.floor(Math.sqrt(numeros[0]))
      return `${n} i ${n + 1}` // "Entre quins dos nombres està √50?"
    }
    if (texto.includes('quadrets')) return String(Math.sqrt(numeros[0])) // cuadrícula
    if (texto.includes('té') && texto.includes('d\'àrea')) return String(Math.sqrt(numeros[0])) // costat d'un quadrat
    return String(Math.sqrt(Math.max(...numeros))) // √144, "Quin nombre…", "Si 13² = 169…"
  }

  test('el profesor crea el modo y un alumno acierta cada tipo de ejercicio', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Arrels quadrades', slug: 'arrels-e2e', color: '#c2185b', operaciones: TIPOS, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/arrels-e2e')
    const vistos = new Set()
    for (let i = 0; i < 40 && vistos.size < 5; i++) {
      await expect(page.locator('.zona-exercici .enunciado').first()).toBeVisible()
      const texto = await page.locator('.zona-exercici .enunciado').first().innerText()
      vistos.add(
        texto.startsWith('√') ? 'exacta'
          : texto.includes('quadrat perfecte') ? 'perfecte'
          : texto.includes('Entre quins') ? 'entera'
          : texto.includes('quadrets') ? 'imatge'
          : texto.includes("d'àrea") ? 'costat'
          : 'quadrat',
      )
      const correcta = await respuestaCorrecta(page)
      if ((await page.locator('.opciones button').count()) > 0) {
        await page.getByRole('button', { name: correcta, exact: true }).click()
      } else {
        await page.locator('input[type="number"]').fill(correcta)
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBeGreaterThanOrEqual(5)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
