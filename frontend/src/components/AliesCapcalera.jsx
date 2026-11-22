import { useState } from 'react'
import { useAlumne, salir } from '../logic/alumne.js'
import { T } from '../textos.js'
import DialegAlies from './DialegAlies.jsx'

// En la cabecera de las pantallas de un curso: "Entra amb el teu àlies" o
// "Hola, Nil! · Surt".
export default function AliesCapcalera({ curso }) {
  const alumne = useAlumne(curso)
  const [obert, setObert] = useState(false)

  if (alumne === undefined) return null

  return (
    <div className="alies-capcalera">
      {alumne ? (
        <>
          <span className="alies-hola">{T.hola(alumne.alies)}</span>
          <button className="boto-petit boto-secundari" onClick={() => salir(curso).catch(() => {})}>
            {T.surt}
          </button>
        </>
      ) : (
        <button className="boto-petit" onClick={() => setObert(true)}>
          {T.entraAlies}
        </button>
      )}
      {obert && <DialegAlies curso={curso} onTanca={() => setObert(false)} />}
    </div>
  )
}
