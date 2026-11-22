import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { listarCursos, obtenerArbolCurso } from '../db/contenido.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await listarCursos())
  }),
)

router.get(
  '/:curso',
  asyncHandler(async (req, res) => {
    const curso = await obtenerArbolCurso(req.params.curso)
    if (!curso) return res.status(404).json({ error: 'curso_no_encontrado' })
    res.json(curso)
  }),
)

export default router
