import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cursosRouter from './routes/cursos.js'
import bancosRouter from './routes/bancos.js'
import adminRouter from './routes/admin.js'
import alumnesRouter from './routes/alumnes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// Configura la app sin arrancar el servidor (así los tests pueden levantarla
// en un puerto cualquiera).
export function crearApp() {
  const app = express()

  // Railway pone un proxy delante: así req.ip es la IP real del visitante
  // (la usa el límite de intentos del login), no la del proxy.
  app.set('trust proxy', 1)
  // 1 MB: una importación de hasta 1000 preguntas largas cabe de sobra.
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/cursos', cursosRouter)
  app.use('/api/bancos', bancosRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/alumnes', alumnesRouter)

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'no_encontrado' })
  })

  // eslint-disable-next-line no-unused-vars
  app.use('/api', (err, req, res, next) => {
    console.error(`Error en ${req.method} ${req.originalUrl}:`, err.message)
    res.status(500).json({ error: 'error_interno' })
  })

  app.use(express.static(publicDir))

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })

  return app
}
