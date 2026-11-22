import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { comprobarAlies, crearAlies, entrar } from '../logic/alumne.js'
import { T } from '../textos.js'

// Entrar con un àlies, en pasos: àlies → (existe) PIN | (nuevo) "¿lo creas?"
// → PIN generado, que se enseña UNA vez. Esc o "Tanca" cierran sin entrar.
// Se pinta en <body> (portal): dentro de la cabecera, su backdrop-filter haría
// que el fondo "fixed" quedara encerrado en ella en vez de cubrir la pantalla.
export default function DialegAlies({ curso, onTanca }) {
  const [pas, setPas] = useState('alies') // 'alies' | 'pin' | 'nou' | 'pin-nou'
  const [alies, setAlies] = useState('')
  const [pin, setPin] = useState('')
  const [pinNou, setPinNou] = useState(null)
  const [error, setError] = useState(null)
  const [ocupat, setOcupat] = useState(false)
  const primerCamp = useRef(null)

  useEffect(() => {
    primerCamp.current?.focus()
  }, [pas])

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && pas !== 'pin-nou' && onTanca()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onTanca, pas])

  function mensaje(err) {
    if (err.codigo === 'alies_no_valid') return err.datos.missatge
    if (err.codigo === 'massa_intents') return T.massaIntentsAlies(err.datos.reintentarEnSegons)
    return T.errorsAlies[err.codigo] ?? T.errorsAlies.altre
  }

  async function fer(fn) {
    setOcupat(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(mensaje(err))
    } finally {
      setOcupat(false)
    }
  }

  const continua = (e) => {
    e.preventDefault()
    fer(async () => {
      const r = await comprobarAlies(curso, alies)
      setAlies(r.alies)
      setPas(r.existeix ? 'pin' : 'nou')
    })
  }

  const entraAmbPin = (e) => {
    e.preventDefault()
    fer(async () => {
      await entrar(curso, alies, pin)
      onTanca()
    })
  }

  const crea = () =>
    fer(async () => {
      const r = await crearAlies(curso, alies)
      setPinNou(r.pin)
      setPas('pin-nou')
    })

  return createPortal(
    <div className="dialeg-fons">
      <div className="dialeg" role="dialog" aria-modal="true" aria-labelledby="dialeg-alies-titol">
        <h2 id="dialeg-alies-titol">{T.aliesTitol}</h2>

        {pas === 'alies' && (
          <form onSubmit={continua}>
            <p className="camp-ajuda">{T.aliesAjuda}</p>
            <label className="camp-bloc">
              {T.campAlies}
              <input ref={primerCamp} value={alies} onChange={(e) => setAlies(e.target.value)} maxLength={20} autoComplete="off" />
            </label>
            {error && <p className="camp-error" role="alert">{error}</p>}
            <div className="form-botons">
              <button type="submit" disabled={ocupat || !alies.trim()}>{T.continua}</button>
              <button type="button" className="boto-secundari" onClick={onTanca}>{T.tanca}</button>
            </div>
          </form>
        )}

        {pas === 'pin' && (
          <form onSubmit={entraAmbPin}>
            <p>{T.hola2(alies)}</p>
            <label className="camp-bloc">
              {T.campPin}
              <input
                ref={primerCamp}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="off"
                className="camp-pin"
              />
            </label>
            {error && <p className="camp-error" role="alert">{error}</p>}
            <div className="form-botons">
              <button type="submit" disabled={ocupat || pin.length !== 4}>{T.entra}</button>
              <button type="button" className="boto-secundari" onClick={() => { setPas('alies'); setPin(''); setError(null) }}>
                {T.noTorna}
              </button>
            </div>
          </form>
        )}

        {pas === 'nou' && (
          <div>
            <p>{T.aliesNou(alies)}</p>
            {error && <p className="camp-error" role="alert">{error}</p>}
            <div className="form-botons">
              <button ref={primerCamp} onClick={crea} disabled={ocupat}>{T.siCrea}</button>
              <button className="boto-secundari" onClick={() => { setPas('alies'); setError(null) }}>{T.noTorna}</button>
            </div>
          </div>
        )}

        {pas === 'pin-nou' && (
          <div>
            <p>{T.elTeuPin}</p>
            <p className="pin-gran" aria-label={`${T.elTeuPin} ${pinNou.split('').join(' ')}`}>{pinNou}</p>
            <p>{T.apuntaPin}</p>
            <div className="form-botons">
              <button ref={primerCamp} onClick={onTanca}>{T.jaApuntat}</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
