import 'dotenv/config'
import { pool, ESQUEMA } from '../src/db/cliente.js'
import { ejecutarMigraciones } from '../src/db/migrar.js'
import { sembrar } from '../src/db/sembrar.js'
import { datosIniciales } from './datos-iniciales.js'

try {
  await ejecutarMigraciones()
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const resumen = await sembrar(cliente, datosIniciales())
    await cliente.query('COMMIT')
    console.log(`Esquema "${ESQUEMA}". Creado (lo que ya existía no se toca):`, resumen)
  } catch (err) {
    await cliente.query('ROLLBACK')
    throw err
  } finally {
    cliente.release()
  }
} finally {
  await pool.end()
}
