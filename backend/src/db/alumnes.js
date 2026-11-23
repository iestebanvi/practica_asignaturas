import { createHash, randomBytes } from 'node:crypto'
import { pool } from './cliente.js'
import { normalizarAlies, generarPin, hashPin } from '../validacion/alies.js'
import { BLOC_PER_DEFECTE } from '../validacion/estructura.js'

export const DURACION_SESION_ALUMNE_MS = 365 * 24 * 60 * 60 * 1000

const hash = (token) => createHash('sha256').update(token).digest('hex')

// Solo cursos activos: en uno inactivo los alumnos no pueden entrar.
export async function cursoActivo(slug) {
  const { rows } = await pool.query('SELECT id::int FROM cursos WHERE slug = $1 AND activo', [slug])
  return rows[0] ?? null
}

export async function buscarAlumne(cursoId, alies) {
  const { rows } = await pool.query(
    'SELECT id::int, alies, pin_hash FROM alumnes WHERE curso_id = $1 AND alies_normalitzat = $2',
    [cursoId, normalizarAlies(alies)],
  )
  return rows[0] ?? null
}

// Crea el àlies con un PIN nuevo. Devuelve { alumne, pin } (el PIN en claro
// solo sale aquí, para enseñarlo una vez) o null si el àlies ya existe.
export async function crearAlumne(cursoId, alies) {
  const pin = generarPin()
  try {
    const { rows } = await pool.query(
      `INSERT INTO alumnes (curso_id, alies, alies_normalitzat, pin_hash)
       VALUES ($1, $2, $3, $4) RETURNING id::int, alies`,
      [cursoId, alies, normalizarAlies(alies), hashPin(pin)],
    )
    return { alumne: rows[0], pin }
  } catch (err) {
    if (err.code === '23505') return null
    throw err
  }
}

export async function crearSesionAlumne(alumneId) {
  const token = randomBytes(32).toString('base64url')
  const caducaEn = new Date(Date.now() + DURACION_SESION_ALUMNE_MS)
  await pool.query('DELETE FROM sesiones_alumnes WHERE caduca_en < now()')
  await pool.query('INSERT INTO sesiones_alumnes (token_hash, alumne_id, caduca_en) VALUES ($1, $2, $3)', [
    hash(token),
    alumneId,
    caducaEn,
  ])
  await pool.query('UPDATE alumnes SET ultim_acces = now() WHERE id = $1', [alumneId])
  return { token, caducaEn }
}

// El alumno de esa sesión, solo si es del curso indicado y no ha caducado.
export async function alumneDeSesion(token, cursoId) {
  if (!token) return null
  const { rows } = await pool.query(
    `SELECT a.id::int, a.alies FROM sesiones_alumnes s JOIN alumnes a ON a.id = s.alumne_id
      WHERE s.token_hash = $1 AND s.caduca_en > now() AND a.curso_id = $2`,
    [hash(token), cursoId],
  )
  return rows[0] ?? null
}

export async function borrarSesionAlumne(token) {
  if (token) await pool.query('DELETE FROM sesiones_alumnes WHERE token_hash = $1', [hash(token)])
}

// ---- Consola del profesorado ----

export async function listarAlumnes(cursoId) {
  const { rows } = await pool.query(
    `SELECT id::int, alies, creat_en AS "creatEn", ultim_acces AS "ultimAcces"
       FROM alumnes WHERE curso_id = $1 ORDER BY alies_normalitzat`,
    [cursoId],
  )
  return rows
}

// Las tres devuelven null si el alumno no existe.
export async function renombrarAlumne(id, alies) {
  try {
    const { rows } = await pool.query(
      'UPDATE alumnes SET alies = $2, alies_normalitzat = $3 WHERE id = $1 RETURNING id::int, alies',
      [id, alies, normalizarAlies(alies)],
    )
    return rows.length ? { alumne: rows[0] } : null
  } catch (err) {
    if (err.code === '23505') return { repetido: true }
    throw err
  }
}

// PIN nuevo: además cierra sus sesiones abiertas (por si lo usa otro).
export async function nuevoPinAlumne(id) {
  const pin = generarPin()
  const { rowCount } = await pool.query('UPDATE alumnes SET pin_hash = $2 WHERE id = $1', [id, hashPin(pin)])
  if (!rowCount) return null
  await pool.query('DELETE FROM sesiones_alumnes WHERE alumne_id = $1', [id])
  return { pin }
}

export async function borrarAlumne(id) {
  const { rowCount } = await pool.query('DELETE FROM alumnes WHERE id = $1', [id])
  return rowCount ? {} : null
}

// ---- Bloques ----

// Modo jugable (todo activo) de un curso, con el tamaño de bloque que le toca
// y sus niveles 2 y 3 (nivells).
export async function modoConBloc(cursoId, asignaturaSlug, modoSlug) {
  const { rows } = await pool.query(
    `SELECT m.id::int, COALESCE(m.bloc, (c.config->>'bloc')::int, $4)::int AS bloc, m.nivells
       FROM modos m JOIN asignaturas a ON a.id = m.asignatura_id JOIN cursos c ON c.id = a.curso_id
      WHERE c.id = $1 AND a.slug = $2 AND m.slug = $3 AND c.activo AND a.activo AND m.activo`,
    [cursoId, asignaturaSlug, modoSlug, BLOC_PER_DEFECTE],
  )
  return rows[0] ?? null
}

// Guarda un bloque y dice si es nuevo récord (más puntos que cualquier bloque
// anterior de ese alumno en ese modo y nivel; el primero siempre lo es).
// Devuelve también el mejor bloque.
export async function guardarBloc(alumneId, modoId, { puntos, aciertos, preguntas, nivell = 1 }) {
  const { rows: antes } = await pool.query(
    'SELECT max(puntos)::int AS max FROM blocs WHERE alumne_id = $1 AND modo_id = $2 AND nivell = $3',
    [alumneId, modoId, nivell],
  )
  await pool.query(
    'INSERT INTO blocs (alumne_id, modo_id, puntos, aciertos, preguntas, nivell) VALUES ($1, $2, $3, $4, $5, $6)',
    [alumneId, modoId, puntos, aciertos, preguntas, nivell],
  )
  const { rows: millor } = await pool.query(
    `SELECT puntos, aciertos, preguntas FROM blocs WHERE alumne_id = $1 AND modo_id = $2 AND nivell = $3
      ORDER BY puntos DESC, aciertos DESC, creat_en ASC LIMIT 1`,
    [alumneId, modoId, nivell],
  )
  return { nouRecord: antes[0].max === null || puntos > antes[0].max, millor: millor[0] }
}
