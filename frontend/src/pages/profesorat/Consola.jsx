import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Pagina from '../../components/Pagina.jsx'
import { comprobarSesion, cerrarSesion } from '../../logic/admin.js'
import { T } from '../../textos.js'

// Esqueleto de la consola: comprueba la sesión al entrar (si no hay, o ha
// caducado, vuelve al login). Los editores llegan en la fase 5.
export default function Consola() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ estado: 'comprovant' })

  useEffect(() => {
    comprobarSesion()
      .then((sesion) => setEstado(sesion ? { estado: 'ok', sesion } : { estado: 'sense-sessio' }))
      .catch(() => setEstado({ estado: 'sense-sessio' }))
  }, [])

  async function salir() {
    await cerrarSesion().catch(() => {})
    navigate('/profesorat', { replace: true })
  }

  if (estado.estado === 'sense-sessio') return <Navigate to="/profesorat" replace />

  return (
    <Pagina molles={[{ nom: T.inici, to: '/' }, { nom: T.consola }]} className="consola">
      {estado.estado === 'comprovant' ? (
        <p>{T.carregant}</p>
      ) : (
        <>
          <div className="consola-capcalera">
            <h1>{T.consola}</h1>
            <button className="boto-secundari" onClick={salir}>
              {T.tancaSessio}
            </button>
          </div>
          <p className="consola-sessio">{T.sessioFins(estado.sesion.caducaEn)}</p>
          <p className="consola-avis">{T.consolaProperament}</p>
        </>
      )}
    </Pagina>
  )
}
