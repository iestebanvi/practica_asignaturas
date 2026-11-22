import { useEffect, useState } from 'react'

// Àlies del alumno identificado en cada curso (en este dispositivo). La
// sesión va en una cookie HttpOnly por curso; aquí solo se guarda en memoria
// lo que responde el servidor, y se avisa a los componentes que lo muestran.

export class ErrorAlumne extends Error {
  constructor(codigo, datos = {}) {
    super(codigo)
    this.codigo = codigo // 'alies_no_valid' | 'alies_existent' | 'alies_no_trobat' | 'pin_incorrecte' | 'massa_intents' | 'xarxa'…
    this.datos = datos
  }
}

async function peticion(url, datos) {
  let res
  try {
    res = await fetch(url, datos === undefined ? undefined : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })
  } catch {
    throw new ErrorAlumne('xarxa')
  }
  if (res.status === 204) return null
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ErrorAlumne(body.error ?? `http_${res.status}`, body)
  return body
}

const actuales = new Map() // curso -> { alies } | null
const oyentes = new Set()

function fijar(curso, alumne) {
  actuales.set(curso, alumne)
  for (const oyente of oyentes) oyente()
}

export async function comprobarAlies(curso, alies) {
  return peticion('/api/alumnes/comprova', { curs: curso, alies })
}

// Devuelve { alies, pin }: el PIN solo llega esta vez.
export async function crearAlies(curso, alies) {
  const r = await peticion('/api/alumnes/crea', { curs: curso, alies })
  fijar(curso, { alies: r.alies })
  return r
}

export async function entrar(curso, alies, pin) {
  const r = await peticion('/api/alumnes/entra', { curs: curso, alies, pin })
  fijar(curso, { alies: r.alies })
  return r
}

export async function salir(curso) {
  await peticion('/api/alumnes/surt', { curs: curso })
  fijar(curso, null)
}

async function cargar(curso) {
  try {
    const { alumne } = await peticion(`/api/alumnes/jo?curs=${encodeURIComponent(curso)}`)
    fijar(curso, alumne)
  } catch {
    // Si falla (red, curso inactivo…), se juega como siempre, sin àlies.
    fijar(curso, null)
  }
}

// Hook: el àlies identificado en ese curso ({ alies } | null), o undefined
// mientras se pregunta al servidor la primera vez.
export function useAlumne(curso) {
  const [, forzar] = useState(0)
  useEffect(() => {
    const oyente = () => forzar((n) => n + 1)
    oyentes.add(oyente)
    if (curso && !actuales.has(curso)) cargar(curso)
    return () => oyentes.delete(oyente)
  }, [curso])
  return curso ? actuales.get(curso) : null
}

// Solo para los tests.
export function olvidarTodo() {
  actuales.clear()
}
