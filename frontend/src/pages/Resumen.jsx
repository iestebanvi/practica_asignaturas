import { Link } from 'react-router-dom'
import { T } from '../textos.js'

// rutaAltre: adónde lleva "Tria un altre exercici". rutaRepassar: enlace a
// "Per repassar" (null en la vista previa, que no apunta fallos).
export default function Resumen({ resumen, rutaAltre, rutaRepassar, onTornarAJugar }) {
  const { puntos, aciertos, fallos } = resumen

  return (
    <div className="resumen">
      <h1>{T.resum}</h1>
      <p className="puntos-totales">{T.puntsTotals(puntos)}</p>
      <p className="detalle">{T.detallResum(aciertos, fallos)}</p>
      <p className="mensaje">{T.missatge(puntos)}</p>
      <div className="resum-botons">
        <button onClick={onTornarAJugar}>{T.tornaAJugar}</button>
        <Link to={rutaAltre} className="boto-enllac">
          {T.altreExercici}
        </Link>
      </div>
      {rutaRepassar && (
        <nav className="accions">
          <Link to={rutaRepassar} className="enllac-secundari">
            {T.perRepassar}
          </Link>
        </nav>
      )}
    </div>
  )
}
