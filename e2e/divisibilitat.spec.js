import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Divisibilidad: un profesor crea el modo (por la API de la consola) y un
// alumno acierta cada tipo.
test.describe('Divisibilitat', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = ['div-multiple', 'div-seguent-multiple', 'div-divisor', 'div-criteris', 'div-primer', 'div-troba-primer']
  const esPrimer = (n) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d)
  const nums = (t) => (t.match(/\d+/g) ?? []).map(Number)

  // { tipo, resposta, opcio: bool }
  async function resoldre(page) {
    const t = (await page.locator('.zona-exercici .enunciado').first().innerText()).replace(/\s*=\s*$/, '').trim()
    const opcions = (await page.locator('.opciones button').allInnerTexts()).map((o) => o.trim())
    const [a, b] = nums(t)
    let m
    if ((m = t.match(/^És (\d+) múltiple de (\d+)\?$/))) return { tipo: 'multiple', resposta: a % b === 0 ? 'Sí' : 'No' }
    if (t.startsWith('Quin és el múltiple')) return { tipo: 'seguent', resposta: String(a + b) }
    if (t.includes('NO és divisor')) return { tipo: 'divisor', resposta: opcions.find((o) => a % Number(o) !== 0) }
    if (t.includes('és divisor')) return { tipo: 'divisor', resposta: opcions.find((o) => a % Number(o) === 0) }
    if (t.includes('divisible per')) return { tipo: 'criteris', resposta: a % b === 0 ? 'Sí' : 'No' }
    if (t.startsWith('És primer')) return { tipo: 'primer', resposta: esPrimer(a) ? 'Sí' : 'No' }
    return { tipo: 'troba-primer', resposta: opcions.find((o) => esPrimer(Number(o))) }
  }

  test('el profesor crea el modo y un alumno acierta cada tipo', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Divisibilitat', slug: 'divisibilitat-e2e', operaciones: TIPOS, params: { 'div-primer': { max: 200 } }, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/divisibilitat-e2e')
    const vistos = new Set()
    for (let i = 0; i < 60 && vistos.size < 6; i++) {
      await expect(page.locator('.zona-exercici .enunciado').first()).toBeVisible()
      const { tipo, resposta } = await resoldre(page)
      vistos.add(tipo)
      if ((await page.locator('.opciones button').count()) > 0) {
        await page.getByRole('button', { name: resposta, exact: true }).click()
      } else {
        await page.locator('.ejercicio input').fill(resposta)
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(6)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
