// Deja el esquema de los e2e (DB_SCHEMA, p.ej. "e2e") recién creado y con la
// copia del contenido (backend/datos/contenido.json). Lo ejecuta Playwright
// antes de arrancar el backend de los e2e: así los tests de los editores
// pueden crear, cambiar y borrar sin tocar los datos reales ("public").
import 'dotenv/config'
import { pool, ESQUEMA } from '../src/db/cliente.js'
import { ejecutarMigraciones } from '../src/db/migrar.js'
import { sembrar } from '../src/db/sembrar.js'
import { leerContenido } from './contenido.js'

// Bancos solo para los tests de edición de la consola: no los usa ningún modo,
// así que crear, cambiar o borrar sus preguntas no afecta a los tests de
// alumnos, que corren en paralelo.
export const BANCOS_E2E = [
  {
    slug: 'e2e-traduccio',
    nombre: 'E2E traducció',
    formato: 'traduccio',
    preguntas: [
      { orden: 1, enunciado: 'HOUSE', respuesta: 'casa' },
      { orden: 2, enunciado: 'TREE', respuesta: 'arbre' },
    ],
  },
  {
    slug: 'e2e-numerica',
    nombre: 'E2E numèrica',
    formato: 'numerica',
    preguntas: [{ orden: 1, enunciado: 'Quant fan 6 × 9?', respuesta: '54' }],
  },
  {
    slug: 'e2e-opcions',
    nombre: 'E2E opcions',
    formato: 'opcio_multiple',
    preguntas: [{ orden: 1, enunciado: 'There ___ a castle.', opciones: ['is', 'are'], respuesta: 'is' }],
  },
]

if (ESQUEMA === 'public') {
  console.error('preparar-e2e se niega a tocar el esquema "public" (los datos reales). Usa DB_SCHEMA=e2e.')
  process.exit(1)
}

try {
  await pool.query(`DROP SCHEMA IF EXISTS ${ESQUEMA} CASCADE`)
  await ejecutarMigraciones()
  const cliente = await pool.connect()
  try {
    const contenido = leerContenido()
    await sembrar(cliente, { cursos: contenido.cursos, bancos: [...contenido.bancos, ...BANCOS_E2E] })
  } finally {
    cliente.release()
  }
  console.log(`Esquema "${ESQUEMA}" preparado para los e2e`)
} finally {
  await pool.end()
}
