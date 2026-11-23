import { test, expect } from '@playwright/test'

// Las respuestas correctas se leen de la propia API (la BD), igual que la web.
let respuestasProblemas = new Map()
let bancoVocabulario = []
let traduccionesVocabulario = new Map()

test.beforeAll(async ({ request }) => {
  const preguntas = async (banco) => (await (await request.get(`/api/bancos/${banco}/preguntas`)).json()).preguntas
  // Las del banco que use el modo "Problemes" de 6è (el que sea en cada momento)
  const curso6 = await (await request.get('/api/cursos/6-primaria')).json()
  const bancoProblemes = curso6.asignaturas.find((a) => a.id === 'matematiques').modos.find((m) => m.id === 'problemes').banco
  respuestasProblemas = new Map((await preguntas(bancoProblemes)).map((p) => [p.enunciado, Number(p.respuesta)]))
  bancoVocabulario = await preguntas('vocabulari-angles-6')
  traduccionesVocabulario = new Map(bancoVocabulario.map((p) => [p.enunciado, p.respuesta]))
})

// Entra en un modo y espera a que esté listo: ahora el árbol del curso y las
// preguntas llegan de la API, así que hay un "Carregant…" previo durante el
// cual todavía no hay ejercicio (ni aviso) en pantalla.
async function irAModo(page, url) {
  await page.goto(url)
  await expect(page.locator('.zona-exercici, .practica-avis:not(:has-text("Carregant"))')).toBeVisible()
}

// "Per repassar" solo guarda fallos con àlies: crea uno nuevo (único) en el
// curso. Solo en el entorno e2e local: en producción no se crean àlies.
async function entrarAmbAliesNou(page, curso, baseURL) {
  test.skip(!/localhost|127\.0\.0\.1/.test(baseURL), 'crea un àlies: solo contra el entorno e2e local')
  await page.goto(`/${curso}`)
  await page.getByRole('button', { name: /Entra amb el teu àlies/i }).click()
  const dialeg = page.getByRole('dialog')
  await dialeg.getByLabel(/El teu àlies/i).fill(`Repàs ${Math.random().toString(36).slice(2, 8)}`)
  await dialeg.getByRole('button', { name: /Continua/i }).click()
  await dialeg.getByRole('button', { name: /Sí, crea/i }).click()
  await dialeg.getByRole('button', { name: /Ja l’he apuntat/i }).click()
}

function respuestaCorrecta(enunciado) {
  if (respuestasProblemas.has(enunciado)) {
    return respuestasProblemas.get(enunciado)
  }
  const [a, op, b] = enunciado.replace('=', '').trim().split(' ')
  const operaciones = {
    '+': (x, y) => x + y,
    '-': (x, y) => x - y,
    '×': (x, y) => x * y,
    '÷': (x, y) => x / y,
  }
  return operaciones[op](Number(a), Number(b))
}

function puntosEsperados(enunciado) {
  if (respuestasProblemas.has(enunciado)) return 20
  const op = enunciado.split(' ')[1]
  return op === '+' || op === '-' ? 10 : 15
}

async function entrarEnAritmetica(page) {
  await irAModo(page, '/6-primaria/matematiques/aritmetica')
}

async function entrarEnProblemas(page) {
  await irAModo(page, '/6-primaria/matematiques/problemes')
}

async function entrarEnVocabulario(page) {
  await irAModo(page, '/6-primaria/angles/vocabulari')
}

async function entrarEnVocabularioEscrito(page) {
  await irAModo(page, '/6-primaria/angles/vocabulari-escrit')
}

async function entrarEnThereBe(page) {
  await irAModo(page, '/6-primaria/angles/there-be')
}

async function entrarEnPotencies(page) {
  await irAModo(page, '/6-primaria/matematiques/potencies')
}

async function entrarEnSumasRestas(page) {
  await irAModo(page, '/6-primaria/matematiques/sumes-restes')
}

async function entrarEnMultiplicacionesDivisiones(page) {
  await irAModo(page, '/6-primaria/matematiques/multiplicacions-divisions')
}

