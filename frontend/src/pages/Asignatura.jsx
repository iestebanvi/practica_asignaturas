import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import AmbDades from '../components/AmbDades.jsx'
import NoTrobat from './NoTrobat.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso } from '../logic/api.js'
import { buscarAsignatura } from '../logic/cursos.js'
import { T } from '../textos.js'

export default function Asignatura() {
  const { cursoId, asignaturaId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)

  return (
    <AmbDades resultado={resultado}>
      {(curso) => {
        const asignatura = buscarAsignatura(curso, asignaturaId)
        if (!asignatura) return <NoTrobat />

        const molles = [
          { nom: T.inici, to: '/' },
          { nom: curso.nombre, to: `/${curso.id}` },
          { nom: asignatura.nombre },
        ]

        return (
          <Pagina curso={curso} molles={molles} className="assignatura">
            {asignatura.modos.length === 0 ? (
              <p className="practica-avis">{T.assignaturaBuida}</p>
            ) : (
              <>
                <h1>{T.triaMode}</h1>
                <Targetes items={asignatura.modos} rutaDe={(modo) => `/${curso.id}/${asignatura.id}/${modo.id}`} />
              </>
            )}
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
      }}
    </AmbDades>
  )
}
