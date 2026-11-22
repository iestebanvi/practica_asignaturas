import { randomInt, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

const MIN = 2
const MAX = 20
// Letras (con acentos), números, espacios y . _ -
const PERMITIDOS = /^[\p{L}\p{N} ._-]+$/u

// Para comparar àlies: "Nil", "nil" y " NÍL " son el mismo.
export function normalizarAlies(alies) {
  return alies
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Devuelve { alies } (limpio) o { error } en catalán.
export function validarAlies(valor) {
  const alies = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : ''
  if (alies.length < MIN) return { error: `L'àlies ha de tenir almenys ${MIN} lletres.` }
  if (alies.length > MAX) return { error: `L'àlies pot tenir com a màxim ${MAX} caràcters.` }
  if (!PERMITIDOS.test(alies)) return { error: "L'àlies només pot tenir lletres, números, espais i . _ -" }
  return { alies }
}

export function generarPin() {
  return String(randomInt(0, 10000)).padStart(4, '0')
}

// "sal:hash" con scrypt; la comparación, en tiempo constante.
export function hashPin(pin) {
  const sal = randomBytes(16).toString('hex')
  return `${sal}:${scryptSync(pin, sal, 32).toString('hex')}`
}

export function pinCorrecto(pin, guardado) {
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return false
  const [sal, hash] = guardado.split(':')
  return timingSafeEqual(scryptSync(pin, sal, 32), Buffer.from(hash, 'hex'))
}
