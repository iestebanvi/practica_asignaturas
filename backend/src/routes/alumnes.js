import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { crearLimitador } from '../auth/limitador.js'
import { validarAlies, normalizarAlies, pinCorrecto } from '../validacion/alies.js'
import {
  cursoActivo,
  buscarAlumne,
  crearAlumne,
  crearSesionAlumne,
  alumneDeSesion,
  borrarSesionAlumne,
  DURACION_SESION_ALUMNE_MS,
  modoConBloc,
  guardarBloc,
} from '../db/alumnes.js'

// Máximo de puntos de una pregunta (los problemas, 20): para descartar
// resultados imposibles.
const MAX_PUNTOS_PREGUNTA = 20

// Límite de intentos de PIN por àlies (curso + àlies): 5 fallos → 15 min.
export const limitadorPin = crearLimitador()

// Una cookie por curso: dos hermanos de cursos distintos pueden compartir
// dispositivo sin salir y entrar.
const nombreCookie = (cursoId) => `alumne_${cursoId}`

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/alumnes',
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

// Resuelve el curso (activo) de la petición; responde 404 si no existe.
async function curso(req, res) {
  const slug = req.body?.curs ?? req.query.curs
  const c = typeof slug === 'string' ? await cursoActivo(slug) : null
  if (!c) res.status(404).json({ error: 'curs_no_trobat' })
  return c
}

async function abrirSesion(res, cursoId, alumneId) {
  const { token } = await crearSesionAlumne(alumneId)
  res.cookie(nombreCookie(cursoId), token, { ...opcionesCookie(), maxAge: DURACION_SESION_ALUMNE_MS })
}

// ¿Existe ya este àlies en el curso? (Para preguntar antes de crear uno nuevo.)
router.post(
  '/comprova',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    const { alies, error } = validarAlies(req.body?.alies)
    if (error) return res.status(400).json({ error: 'alies_no_valid', missatge: error })
    const alumne = await buscarAlumne(c.id, alies)
    res.json({ alies: alumne?.alies ?? alies, existeix: Boolean(alumne) })
  }),
)

// Àlies nuevo: genera el PIN (sale solo en esta respuesta) y abre sesión.
router.post(
  '/crea',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    const { alies, error } = validarAlies(req.body?.alies)
    if (error) return res.status(400).json({ error: 'alies_no_valid', missatge: error })
    const creado = await crearAlumne(c.id, alies)
    if (!creado) return res.status(409).json({ error: 'alies_existent' })
    await abrirSesion(res, c.id, creado.alumne.id)
    res.status(201).json({ alies: creado.alumne.alies, pin: creado.pin })
  }),
)

// Àlies existente + PIN.
router.post(
  '/entra',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    const { alies, error } = validarAlies(req.body?.alies)
    if (error) return res.status(400).json({ error: 'alies_no_valid', missatge: error })
    const clave = `${c.id}:${normalizarAlies(alies)}`
    const restante = limitadorPin.bloqueoRestante(clave)
    if (restante > 0) {
      return res.status(429).json({ error: 'massa_intents', reintentarEnSegons: Math.ceil(restante / 1000) })
    }
    const alumne = await buscarAlumne(c.id, alies)
    if (!alumne) return res.status(404).json({ error: 'alies_no_trobat' })
    if (!pinCorrecto(req.body?.pin, alumne.pin_hash)) {
      limitadorPin.registrarFallo(clave)
      return res.status(401).json({ error: 'pin_incorrecte' })
    }
    limitadorPin.registrarAcierto(clave)
    await abrirSesion(res, c.id, alumne.id)
    res.json({ alies: alumne.alies })
  }),
)

router.post(
  '/surt',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    await borrarSesionAlumne(leerCookie(req, nombreCookie(c.id)))
    res.clearCookie(nombreCookie(c.id), opcionesCookie())
    res.status(204).end()
  }),
)

// Bloque completado por el alumno identificado en el curso:
// { curs, assignatura, mode, puntos, aciertos, preguntas }. El navegador
// calcula el resultado; aquí se comprueba que sea posible.
router.post(
  '/blocs',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    const alumne = await alumneDeSesion(leerCookie(req, nombreCookie(c.id)), c.id)
    if (!alumne) return res.status(401).json({ error: 'sessio_requerida' })
    const { assignatura, mode, puntos, aciertos, preguntas } = req.body ?? {}
    const modo = typeof assignatura === 'string' && typeof mode === 'string' ? await modoConBloc(c.id, assignatura, mode) : null
    if (!modo) return res.status(404).json({ error: 'mode_no_trobat' })
    const enteros = [puntos, aciertos, preguntas].every(Number.isInteger)
    if (
      !enteros ||
      preguntas !== modo.bloc ||
      aciertos < 0 ||
      aciertos > preguntas ||
      puntos < 0 ||
      puntos > preguntas * MAX_PUNTOS_PREGUNTA ||
      (aciertos === 0 && puntos > 0)
    ) {
      return res.status(400).json({ error: 'bloc_no_valid' })
    }
    res.status(201).json(await guardarBloc(alumne.id, modo.id, { puntos, aciertos, preguntas }))
  }),
)

// ¿Quién está identificado en este curso, en este dispositivo? { alumne: { alies } | null }
router.get(
  '/jo',
  asyncHandler(async (req, res) => {
    const c = await curso(req, res)
    if (!c) return
    const alumne = await alumneDeSesion(leerCookie(req, nombreCookie(c.id)), c.id)
    res.json({ alumne: alumne ? { alies: alumne.alies } : null })
  }),
)

export default router
