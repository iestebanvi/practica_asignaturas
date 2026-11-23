import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Fracciones: un profesor crea el modo (por la API de la consola) y un alumno
// acierta cada tipo; las fracciones se responden con las dos casillas.
test.describe('Fraccions', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = [
    'fraccio-dibuix', 'fraccio-equivalent', 'fraccio-simplificar', 'fraccio-comparar',
    'fraccio-quantitat', 'fraccio-suma', 'fraccio-resta', 'fraccio-decimal',
  ]
  const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b))
  const simple = (n, d) => [n / mcd(n, d), d / mcd(n, d)]
  const frac = (t) => t.split('/').map(Number)

  async function entrar(page) {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    return contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
  }

  // { tipo, fraccio: [n, d] | undefined, text: string | undefined } según la pantalla
  async function resoldre(page) {
    const dibuix = page.locator('.fraccio-dibuix')
    if (await dibuix.count()) {
      return { tipo: 'dibuix', fraccio: [Number(await dibuix.getAttribute('data-pintades')), Number(await dibuix.getAttribute('data-parts'))] }
    }
    const t = (await page.locator('.zona-exercici [data-enunciat]').first().getAttribute('data-enunciat')).trim()
    let m
    if ((m = t.match(/^(\d+)\/(\d+) = (\?|\d+)\/(\?|\d+)$/))) {
      const [a, b] = [Number(m[1]), Number(m[2])]
      return { tipo: 'equivalent', text: String(m[3] === '?' ? (a * Number(m[4])) / b : (b * Number(m[3])) / a) }
    }
    if ((m = t.match(/^Simplifica (\d+)\/(\d+)$/))) return { tipo: 'simplificar', fraccio: simple(Number(m[1]), Number(m[2])) }
    if (t.includes('☐')) {
      const [[a, b], [c, d]] = t.split('☐').map((x) => frac(x.trim()))
      const dif = a * d - c * b
      return { tipo: 'comparar', text: dif < 0 ? '<' : dif > 0 ? '>' : '=' }
    }
    if ((m = t.match(/^(\d+)\/(\d+) de (\d+)$/))) return { tipo: 'quantitat', text: String((Number(m[3]) / Number(m[2])) * Number(m[1])) }
    if ((m = t.match(/^(\d+)\/(\d+) ([+-]) (\d+)\/(\d+)$/))) {
      const [a, b, op, c, d] = [Number(m[1]), Number(m[2]), m[3], Number(m[4]), Number(m[5])]
      const n = op === '+' ? a * d + c * b : a * d - c * b
      return { tipo: op === '+' ? 'suma' : 'resta', fraccio: simple(n, b * d) }
    }
    const [n, d] = frac(t)
    return { tipo: 'decimal', text: String(Math.round((n / d) * 1e6) / 1e6).replace('.', ',') }
  }

  test('el profesor crea el modo y un alumno acierta cada tipo (fracciones con dos casillas)', async ({ page }) => {
    const mates = await entrar(page)
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Fraccions', slug: 'fraccions-e2e', operaciones: TIPOS, params: { 'fraccio-suma': { denominadorMax: 12 } }, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/fraccions-e2e')
    const vistos = new Set()
    for (let i = 0; i < 70 && vistos.size < 8; i++) {
      await expect(page.locator('.zona-exercici .enunciado').first()).toBeVisible()
      const { tipo, fraccio, text } = await resoldre(page)
      vistos.add(tipo)
      if (fraccio) {
        await page.getByLabel('Numerador').fill(String(fraccio[0]))
        await page.getByLabel('Denominador').fill(String(fraccio[1]))
        await page.getByRole('button', { name: 'Comprova' }).click()
      } else if ((await page.locator('.opciones button').count()) > 0) {
        await page.getByRole('button', { name: text, exact: true }).click()
      } else {
        await page.locator('.ejercicio input').fill(text)
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(8)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })

  test('en las sumas vale una equivalente sin simplificar; en "Simplifica", no', async ({ page }) => {
    const mates = await entrar(page)
    await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Fraccions sumes', slug: 'fraccions-sumes-e2e', operaciones: ['fraccio-suma'], activo: true },
    })
    await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Fraccions simplificar', slug: 'fraccions-simp-e2e', operaciones: ['fraccio-simplificar'], activo: true },
    })

    await page.goto('/6-primaria/matematiques/fraccions-sumes-e2e')
    const { fraccio } = await resoldre(page)
    await page.getByLabel('Numerador').fill(String(fraccio[0] * 3))
    await page.getByLabel('Denominador').fill(String(fraccio[1] * 3))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()

    await page.goto('/6-primaria/matematiques/fraccions-simp-e2e')
    const s = await resoldre(page)
    await page.getByLabel('Numerador').fill(String(s.fraccio[0] * 2))
    await page.getByLabel('Denominador').fill(String(s.fraccio[1] * 2))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toHaveText(`Gairebé... la resposta era ${s.fraccio[0]}/${s.fraccio[1]}`)
  })
})
