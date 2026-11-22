import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerBancoAdmin } from '../../logic/admin.js'
import { NOMBRES_FORMATOS } from '../../logic/tiposEjercicio.js'
import { T } from '../../textos.js'

// Ficha (solo lectura) de un banco con todas sus preguntas, también las
// inactivas (en gris).
export default function FitxaBanc() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ estado: 'carregant' })

  useEffect(() => {
    let vigente = true
    setEstado({ estado: 'carregant' })
    obtenerBancoAdmin(id)
      .then((banco) => vigente && setEstado({ estado: 'ok', banco }))
      .catch((err) => vigente && setEstado({ estado: err.codigo === 'banc_no_trobat' ? 'no-trobat' : 'error' }))
    return () => {
      vigente = false
    }
  }, [id])

  if (estado.estado === 'carregant') return <p>{T.carregant}</p>
  if (estado.estado === 'no-trobat') return <p>{T.bancNoTrobat}</p>
  if (estado.estado === 'error') return <p>{T.errorCarrega}</p>

  const { banco } = estado
  const activas = banco.preguntas.filter((p) => p.activo).length
  const ambOpcions = banco.formato === 'opcio_multiple'

  return (
    <article className="fitxa">
      <h2>{banco.nombre}</h2>
      <dl className="fitxa-dades">
        <dt>{T.formatBanc}</dt>
        <dd>{NOMBRES_FORMATOS[banco.formato] ?? banco.formato}</dd>
        <dt>{T.preguntes}</dt>
        <dd>{T.preguntesActives(activas, banco.preguntas.length)}</dd>
        <dt>{T.usatPer}</dt>
        <dd>
          {banco.modos.length === 0
            ? T.capMode
            : banco.modos.map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <Link to={`/profesorat/consola/mode/${m.id}`}>
                    {m.curso} › {m.asignatura} › {m.nombre}
                  </Link>
                </span>
              ))}
        </dd>
      </dl>

      <div className="taula-desplacable">
        <table className="taula-preguntes">
          <thead>
            <tr>
              <th>#</th>
              <th>{T.enunciat}</th>
              <th>{T.resposta}</th>
              {ambOpcions && <th>{T.opcions}</th>}
              <th>{T.estat}</th>
            </tr>
          </thead>
          <tbody>
            {banco.preguntas.map((p) => (
              <tr key={p.id} className={p.activo ? '' : 'es-inactiu'}>
                <td>{p.orden}</td>
                <td>{p.enunciado}</td>
                <td>{p.respuesta}</td>
                {ambOpcions && <td>{(p.opciones ?? []).join(' · ')}</td>}
                <td>{p.activo ? T.activa : <span className="etiqueta-inactiu">{T.inactiva}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
