import { useState } from 'react'
import { obtenerFallos, vaciarFallos } from '../logic/fallos.js'
import { PERFILES } from '../logic/perfiles.js'

export default function ParaRepasar({ perfilId, onVolver }) {
  const [fallos, setFallos] = useState(() => obtenerFallos(perfilId))
  const esPeque = perfilId === 'pequeno'

  function vaciar() {
    vaciarFallos(perfilId)
    setFallos([])
  }

  return (
    <div className={`pantalla repasar${esPeque ? ' peque' : ''}`}>
      <h1>Para repasar</h1>
      <p className="subtitulo">{PERFILES[perfilId]?.nombre}</p>

      {fallos.length === 0 ? (
        <p>¡Todavía no has fallado nada! Sigue así 🎉</p>
      ) : (
        <>
          <p>Esto es lo que más te cuesta:</p>
          <ul className="lista-repasar">
            {fallos.map((f) => (
              <li key={`${f.tipo}-${f.enunciado}`}>
                <span className="repasar-enunciado">{f.enunciado}</span>
                <span className="repasar-respuesta">{f.respuesta}</span>
                <span className="repasar-veces">×{f.veces}</span>
              </li>
            ))}
          </ul>
          <button className="boton-vaciar" onClick={vaciar}>
            Vaciar lista
          </button>
        </>
      )}

      <button className="finalizar" onClick={onVolver}>
        ← Volver
      </button>
    </div>
  )
}
