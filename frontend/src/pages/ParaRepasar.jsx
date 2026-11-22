import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import NoTrobat from './NoTrobat.jsx'
import { obtenerFallos, vaciarFallos } from '../logic/fallos.js'
import { obtenerCurso } from '../logic/cursos.js'
import { T } from '../textos.js'

export default function ParaRepasar() {
  const { cursoId } = useParams()
  const curso = obtenerCurso(cursoId)
  const [fallos, setFallos] = useState(() => (curso ? obtenerFallos(curso.id) : []))
  if (!curso) return <NoTrobat />

  function vaciar() {
    vaciarFallos(curso.id)
    setFallos([])
  }

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
          <button className="boton-vaciar" onClick={vaciar}>
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
