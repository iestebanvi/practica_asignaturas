import { test, expect } from '@playwright/test'

// Bloques de preguntas. 1r de primària tiene bloques de 10 (config del curso):
// así se completa uno rápido con "Sumes".
test.describe('Blocs de preguntes', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'solo contra el entorno e2e local')
  // Cada respuesta tarda ~1 s (pausa del feedback) y aquí se responden decenas.
  test.describe.configure({ timeout: 90_000 })

  // Responde una suma de 1r (bien o mal) y espera a que pase a la siguiente.
  async function respondreSuma(page, bien) {
    const enunciado = await page.locator('.enunciado').innerText()
    const [a, , b] = enunciado.replace('=', '').trim().split(' ')
    const correcta = Number(a) + Number(b)
    await page.locator('input[type="number"]').fill(String(bien ? correcta : correcta + 100))
    await page.getByRole('button', { name: /Comprova/i }).click()
    await expect(page.locator('.feedback')).toHaveCount(0)
  }

  async function crearAlies(page, curso, alies) {
    await page.goto(`/${curso}`)
    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    const d = page.getByRole('dialog')
    await d.getByLabel(/El teu àlies/i).fill(alies)
    await d.getByRole('button', { name: /Continua/i }).click()
    await d.getByRole('button', { name: /Sí, crea/i }).click()
    await d.getByRole('button', { name: /Ja l’he apuntat/i }).click()
  }

  test('sin àlies: el marcador cuenta el bloque y al completarlo invita a entrar con un àlies', async ({ page }) => {
    await page.goto('/1-primaria/matematiques/sumes')
    await expect(page.locator('.marcador-bloc')).toHaveText('Bloc 1 · 0/10')
    for (let i = 0; i < 9; i++) await respondreSuma(page, true)
    await expect(page.locator('.marcador-bloc')).toHaveText('Bloc 1 · 9/10')
    await respondreSuma(page, true)
    await expect(page.locator('.avis-bloc')).toHaveText(
      'Bloc completat: 100 punts · 10/10 · Entra amb el teu àlies per guardar-ho.',
    )
    await expect(page.locator('.marcador-bloc')).toHaveText('Bloc 2 · 0/10')
  })

  test('con àlies: el primer bloque es récord; uno peor muestra el récord; el resumen lista los bloques', async ({ page }) => {
    await crearAlies(page, '1-primaria', 'Sumador')
    await page.goto('/1-primaria/matematiques/sumes')

    for (let i = 0; i < 10; i++) await respondreSuma(page, i < 8)
    await expect(page.locator('.avis-bloc')).toHaveText('Bloc completat: 80 punts · 8/10 · Nou rècord! 🏆')
    await expect(page.locator('.avis-bloc')).toHaveClass(/es-record/)

    for (let i = 0; i < 10; i++) await respondreSuma(page, i < 5)
    await expect(page.locator('.avis-bloc')).toHaveText('Bloc completat: 50 punts · 5/10 · El teu rècord: 80 punts')

    // 3 preguntas de un bloque incompleto: no cuentan
    for (let i = 0; i < 3; i++) await respondreSuma(page, true)
    await page.getByRole('button', { name: /Finalitza/i }).click()
    const blocs = page.getByRole('region', { name: /Blocs d’aquesta partida/i })
    await expect(blocs.locator('li')).toHaveText(['Bloc 1: 80 punts · 8/10 · el millor ⭐', 'Bloc 2: 50 punts · 5/10'])
    await expect(blocs).toContainText('Les 3 últimes preguntes eren d’un bloc incomplet i no compten.')
  })

  test('el récord se guarda: en otra partida, un bloque peor ya no es récord', async ({ page }) => {
    await crearAlies(page, '1-primaria', 'Constant')
    await page.goto('/1-primaria/matematiques/sumes')
    for (let i = 0; i < 10; i++) await respondreSuma(page, true)
    await expect(page.locator('.avis-bloc')).toContainText('Nou rècord!')

    await page.reload()
    for (let i = 0; i < 10; i++) await respondreSuma(page, i < 9)
    await expect(page.locator('.avis-bloc')).toHaveText('Bloc completat: 90 punts · 9/10 · El teu rècord: 100 punts')
  })

  test('sin ningún bloque completo, el resumen lo explica', async ({ page }) => {
    await page.goto('/6-primaria/matematiques/aritmetica')
    await expect(page.locator('.marcador-bloc')).toHaveText('Bloc 1 · 0/30')
    await page.getByRole('button', { name: 'Finalitza' }).click()
    await expect(page.getByText('Encara no has completat cap bloc de 30 preguntes')).toBeVisible()
  })
})
