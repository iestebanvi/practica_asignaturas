import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import AmbDades from '../components/AmbDades.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso } from '../logic/api.js'
import { obtenerFallos, vaciarFallos } from '../logic/fallos.js'
import { T } from '../textos.js'

export default function ParaRepasar() {
  const { cursoId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)
  const [fallos, setFallos] = useState(() => obtenerFallos(cursoId))

  function vaciar() {
    vaciarFallos(cursoId)
    setFallos([])
  }

  return (
    <AmbDades resultado={resultado}>
      {(curso) => <Llista curso={curso} fallos={fallos} onVaciar={vaciar} />}
    </AmbDades>
  )
}

function Llista({ curso, fallos, onVaciar }) {

  const molles = [{ nom: T.inici, to: '/' }, { nom: curso.nombre, to: `/${curso.id}` }, { nom: T.repassarTitol }]

  return (
    <Pagina curso={curso} molles={molles} className="repasar">
      <h1>{T.repassarTitol}</h1>

      {fallos.length === 0 ? (
        <p>{T.repassarBuit}</p>
      ) : (
        <>
          <p>{T.repassarIntro}</p>
          <ul className="lista-repasar">
            {fallos.map((f) => (
              <li key={`${f.tipo}-${f.enunciado}`}>
                <span className="repasar-enunciado">{f.enunciado}</span>
                <span className="repasar-respuesta">{f.respuesta}</span>
                <span className="repasar-veces">×{f.veces}</span>
              </li>
            ))}
          </ul>
          <button className="boton-vaciar" onClick={onVaciar}>
            {T.buidaLlista}
          </button>
        </>
      )}

      <nav className="accions">
        <Link to={`/${curso.id}`} className="enllac-secundari">
          {T.torna}
        </Link>
      </nav>
    </Pagina>
  )
}
