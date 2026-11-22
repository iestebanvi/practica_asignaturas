import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { obtenerBancoAdmin, crearPregunta, actualizarPregunta, borrarPregunta, urlCsvBanco } from '../../logic/admin.js'
import { NOMBRES_FORMATOS } from '../../logic/tiposEjercicio.js'
import { normalizarTexto } from '../../logic/common.js'
import { T } from '../../textos.js'
import FormPregunta from './FormPregunta.jsx'
import PanelImportar from './PanelImportar.jsx'

// Ficha de un banco con todas sus preguntas (también las inactivas, en gris):
// buscar, añadir, editar, activar/desactivar y borrar (con confirmación).
// onCanvi avisa a la consola para que actualice los contadores del menú.
export default function FitxaBanc({ onCanvi }) {
  const { id } = useParams()
  const [estado, setEstado] = useState({ estado: 'carregant' })
  const [cerca, setCerca] = useState('')
  const [editant, setEditant] = useState(null) // id de la pregunta, o 'nova'
  const [confirmant, setConfirmant] = useState(null) // id pendiente de borrar
  const [errorAccio, setErrorAccio] = useState(null)
  const [important, setImportant] = useState(false)
  const [avis, setAvis] = useState(null)

  useEffect(() => {
    let vigente = true
    setEstado({ estado: 'carregant' })
    setEditant(null)
    setConfirmant(null)
    setCerca('')
    setImportant(false)
    setAvis(null)
    obtenerBancoAdmin(id)
      .then((banco) => vigente && setEstado({ estado: 'ok', banco }))
      .catch((err) => vigente && setEstado({ estado: errorAEstado(err, 'banc_no_trobat') }))
    return () => {
      vigente = false
    }
  }, [id])

  if (estado.estado === 'carregant') return <p>{T.carregant}</p>
  if (estado.estado === 'sense-sessio') return <Navigate to="/profesorat" replace />
  if (estado.estado === 'no-trobat') return <p>{T.bancNoTrobat}</p>
  if (estado.estado === 'error') return <p>{T.errorCarrega}</p>

  const { banco } = estado
  const activas = banco.preguntas.filter((p) => p.activo).length
  const ambOpcions = banco.formato === 'opcio_multiple'
  const columnas = ambOpcions ? 6 : 5
  const filtro = normalizarTexto(cerca)
  const visibles = filtro
    ? banco.preguntas.filter((p) =>
        normalizarTexto([p.enunciado, p.respuesta, ...(p.opciones ?? [])].join(' ')).includes(filtro),
      )
    : banco.preguntas

  function cambiarPreguntas(transformar) {
    setEstado((e) => ({ ...e, banco: { ...e.banco, preguntas: transformar(e.banco.preguntas) } }))
    onCanvi?.()
  }

  // Acciones inmediatas (activar/borrar): si falla, se avisa encima de la tabla.
  async function accio(fn) {
    setErrorAccio(null)
    try {
      await fn()
    } catch (err) {
      if (err.codigo === 'sessio_requerida') return setEstado({ estado: 'sense-sessio' })
      setErrorAccio(T.errorDesar)
    }
  }

  // Tras importar, se vuelve a pedir el banco entero (pueden ser muchas).
  async function importat(n) {
    setImportant(false)
    setAvis(T.importades(n))
    const banco = await obtenerBancoAdmin(id)
    setEstado({ estado: 'ok', banco })
    onCanvi?.()
  }

  async function desaNova(datos) {
    const creada = await crearPregunta(banco.id, datos)
    cambiarPreguntas((ps) => [...ps, creada])
    setEditant(null)
  }

  async function desaEdicio(pregunta, datos) {
    const guardada = await actualizarPregunta(pregunta.id, datos)
    cambiarPreguntas((ps) => ps.map((p) => (p.id === guardada.id ? guardada : p)))
    setEditant(null)
  }

  const alternarActiva = (pregunta) =>
    accio(async () => {
      const guardada = await actualizarPregunta(pregunta.id, { activo: !pregunta.activo })
      cambiarPreguntas((ps) => ps.map((p) => (p.id === guardada.id ? guardada : p)))
    })

  const esborra = (pregunta) =>
    accio(async () => {
      await borrarPregunta(pregunta.id)
      cambiarPreguntas((ps) => ps.filter((p) => p.id !== pregunta.id))
      setConfirmant(null)
    })

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

      <div className="barra-banc">
        <input
          type="search"
          className="cerca"
          placeholder={T.cerca}
          aria-label={T.cerca}
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
        {editant !== 'nova' && (
          <button onClick={() => setEditant('nova')}>{T.afegeixPregunta}</button>
        )}
        {!important && (
          <button className="boto-secundari" onClick={() => { setImportant(true); setAvis(null) }}>
            {T.importa}
          </button>
        )}
        <a className="boto-enllac boto-secundari" href={urlCsvBanco(banco.id)} download>
          {T.descarregaCsv}
        </a>
      </div>

      {avis && (
        <p className="avis-ok" role="status">
          {avis}
        </p>
      )}

      {important && <PanelImportar banco={banco} onImportat={importat} onTanca={() => setImportant(false)} />}

      {editant === 'nova' && (
        <div className="pregunta-nova">
          <FormPregunta formato={banco.formato} onDesa={desaNova} onCancela={() => setEditant(null)} />
        </div>
      )}

      {errorAccio && (
        <p className="camp-error" role="alert">
          {errorAccio}
        </p>
      )}

      <div className="taula-desplacable">
        <table className="taula-preguntes">
          <thead>
            <tr>
              <th>#</th>
              <th>{T.enunciat}</th>
              <th>{T.resposta}</th>
              {ambOpcions && <th>{T.opcions}</th>}
              <th>{T.estat}</th>
              <th>{T.accions}</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={columnas}>{T.cap}</td>
              </tr>
            )}
            {visibles.map((p) =>
              editant === p.id ? (
                <tr key={p.id} className="fila-editant">
                  <td colSpan={columnas}>
                    <FormPregunta
                      formato={banco.formato}
                      inicial={p}
                      onDesa={(datos) => desaEdicio(p, datos)}
                      onCancela={() => setEditant(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className={p.activo ? '' : 'es-inactiu'}>
                  <td>{p.orden}</td>
                  <td>{p.enunciado}</td>
                  <td>{p.respuesta}</td>
                  {ambOpcions && <td>{(p.opciones ?? []).join(' · ')}</td>}
                  <td>{p.activo ? T.activa : <span className="etiqueta-inactiu">{T.inactiva}</span>}</td>
                  <td className="accions-fila">
                    {confirmant === p.id ? (
                      <>
                        <span>{T.segurEsborrar}</span>
                        <button className="boto-petit boto-perill" onClick={() => esborra(p)}>
                          {T.siEsborra}
                        </button>
                        <button className="boto-petit boto-secundari" onClick={() => setConfirmant(null)}>
                          {T.no}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="boto-petit" onClick={() => setEditant(p.id)}>
                          {T.edita}
                        </button>
                        <button className="boto-petit boto-secundari" onClick={() => alternarActiva(p)}>
                          {p.activo ? T.desactivar : T.activar}
                        </button>
                        <button className="boto-petit boto-perill" onClick={() => setConfirmant(p.id)}>
                          {T.esborra}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

function errorAEstado(err, codigoNoTrobat) {
  if (err.codigo === codigoNoTrobat) return 'no-trobat'
  if (err.codigo === 'sessio_requerida') return 'sense-sessio'
  return 'error'
}
