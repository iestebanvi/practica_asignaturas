import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Récords personales y del curso. Usa "Estimacions" de 6è, que no usa ningún
// otro test para guardar bloques, con bloques de 30 (se fijan en el modo al
// empezar); los bloques se envían directamente a la API con la sesión del àlies.
test.describe('Rècords', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'solo contra el entorno e2e local')
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const estimacions = contingut.cursos
      .find((c) => c.slug === '6-primaria')
      .asignaturas.find((a) => a.slug === 'matematiques')
      .modos.find((m) => m.slug === 'estimacions')
    expect((await page.request.patch(`/api/admin/modes/${estimacions.id}`, { data: { bloc: 30 } })).status()).toBe(200)
    await page.close()
  })

  async function aliesAmbBloc(page, alies, puntos, aciertos) {
    await page.goto('/6-primaria')
    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    const d = page.getByRole('dialog')
    await d.getByLabel(/El teu àlies/i).fill(alies)
    await d.getByRole('button', { name: /Continua/i }).click()
    await d.getByRole('button', { name: /Sí, crea/i }).click()
    await d.getByRole('button', { name: /Ja l’he apuntat/i }).click()
    const res = await page.request.post('/api/alumnes/blocs', {
      data: { curs: '6-primaria', assignatura: 'matematiques', mode: 'estimacions', puntos, aciertos, preguntas: 30 },
    })
    expect(res.status()).toBe(201)
  }

  test('el récord propio sale en la tarjeta del modo y en el panel del juego', async ({ page, browser }) => {
    const altre = await browser.newPage()
    await aliesAmbBloc(altre, 'Segona', 300, 22)
    await altre.close()
    await aliesAmbBloc(page, 'Primera', 330, 25)

    await page.goto('/6-primaria/matematiques')
    await expect(page.getByRole('link', { name: /Estimacions/ })).toContainText('⭐ 330')
    // Un modo sin bloques no enseña récord
    await expect(page.getByRole('link', { name: /Successions/ })).not.toContainText('⭐')

    await page.goto('/6-primaria/matematiques/estimacions')
    await expect(page.locator('.record-panell')).toHaveText('El teu rècord: 330 punts · 25/30')
    await page.goto('/6-primaria/matematiques/successions')
    await expect(page.locator('.record-panell')).toHaveText('El teu rècord: encara cap bloc complet.')
  })

  test('sin àlies no hay récord en tarjetas ni panel', async ({ page }) => {
    await page.goto('/6-primaria/matematiques')
    await expect(page.getByRole('link', { name: /Estimacions/ })).not.toContainText('⭐')
    await page.goto('/6-primaria/matematiques/estimacions')
    await expect(page.locator('.record-panell')).toHaveCount(0)
  })

  test('rècords del curs: ordenados, con medallas y el àlies propio resaltado', async ({ page }) => {
    await aliesAmbBloc(page, 'Tercera', 100, 8)
    await page.goto('/6-primaria')
    await page.getByRole('link', { name: '🏆 Rècords del curs' }).click()
    await expect(page).toHaveURL(/\/6-primaria\/records$/)
    const mode = page.getByRole('article', { name: 'Estimacions' })
    await expect(mode.locator('tbody tr')).toHaveText([/🥇\s*Primera\s*330\s*25\/30/, /🥈\s*Segona\s*300\s*22\/30/, /🥉\s*Tercera \(tu\)\s*100\s*8\/30/])
    await expect(mode.locator('tr.es-meu')).toContainText('Tercera')
    await expect(page.getByRole('article', { name: 'Successions' })).toContainText('Encara no hi ha rècords')
  })

  test('el resumen de una partida enlaza a los récords de ese modo', async ({ page }) => {
    await page.goto('/6-primaria/matematiques/estimacions')
    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: /Rècords d’aquest mode/ }).click()
    await expect(page).toHaveURL(/\/6-primaria\/records#matematiques-estimacions$/)
    await expect(page.getByRole('article', { name: 'Estimacions' })).toBeInViewport()
  })

  test('el profesor puede desactivar los récords del curso: desaparecen enlace y pantalla', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /6è de primària/ }).click()
    const fitxa = page.locator('.consola-fitxa')
    const casilla = fitxa.getByLabel(/Mostra els rècords del curs/)
    await expect(casilla).toBeChecked()
    await casilla.uncheck()
    await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(fitxa.getByRole('status')).toHaveText('Desat.')

    try {
      await page.goto('/6-primaria')
      await expect(page.getByRole('link', { name: /Matemàtiques/ })).toBeVisible()
      await expect(page.getByRole('link', { name: '🏆 Rècords del curs' })).toHaveCount(0)
      await page.goto('/6-primaria/records')
      await expect(page.getByText('No hem trobat aquesta pàgina.')).toBeVisible()
    } finally {
      await page.goto('/profesorat/consola')
      await page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /6è de primària/ }).click()
      await fitxa.getByLabel(/Mostra els rècords del curs/).check()
      await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
      await expect(fitxa.getByRole('status')).toHaveText('Desat.')
    }
  })
})
