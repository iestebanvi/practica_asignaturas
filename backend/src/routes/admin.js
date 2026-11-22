import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { consolaActivada, contrasenyaCorrecta } from '../auth/contrasenya.js'
import { crearSesion, obtenerSesion, borrarSesion, DURACION_SESION_MS } from '../auth/sesiones.js'
import { bloqueoRestante, registrarFallo, registrarAcierto } from '../auth/limitador.js'
import { obtenerContenidoAdmin, obtenerBancoAdmin } from '../db/admin.js'

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

router.get(
  '/bancs/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const banco = Number.isInteger(id) && id > 0 ? await obtenerBancoAdmin(id) : null
    if (!banco) return res.status(404).json({ error: 'banc_no_trobat' })
    res.json(banco)
  }),
)

export default router
