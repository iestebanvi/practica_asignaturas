import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { proponerSlug, obtenerParametres } from '../../logic/admin.js'
import { GRUPOS_TIPOS, NOMBRES_FORMATOS, formatosRequeridos, nombreTipo } from '../../logic/tiposEjercicio.js'
import { T } from '../../textos.js'
import CampsParams, { paramsPerDesar } from './CampsParams.jsx'
import { BLOC_PER_DEFECTE } from '../../logic/blocs.js'

// Formulario de modo: nombre, adreça (solo al crear), color, activo, tipos de
// ejercicio (casillas agrupadas) y, si algún tipo saca preguntas de un banco,
// el banco (solo los del formato que hace falta). El servidor valida todo.
export default function FormModo({ inicial = {}, creando = false, bancos, blocCurs = BLOC_PER_DEFECTE, onDesa, onCancela }) {
  const [nombre, setNombre] = useState(inicial.nombre ?? '')
  const [slug, setSlug] = useState(inicial.slug ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [color, setColor] = useState(inicial.color ?? '#4fc3f7')
  const [activo, setActivo] = useState(inicial.activo ?? false)
  const [tipos, setTipos] = useState(inicial.operaciones ?? [])
  const [bancoId, setBancoId] = useState(inicial.bancoId ?? null)
  const [bloc, setBloc] = useState(inicial.bloc ? String(inicial.bloc) : '')
  const [params, setParams] = useState(inicial.params ?? {})
  // Definición de los parámetros de dificultad (del servidor; se pide una vez).
  const [specs, setSpecs] = useState(null)
  useEffect(() => {
    obtenerParametres().then(setSpecs).catch(() => setSpecs({}))
  }, [])
  const [errores, setErrores] = useState({})
  const [desant, setDesant] = useState(false)
  const [desat, setDesat] = useState(false)

  const formatos = formatosRequeridos(tipos)
  const formato = formatos.length === 1 ? formatos[0] : null
  const bancosCompatibles = formato ? bancos.filter((b) => b.formato === formato) : []

  function alternarTipo(tipo) {
    setTipos((ts) => (ts.includes(tipo) ? ts.filter((t) => t !== tipo) : [...ts, tipo]))
    setDesat(false)
  }

  async function enviar(evento) {
    evento.preventDefault()
    setDesant(true)
    setDesat(false)
    setErrores({})
    const datos = { nombre, color, activo, operaciones: tipos, bancoId: formato ? bancoId : null, bloc: bloc === '' ? null : Number(bloc), params: paramsPerDesar(tipos, params, specs ?? {}) }
    if (creando) datos.slug = slug
    try {
      await onDesa(datos)
      if (!creando) setDesat(true)
    } catch (err) {
      setErrores(err.codigo === 'validacio' ? err.datos.camps : { general: T.errorDesar })
    } finally {
      setDesant(false)
    }
  }

  const Error = ({ camp }) =>
    errores[camp] ? (
      <p className="camp-error" role="alert">
        {errores[camp]}
      </p>
    ) : null

  return (
    <form noValidate className="form-pregunta form-estructura" onSubmit={enviar} onChange={() => setDesat(false)}>
      <label>
        {T.campNom}
        <input
          value={nombre}
          autoFocus={creando}
          onChange={(e) => {
            setNombre(e.target.value)
            if (creando && !slugManual) setSlug(proponerSlug(e.target.value))
          }}
        />
      </label>
      <Error camp="nombre" />

      {creando && (
        <>
          <label>
            {T.campAdreca}
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManual(true)
              }}
            />
          </label>
          <p className="camp-ajuda">{T.ajudaAdreca}</p>
          <Error camp="slug" />
        </>
      )}

      <label>
        {T.campColor}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="camp-color" />
      </label>
      <Error camp="color" />

      <fieldset className="camp-tipus">
        <legend>{T.campTipus}</legend>
        <p className="camp-ajuda">{T.ajudaTipus}</p>
        {GRUPOS_TIPOS.map((grup) => (
          <div key={grup.nombre} className="grup-tipus">
            <p className="grup-tipus-nom">{grup.nombre}</p>
            {grup.tipos.map((tipo) => (
              <label key={tipo} className="camp-check">
                <input type="checkbox" checked={tipos.includes(tipo)} onChange={() => alternarTipo(tipo)} />
                {nombreTipo(tipo)}
              </label>
            ))}
          </div>
        ))}
      </fieldset>
      {formatos.length > 1 && <p className="camp-avis">{T.avisBarrejaFormats}</p>}
      <Error camp="operaciones" />

      <CampsParams
        specs={specs}
        tipos={tipos}
        valores={params}
        onCanvi={(p) => {
          setParams(p)
          setDesat(false)
        }}
      />
      <Error camp="params" />

      {formato && (
        <>
          <label>
            {T.campBanc}
            <select value={bancoId ?? ''} onChange={(e) => setBancoId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{T.triaBanc}</option>
              {bancosCompatibles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} ({T.preguntesActives(b.preguntasActivas, b.preguntas)})
                </option>
              ))}
            </select>
          </label>
          <p className="camp-ajuda">
            {T.ajudaBanc(NOMBRES_FORMATOS[formato])} <Link to="/profesorat/consola/banc/nou">{T.nouBanc}</Link>
          </p>
          <Error camp="bancoId" />
        </>
      )}

      <label>
        {T.campBlocMode}
        <input
          type="number"
          min={5}
          max={100}
          value={bloc}
          placeholder={String(blocCurs)}
          onChange={(e) => setBloc(e.target.value)}
          className="camp-numero"
        />
      </label>
      <p className="camp-ajuda">{T.ajudaBlocMode(blocCurs)}</p>
      <Error camp="bloc" />

      <label className="camp-check">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        {T.campActiu}
      </label>

      <Error camp="general" />
      <div className="form-botons">
        <button type="submit" disabled={desant}>
          {desant ? T.desant : creando ? T.crea : T.desa}
        </button>
        {onCancela && (
          <button type="button" className="boto-secundari" onClick={onCancela} disabled={desant}>
            {T.cancela}
          </button>
        )}
        {desat && (
          <span className="avis-desat" role="status">
            {T.desat}
          </span>
        )}
      </div>
    </form>
  )
}
