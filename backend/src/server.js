import 'dotenv/config'
import { crearApp } from './app.js'
import { ejecutarMigraciones } from './db/migrar.js'

const port = process.env.PORT || 3000

// Sin BD la web no tiene contenido: si las migraciones fallan (BD caída,
// DATABASE_URL mal puesta...), mejor no arrancar y que se vea en los logs.
try {
  await ejecutarMigraciones()
} catch (err) {
  console.error('No se ha podido preparar la base de datos:', err.message)
  process.exit(1)
}

crearApp().listen(port, () => {
  console.log(`practica_asignaturas escuchando en el puerto ${port}`)
})
