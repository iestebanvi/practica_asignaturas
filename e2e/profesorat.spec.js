import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

// La contraseña real solo está en backend/.env (y en Railway): se lee de ahí
// en local. Contra producción (u otra máquina sin .env) estos tests se saltan.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
function leerPassword() {
  try {
    const env = readFileSync(path.join(__dirname, '..', 'backend', '.env'), 'utf-8')
    return env.match(/^TEACHER_PASSWD=(.*)$/m)?.[1].trim() || null
  } catch {
    return null
  }
}
const PASSWORD = leerPassword()

test.describe('Consola del professorat', () => {
  test.skip(({ baseURL }) => !PASSWORD || !/localhost|127\.0\.0\.1/.test(baseURL), 'solo en local con backend/.env')

  test('se llega desde el pie de inicio; login, consola y cerrar sesión', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Professorat' }).click()
    await expect(page).toHaveURL('/profesorat')

    await page.getByLabel('Contrasenya').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page).toHaveURL('/profesorat/consola')
    await expect(page.getByRole('heading', { name: 'Consola del professorat' })).toBeVisible()
    await expect(page.getByText(/Sessió iniciada fins al/)).toBeVisible()

    // La sesión se mantiene al recargar, y /profesorat redirige a la consola
    await page.reload()
    await expect(page.getByRole('button', { name: 'Tanca la sessió' })).toBeVisible()
    await page.goto('/profesorat')
    await expect(page).toHaveURL('/profesorat/consola')

    await page.getByRole('button', { name: 'Tanca la sessió' }).click()
    await expect(page).toHaveURL('/profesorat')
    await page.goto('/profesorat/consola')
    await expect(page).toHaveURL('/profesorat')
  })

  test('con una contraseña incorrecta muestra el error y no entra', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill('no-es-aquesta')
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('alert')).toHaveText('La contrasenya no és correcta.')
    await expect(page).toHaveURL('/profesorat')
    await expect(page.getByLabel('Contrasenya')).toHaveValue('')
  })

  test('sin sesión, cualquier ruta de la consola lleva al login', async ({ page }) => {
    await page.goto('/profesorat/consola/qualsevol-cosa')
    await expect(page).toHaveURL('/profesorat')
    await expect(page.getByLabel('Contrasenya')).toBeVisible()
  })

  test('la cookie de sesión no es accesible desde JavaScript', async ({ page, context }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page).toHaveURL('/profesorat/consola')

    expect(await page.evaluate(() => document.cookie)).not.toContain('sessio_professorat')
    const cookie = (await context.cookies()).find((c) => c.name === 'sessio_professorat')
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api/admin' })
  })
})
