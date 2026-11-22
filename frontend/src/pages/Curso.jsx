import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import NoTrobat from './NoTrobat.jsx'
import { obtenerCurso } from '../logic/cursos.js'
import { T } from '../textos.js'

export default function Curso() {
  const { cursoId } = useParams()
  const curso = obtenerCurso(cursoId)
  if (!curso) return <NoTrobat />

  return (
    <Pagina curso={curso} molles={[{ nom: T.inici, to: '/' }, { nom: curso.nombre }]} className="curs">
      <h1>{T.triaAssignatura}</h1>
      <Targetes items={Object.values(curso.asignaturas)} rutaDe={(a) => `/${curso.id}/${a.id}`} />
      <nav className="accions">
        <Link to={`/${curso.id}/repassar`} className="enllac-secundari">
          {T.perRepassar}
        </Link>
        <Link to="/" className="enllac-secundari">
          {T.torna}
        </Link>
      </nav>
    </Pagina>
  )
}
