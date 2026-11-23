import { useState } from 'react'
import { proponerSlug } from '../../logic/admin.js'
import { T } from '../../textos.js'
import { BLOC_PER_DEFECTE } from '../../logic/blocs.js'

// Formulario de curso o asignatura (tipo: 'curso' | 'asignatura'). Al crear
// se pide además la adreça (slug), que se propone a partir del nombre hasta
// que se edita a mano; después queda fija. La sombra la calcula el servidor.
export default function FormEstructura({ tipo, inicial = {}, creando = false, onDesa, onCancela }) {
  const esCurso = tipo === 'curso'
  const [nombre, setNombre] = useState(inicial.nombre ?? '')
  const [slug, setSlug] = useState(inicial.slug ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [icono, setIcono] = useState(inicial.icono ?? '')
  const [color, setColor] = useState(inicial.color ?? '#4fc3f7')
  const [nivel, setNivel] = useState(inicial.nivel ?? 'medio')
  const [majuscules, setMajuscules] = useState(inicial.config?.majuscules ?? false)
  const [celebracio, setCelebracio] = useState(inicial.config?.celebracio ?? false)
  const [bloc, setBloc] = useState(String(inicial.config?.bloc ?? BLOC_PER_DEFECTE))
  const [recordsCurs, setRecordsCurs] = useState(inicial.config?.recordsCurs ?? true)
  const [activo, setActivo] = useState(inicial.activo ?? false)
  const [errores, setErrores] = useState({})
  const [desant, setDesant] = useState(false)
  const [desat, setDesat] = useState(false)

  function cambiarNombre(valor) {
    setNombre(valor)
    if (creando && !slugManual) setSlug(proponerSlug(valor))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setDesant(true)
    setDesat(false)
    setErrores({})
    const datos = { nombre, icono, color, activo }
    if (creando) datos.slug = slug
    if (esCurso) Object.assign(datos, { nivel, config: { majuscules, celebracio, bloc: Number(bloc), recordsCurs } })
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
        <input value={nombre} onChange={(e) => cambiarNombre(e.target.value)} autoFocus={creando} />
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

      <div className="camps-fila">
        <label>
          {T.campIcona}
          <input value={icono} onChange={(e) => setIcono(e.target.value)} className="camp-icona" />
        </label>
        <label>
          {T.campColor}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="camp-color" />
        </label>
      </div>
      <p className="camp-ajuda">{T.ajudaIcona}</p>
      <Error camp="icono" />
      <Error camp="color" />

      {esCurso && (
        <>
          <fieldset className="camp-radios">
            <legend>{T.campNivell}</legend>
            {Object.entries(T.nivells).map(([valor, etiqueta]) => (
              <label key={valor}>
                <input type="radio" name="nivel" value={valor} checked={nivel === valor} onChange={() => setNivel(valor)} />
                {etiqueta}
              </label>
            ))}
          </fieldset>
          <p className="camp-ajuda">{T.ajudaNivell}</p>
          <label>
            {T.campBloc}
            <input type="number" min={5} max={100} value={bloc} onChange={(e) => setBloc(e.target.value)} className="camp-numero" />
          </label>
          <p className="camp-ajuda">{T.ajudaBlocCurs}</p>
          <Error camp="bloc" />
          <label className="camp-check">
            <input type="checkbox" checked={majuscules} onChange={(e) => setMajuscules(e.target.checked)} />
            {T.campMajuscules}
          </label>
          <label className="camp-check">
            <input type="checkbox" checked={celebracio} onChange={(e) => setCelebracio(e.target.checked)} />
            {T.campCelebracio}
          </label>
          <label className="camp-check">
            <input type="checkbox" checked={recordsCurs} onChange={(e) => setRecordsCurs(e.target.checked)} />
            {T.campRecordsCurs}
          </label>
        </>
      )}

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
