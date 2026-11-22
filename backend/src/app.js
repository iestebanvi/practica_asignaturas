import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cursosRouter from './routes/cursos.js'
import bancosRouter from './routes/bancos.js'
import { RUTAS_ANTIGUAS, routerAntiguo } from './routes/legado.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// Configura la app sin arrancar el servidor (así los tests pueden levantarla
// en un puerto cualquiera).
export function crearApp() {
  const app = express()

  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/cursos', cursosRouter)
  app.use('/api/bancos', bancosRouter)
  for (const [ruta, banco] of Object.entries(RUTAS_ANTIGUAS)) {
    app.use(ruta, routerAntiguo(banco))
  }

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
