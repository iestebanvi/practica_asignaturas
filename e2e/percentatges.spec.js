import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Porcentajes y proporcionalidad: un profesor crea el modo (por la API de la
// consola) y un alumno acierta cada tipo, incluida la tabla.
test.describe('Percentatges i proporcionalitat', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = [
    'percentatge-quantitat', 'percentatge-quin', 'percentatge-descompte',
    'percentatge-equivalencia', 'proporcio-taula', 'proporcio-unitat',
  ]
  const num = (t) => Number(t.replace(',', '.'))
  const nums = (t) => (t.match(/\d+(,\d+)?/g) ?? []).map(num)
  const ambComa = (v) => String(Math.round(v * 1e6) / 1e6).replace('.', ',')
  const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b))

  // { tipo, text } o { tipo, fraccio: [n, d] } según lo que hay en pantalla
  async function resoldre(page) {
    const taula = page.locator('.taula-proporcio')
    if (await taula.count()) {
      const files = await taula.locator('tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent)))
      const col = files.findIndex((f) => f.includes('?')) === 0 ? files[0].indexOf('?') : files[1].indexOf('?')
      const fila = files[0].includes('?') ? 0 : 1
      const ref = col === 0 ? 1 : 0
      const rao = Number(files[1][ref]) / Number(files[0][ref])
      const v = fila === 1 ? Number(files[0][col]) * rao : Number(files[1][col]) / rao
      return { tipo: 'taula', text: String(Math.round(v)) }
    }
    const t = (await page.locator('.zona-exercici [data-enunciat]').first().getAttribute('data-enunciat')).trim()
    let m
    if ((m = t.match(/^(\d+) % de (\d+)$/))) return { tipo: 'quantitat', text: String((m[1] * m[2]) / 100) }
    if ((m = t.match(/^Quin percentatge de (\d+) és (\d+)\?$/))) return { tipo: 'quin', text: String((m[2] * 100) / m[1]) }
    if (t.includes('descompte')) {
      const [preu, p] = nums(t)
      return { tipo: 'descompte', text: String(t.endsWith('pagues?') ? preu - (preu * p) / 100 : (preu * p) / 100) }
    }
    if ((m = t.match(/^(\d+)\/(\d+) = \? %$/))) return { tipo: 'equivalencia', text: String((m[1] * 100) / m[2]) }
    if ((m = t.match(/^([\d,]+) = \? %$/))) return { tipo: 'equivalencia', text: String(Math.round(num(m[1]) * 100)) }
    if ((m = t.match(/^Escriu (\d+) % en nombre decimal$/))) return { tipo: 'equivalencia', text: ambComa(m[1] / 100) }
    if ((m = t.match(/^Escriu (\d+) % com a fracció$/))) {
      const p = Number(m[1])
      return { tipo: 'equivalencia', fraccio: [p / mcd(p, 100), 100 / mcd(p, 100)] }
    }
    // Reducción a la unidad: [a, total, b] o [total, a, b] según el contexto
    const [x, y, z] = nums(t)
    const llibretes = /^\d+ (llibretes|entrades)|^Amb/.test(t)
    return { tipo: 'unitat', text: String(llibretes ? (z * y) / x : (z * x) / y) }
  }

  test('el profesor crea el modo y un alumno acierta cada tipo', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: {
        nombre: 'Percentatges',
        slug: 'percentatges-e2e',
        operaciones: TIPOS,
        params: { 'percentatge-quantitat': { percentatges: [10, 25, 50], max: 100 } },
        activo: true,
      },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/percentatges-e2e')
    const vistos = new Set()
    let fraccio = false
    for (let i = 0; i < 70 && (vistos.size < 6 || !fraccio); i++) {
      await expect(page.locator('.zona-exercici [data-enunciat]').first()).toBeVisible()
      const r = await resoldre(page)
      vistos.add(r.tipo)
      if (r.tipo === 'quantitat') expect([10, 25, 50]).toContain(nums(await page.locator('[data-enunciat]').getAttribute('data-enunciat'))[0])
      if (r.fraccio) {
        fraccio = true
        await page.getByLabel('Numerador').fill(String(r.fraccio[0]))
        await page.getByLabel('Denominador').fill(String(r.fraccio[1]))
      } else {
        await page.locator('.ejercicio input').fill(r.text)
      }
      await page.getByRole('button', { name: 'Comprova' }).click()
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(6)
    expect(fraccio).toBe(true)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
