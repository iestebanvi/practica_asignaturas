import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import NoTrobat from './NoTrobat.jsx'
import { obtenerCurso, obtenerAsignatura } from '../logic/cursos.js'
import { T } from '../textos.js'

export default function Asignatura() {
  const { cursoId, asignaturaId } = useParams()
  const curso = obtenerCurso(cursoId)
  const asignatura = obtenerAsignatura(cursoId, asignaturaId)
  if (!asignatura) return <NoTrobat />

  const molles = [
    { nom: T.inici, to: '/' },
    { nom: curso.nombre, to: `/${curso.id}` },
    { nom: asignatura.nombre },
  ]

  return (
    <Pagina curso={curso} molles={molles} className="assignatura">
      <h1>{T.triaMode}</h1>
      <Targetes
        items={Object.values(asignatura.modos)}
        rutaDe={(modo) => `/${curso.id}/${asignatura.id}/${modo.id}`}
      />
      <nav className="accions">
        <Link to={`/${curso.id}/repassar`} className="enllac-secundari">
          {T.perRepassar}
        </Link>
        <Link to={`/${curso.id}`} className="enllac-secundari">
          {T.torna}
        </Link>
      </nav>
    </Pagina>
  )
}
