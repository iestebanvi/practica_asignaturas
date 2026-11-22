import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarEstructura, borrarEstructura, moverEstructura, crearAsignatura, crearCurso } from '../../logic/admin.js'
import { T } from '../../textos.js'
import FormEstructura from './FormEstructura.jsx'
import AccionsElement from './AccionsElement.jsx'

const RUTA = '/profesorat/consola'

// Ficha editable de un curso, con sus asignaturas (y "+ Nova assignatura").
export default function FitxaCurs({ contenido, onCanvi }) {
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const [creantAssignatura, setCreantAssignatura] = useState(false)
  const i = contenido.cursos.findIndex((c) => c.id === id)
  const curso = contenido.cursos[i]
  if (!curso) return <p>{T.cursNoTrobat}</p>

  const sinAsignaturasActivas = curso.activo && !curso.asignaturas.some((a) => a.activo)

  async function desa(datos) {
    await actualizarEstructura('curso', curso.id, datos)
    await onCanvi()
  }

  async function mou(direccio) {
    await moverEstructura('curso', curso.id, direccio)
    await onCanvi()
  }

  async function esborra() {
    await borrarEstructura('curso', curso.id)
    await onCanvi()
    navigate(RUTA, { replace: true })
  }

  async function creaAssignatura(datos) {
    const nueva = await crearAsignatura(curso.id, datos)
    await onCanvi()
    navigate(`${RUTA}/assignatura/${nueva.id}`)
  }

  return (
    <article className="fitxa" key={curso.id}>
      <div className="fitxa-capcalera">
        <h2>
          {curso.icono} {curso.nombre}
        </h2>
        <AccionsElement
          nombre={curso.nombre}
          primero={i === 0}
          ultimo={i === contenido.cursos.length - 1}
          vacio={curso.asignaturas.length === 0}
          textoEsborra={T.esborraCurs}
          textoNoBuit={T.noBuitCurs}
          onMou={mou}
          onEsborra={esborra}
        />
      </div>
      <p className="fitxa-cami">
        {T.adreca}: <code>/{curso.slug}</code> {T.adrecaFixa}{' '}
        {curso.activo && (
          <a href={`/${curso.slug}`} target="_blank" rel="noreferrer">
            {T.obreWeb}
          </a>
        )}
      </p>
      {sinAsignaturasActivas && <p className="camp-avis">{T.avisCursSenseAssignatures}</p>}

      <FormEstructura key={curso.id} tipo="curso" inicial={curso} onDesa={desa} />

      <h3>{T.assignatures}</h3>
      {curso.asignaturas.length === 0 ? (
        <p>{T.capAssignatura}</p>
      ) : (
        <ul className="llista-fills">
          {curso.asignaturas.map((a) => (
            <li key={a.id} className={a.activo ? '' : 'es-inactiu'}>
              <Link to={`${RUTA}/assignatura/${a.id}`}>
                {a.icono} {a.nombre}
              </Link>{' '}
              <span className="compte">{T.modesCompte(a.modos.length)}</span>{' '}
              {!a.activo && <span className="etiqueta-inactiu">{T.inactiu}</span>}
            </li>
          ))}
        </ul>
      )}
      {creantAssignatura ? (
        <div className="pregunta-nova">
          <h3>{T.novaAssignaturaTitol}</h3>
          <FormEstructura tipo="asignatura" creando onDesa={creaAssignatura} onCancela={() => setCreantAssignatura(false)} />
        </div>
      ) : (
        <button onClick={() => setCreantAssignatura(true)}>{T.novaAssignatura}</button>
      )}
    </article>
  )
}

// Pantalla "+ Nou curs".
export function NouCurs({ onCanvi }) {
  const navigate = useNavigate()

  async function crea(datos) {
    const nuevo = await crearCurso(datos)
    await onCanvi()
    navigate(`${RUTA}/curs/${nuevo.id}`)
  }

  return (
    <article className="fitxa">
      <h2>{T.nouCursTitol}</h2>
      <FormEstructura tipo="curso" creando onDesa={crea} onCancela={() => navigate(RUTA)} />
    </article>
  )
}
