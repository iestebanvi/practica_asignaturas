import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import AmbDades from '../components/AmbDades.jsx'
import NoTrobat from './NoTrobat.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCurso, ErrorNoTrobat } from '../logic/api.js'
import { obtenerRecordsCurs, claveModo, recordsCursActius } from '../logic/records.js'
import { useAlumne } from '../logic/alumne.js'
import { estiloColor } from '../logic/cursos.js'
import { T } from '../textos.js'

// "🏆 Rècords del curs": para cada asignatura y modo, los 10 mejores àlies
// (su mejor bloque). El àlies propio se resalta. Cada modo tiene un ancla
// (#asignatura-modo) para enlazarlo desde el resumen de una partida.
export default function RecordsCurs() {
  const { cursoId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)
  const alumne = useAlumne(cursoId)
  const [records, setRecords] = useState(null) // null: cargando; 'desactivats'
  const { hash } = useLocation()

  useEffect(() => {
    obtenerRecordsCurs(cursoId)
      .then(setRecords)
      .catch((err) => setRecords(err instanceof ErrorNoTrobat ? 'desactivats' : {}))
  }, [cursoId])

  // Al llegar con un ancla, bajar hasta ese modo cuando ya está pintado.
  useEffect(() => {
    if (hash && records && records !== 'desactivats') document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash, records])

  return (
    <AmbDades resultado={resultado}>
      {(curso) => {
        if (!recordsCursActius(curso)) return <NoTrobat />
        const molles = [{ nom: T.inici, to: '/' }, { nom: curso.nombre, to: `/${curso.id}` }, { nom: T.recordsCursTitol }]
        return (
          <Pagina curso={curso} molles={molles} className="records">
            <h1>{T.recordsCurs}</h1>
            <p className="camp-ajuda">{T.ajudaRecordsCurs}</p>
            {records === null && <p>{T.carregant}</p>}
            {records === 'desactivats' && <p>{T.recordsDesactivats}</p>}
            {records &&
              records !== 'desactivats' &&
              curso.asignaturas.map((asignatura) => (
                <section key={asignatura.id} id={asignatura.id} className="records-assignatura">
                  <h2>
                    {asignatura.icono} {asignatura.nombre}
                  </h2>
                  <div className="records-modes">
                    {asignatura.modos.map((modo) => {
                      const llista = records[claveModo(asignatura.id, modo.id)] ?? []
                      return (
                        <article
                          key={modo.id}
                          id={`${asignatura.id}-${modo.id}`}
                          className="records-mode"
                          style={estiloColor(modo)}
                          aria-label={modo.nombre}
                        >
                          <h3>
                            <Link to={`/${curso.id}/${asignatura.id}/${modo.id}`}>{modo.nombre}</Link>
                          </h3>
                          {llista.length === 0 ? (
                            <p className="camp-ajuda">{T.capRecordMode}</p>
                          ) : (
                            <table className="taula-records">
                              <thead>
                                <tr>
                                  <th>{T.posicio}</th>
                                  <th>{T.alies}</th>
                                  <th>{T.punts}</th>
                                  <th>{T.encerts}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {llista.map((r) => {
                                  const meu = alumne && r.alies === alumne.alies
                                  return (
                                    <tr key={r.posicio} className={meu ? 'es-meu' : ''}>
                                      <td>{r.posicio === 1 ? '🥇' : r.posicio === 2 ? '🥈' : r.posicio === 3 ? '🥉' : r.posicio}</td>
                                      <td>
                                        {r.alies} {meu && T.tu}
                                      </td>
                                      <td>{r.puntos}</td>
                                      <td>
                                        {r.aciertos}/{r.preguntas}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            <nav className="accions">
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
