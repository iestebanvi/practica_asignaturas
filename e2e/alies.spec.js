import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Àlies de los alumnos. Cada test usa àlies propios (los tests corren en
// paralelo sobre el mismo esquema e2e).
test.describe('Àlies dels alumnes', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'solo contra el entorno e2e local')

  const dialeg = (page) => page.getByRole('dialog', { name: 'Entra amb el teu àlies' })

  // Crea un àlies desde la cabecera y devuelve su PIN.
  async function crearAlies(page, curso, alies) {
    await page.goto(`/${curso}`)
    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    await dialeg(page).getByLabel(/El teu àlies/i).fill(alies)
    await dialeg(page).getByRole('button', { name: /Continua/i }).click()
    await expect(dialeg(page)).toContainText(/és un àlies nou/i)
    await dialeg(page).getByRole('button', { name: /Sí, crea/i }).click()
    const pin = (await dialeg(page).locator('.pin-gran').innerText()).trim()
    expect(pin).toMatch(/^\d{4}$/)
    await dialeg(page).getByRole('button', { name: /Ja l’he apuntat/i }).click()
    await expect(dialeg(page)).toHaveCount(0)
    return pin
  }

  async function entrarConPin(page, curso, alies, pin) {
    await page.goto(`/${curso}`)
    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    await dialeg(page).getByLabel(/El teu àlies/i).fill(alies)
    await dialeg(page).getByRole('button', { name: /Continua/i }).click()
    await dialeg(page).getByLabel(/El teu PIN/i).fill(pin)
    await dialeg(page).getByRole('button', { name: 'Entra', exact: true }).click()
  }

  test('crear un àlies: se pregunta antes, se enseña el PIN una vez y la sesión se recuerda', async ({ page }) => {
    await crearAlies(page, '6-primaria', 'Exploradora')
    await expect(page.getByText('Hola, Exploradora!')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Hola, Exploradora!')).toBeVisible()
    // También en las demás pantallas del curso
    await page.goto('/6-primaria/matematiques/aritmetica')
    await expect(page.getByText('Hola, Exploradora!')).toBeVisible()
  })

  test('salir y volver a entrar con el PIN; el àlies se reconoce sin mayúsculas ni acentos', async ({ page }) => {
    const pin = await crearAlies(page, '6-primaria', 'Àguila')
    await page.getByRole('button', { name: 'Surt' }).click()
    await expect(page.getByRole('button', { name: /Entra amb el teu àlies/i })).toBeVisible()

    await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
    await dialeg(page).getByLabel(/El teu àlies/i).fill('AGUILA')
    await dialeg(page).getByRole('button', { name: /Continua/i }).click()
    await expect(dialeg(page)).toContainText('Hola de nou, Àguila!')
    await dialeg(page).getByLabel(/El teu PIN/i).fill(pin)
    await dialeg(page).getByRole('button', { name: 'Entra', exact: true }).click()
    await expect(page.getByText('Hola, Àguila!')).toBeVisible()
  })

  test('un PIN incorrecto muestra el error y no entra', async ({ page, context }) => {
    const pin = await crearAlies(page, '6-primaria', 'Tortuga')
    await context.clearCookies()
    const malo = pin === '0000' ? '0001' : '0000'
    await entrarConPin(page, '6-primaria', 'Tortuga', malo)
    await expect(dialeg(page).getByRole('alert')).toHaveText('El PIN no és correcte.')
    await expect(page.getByText('Hola, Tortuga!')).toHaveCount(0)
  })

  test('dos hermanos en el mismo dispositivo: cada curso recuerda su àlies', async ({ page }) => {
    await crearAlies(page, '1-primaria', 'Petit')
    await crearAlies(page, '6-primaria', 'Gran')
    await page.goto('/1-primaria')
    await expect(page.getByText(/Hola, Petit!/i)).toBeVisible()
    await page.goto('/6-primaria')
    await expect(page.getByText('Hola, Gran!')).toBeVisible()
  })

  test('sin àlies se juega igual que siempre', async ({ page }) => {
    await page.goto('/6-primaria/matematiques/aritmetica')
    await expect(page.getByRole('button', { name: /Entra amb el teu àlies/i })).toBeVisible()
    await expect(page.locator('.enunciado')).toBeVisible()
  })

  test('consola: el profesor ve el àlies, lo renombra, le da un PIN nuevo y lo borra', async ({ page, context }) => {
    const pinViejo = await crearAlies(page, '6-primaria', 'Mal Nom')
    await context.clearCookies()

    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /6è de primària/ }).click()
    const llista = page.getByRole('region', { name: 'Àlies dels alumnes' })
    const fila = () => llista.locator('tbody tr', { hasText: /Mal Nom|Bon Nom/ })
    await expect(fila()).toContainText('Mal Nom')

    await fila().getByRole('button', { name: 'Canvia el nom' }).click()
    await llista.getByLabel('El teu àlies').fill('Bon Nom')
    await llista.getByRole('button', { name: 'Desa' }).click()
    await expect(fila()).toContainText('Bon Nom')

    await fila().getByRole('button', { name: 'PIN nou' }).click()
    await fila().getByRole('button', { name: 'Sí, genera’l' }).click()
    const avis = await llista.getByRole('status').innerText()
    const pinNuevo = avis.match(/(\d{4})/)[1]

    // El alumno entra con el PIN nuevo (y el àlies nuevo)
    const alumne = await context.newPage()
    if (pinNuevo !== pinViejo) {
      await entrarConPin(alumne, '6-primaria', 'Bon Nom', pinViejo)
      await expect(dialeg(alumne).getByRole('alert')).toHaveText('El PIN no és correcte.')
    }
    await entrarConPin(alumne, '6-primaria', 'Bon Nom', pinNuevo)
    await expect(alumne.getByText('Hola, Bon Nom!')).toBeVisible()

    await fila().getByRole('button', { name: 'Esborra' }).click()
    await fila().getByRole('button', { name: 'Sí, esborra' }).click()
    await expect(fila()).toHaveCount(0)
    await alumne.reload()
    await expect(alumne.getByRole('button', { name: /Entra amb el teu àlies/i })).toBeVisible()
  })

  test('los fallos que guardaba el navegador pasan al àlies al entrar (también los del perfil antiguo)', async ({ page }) => {
    await page.goto('/6-primaria')
    await page.evaluate(() =>
      localStorage.setItem(
        'practica-asignaturas:fallos',
        JSON.stringify({
          '6-primaria': { vocabulario: { HOUSE: { enunciado: 'HOUSE', respuesta: 'casa', veces: 3 } } },
          mayor: { gramatica: { G: { enunciado: 'There ___ a cat.', respuesta: 'is', veces: 1 } } },
          pequeno: { hora: { 'Les 9:15': { enunciado: 'Les 9:15', respuesta: '9:15', veces: 2 } } },
        }),
      ),
    )
    await crearAlies(page, '6-primaria', 'Heretera')
    await page.goto('/6-primaria/repassar')
    await expect(page.locator('.lista-repasar li')).toHaveCount(2)
    await expect(page.locator('.lista-repasar li').first()).toContainText('HOUSE')
    await expect(page.locator('.lista-repasar li').first()).toContainText('×3')
    // Los de 1r (perfil "pequeno") se quedan en el navegador hasta que alguien entre en 1r
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem('practica-asignaturas:fallos')))
    expect(Object.keys(local)).toEqual(['pequeno'])
  })
})
