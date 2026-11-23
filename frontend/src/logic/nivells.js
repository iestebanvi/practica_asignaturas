// Niveles de un modo. El nivel 1 es el propio modo (sus tipos y su
// dificultad); "modo.nivells" trae los niveles 2 y 3. En la API pública solo
// llegan los abiertos, ya numerados ({ nivell, operaciones, params }); en la
// consola llegan todos, con "obert".

// [{ nivell, operaciones, params }] de los niveles que se pueden jugar (con
// tambeTancats, también los cerrados: vista previa).
export function nivellsDe(modo, { tambeTancats = false } = {}) {
  const extra = (modo.nivells ?? [])
    .map((n, i) => ({ ...n, nivell: n.nivell ?? i + 2 }))
    .filter((n) => tambeTancats || n.obert !== false)
    .map(({ nivell, operaciones, params }) => ({ nivell, operaciones, params }))
  return [{ nivell: 1, operaciones: modo.operaciones, params: modo.params }, ...extra]
}

// El nivel que se juega si no se pide otro: el más alto de los abiertos.
export const nivellPerDefecte = (nivells) => nivells.at(-1).nivell

// El nivel pedido (p. ej. "?nivell=2") si existe; si no, el de por defecto.
export function triarNivell(nivells, demanat) {
  const n = Number(demanat)
  return nivells.some((x) => x.nivell === n) ? n : nivellPerDefecte(nivells)
}

// El modo tal como se juega en ese nivel: sus tipos y su dificultad.
export function modoDelNivell(modo, nivells, nivell) {
  const { operaciones, params } = nivells.find((x) => x.nivell === nivell) ?? nivells[0]
  return { ...modo, operaciones, params }
}
