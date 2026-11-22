import { test, expect } from '@playwright/test'
import { PASSWORD_E2E as PASSWORD } from './entorno.js'

// El backend de los e2e arranca con una contraseña de prueba (ver entorno.js),
// así que no hace falta la real. Contra producción estos tests se saltan.
test.describe('Consola del professorat', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'solo contra el entorno e2e local')

  test('se llega desde el pie de inicio; login, consola y cerrar sesión', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Professorat' }).click()
    await expect(page).toHaveURL(/\/profesorat$/)

    await page.getByLabel('Contrasenya').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page).toHaveURL(/\/profesorat\/consola$/)
    await expect(page.getByRole('heading', { name: 'Consola del professorat' })).toBeVisible()
    await expect(page.getByText(/Sessió iniciada fins al/)).toBeVisible()

    // La sesión se mantiene al recargar, y /profesorat redirige a la consola
    await page.reload()
    await expect(page.getByRole('button', { name: 'Tanca la sessió' })).toBeVisible()
    await page.goto('/profesorat')
    await expect(page).toHaveURL(/\/profesorat\/consola$/)

    await page.getByRole('button', { name: 'Tanca la sessió' }).click()
    await expect(page).toHaveURL(/\/profesorat$/)
    await page.goto('/profesorat/consola')
    await expect(page).toHaveURL(/\/profesorat$/)
  })

  test('con una contraseña incorrecta muestra el error y no entra', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill('no-es-aquesta')
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('alert')).toHaveText('La contrasenya no és correcta.')
    await expect(page).toHaveURL(/\/profesorat$/)
    await expect(page.getByLabel('Contrasenya')).toHaveValue('')
  })

  test('sin sesión, cualquier ruta de la consola lleva al login', async ({ page }) => {
    await page.goto('/profesorat/consola/qualsevol-cosa')
    await expect(page).toHaveURL(/\/profesorat$/)
    await expect(page.getByLabel('Contrasenya')).toBeVisible()
  })

  test('la cookie de sesión no es accesible desde JavaScript', async ({ page, context }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page).toHaveURL(/\/profesorat\/consola$/)

    expect(await page.evaluate(() => document.cookie)).not.toContain('sessio_professorat')
    const cookie = (await context.cookies()).find((c) => c.name === 'sessio_professorat')
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api/admin' })
  })

  test.describe('consola de solo lectura', () => {
    async function entrar(page) {
      await page.goto('/profesorat')
      await page.getByLabel('Contrasenya').fill(PASSWORD)
      await page.getByRole('button', { name: 'Entra' }).click()
      await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    }

    test('muestra el resumen y el árbol de cursos, asignaturas, modos y bancos', async ({ page }) => {
      await entrar(page)
      await expect(page.getByText(/6 cursos · 16 modes · 4 bancs · 269 preguntes/)).toBeVisible()
      const arbre = page.getByRole('navigation', { name: 'Contingut' })
      await expect(arbre.getByRole('heading', { name: /6è de primària/ })).toBeVisible()
      await expect(arbre.getByRole('heading', { name: /Anglès/ })).toBeVisible()
      // Los cursos sin contenido todavía están, marcados como inactivos
      await expect(arbre.getByRole('heading', { name: /3r de primària/ })).toContainText('inactiu')
      await expect(arbre.getByRole('link', { name: /Vocabulari anglès \(6è\)/ })).toContainText('157/157')
    })

    test('ficha de modo → su banco → tabla con todas las preguntas', async ({ page }) => {
      await entrar(page)
      const arbre = page.getByRole('navigation', { name: 'Contingut' })
      await arbre.getByRole('link', { name: 'Vocabulari escrit' }).click()

      const fitxa = page.locator('.consola-fitxa')
      await expect(fitxa.getByRole('heading', { name: 'Vocabulari escrit' })).toBeVisible()
      await expect(fitxa.getByText('/6-primaria/angles/vocabulari-escrit')).toBeVisible()
      await expect(fitxa.getByText('Vocabulari, escriure (del banc)')).toBeVisible()
      await expect(arbre.getByRole('link', { name: 'Vocabulari escrit' })).toHaveClass(/active/)

      await fitxa.getByRole('link', { name: /Vocabulari anglès \(6è\)/ }).click()
      await expect(page).toHaveURL(/\/profesorat\/consola\/banc\/\d+$/)
      await expect(fitxa.getByText('Traducció (anglès → català)')).toBeVisible()
      await expect(fitxa.getByText('157 actives de 157')).toBeVisible()
      await expect(fitxa.locator('tbody tr')).toHaveCount(157)
      // Los dos modos que comparten el banco
      await expect(fitxa.getByRole('link', { name: /Anglès › Vocabulari$/ })).toBeVisible()
      await expect(fitxa.getByRole('link', { name: /Anglès › Vocabulari escrit$/ })).toBeVisible()
    })

    test('lo inactivo aparece en el árbol, marcado como inactiu', async ({ page }) => {
      // Se simula con la respuesta de la API (los e2e corren en paralelo sobre
      // el mismo esquema: desactivar algo de verdad afectaría a otros tests).
      await page.route('**/api/admin/contingut', async (route) => {
        const contenido = await (await route.fetch()).json()
        contenido.cursos.find((c) => c.slug === '6-primaria').asignaturas[0].modos.find((m) => m.slug === 'potencies').activo = false
        await route.fulfill({ json: contenido })
      })
      await entrar(page)
      const potencies = page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /Potències/ })
      await expect(potencies).toContainText('inactiu')
      await potencies.click()
      await expect(page.locator('.consola-fitxa').getByText('inactiu')).toBeVisible()
      // Un modo inactivo no ofrece el enlace a la web (los alumnos no lo ven)
      await expect(page.getByRole('link', { name: 'Obre a la web ↗' })).toHaveCount(0)
    })

    test('un banco o modo inexistente muestra un aviso, sin romper la consola', async ({ page }) => {
      await entrar(page)
      await page.goto('/profesorat/consola/banc/999999')
      await expect(page.getByText('Aquest banc no existeix.')).toBeVisible()
      await page.goto('/profesorat/consola/mode/999999')
      await expect(page.getByText('Aquest mode no existeix.')).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    })
  })
})
