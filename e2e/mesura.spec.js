import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'

// Medida: un profesor crea el modo (por la API de la consola) y un alumno
// acierta cada tipo (escribiendo a veces con punto de miles: "2.500").
test.describe('Mesura', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea un modo: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = [
    'mesura-longitud',
    'mesura-massa',
    'mesura-capacitat',
    'mesura-superficie',
    'mesura-volum',
    'mesura-temps',
    'mesura-comparar',
    'mesura-escala',
  ]
  const EXP = {
    km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3,
    t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3,
    kl: 3, hl: 2, dal: 1, l: 0, dl: -1, cl: -2, ml: -3,
    'km²': 6, 'hm²': 4, ha: 4, 'dam²': 2, 'm²': 0, 'dm²': -2, 'cm²': -4, 'mm²': -6,
  }
  const VOLUM = { 'm³': 9, 'dm³': 6, 'cm³': 3, 'mm³': 0 }
  const LITRES = { 'm³': 3, 'dm³': 0, 'cm³': -3 }
  const S = { h: 3600, min: 60, s: 1, dies: 86400 }
  const nombre = (t) => Number(t.replace(/\./g, '').replace(',', '.'))
  const escriure = (n) => String(Math.round(n * 1e6) / 1e6).replace('.', ',')
  const segons = (t) => [...t.matchAll(/([\d,]+) (h|min|s|dies)/g)].reduce((s, [, n, u]) => s + nombre(n) * S[u], 0)

  // { tipo, resposta }
  function resoldre(t) {
    let m
    if ((m = t.match(/^([\d.,]+) (\S+) {2}☐ {2}([\d.,]+) (\S+)$/))) {
      const a = nombre(m[1]) * 10 ** EXP[m[2]]
      const b = nombre(m[3]) * 10 ** EXP[m[4]]
      return { tipo: 'comparar', resposta: Math.abs(a - b) < 1e-9 * Math.max(a, b) ? '=' : a < b ? '<' : '>' }
    }
    const ns = (t.match(/\d[\d.]*(,\d+)?/g) ?? []).map(nombre)
    if (t.startsWith('Un mapa')) return { tipo: 'escala', resposta: escriure((ns[2] * ns[1]) / 100000) }
    if (t.startsWith('En un plànol')) return { tipo: 'escala', resposta: escriure((ns[2] * ns[1]) / 100) }
    if (t.startsWith('Una habitació')) return { tipo: 'escala', resposta: escriure((ns[0] * 100) / ns[2]) }
    if (t.startsWith('En un mapa')) return { tipo: 'escala', resposta: escriure((ns[1] * 100000) / ns[0]) }
    if ((m = t.match(/^([\d.,]+) (\S+) = \? (\S+)$/)) && !(m[2] in S)) {
      const [, n, a, b] = m
      const [ea, eb] = a in VOLUM && b in VOLUM ? [VOLUM[a], VOLUM[b]] : [LITRES[a] ?? EXP[a], LITRES[b] ?? EXP[b]]
      const valor = nombre(n) * 10 ** (ea - eb)
      const tipo = /[²]|ha/.test(a + b) ? 'superficie' : /³/.test(a + b) ? 'volum' : /g|^t$/.test(a) ? 'massa' : /l$/.test(a) ? 'capacitat' : 'longitud'
      // Las grandes, con punto de miles (como las escribiría un niño)
      const resposta = valor >= 1000 && Number.isInteger(valor) ? valor.toLocaleString('de-DE') : escriure(valor)
      return { tipo, resposta }
    }
    const [esq, dre] = t.split(' = ')
    const unitat = dre.match(/\? (h|min|s|dies)/)[1]
    return { tipo: 'temps', resposta: escriure((segons(esq) - segons(dre.replace(/\? \S+/, ''))) / S[unitat]) }
  }

  test('el profesor crea el modo y un alumno acierta cada tipo', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const mates = contingut.cursos.find((c) => c.slug === '6-primaria').asignaturas.find((a) => a.slug === 'matematiques')
    const res = await page.request.post(`/api/admin/assignatures/${mates.id}/modes`, {
      data: { nombre: 'Mesura', slug: 'mesura-e2e', operaciones: TIPOS, params: { 'mesura-longitud': { decimals: 0, salts: 2 } }, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/matematiques/mesura-e2e')
    const vistos = new Set()
    for (let i = 0; i < 80 && vistos.size < 8; i++) {
      const enunciat = page.locator('.zona-exercici [data-enunciat]').first()
      await expect(enunciat).toBeVisible()
      const t = (await enunciat.getAttribute('data-enunciat')).trim()
      const { tipo, resposta } = resoldre(t)
      vistos.add(tipo)
      if ((await page.locator('.opciones button').count()) > 0) {
        await page.getByRole('button', { name: resposta, exact: true }).click()
      } else {
        await page.locator('.ejercicio input').fill(resposta)
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.correcto'), `${t} → ${resposta}`).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(8)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
