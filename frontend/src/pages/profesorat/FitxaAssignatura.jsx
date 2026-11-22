import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarEstructura, borrarEstructura, moverEstructura, crearModo } from '../../logic/admin.js'
import { T } from '../../textos.js'
import FormEstructura from './FormEstructura.jsx'
import AccionsElement from './AccionsElement.jsx'
import FormModo from './FormModo.jsx'

const RUTA = '/profesorat/consola'

// Ficha editable de una asignatura, con la lista de sus modos.
export default function FitxaAssignatura({ contenido, onCanvi }) {
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const [creantMode, setCreantMode] = useState(false)
  const curso = contenido.cursos.find((c) => c.asignaturas.some((a) => a.id === id))
  if (!curso) return <p>{T.assignaturaNoTrobada}</p>
  const i = curso.asignaturas.findIndex((a) => a.id === id)
  const asignatura = curso.asignaturas[i]
  const sinModosActivos = asignatura.activo && !asignatura.modos.some((m) => m.activo)
  const visible = curso.activo && asignatura.activo

  async function desa(datos) {
    await actualizarEstructura('asignatura', asignatura.id, datos)
    await onCanvi()
  }

  async function mou(direccio) {
    await moverEstructura('asignatura', asignatura.id, direccio)
    await onCanvi()
  }

  async function creaMode(datos) {
    const nuevo = await crearModo(asignatura.id, datos)
    await onCanvi()
    navigate(`${RUTA}/mode/${nuevo.id}`)
  }

  async function esborra() {
    await borrarEstructura('asignatura', asignatura.id)
    await onCanvi()
    navigate(`${RUTA}/curs/${curso.id}`, { replace: true })
  }

  return (
    <article className="fitxa">
      <p className="fitxa-cami">
        <Link to={`${RUTA}/curs/${curso.id}`}>{curso.nombre}</Link>
      </p>
      <div className="fitxa-capcalera">
        <h2>
          {asignatura.icono} {asignatura.nombre}
        </h2>
        <AccionsElement
          nombre={asignatura.nombre}
          primero={i === 0}
          ultimo={i === curso.asignaturas.length - 1}
          vacio={asignatura.modos.length === 0}
          textoEsborra={T.esborraAssignatura}
          textoNoBuit={T.noBuitAssignatura}
          onMou={mou}
          onEsborra={esborra}
        />
      </div>
      <p className="fitxa-cami">
        {T.adreca}: <code>/{curso.slug}/{asignatura.slug}</code> {T.adrecaFixa}{' '}
        {visible && (
          <a href={`/${curso.slug}/${asignatura.slug}`} target="_blank" rel="noreferrer">
            {T.obreWeb}
          </a>
        )}
      </p>
      {sinModosActivos && <p className="camp-avis">{T.avisAssignaturaSenseModes}</p>}

      <FormEstructura key={asignatura.id} tipo="asignatura" inicial={asignatura} onDesa={desa} />

      <h3>{T.modes}</h3>
      {asignatura.modos.length === 0 ? (
        <p>{T.capModeAssignatura}</p>
      ) : (
        <ul className="llista-fills">
          {asignatura.modos.map((m) => (
            <li key={m.id} className={m.activo ? '' : 'es-inactiu'}>
              <Link to={`${RUTA}/mode/${m.id}`}>{m.nombre}</Link>{' '}
              {!m.activo && <span className="etiqueta-inactiu">{T.inactiu}</span>}
            </li>
          ))}
        </ul>
      )}
      {creantMode ? (
        <div className="pregunta-nova">
          <h3>{T.nouModeTitol}</h3>
          <FormModo creando bancos={contenido.bancos} onDesa={creaMode} onCancela={() => setCreantMode(false)} />
        </div>
      ) : (
        <button onClick={() => setCreantMode(true)}>{T.nouMode}</button>
      )}
    </article>
  )
}
