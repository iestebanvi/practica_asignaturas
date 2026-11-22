import { useState } from 'react'
import { T } from '../../textos.js'

// Puja / Baixa / Esborra de un curso o asignatura. Borrar solo está
// disponible si está vacío (si no, se explica por qué) y pide confirmación.
export default function AccionsElement({ nombre, primero, ultimo, vacio, textoEsborra, textoNoBuit, onMou, onEsborra }) {
  const [confirmant, setConfirmant] = useState(false)
  const [error, setError] = useState(null)

  async function fer(fn) {
    setError(null)
    try {
      await fn()
    } catch {
      setError(T.errorDesar)
    }
  }

  return (
    <div className="accions-element">
      <button className="boto-petit boto-secundari" disabled={primero} onClick={() => fer(() => onMou('amunt'))}>
        {T.puja}
      </button>
      <button className="boto-petit boto-secundari" disabled={ultimo} onClick={() => fer(() => onMou('avall'))}>
        {T.baixa}
      </button>
      {confirmant ? (
        <>
          <span>{T.segurEsborrarElement(nombre)}</span>
          <button className="boto-petit boto-perill" onClick={() => fer(onEsborra)}>
            {T.siEsborra}
          </button>
          <button className="boto-petit boto-secundari" onClick={() => setConfirmant(false)}>
            {T.no}
          </button>
        </>
      ) : (
        <button
          className="boto-petit boto-perill"
          disabled={!vacio}
          title={vacio ? undefined : textoNoBuit}
          onClick={() => setConfirmant(true)}
        >
          {textoEsborra}
        </button>
      )}
      {!vacio && <span className="camp-ajuda">{textoNoBuit}</span>}
      {error && (
        <p className="camp-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
