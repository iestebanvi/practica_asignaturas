import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import AmbDades from '../components/AmbDades.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso } from '../logic/api.js'
import { T } from '../textos.js'

export default function Curso() {
  const { cursoId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)

  return (
    <AmbDades resultado={resultado}>
      {(curso) => (
        <Pagina curso={curso} molles={[{ nom: T.inici, to: '/' }, { nom: curso.nombre }]} className="curs">
          {curso.asignaturas.length === 0 ? (
            <p className="practica-avis">{T.cursBuit}</p>
          ) : (
            <>
              <h1>{T.triaAssignatura}</h1>
              <Targetes items={curso.asignaturas} rutaDe={(a) => `/${curso.id}/${a.id}`} />
            </>
          )}
          <nav className="accions">
            <Link to={`/${curso.id}/repassar`} className="enllac-secundari">
              {T.perRepassar}
            </Link>
            <Link to="/" className="enllac-secundari">
              {T.torna}
            </Link>
          </nav>
        </Pagina>
      )}
    </AmbDades>
  )
}
