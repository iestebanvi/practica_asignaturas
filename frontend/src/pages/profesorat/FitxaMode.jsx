import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarEstructura, borrarEstructura, moverEstructura } from '../../logic/admin.js'
import { T } from '../../textos.js'
import FormModo from './FormModo.jsx'
import AccionsElement from './AccionsElement.jsx'

const RUTA = '/profesorat/consola'

// Ficha editable de un modo (buscado en el contenido ya cargado).
export default function FitxaMode({ contenido, onCanvi }) {
  const navigate = useNavigate()
  const id = Number(useParams().id)
  let trobat = null
  for (const curso of contenido.cursos) {
    for (const asignatura of curso.asignaturas) {
      const i = asignatura.modos.findIndex((m) => m.id === id)
      if (i >= 0) trobat = { curso, asignatura, modo: asignatura.modos[i], i }
    }
  }
  if (!trobat) return <p>{T.modeNoTrobat}</p>

  const { curso, asignatura, modo, i } = trobat
  const ruta = `/${curso.slug}/${asignatura.slug}/${modo.slug}`
  const visible = curso.activo && asignatura.activo && modo.activo
  const banco = contenido.bancos.find((b) => b.id === modo.bancoId)

  async function desa(datos) {
    await actualizarEstructura('modo', modo.id, datos)
    await onCanvi()
  }

  async function mou(direccio) {
    await moverEstructura('modo', modo.id, direccio)
    await onCanvi()
  }

  async function esborra() {
    await borrarEstructura('modo', modo.id)
    await onCanvi()
    navigate(`${RUTA}/assignatura/${asignatura.id}`, { replace: true })
  }

  return (
    <article className="fitxa">
      <p className="fitxa-cami">
        <Link to={`${RUTA}/curs/${curso.id}`}>{curso.nombre}</Link> ›{' '}
        <Link to={`${RUTA}/assignatura/${asignatura.id}`}>{asignatura.nombre}</Link>
      </p>
      <div className="fitxa-capcalera">
        <h2>{modo.nombre}</h2>
        <AccionsElement
          nombre={modo.nombre}
          primero={i === 0}
          ultimo={i === asignatura.modos.length - 1}
          vacio
          textoEsborra={T.esborraMode}
          textoNoBuit=""
          onMou={mou}
          onEsborra={esborra}
        />
      </div>
      <p className="fitxa-cami">
        {T.adreca}: <code>{ruta}</code> {T.adrecaFixa}{' '}
        {visible && (
          <a href={ruta} target="_blank" rel="noreferrer">
            {T.obreWeb}
          </a>
        )}
      </p>
      {banco && (
        <p className="fitxa-cami">
          {T.banc}: <Link to={`${RUTA}/banc/${banco.id}`}>{banco.nombre}</Link> (
          {T.preguntesActives(banco.preguntasActivas, banco.preguntas)})
        </p>
      )}
      <p className="camp-ajuda">{T.ajudaEsborraMode}</p>

      <FormModo key={modo.id} inicial={modo} bancos={contenido.bancos} onDesa={desa} />
    </article>
  )
}
