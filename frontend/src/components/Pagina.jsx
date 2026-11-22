import { Link } from 'react-router-dom'
import { T } from '../textos.js'
import AliesCapcalera from './AliesCapcalera.jsx'

// Estructura común de todas las pantallas: cabecera fija con la marca y el
// camino de navegación (cada miga con "to" es un enlace; la última, la página
// actual, no) y el contenido a todo el ancho. El estilo del curso (mayúsculas
// en 1r) se aplica aquí, para que llegue también a la cabecera.
// senseAlies: no mostrar "Entra amb el teu àlies" (vista previa de la consola).
export default function Pagina({ curso, molles = [], className = '', senseAlies = false, children }) {
  const clases = ['app', curso?.config.majuscules ? 'peque' : ''].filter(Boolean).join(' ')

  return (
    <div className={clases}>
      <header className="capcalera">
        <Link to="/" className="marca">
          📚 {T.marca}
        </Link>
        {molles.length > 0 && (
          <nav className="molles" aria-label={T.molles}>
            {molles.map((miga, i) =>
              miga.to ? (
                <Link key={i} to={miga.to}>
                  {miga.nom}
                </Link>
              ) : (
                <span key={i} aria-current="page">
                  {miga.nom}
                </span>
              ),
            )}
          </nav>
        )}
        {curso && !senseAlies && <AliesCapcalera curso={curso.id} />}
      </header>
      <main className={`pantalla ${className}`.trim()}>{children}</main>
    </div>
  )
}
