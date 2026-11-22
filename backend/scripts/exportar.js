import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { pool, ESQUEMA } from '../src/db/cliente.js'
import { exportarContenido } from '../src/db/exportar.js'
import { FICHERO_CONTENIDO } from './contenido.js'

try {
  const contenido = await exportarContenido(pool)
  writeFileSync(FICHERO_CONTENIDO, JSON.stringify(contenido, null, 2) + '\n')
  const preguntas = contenido.bancos.reduce((n, b) => n + b.preguntas.length, 0)
  console.log(
    `Esquema "${ESQUEMA}" exportado a backend/datos/contenido.json: ` +
      `${contenido.cursos.length} cursos, ${contenido.bancos.length} bancos, ${preguntas} preguntas`,
  )
} finally {
  await pool.end()
}
