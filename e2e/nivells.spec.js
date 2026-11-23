import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Niveles dentro de un modo: el profesor añade el nivel 2 desde la consola,
// el alumno elige nivel y cada nivel guarda su propio récord.
test.describe('Nivells d’un mode', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea datos: solo contra el entorno e2e local')
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  const RUTA = '/6-primaria/matematiques/nivells-e2e'
  let modoId

  async function entrarConsola(page) {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
  }

  // Responde bien la operación que haya ("a + b" o "a - b")
  async function respondre(page) {
    const [a, op, b] = (await page.locator('.zona-exercici .enunciado').innerText()).replace('=', '').trim().split(' ')
    await page.locator('.ejercicio input').fill(String(op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.feedback')).toHaveCount(0)
  }

  test('el profesor añade el nivel 2 (otros tipos, abierto) desde la ficha del modo', async ({ page }) => {
    await entrarConsola(page)
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Nivells', slug: 'nivells-e2e', operaciones: ['suma'], bloc: 5, activo: true },
    })
    modoId = (await res.json()).id

    await page.goto(`/profesorat/consola/mode/${modoId}`)
    await page.getByRole('button', { name: '+ Afegeix el nivell 2' }).click()
    const nivell2 = page.getByRole('group', { name: 'Nivell 2', exact: true })
    // Empieza como el nivel 1 (Sumes) y cerrado: lo cambiamos a Restes y abierto
    await expect(nivell2.getByLabel('Sumes', { exact: true })).toBeChecked()
    await nivell2.getByLabel('Sumes', { exact: true }).uncheck()
    await nivell2.getByLabel('Restes', { exact: true }).check()
    await nivell2.getByLabel(/Obert/).check()
    await page.getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Desat.')

    const modo = (await (await page.request.get('/api/admin/contingut')).json()).cursos
      .flatMap((c) => c.asignaturas.flatMap((a) => a.modos))
      .find((m) => m.id === modoId)
    expect(modo.nivells).toEqual([{ operaciones: ['resta'], params: {}, obert: true }])
    await expect(page.getByRole('button', { name: '+ Afegeix el nivell 3' })).toBeVisible()
  })

  test('el alumno juega por defecto el nivel más alto y puede cambiar al 1', async ({ page }) => {
    await page.goto(RUTA)
    const selector = page.getByRole('navigation', { name: 'Tria el nivell' })
    await expect(selector.getByRole('link')).toHaveText(['Nivell 1', 'Nivell 2'])
    await expect(selector.getByRole('link', { name: 'Nivell 2' })).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('.zona-exercici .enunciado')).toContainText(' - ')

    await selector.getByRole('link', { name: 'Nivell 1' }).click()
    await expect(page).toHaveURL(/\?nivell=1$/)
    await expect(page.locator('.zona-exercici .enunciado')).toContainText(' + ')
  })

  test('cada nivel guarda su récord; la tarjeta y la página de récords lo muestran por nivel', async ({ page }) => {
    await page.goto('/6-primaria')
    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    const d = page.getByRole('dialog')
    await d.getByLabel(/El teu àlies/i).fill('Escaladora')
    await d.getByRole('button', { name: /Continua/i }).click()
    await d.getByRole('button', { name: /Sí, crea/i }).click()
    await d.getByRole('button', { name: /Ja l’he apuntat/i }).click()

    await page.goto(RUTA) // nivel 2
    for (let i = 0; i < 5; i++) await respondre(page)
    await expect(page.locator('.avis-bloc')).toContainText('Nou rècord!')
    await expect(page.locator('.record-panell')).toContainText('5/5')

    await page.goto(`${RUTA}?nivell=1`)
    await expect(page.locator('.record-panell')).toHaveText('El teu rècord: encara cap bloc complet.')

    await page.goto('/6-primaria/matematiques')
    await expect(page.getByRole('link', { name: /Nivells/ })).toContainText('Nivell 2 · ⭐')

    await page.goto('/6-primaria/records')
    await expect(page.getByRole('article', { name: 'Nivells · Nivell 2' }).locator('tbody tr')).toHaveText([/Escaladora/])
    await expect(page.getByRole('article', { name: 'Nivells · Nivell 1' })).toContainText('Encara no hi ha rècords')
  })

  test('si el profesor cierra el nivel 2, el selector desaparece y se juega el 1', async ({ page }) => {
    await entrarConsola(page)
    await page.goto(`/profesorat/consola/mode/${modoId}`)
    await page.getByRole('group', { name: 'Nivell 2', exact: true }).getByLabel(/Obert/).uncheck()
    await page.getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Desat.')

    // En la vista previa se pueden probar todos, también el cerrado
    await page.goto(`/profesorat/prova/${modoId}?nivell=2`)
    await expect(page.getByRole('navigation', { name: 'Tria el nivell' }).getByRole('link')).toHaveText(['Nivell 1', 'Nivell 2'])
    await expect(page.locator('.zona-exercici .enunciado')).toContainText(' - ')

    await page.goto(`${RUTA}?nivell=2`)
    await expect(page.getByRole('navigation', { name: 'Tria el nivell' })).toHaveCount(0)
    await expect(page.locator('.zona-exercici .enunciado')).toContainText(' + ')
  })
})
