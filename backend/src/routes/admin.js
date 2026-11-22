import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { consolaActivada, contrasenyaCorrecta } from '../auth/contrasenya.js'
import { crearSesion, obtenerSesion, borrarSesion, DURACION_SESION_MS } from '../auth/sesiones.js'
import { bloqueoRestante, registrarFallo, registrarAcierto } from '../auth/limitador.js'
import { obtenerContenidoAdmin, obtenerBancoAdmin } from '../db/admin.js'
import { crearPregunta, actualizarPregunta, borrarPregunta } from '../db/preguntas.js'

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

router.delete(
  '/preguntes/:id',
  asyncHandler(async (req, res) => {
    const id = idDe(req)
    if (!id || !(await borrarPregunta(id))) return res.status(404).json({ error: 'pregunta_no_trobada' })
    res.status(204).end()
  }),
)

export default router
