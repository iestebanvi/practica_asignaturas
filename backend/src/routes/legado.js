import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { obtenerBanco } from '../db/contenido.js'

// Endpoints de antes de la BD (/api/problemas, /api/vocabulario...): responden
// exactamente igual que cuando servían los JSON, para que el frontend no
// tenga que cambiar todavía. Se retirarán en la fase 3, cuando el frontend
// pida las preguntas por banco (/api/bancos/:banco/preguntas).
const FORMATO_ANTIGUO = {
  numerica: (p) => ({ id: p.orden, enunciado: p.enunciado, respuesta: Number(p.respuesta) }),
  traduccio: (p) => ({ id: p.orden, ingles: p.enunciado, catalan: p.respuesta }),
  opcio_multiple: (p) => ({ id: p.orden, enunciado: p.enunciado, opciones: p.opciones, respuesta: p.respuesta }),
}

export const RUTAS_ANTIGUAS = {
  '/api/problemas': 'problemes-6',
  '/api/vocabulario': 'vocabulari-angles-6',
  '/api/gramatica': 'gramatica-angles-6',
  '/api/medi': 'medi-canvis-relleu-6',
}

export function routerAntiguo(slugBanco) {
  const router = Router()
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const banco = await obtenerBanco(slugBanco)
      res.json(banco ? banco.preguntas.map(FORMATO_ANTIGUO[banco.formato]) : [])
    }),
  )
  return router
}
