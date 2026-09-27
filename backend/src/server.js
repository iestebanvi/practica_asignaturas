import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import problemasRouter from './routes/problemas.js'
import vocabularioRouter from './routes/vocabulario.js'
import gramaticaRouter from './routes/gramatica.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/problemas', problemasRouter)
app.use('/api/vocabulario', vocabularioRouter)
app.use('/api/gramatica', gramaticaRouter)

app.use(express.static(publicDir))

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`practica_asignaturas escuchando en el puerto ${port}`)
})
