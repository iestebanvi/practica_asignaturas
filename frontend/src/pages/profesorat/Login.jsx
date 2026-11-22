import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagina from '../../components/Pagina.jsx'
import { iniciarSesion, comprobarSesion } from '../../logic/admin.js'
import { T } from '../../textos.js'

export const RUTA_CONSOLA = '/profesorat/consola'

function mensajeError(err) {
  if (err.codigo === 'massa_intents') return T.errorLogin.massa_intents(err.datos.reintentarEnSegons)
  return T.errorLogin[err.codigo] ?? T.errorLogin.altre
}

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión, directo a la consola.
  useEffect(() => {
    comprobarSesion()
      .then((sesion) => sesion && navigate(RUTA_CONSOLA, { replace: true }))
      .catch(() => {})
  }, [navigate])

  async function enviar(evento) {
    evento.preventDefault()
    if (!password || enviando) return
    setEnviando(true)
    setError(null)
    try {
      await iniciarSesion(password)
      navigate(RUTA_CONSOLA, { replace: true })
    } catch (err) {
      setError(mensajeError(err))
      setPassword('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina molles={[{ nom: T.inici, to: '/' }, { nom: T.professorat }]} className="login">
      <form className="login-targeta" onSubmit={enviar}>
        <h1>🔒 {T.consola}</h1>
        <label htmlFor="password">{T.contrasenya}</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={enviando}
        />
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={enviando || !password}>
          {enviando ? T.entrant : T.entra}
        </button>
      </form>
    </Pagina>
  )
}
