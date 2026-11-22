import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { obtenerBanco } from '../db/contenido.js'

const router = Router()

router.get(
  '/:banco/preguntas',
  asyncHandler(async (req, res) => {
    const banco = await obtenerBanco(req.params.banco)
    if (!banco) return res.status(404).json({ error: 'banco_no_encontrado' })
    res.json(banco)
  }),
)

export default router
