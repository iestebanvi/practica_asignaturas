import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Operaciones combinadas: un profesor crea el modo (por la API de la consola)
// y un alumno las resuelve respetando la prioridad y los paréntesis.
test.describe('Operacions combinades', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  // Calcula la expresión con la prioridad de siempre (× ÷ antes que + -)
  const calcula = (text) => Function(`return (${text.replace(/×/g, '*').replace(/÷/g, '/')})`)()

  test('con y sin paréntesis: el alumno acierta y "Anterior" muestra la operación', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Combinades', slug: 'combinades-e2e', operaciones: ['combinada', 'combinada-parentesi'], activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/combinades-e2e')
    let ambParentesis = 0
    let sense = 0
    for (let i = 0; i < 12; i++) {
      const enunciado = page.locator('.zona-exercici .enunciado')
      await expect(enunciado).toBeVisible()
      const text = (await enunciado.innerText()).replace(/\s*=\s*$/, '').trim()
      if (text.includes('(')) ambParentesis++
      else sense++
      const resultat = calcula(text)
      await page.locator('.ejercicio input').fill(String(resultat))
      await page.getByRole('button', { name: 'Comprova' }).click()
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.anterior')).toContainText(`${text} = ${resultat}`)
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(ambParentesis + sense).toBe(12)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