async function entrarEnPerimetrosAreas(page) {
  await irAModo(page, '/6-primaria/matematiques/perimetres-arees')
}

// El aria-label de la figura lleva las medidas ("Rectangle de 8 cm de base i
// 3 cm d'altura"): con eso y el enunciado se calcula la respuesta correcta.
function respuestaDeFigura(aria, enunciado) {
  const n = (aria.match(/\d+/g) ?? []).map(Number)
  const esArea = enunciado.startsWith('Àrea')
  if (aria.startsWith('Quadrat')) return esArea ? n[0] * n[0] : 4 * n[0]
  if (aria.startsWith('Rectangle')) return esArea ? n[0] * n[1] : 2 * (n[0] + n[1])
  if (aria.startsWith('Triangle equilàter')) return 3 * n[0]
  if (aria.startsWith('Hexàgon')) return esArea ? 3 * n[0] * n[1] : 6 * n[0]
  if (aria.startsWith('Triangle de costats')) return n[0] + n[1] + n[2]
  if (aria.startsWith('Triangle')) return (n[0] * n[1]) / 2
  return n[0] * n[1] // paral·lelogram (solo área)
}

// Contesta (casi seguro mal) el ejercicio que haya en pantalla, sea de opciones o numérico
async function responderCualquierCosa(page) {
  if ((await page.locator('.opciones button').count()) > 0) {
    await page.locator('.opciones button').first().click()
  } else {
    await page.locator('input[type="number"]').fill('0')
    await page.getByRole('button', { name: 'Comprova' }).click()
  }
}

async function entrarEnGramatica(page) {
  await irAModo(page, '/6-primaria/angles/gramatica')
}

// 1r de primària: modoId es el slug de la URL (sumes, restes, hores)
async function entrarEnPeque(page, modoId) {
  await irAModo(page, `/1-primaria/matematiques/${modoId}`)
}

async function leerHoraCorrecta(page) {
  const aria = await page.locator('.reloj').getAttribute('aria-label')
  const [, hora, minuto] = aria.match(/les (\d+) i (\d+) minuts/)
  return `${hora}:${minuto.padStart(2, '0')}`
}

