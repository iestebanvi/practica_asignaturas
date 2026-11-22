import { Link, useParams } from 'react-router-dom'
import { T } from '../../textos.js'
import { nombreTipo, NOMBRES_FORMATOS } from '../../logic/tiposEjercicio.js'

// Ficha (solo lectura) de un modo, buscado en el contenido ya cargado.
export default function FitxaMode({ contenido }) {
  const id = Number(useParams().id)
  let trobat = null
  for (const curso of contenido.cursos) {
    for (const asignatura of curso.asignaturas) {
      const modo = asignatura.modos.find((m) => m.id === id)
      if (modo) trobat = { curso, asignatura, modo }
    }
  }
  if (!trobat) return <p>{T.modeNoTrobat}</p>

  const { curso, asignatura, modo } = trobat
  const banco = contenido.bancos.find((b) => b.id === modo.bancoId)
  const ruta = `/${curso.slug}/${asignatura.slug}/${modo.slug}`
  const visible = curso.activo && asignatura.activo && modo.activo

  return (
    <article className="fitxa">
      <p className="fitxa-cami">
        {curso.nombre} › {asignatura.nombre}
      </p>
      <h2>{modo.nombre}</h2>
      <dl className="fitxa-dades">
        <dt>{T.adreca}</dt>
        <dd>
          <code>{ruta}</code>{' '}
          {visible && (
            <a href={ruta} target="_blank" rel="noreferrer">
              {T.obreWeb}
            </a>
          )}
        </dd>
        <dt>{T.estat}</dt>
        <dd>{modo.activo ? T.activa : <span className="etiqueta-inactiu">{T.inactiu}</span>}</dd>
        <dt>{T.color}</dt>
        <dd>
          <span className="mostra-color gran" style={{ background: modo.color }} aria-hidden="true" /> <code>{modo.color}</code>
        </dd>
        <dt>{T.tipusExercici}</dt>
        <dd>
          <ul className="llista-tipus">
            {modo.operaciones.map((op) => (
              <li key={op}>{nombreTipo(op)}</li>
            ))}
          </ul>
        </dd>
        <dt>{T.banc}</dt>
        <dd>
          {banco ? (
            <Link to={`/profesorat/consola/banc/${banco.id}`}>
              {banco.nombre} ({NOMBRES_FORMATOS[banco.formato]}, {T.preguntesActives(banco.preguntasActivas, banco.preguntas)})
            </Link>
          ) : (
            T.senseBanc
          )}
        </dd>
      </dl>
    </article>
  )
}
