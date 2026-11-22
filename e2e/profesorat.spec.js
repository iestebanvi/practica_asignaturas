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
      await expect(page.getByText(/6 cursos · 16 modes · 7 bancs · 273 preguntes/)).toBeVisible()
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

  test.describe('editar preguntas (solo sobre los bancos de prueba E2E)', () => {
    // En serie: comparten bancos y cuentan preguntas.
    test.describe.configure({ mode: 'serial' })

    async function abrirBanco(page, nombre) {
      await page.goto('/profesorat')
      await page.getByLabel('Contrasenya').fill(PASSWORD)
      await page.getByRole('button', { name: 'Entra' }).click()
      await page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: new RegExp(nombre) }).click()
      await expect(page.locator('.consola-fitxa').getByRole('heading', { name: nombre })).toBeVisible()
      return page.locator('.consola-fitxa')
    }
    const fila = (fitxa, texto) => fitxa.locator('tbody tr', { hasText: texto })
    const publicas = async (request, slug) =>
      (await (await request.get(`/api/bancos/${slug}/preguntas`)).json()).preguntas

    test('traducción: añadir una palabra (con aviso si lleva "/") y verla en la API de alumnos y en el menú', async ({ page, request }) => {
      const fitxa = await abrirBanco(page, 'E2E traducció')
      const menu = page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /E2E traducció/ })
      await expect(menu).toContainText('2/2')

      await fitxa.getByRole('button', { name: '+ Afegeix pregunta' }).click()
      await fitxa.getByLabel('Paraula en anglès').fill('CAT/S')
      await expect(fitxa.getByText(/no sortirà a «Vocabulari escrit»/)).toBeVisible()
      await fitxa.getByLabel('Paraula en anglès').fill('CAT')
      await expect(fitxa.getByText(/no sortirà a «Vocabulari escrit»/)).toHaveCount(0)
      await fitxa.getByLabel('Traducció al català').fill('gat, moix')
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()

      await expect(fila(fitxa, 'CAT')).toContainText('gat, moix')
      await expect(menu).toContainText('3/3')
      expect((await publicas(request, 'e2e-traduccio')).map((p) => p.enunciado)).toContain('CAT')
    })

    test('numérica: el servidor rechaza una respuesta que no es un número, y acepta la coma decimal', async ({ page }) => {
      const fitxa = await abrirBanco(page, 'E2E numèrica')
      await fitxa.getByRole('button', { name: '+ Afegeix pregunta' }).click()
      await fitxa.getByLabel('Enunciat del problema').fill('La meitat de 7?')
      await fitxa.getByLabel('Resposta (número)').fill('tres i mig')
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()
      await expect(fitxa.getByRole('alert')).toHaveText('La resposta ha de ser un número.')

      await fitxa.getByLabel('Resposta (número)').fill('3,5')
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()
      await expect(fila(fitxa, 'La meitat de 7?')).toContainText('3.5')
    })

    test('opción múltiple: editar opciones y marcar la correcta con el círculo', async ({ page, request }) => {
      const fitxa = await abrirBanco(page, 'E2E opcions')
      await fila(fitxa, 'There ___ a castle.').getByRole('button', { name: 'Edita' }).click()
      await fitxa.getByRole('button', { name: '+ opció' }).click()
      await fitxa.getByLabel('Opció 3', { exact: true }).fill('were')
      await fitxa.getByLabel('L’opció 3 és la correcta').check()
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()

      await expect(fila(fitxa, 'There ___ a castle.')).toContainText('is · are · were')
      const [pregunta] = await publicas(request, 'e2e-opcions')
      expect(pregunta).toMatchObject({ respuesta: 'were', opciones: ['is', 'are', 'were'] })

      // Opciones repetidas: error del servidor, no se guarda
      await fila(fitxa, 'There ___ a castle.').getByRole('button', { name: 'Edita' }).click()
      await fitxa.getByLabel('Opció 2', { exact: true }).fill('is')
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()
      await expect(fitxa.getByRole('alert')).toHaveText('Hi ha opcions repetides.')
      await fitxa.getByRole('button', { name: 'Cancel·la' }).click()
      await expect(fila(fitxa, 'There ___ a castle.')).toContainText('is · are · were')
    })

    test('solo se edita una cosa a la vez: abrir "Edita" cierra el formulario de pregunta nueva', async ({ page }) => {
      const fitxa = await abrirBanco(page, 'E2E opcions')
      await fitxa.getByRole('button', { name: '+ Afegeix pregunta' }).click()
      await expect(fitxa.locator('.pregunta-nova')).toBeVisible()
      await fila(fitxa, 'There ___ a castle.').getByRole('button', { name: 'Edita' }).click()
      await expect(fitxa.locator('.pregunta-nova')).toHaveCount(0)
      await expect(fitxa.locator('.form-pregunta')).toHaveCount(1)
    })

    test('desactivar oculta la pregunta a los alumnos; borrar pide confirmación', async ({ page, request }) => {
      const fitxa = await abrirBanco(page, 'E2E traducció')
      await fila(fitxa, 'HOUSE').getByRole('button', { name: 'Desactiva' }).click()
      await expect(fila(fitxa, 'HOUSE')).toContainText('inactiva')
      expect((await publicas(request, 'e2e-traduccio')).map((p) => p.enunciado)).not.toContain('HOUSE')
      await fila(fitxa, 'HOUSE').getByRole('button', { name: 'Activa', exact: true }).click()
      await expect(fila(fitxa, 'HOUSE')).not.toContainText('inactiva')

      await fila(fitxa, 'TREE').getByRole('button', { name: 'Esborra' }).click()
      await expect(fila(fitxa, 'TREE')).toContainText('Segur que vols esborrar-la?')
      await fila(fitxa, 'TREE').getByRole('button', { name: 'No', exact: true }).click()
      await expect(fila(fitxa, 'TREE')).toHaveCount(1)

      await fila(fitxa, 'TREE').getByRole('button', { name: 'Esborra' }).click()
      await fila(fitxa, 'TREE').getByRole('button', { name: 'Sí, esborra' }).click()
      await expect(fila(fitxa, 'TREE')).toHaveCount(0)
      expect((await publicas(request, 'e2e-traduccio')).map((p) => p.enunciado)).not.toContain('TREE')
    })

    test('el buscador filtra por enunciado, respuesta u opciones, sin distinguir acentos', async ({ page }) => {
      const fitxa = await abrirBanco(page, 'Vocabulari anglès')
      await expect(fitxa.locator('tbody tr')).toHaveCount(157)
      await fitxa.getByLabel('Cerca…').fill('ESMORZAR')
      await expect(fitxa.locator('tbody tr')).toHaveCount(1)
      await expect(fitxa.locator('tbody tr')).toContainText('BREAKFAST')
      await fitxa.getByLabel('Cerca…').fill('zzzz')
      await expect(fitxa.getByText('Cap pregunta coincideix amb la cerca.')).toBeVisible()
    })
  })
})
