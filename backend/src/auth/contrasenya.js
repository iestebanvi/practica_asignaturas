import { createHash, timingSafeEqual } from 'node:crypto'

// Contraseña compartida del profesorado, en la variable TEACHER_PASSWD (en
// backend/.env y en Railway; nunca en el código). Se lee en cada petición, así
// que cambiarla no exige tocar nada más.
export function consolaActivada() {
  return Boolean(process.env.TEACHER_PASSWD)
}

// Comparación en tiempo constante: se comparan los hashes (misma longitud
// siempre) para que el tiempo de respuesta no dé pistas sobre la contraseña.
export function contrasenyaCorrecta(introducida) {
  const esperada = process.env.TEACHER_PASSWD
  if (!esperada || typeof introducida !== 'string') return false
  const a = createHash('sha256').update(introducida).digest()
  const b = createHash('sha256').update(esperada).digest()
  return timingSafeEqual(a, b)
}
