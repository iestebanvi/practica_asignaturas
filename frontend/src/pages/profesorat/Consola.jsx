import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Pagina from '../../components/Pagina.jsx'
import { comprobarSesion, cerrarSesion, obtenerContenidoAdmin } from '../../logic/admin.js'
import { T } from '../../textos.js'
import ArbreConsola from './ArbreConsola.jsx'
import FitxaMode from './FitxaMode.jsx'
import FitxaBanc from './FitxaBanc.jsx'

// Consola del profesorado: comprueba la sesión, carga todo el contenido
// (también lo inactivo) y lo muestra con el árbol a la izquierda y la ficha
// elegida a la derecha. Sin sesión (o caducada) vuelve al login.
export default function Consola() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ estado: 'carregant' })

  const carregar = useCallback(async () => {
    setEstado({ estado: 'carregant' })
    try {
      const sesion = await comprobarSesion()
      if (!sesion) return setEstado({ estado: 'sense-sessio' })
      const contenido = await obtenerContenidoAdmin()
      setEstado({ estado: 'ok', sesion, contenido })
    } catch (err) {
      setEstado({ estado: err.codigo === 'sessio_requerida' ? 'sense-sessio' : 'error' })
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Tras editar algo: vuelve a pedir el contenido (contadores del menú) sin
  // pasar por "Carregant…".
  const refrescar = useCallback(async () => {
    try {
      const contenido = await obtenerContenidoAdmin()
      setEstado((e) => (e.estado === 'ok' ? { ...e, contenido } : e))
    } catch (err) {
      if (err.codigo === 'sessio_requerida') setEstado({ estado: 'sense-sessio' })
    }
  }, [])

  // Al elegir algo en el menú, subir: en móvil la ficha queda por encima del
  // árbol y, si no, no se vería el cambio.
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  async function salir() {
    await cerrarSesion().catch(() => {})
    navigate('/profesorat', { replace: true })
  }

  if (estado.estado === 'sense-sessio') return <Navigate to="/profesorat" replace />

  return (
    <Pagina molles={[{ nom: T.inici, to: '/' }, { nom: T.consola }]} className="consola">
      <div className="consola-capcalera">
        <h1>{T.consola}</h1>
        {estado.estado === 'ok' && (
          <button className="boto-secundari" onClick={salir}>
            {T.tancaSessio}
          </button>
        )}
      </div>

      {estado.estado === 'carregant' && <p>{T.carregant}</p>}
      {estado.estado === 'error' && (
        <div className="practica-avis">
          <p>{T.errorCarrega}</p>
          <button onClick={carregar}>{T.reintenta}</button>
        </div>
      )}
      {estado.estado === 'ok' && (
        <>
          <p className="consola-sessio">{T.sessioFins(estado.sesion.caducaEn)}</p>
          <div className="consola-cos">
            <ArbreConsola contenido={estado.contenido} />
            <section className="consola-fitxa">
              <Routes>
                <Route index element={<ResumConsola contenido={estado.contenido} />} />
                <Route path="mode/:id" element={<FitxaMode contenido={estado.contenido} />} />
                <Route path="banc/:id" element={<FitxaBanc onCanvi={refrescar} />} />
                <Route path="*" element={<Navigate to="/profesorat/consola" replace />} />
              </Routes>
            </section>
          </div>
        </>
      )}
    </Pagina>
  )
}

function ResumConsola({ contenido }) {
  const modos = contenido.cursos.flatMap((c) => c.asignaturas.flatMap((a) => a.modos))
  const preguntas = contenido.bancos.reduce((n, b) => n + b.preguntas, 0)
  return (
    <div className="fitxa">
      <p className="fitxa-resum">
        {T.resumConsola(contenido.cursos.length, modos.length, contenido.bancos.length, preguntas)}
      </p>
      <p>{T.triaAlMenu}</p>
      <p className="consola-avis">{T.consolaProperament}</p>
    </div>
  )
}
