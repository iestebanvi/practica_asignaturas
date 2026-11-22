import 'dotenv/config'
import { pool } from '../src/db/cliente.js'
import { ejecutarMigraciones } from '../src/db/migrar.js'

try {
  const aplicadas = await ejecutarMigraciones()
  console.log(aplicadas.length ? `${aplicadas.length} migración(es) aplicada(s)` : 'La BD ya estaba al día')
} finally {
  await pool.end()
}
