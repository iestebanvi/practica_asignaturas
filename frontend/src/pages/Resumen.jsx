import { Link } from 'react-router-dom'
import { T } from '../textos.js'

export default function Resumen({ resumen, curso, asignatura, onTornarAJugar }) {
  const { puntos, aciertos, fallos } = resumen

  return (
    <div className="resumen">
      <h1>{T.resum}</h1>
      <p className="puntos-totales">{T.puntsTotals(puntos)}</p>
      <p className="detalle">{T.detallResum(aciertos, fallos)}</p>
      <p className="mensaje">{T.missatge(puntos)}</p>
      <div className="resum-botons">
        <button onClick={onTornarAJugar}>{T.tornaAJugar}</button>
        <Link to={`/${curso.id}/${asignatura.id}`} className="boto-enllac">
          {T.altreExercici}
        </Link>
      </div>
      <nav className="accions">
        <Link to={`/${curso.id}/repassar`} className="enllac-secundari">
          {T.perRepassar}
        </Link>
      </nav>
    </div>
  )
}
