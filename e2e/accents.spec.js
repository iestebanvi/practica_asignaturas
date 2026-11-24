import { test, expect } from '@playwright/test'
import { PASSWORD_E2E } from './entorno.js'
import { analitzar, posicio, diftongsIHiats, RAONS } from '../frontend/src/logic/accents.js'
import { PARAULES, DIERESI } from '../frontend/src/logic/accentsParaules.js'

// Accents (Català): un profesor crea la asignatura y el modo (por la API de
// la consola) y un alumno acierta cada tipo.
test.describe('Català: accents', () => {
  test.skip(({ baseURL }) => !/localhost|127\.0\.0\.1/.test(baseURL), 'crea contenido: solo contra el entorno e2e local')
  test.describe.configure({ timeout: 120_000 })

  const TIPOS = [
    'cat-tonica',
    'cat-classifica',
    'cat-sillabes',
    'cat-diftong-hiat',
    'cat-diftong-tipus',
    'cat-escriptura',
    'cat-obert-tancat',
    'cat-per-que',
    'cat-dieresi',
  ]
  const PER_PARAULA = new Map(PARAULES.map((p) => [analitzar(p).paraula, analitzar(p)]))
  const BEN_ESCRITES = new Set([...PER_PARAULA.keys(), ...DIERESI.map(([bona]) => bona)])

  // { tipo, resposta }
  function resoldre(t, opcions) {
    const a = PER_PARAULA.get(t.match(/«(.+)»/)?.[1])
    if (t.startsWith('Quina és la síl·laba tònica')) return { tipo: 'tonica', resposta: a.sillabes[a.tonica] }
    if (t.startsWith('Com se separa')) return { tipo: 'sillabes', resposta: a.sillabes.join('-') }
    if (t.startsWith('El diftong')) return { tipo: 'diftong-tipus', resposta: diftongsIHiats(a).diftongs[0] }
    if (t.includes('hi ha…')) return { tipo: 'diftong-hiat', resposta: diftongsIHiats(a).hiats ? 'un hiat' : 'un diftong' }
    if (t.endsWith('és…')) return { tipo: 'classifica', resposta: posicio(a) }
    if (t.startsWith('Quin accent porta?')) {
      const buit = t.split(' ').at(-1)
      return { tipo: 'obert-tancat', resposta: opcions.find((o) => BEN_ESCRITES.has(buit.replace('_', o))) }
    }
    if (t.startsWith('Per què')) {
      const r = a.ambAccent
        ? { aguda: RAONS.agudaAmb, plana: RAONS.planaAmb, esdrúixola: RAONS.esdruixola }[posicio(a)]
        : { aguda: RAONS.agudaSense, plana: RAONS.planaSense }[posicio(a)]
      return { tipo: 'per-que', resposta: r }
    }
    // "Quina paraula està ben escrita?" (accent o dièresi)
    const bona = opcions.find((o) => BEN_ESCRITES.has(o))
    return { tipo: DIERESI.some(([b, d]) => opcions.includes(b) && opcions.includes(d)) ? 'dieresi' : 'escriptura', resposta: bona }
  }

  test('el profesor crea Català › Accents y un alumno acierta cada tipo', async ({ page }) => {
    await page.goto('/profesorat')
    await page.getByLabel('Contrasenya').fill(PASSWORD_E2E)
    await page.getByRole('button', { name: 'Entra' }).click()
    await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
    const contingut = await (await page.request.get('/api/admin/contingut')).json()
    const curs = contingut.cursos.find((c) => c.slug === '6-primaria')
    let catala = curs.asignaturas.find((a) => a.slug === 'catala-e2e')
    if (!catala) {
      const r = await page.request.post(`/api/admin/cursos/${curs.id}/assignatures`, {
        data: { nombre: 'Català', slug: 'catala-e2e', icono: '✏️', color: '#ffa726', activo: true },
      })
      expect(r.status()).toBe(201)
      catala = await r.json()
    }
    const res = await page.request.post(`/api/admin/assignatures/${catala.id}/modes`, {
      data: { nombre: 'Accents', slug: 'accents-e2e', operaciones: TIPOS, activo: true },
    })
    expect(res.status()).toBe(201)

    await page.goto('/6-primaria/catala-e2e/accents-e2e')
    const vistos = new Set()
    for (let i = 0; i < 120 && vistos.size < 9; i++) {
      const enunciat = page.locator('.zona-exercici [data-enunciat]').first()
      await expect(enunciat).toBeVisible()
      const t = (await enunciat.getAttribute('data-enunciat')).trim()
      const opcions = (await page.locator('.opciones button').allInnerTexts()).map((o) => o.trim())
      const { tipo, resposta } = resoldre(t, opcions)
      vistos.add(tipo)
      await page.getByRole('button', { name: resposta, exact: true }).click()
      await expect(page.locator('.feedback.correcto'), `${t} → ${resposta}`).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    expect(vistos.size).toBe(9)
    await expect(page.locator('.comptador-errors')).toHaveText('0')
  })
})