test.describe('Practica Assignatures', () => {
  test('1r se muestra todo en mayúsculas; 6è no', async ({ page }) => {
    await entrarEnPeque(page, 'sumes')
    await expect(page.locator('.pantalla')).toHaveCSS('text-transform', 'uppercase')

    await entrarEnAritmetica(page)
    await expect(page.locator('.pantalla')).toHaveCSS('text-transform', 'none')
  })

  test('Peque - Sumas: solo genera sumas', async ({ page }) => {
    await entrarEnPeque(page, 'sumes')
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toContain('+')
    expect(enunciado).not.toContain('-')
  })

  test('Peque - Restas: solo genera restas', async ({ page }) => {
    await entrarEnPeque(page, 'restes')
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toContain('-')
    expect(enunciado).not.toContain('+')
  })

  test('Peque - Horas: muestra el reloj y 4 opciones; acertar suma puntos', async ({ page }) => {
    await entrarEnPeque(page, 'hores')
    await expect(page.locator('.reloj')).toBeVisible()
    await expect(page.locator('.opciones button')).toHaveCount(4)

    const correcta = await leerHoraCorrecta(page)
    await page.getByRole('button', { name: correcta, exact: true }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 10')
    await expect(page.locator('.anterior')).toHaveText('Anterior: ✓ correcte')
  })

  test('Peque - Horas: fallar muestra la hora correcta en el panel "Anterior"', async ({ page }) => {
    await entrarEnPeque(page, 'hores')

    const correcta = await leerHoraCorrecta(page)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ✗ la teva resposta (${incorrecta}) — la correcta era ${correcta}`,
    )
  })

  test('Peque ve una celebración animada al acertar', async ({ page }) => {
    await entrarEnPeque(page, 'sumes')

    const enunciado = await page.locator('.enunciado').innerText()
    const [a, , b] = enunciado.replace('=', '').trim().split(' ')
    const respuesta = Number(a) + Number(b)

    await page.locator('input[type="number"]').fill(String(respuesta))
    await page.getByRole('button', { name: 'COMPROVA' }).click()

    await expect(page.locator('.celebracion')).toBeVisible()
    await expect(page.locator('.celebracion')).not.toHaveText('')
  })

  test('el input recupera el foco automáticamente tras fallar una respuesta (Peque)', async ({ page }) => {
    await entrarEnPeque(page, 'sumes')

    const input = page.locator('input[type="number"]')

    await input.fill('999999')
    await page.getByRole('button', { name: 'COMPROVA' }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    // Se espera a que pase al siguiente ejercicio (desaparece el feedback), no a
    // que cambie el enunciado: con selección aleatoria puede repetirse.
    await expect(page.locator('.feedback')).toHaveCount(0, { timeout: 3000 })
    await expect(input).toBeFocused()
  })

  test('se navega curso → asignatura → modo con tarjetas, y se vuelve con "Torna" y las migas', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /6è de primària/ }).click()
    await expect(page).toHaveURL('/6-primaria')

    await page.getByRole('link', { name: /Matemàtiques/ }).click()
    await expect(page).toHaveURL('/6-primaria/matematiques')

    await page.getByRole('link', { name: 'Aritmètica' }).click()
    await expect(page).toHaveURL('/6-primaria/matematiques/aritmetica')
    await expect(page.locator('.enunciado')).toBeVisible()

    // Migas: la asignatura es un enlace; el modo actual, no
    const molles = page.getByRole('navigation', { name: 'Camí de navegació' })
    await expect(molles.getByText('Aritmètica')).toHaveAttribute('aria-current', 'page')
    await molles.getByRole('link', { name: 'Matemàtiques' }).click()
    await expect(page).toHaveURL('/6-primaria/matematiques')

    await page.getByRole('link', { name: '← Torna' }).click()
    await expect(page).toHaveURL('/6-primaria')
    await page.getByRole('link', { name: '← Torna' }).click()
    await expect(page.getByRole('link', { name: /1r de primària/ })).toBeVisible()

    // El botón "atrás" del navegador también funciona
    await page.goBack()
    await expect(page).toHaveURL('/6-primaria')
  })

  test('una URL inexistente muestra "no trobat" con enlace al inicio', async ({ page }) => {
    await page.goto('/6-primaria/matematiques/no-existeix')
    await expect(page.getByText('No hem trobat aquesta pàgina.')).toBeVisible()
    await page.getByRole('link', { name: "Torna a l'inici" }).click()
    await expect(page.getByRole('link', { name: /6è de primària/ })).toBeVisible()
  })

  test('un modo con un tipo de ejercicio desconocido avisa en vez de quedarse en blanco', async ({ page }) => {
    // Simula que en la BD alguien ha puesto un tipo que el código no conoce
    await page.route('**/api/cursos/6-primaria', async (route) => {
      const curso = await (await route.fetch()).json()
      curso.asignaturas[0].modos.push({
        id: 'mode-raro', nombre: 'Mode raro', color: '#000', sombra: '#000', operaciones: ['no-existeix'], banco: null,
      })
      await route.fulfill({ json: curso })
    })
    await page.goto('/6-primaria/matematiques/mode-raro')
    await expect(page.getByText('Aquest mode encara no està disponible.')).toBeVisible()
    await expect(page.getByRole('link', { name: '← Torna' })).toBeVisible()
  })

  test('si la API falla, se muestra un error con "Torna-ho a provar", que recupera la página', async ({ page }) => {
    let fallar = true
    await page.route('**/api/cursos', (route) => (fallar ? route.fulfill({ status: 500, json: {} }) : route.fallback()))
    await page.goto('/')
    await expect(page.getByText("No s'han pogut carregar les dades.")).toBeVisible()

    fallar = false
    await page.getByRole('button', { name: 'Torna-ho a provar' }).click()
    await expect(page.getByRole('link', { name: /6è de primària/ })).toBeVisible()
  })

  test('un curso activo sin asignaturas muestra un aviso en vez de una pantalla vacía', async ({ page }) => {
    await page.route('**/api/cursos/1-primaria', async (route) => {
      const curso = await (await route.fetch()).json()
      await route.fulfill({ json: { ...curso, asignaturas: [] } })
    })
    await page.goto('/1-primaria')
    await expect(page.getByText('Encara no hi ha assignatures en aquest curs. Torna aviat!')).toBeVisible()
  })

  // En el entorno e2e hay un curso inactivo de prueba ("Curs inactiu E2E");
  // en producción no existe, y el test vale igual.
  test('un curso inactivo no aparece en el inicio y su URL da "no trobat"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /6è de primària/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Curs inactiu E2E/ })).toHaveCount(0)
    await page.goto('/inactiu-e2e')
    await expect(page.getByText('No hem trobat aquesta pàgina.')).toBeVisible()
  })

  test('sin àlies, "Per repassar" no guarda nada e invita a entrar con un àlies', async ({ page }) => {
    await entrarEnVocabulario(page)
    await page.locator('.opciones button').first().click()
    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: /Per repassar/ }).click()
    await expect(page.getByText(/Entra amb el teu àlies \(a dalt\) per guardar/)).toBeVisible()
    await expect(page.locator('.lista-repasar')).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('practica-asignaturas:fallos'))).toBeNull()
  })

  test('un curso que no existe muestra "no trobat"', async ({ page }) => {
    await page.goto('/9-primaria')
    await expect(page.getByText('No hem trobat aquesta pàgina.')).toBeVisible()
  })

  test('"Torna a jugar" empieza una partida nueva desde cero', async ({ page }) => {
    await entrarEnAritmetica(page)
    await page.locator('input[type="number"]').fill('-99999')
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()
    await expect(page.locator('.detalle')).toHaveText('Encerts: 0 · Errors: 1')
    await page.getByRole('button', { name: 'Torna a jugar' }).click()

    await expect(page.locator('.puntos')).toHaveText('⭐ 0')
    await expect(page.locator('.comptador-errors')).toHaveText('0')
    await expect(page.locator('.anterior')).toHaveCount(0)
  })

  test('la pantalla de práctica ocupa todo el ancho en un escritorio, con el panel al lado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await entrarEnAritmetica(page)
    const exercici = await page.locator('.zona-exercici').boundingBox()
    const panell = await page.locator('.panell').boundingBox()
    expect(exercici.width).toBeGreaterThan(700)
    expect(panell.x).toBeGreaterThan(exercici.x + exercici.width - 1)
  })

  test('modo Aritmética: nunca genera problemas, y flujo completo hasta el resumen', async ({ page }) => {
    await entrarEnAritmetica(page)

    const enunciado = await page.locator('.enunciado').innerText()
    expect(respuestasProblemas.has(enunciado)).toBe(false)

    const input = page.locator('input[type="number"]')
    await input.fill(String(respuestaCorrecta(enunciado)))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()

    await expect(page.locator('.resumen')).toBeVisible()
    await expect(page.locator('.puntos-totales')).toHaveText(`${puntosEsperados(enunciado)} punts`)
    await expect(page.locator('.detalle')).toHaveText('Encerts: 1 · Errors: 0')
  })

  test('modo Aritmética: el panel "Anterior" muestra la operación y la solución tras fallar', async ({
    page,
  }) => {
    await entrarEnAritmetica(page)

    const enunciadoInicial = await page.locator('.enunciado').innerText()
    const enunciadoSinIgual = enunciadoInicial.replace(/\s*=$/, '')
    const respuesta = respuestaCorrecta(enunciadoInicial)
    const respuestaDada = respuesta + 1000

    await page.locator('input[type="number"]').fill(String(respuestaDada))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    // Tras el auto-avance al siguiente ejercicio, el panel "Anterior" debe seguir visible
    // Se espera a que pase al siguiente ejercicio (desaparece el feedback), no a
    // que cambie el enunciado: con selección aleatoria puede repetirse.
    await expect(page.locator('.feedback')).toHaveCount(0, { timeout: 3000 })
    const anterior = page.locator('.anterior')
    await expect(anterior).toHaveClass(/incorrecto/)
    await expect(anterior).toHaveText(
      `Anterior: ${enunciadoSinIgual} = ${respuesta} ✗ (has posat ${respuestaDada})`,
    )
  })

  test('modo Problemas: todas las preguntas vienen del banco curado y valen 20 puntos', async ({ page }) => {
    await entrarEnProblemas(page)

    const enunciado = page.locator('.enunciado')
    const texto = await enunciado.innerText()
    expect(respuestasProblemas.has(texto)).toBe(true)
    await expect(enunciado).toHaveClass(/enunciado-problema/)

    const input = page.locator('input[type="number"]')
    await input.fill(String(respuestaCorrecta(texto)))
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.correcto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()
    await expect(page.locator('.puntos-totales')).toHaveText('20 punts')
  })

  test('modo Problemas: el panel "Anterior" es breve y no repite el enunciado', async ({ page }) => {
    await entrarEnProblemas(page)

    const texto = await page.locator('.enunciado').innerText()
    const respuesta = respuestasProblemas.get(texto)

    await page.locator('input[type="number"]').fill('-1')
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    // Se espera a que pase al siguiente ejercicio (desaparece el feedback), no a
    // que cambie el enunciado: con selección aleatoria puede repetirse.
    await expect(page.locator('.feedback')).toHaveCount(0, { timeout: 3000 })
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ✗ la teva resposta (-1) — la correcta era ${respuesta}`,
    )
  })

  test('modo Vocabulario: muestra la palabra en inglés y 4 opciones en catalán; acertar suma puntos', async ({
    page,
  }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    expect(traduccionesVocabulario.has(palabra)).toBe(true)
    await expect(page.locator('.opciones button')).toHaveCount(4)

    const correcta = traduccionesVocabulario.get(palabra)
    await page.getByRole('button', { name: correcta, exact: true }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 10')
    await expect(page.locator('.anterior')).toHaveText(`Anterior: ${palabra} = ${correcta} ✓`)
  })

  test('modo Vocabulario: fallar muestra la traducción correcta en el panel "Anterior"', async ({ page }) => {
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()

    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    await expect(page.locator('.anterior')).toHaveText(
      `Anterior: ${palabra} = ${correcta} ✗ (has posat ${incorrecta})`,
    )
  })

  test('modo Gramática: sin contenido todavía, muestra un aviso en vez de romperse', async ({ page }) => {
    await entrarEnGramatica(page)

    await expect(page.getByText('Encara no hi ha exercicis de gramàtica')).toBeVisible()
    await expect(page.locator('.enunciado')).toHaveCount(0)

    await page.getByRole('link', { name: '← Torna' }).click()
    await expect(page.getByRole('link', { name: 'Vocabulari', exact: true })).toBeVisible()
  })

  test('con àlies, un fallo de vocabulario se guarda en "Per repassar"', async ({ page, baseURL }) => {
    await entrarAmbAliesNou(page, '6-primaria', baseURL)
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)

    await page.getByRole('button', { name: incorrecta, exact: true }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: /Per repassar/ }).click()

    await expect(page.locator('.lista-repasar li')).toHaveCount(1)
    await expect(page.locator('.repasar-enunciado')).toHaveText(palabra)
    await expect(page.locator('.repasar-respuesta')).toHaveText(correcta)
    await expect(page.locator('.repasar-veces')).toHaveText('×1')
  })

  test('"Per repassar" es accesible desde la pantalla de modo, y "Buida la llista" borra los fallos', async ({
    page,
    baseURL,
  }) => {
    await entrarAmbAliesNou(page, '6-primaria', baseURL)
    await entrarEnVocabulario(page)

    const palabra = await page.locator('.enunciado').innerText()
    const correcta = traduccionesVocabulario.get(palabra)
    const opciones = await page.locator('.opciones button').allInnerTexts()
    const incorrecta = opciones.find((o) => o !== correcta)
    await page.getByRole('button', { name: incorrecta, exact: true }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: 'Tria un altre exercici' }).click()

    // Desde la pantalla de modos (sin jugar) también se accede a "Per repassar"
    await expect(page).toHaveURL('/6-primaria/angles')
    await page.getByRole('link', { name: /Per repassar/ }).click()
    await expect(page.locator('.lista-repasar li')).toHaveCount(1)

    await page.getByRole('button', { name: 'Buida la llista' }).click()
    await expect(page.getByText('Encara no has fallat res!')).toBeVisible()
  })

  test('Matemáticas - Sumas y restas: nunca genera multiplicaciones ni divisiones', async ({ page }) => {
    await entrarEnSumasRestas(page)
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toMatch(/[+-]/)
    expect(enunciado).not.toMatch(/[×÷]/)
  })

  test('Matemáticas - Multiplicaciones y divisiones: nunca genera sumas ni restas', async ({ page }) => {
    await entrarEnMultiplicacionesDivisiones(page)
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toMatch(/[×÷]/)
    expect(enunciado).not.toMatch(/[+-]/)
  })

  test('Matemáticas - Perímetres i àrees: dibuja la figura con sus medidas y da por buena la respuesta correcta', async ({
    page,
  }) => {
    await entrarEnPerimetrosAreas(page)

    // Los ejercicios sin figura ("¿perímetre o àrea?" y el del costat del quadrat) se saltan
    for (let i = 0; i < 40; i++) {
      if ((await page.locator('.figura-geometria').count()) > 0) break
      await responderCualquierCosa(page)
      await page.waitForTimeout(1000)
    }

    const aria = await page.locator('.figura-geometria').getAttribute('aria-label')
    const enunciado = await page.locator('.enunciado').innerText()
    expect(enunciado).toMatch(/^(Perímetre|Àrea) del (quadrat|rectangle|triangle|paral·lelogram|triangle equilàter|hexàgon regular) \(cm²?\)/)

    // Los ejercicios saltados con una respuesta al azar a veces se aciertan y
    // ya suman puntos: se comprueba lo que suma ESTE, no el total.
    const puntosAntes = Number((await page.locator('.puntos').innerText()).replace('⭐', ''))
    await page.locator('input[type="number"]').fill(String(respuestaDeFigura(aria, enunciado)))
    await page.getByRole('button', { name: 'Comprova' }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText(`⭐ ${puntosAntes + 15}`)
  })

  test('Matemáticas - Perímetres i àrees: "¿perímetre o àrea?" ofrece dos opciones', async ({ page }) => {
    await entrarEnPerimetrosAreas(page)

    for (let i = 0; i < 40; i++) {
      if ((await page.locator('.opciones button').count()) > 0) break
      await responderCualquierCosa(page)
      await page.waitForTimeout(1000)
    }

    const opciones = await page.locator('.opciones button').allInnerTexts()
    expect(opciones.sort()).toEqual(['Perímetre', 'Àrea'])
  })

  test('Vocabulario (selección): al responder se pronuncia automáticamente la palabra en inglés', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__vozDicha = []
      window.speechSynthesis.speak = (utterance) => window.__vozDicha.push(utterance.text)
    })

    await entrarEnVocabulario(page)
    const ingles = await page.locator('.enunciado').innerText()

    await page.locator('.opciones button').first().click()

    expect(await page.evaluate(() => window.__vozDicha)).toEqual([ingles])
  })

  test('Vocabulario escrito: pide a veces inglés y a veces catalán, acepta mayúsculas/minúsculas distintas y pronuncia el inglés al responder', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__vozDicha = []
      window.speechSynthesis.speak = (utterance) => window.__vozDicha.push(utterance.text)
    })

    await entrarEnVocabularioEscrito(page)

    const instruccion = await page.locator('.instruccion').innerText()
    const pideIngles = instruccion.includes('anglès')
    const enunciado = await page.locator('.enunciado').innerText()

    const primeraAlternativa = (texto) => texto.split(',')[0].trim()
    // Varias palabras inglesas pueden compartir traducción (p.ej. ABOUT y UPON
    // -> "sobre"): al escribir el inglés vale cualquiera de ellas.
    const entradas = pideIngles
      ? bancoVocabulario.filter((p) => p.respuesta === enunciado)
      : bancoVocabulario.filter((p) => p.enunciado === enunciado)
    const entrada = entradas[0]
    const respuesta = pideIngles
      ? primeraAlternativa(entrada.enunciado).toLowerCase()
      : primeraAlternativa(entrada.respuesta).toUpperCase()

    await page.locator('input[type="text"]').fill(respuesta)
    await page.getByRole('button', { name: 'Comprova' }).click()

    await expect(page.locator('.feedback.correcto')).toBeVisible()
    await expect(page.locator('.puntos')).toHaveText('⭐ 15')
    // El audio se dispara solo al responder (nunca antes, nunca con un botón
    // aparte) y siempre dice el inglés, aunque esta vez tocara escribir catalán
    const voz = await page.evaluate(() => window.__vozDicha)
    expect(voz).toHaveLength(1)
    expect(entradas.map((e) => e.enunciado)).toContain(voz[0])
  })

  test('Vocabulario escrito: con àlies, un fallo también se guarda en "Per repassar"', async ({ page, baseURL }) => {
    await entrarAmbAliesNou(page, '6-primaria', baseURL)
    await entrarEnVocabularioEscrito(page)

    await page.locator('input[type="text"]').fill('xxxxxxxx')
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()

    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: /Per repassar/ }).click()
    await expect(page.locator('.lista-repasar li')).toHaveCount(1)
  })

  test('There is / are: un fallo muestra la respuesta correcta y, con àlies, se guarda en "Per repassar"', async ({
    page,
    baseURL,
  }) => {
    await entrarAmbAliesNou(page, '6-primaria', baseURL)
    await entrarEnThereBe(page)
    await expect(page.locator('.instruccion')).toBeVisible()
    await expect(page.locator('.enunciado')).toContainText(/\S/)

    await page.locator('input[type="text"]').fill('xxxxxxxx')
    await page.getByRole('button', { name: 'Comprova' }).click()
    await expect(page.locator('.feedback.incorrecto')).toBeVisible()
    const correcta = (await page.locator('.feedback.incorrecto').innerText()).replace('Gairebé... la resposta era ', '')

    await expect(page.locator('.anterior.incorrecto')).toBeVisible()
    await page.getByRole('button', { name: 'Finalitza' }).click()
    await page.getByRole('link', { name: /Per repassar/ }).click()
    await expect(page.locator('.lista-repasar li')).toHaveCount(1)
    await expect(page.locator('.repasar-respuesta')).toHaveText(correcta)
  })

  test('Potències: muestra un ejercicio y un fallo se guarda o se cuenta, sin romper la pantalla', async ({ page }) => {
    await entrarEnPotencies(page)
    await expect(page.locator('.enunciado').first()).toContainText(/\S/)

    for (let i = 0; i < 4; i++) {
      const opciones = page.locator('.opciones button')
      if (await opciones.count()) {
        await opciones.first().click()
      } else {
        await page.locator('input[type="number"]').fill('-1')
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback.incorrecto, .feedback.correcto')).toBeVisible()
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
    await expect(page.locator('.anterior')).toBeVisible()
  })

  test('Perímetres i àrees: acepta la respuesta correcta del problema del costat del quadrat', async ({ page }) => {
    await entrarEnPerimetrosAreas(page)
    for (let i = 0; i < 40; i++) {
      const texto = await page.locator('.enunciado').first().innerText()
      const m = texto.match(/té (\d+) (?:m|cm)²/)
      if (m) {
        await page.locator('input[type="number"]').fill(String(Math.sqrt(Number(m[1]))))
        await page.getByRole('button', { name: 'Comprova' }).click()
        await expect(page.locator('.feedback.correcto')).toBeVisible()
        return
      }
      if (await page.locator('.opciones button').count()) await page.locator('.opciones button').first().click()
      else {
        await page.locator('input[type="number"]').fill('0')
        await page.getByRole('button', { name: 'Comprova' }).click()
      }
      await expect(page.locator('.feedback')).toHaveCount(0)
    }
  })
})
