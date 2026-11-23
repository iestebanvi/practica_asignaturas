import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearBanco, proponerSlug } from '../../logic/admin.js'
import { NOMBRES_FORMATOS } from '../../logic/tiposEjercicio.js'
import { T } from '../../textos.js'

// "+ Nou banc": nombre, identificador (propuesto a partir del nombre) y
// formato (fijo después). Se crea vacío.
export default function NouBanc({ onCanvi }) {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [formato, setFormato] = useState('')
  const [errores, setErrores] = useState({})
  const [desant, setDesant] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setDesant(true)
    setErrores({})
    try {
      const banco = await crearBanco({ nombre, slug, formato })
      await onCanvi()
      navigate(`/profesorat/consola/banc/${banco.id}`)
    } catch (err) {
      setErrores(err.codigo === 'validacio' ? err.datos.camps : { general: T.errorDesar })
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
    <article className="fitxa">
      <h2>{T.nouBancTitol}</h2>
      <form noValidate className="form-pregunta form-estructura" onSubmit={enviar}>
        <label>
          {T.campNom}
          <input
            value={nombre}
            autoFocus
            onChange={(e) => {
              setNombre(e.target.value)
              if (!slugManual) setSlug(proponerSlug(e.target.value))
            }}
          />
        </label>
        <Error camp="nombre" />
        <label>
          {T.campIdentificador}
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManual(true)
            }}
          />
        </label>
        <p className="camp-ajuda">{T.ajudaIdentificador}</p>
        <Error camp="slug" />
        <fieldset className="camp-radios">
          <legend>{T.campFormat}</legend>
          {Object.entries(NOMBRES_FORMATOS).map(([valor, etiqueta]) => (
            <label key={valor}>
              <input type="radio" name="formato" checked={formato === valor} onChange={() => setFormato(valor)} />
              {etiqueta}
            </label>
          ))}
        </fieldset>
        <p className="camp-ajuda">{T.ajudaFormat}</p>
        <Error camp="formato" />
        <Error camp="general" />
        <div className="form-botons">
          <button type="submit" disabled={desant}>
            {desant ? T.desant : T.crea}
          </button>
          <button type="button" className="boto-secundari" onClick={() => navigate('/profesorat/consola')}>
            {T.cancela}
          </button>
        </div>
      </form>
    </article>
  )
}
