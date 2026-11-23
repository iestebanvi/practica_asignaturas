import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Dificultad por modo: el profesor la configura en la ficha del modo y el
// alumno recibe números dentro de esos límites.
test.describe('Dificultat per mode', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea datos: solo contra el entorno e2e local')
  test.describe.configure({ mode: 'serial', timeout: 90_000 })
  let modoId

  async function entrar(page) {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
  }

  // Lee los números de los ejercicios que van saliendo (respondiendo 0).
  async function numerosDeEjercicios(page, cuantos) {
    const vistos = []
    for (let i = 0; i < cuantos; i++) {
      const texto = await page.locator('.zona-exercici .enunciado').first().innerText()
      vistos.push(texto.match(/\d+/g).map(Number))
      await page.locator('input[type="number"]').fill('0')
      await page.getByRole('button', { name: 'Comprova' }).click()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    return vistos
  }

  test('preparar: curso y modo de prueba (multiplicaciones, sin parámetros)', async ({ page }) => {
    await entrar(page)
    const api = async (ruta, data) => (await page.request.post(`/api/admin${ruta}`, { data })).json()
    const curso = await api('/cursos', { nombre: 'Dificultat E2E', slug: 'dificultat-e2e', activo: true })
    const asig = await api(`/cursos/${curso.id}/assignatures`, { nombre: 'Mates', slug: 'mates', activo: true })
    const modo = await api(`/assignatures/${asig.id}/modes`, {
      nombre: 'Càlcul', slug: 'calcul', operaciones: ['multiplicacion'], activo: true,
    })
    modoId = modo.id
  })

  test('el profesor pone "solo la tabla del 7" en la consola y al alumno solo le salen multiplicaciones por 7', async ({ page }) => {
    await entrar(page)
    await page.goto(`/profesorat/consola/mode/${modoId}`)
    const fitxa = page.locator('.consola-fitxa')
    await expect(fitxa.getByText('Dificultat (opcional)')).toBeVisible()
    await fitxa.getByLabel('Multiplicacions: Només aquestes taules (p. ex. 2, 5, 10)').fill('7')
    await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(fitxa.getByRole('status')).toHaveText('Desat.')

    await page.goto('/dificultat-e2e/mates/calcul')
    for (const [a, b] of await numerosDeEjercicios(page, 8)) {
      expect(a === 7 || b === 7).toBe(true)
      expect(Math.max(a, b)).toBeLessThanOrEqual(10)
    }
  })

  test('cifras de cada factor: 3 × 2', async ({ page }) => {
    await entrar(page)
    await page.goto(`/profesorat/consola/mode/${modoId}`)
    const fitxa = page.locator('.consola-fitxa')
    await fitxa.getByLabel('Multiplicacions: Només aquestes taules (p. ex. 2, 5, 10)').fill('')
    await fitxa.getByLabel('Multiplicacions: Xifres del primer factor').fill('3')
    await fitxa.getByLabel('Multiplicacions: Xifres del segon factor').fill('2')
    await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(fitxa.getByRole('status')).toHaveText('Desat.')

    await page.goto('/dificultat-e2e/mates/calcul')
    for (const [a, b] of await numerosDeEjercicios(page, 6)) {
      expect([String(a).length, String(b).length]).toEqual([3, 2])
    }
  })

  test('un valor fuera de rango o una combinación sin sentido se rechaza con un mensaje', async ({ page }) => {
    await entrar(page)
    await page.goto(`/profesorat/consola/mode/${modoId}`)
    const fitxa = page.locator('.consola-fitxa')
    await fitxa.getByLabel('Multiplicacions: Només aquestes taules (p. ex. 2, 5, 10)').fill('2, 5')
    await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(fitxa.getByRole('alert')).toContainText('o bé les xifres o bé les taules')

    await fitxa.getByLabel('Multiplicacions: Només aquestes taules (p. ex. 2, 5, 10)').fill('')
    await fitxa.getByLabel('Multiplicacions: Xifres del primer factor').fill('9')
    await fitxa.locator('.form-pregunta').getByRole('button', { name: 'Desa', exact: true }).click()
    await expect(fitxa.getByRole('alert')).toContainText('entre 1 i 4')
  })

  test('los campos solo salen para los tipos marcados que tienen parámetros', async ({ page }) => {
    await entrar(page)
    await page.goto(`/profesorat/consola/mode/${modoId}`)
    const fitxa = page.locator('.consola-fitxa')
    await fitxa.getByRole('checkbox', { name: 'Hores (rellotge)' }).check()
    await expect(fitxa.getByLabel(/^Hores \(rellotge\):/)).toHaveCount(0)
    await fitxa.getByRole('checkbox', { name: 'Sumes', exact: true }).check()
    await expect(fitxa.getByLabel('Sumes: Nombre màxim')).toBeVisible()
    await fitxa.getByRole('checkbox', { name: 'Multiplicacions', exact: true }).uncheck()
    await expect(fitxa.getByLabel(/^Multiplicacions:/)).toHaveCount(0)
  })
})
