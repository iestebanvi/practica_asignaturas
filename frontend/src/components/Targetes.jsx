import { Link } from 'react-router-dom'
import { estiloColor } from '../logic/cursos.js'

// Rejilla de tarjetas grandes (cursos, asignaturas o modos): se reparten en
// tantas columnas como quepan, de 1 en un móvil a 5-6 en una pantalla grande.
export default function Targetes({ items, rutaDe }) {
  return (
    <div className="targetes">
      {items.map((item) => (
        <Link key={item.id} to={rutaDe(item)} className="targeta" style={estiloColor(item)}>
          {item.icono && (
            <span className="targeta-icona" aria-hidden="true">
              {item.icono}
            </span>
          )}
          <span className="targeta-nom">{item.nombre}</span>
        </Link>
      ))}
    </div>
  )
}
