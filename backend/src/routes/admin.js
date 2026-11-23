import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { consolaActivada, contrasenyaCorrecta } from '../auth/contrasenya.js'
import { crearSesion, obtenerSesion, borrarSesion, DURACION_SESION_MS } from '../auth/sesiones.js'
import { bloqueoRestante, registrarFallo, registrarAcierto } from '../auth/limitador.js'
import { obtenerContenidoAdmin, obtenerBancoAdmin } from '../db/admin.js'
import { crearPregunta, actualizarPregunta, borrarPregunta } from '../db/preguntas.js'
import { importarPreguntas, bancoACsv } from '../db/importar.js'
import { exportarContenido } from '../db/exportar.js'
import * as estructura from '../db/estructura.js'
import { crearModo, actualizarModo, borrarModo, crearBanco, actualizarBanco, borrarBanco } from '../db/modos.js'
import { pool } from '../db/cliente.js'
import { listarAlumnes, renombrarAlumne, nuevoPinAlumne, borrarAlumne } from '../db/alumnes.js'
import { validarAlies } from '../validacion/alies.js'
import { PARAMETRES } from '../catalogo/parametres.js'

export const COOKIE_SESION = 'sessio_professorat'

// La cookie solo viaja a /api/admin, no es accesible desde JavaScript, no se
// envía desde otras webs (protege también contra CSRF) y en producción solo por
// HTTPS.
function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin',
  }
}

function leerCookie(req, nombre) {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [clave, ...valor] = parte.trim().split('=')
    if (clave === nombre) return decodeURIComponent(valor.join('='))
  }
  return null
}

const router = Router()

// Sin TEACHER_PASSWD la consola queda desactivada, pero la web sigue en pie.
router.use((req, res, next) => {
  if (!consolaActivada()) return res.status(503).json({ error: 'consola_desactivada' })
  next()
})

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const restante = bloqueoRestante(req.ip)
    if (restante > 0) {
      return res.status(429).json({ error: 'massa_intents', reintentarEnSegons: Math.ceil(restante / 1000) })
    }
    if (!contrasenyaCorrecta(req.body?.password)) {
      registrarFallo(req.ip)
      return res.status(401).json({ error: 'contrasenya_incorrecta' })
    }
    registrarAcierto(req.ip)
    const { token, caducaEn } = await crearSesion()
    res.cookie(COOKIE_SESION, token, { ...opcionesCookie(), maxAge: DURACION_SESION_MS })
    res.json({ caducaEn })
  }),
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await borrarSesion(leerCookie(req, COOKIE_SESION))
    res.clearCookie(COOKIE_SESION, opcionesCookie())
    res.status(204).end()
  }),
)

// A partir de aquí, todo exige sesión.
router.use(
  asyncHandler(async (req, res, next) => {
    const sesion = await obtenerSesion(leerCookie(req, COOKIE_SESION))
    if (!sesion) return res.status(401).json({ error: 'sessio_requerida' })
    req.sesion = sesion
    next()
  }),
)

router.get('/sessio', (req, res) => {
  res.json({ caducaEn: req.sesion.caducaEn })
})

// Parámetros de dificultad que acepta cada tipo de ejercicio (para el
// formulario de modo de la consola).
router.get('/parametres', (req, res) => {
  res.json(PARAMETRES)
})

// Todo el contenido (también lo inactivo): árbol de cursos y resumen de bancos.
router.get(
  '/contingut',
  asyncHandler(async (req, res) => {
    res.json(await obtenerContenidoAdmin())
  }),
)

// Id numérico de la URL, o null si no es válido (se responde 404).
function idDe(req) {
  const id = Number(req.params.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

router.get(
  '/bancs/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const banco = id && (await obtenerBancoAdmin(id))
    if (!banco) return res.status(404).json({ error: 'banc_no_trobat' })
    res.json(banco)
  }),
)

// Respuesta común de crear/editar: 400 con los errores por campo, 404 si no
// existe, o la pregunta guardada.
function responderPregunta(res, resultado, estadoOk, errorNoTrobat) {
  if (!resultado) return res.status(404).json({ error: errorNoTrobat })
  if (resultado.errores) return res.status(400).json({ error: 'validacio', camps: resultado.errores })
  res.status(estadoOk).json(resultado.pregunta)
}

router.post(
  '/bancs/:id/preguntes',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderPregunta(res, id && (await crearPregunta(id, req.body ?? {})), 201, 'banc_no_trobat')
  }),
)

router.patch(
  '/preguntes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderPregunta(res, id && (await actualizarPregunta(id, req.body)), 200, 'pregunta_no_trobada')
  }),
)

// Cursos y asignaturas: crear, editar (parcial), mover y borrar (solo si
// están vacíos). Respuestas: 400 con errores por campo, 404, 409 si no está
// vacío, o la fila guardada.
function responderEstructura(res, resultado, estadoOk, errorNoTrobat) {
  if (!resultado) return res.status(404).json({ error: errorNoTrobat })
  if (resultado.errores) return res.status(400).json({ error: 'validacio', camps: resultado.errores })
  if (resultado.error === 'no_buit') return res.status(409).json({ error: 'no_buit' })
  if (estadoOk === 204) return res.status(204).end()
  res.status(estadoOk).json(resultado.fila)
}

