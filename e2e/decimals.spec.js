import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Decimales: un profesor crea el modo (por la API de la consola) y un alumno
// acierta cada tipo de ejercicio, escribiendo las respuestas con coma.
test.describe('Decimals', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = [
    'decimal-posicio', 'decimal-comparar', 'decimal-extrem', 'decimal-arrodonir',
    'decimal-suma', 'decimal-resta', 'decimal-potencia10', 'decimal-per-natural',
  ]
  const num = (t) => Number(t.replace(/\./g, '').replace(',', '.'))
  const ambComa = (v) => String(Math.round(v * 1e6) / 1e6).replace('.', ',')

  // { tipo, respuesta } según lo que hay en pantalla.
  async function resoldre(page) {
    const texto = (await page.locator('.zona-exercici .enunciado').first().innerText()).replace(/\s*[=≈]\s*$/, '').trim()
    const opciones = await page.locator('.opciones button').allInnerTexts()
    let m
    if ((m = texto.match(/^En ([\d,]+), quina xifra hi ha a les (.+)\?$/))) {
      const [enter, part = ''] = m[1].split(',')
      const pos = { desenes: -1, unitats: 0, dècimes: 1, centèsimes: 2, 'mil·lèsimes': 3 }[m[2]]
      return { tipo: 'posicio', respuesta: pos > 0 ? part[pos - 1] : enter.padStart(2, '0')[1 + pos] }
    }
    if (texto.includes('☐')) {
      const [a, b] = texto.split('☐').map((t) => num(t.trim()))
      return { tipo: 'comparar', respuesta: a < b ? '<' : a > b ? '>' : '=' }
    }
    if (texto.startsWith('Quin és el nombre')) {
      const valors = opciones.map(num)
      const v = texto.includes('gran') ? Math.max(...valors) : Math.min(...valors)
      return { tipo: 'extrem', respuesta: opciones[valors.indexOf(v)] }
    }
    if ((m = texto.match(/^Arrodoneix ([\d,]+) a les (.+)$/))) {
      const u = { unitats: 1, dècimes: 0.1, centèsimes: 0.01 }[m[2]]
      return { tipo: 'arrodonir', respuesta: ambComa(Math.round(num(m[1]) / u + 1e-9) * u) }
    }
    const [a, op, b] = texto.split(' ')
    const [x, y] = [num(a), num(b)]
    const r = { '+': x + y, '-': x - y, '×': x * y, '÷': x / y }[op]
    const tipo = op === '+' ? 'suma' : op === '-' ? 'resta' : [10, 100, 1000].includes(y) ? 'potencia10' : 'per-natural'
    return { tipo, respuesta: ambComa(r) }
  }

  test('el profesor crea el modo y un alumno acierta cada tipo escribiendo con coma', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const params = Object.fromEntries(TIPOS.map((t) => [t, t === 'decimal-extrem' ? { xifresEnteres: 2 } : { decimals: 3, xifresEnteres: 2 }]))
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Decimals', slug: 'decimals-e2e', operaciones: TIPOS, params, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/decimals-e2e')
    const vistos = new Set()
    let ambComaEscrita = false
    for (let i = 0; i < 60 && vistos.size < 8; i++) {
      await expect(page.locator('.zona-exercici .enunciado').first()).toBeVisible()
      const { tipo, respuesta } = await resoldre(page)
      vistos.add(tipo)
      if ((await page.locator('.opciones button').count()) > 0) {
        await page.getByRole('button', { name: respuesta, exact: true }).click()
      } else {
        if (respuesta.includes(',')) ambComaEscrita = true
        await page.locator('.ejercicio input').fill(respuesta)
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(8)
    expect(ambComaEscrita).toBe(true)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })

  test('un fallo muestra la solución con coma, también en "Anterior"', async ({ page }) => {
    // Usa el modo creado en el test anterior si existe; si no, lo crea.
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Decimals sumes', slug: 'decimals-sumes-e2e', operaciones: ['decimal-suma'], activo: true },
    })
    await page.goto('/6-primaria/matematiques/decimals-sumes-e2e')
    const { respuesta } = await resoldre(page)
    await page.locator('.ejercicio input').fill('0,0001')
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toHaveText(`Gairebé... la resposta era ${respuesta}`)
    await expect(page.locator('.anterior')).toContainText(`= ${respuesta} ✗ (has posat 0,0001)`)
  })
})
