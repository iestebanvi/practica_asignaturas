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
      // El número de cursos varía: los tests de la 5d crean cursos en paralelo
      await expect(page.getByText(/\d+ cursos · 16 modes · 8 bancs · 274 preguntes/)).toBeVisible()
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

  test.describe('importar y exportar (sobre el banco de prueba E2E importar)', () => {
    test.describe.configure({ mode: 'serial' })

    async function abrirBanco(page, nombre) {
      await page.goto('/profesorat')
      await page.getByLabel('Contrasenya').fill(PASSWORD)
      await page.getByRole('button', { name: 'Entra' }).click()
      await page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: new RegExp(nombre) }).click()
      await expect(page.locator('.consola-fitxa').getByRole('heading', { name: nombre })).toBeVisible()
      return page.locator('.consola-fitxa')
    }

    test('pegar → revisar (correctas, errores y repetidas) → importar como inactivas', async ({ page, request }) => {
      const fitxa = await abrirBanco(page, 'E2E importar')
      const menu = page.getByRole('navigation', { name: 'Contingut' }).getByRole('link', { name: /E2E importar/ })
      await expect(menu).toContainText('1/1')

      await fitxa.getByRole('button', { name: 'Importa', exact: true }).click()
      const panel = fitxa.getByRole('region', { name: 'Importa preguntes' })
      await panel.getByLabel('Text a importar').fill(
        [
          'enunciat;correcta;incorrecta;incorrecta',
          'There ___ two dogs.;are;is;was',
          'there ___ a castle.;is;are',
          'Només dos camps;sí',
          'There ___ lots of trees.;are;is',
        ].join('\n'),
      )
      await panel.getByRole('button', { name: 'Revisa' }).click()
      await expect(panel.getByText('2 correctes · 1 amb errors · 1 repetides')).toBeVisible()
      await expect(panel.locator('tbody tr')).toHaveCount(4)
      await expect(panel.locator('tr.importacio-error')).toContainText('almenys 3 camps')
      await expect(panel.locator('tr.importacio-repetida')).toContainText('ja hi és')

      // Si se cambia el texto, hay que volver a revisar
      await panel.getByLabel('Text a importar').press('End')
      await panel.getByLabel('Text a importar').press('Space')
      await expect(panel.getByText('torna a revisar-lo')).toBeVisible()
      await expect(panel.getByRole('button', { name: /^Importa \d/ })).toHaveCount(0)
      await panel.getByRole('button', { name: 'Revisa' }).click()

      await panel.getByLabel('Importa-les com a inactives').check()
      await panel.getByRole('button', { name: 'Importa 2 preguntes' }).click()
      await expect(fitxa.getByRole('status')).toHaveText('S’han importat 2 preguntes.')
      await expect(fitxa.getByRole('region', { name: 'Importa preguntes' })).toHaveCount(0)
      await expect(fitxa.locator('tbody tr', { hasText: 'There ___ two dogs.' })).toContainText('inactiva')
      await expect(menu).toContainText('1/3')

      const { preguntas } = await (await request.get('/api/bancos/e2e-importar/preguntas')).json()
      expect(preguntas.map((p) => p.enunciado)).toEqual(['There ___ a castle.'])
    })

    test('importar desde un fichero', async ({ page }) => {
      const fitxa = await abrirBanco(page, 'E2E importar')
      await fitxa.getByRole('button', { name: 'Importa', exact: true }).click()
      const panel = fitxa.getByRole('region', { name: 'Importa preguntes' })
      await panel.getByLabel('O tria un fitxer').setInputFiles({
        name: 'preguntes.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('\uFEFFThere ___ a river.;was;were;is\r\n', 'utf-8'),
      })
      await expect(panel.getByLabel('Text a importar')).toHaveValue(/There ___ a river\./)
      await panel.getByRole('button', { name: 'Revisa' }).click()
      await panel.getByRole('button', { name: 'Importa 1 pregunta' }).click()
      await expect(fitxa.locator('tbody tr', { hasText: 'There ___ a river.' })).toContainText('was · were · is')
    })

    test('descargar el CSV del banco y la copia completa en JSON', async ({ page }) => {
      const fitxa = await abrirBanco(page, 'E2E importar')
      const [csv] = await Promise.all([page.waitForEvent('download'), fitxa.getByRole('link', { name: 'Descarrega CSV' }).click()])
      expect(csv.suggestedFilename()).toBe('e2e-importar.csv')
      const contenidoCsv = (await import('node:fs')).readFileSync(await csv.path(), 'utf-8')
      expect(contenidoCsv).toContain('enunciat;correcta;incorrecta;incorrecta')
      expect(contenidoCsv).toContain('There ___ a river.;was;were;is')

      await page.goto('/profesorat/consola')
      const [json] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link', { name: 'Descarrega còpia completa (JSON)' }).click(),
      ])
      expect(json.suggestedFilename()).toMatch(/^contingut-\d{4}-\d{2}-\d{2}\.json$/)
      const copia = JSON.parse((await import('node:fs')).readFileSync(await json.path(), 'utf-8'))
      expect(copia.cursos.map((c) => c.id)).toContain('6-primaria')
    })
  })

  test.describe('cursos y asignaturas (solo cursos de prueba creados aquí)', () => {
    test.describe.configure({ mode: 'serial' })

    async function entrar(page) {
      await page.goto('/profesorat')
      await page.getByLabel('Contrasenya').fill(PASSWORD)
      await page.getByRole('button', { name: 'Entra' }).click()
      await expect(page.getByRole('navigation', { name: 'Contingut' })).toBeVisible()
      return page.locator('.consola-fitxa')
    }
    const menu = (page) => page.getByRole('navigation', { name: 'Contingut' })

    test('crear un curso: se propone la adreça, se crea inactivo y los alumnos no lo ven', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: '+ Nou curs' }).click()
      await fitxa.getByLabel('Nom').fill('Prova E2E')
      await expect(fitxa.getByLabel('Adreça (part de la URL)')).toHaveValue('prova-e2e')
      await fitxa.getByLabel('Icona (un emoji)').fill('🧪')
      await fitxa.getByRole('radio', { name: 'Fàcil' }).check()
      await fitxa.getByLabel('Tot en majúscules').check()
      await fitxa.getByRole('button', { name: 'Crea' }).click()

      await expect(page).toHaveURL(/\/profesorat\/consola\/curs\/\d+$/)
      await expect(fitxa.getByRole('heading', { name: '🧪 Prova E2E' })).toBeVisible()
      await expect(fitxa.getByText('/prova-e2e')).toBeVisible()
      await expect(menu(page).getByRole('link', { name: /Prova E2E/ })).toContainText('inactiu')

      await page.goto('/')
      await expect(page.getByRole('link', { name: /6è de primària/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /Prova E2E/ })).toHaveCount(0)
    })

    test('una adreça repetida o reservada se rechaza en el propio campo', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: '+ Nou curs' }).click()
      await fitxa.getByLabel('Nom').fill('Un altre')
      await fitxa.getByLabel('Adreça (part de la URL)').fill('6-primaria')
      await fitxa.getByRole('button', { name: 'Crea' }).click()
      await expect(fitxa.getByRole('alert')).toHaveText('Ja hi ha un element amb aquesta adreça.')
      await fitxa.getByLabel('Adreça (part de la URL)').fill('profesorat')
      await fitxa.getByRole('button', { name: 'Crea' }).click()
      await expect(fitxa.getByRole('alert')).toContainText('reservat')
    })

    test('activar el curso: aviso de que no tiene asignaturas, y aparece en el inicio con ese mensaje', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: /Prova E2E/ }).click()
      await fitxa.getByLabel('Actiu (visible per als alumnes)').check()
      await fitxa.getByRole('button', { name: 'Desa', exact: true }).click()
      await expect(fitxa.getByRole('status')).toHaveText('Desat.')
      await expect(fitxa.getByText(/no té cap assignatura activa/)).toBeVisible()

      await page.goto('/')
      await page.getByRole('link', { name: /Prova E2E/ }).click()
      await expect(page.getByText('Encara no hi ha assignatures en aquest curs. Torna aviat!')).toBeVisible()
      // "Tot en majúscules" se aplica a la web del curso
      await expect(page.locator('.app')).toHaveClass(/peque/)
    })

    test('añadir una asignatura activa: aparece en el curso, todavía sin modos', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: /Prova E2E/ }).click()
      await fitxa.getByRole('button', { name: '+ Nova assignatura' }).click()
      await fitxa.getByLabel('Nom').last().fill('Música')
      await expect(fitxa.getByLabel('Adreça (part de la URL)')).toHaveValue('musica')
      await fitxa.getByLabel('Actiu (visible per als alumnes)').last().check()
      await fitxa.getByRole('button', { name: 'Crea' }).click()

      await expect(page).toHaveURL(/\/profesorat\/consola\/assignatura\/\d+$/)
      await expect(fitxa.getByText(/no té cap mode actiu/)).toBeVisible()
      await expect(fitxa.getByRole('button', { name: 'Esborra l’assignatura' })).toBeEnabled()

      await page.goto('/prova-e2e')
      await page.getByRole('link', { name: /Música/i }).click()
      await expect(page.getByText(/Encara no hi ha exercicis en aquesta assignatura/i)).toBeVisible()
    })

    test('reordenar: "Puja" cambia la posición en el menú; en el primero no se puede subir', async ({ page }) => {
      const fitxa = await entrar(page)
      const titulos = () => menu(page).getByRole('heading', { level: 2 }).allInnerTexts()
      const antes = await titulos()
      const i = antes.findIndex((t) => t.includes('Prova E2E'))
      await menu(page).getByRole('link', { name: /Prova E2E/ }).click()
      await fitxa.getByRole('button', { name: '↑ Puja' }).click()
      await expect.poll(async () => (await titulos()).findIndex((t) => t.includes('Prova E2E'))).toBe(i - 1)

      await menu(page).getByRole('link', { name: /1r de primària/ }).click()
      await expect(fitxa.getByRole('button', { name: '↑ Puja' })).toBeDisabled()
    })

    test('borrar solo si está vacío: primero la asignatura, después el curso', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: /Prova E2E/ }).click()
      await expect(fitxa.getByRole('button', { name: 'Esborra el curs' })).toBeDisabled()
      await expect(fitxa.getByText(/primer esborra’n les assignatures/)).toBeVisible()

      await fitxa.getByRole('link', { name: /Música/ }).click()
      await fitxa.getByRole('button', { name: 'Esborra l’assignatura' }).click()
      await fitxa.getByRole('button', { name: 'Sí, esborra' }).click()
      await expect(fitxa.getByRole('heading', { name: '🧪 Prova E2E' })).toBeVisible()

      await fitxa.getByRole('button', { name: 'Esborra el curs' }).click()
      await fitxa.getByRole('button', { name: 'Sí, esborra' }).click()
      await expect(page).toHaveURL(/\/profesorat\/consola$/)
      await expect(menu(page).getByRole('link', { name: /Prova E2E/ })).toHaveCount(0)
    })

    test('las fichas de 6è muestran sus asignaturas y no dejan borrarlo', async ({ page }) => {
      const fitxa = await entrar(page)
      await menu(page).getByRole('link', { name: /6è de primària/ }).click()
      await expect(fitxa.getByRole('link', { name: /Matemàtiques/ })).toContainText('Matemàtiques')
      await expect(fitxa.getByText('8 modes')).toBeVisible()
      await expect(fitxa.getByRole('button', { name: 'Esborra el curs' })).toBeDisabled()
    })
  })
})
