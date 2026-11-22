import Pagina from './Pagina.jsx'
import NoTrobat from '../pages/NoTrobat.jsx'
import { T } from '../textos.js'

// Muestra "Carregant…", el error (con reintento) o "no trobat" según el
// estado de una carga de useApi; cuando hay datos, pinta children(datos).
export default function AmbDades({ resultado, children }) {
  if (resultado.estado === 'ok') return children(resultado.datos)
  if (resultado.estado === 'no-trobat') return <NoTrobat />

  return (
    <Pagina>
      <div className="practica-avis" aria-live="polite">
        {resultado.estado === 'error' ? (
          <>
            <p>{T.errorCarrega}</p>
            <button onClick={resultado.reintentar}>{T.reintenta}</button>
          </>
        ) : (
          <p>{T.carregant}</p>
        )}
      </div>
    </Pagina>
  )
}
