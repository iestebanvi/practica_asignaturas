import pg from 'pg'

// Esquema donde viven las tablas: "public" en la web; los tests usan otro
// ("test") para no tocar los datos reales (dev y prod comparten Supabase).
export const ESQUEMA = process.env.DB_SCHEMA || 'public'

if (!/^[a-z_][a-z0-9_]*$/.test(ESQUEMA)) {
  throw new Error(`DB_SCHEMA no válido: ${ESQUEMA}`)
}

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL (ver backend/.env.example)')
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige TLS siempre (también desde local).
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Cada conexión arranca ya apuntando al esquema (el Session pooler de
  // Supabase respeta este parámetro de inicio).
  options: `-c search_path=${ESQUEMA}`,
})

// Un error en una conexión inactiva (p.ej. Supabase la corta) no debe tumbar
// el proceso: el pool la descarta y abre otra cuando haga falta.
pool.on('error', (err) => {
  console.error('Error en una conexión inactiva de la BD:', err.message)
})
