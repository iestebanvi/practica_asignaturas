import { Link, NavLink } from 'react-router-dom'
import { T } from '../../textos.js'

const RUTA = '/profesorat/consola'

function Inactiu({ activo }) {
  return activo ? null : <span className="etiqueta-inactiu">{T.inactiu}</span>
}

// Menú lateral: cursos → assignatures → modes, i els bancs de preguntes.
// Lo inactivo se muestra igualmente, en gris y marcado.
export default function ArbreConsola({ contenido }) {
  return (
    <nav className="arbre-consola" aria-label="Contingut">
      <Link to={`${RUTA}/curs/nou`} className="boto-enllac boto-petit">
        {T.nouCurs}
      </Link>
      {contenido.cursos.map((curso) => (
        <section key={curso.id} className={curso.activo ? '' : 'es-inactiu'}>
          <h2>
            <NavLink to={`${RUTA}/curs/${curso.id}`} end>
              {curso.icono} {curso.nombre} <Inactiu activo={curso.activo} />
            </NavLink>
          </h2>
          {curso.asignaturas.map((asig) => (
            <div key={asig.id} className={`arbre-assignatura${asig.activo ? '' : ' es-inactiu'}`}>
              <h3>
                <NavLink to={`${RUTA}/assignatura/${asig.id}`}>
                  {asig.icono} {asig.nombre} <Inactiu activo={asig.activo} />
                </NavLink>
              </h3>
              <ul>
                {asig.modos.map((modo) => (
                  <li key={modo.id} className={modo.activo ? '' : 'es-inactiu'}>
                    <NavLink to={`${RUTA}/mode/${modo.id}`}>
                      <span className="mostra-color" style={{ background: modo.color }} aria-hidden="true" />
                      {modo.nombre} <Inactiu activo={modo.activo} />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <section>
        <h2>🗂️ {T.bancs}</h2>
        <ul>
          {contenido.bancos.map((banco) => (
            <li key={banco.id}>
              <NavLink to={`${RUTA}/banc/${banco.id}`}>
                {banco.nombre}{' '}
                <span className="compte" title={T.preguntesActives(banco.preguntasActivas, banco.preguntas)}>
                  {banco.preguntasActivas}/{banco.preguntas}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </section>
    </nav>
  )
}
