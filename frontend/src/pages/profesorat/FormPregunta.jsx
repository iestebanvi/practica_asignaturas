import { useState } from 'react'
import { T } from '../../textos.js'

const MIN_OPCIONES = 2
const MAX_OPCIONES = 6

// Formulario de una pregunta, según el formato del banco. En opción múltiple
// la correcta se marca con el círculo (no se escribe aparte), así no puede
// no coincidir con ninguna opción. Los errores por campo los da el servidor.
export default function FormPregunta({ formato, inicial, onDesa, onCancela }) {
  const multiple = formato === 'opcio_multiple'
  const [enunciado, setEnunciado] = useState(inicial?.enunciado ?? '')
  const [respuesta, setRespuesta] = useState(inicial?.respuesta ?? '')
  const [opciones, setOpciones] = useState(() => {
    const base = inicial?.opciones ?? ['', '', '', '']
    return base.length >= MIN_OPCIONES ? base : [...base, ...Array(MIN_OPCIONES - base.length).fill('')]
  })
  const [correcta, setCorrecta] = useState(() => Math.max(0, (inicial?.opciones ?? []).indexOf(inicial?.respuesta)))
  const [errores, setErrores] = useState({})
  const [desant, setDesant] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setDesant(true)
    setErrores({})
    const datos = multiple ? { enunciado, opciones, respuesta: opciones[correcta] ?? '' } : { enunciado, respuesta }
    try {
      await onDesa(datos)
    } catch (err) {
      setErrores(err.codigo === 'validacio' ? err.datos.camps : { general: T.errorDesar })
      setDesant(false)
    }
  }

  function cambiarOpcion(i, valor) {
    setOpciones((ops) => ops.map((o, j) => (j === i ? valor : o)))
  }

  function quitarOpcion(i) {
    setOpciones((ops) => ops.filter((_, j) => j !== i))
    setCorrecta((c) => (c === i ? 0 : c > i ? c - 1 : c))
  }

  const Error = ({ camp }) =>
    errores[camp] ? (
      <p className="camp-error" role="alert">
        {errores[camp]}
      </p>
    ) : null

  return (
    <form noValidate className="form-pregunta" onSubmit={enviar}>
      <label>
        {T.campEnunciat[formato]}
        {formato === 'traduccio' ? (
          <input value={enunciado} onChange={(e) => setEnunciado(e.target.value)} autoFocus />
        ) : (
          <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} rows={3} autoFocus />
        )}
      </label>
      <Error camp="enunciado" />

      {multiple ? (
        <fieldset>
          <legend>{T.opcions}</legend>
          <p className="camp-ajuda">{T.opcionsAjuda}</p>
          {opciones.map((opcion, i) => (
            <div key={i} className="opcio-fila">
              <input
                type="radio"
                name="correcta"
                checked={correcta === i}
                onChange={() => setCorrecta(i)}
                aria-label={T.esCorrecta(i + 1)}
              />
              <input value={opcion} onChange={(e) => cambiarOpcion(i, e.target.value)} aria-label={T.opcio(i + 1)} />
              {opciones.length > MIN_OPCIONES && (
                <button type="button" className="boto-petit" onClick={() => quitarOpcion(i)} aria-label={T.treuOpcio(i + 1)}>
                  −
                </button>
              )}
            </div>
          ))}
          {opciones.length < MAX_OPCIONES && (
            <button type="button" className="boto-petit" onClick={() => setOpciones((ops) => [...ops, ''])}>
              {T.afegeixOpcio}
            </button>
          )}
          <Error camp="opciones" />
          <Error camp="respuesta" />
        </fieldset>
      ) : (
        <>
          <label>
            {T.campResposta[formato]}
            <input
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              inputMode={formato === 'numerica' ? 'decimal' : undefined}
            />
          </label>
          {formato === 'traduccio' && <p className="camp-ajuda">{T.ajudaSinonims}</p>}
          {formato === 'traduccio' && (enunciado.includes('/') || respuesta.includes('/')) && (
            <p className="camp-avis">{T.avisBarra}</p>
          )}
          <Error camp="respuesta" />
        </>
      )}

      <Error camp="general" />
      <div className="form-botons">
        <button type="submit" disabled={desant}>
          {desant ? T.desant : T.desa}
        </button>
        <button type="button" className="boto-secundari" onClick={onCancela} disabled={desant}>
          {T.cancela}
        </button>
      </div>
    </form>
  )
}
