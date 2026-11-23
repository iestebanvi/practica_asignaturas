import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import AmbDades from '../components/AmbDades.jsx'
import NoTrobat from './NoTrobat.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso } from '../logic/api.js'
import { buscarAsignatura } from '../logic/cursos.js'
import { T } from '../textos.js'
import { useAlumne } from '../logic/alumne.js'
import { obtenerRecordsPropis, claveModo, recordsCursActius } from '../logic/records.js'

export default function Asignatura() {
  const { cursoId, asignaturaId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)
  // Con àlies, cada tarjeta de modo enseña su récord.
  const alumne = useAlumne(cursoId)
  const [records, setRecords] = useState({})
  useEffect(() => {
    if (!alumne) return setRecords({})
    obtenerRecordsPropis(cursoId).then(setRecords).catch(() => setRecords({}))
  }, [cursoId, alumne])

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
                <Targetes
                  items={asignatura.modos.map((modo) => {
                    const record = records[claveModo(asignatura.id, modo.id)]
                    return record ? { ...modo, detall: T.recordTargeta(record) } : modo
                  })}
                  rutaDe={(modo) => `/${curso.id}/${asignatura.id}/${modo.id}`}
                />
              </>
            )}
            <nav className="accions">
              {recordsCursActius(curso) && (
                <Link to={`/${curso.id}/records#${asignatura.id}`} className="enllac-secundari">
                  {T.recordsCurs}
                </Link>
              )}
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