for (const [ruta, tipo, noTrobat] of [
  ['cursos', 'curso', 'curs_no_trobat'],
  ['assignatures', 'asignatura', 'assignatura_no_trobada'],
]) {
  router.patch(
    `/${ruta}/:id`,
    asyncHandler(async (req, res) => {
      const id = idDe(req)
      responderEstructura(res, id && (await estructura.actualizar(tipo, id, req.body)), 200, noTrobat)
    }),
  )
  router.delete(
    `/${ruta}/:id`,
    asyncHandler(async (req, res) => {
      const id = idDe(req)
      responderEstructura(res, id && (await estructura.borrar(tipo, id)), 204, noTrobat)
    }),
  )
  router.post(
    `/${ruta}/:id/mou`,
    asyncHandler(async (req, res) => {
      const id = idDe(req)
      const direccion = req.body?.direccio
      if (!['amunt', 'avall'].includes(direccion)) return res.status(400).json({ error: 'direccio_no_valida' })
      responderEstructura(res, id && (await estructura.mover(tipo, id, direccion)), 200, noTrobat)
    }),
  )
}

// Modos: crear dentro de una asignatura, editar (parcial), mover y borrar.
router.post(
  '/assignatures/:id/modes',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await crearModo(id, req.body ?? {})), 201, 'assignatura_no_trobada')
  }),
)

router.patch(
  '/modes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await actualizarModo(id, req.body ?? {})), 200, 'mode_no_trobat')
  }),
)

router.delete(
  '/modes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await borrarModo(id)), 204, 'mode_no_trobat')
  }),
)

router.post(
  '/modes/:id/mou',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const direccion = req.body?.direccio
    if (!['amunt', 'avall'].includes(direccion)) return res.status(400).json({ error: 'direccio_no_valida' })
    responderEstructura(res, id && (await estructura.mover('modo', id, direccion)), 200, 'mode_no_trobat')
  }),
)

// Bancos: crear (formato fijo), renombrar y borrar (solo vacío y sin uso).
router.post(
  '/bancs',
  asyncHandler(async (req, res) => {
    responderEstructura(res, await crearBanco(req.body ?? {}), 201, 'banc_no_trobat')
  }),
)

router.patch(
  '/bancs/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await actualizarBanco(id, req.body ?? {})), 200, 'banc_no_trobat')
  }),
)

router.delete(
  '/bancs/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await borrarBanco(id)), 204, 'banc_no_trobat')
  }),
)

router.post(
  '/cursos',
  asyncHandler(async (req, res) => {
    responderEstructura(res, await estructura.crear('curso', req.body ?? {}), 201, 'curs_no_trobat')
  }),
)

router.post(
  '/cursos/:id/assignatures',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    responderEstructura(res, id && (await estructura.crear('asignatura', req.body ?? {}, id)), 201, 'curs_no_trobat')
  }),
)

// Àlies de los alumnos de un curso: ver, renombrar, PIN nuevo y borrar.
router.get(
  '/cursos/:id/alumnes',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const { rowCount } = id ? await pool.query('SELECT 1 FROM cursos WHERE id = $1', [id]) : { rowCount: 0 }
    if (!rowCount) return res.status(404).json({ error: 'curs_no_trobat' })
    res.json(await listarAlumnes(id))
  }),
)

router.patch(
  '/alumnes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const { alies, error } = validarAlies(req.body?.alies)
    if (error) return res.status(400).json({ error: 'validacio', camps: { alies: error } })
    const resultado = id && (await renombrarAlumne(id, alies))
    if (!resultado) return res.status(404).json({ error: 'alumne_no_trobat' })
    if (resultado.repetido) {
      return res.status(400).json({ error: 'validacio', camps: { alies: 'Ja hi ha un alumne amb aquest àlies en aquest curs.' } })
    }
    res.json(resultado.alumne)
  }),
)

router.post(
  '/alumnes/:id/pin',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const resultado = id && (await nuevoPinAlumne(id))
    if (!resultado) return res.status(404).json({ error: 'alumne_no_trobat' })
    res.json(resultado)
  }),
)

router.delete(
  '/alumnes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    if (!id || !(await borrarAlumne(id))) return res.status(404).json({ error: 'alumne_no_trobat' })
    res.status(204).end()
  }),
)

// Importar preguntas: { texto, importar?, inactivas? }. Sin "importar"
// devuelve solo la vista previa (nada se guarda).
router.post(
  '/bancs/:id/importa',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const { texto, importar, inactivas } = req.body ?? {}
    if (typeof texto !== 'string') return res.status(400).json({ error: 'text_requerit' })
    const resultado = id && (await importarPreguntas(id, texto, { importar: importar === true, inactivas: inactivas === true }))
    if (!resultado) return res.status(404).json({ error: 'banc_no_trobat' })
    if (resultado.error) return res.status(400).json(resultado)
    res.json(resultado)
  }),
)

router.get(
  '/bancs/:id/csv',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    const resultado = id && (await bancoACsv(id))
    if (!resultado) return res.status(404).json({ error: 'banc_no_trobat' })
    res.attachment(`${resultado.slug}.csv`).type('text/csv; charset=utf-8').send(resultado.csv)
  }),
)

// Copia completa del contenido (mismo formato que backend/datos/contenido.json).
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const fecha = new Date().toISOString().slice(0, 10)
    res.attachment(`contingut-${fecha}.json`).type('application/json')
    res.send(JSON.stringify(await exportarContenido(pool), null, 2) + '\n')
  }),
)

router.delete(
  '/preguntes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    if (!id || !(await borrarPregunta(id))) return res.status(404).json({ error: 'pregunta_no_trobada' })
    res.status(204).end()
  }),
)

export default router
