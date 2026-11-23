import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import AmbDades from '../components/AmbDades.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso } from '../logic/api.js'
import { obtenerFallos, vaciarFallos } from '../logic/fallos.js'
import { useAlumne } from '../logic/alumne.js'
import { T } from '../textos.js'

// "Per repassar": lo que más ha fallado el alumno identificado en este curso.
// Sin àlies no hay lista (se invita a entrar con uno).
export default function ParaRepasar() {
  const { cursoId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)
  const alumne = useAlumne(cursoId)
  const [fallos, setFallos] = useState(null) // null: cargando
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!alumne) return setFallos(null)
    setError(false)
    obtenerFallos(cursoId)
      .then(setFallos)
      .catch(() => setError(true))
  }, [cursoId, alumne])

  async function vaciar() {
    try {
      await vaciarFallos(cursoId)
      setFallos([])
    } catch {
      setError(true)
    }
  }

  return (
    <AmbDades resultado={resultado}>
      {(curso) => (
        <Pagina
          curso={curso}
          molles={[{ nom: T.inici, to: '/' }, { nom: curso.nombre, to: `/${curso.id}` }, { nom: T.repassarTitol }]}
          className="repasar"
        >
          <h1>{T.repassarTitol}</h1>
          {alumne === null && <p>{T.repassarSenseAlies}</p>}
          {alumne && error && <p>{T.errorCarrega}</p>}
          {alumne && !error && fallos === null && <p>{T.carregant}</p>}
          {alumne && !error && fallos?.length === 0 && <p>{T.repassarBuit}</p>}
          {alumne && !error && fallos?.length > 0 && (
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
      )}
    </AmbDades>
  )
}
